from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"

class SwapStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    CANCELLED = "cancelled"

class SkillType(str, Enum):
    OFFERED = "offered"
    WANTED = "wanted"

# User schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr
    location: Optional[str] = None
    is_public: bool = True
    availability: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    profile_photo: Optional[str] = None
    is_public: Optional[bool] = None
    availability: Optional[str] = None

class UserResponse(UserBase):
    id: str
    profile_photo: Optional[str] = None
    role: UserRole
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Skill schemas
class SkillBase(BaseModel):
    name: str

class SkillCreate(SkillBase):
    pass

class SkillResponse(SkillBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

# UserSkill schemas
class UserSkillBase(BaseModel):
    skill_id: str
    type: SkillType

class UserSkillCreate(UserSkillBase):
    pass

class UserSkillResponse(UserSkillBase):
    id: str
    skill: SkillResponse
    created_at: datetime

    class Config:
        from_attributes = True

# SwapRequest schemas
class SwapRequestBase(BaseModel):
    receiver_id: str
    sender_skill: str
    receiver_skill: str
    message: Optional[str] = None

class SwapRequestCreate(SwapRequestBase):
    pass

class SwapRequestUpdate(BaseModel):
    status: SwapStatus

class SwapRequestResponse(SwapRequestBase):
    id: str
    sender_id: str
    status: SwapStatus
    created_at: datetime
    updated_at: datetime
    sender: UserResponse
    receiver: UserResponse

    class Config:
        from_attributes = True

# Feedback schemas
class FeedbackBase(BaseModel):
    rating: int
    feedback_text: Optional[str] = None

class FeedbackCreate(FeedbackBase):
    swap_id: str
    to_user: str

class FeedbackResponse(FeedbackBase):
    id: str
    swap_id: str
    from_user: str
    to_user: str
    created_at: datetime

    class Config:
        from_attributes = True

# Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Search schemas
class UserSearchResponse(BaseModel):
    id: str
    name: str
    location: Optional[str] = None
    profile_photo: Optional[str] = None
    availability: Optional[str] = None
    skills_offered: List[str] = []
    skills_wanted: List[str] = []

    class Config:
        from_attributes = True

# Admin schemas
class AdminStats(BaseModel):
    total_users: int
    total_swaps: int
    pending_swaps: int
    completed_swaps: int
    total_feedback: int
    average_rating: float 