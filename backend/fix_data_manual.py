from sqlalchemy.orm import Session
from database import SessionLocal
import models

def fix_data():
    db = SessionLocal()
    try:
        # 1. Fix "REVOLVING CREDIT" to be a loan/credit type so it shows negative
        revolving = db.query(models.Account).filter(models.Account.name == "REVOLVING CREDIT").first()
        if revolving:
            print(f"Updating {revolving.name} from {revolving.type} to 'loan'")
            revolving.type = "loan"
        
        # 2. Hide "BASIC BUSINESS CHECKING" and "SELECT BANKING"
        business = db.query(models.Account).filter(models.Account.name == "BASIC BUSINESS CHECKING").first()
        if business:
            print(f"Hiding {business.name}")
            business.is_hidden = True

        banking = db.query(models.Account).filter(models.Account.name == "SELECT BANKING").first()
        if banking:
            print(f"Hiding {banking.name}")
            banking.is_hidden = True

        db.commit()
        print("Data updates committed.")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_data()
