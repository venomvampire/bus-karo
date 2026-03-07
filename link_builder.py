from urllib.parse import urlencode

def generate_deep_link(platform: str, origin: str, dest: str, date: str, operator: str, departure_time: str):
    """
    Constructs a URL that automatically applies filters on the target website
    so the user only sees the exact bus they clicked on.
    """
    
    if platform == "redBus":
        # Example redBus deep link structure
        base_url = "https://www.redbus.in/bus-tickets/"
        route = f"{origin.lower()}-to-{dest.lower()}"
        
        params = {
            "doj": date,
            "op": operator, # Auto-filters by operator name
            "dt": departure_time # Auto-filters by departure time
        }
        return f"{base_url}{route}?{urlencode(params)}"
        
    elif platform == "AbhiBus":
        # Example AbhiBus structure
        base_url = "https://www.abhibus.com/search/"
        route = f"{origin}/{dest}/{date}"
        
        params = {
            "operator_name": operator
        }
        return f"{base_url}{route}?{urlencode(params)}"
        
    # Add more platforms as you analyze their URL structures
    return f"https://www.{platform}.com"