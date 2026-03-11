from rest_framework import serializers

class LineLoginSerializer(serializers.Serializer):
    code = serializers.CharField(required=True, help_text="Authorization code from LINE")
    guest_id = serializers.UUIDField(required=False, allow_null=True, help_text="Existing guest ID to link data")
    redirect_uri = serializers.URLField(required=True, help_text="Redirect URI used in LINE Login")
