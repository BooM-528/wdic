from __future__ import annotations
import uuid
from django.db import models
from accounts.models import GuestIdentity

class WdicSource(models.TextChoices):
    UNKNOWN = "unknown", "Unknown"
    GG = "gg", "GGPoker"
    POKERSTARS = "pokerstars", "PokerStars"
    N8 = "n8", "Natural8"

class WdicSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    guest = models.ForeignKey(GuestIdentity, on_delete=models.CASCADE, related_name="wdic_sessions")
    name = models.CharField(max_length=200, blank=True, null=True)
    source = models.CharField(max_length=32, choices=WdicSource.choices, default=WdicSource.UNKNOWN)
    
    # Metadata
    started_at = models.DateTimeField(blank=True, null=True)
    ended_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "wdic_sessions"
        ordering = ["-created_at"]

class WdicHand(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    guest = models.ForeignKey(GuestIdentity, on_delete=models.CASCADE, related_name="wdic_hands")
    session = models.ForeignKey(WdicSession, on_delete=models.CASCADE, related_name="hands")
    
    source = models.CharField(max_length=32, choices=WdicSource.choices, default=WdicSource.UNKNOWN)
    hand_no = models.CharField(max_length=128, blank=True, null=True)
    started_at = models.DateTimeField(blank=True, null=True)

    # ✅ Analytics Fields (สำคัญสำหรับการคำนวณ)
    max_players = models.IntegerField(default=6)
    hero_seat = models.IntegerField(null=True, blank=True)
    button_seat = models.IntegerField(null=True, blank=True)
    hero_position = models.CharField(max_length=10, blank=True, null=True) # BTN, SB, BB...
    hero_cards_str = models.CharField(max_length=32, blank=True, null=True) # "As Kd"
    
    # Financials (Decimal เพื่อความแม่นยำ)
    hero_collected = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    hero_invested = models.DecimalField(max_digits=20, decimal_places=2, default=0, help_text="Total chips hero put in pot (bet+call+ante - returned)")

    flop_1 = models.CharField(max_length=4, blank=True, null=True)
    flop_2 = models.CharField(max_length=4, blank=True, null=True)
    flop_3 = models.CharField(max_length=4, blank=True, null=True)
    turn = models.CharField(max_length=4, blank=True, null=True)
    river = models.CharField(max_length=4, blank=True, null=True)

    # Raw Data
    raw_text = models.TextField()
    raw_hash = models.CharField(max_length=64)
    actions_json = models.JSONField(blank=True, null=True)
    parsed_version = models.CharField(max_length=32, default="v0.4.0")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "wdic_hands"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["guest", "raw_hash"], name="wdic_hand_unique_per_guest")
        ]

class WdicHandAnalysis(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hand = models.OneToOneField(WdicHand, on_delete=models.CASCADE, related_name="analysis")
    
    # AI Output
    content = models.TextField(help_text="Markdown format analysis content")
    suggestion = models.CharField(max_length=64, blank=True, null=True, help_text="Summary: e.g., FOLD_PREFLOP, GOOD_CALL")
    
    # Metadata
    model_name = models.CharField(max_length=64, default="gpt-4o")
    prompt_version = models.CharField(max_length=32, default="v1")
    tokens_used = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "wdic_hand_analysis"

class WdicSessionAnalysis(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.OneToOneField(WdicSession, on_delete=models.CASCADE, related_name="analysis")
    
    content = models.TextField()
    model_name = models.CharField(max_length=64, default="gpt-4o")
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "wdic_session_analysis"