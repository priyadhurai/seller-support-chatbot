from typing import Any

from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str
    card: dict[str, Any] | None = None
