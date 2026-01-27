from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv

import models, crud, schemas
from database import SessionLocal, engine, get_db
from routers import plaid, auth, tasks, transactions, accounts, google_auth

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Family Finance Manager API")

@app.on_event("startup")
async def startup_event():
    print("SERVER STARTING - REGISTERED ROUTES:")
    for route in app.routes:
        print(f"ROUTE: {route.path} [{route.methods}]")

# Configure CORS (Before routers!)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for dev to fix CORS issue
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, tags=["auth"])
app.include_router(google_auth.router, prefix="/google", tags=["auth"])
app.include_router(accounts.router, prefix="/accounts", tags=["accounts"])
app.include_router(plaid.router, prefix="/plaid", tags=["plaid"])
app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
app.include_router(transactions.router, prefix="/transactions", tags=["transactions"])

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/debug/check")
def debug_check():
    return {"message": "Main is reachable", "routes": [r.path for r in app.routes]}

@app.get("/users/{user_id}", response_model=schemas.User)
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

# Keep direct execution for debugging, but clean up the rest
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
