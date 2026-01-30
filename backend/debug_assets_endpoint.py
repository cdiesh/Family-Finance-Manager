from database import SessionLocal
import models
from routers.assets import AssetRead

def debug_assets():
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == "christopherdiesh@gmail.com").first()
        if not user:
            print("User not found")
            user = db.query(models.User).first()
            if not user:
                print("No users found")
                return
            print(f"Using user: {user.email}")
            
        assets = db.query(models.Asset).filter(models.Asset.user_id == user.id).all()
        print(f"Found {len(assets)} assets")
        
        for asset in assets:
            print(f"Processing Asset ID: {asset.id}, Name: {asset.name}")
            print(f"  Manual Mortgage Balance: {asset.manual_mortgage_balance} (Type: {type(asset.manual_mortgage_balance)})")
            
            # Serialize
            try:
                data = AssetRead.from_orm(asset)
                print("  Serialization: OK")
            except Exception as e:
                print(f"  Serialization FAILED: {e}")

            # Logic check
            gross_value = asset.value * (asset.ownership_percentage / 100.0)
            liability = 0.0
            if asset.linked_account_id:
                linked = db.query(models.Account).filter(models.Account.id == asset.linked_account_id).first()
                if linked:
                    liability = abs(linked.balance)
            
            if asset.manual_mortgage_balance:
                liability += asset.manual_mortgage_balance
            
            print(f"  Equity: {gross_value - liability}")

    except Exception as e:
        print(f"Global Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_assets()
