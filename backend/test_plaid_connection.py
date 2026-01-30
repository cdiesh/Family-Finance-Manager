import plaid
from plaid.api import plaid_api
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.products import Products
from plaid.model.country_code import CountryCode
import time

user_id = str(int(time.time()))
print(f"Testing Plaid Sandbox connection for user: {user_id}")

try:
    # Manually configure client for Production Test (OLD KEY)
    configuration = plaid.Configuration(
        host="https://production.plaid.com",
        api_key={
            'clientId': "6942e997b8f16e0021ea46ef",
            'secret': "af9ec5293f38c74c6b5109fa19f45a",
        }
    )
    api_client = plaid.ApiClient(configuration)
    client = plaid_api.PlaidApi(api_client)

    request = LinkTokenCreateRequest(
        products=[Products("transactions")],
        client_name="Family Finance Manager",
        country_codes=[CountryCode("US")],
        language="en",
        user=LinkTokenCreateRequestUser(
            client_user_id=user_id
        )
    )
    print("Sending request...")
    response = client.link_token_create(request)
    print("Success!")
    print(response.to_dict())
except Exception as e:
    print(f"FAILED: {e}")
