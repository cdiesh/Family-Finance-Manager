from sqlalchemy.orm import Session
from database import SessionLocal
import models

def ingest_properties():
    db = SessionLocal()
    user = db.query(models.User).filter(models.User.email == "charlie@example.com").first() # Assuming single user or 'charlie'
    if not user:
        user = db.query(models.User).first()
    
    properties = [
        {"name": "1206 S Markoe St", "value": 355000, "ownership": 6.66, "type": "real_estate"},
        {"name": "1356 S 46th St", "value": 385000, "ownership": 20.00, "type": "real_estate"}, # 6.66 + Acquired Dewey(6.66) + Bill(6.66)? Proposal says Bill/Chris hold Class A. Audit says Bill 13.32, Chris 6.66. Use 6.66 for Chris.
        {"name": "1244 S Markoe St", "value": 385000, "ownership": 0.0, "type": "real_estate"}, # Chris not listed in Audit? Wait, Andrew Diesh is listed. Chris might not own this anymore? Proposal says "We make a move". I'll skip for now or set 0.
        {"name": "1322 S May St", "value": 385000, "ownership": 0.0, "type": "real_estate"}, # Chris not listed in Audit.
    ]

    # Correction: Use the Audit numbers for "Chris Diesh"
    # 1. 1206 S Markoe: 6.66%
    # 2. 1356 S 46th St: 6.66%
    # 3. 1244 S Markoe: Not listed for "Chris". Andrew is listed.
    # 4. 1322 S May: Not listed for "Chris".

    real_props = [
        {"name": "1206 S Markoe St", "value": 355000, "ownership": 6.66, "type": "real_estate"},
        {"name": "1356 S 46th St", "value": 385000, "ownership": 6.66, "type": "real_estate"},
        {"name": "1244 S Markoe St", "value": 385000, "ownership": 0.0, "type": "real_estate"}, # 0% or User can update
        {"name": "1322 S May St", "value": 385000, "ownership": 0.0, "type": "real_estate"}, # 0% or User can update
        {"name": "4710 Upland St", "value": 0.0, "ownership": 0.0, "type": "real_estate"},
        {"name": "Laurel Circle", "value": 0.0, "ownership": 20.0, "type": "real_estate"},
        {"name": "1812 Webster St", "value": 0.0, "ownership": 100.0, "type": "real_estate"}, # User manual request
    ]
    
    print(f"Ingesting {len(real_props)} properties for User {user.email}...")

    for p in real_props:
        # Check if exists by name (case insensitive ideally, but exact for now)
        exists = db.query(models.Asset).filter(models.Asset.name == p["name"], models.Asset.user_id == user.id).first()
        if not exists:
            asset = models.Asset(
                user_id=user.id,
                name=p["name"],
                type=p["type"],
                value=p["value"],
                ownership_percentage=p["ownership"]
            )
            db.add(asset)
            print(f"Added {p['name']}")
        else:
            # OPTIONAL: Update if exists? For now, skip to avoid overwriting user edits.
            print(f"Skipped {p['name']} (Exists)")
    
    db.commit()
    db.close()

if __name__ == "__main__":
    ingest_properties()
