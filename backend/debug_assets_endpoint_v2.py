from database import SessionLocal
import models
from routers.assets import AssetRead

def debug_assets():
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == "christopherdiesh@gmail.com").first()
        if not user:
            print("User not found via specific email")
            user = db.query(models.User).first()
            if not user:
                print("No users found")
                return
        
        print(f"Using user: {user.email} (ID: {user.id})")
            
        assets = db.query(models.Asset).filter(models.Asset.user_id == user.id).all()
        print(f"Found {len(assets)} assets")
        
        for asset in assets:
            print(f"Processing Asset ID: {asset.id}, Name: {asset.name}")
            # Serialize
            try:
                data = AssetRead.from_orm(asset)
                print("  Serialization: OK")
                print(f"  Equity Value (Computed): {data.equity_value}")
            except Exception as e:
                print(f"  Serialization FAILED: {e}")

    except Exception as e:
        print(f"Global Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_assets()
