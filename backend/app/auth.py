from fastapi import HTTPException, Request

from .settings import settings


def _extract_token(request: Request) -> str:
    auth_header = request.headers.get("authorization", "")
    if auth_header.lower().startswith("bearer "):
        return auth_header.split(" ", 1)[1].strip()
    return request.headers.get("x-auth-token", "").strip()


def require_auth(request: Request) -> None:
    if not settings.auth_token:
        return
    token = _extract_token(request)
    if token != settings.auth_token:
        raise HTTPException(status_code=401, detail="Unauthorized")


def verify_credentials(username: str, password: str) -> bool:
    if not settings.auth_token:
        return True
    return username == settings.auth_username and password == settings.auth_password
