from django.contrib import admin
from django.utils import timezone
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import (
    UserProfile,
    GuestIdentity,
    GuestLink,
    FriendRequest,
    Group,
    GroupMember,
)


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    fk_name = "user"
    can_delete = False
    extra = 0
    fields = ("display_name", "line_social_id", "avatar_url")


class GuestLinkInline(admin.StackedInline):
    model = GuestLink
    fk_name = "user"
    extra = 0
    show_change_link = True
    autocomplete_fields = ("guest",)
    readonly_fields = ("linked_at",)


class CustomUserAdmin(BaseUserAdmin):
    inlines = [UserProfileInline, GuestLinkInline]


# แทนที่ UserAdmin เดิมเพื่อใส่ inlines
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "display_name", "line_social_id")
    search_fields = (
        "display_name",
        "line_social_id",
        "user__username",
        "user__first_name",
        "user__last_name",
        "user__email",
    )
    list_select_related = ("user",)
    autocomplete_fields = ("user",)


@admin.register(GuestIdentity)
class GuestIdentityAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "display_name",
        "device_label",
        "is_active",
        "created_at",
        "last_seen_at",
    )
    list_filter = ("is_active", "created_at")
    search_fields = ("id", "display_name", "device_label")
    readonly_fields = ("created_at", "last_seen_at")


@admin.register(GuestLink)
class GuestLinkAdmin(admin.ModelAdmin):
    list_display = ("guest", "user", "linked_at")
    search_fields = (
        "guest__id",
        "guest__display_name",
        "user__username",
        "user__email",
    )
    list_select_related = ("guest", "user")
    autocomplete_fields = ("guest", "user")
    readonly_fields = ("linked_at",)


@admin.register(FriendRequest)
class FriendRequestAdmin(admin.ModelAdmin):
    list_display = ("from_user", "to_user", "status", "created_at", "responded_at")
    list_filter = ("status", "created_at")
    search_fields = (
        "from_user__username",
        "from_user__email",
        "to_user__username",
        "to_user__email",
    )
    list_select_related = ("from_user", "to_user")
    autocomplete_fields = ("from_user", "to_user")
    actions = ["mark_accepted", "mark_rejected", "mark_blocked", "mark_pending"]
    readonly_fields = ()

    def _bulk_update(self, request, queryset, status, set_responded=True):
        if set_responded:
            updated = queryset.update(status=status, responded_at=timezone.now())
        else:
            updated = queryset.update(status=status, responded_at=None)
        self.message_user(request, f"อัปเดต {updated} รายการเป็น {status}")

    def mark_accepted(self, request, queryset):
        self._bulk_update(request, queryset, FriendRequest.STATUS_ACCEPTED, True)
    mark_accepted.short_description = "Mark selected as Accepted"

    def mark_rejected(self, request, queryset):
        self._bulk_update(request, queryset, FriendRequest.STATUS_REJECTED, True)
    mark_rejected.short_description = "Mark selected as Rejected"

    def mark_blocked(self, request, queryset):
        self._bulk_update(request, queryset, FriendRequest.STATUS_BLOCKED, True)
    mark_blocked.short_description = "Mark selected as Blocked"

    def mark_pending(self, request, queryset):
        self._bulk_update(request, queryset, FriendRequest.STATUS_PENDING, False)
    mark_pending.short_description = "Mark selected as Pending"


class GroupMemberInline(admin.TabularInline):
    model = GroupMember
    extra = 0
    fields = ("user", "display_name", "member_type", "joined_at")
    readonly_fields = ("joined_at",)
    autocomplete_fields = ("user",)
    show_change_link = True


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ("name", "owner", "created_at", "member_count")
    search_fields = ("name", "owner__username", "owner__email")
    list_select_related = ("owner",)
    autocomplete_fields = ("owner",)
    inlines = [GroupMemberInline]

    def member_count(self, obj):
        return obj.members.count()
    member_count.short_description = "Members"


@admin.register(GroupMember)
class GroupMemberAdmin(admin.ModelAdmin):
    list_display = ("group", "user", "display_name", "member_type", "joined_at")
    list_filter = ("member_type", "group")
    search_fields = ("group__name", "user__username", "display_name")
    list_select_related = ("group", "user")
    autocomplete_fields = ("group", "user")
    readonly_fields = ("joined_at",)