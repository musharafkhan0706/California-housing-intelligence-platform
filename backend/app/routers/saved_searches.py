import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.db.database import get_db
from backend.app.db.models import SavedSearch, User
from backend.app.schemas import SavedSearchCreate, SavedSearchResponse
from backend.app.auth import get_current_user

router = APIRouter(prefix="/saved-searches", tags=["Saved Searches"])

@router.get("", response_model=List[SavedSearchResponse])
def get_saved_searches(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    searches = db.query(SavedSearch).filter(
        SavedSearch.user_id == user.id
    ).order_by(SavedSearch.created_at.desc()).all()

    return [
        {
            "id": s.id,
            "title": s.title,
            "filter_params": json.loads(s.filter_params),
            "created_at": s.created_at
        }
        for s in searches
    ]

@router.post("", response_model=SavedSearchResponse, status_code=status.HTTP_201_CREATED)
def save_search(
    req: SavedSearchCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = SavedSearch(
        user_id=user.id,
        title=req.title,
        filter_params=json.dumps(req.filter_params)
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    return {
        "id": item.id,
        "title": item.title,
        "filter_params": req.filter_params,
        "created_at": item.created_at
    }

@router.delete("/{id}")
def delete_saved_search(
    id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(SavedSearch).filter(
        SavedSearch.id == id,
        SavedSearch.user_id == user.id
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Saved search criteria not found.")

    db.delete(item)
    db.commit()
    return {"message": "Saved search removed."}
