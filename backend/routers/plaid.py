from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.products import Products
from plaid.model.country_code import CountryCode
from plaid.model.accounts_balance_get_request import AccountsBalanceGetRequest
import plaid

from database import get_db
from routers.auth import get_current_active_user
import models, crud, schemas
from plaid_client import client

router = APIRouter()

class PublicTokenRequest(BaseModel):
    public_token: str
    institution_name: str | None = None
    # user_id removed, inferred from token

@router.post("/create_link_token")
def create_link_token(current_user: models.User = Depends(get_current_active_user)):
    # products = [Products("transactions"), Products("auth")]
    # Sandbox requires fewer products to start simple
    request = LinkTokenCreateRequest(
        products=[Products("transactions")],
        client_name="Family Finance Manager",
        country_codes=[CountryCode("US")],
        language="en",
        user=LinkTokenCreateRequestUser(
            client_user_id=str(current_user.id)
        )
    )
    response = client.link_token_create(request)
    return response.to_dict()

@router.post("/exchange_public_token")
def exchange_public_token(
    request: PublicTokenRequest, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    exchange_request = ItemPublicTokenExchangeRequest(
        public_token=request.public_token
    )
    exchange_response = client.item_public_token_exchange(exchange_request)
    access_token = exchange_response['access_token']
    item_id = exchange_response['item_id']
    
    # Store access token in DB
    plaid_item = models.PlaidItem(
        user_id=current_user.id,
        access_token=access_token,
        item_id=item_id,
        institution_name=request.institution_name or "Unknown Bank"
    )
    db.add(plaid_item)
    db.commit()
    
    return {"status": "success", "item_id": item_id}
@router.post("/sync_accounts")
def sync_accounts_for_user(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # 1. Get all items for user
    items = db.query(models.PlaidItem).filter(models.PlaidItem.user_id == current_user.id).all()
    
    synced_count = 0
    for item in items:
        try:
            # 2. Fetch from Plaid
            request = AccountsBalanceGetRequest(access_token=item.access_token)
            response = client.accounts_balance_get(request)
            
            # 3. Upsert to DB
            for acc in response['accounts']:
                account_schema = schemas.AccountCreate(
                    name=acc['name'],
                    type=acc['type'], # Map this? For now passing string
                    balance=acc['balances']['current'],
                    institution_name=item.institution_name or "Bank",
                    plaid_account_id=acc['account_id']
                )
                crud.upsert_account(db, account_schema, current_user.id, item.id)
                synced_count += 1
                
        except plaid.ApiException as e:
            print(f"Error syncing item {item.id}: {e}")
            
@router.post("/sync_transactions")
def sync_transactions_for_user(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # 1. Get items
    items = db.query(models.PlaidItem).filter(models.PlaidItem.user_id == current_user.id).all()
    
    from datetime import datetime, timedelta
    from plaid.model.transactions_get_request import TransactionsGetRequest
    from plaid.model.transactions_get_request_options import TransactionsGetRequestOptions

    start_date = (datetime.now() - timedelta(days=30)).date()
    end_date = datetime.now().date()
    
    synced_count = 0
    
    for item in items:
        try:
            request = TransactionsGetRequest(
                access_token=item.access_token,
                start_date=start_date,
                end_date=end_date,
                options=TransactionsGetRequestOptions(
                    include_personal_finance_category=True
                )
            )
            response = client.transactions_get(request)
            
            # Map Plaid Accounts to DB Accounts
            # We need to find the local DB account_id for each plaid_account_id
            db_accounts = db.query(models.Account).filter(models.Account.item_id == item.id).all()
            acct_map = {acc.plaid_account_id: acc.id for acc in db_accounts}
            
            for tx in response['transactions']:
                if tx['account_id'] in acct_map:
                    local_account_id = acct_map[tx['account_id']]
                    
                    tx_schema = schemas.TransactionCreate(
                        amount=tx['amount'],
                        description=tx['name'],
                        date=tx['date'],
                        category=tx['category'][0] if tx['category'] else "Uncategorized",
                        plaid_transaction_id=tx['transaction_id']
                    )
                    
                    crud.upsert_transaction(db, tx_schema, local_account_id)
                    synced_count += 1
                    
        except plaid.ApiException as e:
            print(f"Error syncing transactions for item {item.id}: {e}")

    return {"status": "success", "synced": synced_count}
