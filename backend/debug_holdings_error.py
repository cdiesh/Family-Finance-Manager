import sys
import os
# Add backend to path
sys.path.append(os.getcwd())

from database import SessionLocal
from models import User, PlaidItem
from routers import plaid as plaid_router
from fastapi import HTTPException

# Mock dependencies
db = SessionLocal()
user = db.query(User).filter(User.email.ilike("%diesh%")).first()

print(f"User: {user.email} (ID: {user.id})")

# Find the item
item = db.query(PlaidItem).filter(PlaidItem.id == 5).first()
if not item:
    print("Item 5 not found in DB")
    sys.exit(1)

print(f"Found Item: {item.institution_name} (ID: {item.id}, AccessToken: {item.access_token[:10]}...)")

try:
    # Call logic manually
    # Copied from routers/plaid.py logic
    from plaid_client import client
    from plaid.model.investments_holdings_get_request import InvestmentsHoldingsGetRequest
    
    request = InvestmentsHoldingsGetRequest(access_token=item.access_token)
    print("Calling Plaid API...")
    response = client.investments_holdings_get(request)
    print("Success!")
    print(response['holdings'][:1])

except Exception as e:
    import traceback
    print("CAUGHT EXCEPTION:")
    traceback.print_exc()

db.close()
