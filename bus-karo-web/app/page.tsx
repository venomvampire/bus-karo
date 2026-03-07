"use client";
import { useState, useEffect } from "react";

interface BusResult {
  id: string; operator: string; departure: string; price: number; platform: string; link: string;
}

interface UserProfile {
  full_name: string; phone_number: string; email: string;
}

export default function Home() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [results, setResults] = useState<BusResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<{origin: string, destination: string}[]>([]);
  
  // New state to hold the real user!
  const [user, setUser] = useState<UserProfile | null>(null);

  // When the page loads, check if they are logged in
  useEffect(() => {
    const fetchUserAndHistory = async () => {
      const token = localStorage.getItem("token"); // Assuming you save the JWT token here during login
      if (token) {
        // Fetch User Profile
        setUser({
          full_name: localStorage.getItem("userName") || "User",
          phone_number: "Stored Securely",
          email: "user@example.com"
        });

        // Fetch Recent Searches
        try {
          const res = await fetch("http://localhost:8000/api/user/history", {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (res.ok) {
            const history = await res.json();
            setRecentSearches(history);
          }
        } catch (error) {
          console.error("Failed to load history");
        }
      }
    };
    fetchUserAndHistory();
  }, []);

  // 2. Save history when they search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setHasSearched(true);

    const token = localStorage.getItem("token");
    if (token) {
      // Silently save the search to the database in the background
      fetch("http://localhost:8000/api/user/history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ origin, destination })
      });
    }

    // ... keep your existing setTimeout or API fetch logic here to load the bus results ...
  };

  const handleCopyAndBook = (link: string) => {
    if (user) {
      // If logged in, use THEIR real details!
      const userDetails = `Name: ${user.full_name}, Phone: ${user.phone_number}`;
      navigator.clipboard.writeText(userDetails);
      alert(`✅ ${user.full_name}'s details copied to clipboard! Paste them on the booking page.`);
      window.open(link, "_blank");
    } else {
      // If NOT logged in, warn them but still let them book
      const wantToLogin = confirm("You are not logged in! We can't auto-fill your details. Do you want to log in first?");
      if (wantToLogin) {
        window.location.href = "/login"; // Send to login page
      } else {
        window.open(link, "_blank"); // Let them book manually
      }
    }
  };

// ... keep your existing return statement with the UI exactly as it is ...
  return (
    <div className="flex flex-col items-center pt-16 px-4 pb-20">
      
      {/* Hero Section */}
      <div className="text-center mb-10">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
          Don't just book. <span className="text-blue-600">Bus Karo.</span>
        </h2>
        <p className="text-lg text-gray-600">
          Compare prices across platforms, apply coupons, and save money.
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-4xl mb-10">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <input 
            type="text" placeholder="Leaving from (e.g., Delhi)" required
            className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={origin} onChange={(e) => setOrigin(e.target.value)}
          />
          <input 
            type="text" placeholder="Going to (e.g., Varanasi)" required
            className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={destination} onChange={(e) => setDestination(e.target.value)}
          />
          <input 
            type="date" required
            className="flex-1 p-3 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={date} onChange={(e) => setDate(e.target.value)}
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-md transition-colors">
            {isSearching ? "Searching..." : "Search Buses"}
          </button>
        </form>
        {/* Search Bar Container */}
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-4xl mb-10">
        <form onSubmit={handleSearch} className="...">
           {/* ... your existing inputs and search button ... */}
        </form>

        {/* --- NEW: Recent Searches Visual --- */}
        {recentSearches.length > 0 && (
          <div className="mt-6 flex items-center gap-3 w-full border-t pt-4">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Recent:</span>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, idx) => (
                <button 
                  key={idx}
                  type="button"
                  onClick={() => {
                    setOrigin(search.origin);
                    setDestination(search.destination);
                  }}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium border border-blue-200 transition-colors"
                >
                  {search.origin} ➔ {search.destination}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Results Section */}
      {hasSearched && !isSearching && (
        <div className="w-full max-w-4xl">
          <h3 className="text-2xl font-bold mb-4 text-gray-800">
            Available Buses for {origin} to {destination}
          </h3>
          
          <div className="flex flex-col gap-4">
            {results.map((bus) => (
              <div key={bus.id} className="bg-white p-6 rounded-lg shadow border border-gray-100 flex flex-col md:flex-row justify-between items-center transition-transform hover:scale-[1.01]">
                
                {/* Bus Details */}
                <div className="mb-4 md:mb-0">
                  <h4 className="text-xl font-bold text-gray-900">{bus.operator}</h4>
                  <p className="text-gray-500">Departure: <span className="font-semibold text-gray-800">{bus.departure}</span></p>
                  <p className="text-sm text-gray-400 mt-1">Found on {bus.platform}</p>
                </div>

                {/* Price and Action */}
                <div className="flex flex-col items-end">
                  <p className="text-3xl font-extrabold text-green-600 mb-2">₹{bus.price}</p>
                  <button 
                    onClick={() => handleCopyAndBook(bus.link)}
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded font-semibold shadow-sm transition-colors"
                  >
                    Copy Details & Book ➔
                  </button>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}