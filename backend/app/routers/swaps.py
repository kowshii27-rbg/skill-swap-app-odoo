from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import User, SwapRequest, UserSkill, Skill
from app.schemas import (
    SwapRequestCreate,
    SwapRequestUpdate,
    SwapRequestResponse,
    SwapStatus
)
from app.core.auth import get_current_active_user

router = APIRouter()

@router.post("/request", response_model=SwapRequestResponse)
def create_swap_request(
    swap_data: SwapRequestCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check if receiver exists
    receiver = db.query(User).filter(User.id == swap_data.receiver_id).first()
    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receiver not found"
        )
    
    # Check if sender has the offered skill
    sender_skill = db.query(UserSkill).filter(
        UserSkill.user_id == current_user.id,
        UserSkill.skill_id == swap_data.sender_skill,
        UserSkill.type == "offered"
    ).first()
    
    if not sender_skill:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You don't have this skill to offer"
        )
    
    # Check if receiver has the wanted skill
    receiver_skill = db.query(UserSkill).filter(
        UserSkill.user_id == swap_data.receiver_id,
        UserSkill.skill_id == swap_data.receiver_skill,
        UserSkill.type == "offered"
    ).first()
    
    if not receiver_skill:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Receiver doesn't have this skill to offer"
        )
    
    # Check if there's already a pending request
    existing_request = db.query(SwapRequest).filter(
        SwapRequest.sender_id == current_user.id,
        SwapRequest.receiver_id == swap_data.receiver_id,
        SwapRequest.status == SwapStatus.PENDING
    ).first()
    
    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a pending request with this user"
        )
    
    swap_request = SwapRequest(
        sender_id=current_user.id,
        receiver_id=swap_data.receiver_id,
        sender_skill=swap_data.sender_skill,
        receiver_skill=swap_data.receiver_skill,
        message=swap_data.message
    )
    
    db.add(swap_request)
    db.commit()
    db.refresh(swap_request)
    
    return swap_request

@router.get("/my-requests", response_model=List[SwapRequestResponse])
def get_my_requests(
    status_filter: Optional[SwapStatus] = Query(None, description="Filter by status"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(SwapRequest).filter(
        SwapRequest.sender_id == current_user.id
    )
    
    if status_filter:
        query = query.filter(SwapRequest.status == status_filter)
    
    return query.all()

@router.get("/received-requests", response_model=List[SwapRequestResponse])
def get_received_requests(
    status_filter: Optional[SwapStatus] = Query(None, description="Filter by status"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(SwapRequest).filter(
        SwapRequest.receiver_id == current_user.id
    )
    
    if status_filter:
        query = query.filter(SwapRequest.status == status_filter)
    
    return query.all()

@router.put("/{request_id}/status", response_model=SwapRequestResponse)
def update_swap_status(
    request_id: str,
    status_update: SwapRequestUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    swap_request = db.query(SwapRequest).filter(SwapRequest.id == request_id).first()
    
    if not swap_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Swap request not found"
        )
    
    # Only the receiver can update the status
    if swap_request.receiver_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the receiver can update the status"
        )
    
    # Only pending requests can be updated
    if swap_request.status != SwapStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending requests can be updated"
        )
    
    swap_request.status = status_update.status
    db.commit()
    db.refresh(swap_request)
    
    return swap_request

@router.delete("/{request_id}")
def cancel_swap_request(
    request_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    swap_request = db.query(SwapRequest).filter(SwapRequest.id == request_id).first()
    
    if not swap_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Swap request not found"
        )
    
    # Only the sender can cancel
    if swap_request.sender_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the sender can cancel the request"
        )
    
    # Only pending requests can be cancelled
    if swap_request.status != SwapStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending requests can be cancelled"
        )
    
    swap_request.status = SwapStatus.CANCELLED
    db.commit()
    
    return {"message": "Swap request cancelled successfully"}

@router.get("/{request_id}", response_model=SwapRequestResponse)
def get_swap_request(
    request_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    swap_request = db.query(SwapRequest).filter(SwapRequest.id == request_id).first()
    
    if not swap_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Swap request not found"
        )
    
    # Only participants can view the request
    if swap_request.sender_id != current_user.id and swap_request.receiver_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own swap requests"
        )
    
    return swap_request 