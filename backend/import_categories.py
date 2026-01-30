from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, Category

# Define the categories found in the Excel analysis (2026 Tab)
INCOME_CATEGORIES = [
    "Jen Income",
    "Chris Income",
    "Webster LOC Draw",
    "Andrew Rent",
    "Other Income"
]

EXPENSE_CATEGORIES = [
    "Webster Mortgage",
    "1216 Leasing Fee",
    "Chase CC",
    "Michelle Helm Payment #3",
    "Eric Payment (1of 4)",
    "Daycare", # Creating union with 2025 as likely still relevant
    "BofA CC",
    "Apple CC", 
    "Student Loan Payment",
    "Tax Payment",
    "LOC Interest Payment"
]

def seed_categories():
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("Seeding Income Categories...")
        for name in INCOME_CATEGORIES:
            exists = db.query(Category).filter(Category.name == name).first()
            if not exists:
                cat = Category(name=name, type="income")
                db.add(cat)
                print(f"Added {name}")
            else:
                print(f"Skipped {name} (exists)")

        print("Seeding Expense Categories...")
        for name in EXPENSE_CATEGORIES:
            exists = db.query(Category).filter(Category.name == name).first()
            if not exists:
                cat = Category(name=name, type="expense")
                db.add(cat)
                print(f"Added {name}")
            else:
                print(f"Skipped {name} (exists)")
        
        db.commit()
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()
    print("Category seeding complete.")

if __name__ == "__main__":
    seed_categories()
