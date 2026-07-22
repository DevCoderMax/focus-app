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
            "reviewOrder": "review_order",
            "totalReviews": "total_reviews",
            "reviewMode": "review_mode",
        },
        "required": ["topicId", "dueAt", "status"],
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
    "goals": {
        "table": "goals",
        "stateKey": "goals",
        "fields": {
            "title": "title",
            "description": "description",
            "goalType": "goal_type",
            "targetValue": "target_value",
            "currentValue": "current_value",
            "unit": "unit",
            "subjectId": "subject_id",
            "topicId": "topic_id",
            "period": "period",
            "startDate": "start_date",
            "endDate": "end_date",
            "status": "status",
        },
        "required": ["title", "goalType", "targetValue", "startDate"],
        "order": "created_at DESC",
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
        "enableAutoReviews": bool(row.get("enable_auto_reviews")),
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
        "enableAutoReviews": "enable_auto_reviews",
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




@router.get("/goals/analytics")
async def get_goals_analytics(
    tz_offset: int = 0,
    user=Depends(require_user),
    profile_id: str = Depends(require_profile_id),
    db=Depends(get_db),
):
    """Compute analytics from existing data and generate coaching messages.

    tz_offset: minutes returned by JS Date.getTimezoneOffset() on the client
    (UTC minus local, e.g. 180 for UTC-3). Used so "today" and every session
    date are evaluated in the user's local timezone, matching the Dashboard.
    """
    from datetime import datetime, timedelta
    import random

    def parse_local_date(iso_string: str) -> datetime.date:
        """Parse an ISO timestamp and return its date in the user's local timezone."""
        try:
            clean = iso_string.replace("Z", "+00:00")
            dt = datetime.fromisoformat(clean)
            # Normalize to naive UTC, then shift into the client's local frame.
            if dt.tzinfo is not None:
                dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
            return (dt - timedelta(minutes=tz_offset)).date()
        except Exception:
            return (datetime.now(timezone.utc) - timedelta(minutes=tz_offset)).date()

    now = datetime.now(timezone.utc) - timedelta(minutes=tz_offset)
    today = now.date()
    
    # Fetch all study sessions
    sessions_result = await db.execute(
        "SELECT * FROM study_sessions WHERE user_id = ? AND profile_id = ? AND deleted_at IS NULL",
        [user["id"], profile_id],
    )
    sessions = sessions_result.rows

    # Fetch topics and subjects (to resolve most/least studied subject)
    topics_result = await db.execute(
        "SELECT id, subject_id, name FROM topics WHERE user_id = ? AND profile_id = ? AND deleted_at IS NULL",
        [user["id"], profile_id],
    )
    topic_to_subject = {t["id"]: t.get("subject_id") for t in topics_result.rows}
    subjects_result = await db.execute(
        "SELECT id, name FROM subjects WHERE user_id = ? AND profile_id = ? AND deleted_at IS NULL",
        [user["id"], profile_id],
    )
    subject_names = {s["id"]: s.get("name") for s in subjects_result.rows}

    # Fetch question history
    qh_result = await db.execute(
        "SELECT * FROM question_history WHERE user_id = ? AND profile_id = ? AND deleted_at IS NULL",
        [user["id"], profile_id],
    )
    question_history = qh_result.rows
    
    # Fetch review schedules
    rs_result = await db.execute(
        "SELECT * FROM review_schedules WHERE user_id = ? AND profile_id = ? AND deleted_at IS NULL",
        [user["id"], profile_id],
    )
    review_schedules = rs_result.rows
    
    # Fetch review attempts
    ra_result = await db.execute(
        "SELECT * FROM review_attempts WHERE user_id = ? AND profile_id = ? AND deleted_at IS NULL",
        [user["id"], profile_id],
    )
    review_attempts = ra_result.rows
    
    # Calculate days since last session
    days_since_last = 0
    session_dates = set()
    for s in sessions:
        try:
            session_date = parse_local_date(s["started_at"])
            session_dates.add(session_date)
            days_diff = (today - session_date).days
            if days_diff >= 0 and (days_since_last == 0 or days_diff < days_since_last):
                days_since_last = days_diff
        except:
            pass
    
    if not session_dates:
        days_since_last = 999
    
    # Calculate streak
    current_streak = 0
    check_date = today
    # Se ainda não estudou hoje, não quebra a sequência — começa por ontem
    if check_date not in session_dates:
        check_date -= timedelta(days=1)
    while check_date in session_dates:
        current_streak += 1
        check_date -= timedelta(days=1)

    # Calculate longest streak (maior sequência histórica de dias consecutivos)
    longest_streak = 0
    if session_dates:
        run = 1
        longest_streak = 1
        for d in sorted(session_dates)[1:]:
            prev = d - timedelta(days=1)
            if prev in session_dates:
                run += 1
            else:
                run = 1
            if run > longest_streak:
                longest_streak = run
    
    # Calculate consistency score (last 30 days)
    thirty_days_ago = today - timedelta(days=30)
    active_days_30 = sum(1 for d in session_dates if d >= thirty_days_ago)
    consistency_score = min(100, int((active_days_30 / 30) * 100 * (1 + current_streak * 0.1)))

    # Calculate average minutes per day (last 30 days).
    # Divide by the number of days actually observed (capped at 30) instead of a
    # flat 30, so users who just started aren't unfairly penalized.
    total_minutes_30 = 0
    for s in sessions:
        try:
            session_date = parse_local_date(s["started_at"])
            if session_date >= thirty_days_ago:
                total_minutes_30 += s.get("duration_sec", 0) / 60
        except:
            pass
    if session_dates:
        first_date = min(session_dates)
        observed_days = min(30, (today - first_date).days + 1)
        observed_days = max(1, observed_days)
    else:
        observed_days = 30
    avg_minutes_per_day = total_minutes_30 / observed_days
    
    # Calculate blank answer rate
    total_correct = sum(q.get("correct_count", 0) for q in question_history)
    total_wrong = sum(q.get("wrong_count", 0) for q in question_history)
    total_blank = sum(q.get("blank_count", 0) for q in question_history)
    total_answers = total_correct + total_wrong + total_blank
    blank_rate = total_blank / total_answers if total_answers > 0 else 0
    
    # Calculate burnout risk
    burnout_risk = "none"
    if len(sessions) >= 10:
        recent_sessions = sorted(sessions, key=lambda x: x.get("started_at", ""), reverse=True)[:5]
        older_sessions = sorted(sessions, key=lambda x: x.get("started_at", ""), reverse=True)[5:10]
        recent_avg_duration = sum(s.get("duration_sec", 0) for s in recent_sessions) / len(recent_sessions) if recent_sessions else 0
        older_avg_duration = sum(s.get("duration_sec", 0) for s in older_sessions) / len(older_sessions) if older_sessions else 0
        
        if recent_avg_duration < older_avg_duration * 0.6 and blank_rate > 0.25:
            burnout_risk = "high"
        elif recent_avg_duration < older_avg_duration * 0.8 or blank_rate > 0.2:
            burnout_risk = "moderate"
        elif recent_avg_duration < older_avg_duration * 0.9:
            burnout_risk = "low"
    
    # Calculate motivation score
    frequency_score = min(100, active_days_30 * 3.33)
    duration_score = min(100, avg_minutes_per_day * 2)
    difficulty_scores = [s["difficulty"] for s in sessions if s.get("difficulty")]
    difficulty_score = (sum(difficulty_scores) / len(difficulty_scores) * 20) if difficulty_scores else 50
    improvement_score = 50  # Would need more complex calculation
    
    motivation_score = int(frequency_score * 0.3 + duration_score * 0.2 + difficulty_score * 0.25 + improvement_score * 0.25)
    
    # Risk level
    risk_level = "low"
    if days_since_last >= 999:
        risk_level = "low"  # New user, not at risk yet
    elif days_since_last > 5:
        risk_level = "high"
    elif days_since_last > 3:
        risk_level = "medium"
    
    # Mental state
    if days_since_last >= 999:
        mental_score = 75  # New user - neutral/positive
        mental_label = "Pronto para começar"
    else:
        mental_score = max(0, 100 - (blank_rate * 100) - (days_since_last * 3) - ((burnout_risk == "high") * 20))
        mental_label = "Focado"
        if mental_score < 30:
            mental_label = "Precisa de Descanso"
        elif mental_score < 50:
            mental_label = "Em Risco"
        elif mental_score < 70:
            mental_label = "Desacelerando"
        elif mental_score < 85:
            mental_label = "Estável"
    
    # Coaching message
    coaching = _generate_coaching_message(
        days_since_last=days_since_last,
        current_streak=current_streak,
        consistency_score=consistency_score,
        blank_rate=blank_rate,
        burnout_risk=burnout_risk,
        motivation_score=motivation_score
    )
    
    # Weekly pattern (minutes per day of week)
    weekly_pattern = [0] * 7
    for s in sessions:
        try:
            session_date = parse_local_date(s["started_at"])
            if session_date >= thirty_days_ago:
                day_of_week = session_date.weekday()
                weekly_pattern[day_of_week] += s.get("duration_sec", 0) / 60
        except:
            pass
    
    # Weekly report: current week vs last week (local timezone, Monday start)
    week_start = today - timedelta(days=today.weekday())
    last_week_start = week_start - timedelta(days=7)
    next_week_start = week_start + timedelta(days=7)

    def _in_range(iso_field: str, row: dict, start, end) -> bool:
        try:
            d = parse_local_date(row[iso_field])
            return start <= d < end
        except Exception:
            return False

    this_week_sessions = [s for s in sessions if _in_range("started_at", s, week_start, next_week_start)]
    last_week_sessions = [s for s in sessions if _in_range("started_at", s, last_week_start, week_start)]

    week_minutes = round(sum(s.get("duration_sec", 0) for s in this_week_sessions) / 60, 1)
    last_week_minutes = round(sum(s.get("duration_sec", 0) for s in last_week_sessions) / 60, 1)
    week_sessions_count = len(this_week_sessions)
    last_week_sessions_count = len(last_week_sessions)

    def _accuracy(qhs: list) -> float:
        c = sum(q.get("correct_count", 0) for q in qhs)
        w = sum(q.get("wrong_count", 0) for q in qhs)
        b = sum(q.get("blank_count", 0) for q in qhs)
        total = c + w + b
        return (c / total * 100) if total > 0 else 0

    this_week_qh = [q for q in question_history if _in_range("created_at", q, week_start, next_week_start)]
    last_week_qh = [q for q in question_history if _in_range("created_at", q, last_week_start, week_start)]
    week_accuracy = _accuracy(this_week_qh)
    last_week_accuracy = _accuracy(last_week_qh)

    # Average session length (last 30 days) — distinct from averageMinutesPerDay
    sessions_last_30 = sum(
        1 for s in sessions
        if _in_range("started_at", s, thirty_days_ago, today + timedelta(days=1))
    )
    avg_session_minutes = round(total_minutes_30 / sessions_last_30, 1) if sessions_last_30 else 0

    # Most/least studied subject (by minutes, last 30 days) + mode & weekday split
    minutes_by_subject: dict[str, float] = {}
    mode_minutes: dict[str, float] = {}
    weekend_minutes = 0.0
    weekday_minutes = 0.0
    for s in sessions:
        try:
            s_date = parse_local_date(s["started_at"])
        except Exception:
            continue
        if s_date < thirty_days_ago:
            continue
        mins = s.get("duration_sec", 0) / 60
        subject_id = topic_to_subject.get(s.get("topic_id"))
        if subject_id:
            minutes_by_subject[subject_id] = minutes_by_subject.get(subject_id, 0) + mins
        mode = s.get("mode") or "N/A"
        mode_minutes[mode] = mode_minutes.get(mode, 0) + mins
        if s_date.weekday() >= 5:
            weekend_minutes += mins
        else:
            weekday_minutes += mins

    if minutes_by_subject:
        most_id = max(minutes_by_subject, key=minutes_by_subject.get)
        least_id = min(minutes_by_subject, key=minutes_by_subject.get)
        most_studied_subject = subject_names.get(most_id) or "Nenhuma matéria ainda"
        least_studied_subject = (
            subject_names.get(least_id) or "N/A"
        ) if len(minutes_by_subject) > 1 else "N/A"
    else:
        most_studied_subject = "Nenhuma matéria ainda"
        least_studied_subject = "N/A"

    favorite_mode = max(mode_minutes, key=mode_minutes.get) if mode_minutes else "N/A"

    def period_window(period: str, start_date_iso: str | None, end_date_iso: str | None):
        """Return [start, end) local dates for a goal's active period, clamped to
        the goal's own startDate/endDate when present. `end` is exclusive."""
        if period == "daily":
            start = today
            end = today + timedelta(days=1)
        elif period == "weekly":
            start = today - timedelta(days=today.weekday())
            end = start + timedelta(days=7)
        elif period == "monthly":
            start = today.replace(day=1)
            # first day of next month
            end = (start.replace(day=28) + timedelta(days=4)).replace(day=1)
        else:  # "total" or unknown: from goal start (or epoch) through tomorrow
            start = None
            end = today + timedelta(days=1)
        # Clamp to the goal's own date range
        if start_date_iso:
            try:
                gs = parse_local_date(start_date_iso)
                start = gs if start is None else max(start, gs)
            except Exception:
                pass
        if end_date_iso:
            try:
                ge = parse_local_date(end_date_iso) + timedelta(days=1)
                end = min(end, ge)
            except Exception:
                pass
        return start, end

    def sum_minutes(start, end) -> float:
        total = 0.0
        for s in sessions:
            try:
                d = parse_local_date(s["started_at"])
            except Exception:
                continue
            if (start is None or d >= start) and d < end:
                total += s.get("duration_sec", 0) / 60
        return total

    def sum_questions(start, end) -> int:
        total = 0
        for q in question_history:
            try:
                d = parse_local_date(q["created_at"])
            except Exception:
                continue
            if (start is None or d >= start) and d < end:
                total += (
                    q.get("correct_count", 0)
                    + q.get("wrong_count", 0)
                    + q.get("blank_count", 0)
                )
        return total

    # Fetch and update goals with calculated currentValue
    goals_result = await db.execute(
        "SELECT * FROM goals WHERE user_id = ? AND profile_id = ? AND deleted_at IS NULL",
        [user["id"], profile_id],
    )
    goals = []
    for g in goals_result.rows:
        goal = dict(g)
        goal_id = goal["id"]
        goal_type = goal["goal_type"]
        unit = goal.get("unit", "min")
        period = goal.get("period", "daily")

        # Calculate currentValue based on actual data within the goal's period,
        # clamped to its own start/end dates.
        win_start, win_end = period_window(period, goal.get("start_date"), goal.get("end_date"))
        if goal_type == "study_time":
            minutes = sum_minutes(win_start, win_end)
            current_value = round(minutes / 60, 1) if unit == "h" else round(minutes, 1)
        elif goal_type == "volume":
            current_value = sum_questions(win_start, win_end)
        else:
            current_value = goal.get("current_value", 0)

        # Determine completion status (only toggle between active/completed;
        # leave 'abandoned'/'expired' untouched)
        target = goal.get("target_value") or 0
        status = goal["status"]
        if status in ("active", "completed"):
            reached = target > 0 and current_value >= target
            status = "completed" if reached else "active"

        # Persist current_value and/or status if either changed
        if current_value != goal.get("current_value", 0) or status != goal["status"]:
            await db.execute(
                "UPDATE goals SET current_value = ?, status = ?, updated_at = ? WHERE id = ?",
                [current_value, status, now_iso(), goal_id],
            )

        # Convert snake_case to camelCase for response
        goals.append({
            "id": goal_id,
            "title": goal["title"],
            "description": goal.get("description"),
            "goalType": goal_type,
            "targetValue": goal["target_value"],
            "currentValue": current_value,
            "unit": unit,
            "subjectId": goal.get("subject_id"),
            "topicId": goal.get("topic_id"),
            "period": period,
            "startDate": goal["start_date"],
            "endDate": goal.get("end_date"),
            "status": status,
            "createdAt": goal["created_at"],
            "updatedAt": goal["updated_at"],
        })

    goals_total = len(goals)
    goals_met = sum(1 for g in goals if g["status"] == "completed")
    
    return {
        "coachingMessage": coaching,
        "goals": goals,
        "consistency": {
            "currentStreak": current_streak,
            "longestStreak": longest_streak,
            "averageMinutesPerDay": round(avg_minutes_per_day, 1),
            "daysStudiedLast30": active_days_30,
            "consistencyScore": consistency_score,
            "weeklyPattern": weekly_pattern,
            "monthlyTrend": "stable",
            "daysSinceLastSession": days_since_last,
        },
        "motivation": {
            "overallScore": min(100, max(0, motivation_score)),
            "factors": {
                "frequency": min(100, frequency_score),
                "duration": min(100, duration_score),
                "difficulty": min(100, difficulty_score),
                "improvement": improvement_score,
            },
            "trend": "stable",
            "riskLevel": risk_level,
            "lastActivityDays": days_since_last,
        },
        "mentalState": {
            "overallLabel": mental_label,
            "overallScore": min(100, max(0, int(mental_score))),
            "indicators": {
                "blankAnswerRate": round(blank_rate * 100, 1),
                "difficultyTrend": "mixed",
                "sessionLengthConsistency": 50,
                "reviewAvoidance": 0,
                "timeOfDay": "N/A",
                "energyPattern": "distributed",
            },
            "burnoutRisk": burnout_risk,
        },
        "habits": {
            "preferredTime": "N/A",
            "averageSessionMinutes": avg_session_minutes,
            "favoriteMode": favorite_mode,
            "mostStudiedSubject": most_studied_subject,
            "leastStudiedSubject": least_studied_subject,
            "studyDaysPercentage": round(active_days_30 / 30 * 100, 1),
            "weekendVsWeekday": {
                "weekend": round(weekend_minutes, 1),
                "weekday": round(weekday_minutes, 1),
            },
        },
        "weeklyReport": {
            "totalMinutes": week_minutes,
            "totalSessions": week_sessions_count,
            "goalsMet": goals_met,
            "goalsTotal": goals_total,
            "topAchievement": "Nenhuma atividade ainda",
            "improvementArea": "Comece a estudar para ver progresso",
            "comparedToLastWeek": {
                "minutesChange": round(week_minutes - last_week_minutes, 1),
                "sessionsChange": week_sessions_count - last_week_sessions_count,
                "accuracyChange": round(week_accuracy - last_week_accuracy, 1),
            },
        },
    }


def _generate_coaching_message(
    days_since_last: int,
    current_streak: int,
    consistency_score: int,
    blank_rate: float,
    burnout_risk: str,
    motivation_score: int,
) -> dict:
    """Generate coaching message based on user state."""
    
    # Priority 0: New user (never studied)
    if days_since_last >= 999:
        return {
            "text": "Bem vindo ao FOCUS. Sua jornada, Seu Destino.",
            "subtext": "Crie uma matéria, escolha um tópico e comece sua primeira sessão. Um passo de cada vez.",
            "tone": "gentle",
            "icon": "Sparkles",
            "accentColor": "#a78bfa",
        }
    
    # Priority 1: Inactive user (main focus)
    if days_since_last >= 15:
        return {
            "text": "Você desapareceu. Seus tópicos estão empoeirando.",
            "subtext": "Comece por um tópico fácil. Só uma sessão para voltar ao ritmo.",
            "tone": "urgent",
            "icon": "AlertTriangle",
            "accentColor": "#ef4444",
        }
    elif days_since_last >= 8:
        return {
            "text": f"Mais de uma semana sem estudar. O esquecimento já começou.",
            "subtext": "Volte hoje — mesmo que sejam 15 minutos. O importante é recomeçar.",
            "tone": "urgent",
            "icon": "Clock",
            "accentColor": "#f59e0b",
        }
    elif days_since_last >= 4:
        return {
            "text": f"Já faz {days_since_last} dias. Cada dia que passa fica mais difícil voltar.",
            "subtext": "Não precisa estudar muito. Só precisa começar.",
            "tone": "direct",
            "icon": "TrendingDown",
            "accentColor": "#f59e0b",
        }
    elif days_since_last == 2:
        return {
            "text": "Seu último estudo foi anteontem.",
            "subtext": "Uma página hoje já quebra o ciclo. Tá ao seu alcance.",
            "tone": "gentle",
            "icon": "Coffee",
            "accentColor": "#9ca3af",
        }
    elif days_since_last == 1:
        return {
            "text": "Você ainda não estudou hoje. Não deixe virar costume.",
            "subtext": "Que tal uma sessão rápida hoje?",
            "tone": "gentle",
            "icon": "Sun",
            "accentColor": "#9ca3af",
        }
    
    # Priority 2: Studying but with problems
    if burnout_risk in ("high", "moderate"):
        return {
            "text": "Seu corpo está pedindo um descanso.",
            "subtext": "Reduza a carga hoje. Dormir bem também é estudar.",
            "tone": "empathy",
            "icon": "Heart",
            "accentColor": "#a78bfa",
        }
    
    if blank_rate > 0.3:
        return {
            "text": "Muitas respostas em branco ultimamente.",
            "subtext": "Isso pode ser cansaço ou falta de confiança. Que tal revisar o básico primeiro?",
            "tone": "warning",
            "icon": "AlertCircle",
            "accentColor": "#f59e0b",
        }
    
    # Priority 3: Consistent user making progress
    if current_streak >= 30:
        return {
            "text": f"{current_streak} dias de consistência. Você se transformou.",
            "subtext": "Não é mais sobre motivação — é sobre identidade. Você é alguém que estuda.",
            "tone": "celebration",
            "icon": "Trophy",
            "accentColor": "#22c55e",
        }
    elif current_streak >= 14:
        return {
            "text": f"14 dias seguidos. Isso não é sorte — é disciplina.",
            "subtext": "Você está construindo algo que ninguém pode tirar de você.",
            "tone": "celebration",
            "icon": "Flame",
            "accentColor": "#22c55e",
        }
    elif current_streak >= 7:
        return {
            "text": "Uma semana inteira! O hábito está se formando.",
            "subtext": "A maioria das pessoas desiste aqui. Você não é a maioria.",
            "tone": "celebration",
            "icon": "Zap",
            "accentColor": "#22c55e",
        }
    
    # Priority 4: Neutral state
    return {
        "text": "Você está no caminho. Continue.",
        "subtext": "Não precisa ser perfeito — só precisa continuar.",
        "tone": "gentle",
        "icon": "ArrowRight",
        "accentColor": "#9ca3af",
    }


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
