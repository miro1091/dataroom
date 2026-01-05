import os
import uuid
from pathlib import Path
from typing import Tuple

from strawberry.file_uploads import Upload

from .settings import settings


class UploadValidationError(ValueError):
    pass


def ensure_storage_dir() -> None:
    Path(settings.storage_dir).mkdir(parents=True, exist_ok=True)


def _clean_filename(name: str) -> str:
    base = os.path.basename(name)
    return base.replace("\x00", "").strip() or "document.pdf"


def save_upload(upload: Upload) -> Tuple[str, int, str, str]:
    ensure_storage_dir()
    original_name = _clean_filename(upload.filename or "document.pdf")
    content_type = upload.content_type or "application/octet-stream"

    if not original_name.lower().endswith(".pdf"):
        raise UploadValidationError("Only PDF files are supported.")
    if content_type not in ("application/pdf", "application/octet-stream"):
        raise UploadValidationError("Only PDF files are supported.")

    unique_name = f"{uuid.uuid4().hex}.pdf"
    storage_path = os.path.join(settings.storage_dir, unique_name)

    max_bytes = settings.max_upload_mb * 1024 * 1024
    size = 0
    with open(storage_path, "wb") as target:
        while True:
            chunk = upload.file.read(1024 * 1024)
            if not chunk:
                break
            size += len(chunk)
            if size > max_bytes:
                target.close()
                os.remove(storage_path)
                raise UploadValidationError(
                    f"File exceeds {settings.max_upload_mb}MB limit."
                )
            target.write(chunk)

    return storage_path, size, original_name, content_type


def delete_file(path: str) -> None:
    try:
        os.remove(path)
    except FileNotFoundError:
        return
