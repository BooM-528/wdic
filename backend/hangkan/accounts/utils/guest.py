# accounts/utils/guest.py

import uuid
from accounts.models import GuestIdentity

GUEST_HEADER = "HTTP_X_GUEST_ID"  # Django แปลง header เป็นแบบนี้


def get_guest_from_request(request):
    guest_id = request.META.get(GUEST_HEADER)

    if not guest_id:
        return None

    try:
        guest_uuid = uuid.UUID(guest_id)
    except ValueError:
        return None

    guest, created = GuestIdentity.objects.get_or_create(
        id=guest_uuid,
        defaults={
            "display_name": "",
            "device_label": request.META.get("HTTP_USER_AGENT", "")[:100],
        },
    )

    # update last_seen
    guest.save(update_fields=["last_seen_at"])

    return guest
