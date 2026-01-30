from database import SessionLocal
import models

def fix_1244():
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == "christopherdiesh@gmail.com").first()
        if not user:
            user = db.query(models.User).first()
        
        asset = db.query(models.Asset).filter(models.Asset.user_id == user.id, models.Asset.name.like("%1244%")).first()
        
        if asset:
            print(f"Found {asset.name}. Updating ownership from {asset.ownership_percentage}% to 14.6%.")
            asset.ownership_percentage = 14.6
            db.commit()
            print("Update committed.")
        else:
            print("1244 asset not found.")
        
    finally:
        db.close()

if __name__ == "__main__":
    fix_1244()
