from django.contrib.auth.models import User
from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.urls import reverse

from apps.tickets.models import Attachment, Client, Response, Ticket


class TicketCreationTests(TestCase):
    def test_create_ticket_creates_client_and_sends_email(self):
        url = reverse("public-ticket-create")
        payload = {
            "name": "Ada Lovelace",
            "email": "ada@example.com",
            "title": "Dashboard fails to load",
            "description": "It spins forever and never renders anything useful.",
        }
        resp = self.client.post(url, payload, content_type="application/json")
        self.assertEqual(resp.status_code, 201)
        self.assertTrue(Client.objects.filter(email="ada@example.com").exists())
        self.assertEqual(Ticket.objects.count(), 1)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(str(Ticket.objects.first().token), mail.outbox[0].body)

    def test_create_ticket_rejects_short_title(self):
        url = reverse("public-ticket-create")
        payload = {
            "name": "Ada",
            "email": "ada@example.com",
            "title": "Hi",
            "description": "This description is definitely long enough.",
        }
        resp = self.client.post(url, payload, content_type="application/json")
        self.assertEqual(resp.status_code, 400)

    def test_returning_client_dedupes_by_email(self):
        url = reverse("public-ticket-create")
        base = {
            "name": "Ada Lovelace",
            "email": "ada@example.com",
            "description": "This description is definitely long enough.",
        }
        self.client.post(url, {**base, "title": "First issue here"}, content_type="application/json")
        self.client.post(url, {**base, "title": "Second issue here"}, content_type="application/json")
        self.assertEqual(Client.objects.filter(email="ada@example.com").count(), 1)
        self.assertEqual(Ticket.objects.count(), 2)


class AttachmentTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin", email="admin@example.com", password="s3cret-pass", is_staff=True
        )
        self.client_obj = Client.objects.create(name="Ada Lovelace", email="ada@example.com")
        self.ticket = Ticket.objects.create(
            client=self.client_obj, title="Something broke", description="Details here."
        )

    def test_ticket_creation_with_valid_attachment_persists_and_is_returned(self):
        url = reverse("public-ticket-create")
        upload = SimpleUploadedFile("screenshot.png", b"fake-png-bytes", content_type="image/png")
        payload = {
            "name": "Ada Lovelace",
            "email": "ada@example.com",
            "title": "Dashboard fails to load",
            "description": "It spins forever and never renders anything useful.",
            "attachments": [upload],
        }
        resp = self.client.post(url, payload)
        self.assertEqual(resp.status_code, 201, resp.content)
        ticket = Ticket.objects.get(token=resp.json()["token"])
        self.assertEqual(Attachment.objects.filter(ticket=ticket).count(), 1)
        self.assertEqual(len(resp.json()["attachments"]), 1)
        self.assertEqual(resp.json()["attachments"][0]["kind"], "image")
        self.assertEqual(resp.json()["attachments"][0]["name"], "screenshot.png")

    def test_oversized_attachment_is_rejected(self):
        url = reverse("public-ticket-create")
        upload = SimpleUploadedFile(
            "huge.png", b"x" * (6 * 1024 * 1024), content_type="image/png"
        )
        payload = {
            "name": "Ada",
            "email": "ada@example.com",
            "title": "Something is wrong here",
            "description": "This description is definitely long enough.",
            "attachments": [upload],
        }
        resp = self.client.post(url, payload)
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(Attachment.objects.count(), 0)

    def test_disallowed_content_type_is_rejected(self):
        url = reverse("public-ticket-create")
        upload = SimpleUploadedFile(
            "script.exe", b"MZ...", content_type="application/x-msdownload"
        )
        payload = {
            "name": "Ada",
            "email": "ada@example.com",
            "title": "Something is wrong here",
            "description": "This description is definitely long enough.",
            "attachments": [upload],
        }
        resp = self.client.post(url, payload)
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(Attachment.objects.count(), 0)

    def test_admin_reply_attachment_persists_on_the_response_not_the_ticket(self):
        self.client.login(username="admin", password="s3cret-pass")
        url = reverse("admin-ticket-response-create", kwargs={"id": str(self.ticket.id)})
        upload = SimpleUploadedFile("notes.txt", b"fix notes", content_type="text/plain")
        resp = self.client.post(
            url, {"message": "Here's what I found.", "notify_client": "true", "attachments": [upload]}
        )
        self.assertEqual(resp.status_code, 201, resp.content)
        response_obj = Response.objects.get(id=resp.json()["id"])
        attachment = Attachment.objects.get()
        self.assertEqual(attachment.response_id, response_obj.id)
        self.assertIsNone(attachment.ticket_id)
        self.assertEqual(len(resp.json()["attachments"]), 1)


class TicketTokenAccessTests(TestCase):
    def setUp(self):
        self.client_obj = Client.objects.create(name="Ada Lovelace", email="ada@example.com")
        self.ticket = Ticket.objects.create(
            client=self.client_obj, title="Something broke", description="Details here."
        )

    def test_fetch_ticket_by_valid_token(self):
        url = reverse("public-ticket-detail", kwargs={"token": str(self.ticket.token)})
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["title"], "Something broke")
        self.assertNotIn("id", resp.json())  # internal id must never leak publicly

    def test_fetch_ticket_by_unknown_token_is_404(self):
        url = reverse("public-ticket-detail", kwargs={"token": "00000000-0000-0000-0000-000000000000"})
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 404)

    def test_client_can_reply_on_own_ticket(self):
        mail.outbox = []
        url = reverse("public-ticket-response-create", kwargs={"token": str(self.ticket.token)})
        resp = self.client.post(url, {"message": "Any update?"}, content_type="application/json")
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(Response.objects.filter(ticket=self.ticket).count(), 1)
        # Client replies notify the admin(s), not the client themselves.
        self.assertEqual(len(mail.outbox), 1)


class TrackLookupTests(TestCase):
    def setUp(self):
        self.client_obj = Client.objects.create(name="Ada Lovelace", email="ada@example.com")
        self.ticket = Ticket.objects.create(
            client=self.client_obj, title="Something broke", description="Details here."
        )

    def test_lookup_by_token_returns_redirect(self):
        url = reverse("public-ticket-lookup")
        resp = self.client.post(url, {"query": str(self.ticket.token)}, content_type="application/json")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["redirect"], f"/tickets/{self.ticket.token}")

    def test_lookup_by_pasted_url_extracts_token(self):
        url = reverse("public-ticket-lookup")
        pasted = f"https://app.example.com/tickets/{self.ticket.token}/"
        resp = self.client.post(url, {"query": pasted}, content_type="application/json")
        self.assertEqual(resp.json()["redirect"], f"/tickets/{self.ticket.token}")

    def test_lookup_by_known_and_unknown_email_return_identical_shape(self):
        url = reverse("public-ticket-lookup")
        known = self.client.post(url, {"query": "ada@example.com"}, content_type="application/json")
        unknown = self.client.post(url, {"query": "nobody@example.com"}, content_type="application/json")
        self.assertEqual(known.status_code, unknown.status_code)
        self.assertEqual(known.json(), unknown.json())

    def test_verification_round_trip(self):
        from apps.tickets.services import create_track_verification

        verify_token = create_track_verification("ada@example.com")
        url = reverse("public-tracked-tickets", kwargs={"verify_token": verify_token})
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["email"], "ada@example.com")
        self.assertEqual(len(resp.json()["tickets"]), 1)

    def test_invalid_verification_token_is_404(self):
        url = reverse("public-tracked-tickets", kwargs={"verify_token": "not-a-real-token"})
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 404)


class AdminAuthAndUpdateTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin", email="admin@example.com", password="s3cret-pass", is_staff=True
        )
        self.client_obj = Client.objects.create(name="Ada Lovelace", email="ada@example.com")
        self.ticket = Ticket.objects.create(
            client=self.client_obj, title="Something broke", description="Details here."
        )

    def test_login_success(self):
        url = reverse("admin-login")
        resp = self.client.post(
            url, {"email": "admin@example.com", "password": "s3cret-pass"}, content_type="application/json"
        )
        self.assertEqual(resp.status_code, 200)

    def test_login_failure_is_generic(self):
        url = reverse("admin-login")
        resp = self.client.post(
            url, {"email": "admin@example.com", "password": "wrong"}, content_type="application/json"
        )
        self.assertEqual(resp.status_code, 401)
        self.assertNotIn("exist", resp.json()["detail"].lower())

    def test_unauthenticated_cannot_list_tickets(self):
        url = reverse("admin-ticket-list")
        resp = self.client.get(url)
        self.assertIn(resp.status_code, (401, 403))

    def test_status_update_stamps_and_clears_resolved_at(self):
        self.client.login(username="admin", password="s3cret-pass")
        url = reverse("admin-ticket-detail", kwargs={"id": str(self.ticket.id)})

        resp = self.client.patch(
            url, {"status": "Resolved"}, content_type="application/json",
            HTTP_X_CSRFTOKEN=self.client.cookies.get("csrftoken", "").value if self.client.cookies.get("csrftoken") else "",
        )
        # Django's test client bypasses CSRF enforcement by default (no
        # enforce_csrf_checks), so this succeeds without a real token dance.
        self.assertEqual(resp.status_code, 200)
        self.ticket.refresh_from_db()
        self.assertIsNotNone(self.ticket.resolved_at)

        resp = self.client.patch(url, {"status": "Open"}, content_type="application/json")
        self.assertEqual(resp.status_code, 200)
        self.ticket.refresh_from_db()
        self.assertIsNone(self.ticket.resolved_at)
