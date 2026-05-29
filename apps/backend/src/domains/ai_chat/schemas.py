from pydantic import BaseModel
from typing import List, Any

class AiChatBody(BaseModel):
    prompt: str

class AiChatHistoryResponse(BaseModel):
    messages: List[Any]
