import os
from dotenv import load_dotenv
import plaid
from plaid.api import plaid_api
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.products import Products
from plaid.model.country_code import CountryCode

# FORCING ORIGINAL KEYS (from Step 1044)
client_id = "6942e997b8f16e0021ea46ef" # The one that was in the file originally
secret = "237643f8510b82f6c58ae00924f165" # The known Sandbox Secret
env = "sandbox"

print(f"Testing ORIGINAL SANDBOX Properties...")
print(f"Client ID: {client_id}")
print(f"Secret: {secret[:4]}...")

host = plaid.Environment.Sandbox

configuration = plaid.Configuration(
    host=host,
    api_key={
        'clientId': client_id,
        'secret': secret,
    }
)
api_client = plaid.ApiClient(configuration)
client = plaid_api.PlaidApi(api_client)

try:
    print("\nAttempting link_token_create (ORIGINAL)...")
    request = LinkTokenCreateRequest(
        products=[Products("transactions")],
        client_name="Family Finance Manager",
        country_codes=[CountryCode("US")],
        language="en",
        user=LinkTokenCreateRequestUser(
            client_user_id="1"
        )
    )
    response = client.link_token_create(request)
    print("SUCCESS!")
    print(f"Link Token: {response['link_token']}")
except plaid.ApiException as e:
    print("FAILED!")
    print(f"Status: {e.status}")
    print(f"Reason: {e.reason}")
    print(f"Body: {e.body}")
