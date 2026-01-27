from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import crud, models, schemas
from database import get_db
from routers.auth import get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[schemas.Task])
def read_tasks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    return crud.get_tasks(db=db, user_id=current_user.id)

@router.post("/", response_model=schemas.Task)
def create_task(
    task: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    return crud.create_task(db=db, task=task, user_id=current_user.id)

@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    deleted = crud.delete_task(db=db, task_id=task_id, user_id=current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"status": "deleted"}

@router.put("/{task_id}", response_model=schemas.Task)
def update_task(
    task_id: int,
    task_update: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    task = crud.update_task(db=db, task_id=task_id, task_update=task_update, user_id=current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task
