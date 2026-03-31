import logging
import time
from uuid import uuid4

from fastapi import FastAPI, Request
from starlette.responses import Response

logger = logging.getLogger("cph.audit")
logging.basicConfig(level=logging.INFO)


def register_middleware(app: FastAPI) -> None:
    @app.middleware("http")
    async def audit_middleware(request: Request, call_next):
        start = time.perf_counter()
        request_id = request.headers.get("x-request-id", str(uuid4()))
        actor = request.headers.get("x-user-id", "anonymous")
        effective_actor = request.headers.get("x-proxy-user", actor)

        response: Response = await call_next(request)

        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        logger.info(
            "audit request_id=%s actor=%s effective_actor=%s method=%s path=%s status=%s duration_ms=%s",
            request_id,
            actor,
            effective_actor,
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
        )
        response.headers["x-request-id"] = request_id
        return response
