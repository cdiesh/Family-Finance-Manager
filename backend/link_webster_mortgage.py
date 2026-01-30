from database import SessionLocal
import models

def link_webster_mortgage():
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == "christopherdiesh@gmail.com").first()
        if not user:
            user = db.query(models.User).first()
        
        # Find Webster
        webster = db.query(models.Asset).filter(
            models.Asset.user_id == user.id, 
            models.Asset.name.like("%Webster%")
        ).first()
        
        # Find Chase Mortgage
        chase_mortgage = db.query(models.Account).filter(
            models.Account.owner_id == user.id,
            models.Account.name.like("%MORTGAGE%"), # User said "listed above" as "MORTGAGE LOAN"
            models.Account.institution_name.like("%Chase%")
        ).first()

        if webster and chase_mortgage:
            print(f"Linking {chase_mortgage.name} (ID: {chase_mortgage.id}) to {webster.name} (ID: {webster.id})")
            webster.linked_account_id = chase_mortgage.id
            db.commit()
            print("Link successful.")
        else:
            print(f"Could not find both items. Webster: {webster}, Mortgage: {chase_mortgage}")
        
    finally:
        db.close()

if __name__ == "__main__":
    link_webster_mortgage()
