# accounts/models.py

import uuid

from django.db import models
from django.db.models import Q
from django.contrib.auth.models import User


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")

    display_name = models.CharField(max_length=100)

    line_social_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        unique=True,
        help_text="LINE userId จาก LINE Login",
    )

    avatar_url = models.URLField(blank=True)

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
    guest = models.OneToOneField(
        GuestIdentity, on_delete=models.CASCADE, related_name="link"
    )

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="guest_link"
    )

    linked_at = models.DateTimeField(auto_now_add=True)

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
