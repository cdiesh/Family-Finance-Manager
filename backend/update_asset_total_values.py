from database import SessionLocal
import models

# Market Values from set-market-values.js
UPDATES = {
    "1216 S Markoe St": {
        "search_term": "Laurel Circle", 
        "value": 375000, 
        "new_name": "1216 S Markoe St (Laurel Circle)",
        "llc": "Laurel Circle LLC"
    },
    "1206 S Markoe St": {
        "search_term": "1206 S Markoe", 
        "value": 375000, 
        "new_name": "1206 S Markoe St (PHPG 1206)",
        "llc": "PHPG 1206 S Markoe St, LLC"
    },
    "1356 S 46th St": {
        "search_term": "1356 S 46th", 
        "value": 375000, 
        "new_name": "1356 S 46th St (Pennhaven)",
        "llc": "Pennhaven Holdings 1, LLC"
    },
    "1244 S Markoe St": {
        "search_term": "1244 S Markoe", 
        "value": 375000, 
        "new_name": "1244 S Markoe St (RCS Paradigm 2)",
        "llc": "RCS Paradigm 2, LLC"
    },
    "1322 S May St": {
        "search_term": "1322 S May", 
        "value": 280000, 
        "new_name": "1322 S May St (RCS Paradigm 1)",
        "llc": "RCS Paradigm 1, LLC"
    },
    "4710 Upland St": {
        "search_term": "4710 Upland", 
        "value": 300000, 
        "new_name": "4710 Upland St",
        "llc": "Upland"
    }
}

def update_assets():
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == "christopherdiesh@gmail.com").first()
        if not user:
            print("User not found via specific email, trying first user")
            user = db.query(models.User).first()
            if not user:
                print("No users found")
                return

        print(f"Updating assets for user: {user.email}")
        assets = db.query(models.Asset).filter(models.Asset.user_id == user.id).all()
        
        for asset in assets:
            print(f"Checking Asset: {asset.name}")
            
            matched = False
            for key, data in UPDATES.items():
                if data["search_term"].lower() in asset.name.lower() or key.lower() in asset.name.lower():
                    print(f"  -> MATCHED: {key}")
                    asset.name = data["new_name"]
                    asset.value = data["value"]
                    matched = True
                    print(f"  -> Updated Name: {asset.name}")
                    print(f"  -> Updated Value: ${asset.value}")
                    break
            
            if not matched:
                print("  -> No match found in update list")

        db.commit()
        print("\nDatabase committed successfully.")

    except Exception as e:
        print(f"Global Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_assets()
