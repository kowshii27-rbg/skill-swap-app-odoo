from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.database import Base
import enum

class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"

class SwapStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    CANCELLED = "cancelled"

class SkillType(str, enum.Enum):
    OFFERED = "offered"
    WANTED = "wanted"

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    location = Column(String, nullable=True)
    profile_photo = Column(String, nullable=True)
    is_public = Column(Boolean, default=True)
    availability = Column(String, nullable=True)
    role = Column(String, default=UserRole.USER)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    skills = relationship("UserSkill", back_populates="user")
    sent_requests = relationship("SwapRequest", foreign_keys="SwapRequest.sender_id", back_populates="sender")
    received_requests = relationship("SwapRequest", foreign_keys="SwapRequest.receiver_id", back_populates="receiver")
    feedback_given = relationship("Feedback", foreign_keys="Feedback.from_user", back_populates="from_user_rel")
    feedback_received = relationship("Feedback", foreign_keys="Feedback.to_user", back_populates="to_user_rel")

class Skill(Base):
    __tablename__ = "skills"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class UserSkill(Base):
    __tablename__ = "user_skills"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    skill_id = Column(String, ForeignKey("skills.id"), nullable=False)
    type = Column(String, nullable=False)  # "offered" or "wanted"
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="skills")
    skill = relationship("Skill")

class SwapRequest(Base):
    __tablename__ = "swap_requests"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    sender_id = Column(String, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(String, ForeignKey("users.id"), nullable=False)
    sender_skill = Column(String, nullable=False)
    receiver_skill = Column(String, nullable=False)
    message = Column(Text, nullable=True)
    status = Column(String, default=SwapStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_requests")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_requests")
    feedback = relationship("Feedback", back_populates="swap")

class Feedback(Base):
    __tablename__ = "feedback"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    swap_id = Column(String, ForeignKey("swap_requests.id"), nullable=False)
    from_user = Column(String, ForeignKey("users.id"), nullable=False)
    to_user = Column(String, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)
    feedback_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    swap = relationship("SwapRequest", back_populates="feedback")
    from_user_rel = relationship("User", foreign_keys=[from_user], back_populates="feedback_given")
    to_user_rel = relationship("User", foreign_keys=[to_user], back_populates="feedback_received") 