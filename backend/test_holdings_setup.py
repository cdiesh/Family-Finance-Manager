import requests

BASE_URL = "http://localhost:8000"

def test_flow():
    # 1. Login to get token
    # Assuming user exists from previous context
    # Try logging in with the specific user email if known, or just use the dev login if available.
    # Actually, we rely on google login usually.
    # But I can access the DB to generate a token manually without login if I use logic from 'security'.
    # OR, I just use the crud to get the user and make a token.
    pass

# Hybrid approach: Use python to generate token, then requests to hit API
from database import SessionLocal
from models import User
from core import security
from datetime import timedelta

db = SessionLocal()
user = db.query(User).filter(User.email.ilike("%diesh%")).first()
if not user:
    print("User not found!")
    exit()

access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
token = security.create_access_token(
    data={"sub": user.email}, expires_delta=access_token_expires
)
headers = {"Authorization": f"Bearer {token}"}
print(f"Generated Token for {user.email}")

# 2. Get Accounts
print("\n--- GET /accounts/ ---")
r = requests.get(f"{BASE_URL}/accounts/", headers=headers)
if r.status_code != 200:
    print(f"Error: {r.status_code} {r.text}")
else:
    accounts = r.json()
    vanguard = next((a for a in accounts if "vanguard" in a['institution_name'].lower()), None)
    if vanguard:
        print(f"Found Vanguard Account: {vanguard['name']}")
        print(f"Item ID in JSON: {vanguard.get('item_id')}")
        
        # 3. Test Holdings
        if vanguard.get('item_id'):
            item_id = vanguard['item_id']
            print(f"\n--- GET /plaid/holdings/{item_id} ---")
            r2 = requests.get(f"{BASE_URL}/plaid/holdings/{item_id}", headers=headers)
            print(f"Status: {r2.status_code}")
            print(f"Response: {r2.text[:500]}...") # Truncate
        else:
            print("ERROR: item_id is MISSING in account object.")
    else:
        print("Vanguard account not found in response.")

db.close()
