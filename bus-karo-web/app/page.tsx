"use client";
import { useState, useEffect } from "react";
import AdBanner from "../components/AdBanner"; // Make sure your AdBanner component is saved!

// Defining the shape of our advanced API response
interface PlatformOffer {
  name: string;
  price: number;
  original_price: number;
  coupon: string;
  seats_left: number | string;
  link: string;
}

interface BusResult {
  id: string;
  operator: string;
  bus_type: string;
  departure: string;
  platforms: PlatformOffer[];
  average_market_price: number;
  cheapest_price: number;
  savings_percentage: number;
}

interface UserProfile {
  full_name: string;
  phone_number: string;
  email: string;
}

export default function Home() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  
  const [results, setResults] = useState<BusResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [recentSearches, setRecentSearches] = useState<{origin: string, destination: string}[]>([]);

  // 1. Fetch User and History on Load
  useEffect(() => {
    const fetchUserAndHistory = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        setUser({
          full_name: localStorage.getItem("userName") || "User",
          phone_number: "Stored Securely",
          email: "user@example.com"
        });
        
        // --- THE REAL API CALL ---
        try {
          const res = await fetch("https://venomvampire-bus-karo-api.hf.space/api/user/history", {
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

  // 2. Handle Search Submission
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setHasSearched(true);

    const token = localStorage.getItem("token");

    // 1. Save the search history in the background (if logged in)
    if (token) {
      fetch("https://venomvampire-bus-karo-api.hf.space/api/user/history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ origin, destination })
      }).catch(err => console.error("History save failed", err));
    }

    // 2. Fetch the REAL live bus data!
    try {
      const res = await fetch(`https://venomvampire-bus-karo-api.hf.space/api/search?origin=${origin}&destination=${destination}&date=${date}`);
      
      if (res.ok) {
        const data = await res.json();
        if (data.status === "success") {
          setResults(data.buses);
        } else {
          alert("Could not find buses for this route.");
          setResults([]);
        }
      } else {
        alert("Error connecting to the aggregator engine.");
        setResults([]);
      }
    } catch (error) {
      console.error("Search failed:", error);
      alert("Failed to fetch live prices.");
    } finally {
      setIsSearching(false);
    }
  };

  // 3. Handle Booking Auto-Fill Logic
  const handleCopyAndBook = (link: string) => {
    if (user) {
      const userDetails = `Name: ${user.full_name}, Phone: ${user.phone_number}`;
      navigator.clipboard.writeText(userDetails);
      alert(`✅ ${user.full_name}'s details copied to clipboard! Paste them on the booking page.`);
      window.open(link, "_blank");
    } else {
      const wantToLogin = confirm("You are not logged in! We can't auto-fill your details. Do you want to log in first?");
      if (wantToLogin) window.location.href = "/login";
      else window.open(link, "_blank");
    }
  };

  return (
    <div className="flex flex-col items-center pt-16 px-4 pb-20">
      
      {/* --- HERO SECTION --- */}
      <div className="text-center mb-10">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
          Don't just book. <span className="text-blue-600">Bus Karo.</span>
        </h2>
        <p className="text-lg text-gray-600">
          Compare prices across platforms, apply coupons, and save money.
        </p>
      </div>

      {/* --- SEARCH BAR CONTAINER --- */}
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-4xl mb-10 border border-gray-100">
        
        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <input type="text" placeholder="Leaving from (e.g., Delhi)" required
            className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={origin} onChange={(e) => setOrigin(e.target.value)} />
            
          <input type="text" placeholder="Going to (e.g., Varanasi)" required
            className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={destination} onChange={(e) => setDestination(e.target.value)} />
            
          <input type="date" required
            className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={date} onChange={(e) => setDate(e.target.value)} />
            
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-md transition-colors shadow-sm">
            {isSearching ? "Searching..." : "Search Buses"}
          </button>
        </form>

        {/* --- LOGGED-IN RECENT SEARCHES CHIPS --- */}
        {recentSearches.length > 0 && (
          <div className="mt-6 flex items-center gap-3 w-full border-t pt-4">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Recent:</span>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, idx) => (
                <button 
                  key={idx} type="button"
                  onClick={() => { setOrigin(search.origin); setDestination(search.destination); }}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium border border-blue-200 transition-colors"
                >
                  {search.origin} ➔ {search.destination}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* --- ADVANCED SEARCH RESULTS UI --- */}
      {hasSearched && !isSearching && (
        <div className="w-full max-w-4xl">
          <h3 className="text-2xl font-bold mb-6 text-gray-800">
            Available Buses for <span className="text-blue-600">{origin}</span> to <span className="text-blue-600">{destination}</span>
          </h3>
          
          <div className="flex flex-col gap-8">
            {results.map((bus, index) => (
              <div key={bus.id}>
                
                {/* 1. THE ADVANCED BUS CARD */}
                <div className="bg-white p-0 rounded-xl shadow border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                  
                  {/* Card Header: Bus Info & Price Meter Visual */}
                  <div className="bg-gray-50 p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                      <h4 className="text-2xl font-bold text-gray-900">{bus.operator}</h4>
                      <p className="text-gray-600 font-medium mt-1">{bus.bus_type} • Departure: {bus.departure}</p>
                      {bus.savings_percentage > 0 && (
                        <p className="text-sm text-green-600 font-bold mt-2 bg-green-50 px-3 py-1 rounded-full inline-block border border-green-200">
                          🔥 {bus.savings_percentage}% cheaper than average!
                        </p>
                      )}
                    </div>
                    
                    {/* The Visual Price Meter */}
                    <div className="mt-4 md:mt-0 text-right w-full md:w-auto">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Market Price Meter</p>
                      <div className="w-full md:w-40 h-2 bg-gray-200 rounded-full overflow-hidden flex relative">
                        <div className="bg-green-500 h-full w-1/3"></div>
                        <div className="bg-yellow-400 h-full w-1/3"></div>
                        <div className="bg-red-500 h-full w-1/3 opacity-30"></div>
                        {/* The Indicator Needle */}
                        <div className={`absolute top-0 h-full w-1 bg-black ${bus.savings_percentage > 10 ? 'left-[15%]' : bus.savings_percentage > 0 ? 'left-[50%]' : 'left-[85%]'}`}></div>
                      </div>
                      <p className="text-xs font-bold text-gray-700 mt-1">Avg: ₹{bus.average_market_price}</p>
                    </div>
                  </div>

                  {/* Card Body: Platform Comparison List & Booking Action */}
                  <div className="p-6 bg-white">
                    <p className="text-xs text-gray-500 mb-4 uppercase tracking-wider font-semibold">Compare Booking Platforms</p>
                    <div className="space-y-4">
                      {bus.platforms.map((platform, idx) => (
                        <div key={idx} className="flex flex-col md:flex-row justify-between items-center p-4 border rounded-lg hover:border-blue-400 transition-colors bg-gray-50/50">
                          
                          <div className="flex-1 w-full">
                            <p className="font-bold text-lg text-gray-800">{platform.name}</p>
                            <div className="flex gap-3 mt-1 text-sm items-center">
                              {platform.coupon !== "NONE" && (
                                <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded border border-orange-200 font-mono">
                                  Use Code: {platform.coupon}
                                </span>
                              )}
                              <span className={typeof platform.seats_left === 'number' && platform.seats_left < 10 ? "text-red-600 font-bold" : "text-gray-500"}>
  {platform.seats_left} seats left
  </span>
                            </div>
                          </div>

                          <div className="flex w-full md:w-auto items-center justify-between md:justify-end gap-6 mt-4 md:mt-0">
                            <div className="text-right">
                              {platform.original_price > platform.price && (
                                <p className="text-sm text-gray-400 line-through">₹{platform.original_price}</p>
                              )}
                              <p className="text-2xl font-extrabold text-gray-900">₹{platform.price}</p>
                            </div>
                            {/* The "Copy Details & Book" Action Button */}
                            <button 
                              onClick={() => handleCopyAndBook(platform.link)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-bold shadow transition flex items-center gap-2"
                            >
                              Book Here ➔
                            </button>
                          </div>

                        </div>
                      ))}
                    </div>
                  </div>
                  
                </div>

                {/* 2. THE ADSENSE INJECTION (After every 3rd bus) */}
                {(index + 1) % 3 === 0 && (
                   <div className="mt-8 mb-4 border-y border-gray-200 py-4 bg-gray-50 rounded-lg">
                      <span className="text-xs text-gray-400 uppercase tracking-widest text-center block mb-2">Advertisement</span>
                      <AdBanner 
                        dataAdSlot="1234567890" // Replace this with your actual AdSense Slot ID
                        dataAdFormat="auto" 
                        dataFullWidthResponsive={true} 
                      />
                   </div>
                )}

              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}