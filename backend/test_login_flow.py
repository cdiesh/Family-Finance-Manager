import requests

url_login = "http://localhost:8000/token"
url_me = "http://localhost:8000/users/me/"

payload = {
    "username": "christopherdiesh@gmail.com",
    "password": "password123"
}

try:
    print(f"1. logging in to {url_login}...")
    resp = requests.post(url_login, data=payload)
    if resp.status_code != 200:
        print(f"Login Failed: {resp.status_code} {resp.text}")
        exit()
        
    data = resp.json()
    token = data["access_token"]
    print("   Got Token!")
    
    print(f"2. Fetching User Profile from {url_me}...")
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(url_me, headers=headers)
    
    print(f"   Status: {resp.status_code}")
    print(f"   Response: {resp.text}")

except Exception as e:
    print(f"Error: {e}")
