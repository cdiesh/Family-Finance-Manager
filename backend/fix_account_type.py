from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models

models.Base.metadata.create_all(bind=engine)
db = SessionLocal()

def fix_type():
    # Find the Excel Import account
    acc = db.query(models.Account).filter(models.Account.name == "Excel Import").first()
    if acc:
        print(f"Found account: {acc.name}, Type: {acc.type}")
        if acc.type == "depository":
            acc.type = "checking"
            db.commit()
            print("Fixed type to 'checking'.")
        else:
            print("Type is already compatible or different.")
    else:
        print("Account not found.")

if __name__ == "__main__":
    fix_type()
