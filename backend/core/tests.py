from django.test import SimpleTestCase
from django.urls import reverse
from rest_framework.test import APIClient


class HealthCheckTests(SimpleTestCase):
    """SimpleTestCase also ensures the liveness endpoint never needs a database."""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse("core:health")

    def test_health_is_public_and_returns_json_without_database(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/json")
        self.assertEqual(response.json(), {"status": "ok", "service": "NirmanSetu API"})

    def test_health_does_not_accept_writes(self):
        for method in ("post", "put", "patch", "delete"):
            with self.subTest(method=method):
                response = getattr(self.client, method)(self.url, {}, format="json")
                self.assertEqual(response.status_code, 405)
