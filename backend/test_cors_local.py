import requests

try:
    print("Testing OPTIONS request to http://localhost:8000/users/me/...")
    resp = requests.options("http://localhost:8000/users/me/", headers={
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "GET"
    })
    print(f"Status: {resp.status_code}")
    print("Headers:", resp.headers)
    
    print("\nTesting GET request to http://localhost:8000/google/test...")
    resp = requests.get("http://localhost:8000/google/test", headers={
        "Origin": "http://localhost:5173"
    })
    print(f"Status: {resp.status_code}")
    print("Headers:", resp.headers)

except Exception as e:
    print(f"Failed: {e}")
