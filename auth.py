from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

# We use bcrypt to scramble passwords into gibberish
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# This is the master key to sign tokens. In production, put a long random string in your .env file!
SECRET_KEY = os.getenv("JWT_SECRET", "super-secret-development-key-bus-karo")
ALGORITHM = "HS256"

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    # Token expires in 24 hours
    expire = datetime.utcnow() + timedelta(minutes=1440)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt