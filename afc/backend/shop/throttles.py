from rest_framework.throttling import AnonRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """Admin login par brute-force rokne ke liye (rate settings.py mein 'login' scope se)."""
    scope = "login"
