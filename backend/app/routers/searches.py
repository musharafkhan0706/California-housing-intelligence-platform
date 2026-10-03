import json
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.app.db.database import get_db
from backend.app.db.models import SearchHistory, User
from backend.app.auth import get_current_user

router = APIRouter(prefix="/searches", tags=["Search History"])

class SearchLogCreate(BaseModel):
    query_summary: str
    filter_params: Dict[str, Any]
    result_count: int

@router.get("/history")
def get_search_history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    history = db.query(SearchHistory).filter(
        SearchHistory.user_id == user.id
    ).order_by(SearchHistory.created_at.desc()).limit(30).all()

    return [
        {
            "id": h.id,
            "query_summary": h.query_summary,
            "filter_params": json.loads(h.filter_params),
            "result_count": h.result_count,
            "created_at": h.created_at
        }
        for h in history
    ]

@router.post("/history")
def record_search_history(
    req: SearchLogCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = SearchHistory(
        user_id=user.id,
        query_summary=req.query_summary,
        filter_params=json.dumps(req.filter_params),
        result_count=req.result_count
    )
    db.add(item)
    db.commit()
    return {"message": "Search logged."}

@router.delete("/history")
def clear_search_history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(SearchHistory).filter(SearchHistory.user_id == user.id).delete()
    db.commit()
    return {"message": "Search history cleared."}
