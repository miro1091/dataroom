import os

from fastapi import Depends, FastAPI, HTTPException, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from strawberry.fastapi import GraphQLRouter

from .auth import require_auth, verify_credentials
from .db import Base, SessionLocal, engine, get_db
from .models import File
from .schema import schema
from .settings import settings
from .storage import ensure_storage_dir


app = FastAPI(title="Acme Dataroom API")


@app.middleware("http")
async def db_session_middleware(request: Request, call_next):
    request.state.db = SessionLocal()
    try:
        response = await call_next(request)
    finally:
        request.state.db.close()
    return response


origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_context(request: Request) -> dict:
    require_auth(request)
    return {"request": request, "db": request.state.db}


graphql_router = GraphQLRouter(schema, context_getter=get_context)
app.include_router(graphql_router, prefix=f"{settings.api_prefix}/graphql")


@app.on_event("startup")
def on_startup() -> None:
    ensure_storage_dir()
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


class LoginRequest(BaseModel):
    username: str
    password: str


@app.post(f"{settings.api_prefix}/auth/login")
def login(payload: LoginRequest) -> dict:
    if verify_credentials(payload.username, payload.password):
        return {"token": settings.auth_token}
    raise HTTPException(status_code=401, detail="Invalid credentials")


@app.get("/files/{file_id}")
def download_file(file_id: int, request: Request, db: Session = Depends(get_db)) -> FileResponse:
    require_auth(request)
    record = db.get(File, file_id)
    if not record:
        raise HTTPException(status_code=404, detail="File not found.")
    if not os.path.exists(record.storage_path):
        raise HTTPException(status_code=404, detail="File missing from storage.")
    return FileResponse(
        record.storage_path,
        media_type=record.content_type,
        filename=record.name,
    )
