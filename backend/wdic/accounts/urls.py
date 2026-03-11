from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LineLoginView, MeView

urlpatterns = [
    path("line-login", LineLoginView.as_view(), name="line_login"),
    path("me", MeView.as_view(), name="me"),
    path("token/refresh", TokenRefreshView.as_view(), name="token_refresh"),
]
