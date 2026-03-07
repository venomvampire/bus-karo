"use client";
import { useState } from "react";

interface TrackingData {
  pnr: string;
  operator: string;
  status: string;
  last_location: string;
  estimated_arrival: string;
}

export default function TrackPNR() {
  const [pnr, setPnr] = useState("");
  const [operator, setOperator] = useState("Zingbus");
  const [isTracking, setIsTracking] = useState(false);
  const [trackData, setTrackData] = useState<TrackingData | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTracking(true);

    // Simulate calling the Python backend
    // const res = await fetch('http://localhost:8000/api/track', { ... })
    
    setTimeout(() => {
      // Simulating the response from our Python scraper
      setTrackData({
        pnr: pnr,
        operator: operator,
        status: "In Transit",
        last_location: "Crossing Agra Toll Plaza",
        estimated_arrival: "Tomorrow, 06:30 AM"
      });
      setIsTracking(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center pt-16 px-4 bg-gray-50">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
          Live <span className="text-blue-600">Bus Tracking</span>
        </h2>
        <p className="text-lg text-gray-600">Enter your PNR to see exactly where your bus is right now.</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-2xl mb-8 border border-gray-100">
        <form onSubmit={handleTrack} className="flex flex-col md:flex-row gap-4">
          <input 
            type="text" 
            placeholder="Enter PNR Number" 
            required
            className="flex-[2] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 uppercase"
            value={pnr} 
            onChange={(e) => setPnr(e.target.value)}
          />
          <select 
            className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
          >
            <option value="Zingbus">Zingbus</option>
            <option value="IntrCity">IntrCity SmartBus</option>
            <option value="RSRTC">RSRTC</option>
          </select>
          <button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md transition-colors"
          >
            {isTracking ? "Locating..." : "Track"}
          </button>
        </form>
      </div>

      {/* Tracking Results UI */}
      {trackData && !isTracking && (
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl border border-gray-100">
          <div className="flex justify-between items-center border-b pb-4 mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">{trackData.operator}</h3>
              <p className="text-gray-500 font-mono">PNR: {trackData.pnr}</p>
            </div>
            <span className="bg-green-100 text-green-800 px-4 py-1 rounded-full font-semibold text-sm">
              {trackData.status}
            </span>
          </div>

          <div className="space-y-6">
            <div className="flex items-start">
              <div className="bg-blue-600 w-4 h-4 rounded-full mt-1.5 mr-4 shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
              <div>
                <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Current Location</p>
                <p className="text-xl font-medium text-gray-900">{trackData.last_location}</p>
              </div>
            </div>

            <div className="border-l-2 border-dashed border-gray-300 ml-2 h-8 my-[-10px]"></div>

            <div className="flex items-start">
              <div className="bg-gray-300 w-4 h-4 rounded-full mt-1.5 mr-4"></div>
              <div>
                <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Estimated Arrival</p>
                <p className="text-xl font-medium text-gray-900">{trackData.estimated_arrival}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}