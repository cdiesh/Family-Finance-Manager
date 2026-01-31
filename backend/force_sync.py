from sqlalchemy.orm import Session
from database import SessionLocal
import models
import crud
import schemas
from plaid_client import client
from plaid.model.accounts_balance_get_request import AccountsBalanceGetRequest
import plaid
import os

def force_sync():
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == os.getenv("PRIMARY_EMAIL", "admin@example.com")).first()
        items = db.query(models.PlaidItem).filter(models.PlaidItem.user_id == user.id).all()
        
        print(f"Syncing {len(items)} items for user {user.email}")
        
        for item in items:
            print(f"\n--- Syncing Item ID: {item.id} ({item.institution_name}) ---")
            try:
                request = AccountsBalanceGetRequest(access_token=item.access_token)
                response = client.accounts_balance_get(request)
                
                print(f"Found {len(response['accounts'])} accounts in Plaid response.")
                
                for acc in response['accounts']:
                    print(f"  - Account: {acc['name']} ({acc['type']}/{acc['subtype']})")
                    
                    # Logic copy from routers/plaid.py
                    p_type = acc.get('type', '')
                    p_subtype = acc.get('subtype', '')
                    
                    account_type = "checking" 
                    if p_type == 'investment': account_type = 'investment'
                    elif p_type == 'loan':
                        if p_subtype == 'mortgage': account_type = 'mortgage'
                        else: account_type = 'loan'
                    elif p_type == 'credit': account_type = 'credit_card'
                    elif p_type == 'depository':
                        if p_subtype == 'savings': account_type = 'savings'
                        else: account_type = 'checking'
                    
                    print(f"    -> Mapped to: {account_type}")
                    
                    account_schema = schemas.AccountCreate(
                        name=acc['name'],
                        type=account_type,
                        balance=acc['balances']['current'] or 0.0,
                        institution_name=item.institution_name or "Bank",
                        plaid_account_id=acc['account_id'],
                        is_hidden=False
                    )
                    crud.upsert_account(db, account_schema, user.id, item.id)
                    print(f"    -> Upserted.")
                    
            except plaid.ApiException as e:
                print(f"ERROR syncing item {item.id}: {e}")
                import json
                error_body = json.loads(e.body)
                print(f"Error Code: {error_body.get('error_code')}")
                print(f"Error Message: {error_body.get('error_message')}")

    except Exception as e:
        print(f"Script Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    force_sync()
