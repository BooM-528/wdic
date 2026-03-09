# wdic/views.py
from __future__ import annotations
from typing import List, Optional
from uuid import UUID
import uuid
from datetime import datetime  # ✅ เพิ่ม

from django.db import IntegrityError, transaction
from django.db.models import Min, Max, Count
from django.http import Http404
from django.utils.timezone import make_aware

from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import GuestIdentity
from wdic.models import (
    WdicHand,
    WdicSession,
    WdicSource,
    WdicHandAnalysis,
    WdicSessionAnalysis,
)
from wdic.parser import (
    split_hands,
    parse_hand_meta,
    parse_hand_detail,
    calculate_sha256,
)


# --- Serializers ---
class ImportSessionRequestSerializer(serializers.Serializer):
    rawFileText = serializers.CharField()
    name = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    source = serializers.ChoiceField(
        choices=WdicSource.choices, required=False, default=WdicSource.UNKNOWN
    )


class SessionListSerializer(serializers.ModelSerializer):
    handCount = serializers.IntegerField(read_only=True)

    class Meta:
        model = WdicSession
        fields = [
            "id",
            "name",
            "source",
            "started_at",
            "ended_at",
            "created_at",
            "handCount",
        ]


class HandListSerializer(serializers.ModelSerializer):
    ante = serializers.SerializerMethodField()
    bb_value = serializers.SerializerMethodField()
    board_cards_str = serializers.SerializerMethodField()
    has_analysis = serializers.SerializerMethodField()
    is_recommended = serializers.SerializerMethodField()

    class Meta:
        model = WdicHand
        fields = [
            "id",
            "hand_no",
            "source",
            "started_at",
            "created_at",
            "hero_position",
            "hero_cards_str",
            "hero_collected",
            "hero_invested",
            "ante",
            "bb_value",
            "board_cards_str",
            "has_analysis",
            "is_recommended",
        ]

    def get_ante(self, obj) -> int:
        if not obj.actions_json:
            return 0
        return obj.actions_json.get("blinds", {}).get("ante", 0)

    def get_bb_value(self, obj) -> int:
        if not obj.actions_json:
            return 0
        return obj.actions_json.get("blinds", {}).get("bb", 0)

    def get_board_cards_str(self, obj):
        # 🟢 LOGIC: ขึ้นอยู่กับว่าใน Database เก็บไพ่ Board ไว้อย่างไร?

        # กรณีที่ 1: ถ้าเก็บแยกเป็น Column (flop1, flop2, ..., river)
        cards = []
        # เช็คว่ามีไพ่ไหม แล้วค่อย append
        if getattr(obj, "flop_1", None):
            cards.append(obj.flop_1)
        if getattr(obj, "flop_2", None):
            cards.append(obj.flop_2)
        if getattr(obj, "flop_3", None):
            cards.append(obj.flop_3)
        if getattr(obj, "turn", None):
            cards.append(obj.turn)
        if getattr(obj, "river", None):
            cards.append(obj.river)

        return " ".join(cards) if cards else None

    def get_has_analysis(self, obj) -> bool:
        return hasattr(obj, "analysis")

    def get_is_recommended(self, obj) -> bool:
        bb = self.get_bb_value(obj)
        if bb > 0:
            return obj.hero_invested >= bb * 10
        return obj.hero_invested >= 1000


class HandAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = WdicHandAnalysis
        fields = [
            "id",
            "hand_id",
            "content",
            "suggestion",
            "score",
            "key_mistakes",
            "model_name",
            "prompt_version",
            "tokens_used",
            "created_at",
        ]


class SessionAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = WdicSessionAnalysis
        fields = [
            "id",
            "session_id",
            "content",
            "model_name",
            "created_at",
        ]


class HandDetailSerializer(serializers.ModelSerializer):
    ante = serializers.SerializerMethodField()
    bb_value = serializers.SerializerMethodField()
    board_cards_str = serializers.SerializerMethodField()
    analysis = HandAnalysisSerializer(read_only=True)

    class Meta:
        model = WdicHand
        fields = [
            "id",
            "session_id",
            "hand_no",
            "source",
            "started_at",
            "raw_text",
            "actions_json",
            "parsed_version",
            "created_at",
            "max_players",
            "hero_seat",
            "button_seat",
            "hero_position",
            "hero_cards_str",
            "hero_collected",
            "hero_invested",
            "ante",
            "bb_value",
            "board_cards_str",
            "analysis",
        ]

    def get_ante(self, obj) -> int:
        if not obj.actions_json:
            return 0
        return obj.actions_json.get("blinds", {}).get("ante", 0)

    def get_bb_value(self, obj) -> int:
        if not obj.actions_json:
            return 0
        return obj.actions_json.get("blinds", {}).get("bb", 0)

    def get_board_cards_str(self, obj):
        cards = []
        if getattr(obj, "flop_1", None):
            cards.append(obj.flop_1)
        if getattr(obj, "flop_2", None):
            cards.append(obj.flop_2)
        if getattr(obj, "flop_3", None):
            cards.append(obj.flop_3)
        if getattr(obj, "turn", None):
            cards.append(obj.turn)
        if getattr(obj, "river", None):
            cards.append(obj.river)

        return " ".join(cards) if cards else None


# --- Base View ---
class GuestRequiredAPIView(APIView):
    def get_guest(self, request) -> GuestIdentity:
        guest = getattr(request, "guest", None)
        if guest:
            return guest
        guest_header = request.headers.get("X-Guest-Id")
        if not guest_header:
            raise serializers.ValidationError({"detail": "Missing X-Guest-Id"})
        try:
            guest_uuid = uuid.UUID(guest_header)
        except ValueError:
            raise serializers.ValidationError({"detail": "Invalid X-Guest-Id"})
        guest, _ = GuestIdentity.objects.get_or_create(id=guest_uuid)
        request.guest = guest
        return guest


# --- Views ---
# wdic/views.py

# ... imports ...


class ImportSessionView(GuestRequiredAPIView):
    PARSED_VERSION = "v0.4.3"

    def post(self, request):
        guest = self.get_guest(request)
        ser = ImportSessionRequestSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        raw_file_text = ser.validated_data["rawFileText"]
        name = ser.validated_data.get("name")
        source = ser.validated_data.get("source") or WdicSource.UNKNOWN

        hand_texts = split_hands(raw_file_text)
        if not hand_texts:
            return Response(
                {"detail": "No hands found"}, status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            # ✅ 1. LOGIC ใหม่: เช็ค Session ซ้ำจากชื่อไฟล์ (name)
            session = None
            if name:
                # ถ้ามีชื่อไฟล์ ให้ลองหาของเดิมก่อน
                session = WdicSession.objects.filter(guest=guest, name=name).first()

            if not session:
                # ถ้าไม่มี หรือไม่ได้ส่งชื่อมา ให้สร้างใหม่
                session = WdicSession.objects.create(
                    guest=guest, name=name, source=source
                )
            else:
                # ถ้าเจอของเดิม ให้อัปเดต source (เผื่อเปลี่ยน)
                if source != WdicSource.UNKNOWN:
                    session.source = source
                    session.save()

            created_ids = []
            skipped = 0

            for raw_hand in hand_texts:
                raw_hand = raw_hand.strip()
                if not raw_hand:
                    continue

                raw_hash = calculate_sha256(raw_hand)
                meta = parse_hand_meta(raw_hand)
                parsed_detail = parse_hand_detail(raw_hand)

                hero_cards = parsed_detail.get("hero_cards", [])
                hero_cards_str = " ".join(hero_cards) if hero_cards else None

                # ✅ 2. ดึง Board Cards จาก Parser
                board_cards = parsed_detail.get("board_cards", [])

                f1 = board_cards[0] if len(board_cards) > 0 else None
                f2 = board_cards[1] if len(board_cards) > 1 else None
                f3 = board_cards[2] if len(board_cards) > 2 else None
                tn = board_cards[3] if len(board_cards) > 3 else None
                rv = board_cards[4] if len(board_cards) > 4 else None

                started_at_dt = None
                if meta.get("started_at_str"):
                    try:
                        started_at_dt = datetime.strptime(
                            meta["started_at_str"], "%Y/%m/%d %H:%M:%S"
                        )
                    except ValueError:
                        pass

                # ✅ Update or Create Hand
                # สังเกตว่าเราใช้ 'session' ตัวแปรเดียวกับข้างบน
                # ถ้าเป็น session เดิม, hand เดิมจะถูก update ข้อมูลใหม่ (เช่น board cards) ลงไปในที่เดิม
                hand, created = WdicHand.objects.update_or_create(
                    guest=guest,
                    raw_hash=raw_hash,
                    defaults={
                        "session": session,  # Link กับ Session ที่หามาได้ (หรือสร้างใหม่)
                        "source": source,
                        "hand_no": meta["hand_no"],
                        "started_at": started_at_dt,
                        "raw_text": raw_hand,
                        "actions_json": parsed_detail,
                        "parsed_version": self.PARSED_VERSION,
                        "max_players": parsed_detail.get("max_players", 6),
                        "hero_seat": parsed_detail.get("hero_seat"),
                        "button_seat": parsed_detail.get("button_seat"),
                        "hero_position": parsed_detail.get("hero_position"),
                        "hero_cards_str": hero_cards_str,
                        # Save Board Cards
                        "flop_1": f1,
                        "flop_2": f2,
                        "flop_3": f3,
                        "turn": tn,
                        "river": rv,
                        "hero_collected": parsed_detail.get("hero_collected", 0),
                        "hero_invested": parsed_detail.get("hero_invested", 0),
                    },
                )
                if not created:
                    skipped += 1
                created_ids.append(str(hand.id))

            # Update Session time range
            agg = session.hands.aggregate(min=Min("started_at"), max=Max("started_at"))
            if agg["min"]:
                session.started_at = agg["min"]
            if agg["max"]:
                session.ended_at = agg["max"]
            session.save()

        return Response(
            {
                "sessionId": str(session.id),
                "handCount": len(created_ids),
                "updated_or_skipped": skipped,
                "handIds": created_ids[:50],
            },
            status=status.HTTP_201_CREATED,
        )


class SessionListView(GuestRequiredAPIView):
    def get(self, request):
        guest = self.get_guest(request)
        limit = int(request.query_params.get("limit", "50"))
        qs = (
            WdicSession.objects.filter(guest=guest)
            .annotate(handCount=Count("hands"))
            .order_by("-created_at")[:limit]
        )
        return Response(SessionListSerializer(qs, many=True).data)


class SessionHandsView(GuestRequiredAPIView):
    def get(self, request, session_id: UUID):
        guest = self.get_guest(request)
        limit_param = int(request.query_params.get("limit", "200"))
        limit = max(1, min(limit_param, 10000))
        session = WdicSession.objects.filter(id=session_id, guest=guest).first()
        if not session:
            raise Http404

        # Start query with select_related for optimization
        qs = session.hands.select_related("analysis")

        # Filters
        position = request.query_params.get("position")
        if position:
            qs = qs.filter(hero_position=position)

        status_param = request.query_params.get("status")
        if status_param == "analyzed":
            qs = qs.filter(analysis__isnull=False)
        elif status_param == "unanalyzed":
            qs = qs.filter(analysis__isnull=True)

        cards = request.query_params.get("cards")
        if cards:
            qs = qs.filter(hero_cards_str__icontains=cards)

        recommended = request.query_params.get("recommended")
        if recommended == "true":
            # Just filter where analysis is null and order by invested to show big pots
            qs = qs.filter(analysis__isnull=True).order_by("-hero_invested")

            hands = []
            for h in qs:
                bb = (
                    h.actions_json.get("blinds", {}).get("bb", 0)
                    if h.actions_json
                    else 0
                )
                is_rec = (
                    (h.hero_invested >= bb * 10)
                    if bb > 0
                    else (h.hero_invested >= 1000)
                )
                if is_rec:
                    hands.append(h)
                if len(hands) >= limit:
                    break
        else:
            qs = qs.order_by("-started_at", "-created_at")
            hands = qs[:limit]

        session_with_count = (
            WdicSession.objects.filter(id=session.id, guest=guest)
            .annotate(handCount=Count("hands"))
            .first()
        )

        return Response(
            {
                "session": SessionListSerializer(session_with_count).data,
                "hands": HandListSerializer(hands, many=True).data,
            }
        )


class HandDetailView(GuestRequiredAPIView):
    def get(self, request, hand_id: UUID):
        guest = self.get_guest(request)
        hand = WdicHand.objects.filter(id=hand_id, guest=guest).first()
        if not hand:
            raise Http404
        return Response(HandDetailSerializer(hand).data)


class AnalyzeHandView(GuestRequiredAPIView):
    def post(self, request, hand_id: UUID):
        guest = self.get_guest(request)
        hand = WdicHand.objects.filter(id=hand_id, guest=guest).first()
        if not hand:
            raise Http404

        # 1. Check if we should force re-analyze or if it's new
        # For simplicity, we'll allow re-analysis on every POST to this endpoint
        # or we could check for a 'force' param in the request
        force = request.data.get("force", False)
        lang = request.data.get("lang", "th")

        if hasattr(hand, "analysis") and not force:
            return Response(HandAnalysisSerializer(hand.analysis).data)

        # 2. Trigger AI Analysis
        from wdic.ai_service import PokerAiService

        ai_service = PokerAiService()
        result = ai_service.analyze_hand(hand, lang=lang)

        # 3. Save or Update Analysis
        with transaction.atomic():
            if hasattr(hand, "analysis"):
                hand.analysis.delete()

            analysis = WdicHandAnalysis.objects.create(
                hand=hand,
                content=result["content"],
                suggestion=result["suggestion"],
                score=result.get("score", 0),
                key_mistakes=result.get("key_mistakes", []),
                model_name=result["model_name"],
                prompt_version="v1",
                tokens_used=result["tokens_used"],
            )

        return Response(
            HandAnalysisSerializer(analysis).data, status=status.HTTP_201_CREATED
        )


class AnalyzeSessionView(GuestRequiredAPIView):
    def post(self, request, session_id: UUID):
        guest = self.get_guest(request)
        session = WdicSession.objects.filter(id=session_id, guest=guest).first()
        if not session:
            raise Http404

        force = request.data.get("force", False)
        lang = request.data.get("lang", "th")

        if hasattr(session, "analysis") and not force:
            return Response(SessionAnalysisSerializer(session.analysis).data)

        # Trigger AI Analysis
        from wdic.ai_service import PokerAiService

        ai_service = PokerAiService()
        result = ai_service.analyze_session(session, lang=lang)

        # Save or Update Analysis
        with transaction.atomic():
            analysis, created = WdicSessionAnalysis.objects.update_or_create(
                session=session,
                defaults={
                    "content": result["content"],
                    "model_name": result["model_name"],
                }
            )

        return Response(
            SessionAnalysisSerializer(analysis).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )

