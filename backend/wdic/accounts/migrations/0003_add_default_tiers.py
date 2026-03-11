from django.db import migrations


def add_default_tiers(apps, schema_editor):
    UserTier = apps.get_model("accounts", "UserTier")
    UserTier.objects.get_or_create(
        name="Free",
        defaults={"max_hand_analyses_per_day": 5, "max_session_analyses_per_day": 1},
    )
    UserTier.objects.get_or_create(
        name="Pro",
        defaults={"max_hand_analyses_per_day": 50, "max_session_analyses_per_day": 10},
    )
    UserTier.objects.get_or_create(
        name="Unlimited",
        defaults={"max_hand_analyses_per_day": 9999, "max_session_analyses_per_day": 9999},
    )


def remove_default_tiers(apps, schema_editor):
    UserTier = apps.get_model("accounts", "UserTier")
    UserTier.objects.filter(name__in=["Free", "Pro", "Unlimited"]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0002_usertier_userprofile_tier_analysisusage"),
    ]

    operations = [
        migrations.RunPython(add_default_tiers, remove_default_tiers),
    ]
