import os
import asyncpg
from dotenv import load_dotenv

# Load the hidden connection string from .env
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def get_db_pool():
    """Creates a connection pool to the PostgreSQL database."""
    try:
        pool = await asyncpg.create_pool(DATABASE_URL)
        return pool
    except Exception as e:
        print(f"Failed to connect to the database: {e}")
        return None

async def save_price_history(pool, bus_id: str, platform: str, price: float, url: str):
    """Inserts a scraped price into the price_history table."""
    query = """
        INSERT INTO price_history (bus_id, platform_name, base_price, booking_url)
        VALUES ($1, $2, $3, $4)
    """
    async with pool.acquire() as connection:
        await connection.execute(query, bus_id, platform, price, url)