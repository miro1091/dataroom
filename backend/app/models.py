from datetime import datetime
from typing import List, Optional

from sqlalchemy import DateTime, ForeignKey, Index, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class TimestampedMixin:
    """Shared timestamp columns for all mutable entities."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class User(Base):
    __tablename__ = "users"
    __table_args__ = (UniqueConstraint("username", name="uq_users_username"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(150), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    datarooms: Mapped[List["Dataroom"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class Dataroom(TimestampedMixin, Base):
    __tablename__ = "datarooms"
    __table_args__ = (Index("ix_datarooms_user_id", "user_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    user: Mapped["User"] = relationship(back_populates="datarooms")
    folders: Mapped[List["Folder"]] = relationship(
        back_populates="dataroom", cascade="all, delete-orphan"
    )
    files: Mapped[List["File"]] = relationship(
        back_populates="dataroom", cascade="all, delete-orphan"
    )


class Folder(TimestampedMixin, Base):
    __tablename__ = "folders"
    __table_args__ = (
        UniqueConstraint("dataroom_id", "parent_id", "name", name="uq_folder_parent_name"),
        Index("ix_folders_dataroom_id", "dataroom_id"),
        Index("ix_folders_parent_id", "parent_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    dataroom_id: Mapped[int] = mapped_column(ForeignKey("datarooms.id"), nullable=False)
    parent_id: Mapped[Optional[int]] = mapped_column(ForeignKey("folders.id"))
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    dataroom: Mapped["Dataroom"] = relationship(back_populates="folders")
    parent: Mapped[Optional["Folder"]] = relationship(
        remote_side=[id], back_populates="children"
    )
    children: Mapped[List["Folder"]] = relationship(
        back_populates="parent", cascade="all, delete-orphan"
    )
    files: Mapped[List["File"]] = relationship(
        back_populates="folder", cascade="all, delete-orphan"
    )


class File(TimestampedMixin, Base):
    __tablename__ = "files"
    __table_args__ = (
        UniqueConstraint("dataroom_id", "folder_id", "name", name="uq_file_folder_name"),
        Index("ix_files_dataroom_id", "dataroom_id"),
        Index("ix_files_folder_id", "folder_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    dataroom_id: Mapped[int] = mapped_column(ForeignKey("datarooms.id"), nullable=False)
    folder_id: Mapped[Optional[int]] = mapped_column(ForeignKey("folders.id"))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(512), nullable=False)
    content_type: Mapped[str] = mapped_column(String(100), nullable=False)
    size: Mapped[int] = mapped_column(nullable=False)

    dataroom: Mapped["Dataroom"] = relationship(back_populates="files")
    folder: Mapped[Optional["Folder"]] = relationship(back_populates="files")
