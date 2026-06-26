from __future__ import annotations

from dataclasses import dataclass
import os
from pathlib import Path

from dotenv import load_dotenv


_backend_dir = Path(__file__).resolve().parents[2]
_repo_root = Path(__file__).resolve().parents[3]
load_dotenv(_backend_dir / ".env", override=False)
load_dotenv(_repo_root / ".env", override=False)


@dataclass(frozen=True)
class Settings:
    sqlite_db_path: Path
    api_prefix: str = "/api"


def get_settings() -> Settings:
    configured = os.getenv("FOCUS_DB_PATH", "").strip()
    sqlite_db_path = Path(configured) if configured else _backend_dir / "data" / "focus-local.db"
    if not sqlite_db_path.is_absolute():
        sqlite_db_path = (_repo_root / sqlite_db_path).resolve()

    return Settings(sqlite_db_path=sqlite_db_path)
