import os

from fastapi import Depends, FastAPI, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import inspect, select, text
from sqlalchemy.exc import IntegrityError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from starlette.requests import ClientDisconnect
from sqlalchemy.orm import Session
from strawberry.fastapi import GraphQLRouter

from .auth import create_access_token, hash_password, require_auth, verify_password
from .db import Base, SessionLocal, engine, get_db
from .models import Dataroom, File, User
from .schema import schema
from .settings import settings
from .storage import ensure_storage_dir


app = FastAPI(title="Acme Dataroom API")


@app.middleware("http")
async def db_session_middleware(request: Request, call_next):
    request.state.db = SessionLocal()
    try:
        response = await call_next(request)
    except ClientDisconnect:
        # Client aborted request (navigation/cancel). Avoid noisy traceback logs.
        response = Response(status_code=499)
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


def get_current_user(request: Request, db: Session) -> User:
    username = require_auth(request)
    user = db.execute(select(User).where(User.username == username)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user


def get_context(request: Request) -> dict:
    user = get_current_user(request, request.state.db)
    return {"request": request, "db": request.state.db, "user": user}


graphql_router = GraphQLRouter(schema, context_getter=get_context)
app.include_router(graphql_router, prefix=f"{settings.api_prefix}/graphql")


@app.on_event("startup")
def on_startup() -> None:
    ensure_storage_dir()
    Base.metadata.create_all(bind=engine)
    _ensure_dataroom_owner_column()


def _ensure_dataroom_owner_column() -> None:
    inspector = inspect(engine)
    if "datarooms" not in inspector.get_table_names():
        return
    columns = {column["name"] for column in inspector.get_columns("datarooms")}
    if "user_id" not in columns:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE datarooms ADD COLUMN user_id INTEGER"))
            conn.execute(
                text("CREATE INDEX IF NOT EXISTS ix_datarooms_user_id ON datarooms (user_id)")
            )
    with engine.begin() as conn:
        users = conn.execute(text("SELECT id FROM users ORDER BY id ASC LIMIT 2")).fetchall()
        if len(users) == 1:
            conn.execute(
                text("UPDATE datarooms SET user_id = :user_id WHERE user_id IS NULL"),
                {"user_id": users[0][0]},
            )


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


class LoginRequest(BaseModel):
    username: str
    password: str


@app.post(f"{settings.api_prefix}/auth/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> dict:
    username = payload.username.strip()
    if len(username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters.")
    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    user = db.execute(select(User).where(User.username == username)).scalar_one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"token": create_access_token(user.username)}


class RegisterRequest(BaseModel):
    username: str
    password: str


@app.post(f"{settings.api_prefix}/auth/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> dict:
    username = payload.username.strip()
    if len(username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters.")
    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    user = User(username=username, password_hash=hash_password(payload.password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Username already exists.")
    return {"token": create_access_token(user.username)}


@app.get("/files/{file_id}")
def download_file(file_id: int, request: Request, db: Session = Depends(get_db)) -> FileResponse:
    user = get_current_user(request, db)
    record = (
        db.execute(
            select(File)
            .join(Dataroom, File.dataroom_id == Dataroom.id)
            .where(File.id == file_id, Dataroom.user_id == user.id)
        )
        .scalars()
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="File not found.")
    if not os.path.exists(record.storage_path):
        raise HTTPException(status_code=404, detail="File missing from storage.")
    return FileResponse(
        record.storage_path,
        media_type=record.content_type,
        filename=record.name,
    )
