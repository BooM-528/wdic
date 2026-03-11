# accounts/models.py

import uuid

from django.db import models
from django.db.models import Q
from django.contrib.auth.models import User


class UserTier(models.Model):
    name = models.CharField(max_length=50, unique=True)
    max_hand_analyses_per_day = models.IntegerField(default=10)
    max_session_analyses_per_day = models.IntegerField(default=1)

    def __str__(self):
        return self.name


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    tier = models.ForeignKey(
        UserTier, on_delete=models.SET_NULL, null=True, related_name="profiles"
    )
    display_name = models.CharField(max_length=100)

    line_social_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        unique=True,
        help_text="LINE userId จาก LINE Login",
    )

    avatar_url = models.URLField(blank=True)
    
    max_hand_analyses_per_day_override = models.IntegerField(
        null=True, blank=True, help_text="Override daily hand limit for this user"
    )
    max_session_analyses_per_day_override = models.IntegerField(
        null=True, blank=True, help_text="Override daily session limit for this user"
    )

    extra_hand_analyses_balance = models.IntegerField(
        default=0, help_text="One-time top-up balance for hand analyses"
    )
    extra_session_analyses_balance = models.IntegerField(
        default=0, help_text="One-time top-up balance for session analyses"
    )

    def __str__(self):
        return f"Profile of {self.display_name}"


class GuestIdentity(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    display_name = models.CharField(
        max_length=100, blank=True, help_text="ชื่อที่ guest ใช้แสดงในระบบ"
    )

    device_label = models.CharField(
        max_length=100, blank=True, help_text="label คร่าว ๆ จาก frontend (optional)"
    )

    is_active = models.BooleanField(
        default=True, help_text="ใช้ disable guest ที่เลิกใช้งานแล้ว"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    last_seen_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Guest {self.id}"


class GuestLink(models.Model):
    guest = models.ForeignKey(
        GuestIdentity, on_delete=models.CASCADE, related_name="links"
    )

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="guest_links"
    )

    linked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("guest", "user")

    def __str__(self):
        return f"Guest {self.guest_id} → User {self.user_id}"


class FriendRequestQuerySet(models.QuerySet):
    def friends_of(self, user):
        """
        คืน queryset ของ User ที่เป็นเพื่อนกับ user
        (accepted ทั้งสองทิศทาง)
        """
        return User.objects.filter(
            Q(
                sent_friend_requests__to_user=user,
                sent_friend_requests__status=FriendRequest.STATUS_ACCEPTED,
            )
            | Q(
                received_friend_requests__from_user=user,
                received_friend_requests__status=FriendRequest.STATUS_ACCEPTED,
            )
        ).distinct()


class FriendRequest(models.Model):
    STATUS_PENDING = "pending"
    STATUS_ACCEPTED = "accepted"
    STATUS_REJECTED = "rejected"
    STATUS_BLOCKED = "blocked"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_ACCEPTED, "Accepted"),
        (STATUS_REJECTED, "Rejected"),
        (STATUS_BLOCKED, "Blocked"),
    ]

    from_user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="sent_friend_requests"
    )

    to_user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="received_friend_requests"
    )

    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING
    )

    created_at = models.DateTimeField(auto_now_add=True)

    responded_at = models.DateTimeField(null=True, blank=True)

    objects = FriendRequestQuerySet.as_manager()

    class Meta:
        unique_together = ("from_user", "to_user")
        indexes = [
            models.Index(fields=["from_user", "status"]),
            models.Index(fields=["to_user", "status"]),
        ]

    def __str__(self):
        return f"{self.from_user} → {self.to_user} ({self.status})"


class Group(models.Model):
    name = models.CharField(max_length=100)

    owner = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="owned_groups"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class GroupMember(models.Model):
    class MemberType(models.TextChoices):
        USER = "user"
        GUEST = "guest"
        NAME_ONLY = "name"

    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="members")

    user = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="group_memberships",
    )

    display_name = models.CharField(max_length=100, blank=True)

    member_type = models.CharField(max_length=10, choices=MemberType.choices)

    joined_at = models.DateTimeField(auto_now_add=True)


class AnalysisUsage(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="usage_logs", null=True, blank=True
    )
    guest = models.ForeignKey(
        GuestIdentity,
        on_delete=models.CASCADE,
        related_name="usage_logs",
        null=True,
        blank=True,
    )
    date = models.DateField(auto_now_add=True)
    hand_analyses_count = models.IntegerField(default=0)
    session_analyses_count = models.IntegerField(default=0)

    class Meta:
        unique_together = ("user", "date", "guest")

    def __str__(self):
        owner = self.user.username if self.user else f"Guest {self.guest_id}"
        return f"Usage for {owner} on {self.date}"
