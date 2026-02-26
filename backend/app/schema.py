from __future__ import annotations

from datetime import datetime
from typing import List, Optional

import strawberry
from strawberry.schema.config import StrawberryConfig
from graphql import GraphQLError
from sqlalchemy import Integer, String, asc, desc, literal, select, union_all
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from strawberry.file_uploads import Upload

from .models import Dataroom, File, Folder, User
from .redis_client import cache_delete, cache_get, cache_set
from .storage import UploadValidationError, delete_file, save_upload

ALLOWED_FILE_PAGE_SIZES = {10, 20, 50}
DEFAULT_FILE_PAGE_SIZE = 20
ALLOWED_SORT_FIELDS = {"name", "type", "size", "createdAt", "updatedAt"}
ALLOWED_SORT_DIRECTIONS = {"asc", "desc"}


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


def _cache_key_datarooms(user_id: int) -> str:
    return f"datarooms:user:{user_id}:list"


def _cache_key_folder_contents(
    user_id: int,
    dataroom_id: int,
    parent_id: Optional[int],
    search: Optional[str],
    sort_by: str,
    sort_direction: str,
    file_offset: int,
    file_limit: int,
) -> str:
    suffix = "root" if parent_id is None else str(parent_id)
    search_token = (search or "").strip().lower() or "all"
    return (
        f"user:{user_id}:dataroom:{dataroom_id}:folder:v2:{suffix}:search:{search_token}:"
        f"sort:{sort_by}:{sort_direction}:offset:{file_offset}:limit:{file_limit}"
    )


def _invalidate_dataroom_cache(user_id: int) -> None:
    cache_delete(_cache_key_datarooms(user_id))


def _invalidate_folder_cache(user_id: int, dataroom_id: int) -> None:
    cache_delete(f"user:{user_id}:dataroom:{dataroom_id}:folder:*")


def _get_dataroom(db: Session, dataroom_id: int, user_id: int) -> Dataroom:
    dataroom = (
        db.execute(
            select(Dataroom).where(Dataroom.id == dataroom_id, Dataroom.user_id == user_id)
        )
        .scalars()
        .first()
    )
    if not dataroom:
        raise GraphQLError("Dataroom not found.")
    return dataroom


def _get_folder(db: Session, folder_id: int, user_id: int) -> Folder:
    folder = (
        db.execute(
            select(Folder)
            .join(Dataroom, Folder.dataroom_id == Dataroom.id)
            .where(Folder.id == folder_id, Dataroom.user_id == user_id)
        )
        .scalars()
        .first()
    )
    if not folder:
        raise GraphQLError("Folder not found.")
    return folder


def _get_file(db: Session, file_id: int, user_id: int) -> File:
    file = (
        db.execute(
            select(File)
            .join(Dataroom, File.dataroom_id == Dataroom.id)
            .where(File.id == file_id, Dataroom.user_id == user_id)
        )
        .scalars()
        .first()
    )
    if not file:
        raise GraphQLError("File not found.")
    return file


def _get_user(info) -> User:
    user = info.context.get("user")
    if not user:
        raise GraphQLError("Unauthorized.")
    return user


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


def _normalize_sort(sort_by: Optional[str], sort_direction: Optional[str]) -> tuple[str, str]:
    normalized_sort_by = (sort_by or "name").strip()
    if normalized_sort_by not in ALLOWED_SORT_FIELDS:
        normalized_sort_by = "name"

    normalized_sort_direction = (sort_direction or "asc").strip().lower()
    if normalized_sort_direction not in ALLOWED_SORT_DIRECTIONS:
        normalized_sort_direction = "asc"

    return normalized_sort_by, normalized_sort_direction


def _normalize_file_limit(file_limit: int) -> int:
    return file_limit if file_limit in ALLOWED_FILE_PAGE_SIZES else DEFAULT_FILE_PAGE_SIZE


def _apply_direction(column, direction: str):
    return desc(column) if direction == "desc" else asc(column)


def _combined_sort_column(combined_query, sort_by: str):
    if sort_by == "createdAt":
        return combined_query.c.created_at
    if sort_by == "updatedAt":
        return combined_query.c.updated_at
    if sort_by == "size":
        return combined_query.c.size
    if sort_by == "type":
        return combined_query.c.content_type
    return combined_query.c.name


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
    items: List["DriveListItemType"]
    folders: List[FolderType]
    files: List[FileType]
    files_total: int
    files_has_more: bool
    file_offset: int
    file_limit: int


@strawberry.type(name="DriveListItem")
class DriveListItemType:
    key: str
    kind: str
    id: int
    name: str
    size: Optional[int]
    content_type: Optional[str]
    created_at: str
    updated_at: str


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
        user = _get_user(info)
        cached = cache_get(_cache_key_datarooms(user.id))
        if cached is not None:
            return [DataroomType(**item) for item in cached]

        db: Session = info.context["db"]
        datarooms = (
            db.execute(
                select(Dataroom)
                .where(Dataroom.user_id == user.id)
                .order_by(Dataroom.created_at.desc())
            )
            .scalars()
            .all()
        )
        payload = [_dataroom_dict(item) for item in datarooms]
        cache_set(_cache_key_datarooms(user.id), payload)
        return [DataroomType(**item) for item in payload]

    @strawberry.field
    def dataroom(self, info, id: int) -> DataroomType:
        db: Session = info.context["db"]
        user = _get_user(info)
        dataroom = _get_dataroom(db, id, user.id)
        return DataroomType(**_dataroom_dict(dataroom))

    @strawberry.field
    def folder_contents(
        self,
        info,
        dataroom_id: int,
        parent_id: Optional[int] = None,
        search: Optional[str] = None,
        sort_by: Optional[str] = None,
        sort_direction: Optional[str] = None,
        file_offset: int = 0,
        file_limit: int = DEFAULT_FILE_PAGE_SIZE,
    ) -> FolderContentsType:
        db: Session = info.context["db"]
        user = _get_user(info)
        _get_dataroom(db, dataroom_id, user.id)
        if parent_id is not None:
            folder = _get_folder(db, parent_id, user.id)
            if folder.dataroom_id != dataroom_id:
                raise GraphQLError("Folder does not belong to this dataroom.")

        search_term = (search or "").strip()
        normalized_sort_by, normalized_sort_direction = _normalize_sort(sort_by, sort_direction)
        safe_file_offset = max(file_offset, 0)
        safe_file_limit = _normalize_file_limit(file_limit)
        cache_key = _cache_key_folder_contents(
            user.id,
            dataroom_id,
            parent_id,
            search_term,
            normalized_sort_by,
            normalized_sort_direction,
            safe_file_offset,
            safe_file_limit,
        )
        cached = cache_get(cache_key)
        if cached is not None:
            cached_items = cached.get("items")
            if cached_items is None:
                cached_items = [
                    {
                        "key": f"folder-{item['id']}",
                        "kind": "folder",
                        "id": item["id"],
                        "name": item["name"],
                        "size": None,
                        "content_type": None,
                        "created_at": item["created_at"],
                        "updated_at": item["updated_at"],
                    }
                    for item in cached.get("folders", [])
                ] + [
                    {
                        "key": f"file-{item['id']}",
                        "kind": "file",
                        "id": item["id"],
                        "name": item["name"],
                        "size": item["size"],
                        "content_type": item["content_type"],
                        "created_at": item["created_at"],
                        "updated_at": item["updated_at"],
                    }
                    for item in cached.get("files", [])
                ]
            return FolderContentsType(
                items=[DriveListItemType(**item) for item in cached_items],
                folders=[FolderType(**item) for item in cached["folders"]],
                files=[FileType(**item) for item in cached["files"]],
                files_total=cached["files_total"],
                files_has_more=cached["files_has_more"],
                file_offset=cached["file_offset"],
                file_limit=cached["file_limit"],
            )

        folder_stmt = select(
            literal("folder").label("kind"),
            Folder.id.label("id"),
            Folder.name.label("name"),
            literal(None, type_=Integer).label("size"),
            literal(None, type_=String).label("content_type"),
            Folder.created_at.label("created_at"),
            Folder.updated_at.label("updated_at"),
        ).where(Folder.dataroom_id == dataroom_id, Folder.parent_id == parent_id)
        file_stmt = select(
            literal("file").label("kind"),
            File.id.label("id"),
            File.name.label("name"),
            File.size.label("size"),
            File.content_type.label("content_type"),
            File.created_at.label("created_at"),
            File.updated_at.label("updated_at"),
        ).where(File.dataroom_id == dataroom_id, File.folder_id == parent_id)
        if search_term:
            folder_stmt = folder_stmt.where(Folder.name.ilike(f"%{search_term}%"))
            file_stmt = file_stmt.where(File.name.ilike(f"%{search_term}%"))

        combined_query = union_all(folder_stmt, file_stmt).subquery()
        total_items = db.execute(select(func.count()).select_from(combined_query)).scalar_one()
        primary_sort = _apply_direction(
            _combined_sort_column(combined_query, normalized_sort_by),
            normalized_sort_direction,
        )
        if normalized_sort_by in {"size", "type"}:
            primary_sort = (
                primary_sort.nulls_last()
                if normalized_sort_direction == "asc"
                else primary_sort.nulls_first()
            )

        rows = db.execute(
            select(
                combined_query.c.kind,
                combined_query.c.id,
                combined_query.c.name,
                combined_query.c.size,
                combined_query.c.content_type,
                combined_query.c.created_at,
                combined_query.c.updated_at,
            )
            .order_by(
                primary_sort,
                combined_query.c.name.asc(),
                combined_query.c.id.asc(),
            )
            .offset(safe_file_offset)
            .limit(safe_file_limit)
        ).all()

        items_payload = []
        folders_payload = []
        files_payload = []
        for row in rows:
            created_at = _iso(row.created_at)
            updated_at = _iso(row.updated_at)
            items_payload.append(
                {
                    "key": f"{row.kind}-{row.id}",
                    "kind": row.kind,
                    "id": row.id,
                    "name": row.name,
                    "size": row.size,
                    "content_type": row.content_type,
                    "created_at": created_at,
                    "updated_at": updated_at,
                }
            )
            if row.kind == "folder":
                folders_payload.append(
                    {
                        "id": row.id,
                        "dataroom_id": dataroom_id,
                        "parent_id": parent_id,
                        "name": row.name,
                        "created_at": created_at,
                        "updated_at": updated_at,
                    }
                )
            else:
                files_payload.append(
                    {
                        "id": row.id,
                        "dataroom_id": dataroom_id,
                        "folder_id": parent_id,
                        "name": row.name,
                        "size": row.size or 0,
                        "content_type": row.content_type or "application/octet-stream",
                        "created_at": created_at,
                        "updated_at": updated_at,
                    }
                )

        has_more_files = safe_file_offset + len(rows) < total_items
        payload = {
            "items": items_payload,
            "folders": folders_payload,
            "files": files_payload,
            "files_total": total_items,
            "files_has_more": has_more_files,
            "file_offset": safe_file_offset,
            "file_limit": safe_file_limit,
        }
        cache_set(cache_key, payload)
        return FolderContentsType(
            items=[DriveListItemType(**item) for item in payload["items"]],
            folders=[FolderType(**item) for item in payload["folders"]],
            files=[FileType(**item) for item in payload["files"]],
            files_total=payload["files_total"],
            files_has_more=payload["files_has_more"],
            file_offset=payload["file_offset"],
            file_limit=payload["file_limit"],
        )

    @strawberry.field
    def folder_breadcrumb(self, info, folder_id: int) -> List[FolderType]:
        db: Session = info.context["db"]
        user = _get_user(info)
        folder = _get_folder(db, folder_id, user.id)
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
        user = _get_user(info)
        file = _get_file(db, id, user.id)
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
        user = _get_user(info)
        total = (
            db.execute(
                select(func.count(File.id))
                .join(Dataroom, File.dataroom_id == Dataroom.id)
                .where(Dataroom.user_id == user.id, File.name.ilike(f"%{cleaned}%"))
            )
            .scalar_one()
        )

        rows = (
            db.execute(
                select(File, Dataroom.name, Folder.name)
                .join(Dataroom, File.dataroom_id == Dataroom.id)
                .outerjoin(Folder, File.folder_id == Folder.id)
                .where(Dataroom.user_id == user.id, File.name.ilike(f"%{cleaned}%"))
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
        user = _get_user(info)
        dataroom = Dataroom(name=cleaned, user_id=user.id)
        db.add(dataroom)
        db.commit()
        db.refresh(dataroom)
        _invalidate_dataroom_cache(user.id)
        return DataroomType(**_dataroom_dict(dataroom))

    @strawberry.mutation
    def rename_dataroom(self, info, id: int, name: str) -> DataroomType:
        cleaned = name.strip()
        if not cleaned:
            raise GraphQLError("Dataroom name is required.")
        db: Session = info.context["db"]
        user = _get_user(info)
        dataroom = _get_dataroom(db, id, user.id)
        dataroom.name = cleaned
        db.commit()
        db.refresh(dataroom)
        _invalidate_dataroom_cache(user.id)
        return DataroomType(**_dataroom_dict(dataroom))

    @strawberry.mutation
    def delete_dataroom(self, info, id: int) -> bool:
        db: Session = info.context["db"]
        user = _get_user(info)
        dataroom = _get_dataroom(db, id, user.id)
        files = db.execute(select(File).where(File.dataroom_id == id)).scalars().all()
        for file in files:
            delete_file(file.storage_path)
        db.delete(dataroom)
        db.commit()
        _invalidate_dataroom_cache(user.id)
        _invalidate_folder_cache(user.id, id)
        return True

    @strawberry.mutation
    def create_folder(
        self, info, dataroom_id: int, name: str, parent_id: Optional[int] = None
    ) -> FolderType:
        cleaned = name.strip()
        if not cleaned:
            raise GraphQLError("Folder name is required.")
        db: Session = info.context["db"]
        user = _get_user(info)
        _get_dataroom(db, dataroom_id, user.id)
        if parent_id is not None:
            parent = _get_folder(db, parent_id, user.id)
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
        _invalidate_folder_cache(user.id, dataroom_id)
        return FolderType(**_folder_dict(folder))

    @strawberry.mutation
    def rename_folder(self, info, id: int, name: str) -> FolderType:
        cleaned = name.strip()
        if not cleaned:
            raise GraphQLError("Folder name is required.")
        db: Session = info.context["db"]
        user = _get_user(info)
        folder = _get_folder(db, id, user.id)
        _ensure_unique_folder_name(db, folder.dataroom_id, folder.parent_id, cleaned, id)
        folder.name = cleaned
        db.commit()
        db.refresh(folder)
        _invalidate_folder_cache(user.id, folder.dataroom_id)
        return FolderType(**_folder_dict(folder))

    @strawberry.mutation
    def delete_folder(self, info, id: int) -> bool:
        db: Session = info.context["db"]
        user = _get_user(info)
        folder = _get_folder(db, id, user.id)
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
        _invalidate_folder_cache(user.id, dataroom_id)
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
        user = _get_user(info)
        _get_dataroom(db, dataroom_id, user.id)
        if folder_id is not None:
            folder = _get_folder(db, folder_id, user.id)
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
        _invalidate_folder_cache(user.id, dataroom_id)
        return FileType(**_file_dict(record))

    @strawberry.mutation
    def rename_file(self, info, id: int, name: str) -> FileType:
        cleaned = name.strip()
        if not cleaned:
            raise GraphQLError("File name is required.")
        db: Session = info.context["db"]
        user = _get_user(info)
        record = _get_file(db, id, user.id)
        _ensure_unique_file_name(db, record.dataroom_id, record.folder_id, cleaned, id)
        record.name = cleaned
        db.commit()
        db.refresh(record)
        _invalidate_folder_cache(user.id, record.dataroom_id)
        return FileType(**_file_dict(record))

    @strawberry.mutation
    def delete_file(self, info, id: int) -> bool:
        db: Session = info.context["db"]
        user = _get_user(info)
        record = _get_file(db, id, user.id)
        dataroom_id = record.dataroom_id
        delete_file(record.storage_path)
        db.delete(record)
        db.commit()
        _invalidate_folder_cache(user.id, dataroom_id)
        return True

    @strawberry.mutation
    def delete_files(self, info, ids: List[int]) -> int:
        db: Session = info.context["db"]
        user = _get_user(info)
        unique_ids = sorted({file_id for file_id in ids if file_id > 0})
        if not unique_ids:
            return 0

        records = (
            db.execute(
                select(File)
                .join(Dataroom, File.dataroom_id == Dataroom.id)
                .where(File.id.in_(unique_ids), Dataroom.user_id == user.id)
            )
            .scalars()
            .all()
        )
        if len(records) != len(unique_ids):
            raise GraphQLError("One or more files could not be deleted.")

        dataroom_ids = set()
        for record in records:
            dataroom_ids.add(record.dataroom_id)
            delete_file(record.storage_path)
            db.delete(record)

        db.commit()
        for dataroom_id in dataroom_ids:
            _invalidate_folder_cache(user.id, dataroom_id)
        return len(records)


schema = strawberry.Schema(
    query=Query,
    mutation=Mutation,
    config=StrawberryConfig(auto_camel_case=True),
)
