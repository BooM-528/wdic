from django.contrib import admin
from .models import WdicSession, WdicHand, WdicHandAnalysis, WdicSessionAnalysis

@admin.register(WdicSession)
class WdicSessionAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "guest", "source", "hand_count", "created_at")
    search_fields = ("id", "name", "guest__id")
    list_filter = ("source", "created_at")

    def hand_count(self, obj):
        return obj.hands.count()
    hand_count.short_description = "Hands"

@admin.register(WdicHand)
class WdicHandAdmin(admin.ModelAdmin):
    list_display = ("id", "session", "hand_no", "hero_position", "hero_cards_str", "created_at")
    search_fields = ("id", "hand_no", "session__id")
    list_filter = ("source", "hero_position", "created_at")

@admin.register(WdicSessionAnalysis)
class WdicSessionAnalysisAdmin(admin.ModelAdmin):
    list_display = ("id", "session", "model_name", "created_at")

@admin.register(WdicHandAnalysis)
class WdicHandAnalysisAdmin(admin.ModelAdmin):
    list_display = ("id", "hand", "suggestion", "score", "model_name", "created_at")
