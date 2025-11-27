from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class Message(BaseModel):
    content: str
    role: str
    timestamp: datetime = datetime.now()
    channel: str
    customer_id: str

class ChatResponse(BaseModel):
    response: str
    confidence_score: float
    source_documents: Optional[List[str]] 