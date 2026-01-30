from database import SessionLocal
import models

def update_webster():
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == "christopherdiesh@gmail.com").first()
        if not user:
            user = db.query(models.User).first()
        
        asset = db.query(models.Asset).filter(models.Asset.user_id == user.id, models.Asset.name.like("%Webster%")).first()
        
        if asset:
            print(f"Found {asset.name}. Updating value from {asset.value} to 425000.")
            asset.value = 425000
            db.commit()
            print("Update committed.")
        else:
            print("Webster asset not found.")
        
    finally:
        db.close()

if __name__ == "__main__":
    update_webster()
