"use client";
import { useState } from "react";
import Link from "next/link";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    fullName: "", email: "", password: "", phone: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For now, we'll just show an alert. 
    // Later, this will send a POST request to your Python /api/register or /api/login endpoints
    if (isLogin) {
      alert(`Logging into Bus Karo with ${formData.email}...`);
    } else {
      alert(`Registering ${formData.fullName} for Bus Karo...`);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">
          {isLogin ? "Welcome Back" : "Join Bus Karo"}
        </h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <>
              <input type="text" placeholder="Full Name" required className="p-3 border rounded-md"
                onChange={e => setFormData({...formData, fullName: e.target.value})} />
              <input type="tel" placeholder="Phone Number" required className="p-3 border rounded-md"
                onChange={e => setFormData({...formData, phone: e.target.value})} />
            </>
          )}
          
          <input type="email" placeholder="Email Address" required className="p-3 border rounded-md"
            onChange={e => setFormData({...formData, email: e.target.value})} />
          <input type="password" placeholder="Password" required className="p-3 border rounded-md"
            onChange={e => setFormData({...formData, password: e.target.value})} />
            
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-md transition-colors">
            {isLogin ? "Login" : "Create Account"}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-blue-600 font-semibold hover:underline">
            {isLogin ? "Sign up here" : "Login here"}
          </button>
        </p>
        
        <div className="mt-4 text-center">
             <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
                 ← Back to Search
             </Link>
        </div>
      </div>
    </div>
  );
}