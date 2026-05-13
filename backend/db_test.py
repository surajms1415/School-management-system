import sys
sys.path.append('.')
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User
import auth

db = SessionLocal()
users = db.query(User).all()
for u in users:
    print(f"Username: {u.username}, Role: {u.role}, Hash: {u.hashed_password}")
