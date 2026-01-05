from __future__ import annotations

from datetime import datetime
from typing import List, Optional

import strawberry
from strawberry.schema.config import StrawberryConfig
from graphql import GraphQLError
from sqlalchemy import select
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from strawberry.file_uploads import Upload

from .models import Dataroom, File, Folder
from .redis_client import cache_delete, cache_get, cache_set
from .storage import UploadValidationError, delete_file, save_upload


def _iso(dt: datetime) -> str:
    return dt.isoformat()


def _dataroom_dict(model: Dataroom) -> dict:
    return {
        "id": model.id,
        "name": model.name,
        "created_at": _iso(model.created_at),
        "updated_at": _iso(model.updated_at),
    }


def _folder_dict(model: Folder) -> dict:
    return {
        "id": model.id,
        "dataroom_id": model.dataroom_id,
        "parent_id": model.parent_id,
        "name": model.name,
        "created_at": _iso(model.created_at),
        "updated_at": _iso(model.updated_at),
    }


def _file_dict(model: File) -> dict:
    return {
        "id": model.id,
        "dataroom_id": model.dataroom_id,
        "folder_id": model.folder_id,
        "name": model.name,
        "size": model.size,
        "content_type": model.content_type,
        "created_at": _iso(model.created_at),
        "updated_at": _iso(model.updated_at),
    }


def _cache_key_datarooms() -> str:
    return "datarooms:list"


def _cache_key_folder_contents(
    dataroom_id: int, parent_id: Optional[int], search: Optional[str]
) -> str:
    suffix = "root" if parent_id is None else str(parent_id)
    search_token = (search or "").strip().lower() or "all"
    return f"dataroom:{dataroom_id}:folder:{suffix}:search:{search_token}"


def _invalidate_dataroom_cache() -> None:
    cache_delete("datarooms:*")


def _invalidate_folder_cache(dataroom_id: int) -> None:
    cache_delete(f"dataroom:{dataroom_id}:folder:*")


def _get_dataroom(db: Session, dataroom_id: int) -> Dataroom:
    dataroom = db.get(Dataroom, dataroom_id)
    if not dataroom:
        raise GraphQLError("Dataroom not found.")
    return dataroom


def _get_folder(db: Session, folder_id: int) -> Folder:
    folder = db.get(Folder, folder_id)
    if not folder:
        raise GraphQLError("Folder not found.")
    return folder


def _get_file(db: Session, file_id: int) -> File:
    file = db.get(File, file_id)
    if not file:
        raise GraphQLError("File not found.")
    return file


def _ensure_unique_folder_name(
    db: Session, dataroom_id: int, parent_id: Optional[int], name: str, ignore_id: int | None = None
) -> None:
    stmt = select(Folder).where(
        Folder.dataroom_id == dataroom_id,
        Folder.parent_id == parent_id,
        Folder.name == name,
    )
    existing = db.execute(stmt).scalar_one_or_none()
    if existing and existing.id != ignore_id:
        raise GraphQLError("A folder with this name already exists in the target location.")


def _ensure_unique_file_name(
    db: Session, dataroom_id: int, folder_id: Optional[int], name: str, ignore_id: int | None = None
) -> None:
    stmt = select(File).where(
        File.dataroom_id == dataroom_id,
        File.folder_id == folder_id,
        File.name == name,
    )
    existing = db.execute(stmt).scalar_one_or_none()
    if existing and existing.id != ignore_id:
        raise GraphQLError("A file with this name already exists in the target location.")


def _collect_descendant_folder_ids(db: Session, root_id: int) -> List[int]:
    ids = [root_id]
    index = 0
    while index < len(ids):
        batch = ids[index:]
        index = len(ids)
        children = db.execute(select(Folder.id).where(Folder.parent_id.in_(batch))).scalars().all()
        ids.extend(children)
    return ids


@strawberry.type(name="Dataroom")
class DataroomType:
    id: int
    name: str
    created_at: str
    updated_at: str


@strawberry.type(name="Folder")
class FolderType:
    id: int
    dataroom_id: int
    parent_id: Optional[int]
    name: str
    created_at: str
    updated_at: str


@strawberry.type(name="File")
class FileType:
    id: int
    dataroom_id: int
    folder_id: Optional[int]
    name: str
    size: int
    content_type: str
    created_at: str
    updated_at: str

    @strawberry.field
    def download_url(self, info) -> str:
        request = info.context.get("request")
        if not request:
            return f"/files/{self.id}"
        base = str(request.base_url).rstrip("/")
        return f"{base}/files/{self.id}"


@strawberry.type(name="FolderContents")
class FolderContentsType:
    folders: List[FolderType]
    files: List[FileType]


@strawberry.type(name="SearchFileResult")
class SearchFileResultType:
    id: int
    name: str
    dataroom_id: int
    folder_id: Optional[int]
    dataroom_name: str
    folder_name: Optional[str]
    updated_at: str
    size: int


@strawberry.type(name="SearchFilesResult")
class SearchFilesResultType:
    items: List[SearchFileResultType]
    total: int
    has_more: bool


@strawberry.type
class Query:
    @strawberry.field
    def datarooms(self, info) -> List[DataroomType]:
        cached = cache_get(_cache_key_datarooms())
        if cached is not None:
            return [DataroomType(**item) for item in cached]

        db: Session = info.context["db"]
        datarooms = db.execute(select(Dataroom).order_by(Dataroom.created_at.desc())).scalars().all()
        payload = [_dataroom_dict(item) for item in datarooms]
        cache_set(_cache_key_datarooms(), payload)
        return [DataroomType(**item) for item in payload]

    @strawberry.field
    def dataroom(self, info, id: int) -> DataroomType:
        db: Session = info.context["db"]
        dataroom = _get_dataroom(db, id)
        return DataroomType(**_dataroom_dict(dataroom))

    @strawberry.field
    def folder_contents(
        self,
        info,
        dataroom_id: int,
        parent_id: Optional[int] = None,
        search: Optional[str] = None,
    ) -> FolderContentsType:
        db: Session = info.context["db"]
        if parent_id is not None:
            folder = _get_folder(db, parent_id)
            if folder.dataroom_id != dataroom_id:
                raise GraphQLError("Folder does not belong to this dataroom.")

        search_term = (search or "").strip()
        cache_key = _cache_key_folder_contents(dataroom_id, parent_id, search_term)
        cached = cache_get(cache_key)
        if cached is not None:
            return FolderContentsType(
                folders=[FolderType(**item) for item in cached["folders"]],
                files=[FileType(**item) for item in cached["files"]],
            )

        folders = (
            db.execute(
                select(Folder)
                .where(Folder.dataroom_id == dataroom_id, Folder.parent_id == parent_id)
                .order_by(Folder.name.asc())
            )
            .scalars()
            .all()
        )
        file_stmt = (
            select(File)
            .where(File.dataroom_id == dataroom_id, File.folder_id == parent_id)
            .order_by(File.name.asc())
        )
        if search_term:
            file_stmt = file_stmt.where(File.name.ilike(f"%{search_term}%"))
        files = db.execute(file_stmt).scalars().all()
        payload = {
            "folders": [_folder_dict(item) for item in folders],
            "files": [_file_dict(item) for item in files],
        }
        cache_set(cache_key, payload)
        return FolderContentsType(
            folders=[FolderType(**item) for item in payload["folders"]],
            files=[FileType(**item) for item in payload["files"]],
        )

    @strawberry.field
    def folder_breadcrumb(self, info, folder_id: int) -> List[FolderType]:
        db: Session = info.context["db"]
        folder = _get_folder(db, folder_id)
        chain = []
        current = folder
        while current:
            chain.append(current)
            current = current.parent
        chain.reverse()
        return [FolderType(**_folder_dict(item)) for item in chain]

    @strawberry.field
    def file(self, info, id: int) -> FileType:
        db: Session = info.context["db"]
        file = _get_file(db, id)
        return FileType(**_file_dict(file))

    @strawberry.field
    def search_files(
        self, info, query: str, offset: int = 0, limit: int = 10
    ) -> SearchFilesResultType:
        cleaned = query.strip()
        if not cleaned:
            return SearchFilesResultType(items=[], total=0, has_more=False)

        safe_limit = max(1, min(limit, 50))
        safe_offset = max(offset, 0)

        db: Session = info.context["db"]
        total = (
            db.execute(select(func.count(File.id)).where(File.name.ilike(f"%{cleaned}%")))
            .scalar_one()
        )

        rows = (
            db.execute(
                select(File, Dataroom.name, Folder.name)
                .join(Dataroom, File.dataroom_id == Dataroom.id)
                .outerjoin(Folder, File.folder_id == Folder.id)
                .where(File.name.ilike(f"%{cleaned}%"))
                .order_by(File.updated_at.desc(), File.name.asc())
                .offset(safe_offset)
                .limit(safe_limit)
            )
            .all()
        )

        items = [
            SearchFileResultType(
                id=file.id,
                name=file.name,
                dataroom_id=file.dataroom_id,
                folder_id=file.folder_id,
                dataroom_name=dataroom_name,
                folder_name=folder_name,
                updated_at=_iso(file.updated_at),
                size=file.size,
            )
            for file, dataroom_name, folder_name in rows
        ]

        has_more = safe_offset + len(items) < total
        return SearchFilesResultType(items=items, total=total, has_more=has_more)


@strawberry.type
class Mutation:
    @strawberry.mutation
    def create_dataroom(self, info, name: str) -> DataroomType:
        cleaned = name.strip()
        if not cleaned:
            raise GraphQLError("Dataroom name is required.")
        db: Session = info.context["db"]
        dataroom = Dataroom(name=cleaned)
        db.add(dataroom)
        db.commit()
        db.refresh(dataroom)
        _invalidate_dataroom_cache()
        return DataroomType(**_dataroom_dict(dataroom))

    @strawberry.mutation
    def rename_dataroom(self, info, id: int, name: str) -> DataroomType:
        cleaned = name.strip()
        if not cleaned:
            raise GraphQLError("Dataroom name is required.")
        db: Session = info.context["db"]
        dataroom = _get_dataroom(db, id)
        dataroom.name = cleaned
        db.commit()
        db.refresh(dataroom)
        _invalidate_dataroom_cache()
        return DataroomType(**_dataroom_dict(dataroom))

    @strawberry.mutation
    def delete_dataroom(self, info, id: int) -> bool:
        db: Session = info.context["db"]
        dataroom = _get_dataroom(db, id)
        files = db.execute(select(File).where(File.dataroom_id == id)).scalars().all()
        for file in files:
            delete_file(file.storage_path)
        db.delete(dataroom)
        db.commit()
        _invalidate_dataroom_cache()
        _invalidate_folder_cache(id)
        return True

    @strawberry.mutation
    def create_folder(
        self, info, dataroom_id: int, name: str, parent_id: Optional[int] = None
    ) -> FolderType:
        cleaned = name.strip()
        if not cleaned:
            raise GraphQLError("Folder name is required.")
        db: Session = info.context["db"]
        _get_dataroom(db, dataroom_id)
        if parent_id is not None:
            parent = _get_folder(db, parent_id)
            if parent.dataroom_id != dataroom_id:
                raise GraphQLError("Parent folder does not belong to this dataroom.")
        _ensure_unique_folder_name(db, dataroom_id, parent_id, cleaned)
        folder = Folder(dataroom_id=dataroom_id, parent_id=parent_id, name=cleaned)
        db.add(folder)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise GraphQLError("Unable to create folder with that name.")
        db.refresh(folder)
        _invalidate_folder_cache(dataroom_id)
        return FolderType(**_folder_dict(folder))

    @strawberry.mutation
    def rename_folder(self, info, id: int, name: str) -> FolderType:
        cleaned = name.strip()
        if not cleaned:
            raise GraphQLError("Folder name is required.")
        db: Session = info.context["db"]
        folder = _get_folder(db, id)
        _ensure_unique_folder_name(db, folder.dataroom_id, folder.parent_id, cleaned, id)
        folder.name = cleaned
        db.commit()
        db.refresh(folder)
        _invalidate_folder_cache(folder.dataroom_id)
        return FolderType(**_folder_dict(folder))

    @strawberry.mutation
    def delete_folder(self, info, id: int) -> bool:
        db: Session = info.context["db"]
        folder = _get_folder(db, id)
        dataroom_id = folder.dataroom_id
        folder_ids = _collect_descendant_folder_ids(db, id)
        files = db.execute(select(File).where(File.folder_id.in_(folder_ids))).scalars().all()
        for file in files:
            delete_file(file.storage_path)
        for folder_id in reversed(folder_ids):
            target = db.get(Folder, folder_id)
            if target:
                db.delete(target)
        db.commit()
        _invalidate_folder_cache(dataroom_id)
        return True

    @strawberry.mutation
    def upload_file(
        self,
        info,
        dataroom_id: int,
        file: Upload,
        folder_id: Optional[int] = None,
        name: Optional[str] = None,
    ) -> FileType:
        db: Session = info.context["db"]
        _get_dataroom(db, dataroom_id)
        if folder_id is not None:
            folder = _get_folder(db, folder_id)
            if folder.dataroom_id != dataroom_id:
                raise GraphQLError("Folder does not belong to this dataroom.")
        incoming_name = (name or file.filename or "document.pdf").strip()
        final_name = incoming_name or "document.pdf"
        _ensure_unique_file_name(db, dataroom_id, folder_id, final_name)

        storage_path = ""
        try:
            storage_path, size, _, content_type = save_upload(file)
        except UploadValidationError as exc:
            raise GraphQLError(str(exc))

        record = File(
            dataroom_id=dataroom_id,
            folder_id=folder_id,
            name=final_name,
            storage_path=storage_path,
            content_type=content_type,
            size=size,
        )
        db.add(record)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            delete_file(storage_path)
            raise GraphQLError("Unable to upload file with that name.")
        db.refresh(record)
        _invalidate_folder_cache(dataroom_id)
        return FileType(**_file_dict(record))

    @strawberry.mutation
    def rename_file(self, info, id: int, name: str) -> FileType:
        cleaned = name.strip()
        if not cleaned:
            raise GraphQLError("File name is required.")
        db: Session = info.context["db"]
        record = _get_file(db, id)
        _ensure_unique_file_name(db, record.dataroom_id, record.folder_id, cleaned, id)
        record.name = cleaned
        db.commit()
        db.refresh(record)
        _invalidate_folder_cache(record.dataroom_id)
        return FileType(**_file_dict(record))

    @strawberry.mutation
    def delete_file(self, info, id: int) -> bool:
        db: Session = info.context["db"]
        record = _get_file(db, id)
        dataroom_id = record.dataroom_id
        delete_file(record.storage_path)
        db.delete(record)
        db.commit()
        _invalidate_folder_cache(dataroom_id)
        return True


schema = strawberry.Schema(
    query=Query,
    mutation=Mutation,
    config=StrawberryConfig(auto_camel_case=True),
)
