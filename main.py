from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware # <--- 1. ADD THIS IMPORT
from pydantic import BaseModel
import jwt
import uuid

# Import our custom modules
from scraper import advanced_scrape_platform, scrape_pnr_status
from link_builder import generate_deep_link
from database import get_db_pool
from auth import get_password_hash, verify_password, create_access_token, SECRET_KEY, ALGORITHM

app = FastAPI(title="Bus Karo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://bus-karo-sigma.vercel.app/"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# -------------------------------------------

db_pool = None
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")


@app.on_event("startup")
async def startup_event():
    global db_pool
    db_pool = await get_db_pool()
    if db_pool:
        print("Connected to the Bus Karo secure database!")

@app.on_event("shutdown")
async def shutdown_event():
    if db_pool:
        await db_pool.close()

# --- AUTHENTICATION MODELS & ENDPOINTS ---
class UserCreate(BaseModel):
    full_name: str
    email: str
    password: str
    phone_number: str

class UserLogin(BaseModel):
    email: str
    password: str

@app.post("/api/register")
async def register_user(user: UserCreate):
    if not db_pool: raise HTTPException(status_code=500, detail="Database error")
    hashed_password = get_password_hash(user.password)
    query = "INSERT INTO users (full_name, email, password_hash, phone_number) VALUES ($1, $2, $3, $4) RETURNING id"
    try:
        async with db_pool.acquire() as connection:
            await connection.fetchval(query, user.full_name, user.email, hashed_password, user.phone_number)
            return {"status": "success", "message": "Welcome to Bus Karo!"}
    except Exception:
        raise HTTPException(status_code=400, detail="Email already registered or database error.")

@app.post("/api/login")
async def login_user(user: UserLogin):
    if not db_pool: raise HTTPException(status_code=500, detail="Database error")
    query = "SELECT id, full_name, password_hash FROM users WHERE email = $1"
    async with db_pool.acquire() as connection:
        db_user = await connection.fetchrow(query, user.email)
        if not db_user or not verify_password(user.password, db_user['password_hash']):
            raise HTTPException(status_code=401, detail="Incorrect email or password")
        access_token = create_access_token(data={"sub": user.email, "user_id": str(db_user['id'])})
        return {"access_token": access_token, "token_type": "bearer", "full_name": db_user['full_name']}

async def get_current_user(token: str = Depends(oauth2_scheme)):
    if not db_pool: raise HTTPException(status_code=500, detail="Database error")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_email: str = payload.get("sub")
        if user_email is None: raise HTTPException(status_code=401)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    query = "SELECT full_name, phone_number, email FROM users WHERE email = $1"
    async with db_pool.acquire() as connection:
        user = await connection.fetchrow(query, user_email)
        if user is None: raise HTTPException(status_code=404, detail="User not found")
        return dict(user)

@app.get("/api/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user

# --- LIVE PNR TRACKING ENDPOINT ---
class TrackRequest(BaseModel):
    pnr: str
    operator: str

@app.post("/api/track")
async def track_bus_pnr(request: TrackRequest):
    if not request.pnr or not request.operator:
        raise HTTPException(status_code=400, detail="Missing data")
    try:
        live_status = await scrape_pnr_status(request.pnr, request.operator)
        return {"status": "success", "data": live_status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- ADVANCED AGGREGATION SEARCH ENDPOINT ---
@app.get("/api/search")
async def advanced_search_buses(origin: str, destination: str, date: str):
    if not db_pool: raise HTTPException(status_code=500, detail="Database error")
    
    try:
        # Translate City Names to Platform Codes
        mapping_query = "SELECT platform_name, platform_city_id FROM city_mappings WHERE standard_name = $1"
        async with db_pool.acquire() as connection:
            origin_mappings = await connection.fetch(mapping_query, origin)
            dest_mappings = await connection.fetch(mapping_query, destination)
            
        origin_codes = {record['platform_name']: record['platform_city_id'] for record in origin_mappings}
        dest_codes = {record['platform_name']: record['platform_city_id'] for record in dest_mappings}

        # Fallback to standard names if not found in database yet
        r_origin = origin_codes.get('redBus', origin)
        r_dest = dest_codes.get('redBus', destination)
        a_origin = origin_codes.get('AbhiBus', origin)
        a_dest = dest_codes.get('AbhiBus', destination)

        # Trigger Scrapers
        redbus_data = await advanced_scrape_platform(r_origin, r_dest, date, "redBus")
        abhibus_data = await advanced_scrape_platform(a_origin, a_dest, date, "AbhiBus")
        all_raw_buses = redbus_data + abhibus_data
        
        # Group & Calculate Math
        grouped_buses = {}
        for bus in all_raw_buses:
            unique_key = f"{bus['operator']}_{bus['departure']}"
            if unique_key not in grouped_buses:
                grouped_buses[unique_key] = {
                    "id": str(uuid.uuid4()), "operator": bus['operator'],
                    "bus_type": bus['bus_type'], "departure": bus['departure'],
                    "platforms": [], "prices": []
                }
            
            exact_link = generate_deep_link(
                bus['platform'], origin, destination, date, bus['operator'], bus['departure']
            )
            
            grouped_buses[unique_key]["platforms"].append({
                "name": bus['platform'], "price": bus['price'],
                "original_price": bus['price'] + 150, "coupon": "BUSKARO", 
                "seats_left": bus.get('available_seats', 'Filling Fast'), "link": exact_link
            })
            grouped_buses[unique_key]["prices"].append(bus['price'])

        final_results = []
        for key, bus_data in grouped_buses.items():
            if not bus_data["prices"]: continue
            cheapest = min(bus_data["prices"])
            average = sum(bus_data["prices"]) / len(bus_data["prices"])
            savings_pct = round(((average - cheapest) / average) * 100) if average > 0 and cheapest < average else 0
            
            del bus_data["prices"]
            bus_data["average_market_price"] = round(average)
            bus_data["cheapest_price"] = cheapest
            bus_data["savings_percentage"] = savings_pct
            final_results.append(bus_data)

        return {"status": "success", "results_count": len(final_results), "buses": final_results}

    except Exception as e:
        print(f"Search Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process search")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

class SearchHistoryCreate(BaseModel):
    origin: str
    destination: str

@app.post("/api/user/history")
async def save_search_history(search: SearchHistoryCreate, current_user: dict = Depends(get_current_user)):
    """Saves a user's search query to the database."""
    if not db_pool: raise HTTPException(status_code=500, detail="Database error")
    
    query = """
        INSERT INTO search_history (user_id, origin_city, destination_city) 
        VALUES ($1, $2, $3)
    """
    async with db_pool.acquire() as connection:
        await connection.execute(query, current_user['id'], search.origin, search.destination)
        return {"status": "saved"}

@app.get("/api/user/history")
async def get_search_history(current_user: dict = Depends(get_current_user)):
    """Fetches the user's 5 most recent unique searches."""
    if not db_pool: raise HTTPException(status_code=500, detail="Database error")
    
    # We group by cities to avoid showing "Delhi to Jaipur" 5 times in a row
    query = """
        SELECT origin_city as origin, destination_city as destination, MAX(searched_at) as last_searched
        FROM search_history
        WHERE user_id = $1
        GROUP BY origin_city, destination_city
        ORDER BY last_searched DESC
        LIMIT 5
    """
    async with db_pool.acquire() as connection:
        records = await connection.fetch(query, current_user['id'])
        return [{"origin": r['origin'], "destination": r['destination']} for r in records]