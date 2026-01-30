from sqlalchemy.orm import Session
from database import SessionLocal
import models

def unhide_personal():
    db = SessionLocal()
    try:
        # Unhide Account ID 4 (SELECT BANKING)
        # Based on previous inspection, ID 4 is "SELECT BANKING"
        
        acc = db.query(models.Account).filter(models.Account.id == 4).first()
        if acc:
            print(f"Unhiding {acc.name} (ID: {acc.id})")
            acc.is_hidden = False
            db.commit()
            print("Successfully unhidden.")
        else:
            print("Account 4 not found.")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    unhide_personal()
