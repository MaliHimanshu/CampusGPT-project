from fastapi import APIRouter, Depends, HTTPException  # type: ignore[import]
from sqlalchemy.orm import Session  # type: ignore[import]
from pydantic import BaseModel  # type: ignore[import]
from app.core.database import get_db
from app.core.security import get_current_user, verify_password, get_password_hash
from app.models.user import User

router = APIRouter()


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


@router.get("/profile")
def get_profile(current_user: User = Depends(get_current_user)):
    """Return the current user's profile."""
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
    }


@router.patch("/profile/password")
def change_password(
    body: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Change the current user's password after verifying the old one."""
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

    current_user.hashed_password = get_password_hash(body.new_password)
    db.commit()
    return {"message": "Password updated successfully"}
