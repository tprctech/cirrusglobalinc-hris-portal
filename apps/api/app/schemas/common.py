from pydantic import BaseModel, Field


class Message(BaseModel):
    message: str


class PaginatedResponse(BaseModel):
    items: list[dict]
    next_token: str | None = Field(default=None)
