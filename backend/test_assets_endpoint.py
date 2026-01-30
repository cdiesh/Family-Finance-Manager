import requests
import json

BASE_URL = "http://localhost:8000"

def test_assets():
    try:
        # 1. Login to get token (using test credentials or just verifying health)
        # For simplicity, let's just check if the endpoint exists (401 is success for existence check)
        print("Checking endpoint existence...")
        res = requests.get(f"{BASE_URL}/assets/")
        print(f"GET /assets/ Status: {res.status_code}")
        
        if res.status_code == 401:
            print("Endpoint exists (Unauthorized, which is expected without token).")
            return
            
        if res.status_code == 200:
            print("Endpoint accessible.")
            print(res.json())
        else:
            print(f"Unexpected status: {res.status_code}")
            print(res.text)

    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    test_assets()
