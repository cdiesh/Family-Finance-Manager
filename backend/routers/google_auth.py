from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests
import os
from datetime import timedelta

import crud, models, schemas
from database import get_db
from core import security


router = APIRouter()
print("DEBUG: Loading google_auth router...")

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

class GoogleLoginRequest(BaseModel):
    token: str

@router.get("/test")
def test_google_route():
    return {"status": "ok", "message": "Google router is reachable"}

@router.post("/login", response_model=schemas.Token)
def login_google(request: GoogleLoginRequest, db: Session = Depends(get_db)):
    try:
        # Verify the token
        id_info = id_token.verify_oauth2_token(request.token, requests.Request(), GOOGLE_CLIENT_ID)
        
        # Get user info
        google_sub = id_info['sub']
        email = id_info['email']
        
        # --- ACCESS CONTROL ---
        allowed_emails_str = os.getenv("ALLOWED_EMAILS", "")
        if allowed_emails_str:
            allowed_emails = [e.strip().lower() for e in allowed_emails_str.split(",") if e.strip()]
            if email.lower() not in allowed_emails:
                 raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access Denied for {email}. Not in Allowed Users.",
                )
        # ----------------------
        
        # Check if user exists
        user = crud.get_user_by_email(db, email=email)
        
        if user:
            # Update google_sub if missing (linking accounts)
            if not user.google_sub:
                user.google_sub = google_sub
                db.commit()
        else:
            # Create new user
            user = models.User(
                email=email,
                google_sub=google_sub,
                is_active=True,
                hashed_password=None # No password for Google users
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
        # Create access token
        access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = security.create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
        
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token",
            headers={"WWW-Authenticate": "Bearer"},
        )
