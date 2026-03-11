from django.db import migrations


def update_tiers(apps, schema_editor):
    UserTier = apps.get_model("accounts", "UserTier")
    
    # 1. Add/Update Guest Tier
    UserTier.objects.update_or_create(
        name="Guest",
        defaults={"max_hand_analyses_per_day": 5, "max_session_analyses_per_day": 1},
    )
    
    # 2. Update Free Tier
    UserTier.objects.update_or_create(
        name="Free",
        defaults={"max_hand_analyses_per_day": 15, "max_session_analyses_per_day": 3},
    )


def rollback_tiers(apps, schema_editor):
    UserTier = apps.get_model("accounts", "UserTier")
    # Restore original Free tier limits and remove Guest tier
    UserTier.objects.filter(name="Guest").delete()
    UserTier.objects.filter(name="Free").update(
        max_hand_analyses_per_day=5, 
        max_session_analyses_per_day=1
    )


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0003_add_default_tiers"),
    ]

    operations = [
        migrations.RunPython(update_tiers, rollback_tiers),
    ]
