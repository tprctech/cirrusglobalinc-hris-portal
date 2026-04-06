from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from app.api.v1.router import api_router
from app.core.middleware import register_middleware
from app.db.init_db import create_tables


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


handler = Mangum(app)