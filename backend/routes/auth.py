from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import UserCreate, UserLogin, Token, UserOut, PromoteRequest
from auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists."
        )

    existing_username = db.query(User).filter(User.username == user_data.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This username is already taken."
        )

    hashed = hash_password(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed,
        role="user",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Include role in JWT payload
    token = create_access_token(data={"sub": new_user.email, "role": new_user.role})
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(new_user)
    )


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Include role in JWT payload
    token = create_access_token(data={"sub": user.email, "role": user.role})
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(user)
    )


# ── Admin-only endpoints ──────────────────────────────────────────────────────

def require_admin(current_user: User = Depends(get_current_user)):
    """Dependency that enforces admin role."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required."
        )
    return current_user


@router.get("/admin/users", response_model=list[UserOut])
def get_all_users(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Return all registered users. Admin only."""
    return db.query(User).order_by(User.created_at.desc()).all()


@router.post("/admin/promote")
def promote_user(
    body: PromoteRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Promote or demote a user's role. Admin only."""
    if body.role not in ("admin", "user"):
        raise HTTPException(status_code=400, detail="Role must be 'admin' or 'user'.")
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.role = body.role
    db.commit()
    db.refresh(user)
    return {"message": f"{user.username} is now {user.role}", "user": UserOut.model_validate(user)}


@router.delete("/admin/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Delete a user account. Admin only. Cannot delete self."""
    if admin.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account.")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    db.delete(user)
    db.commit()
    return {"message": f"User {user.username} deleted."}