import plaid
from plaid.api import plaid_api
import os
from dotenv import load_dotenv

load_dotenv()

PLAID_CLIENT_ID = os.getenv("PLAID_CLIENT_ID")
PLAID_SECRET = os.getenv("PLAID_SECRET")
PLAID_ENV = os.getenv("PLAID_ENV", "sandbox")

host = plaid.Environment.Sandbox
if PLAID_ENV == "production":
    host = plaid.Environment.Production
elif PLAID_ENV == "development":
    # host = "https://development.plaid.com" # DNS fails for this
    host = plaid.Environment.Production # Try routing dev keys to prod endpoint

configuration = plaid.Configuration(
    host=host,
    api_key={
        'clientId': PLAID_CLIENT_ID,
        'secret': PLAID_SECRET,
    }
)

api_client = plaid.ApiClient(configuration)
client = plaid_api.PlaidApi(api_client)
