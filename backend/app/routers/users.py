from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import User, UserSkill, Skill
from app.schemas import (
    UserUpdate, 
    UserResponse, 
    UserSkillCreate, 
    UserSkillResponse,
    UserSearchResponse,
    SkillType
)
from app.core.auth import get_current_active_user

router = APIRouter()

@router.put("/me", response_model=UserResponse)
def update_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    for field, value in user_update.dict(exclude_unset=True).items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/skills", response_model=UserSkillResponse)
def add_skill(
    skill_data: UserSkillCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check if skill exists
    skill = db.query(Skill).filter(Skill.id == skill_data.skill_id).first()
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found"
        )
    
    # Check if user already has this skill
    existing_skill = db.query(UserSkill).filter(
        UserSkill.user_id == current_user.id,
        UserSkill.skill_id == skill_data.skill_id,
        UserSkill.type == skill_data.type
    ).first()
    
    if existing_skill:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already has this skill"
        )
    
    user_skill = UserSkill(
        user_id=current_user.id,
        skill_id=skill_data.skill_id,
        type=skill_data.type
    )
    
    db.add(user_skill)
    db.commit()
    db.refresh(user_skill)
    
    return user_skill

@router.get("/skills", response_model=List[UserSkillResponse])
def get_user_skills(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return current_user.skills

@router.get("/available-skills", response_model=List[dict])
def get_available_skills(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all available skills for selection"""
    skills = db.query(Skill).all()
    return [{"id": skill.id, "name": skill.name} for skill in skills]

@router.get("/search", response_model=dict)
def search_users(
    skill: Optional[str] = None,
    type: Optional[str] = None,
    availability: Optional[str] = None,
    page: int = 1,
    size: int = 10,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Search for users based on skills and availability"""
    # Build query for public users only
    query = db.query(User).filter(User.is_public == True)
    
    # Filter by skill if provided
    if skill:
        if type == "offered":
            query = query.join(UserSkill).join(Skill).filter(
                UserSkill.type == "offered",
                Skill.name.ilike(f"%{skill}%")
            )
        elif type == "wanted":
            query = query.join(UserSkill).join(Skill).filter(
                UserSkill.type == "wanted",
                Skill.name.ilike(f"%{skill}%")
            )
        else:
            # Search in both offered and wanted skills
            query = query.join(UserSkill).join(Skill).filter(
                Skill.name.ilike(f"%{skill}%")
            )
    
    # Filter by availability if provided
    if availability:
        query = query.filter(User.availability == availability)
    
    # Exclude current user from results
    query = query.filter(User.id != current_user.id)
    
    # Get total count for pagination
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * size
    users = query.offset(offset).limit(size).all()
    
    # Format results
    results = []
    for user in users:
        # Get user skills
        skills_offered = []
        skills_wanted = []
        
        for user_skill in user.skills:
            if user_skill.type == "offered":
                skills_offered.append(user_skill.skill.name)
            elif user_skill.type == "wanted":
                skills_wanted.append(user_skill.skill.name)
        
        # Calculate average rating (placeholder for now)
        rating = 4.5  # This would come from a ratings table
        
        results.append({
            "id": user.id,
            "name": user.name,
            "skills_offered": skills_offered,
            "skills_wanted": skills_wanted,
            "availability": user.availability,
            "profile_photo": user.profile_photo,
            "rating": rating,
            "location": user.location
        })
    
    return {
        "users": results,
        "total": total,
        "page": page,
        "size": size,
        "pages": (total + size - 1) // size
    }

@router.delete("/skills/{skill_id}")
def remove_skill(
    skill_id: str,
    skill_type: SkillType,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    user_skill = db.query(UserSkill).filter(
        UserSkill.user_id == current_user.id,
        UserSkill.skill_id == skill_id,
        UserSkill.type == skill_type
    ).first()
    
    if not user_skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found"
        )
    
    db.delete(user_skill)
    db.commit()
    
    return {"message": "Skill removed successfully"}

@router.get("/profile", response_model=dict)
def get_user_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's profile with skills"""
    # Get user skills
    skills_offered = []
    skills_wanted = []
    
    for user_skill in current_user.skills:
        if user_skill.type == "offered":
            skills_offered.append({
                "id": user_skill.skill_id,
                "name": user_skill.skill.name
            })
        elif user_skill.type == "wanted":
            skills_wanted.append({
                "id": user_skill.skill_id,
                "name": user_skill.skill.name
            })
    
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "location": current_user.location,
        "profile_photo": current_user.profile_photo,
        "is_public": current_user.is_public,
        "availability": current_user.availability,
        "role": current_user.role,
        "created_at": current_user.created_at,
        "updated_at": current_user.updated_at,
        "skills_offered": skills_offered,
        "skills_wanted": skills_wanted
    }

@router.patch("/profile", response_model=dict)
def update_user_profile(
    profile_data: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update user profile including skills"""
    try:
        # Update basic profile fields
        if "name" in profile_data:
            current_user.name = profile_data["name"]
        if "location" in profile_data:
            current_user.location = profile_data["location"]
        if "availability" in profile_data:
            current_user.availability = profile_data["availability"]
        if "is_public" in profile_data:
            current_user.is_public = profile_data["is_public"]
        if "profile_photo" in profile_data:
            current_user.profile_photo = profile_data["profile_photo"]
        
        # Update skills if provided
        if "skills_offered" in profile_data:
            # Remove existing offered skills
            db.query(UserSkill).filter(
                UserSkill.user_id == current_user.id,
                UserSkill.type == "offered"
            ).delete()
            
            # Add new offered skills
            for skill_data in profile_data["skills_offered"]:
                user_skill = UserSkill(
                    user_id=current_user.id,
                    skill_id=skill_data["id"],
                    type="offered"
                )
                db.add(user_skill)
        
        if "skills_wanted" in profile_data:
            # Remove existing wanted skills
            db.query(UserSkill).filter(
                UserSkill.user_id == current_user.id,
                UserSkill.type == "wanted"
            ).delete()
            
            # Add new wanted skills
            for skill_data in profile_data["skills_wanted"]:
                user_skill = UserSkill(
                    user_id=current_user.id,
                    skill_id=skill_data["id"],
                    type="wanted"
                )
                db.add(user_skill)
        
        db.commit()
        db.refresh(current_user)
        
        return {"message": "Profile updated successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update profile: {str(e)}"
        )

@router.get("/{user_id}", response_model=UserResponse)
def get_user_profile(
    user_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if not user.is_public and user.id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Profile is private"
        )
    
    return user 