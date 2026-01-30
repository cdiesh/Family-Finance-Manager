from sqlalchemy.orm import Session
from database import SessionLocal
import models

def check_items():
    db = SessionLocal()
    items = db.query(models.PlaidItem).all()
    print(f"ID | Institution | Status")
    print("-" * 30)
    for item in items:
        print(f"{item.id} | {item.institution_name} | {item.status}")
    db.close()

if __name__ == "__main__":
    check_items()
