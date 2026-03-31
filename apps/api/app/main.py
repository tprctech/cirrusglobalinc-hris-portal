from fastapi import FastAPI
from mangum import Mangum

from app.api.v1.router import api_router
from app.core.middleware import register_middleware

app = FastAPI(title="Cirrus Performance Hub API", version="0.1.0")
register_middleware(app)
app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


handler = Mangum(app)