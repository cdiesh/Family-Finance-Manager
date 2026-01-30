from database import SessionLocal
import models

# Best estimates based on proposal/audit
OWNERSHIP_UPDATES = {
    "1216 S Markoe St": 20.0,
    "1206 S Markoe St": 6.66,
    "1356 S 46th St": 6.66,
    "1244 S Markoe St": 0.0, # Audit says 0 for Chris
    "1322 S May St": 6.66,  # Inferred pattern
    "4710 Upland St": 50.0, # Guess based on partnership
    "1812 Webster St": 100.0,
    "Laurel Circle": 20.0 
}

def update_ownership():
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == "christopherdiesh@gmail.com").first()
        if not user:
            user = db.query(models.User).first()
        
        assets = db.query(models.Asset).filter(models.Asset.user_id == user.id).all()
        
        print("Updating Ownership Percentages...")
        for asset in assets:
            for key, pct in OWNERSHIP_UPDATES.items():
                if key in asset.name or asset.name.startswith(key):
                    asset.ownership_percentage = pct
                    print(f"  {asset.name}: Set to {pct}%")
                    break
        
        db.commit()
        print("Ownership updates committed.")
        
    finally:
        db.close()

if __name__ == "__main__":
    update_ownership()
