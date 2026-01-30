import os
from dotenv import load_dotenv

# Force reload
load_dotenv(override=True)

print(f"PLAID_ENV: {os.getenv('PLAID_ENV')}")
secret = os.getenv('PLAID_SECRET')
if secret:
    print(f"PLAID_SECRET (First 4): {secret[:4]}")
else:
    print("PLAID_SECRET: None")
