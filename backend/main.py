from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv

import models, crud, schemas
from database import SessionLocal, engine, get_db
from routers import plaid, auth, tasks, transactions

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Family Finance Manager API")

# Configure CORS (Before routers!)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for dev to fix CORS issue
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, tags=["auth"])
app.include_router(plaid.router, prefix="/plaid", tags=["plaid"])
app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
app.include_router(transactions.router, prefix="/transactions", tags=["transactions"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Family Finance Manager API", "status": "active"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "active"}

@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.post("/users/{user_id}/accounts/", response_model=schemas.Account)
def create_account_for_user(
    user_id: int, account: schemas.AccountCreate, db: Session = Depends(get_db)
):
    return crud.create_user_account(db=db, account=account, user_id=user_id)

@app.get("/users/{user_id}", response_model=schemas.User)
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user
