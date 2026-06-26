from __future__ import annotations

from typing import Any

from fastapi import Depends, Header, HTTPException

from ..db.deps import get_db


LOCAL_USER_ID = "local-user"
DEFAULT_PROFILE_ID = "default"


async def require_user() -> dict[str, Any]:
    return {
        "id": LOCAL_USER_ID,
        "email": "local@focus.local",
        "name": "Usuário Local",
    }


async def require_profile_id(
    x_profile_id: str | None = Header(default=None, alias="X-Profile-Id"),
    user: dict[str, Any] = Depends(require_user),
    db=Depends(get_db),
) -> str:
    profile_id = (x_profile_id or DEFAULT_PROFILE_ID).strip() or DEFAULT_PROFILE_ID
    result = await db.execute(
        "SELECT id FROM profiles WHERE id = ? AND user_id = ? AND deleted_at IS NULL",
        [profile_id, user["id"]],
    )
    if not result.rows:
        if profile_id == DEFAULT_PROFILE_ID:
            await db.ensure_default_profile()
            return DEFAULT_PROFILE_ID
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    return profile_id
