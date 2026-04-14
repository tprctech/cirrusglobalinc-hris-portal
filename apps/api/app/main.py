from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from mangum import Mangum

from app.api.v1.router import api_router
from app.core.middleware import register_middleware
from app.db.init_db import create_tables

DIST_DIR = Path(__file__).resolve().parent.parent.parent.parent / "web" / "client" / "dist"


@asynccontextmanager
async def lifespan(application: FastAPI):
    create_tables()
    yield


app = FastAPI(title="Cirrus Performance Hub API", version="0.1.0", lifespan=lifespan)
register_middleware(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


if DIST_DIR.is_dir():
    app.mount("/assets", StaticFiles(directory=str(DIST_DIR / "assets")), name="static-assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = DIST_DIR / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(DIST_DIR / "index.html"))


handler = Mangum(app)