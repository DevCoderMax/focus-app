# Backend Local (FastAPI)

API local do FOCUS open-source. Ela não usa login, billing, Turso ou sync cloud.

## Setup

```bash
python -m venv backend/.venv
source backend/.venv/bin/activate
pip install -r backend/requirements.txt
```

## Run

Na raiz do projeto:

```bash
python -m uvicorn app.main:app --app-dir backend --reload --port 8000
```

Ou pela raiz, junto com o frontend:

```bash
npm run dev
```

O banco SQLite é criado automaticamente em `backend/data/focus-local.db`.
Use `FOCUS_DB_PATH` para mudar o caminho.
