from database import SessionLocal
import models
from sqlalchemy import func

db = SessionLocal()

# Find the specific mystery transaction
tx = db.query(models.Transaction).filter(
    models.Transaction.description.ilike("%t5kvoqupx%"),
    models.Transaction.amount > 230, 
    models.Transaction.amount < 240
).first()

if tx:
    print(f"FOUND: {tx.date.date()} | ${tx.amount} | {tx.description} | {tx.category}")
    print(f"Account ID: {tx.account_id}")
else:
    print("Transaction not found.")
