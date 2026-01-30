from database import SessionLocal
import models

db = SessionLocal()

# 1. Categorize Chase Travel (Variable)
tx_travel = db.query(models.Transaction).filter(models.Transaction.description.ilike("%t5kvoqupx%")).first()
if tx_travel:
    print(f"Updating Travel: {tx_travel.description}")
    tx_travel.category = "Travel"
    tx_travel.is_fixed = False
    tx_travel.tags = "One-Off"

# 2. Categorize Disney+ (Fixed)
tx_disney = db.query(models.Transaction).filter(models.Transaction.description.ilike("%Disney Plus%")).first()
if tx_disney:
    print(f"Updating Disney+: {tx_disney.description}")
    tx_disney.category = "Subscription"
    tx_disney.is_fixed = True

db.commit()
print("Manual categorization complete.")
