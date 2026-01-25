from database import engine
import models

print("Creating all missing tables...")
models.Base.metadata.create_all(bind=engine)
print("Done.")
