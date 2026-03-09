from django.urls import path
from wdic.views import ImportSessionView, SessionListView, SessionHandsView, HandDetailView, AnalyzeHandView

urlpatterns = [
    path("sessions/import", ImportSessionView.as_view(), name="wdic_session_import"),
    path("sessions", SessionListView.as_view(), name="wdic_session_list"),
    path("sessions/<uuid:session_id>/hands", SessionHandsView.as_view(), name="wdic_session_hands"),
    path("hands/<uuid:hand_id>", HandDetailView.as_view(), name="wdic_hand_detail"),
    path("hands/<uuid:hand_id>/analyze", AnalyzeHandView.as_view(), name="wdic_hand_analyze"),
]
