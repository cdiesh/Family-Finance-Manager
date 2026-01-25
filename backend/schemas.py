from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from enum import Enum

class AccountType(str, Enum):
    CHECKING = "checking"
    SAVINGS = "savings"
    CREDIT_CARD = "credit_card"
    INVESTMENT = "investment"
    MORTGAGE = "mortgage"
    LOAN = "loan"

class TransactionBase(BaseModel):
    amount: float
    description: str
    category: str | None = None
    date: datetime
    is_tax_deductible: bool = False
    plaid_transaction_id: str

class TransactionCreate(TransactionBase):
    pass

class Transaction(TransactionBase):
    id: int
    account_id: int

    class Config:
        from_attributes = True

class AccountBase(BaseModel):
    name: str
    type: AccountType
    balance: float
    institution_name: str

class AccountCreate(AccountBase):
    plaid_account_id: str

class Account(AccountBase):
    id: int
    owner_id: int
    transactions: List[Transaction] = []

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    accounts: List[Account] = []

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None

class TaskBase(BaseModel):
    title: str
    group: str = "General"
    due_date: Optional[datetime] = None
    is_completed: bool = False

class TaskCreate(TaskBase):
    pass

class Task(TaskBase):
    id: int
    owner_id: int

    class Config:
        from_attributes = True
