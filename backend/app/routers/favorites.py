from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.db.database import get_db
from backend.app.db.models import Favorite, HousingRecord, User
from backend.app.schemas import FavoriteCreate, FavoriteResponse
from backend.app.auth import get_current_user

router = APIRouter(prefix="/favorites", tags=["Favorites"])

@router.get("", response_model=List[FavoriteResponse])
def get_user_favorites(
    folder: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Favorite).filter(Favorite.user_id == user.id)
    if folder:
        query = query.filter(Favorite.folder_name == folder)
    return query.order_by(Favorite.created_at.desc()).all()

@router.post("", response_model=FavoriteResponse, status_code=status.HTTP_201_CREATED)
def add_favorite(
    fav: FavoriteCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify housing record exists
    record = db.query(HousingRecord).filter(HousingRecord.id == fav.housing_record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Housing district record not found.")

    # Check if already favorited
    existing = db.query(Favorite).filter(
        Favorite.user_id == user.id,
        Favorite.housing_record_id == fav.housing_record_id
    ).first()

    if existing:
        existing.personal_note = fav.personal_note or existing.personal_note
        existing.folder_name = fav.folder_name or existing.folder_name
        db.commit()
        db.refresh(existing)
        return existing

    new_fav = Favorite(
        user_id=user.id,
        housing_record_id=fav.housing_record_id,
        folder_name=fav.folder_name or "Favorites",
        personal_note=fav.personal_note
    )
    db.add(new_fav)
    db.commit()
    db.refresh(new_fav)
    return new_fav

@router.delete("/{record_id}")
def remove_favorite(
    record_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    fav = db.query(Favorite).filter(
        Favorite.user_id == user.id,
        Favorite.housing_record_id == record_id
    ).first()

    if not fav:
        raise HTTPException(status_code=404, detail="Saved record not found in favorites.")

    db.delete(fav)
    db.commit()
    return {"message": "Favorite removed successfully."}

@router.put("/{record_id}")
def update_favorite_note(
    record_id: int,
    note: str,
    folder: Optional[str] = "Favorites",
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    fav = db.query(Favorite).filter(
        Favorite.user_id == user.id,
        Favorite.housing_record_id == record_id
    ).first()

    if not fav:
        raise HTTPException(status_code=404, detail="Saved record not found.")

    fav.personal_note = note
    if folder:
        fav.folder_name = folder
    db.commit()
    return {"message": "Favorite updated successfully."}
