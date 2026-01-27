from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime, Enum
from sqlalchemy.orm import relationship
from database import Base
import enum
from datetime import datetime

class AccountType(str, enum.Enum):
    CHECKING = "checking"
    SAVINGS = "savings"
    CREDIT_CARD = "credit_card"
    INVESTMENT = "investment"
    MORTGAGE = "mortgage"
    LOAN = "loan"

class TransactionType(str, enum.Enum):
    INCOME = "income"
    EXPENSE = "expense"
    TRANSFER = "transfer"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=True) # Nullable for Google Users
    google_sub = Column(String, unique=True, index=True, nullable=True)
    is_active = Column(Boolean, default=True)

    accounts = relationship("Account", back_populates="owner")
    plaid_items = relationship("PlaidItem", back_populates="owner")
    household_id = Column(Integer, ForeignKey("households.id"), nullable=True)
    household = relationship("Household", back_populates="users")

class Household(Base):
    __tablename__ = "households"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True) # e.g. "The Caughey Family"
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="household")

class PlaidItem(Base):
    __tablename__ = "plaid_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    access_token = Column(String)
    item_id = Column(String)
    institution_name = Column(String)
    status = Column(String, default="active")

    owner = relationship("User", back_populates="plaid_items")
    accounts = relationship("Account", back_populates="item")

class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    type = Column(String) # Enum: AccountType
    balance = Column(Float, default=0.0)
    institution_name = Column(String)
    plaid_account_id = Column(String) # The 'account_id' from Plaid
    item_id = Column(Integer, ForeignKey("plaid_items.id"))
    owner_id = Column(Integer, ForeignKey("users.id")) # Keep direct link for convenience

    owner = relationship("User", back_populates="accounts")
    item = relationship("PlaidItem", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, default=datetime.utcnow)
    amount = Column(Float)
    description = Column(String)
    category = Column(String) # e.g. "Groceries", "Utilities"
    is_tax_deductible = Column(Boolean, default=False) # For Accountant
    plaid_transaction_id = Column(String, unique=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"))
    
    account = relationship("Account", back_populates="transactions")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    group = Column(String, index=True) # Flexible tagging (e.g. "Tax", "House")
    is_completed = Column(Boolean, default=False)
    due_date = Column(DateTime, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="tasks")

# Update User to include tasks relationship
User.tasks = relationship("Task", back_populates="owner")
