from datetime import timedelta

from django.utils import timezone
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed

TOKEN_LIFETIME = timedelta(hours=24)


class ExpiringTokenAuthentication(TokenAuthentication):
    """Admin token jo 24 ghante baad khud expire ho jata hai (dobara login karna padta hai)."""

    def authenticate_credentials(self, key):
        user, token = super().authenticate_credentials(key)
        if timezone.now() - token.created > TOKEN_LIFETIME:
            token.delete()
            raise AuthenticationFailed("Session expired. Please log in again.")
        return user, token
