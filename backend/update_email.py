from sqlalchemy.orm import Session
from database import SessionLocal
import models

def update_spouse_email():
    db = SessionLocal()
    try:
        # Find the placeholder spouse account
        old_email = "spouse@family.com"
        new_email = "jccd316@gmail.com"
        
        user = db.query(models.User).filter(models.User.email == old_email).first()
        if user:
            user.email = new_email
            db.commit()
            print(f"Updated email from {old_email} to {new_email}")
        else:
            # Check if likely already updated or different
            user = db.query(models.User).filter(models.User.email == new_email).first()
            if user:
                print(f"User {new_email} already exists.")
            else:
                print(f"User {old_email} not found.")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_spouse_email()
