# Family Finance Manager

A comprehensive personal finance application for managing household finances, integrating with Plaid for automated transaction tracking.

## Features

- **Plaid Integration**: Connect bank accounts, credit cards, and investment accounts.
- **Household Management**: Link multiple users (e.g., spouses) to a single household view.
- **Transaction Categorization**: Auto-categorize transactions and split expenses.
- **Dashboard**: Visualize net worth, spending trends, and asset allocation.
- **Privacy Focused**: Data is stored locally or on your own database.

## Prerequisites

- Python 3.9+
- Node.js 16+
- Plaid Account (for API keys)

## Setup

### 1. Backend Setup

```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\activate
# Linux/Mac
# source venv/bin/activate

pip install -r requirements.txt
```

### 2. Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and fill in your details:
- **PLAID_CLIENT_ID** & **PLAID_SECRET**: Get these from your Plaid Dashboard.
- **SECRET_KEY**: Generate a random string.
- **PRIMARY_EMAIL**: Your email address (used for initial setup).

### 3. Initialize Database

```bash
# Run migrations/setup
python setup_family.py
```

### 4. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

### 5. Running the Backend

```bash
# In the backend terminal
uvicorn main:app --reload
```

## Security Note

This project is designed for self-hosting. Ensure you do not commit your `.env` file or SQLite database to public repositories.
