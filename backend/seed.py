from database import SessionLocal
import crud, schemas, models

db = SessionLocal()

def seed():
    email = "admin@family.com"
    password = "admin"
    
    user = crud.get_user_by_email(db, email)
    if not user:
        print(f"Creating admin user: {email}")
        crud.create_user(db, schemas.UserCreate(email=email, password=password))
        print("Done.")
    else:
        print("Admin user already exists.")

if __name__ == "__main__":
    seed()
