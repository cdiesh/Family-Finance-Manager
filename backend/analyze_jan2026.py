from database import SessionLocal
import models
from datetime import datetime, date

db = SessionLocal()

start = datetime(2026, 1, 1)
end = datetime(2026, 2, 1)

txs = db.query(models.Transaction).filter(
    models.Transaction.date >= start,
    models.Transaction.date < end,
    models.Transaction.amount > 0
).all()

print(f"--- JAN 2026 ANALYSIS ---")
print(f"Total Transactions: {len(txs)}")
print(f"Total Amount: ${sum(t.amount for t in txs):,.2f}")
print("\nTop 10 Largest Transactions:")
for t in sorted(txs, key=lambda x: x.amount, reverse=True)[:10]:
    print(f"{t.date.date()} | ${t.amount:,.2f} | {t.description} | {t.category}")
