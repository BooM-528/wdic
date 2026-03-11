from django.urls import path
from .views import LineLoginView, MeView

urlpatterns = [
    path("line-login", LineLoginView.as_view(), name="line_login"),
    path("me", MeView.as_view(), name="me"),
]
