import requests
from django.conf import settings
from django.contrib.auth.models import User
from django.db import transaction
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
import uuid
import datetime
from typing import Optional
from .models import UserProfile, GuestIdentity, GuestLink, AnalysisUsage, UserTier
from .serializers import LineLoginSerializer


class IdentificationMixin:
    """
    Mixin to identify the current guest or user.
    """
    def get_guest(self, request) -> Optional[GuestIdentity]:
        # 1. If user is logged in, try to find linked guest
        if request.user.is_authenticated:
            link = GuestLink.objects.filter(user=request.user).order_by('-linked_at').first()
            if link:
                return link.guest

        # 2. Fallback to X-Guest-Id header
        guest_header = request.headers.get("X-Guest-Id")
        if guest_header:
            try:
                guest_uuid = uuid.UUID(guest_header)
                guest, _ = GuestIdentity.objects.get_or_create(id=guest_uuid)
                return guest
            except (ValueError, TypeError):
                pass
        
        return None

    def validate_access(self, request, obj_with_guest):
        """
        Verify if the request has access to an object owned by a guest.
        """
        guest = self.get_guest(request)
        if not guest:
            return False
        
        if obj_with_guest.guest_id != guest.id:
            # If user is authenticated, check if this object's guest is linked to them
            if request.user.is_authenticated:
                is_linked = GuestLink.objects.filter(user=request.user, guest=obj_with_guest.guest).exists()
                return is_linked
            return False
        return True


class LineLoginView(APIView):
    permission_classes = []  # Publicly accessible

    def post(self, request):
        serializer = LineLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        code = serializer.validated_data["code"]
        redirect_uri = serializer.validated_data["redirect_uri"]
        guest_id = serializer.validated_data.get("guest_id")

        # 1. Exchange code for access token
        token_url = "https://api.line.me/oauth2/v2.1/token"
        token_data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
            "client_id": settings.LINE_CHANNEL_ID,
            "client_secret": settings.LINE_CHANNEL_SECRET,
        }
        
        token_resp = requests.post(token_url, data=token_data)
        if not token_resp.ok:
            return Response(token_resp.json(), status=status.HTTP_400_BAD_REQUEST)
        
        access_token = token_resp.json().get("access_token")

        # 2. Get User Profile from LINE
        profile_url = "https://api.line.me/v2/profile"
        headers = {"Authorization": f"Bearer {access_token}"}
        profile_resp = requests.get(profile_url, headers=headers)
        if not profile_resp.ok:
            return Response(profile_resp.json(), status=status.HTTP_400_BAD_REQUEST)
        
        line_profile = profile_resp.json()
        line_user_id = line_profile.get("userId")
        display_name = line_profile.get("displayName")
        picture_url = line_profile.get("pictureUrl")

        # 3. Create or update user
        with transaction.atomic():
            profile = UserProfile.objects.filter(line_social_id=line_user_id).first()
            if profile:
                user = profile.user
            else:
                # Create new user
                username = f"line_{line_user_id}"
                user = User.objects.create_user(username=username)
                profile = UserProfile.objects.create(
                    user=user,
                    line_social_id=line_user_id,
                    display_name=display_name,
                    avatar_url=picture_url or "",
                )
            
            # Update profile info maybe
            profile.display_name = display_name
            if picture_url:
                profile.avatar_url = picture_url
            profile.save()

            # 4. Link Guest data if provided
            if guest_id:
                guest = GuestIdentity.objects.filter(id=guest_id).first()
                if guest:
                    # Link existing data: sessions and hands should now point to this User's guest?
                    # Or we just create a GuestLink record to track this.
                    GuestLink.objects.get_or_create(guest=guest, user=user)

                    # Update all sessions and hands from this guest to be linked to this user's account?
                    # WdicSession and WdicHand are linked to GuestIdentity.
                    # If we ever want to query by User, we'll follow GuestLink.

        # 5. Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": {
                "id": user.id,
                "display_name": profile.display_name,
                "avatar_url": profile.avatar_url,
                "tier": profile.tier.name if profile.tier else "Free",
            }
        })


class MeView(IdentificationMixin, APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        user = request.user
        guest = self.get_guest(request)
        today = datetime.date.today()
        
        if user.is_authenticated:
            profile = user.profile
            usage, _ = AnalysisUsage.objects.get_or_create(user=user, date=today)
            tier = profile.tier or UserTier.objects.filter(name="Free").first()
            
            hand_limit = profile.max_hand_analyses_per_day_override
            if hand_limit is None:
                hand_limit = tier.max_hand_analyses_per_day if tier else 15
            
            session_limit = profile.max_session_analyses_per_day_override
            if session_limit is None:
                session_limit = tier.max_session_analyses_per_day if tier else 3

            return Response({
                "id": user.id,
                "display_name": profile.display_name,
                "avatar_url": profile.avatar_url,
                "tier": tier.name if tier else "Free",
                "usage": {
                    "hand_count": usage.hand_analyses_count,
                    "hand_limit": hand_limit,
                    "extra_hand_balance": profile.extra_hand_analyses_balance,
                    "session_count": usage.session_analyses_count,
                    "session_limit": session_limit,
                    "extra_session_balance": profile.extra_session_analyses_balance,
                }
            })
        elif guest:
            usage, _ = AnalysisUsage.objects.get_or_create(guest=guest, date=today)
            tier = UserTier.objects.filter(name="Guest").first()
            
            hand_limit = tier.max_hand_analyses_per_day if tier else 5
            session_limit = tier.max_session_analyses_per_day if tier else 1
            
            return Response({
                "id": None,
                "display_name": "Guest",
                "avatar_url": None,
                "tier": "Guest",
                "usage": {
                    "hand_count": usage.hand_analyses_count,
                    "hand_limit": hand_limit,
                    "extra_hand_balance": 0,
                    "session_count": usage.session_analyses_count,
                    "session_limit": session_limit,
                    "extra_session_balance": 0,
                }
            })
        
        return Response({"detail": "Not identified"}, status=status.HTTP_401_UNAUTHORIZED)
