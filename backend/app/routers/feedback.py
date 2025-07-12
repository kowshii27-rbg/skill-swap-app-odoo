from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import User, Feedback, SwapRequest
from app.schemas import FeedbackCreate, FeedbackResponse
from app.core.auth import get_current_active_user

router = APIRouter()

@router.post("/", response_model=FeedbackResponse)
def submit_feedback(
    feedback_data: FeedbackCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check if swap exists and is completed
    swap = db.query(SwapRequest).filter(SwapRequest.id == feedback_data.swap_id).first()
    if not swap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Swap request not found"
        )
    
    if swap.status != "accepted":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only submit feedback for completed swaps"
        )
    
    # Check if user is part of the swap
    if swap.sender_id != current_user.id and swap.receiver_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only submit feedback for your own swaps"
        )
    
    # Check if feedback already exists
    existing_feedback = db.query(Feedback).filter(
        Feedback.swap_id == feedback_data.swap_id,
        Feedback.from_user == current_user.id
    ).first()
    
    if existing_feedback:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already submitted feedback for this swap"
        )
    
    # Validate rating
    if feedback_data.rating < 1 or feedback_data.rating > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rating must be between 1 and 5"
        )
    
    feedback = Feedback(
        swap_id=feedback_data.swap_id,
        from_user=current_user.id,
        to_user=feedback_data.to_user,
        rating=feedback_data.rating,
        feedback_text=feedback_data.feedback_text
    )
    
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    
    return feedback

@router.get("/my-feedback", response_model=List[FeedbackResponse])
def get_my_feedback(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return db.query(Feedback).filter(Feedback.from_user == current_user.id).all()

@router.get("/received-feedback", response_model=List[FeedbackResponse])
def get_received_feedback(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return db.query(Feedback).filter(Feedback.to_user == current_user.id).all()

@router.get("/swap/{swap_id}", response_model=List[FeedbackResponse])
def get_swap_feedback(
    swap_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check if user is part of the swap
    swap = db.query(SwapRequest).filter(SwapRequest.id == swap_id).first()
    if not swap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Swap request not found"
        )
    
    if swap.sender_id != current_user.id and swap.receiver_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view feedback for your own swaps"
        )
    
    return db.query(Feedback).filter(Feedback.swap_id == swap_id).all()

@router.get("/user/{user_id}", response_model=List[FeedbackResponse])
def get_user_feedback(
    user_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Only show feedback for public users or if it's the current user
    if not user.is_public and user.id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot view feedback for private profiles"
        )
    
    return db.query(Feedback).filter(Feedback.to_user == user_id).all() 