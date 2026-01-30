import plaid
print(f"Plaid module: {plaid}")
try:
    print(f"Environment attributes: {dir(plaid.Environment)}")
    print(f"Sandbox: {plaid.Environment.Sandbox}")
    print(f"Production: {plaid.Environment.Production}")
except Exception as e:
    print(f"Error inspecting Environment: {e}")
