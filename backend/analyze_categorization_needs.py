from database import SessionLocal
import models
from sqlalchemy import func

db = SessionLocal()

# Find Uncategorized or NULL Category transactions
uncategorized = db.query(
    models.Transaction.description, 
    func.count(models.Transaction.id).label('count'),
    func.sum(models.Transaction.amount).label('total_amount')
).filter(
    (models.Transaction.category == "Uncategorized") | (models.Transaction.category == None),
    models.Transaction.amount > 0, # Expenses only
    models.Transaction.date >= '2026-01-01',
    models.Transaction.date < '2026-02-01'
).group_by(models.Transaction.description).order_by(func.count(models.Transaction.id).desc()).all()

print(f"--- UNCATEGORIZED VENDORS (JAN 2026) ---")
print(f"Total Unique Descriptions: {len(uncategorized)}")

print("\nTop 20 Most Frequent Unknowns:")
for desc, count, total in uncategorized[:20]:
    print(f"- {desc} ({count} txs, Total: ${total:,.2f})")
