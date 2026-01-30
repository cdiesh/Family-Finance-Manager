import requests

url = "http://localhost:8000/auth/token" # Default router prefix is usually /token or /auth/token, seeing auth.py it is just /token but usually mounted under /auth? 
# In main.py: app.include_router(auth.router, tags=["auth"]) -> No prefix!
# But wait, main.py (Step 793) says: app.include_router(auth.router, tags=["auth"])
# auth.py (Step 905) says: @router.post("/token")
# So it should be /token directly? 
# Or /auth/token if prefix was set?
# Let's check main.py again. Step 793: line 30 `app.include_router(auth.router, tags=["auth"])`. No prefix.
# So it is http://localhost:8000/token

url = "http://localhost:8000/token"

payload = {
    "username": "christopherdiesh@gmail.com",
    "password": "password123"
}

try:
    print(f"Attempting login to {url}...")
    resp = requests.post(url, data=payload)
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text}")
except Exception as e:
    print(f"Error: {e}")
