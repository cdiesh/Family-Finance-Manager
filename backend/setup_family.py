from sqlalchemy.orm import Session
from database import SessionLocal
import models
from core.security import get_password_hash
import os

def setup_family():
    db = SessionLocal()
    try:
        # 1. Identify "Husband/Primary" User
        # We assume the first user (or the one with christopherdiesh email) is the primary
        primary_email = os.getenv("PRIMARY_EMAIL", "admin@example.com")
        primary_user = db.query(models.User).filter(models.User.email == primary_email).first()
        
        if not primary_user:
            # Fallback to first user
            primary_user = db.query(models.User).first()
            if not primary_user:
                print("No users found. Please create a user first.")
                return

        print(f"Primary User: {primary_user.email} (ID: {primary_user.id})")

        # 2. Check/Create Household
        household = primary_user.household
        if not household:
            print("Creating Diesh Family Household...")
            household = models.Household(name="The Diesh Family")
            db.add(household)
            db.commit()
            db.refresh(household)
            
            # Link primary user
            primary_user.household_id = household.id
            db.commit()
        else:
            print(f"Existing Household found: {household.name}")

        # 3. Create/Link Wife User
        wife_email = os.getenv("SPOUSE_EMAIL", "spouse@example.com")
        # Or better -> ask user? For now I will hardcode the logic for "Spouse" and let user edit later or input via CLI
        
        # Let's prompt or just wait? User asked "how can my wife add her wells account"
        # I'll create a placeholder user for her.
        
        print("Creating Spouse account...")
        spouse_user = db.query(models.User).filter(models.User.email.like("%jennifer%")).first() 
        
        if not spouse_user:
             # Create new
             temp_pass = "Welcome123!"
             spouse_user = models.User(
                 email="spouse@family.com", # Generic for now to be safe
                 hashed_password=get_password_hash(temp_pass),
                 household_id=household.id
             )
             db.add(spouse_user)
             db.commit()
             print(f"Created Spouse User: spouse@family.com (Password: {temp_pass})")
        else:
            print(f"Spouse already exists: {spouse_user.email}")
            if spouse_user.household_id != household.id:
                 spouse_user.household_id = household.id
                 db.commit()
                 print("Linked Spouse to Household.")

        print("\nSetup Complete!")
        print(f"Household: {household.name} (ID: {household.id})")
        print(f" - Member 1: {primary_user.email}")
        print(f" - Member 2: {spouse_user.email}")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    setup_family()
