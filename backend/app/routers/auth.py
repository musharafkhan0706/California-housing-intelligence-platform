from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.db.database import get_db
from backend.app.db.models import User, Favorite, PredictionRecord, SearchHistory, AuditLog
from backend.app.schemas import UserRegister, UserLogin, UserResponse, TokenResponse
from backend.app.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    # Check existing email
    if db.query(User).filter(User.email == user_in.email.lower()).first():
        raise HTTPException(status_code=400, detail="An account with this email address already exists.")
    
    # Check existing username
    if db.query(User).filter(User.username == user_in.username).first():
        raise HTTPException(status_code=400, detail="This username is already taken.")
    
    new_user = User(
        email=user_in.email.lower(),
        username=user_in.username,
        full_name=user_in.full_name or user_in.username,
        hashed_password=hash_password(user_in.password),
        role="user",
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    audit = AuditLog(
        user_id=new_user.id,
        action="USER_REGISTER",
        resource="USERS",
        details=f"User {new_user.username} registered.",
        ip_address="127.0.0.1"
    )
    db.add(audit)
    db.commit()

    token = create_access_token({"sub": str(new_user.id), "role": new_user.role})
    return {"access_token": token, "token_type": "bearer", "user": new_user}

@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    query = db.query(User).filter(
        (User.username == credentials.username_or_email) | 
        (User.email == credentials.username_or_email.lower())
    )
    user = query.first()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="This user account has been deactivated.")

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    fav_count = db.query(Favorite).filter(Favorite.user_id == current_user.id).count()
    pred_count = db.query(PredictionRecord).filter(PredictionRecord.user_id == current_user.id).count()
    search_count = db.query(SearchHistory).filter(SearchHistory.user_id == current_user.id).count()
    
    return {
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "username": current_user.username,
            "full_name": current_user.full_name,
            "role": current_user.role,
            "created_at": current_user.created_at
        },
        "stats": {
            "saved_favorites": fav_count,
            "predictions_count": pred_count,
            "search_count": search_count
        }
    }
