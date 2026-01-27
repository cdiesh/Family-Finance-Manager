import requests
import time
import sys

print("Testing backend connectivity...")
try:
    # Test Health
    r = requests.get("http://127.0.0.1:8000/health")
    print(f"Health: {r.status_code} {r.text}")
    
    # Test Google Route
    r = requests.get("http://127.0.0.1:8000/google/test")
    print(f"Google Test: {r.status_code} {r.text}")

    # Test Debug Check
    r = requests.get("http://127.0.0.1:8000/debug/check")
    print(f"Debug Routes: {r.status_code} {r.text}")
    
    if r.status_code == 200:
        print("SUCCESS: Backend is routing correctly.")
    else:
        print("FAILURE: Backend returned error.")
        
except Exception as e:
    print(f"CONNECTION ERROR: {e}")
