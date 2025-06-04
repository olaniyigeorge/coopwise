from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr





class FeedbackCreate(BaseModel):
    full_name: str
    email: EmailStr
    subject: str
    message: str

class FeedbackDetail(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    subject: str
    message: str

    created_at: datetime
    updated_at: datetime


    model_config = ConfigDict(from_attributes=True)


