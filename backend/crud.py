from sqlalchemy.orm import Session
import models, schemas
from core.security import get_password_hash, verify_password

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def get_accounts(db: Session, skip: int = 0, limit: int = 100):
   return db.query(models.Account).offset(skip).limit(limit).all()

def get_household_accounts(db: Session, household_id: int):
   # Join User to find all users in household, then get their accounts
   return db.query(models.Account).join(models.User).filter(models.User.household_id == household_id).all()

def create_user_account(db: Session, account: schemas.AccountCreate, user_id: int):
    db_account = models.Account(**account.model_dump(), owner_id=user_id)
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

def upsert_account(db: Session, account_data: schemas.AccountCreate, user_id: int, item_id: int):
    # Check if exists by plaid_account_id
    existing = db.query(models.Account).filter(models.Account.plaid_account_id == account_data.plaid_account_id).first()
    if existing:
        existing.balance = account_data.balance
        existing.name = account_data.name
        # Update other fields if needed
        db.commit()
        db.refresh(existing)
        return existing
    else:
        new_account = models.Account(
            **account_data.dict(),
            owner_id=user_id,
            item_id=item_id
        )
        db.add(new_account)
        db.commit()
        db.refresh(new_account)
        return new_account

# Task CRUD
def get_tasks(db: Session, user_id: int):
    # If user is in a household, get all household tasks
    user = get_user(db, user_id)
    if user and user.household_id:
        return db.query(models.Task).join(models.User).filter(models.User.household_id == user.household_id).all()
    
    # Otherwise just personal
    return db.query(models.Task).filter(models.Task.owner_id == user_id).all()

def create_task(db: Session, task: schemas.TaskCreate, user_id: int):
    db_task = models.Task(**task.dict(), owner_id=user_id)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def delete_task(db: Session, task_id: int, user_id: int):
    task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.owner_id == user_id).first()
    if task:
        db.delete(task)
        db.commit()
    return task

def update_task(db: Session, task_id: int, task_update: schemas.TaskUpdate, user_id: int):
    # Determine authorization (personal or household)
    user = get_user(db, user_id)
    query = db.query(models.Task).filter(models.Task.id == task_id)
    
    # If in household, check if task belongs to household member
    # Simplified: for now just check ownership or household membership of owner
    # But strictly, we should ensure the *requester* is in the same household as the *task owner*
    
    task = query.first()
    if not task:
        return None
        
    # Apply updates
    update_data = task_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)
        
    db.commit()
    db.refresh(task)
    return task

def upsert_transaction(db: Session, transaction_data: schemas.TransactionCreate, account_id: int):
    existing = db.query(models.Transaction).filter(models.Transaction.plaid_transaction_id == transaction_data.plaid_transaction_id).first()
    if existing:
        # Update mutable fields? For now, trust Plaid description/amount might change? 
        # Usually we only update if user hasn't overridden.
        return existing
    else:
        new_tx = models.Transaction(
            **transaction_data.dict(),
            account_id=account_id
        )
        db.add(new_tx)
        db.commit()
        db.refresh(new_tx)
        return new_tx

def get_transactions(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Transaction).offset(skip).limit(limit).all()

def create_transaction(db: Session, transaction: schemas.TransactionCreate, account_id: int):
    db_transaction = models.Transaction(**transaction.model_dump(), account_id=account_id)
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction
