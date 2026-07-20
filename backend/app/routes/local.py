from __future__ import annotations

from datetime import datetime, timezone
import json
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException

from ..core.security import DEFAULT_PROFILE_ID, LOCAL_USER_ID, require_profile_id, require_user
from ..db.deps import get_db


router = APIRouter()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


RESOURCE_TABLES: dict[str, dict[str, Any]] = {
    "subjects": {
        "table": "subjects",
        "fields": {"name": "name", "order": "order_num"},
        "required": ["name"],
        "order": "order_num ASC, created_at ASC",
    },
    "topics": {
        "table": "topics",
        "fields": {"subjectId": "subject_id", "name": "name", "order": "order_num", "description": "description"},
        "required": ["subjectId", "name"],
        "order": "order_num ASC, created_at ASC",
    },
    "subtopics": {
        "table": "subtopics",
        "fields": {"topicId": "topic_id", "name": "name", "order": "order_num", "description": "description"},
        "required": ["topicId", "name"],
        "order": "order_num ASC, created_at ASC",
    },
    "notes": {
        "table": "notes",
        "fields": {"topicId": "topic_id", "subtopicId": "subtopic_id", "title": "title", "content": "content"},
        "required": ["topicId", "title", "content"],
        "order": "updated_at DESC",
    },
    "questions": {
        "table": "questions",
        "fields": {
            "topicId": "topic_id",
            "subtopicId": "subtopic_id",
            "type": "type",
            "prompt": "prompt",
            "choices": "choices",
            "answerIndex": "answer_index",
            "explanation": "explanation",
            "sampleAnswer": "sample_answer",
        },
        "required": ["topicId", "type", "prompt"],
        "order": "created_at ASC",
        "json": {"choices"},
    },
    "study-sessions": {
        "table": "study_sessions",
        "stateKey": "studySessions",
        "fields": {
            "topicId": "topic_id",
            "subtopicId": "subtopic_id",
            "activityType": "activity_type",
            "startedAt": "started_at",
            "endedAt": "ended_at",
            "durationSec": "duration_sec",
            "mode": "mode",
            "difficulty": "difficulty",
        },
        "required": ["topicId", "activityType", "startedAt", "endedAt", "durationSec", "mode"],
        "order": "started_at DESC",
    },
    "review-schedules": {
        "table": "review_schedules",
        "stateKey": "reviewSchedules",
        "fields": {
            "topicId": "topic_id",
            "subtopicId": "subtopic_id",
            "originSessionId": "origin_session_id",
            "dueAt": "due_at",
            "status": "status",
        },
        "required": ["topicId", "originSessionId", "dueAt", "status"],
        "order": "due_at ASC",
    },
    "review-attempts": {
        "table": "review_attempts",
        "stateKey": "reviewAttempts",
        "fields": {
            "scheduleId": "schedule_id",
            "correctCount": "correct_count",
            "questionCount": "question_count",
            "accuracy": "accuracy",
            "durationSec": "duration_sec",
            "completedAt": "completed_at",
        },
        "required": ["scheduleId", "correctCount", "questionCount", "accuracy", "durationSec", "completedAt"],
        "order": "completed_at DESC",
    },
    "question-history": {
        "table": "question_history",
        "stateKey": "questionHistory",
        "fields": {
            "topicId": "topic_id",
            "subtopicId": "subtopic_id",
            "sessionId": "session_id",
            "correctCount": "correct_count",
            "wrongCount": "wrong_count",
            "blankCount": "blank_count",
            "notes": "notes",
        },
        "required": ["topicId", "correctCount", "wrongCount", "blankCount"],
        "order": "created_at DESC",
    },
    "activity-plan-items": {
        "table": "activity_plan_items",
        "stateKey": "activityPlanItems",
        "fields": {
            "topicId": "topic_id",
            "subtopicId": "subtopic_id",
            "title": "title",
            "teacherName": "teacher_name",
            "materialType": "material_type",
            "targetCount": "target_count",
            "completedCount": "completed_count",
            "status": "status",
        },
        "required": ["topicId", "title", "materialType", "targetCount", "completedCount", "status"],
        "order": "created_at ASC",
    },
}


def camelize(name: str) -> str:
    parts = name.split("_")
    return parts[0] + "".join(part[:1].upper() + part[1:] for part in parts[1:])


def normalize_row(row: dict[str, Any], json_fields: set[str] | None = None) -> dict[str, Any]:
    json_fields = json_fields or set()
    item: dict[str, Any] = {}
    for key, value in row.items():
        if key in {"user_id", "profile_id"}:
            continue
        out_key = "order" if key == "order_num" else camelize(key)
        if out_key in json_fields and isinstance(value, str):
            try:
                value = json.loads(value)
            except json.JSONDecodeError:
                value = []
        item[out_key] = value
    return item


async def ensure_profile_settings(db, profile_id: str, user_id: str) -> None:
    now = now_iso()
    await db.execute(
        """
        INSERT OR IGNORE INTO settings (
          id, user_id, profile_id, pomodoro_minutes, short_break_minutes,
          long_break_minutes, daily_goal_minutes, enable_sounds, theme, disable_progress_animations, updated_at
        ) VALUES (?, ?, ?, 25, 5, 15, 120, 1, 'dark', 0, ?)
        """,
        [profile_id, user_id, profile_id, now],
    )


async def list_resource(resource: str, db, user_id: str, profile_id: str) -> list[dict[str, Any]]:
    config = RESOURCE_TABLES[resource]
    result = await db.execute(
        f"SELECT * FROM {config['table']} WHERE user_id = ? AND profile_id = ? AND deleted_at IS NULL ORDER BY {config['order']}",
        [user_id, profile_id],
    )
    return [normalize_row(row, config.get("json")) for row in result.rows]


async def get_resource_or_404(resource: str, item_id: str, db, user_id: str, profile_id: str) -> dict[str, Any]:
    config = RESOURCE_TABLES[resource]
    result = await db.execute(
        f"SELECT * FROM {config['table']} WHERE id = ? AND user_id = ? AND profile_id = ? AND deleted_at IS NULL",
        [item_id, user_id, profile_id],
    )
    if not result.rows:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    return normalize_row(result.rows[0], config.get("json"))


def prepare_value(value: Any, is_json: bool) -> Any:
    if is_json and value is not None:
        return json.dumps(value, ensure_ascii=False)
    if isinstance(value, bool):
        return 1 if value else 0
    return value


@router.get("/app-state")
async def app_state(
    user=Depends(require_user),
    profile_id: str = Depends(require_profile_id),
    db=Depends(get_db),
):
    await ensure_profile_settings(db, profile_id, user["id"])
    profiles = await list_profiles(user=user, db=db)
    settings = await get_settings(user=user, profile_id=profile_id, db=db)
    completed = await get_completed_items(user=user, profile_id=profile_id, db=db)
    data: dict[str, Any] = {
        "profiles": profiles,
        "activeProfileId": profile_id,
        "settings": settings,
        "completedTopics": completed["completedTopics"],
        "completedSubtopics": completed["completedSubtopics"],
    }
    for resource, config in RESOURCE_TABLES.items():
        data[config.get("stateKey", resource)] = await list_resource(resource, db, user["id"], profile_id)
    return data


@router.get("/profiles")
async def list_profiles(user=Depends(require_user), db=Depends(get_db)):
    # Ensure the local user exists (but do NOT auto-create a default profile)
    await db.ensure_local_user()
    result = await db.execute(
        "SELECT * FROM profiles WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at ASC",
        [user["id"]],
    )
    return [
        {
            "id": row["id"],
            "name": row["name"],
            "avatar": row.get("avatar_id"),
            "createdAt": row.get("created_at"),
            "updatedAt": row.get("updated_at"),
        }
        for row in result.rows
    ]


@router.post("/profiles", status_code=201)
async def create_profile(body: dict[str, Any], user=Depends(require_user), db=Depends(get_db)):
    name = str(body.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Nome é obrigatório")
    profile_id = str(body.get("id") or uuid4())
    avatar = str(body.get("avatar") or body.get("avatarId") or "scholar")
    now = now_iso()
    # Ensure local user exists before creating the profile
    await db.ensure_local_user()
    await db.execute(
        "INSERT INTO profiles (id, user_id, name, avatar_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        [profile_id, user["id"], name, avatar, now, now],
    )
    await ensure_profile_settings(db, profile_id, user["id"])
    return {"id": profile_id, "name": name, "avatar": avatar, "createdAt": now, "updatedAt": now}


@router.put("/profiles/{profile_id}")
@router.put("/profiles")
async def update_profile(
    body: dict[str, Any],
    profile_id: str | None = None,
    user=Depends(require_user),
    db=Depends(get_db),
):
    target_id = profile_id or body.get("id")
    name = str(body.get("name") or "").strip()
    if not target_id or not name:
        raise HTTPException(status_code=400, detail="ID e nome são obrigatórios")
    avatar = str(body.get("avatar") or body.get("avatarId") or "scholar")
    now = now_iso()
    result = await db.execute(
        "UPDATE profiles SET name = ?, avatar_id = ?, updated_at = ? WHERE id = ? AND user_id = ?",
        [name, avatar, now, target_id, user["id"]],
    )
    if result.rows_affected == 0:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    return {"id": target_id, "name": name, "avatar": avatar, "updatedAt": now}


@router.delete("/profiles/{profile_id}")
@router.delete("/profiles")
async def delete_profile(
    profile_id: str | None = None,
    id: str | None = None,
    user=Depends(require_user),
    db=Depends(get_db),
):
    target_id = profile_id or id
    if not target_id:
        raise HTTPException(status_code=400, detail="ID é obrigatório")
    result = await db.execute("DELETE FROM profiles WHERE id = ? AND user_id = ?", [target_id, user["id"]])
    if result.rows_affected == 0:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    return {"success": True}


@router.get("/settings")
async def get_settings(
    user=Depends(require_user),
    profile_id: str = Depends(require_profile_id),
    db=Depends(get_db),
):
    await ensure_profile_settings(db, profile_id, user["id"])
    result = await db.execute(
        "SELECT * FROM settings WHERE user_id = ? AND profile_id = ? AND deleted_at IS NULL",
        [user["id"], profile_id],
    )
    row = result.rows[0]
    return {
        "id": row["id"],
        "pomodoroMinutes": row.get("pomodoro_minutes"),
        "shortBreakMinutes": row.get("short_break_minutes"),
        "longBreakMinutes": row.get("long_break_minutes"),
        "dailyGoalMinutes": row.get("daily_goal_minutes"),
        "enableSounds": bool(row.get("enable_sounds")),
        "theme": row.get("theme"),
        "disableProgressAnimations": bool(row.get("disable_progress_animations")),
        "updatedAt": row.get("updated_at"),
    }


@router.put("/settings")
async def update_settings(
    body: dict[str, Any],
    user=Depends(require_user),
    profile_id: str = Depends(require_profile_id),
    db=Depends(get_db),
):
    await ensure_profile_settings(db, profile_id, user["id"])
    fields = {
        "pomodoroMinutes": "pomodoro_minutes",
        "shortBreakMinutes": "short_break_minutes",
        "longBreakMinutes": "long_break_minutes",
        "dailyGoalMinutes": "daily_goal_minutes",
        "enableSounds": "enable_sounds",
        "theme": "theme",
        "disableProgressAnimations": "disable_progress_animations",
    }
    sets: list[str] = []
    args: list[Any] = []
    for key, column in fields.items():
        if key in body:
            sets.append(f"{column} = ?")
            args.append(prepare_value(body[key], False))
    if not sets:
        return await get_settings(user=user, profile_id=profile_id, db=db)
    now = now_iso()
    sets.append("updated_at = ?")
    args.extend([now, user["id"], profile_id])
    await db.execute(f"UPDATE settings SET {', '.join(sets)} WHERE user_id = ? AND profile_id = ?", args)
    return await get_settings(user=user, profile_id=profile_id, db=db)


@router.get("/completed-items")
async def get_completed_items(
    user=Depends(require_user),
    profile_id: str = Depends(require_profile_id),
    db=Depends(get_db),
):
    result = await db.execute(
        "SELECT item_id, item_type FROM completed_items WHERE user_id = ? AND profile_id = ?",
        [user["id"], profile_id],
    )
    return {
        "completedTopics": [row["item_id"] for row in result.rows if row["item_type"] == "topic"],
        "completedSubtopics": [row["item_id"] for row in result.rows if row["item_type"] == "subtopic"],
    }


@router.put("/completed-items/{item_type}/{item_id}")
async def set_completed_item(
    item_type: str,
    item_id: str,
    body: dict[str, Any],
    user=Depends(require_user),
    profile_id: str = Depends(require_profile_id),
    db=Depends(get_db),
):
    if item_type not in {"topic", "subtopic"}:
        raise HTTPException(status_code=400, detail="Tipo inválido")
    completed = bool(body.get("completed"))
    if completed:
        await db.execute(
            """
            INSERT OR IGNORE INTO completed_items (id, user_id, profile_id, item_id, item_type, completed_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            [str(uuid4()), user["id"], profile_id, item_id, item_type, now_iso()],
        )
    else:
        await db.execute(
            "DELETE FROM completed_items WHERE user_id = ? AND profile_id = ? AND item_id = ? AND item_type = ?",
            [user["id"], profile_id, item_id, item_type],
        )
    return await get_completed_items(user=user, profile_id=profile_id, db=db)


@router.get("/{resource}")
async def list_items(
    resource: str,
    user=Depends(require_user),
    profile_id: str = Depends(require_profile_id),
    db=Depends(get_db),
):
    if resource not in RESOURCE_TABLES:
        raise HTTPException(status_code=404, detail="Recurso não encontrado")
    return await list_resource(resource, db, user["id"], profile_id)


@router.post("/{resource}", status_code=201)
async def create_item(
    resource: str,
    body: dict[str, Any],
    user=Depends(require_user),
    profile_id: str = Depends(require_profile_id),
    db=Depends(get_db),
):
    if resource not in RESOURCE_TABLES:
        raise HTTPException(status_code=404, detail="Recurso não encontrado")
    config = RESOURCE_TABLES[resource]
    for key in config["required"]:
        if body.get(key) in (None, ""):
            raise HTTPException(status_code=400, detail=f"Campo obrigatório: {key}")

    item_id = str(body.get("id") or uuid4())
    created_at = str(body.get("createdAt") or now_iso())
    updated_at = str(body.get("updatedAt") or created_at)
    columns = ["id", "user_id", "profile_id", "created_at", "updated_at"]
    values: list[Any] = [item_id, user["id"], profile_id, created_at, updated_at]
    json_fields = config.get("json", set())
    for key, column in config["fields"].items():
        if key in body:
            columns.append(column)
            values.append(prepare_value(body[key], key in json_fields))
    if "order" in config["fields"] and "order" not in body:
        columns.append("order_num")
        values.append(0)

    placeholders = ", ".join("?" for _ in columns)
    await db.execute(
        f"INSERT INTO {config['table']} ({', '.join(columns)}) VALUES ({placeholders})",
        values,
    )
    return await get_resource_or_404(resource, item_id, db, user["id"], profile_id)


@router.put("/{resource}/reorder")
async def reorder_items(
    resource: str,
    body: dict[str, Any],
    user=Depends(require_user),
    profile_id: str = Depends(require_profile_id),
    db=Depends(get_db),
):
    if resource not in RESOURCE_TABLES or "order" not in RESOURCE_TABLES[resource]["fields"]:
        raise HTTPException(status_code=404, detail="Recurso não encontrado")
    ids = body.get("ids")
    if not isinstance(ids, list):
        raise HTTPException(status_code=400, detail="ids deve ser uma lista")
    table = RESOURCE_TABLES[resource]["table"]
    now = now_iso()
    for index, item_id in enumerate(ids):
        await db.execute(
            f"UPDATE {table} SET order_num = ?, updated_at = ? WHERE id = ? AND user_id = ? AND profile_id = ?",
            [index, now, item_id, user["id"], profile_id],
        )
    return await list_resource(resource, db, user["id"], profile_id)


@router.put("/{resource}/{item_id}")
async def update_item(
    resource: str,
    item_id: str,
    body: dict[str, Any],
    user=Depends(require_user),
    profile_id: str = Depends(require_profile_id),
    db=Depends(get_db),
):
    if resource not in RESOURCE_TABLES:
        raise HTTPException(status_code=404, detail="Recurso não encontrado")
    config = RESOURCE_TABLES[resource]
    json_fields = config.get("json", set())
    sets: list[str] = []
    args: list[Any] = []
    for key, column in config["fields"].items():
        if key in body:
            sets.append(f"{column} = ?")
            args.append(prepare_value(body[key], key in json_fields))
    if not sets:
        return await get_resource_or_404(resource, item_id, db, user["id"], profile_id)
    now = str(body.get("updatedAt") or now_iso())
    sets.append("updated_at = ?")
    args.extend([now, item_id, user["id"], profile_id])
    result = await db.execute(
        f"UPDATE {config['table']} SET {', '.join(sets)} WHERE id = ? AND user_id = ? AND profile_id = ?",
        args,
    )
    if result.rows_affected == 0:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    return await get_resource_or_404(resource, item_id, db, user["id"], profile_id)


@router.delete("/{resource}/{item_id}")
async def delete_item(
    resource: str,
    item_id: str,
    user=Depends(require_user),
    profile_id: str = Depends(require_profile_id),
    db=Depends(get_db),
):
    if resource not in RESOURCE_TABLES:
        raise HTTPException(status_code=404, detail="Recurso não encontrado")
    result = await db.execute(
        f"DELETE FROM {RESOURCE_TABLES[resource]['table']} WHERE id = ? AND user_id = ? AND profile_id = ?",
        [item_id, user["id"], profile_id],
    )
    if result.rows_affected == 0:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    return {"success": True}


@router.post("/data/import")
async def import_data(
    body: dict[str, Any],
    user=Depends(require_user),
    profile_id: str = Depends(require_profile_id),
    db=Depends(get_db),
):
    mode = body.get("mode") or "merge"
    data = body.get("data") or {}
    if mode == "replace":
        for config in RESOURCE_TABLES.values():
            await db.execute(
                f"DELETE FROM {config['table']} WHERE user_id = ? AND profile_id = ?",
                [user["id"], profile_id],
            )
        await db.execute(
            "DELETE FROM completed_items WHERE user_id = ? AND profile_id = ?",
            [user["id"], profile_id],
        )
    state_to_resource = {config.get("stateKey", resource): resource for resource, config in RESOURCE_TABLES.items()}
    for state_key, resource in state_to_resource.items():
        items = data.get(state_key) or []
        if not isinstance(items, list):
            continue
        for item in items:
            existing = await db.execute(
                f"SELECT id FROM {RESOURCE_TABLES[resource]['table']} WHERE id = ? AND user_id = ? AND profile_id = ?",
                [item.get("id"), user["id"], profile_id],
            )
            if existing.rows:
                await update_item(resource, item["id"], item, user=user, profile_id=profile_id, db=db)
            else:
                await create_item(resource, item, user=user, profile_id=profile_id, db=db)
    if isinstance(data.get("settings"), dict):
        await update_settings(data["settings"], user=user, profile_id=profile_id, db=db)
    return {"success": True}
