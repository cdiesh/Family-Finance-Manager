from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models, crud
from core import security

models.Base.metadata.create_all(bind=engine)
db = SessionLocal()

def list_users():
    users = db.query(models.User).all()
    print("\n--- Users ---")
    for u in users:
        print(f"ID: {u.id} | Email: {u.email} | Google: {u.google_sub} | Has Password: {bool(u.hashed_password)}")
    return users

def set_password(email, password):
    user = crud.get_user_by_email(db, email=email)
    if user:
        user.hashed_password = security.get_password_hash(password)
        db.commit()
        print(f"Password set for {email}.")
    else:
        print(f"User {email} not found.")

def create_admin():
    email = "admin@example.com"
    password = "password123"
    user = crud.get_user_by_email(db, email=email)
    if not user:
        user = models.User(
            email=email,
            is_active=True,
            hashed_password=security.get_password_hash(password)
        )
        db.add(user)
        db.commit()
        print(f"Created admin: {email} / {password}")
    else:
        print(f"Admin already exists: {email}")

if __name__ == "__main__":
    users = list_users()
    if not users:
        create_admin()
    else:
        # Pick the first user and set password
        u = users[0]
        print(f"Setting password for {u.email}...")
        set_password(u.email, "password123")
