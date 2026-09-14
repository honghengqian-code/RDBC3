import re

_TOKEN_RE = re.compile(r"^[0-9a-f]{6,}(-[0-9a-f]{2,}){1,4}$", re.IGNORECASE)
_TICKET_PATH_RE = re.compile(r"/tickets/([^/?#]+)/?")


def extract_ticket_token(value: str) -> str | None:
    """Mirrors the frontend's TrackEntryForm parsing: accepts a bare token
    or a pasted ticket URL/path and extracts the token from either."""
    value = value.strip()
    match = _TICKET_PATH_RE.search(value)
    if match:
        return match.group(1)
    return value if _TOKEN_RE.match(value) else None


def looks_like_email(value: str) -> bool:
    return bool(re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", value.strip()))
