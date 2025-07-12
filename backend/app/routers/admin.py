from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.database import get_db
from app.models import User, SwapRequest, Feedback, UserRole
from app.schemas import AdminStats, UserResponse
from app.core.auth import get_current_active_user

router = APIRouter()

def get_admin_user(current_user: User = Depends(get_current_active_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

@router.get("/stats", response_model=AdminStats)
def get_admin_stats(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    total_users = db.query(func.count(User.id)).scalar()
    total_swaps = db.query(func.count(SwapRequest.id)).scalar()
    pending_swaps = db.query(func.count(SwapRequest.id)).filter(SwapRequest.status == "pending").scalar()
    completed_swaps = db.query(func.count(SwapRequest.id)).filter(SwapRequest.status == "accepted").scalar()
    total_feedback = db.query(func.count(Feedback.id)).scalar()
    
    # Calculate average rating
    avg_rating_result = db.query(func.avg(Feedback.rating)).scalar()
    average_rating = float(avg_rating_result) if avg_rating_result else 0.0
    
    return AdminStats(
        total_users=total_users,
        total_swaps=total_swaps,
        pending_swaps=pending_swaps,
        completed_swaps=completed_swaps,
        total_feedback=total_feedback,
        average_rating=average_rating
    )

@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    return db.query(User).offset(skip).limit(limit).all()

@router.put("/users/{user_id}/ban")
def ban_user(
    user_id: str,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot ban admin users"
        )
    
    user.is_public = False  # Make profile private as a form of banning
    db.commit()
    
    return {"message": f"User {user.name} has been banned"}

@router.put("/users/{user_id}/unban")
def unban_user(
    user_id: str,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_public = True
    db.commit()
    
    return {"message": f"User {user.name} has been unbanned"}

@router.get("/swaps", response_model=List[dict])
def get_all_swaps(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    query = db.query(SwapRequest)
    
    if status_filter:
        query = query.filter(SwapRequest.status == status_filter)
    
    swaps = query.offset(skip).limit(limit).all()
    
    # Convert to dict format for admin view
    result = []
    for swap in swaps:
        result.append({
            "id": swap.id,
            "sender_name": swap.sender.name,
            "receiver_name": swap.receiver.name,
            "sender_skill": swap.sender_skill,
            "receiver_skill": swap.receiver_skill,
            "status": swap.status,
            "created_at": swap.created_at,
            "message": swap.message
        })
    
    return result

@router.get("/feedback", response_model=List[dict])
def get_all_feedback(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    feedback_list = db.query(Feedback).offset(skip).limit(limit).all()
    
    # Convert to dict format for admin view
    result = []
    for feedback in feedback_list:
        result.append({
            "id": feedback.id,
            "from_user_name": feedback.from_user_rel.name,
            "to_user_name": feedback.to_user_rel.name,
            "rating": feedback.rating,
            "feedback_text": feedback.feedback_text,
            "created_at": feedback.created_at
        })
    
    return result

@router.delete("/swaps/{swap_id}")
def delete_swap(
    swap_id: str,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    swap = db.query(SwapRequest).filter(SwapRequest.id == swap_id).first()
    if not swap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Swap request not found"
        )
    
    db.delete(swap)
    db.commit()
    
    return {"message": "Swap request deleted successfully"}

@router.delete("/feedback/{feedback_id}")
def delete_feedback(
    feedback_id: str,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found"
        )
    
    db.delete(feedback)
    db.commit()
    
    return {"message": "Feedback deleted successfully"} 