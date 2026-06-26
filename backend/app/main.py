from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes.local import router as local_router


def create_app() -> FastAPI:
    app = FastAPI(title="FOCUS Local API", version="1.0.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(local_router, prefix="/api", tags=["local"])
    return app


app = create_app()
