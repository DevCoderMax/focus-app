from __future__ import annotations

from .client import SQLiteClient
from ..core.config import get_settings


_client: SQLiteClient | None = None


async def get_db() -> SQLiteClient:
    global _client
    if _client is None:
        _client = SQLiteClient(get_settings().sqlite_db_path)
    return _client
