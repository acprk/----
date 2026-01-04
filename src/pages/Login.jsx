import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const Login = () => {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (login(key.trim())) {
      // Login successful, redirect to home
      navigate('/');
    } else {
      setError('Invalid Key');
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center bg-slate-900 bg-cover bg-center relative font-sans"
      style={{ 
        backgroundImage: "url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=3270&auto=format&fit=crop')" 
      }}
    >
      {/* Very subtle overlay just to ensure text contrast, but keep it clear */}
      <div className="absolute inset-0 bg-black/20"></div>

      <div className="relative z-10 w-full max-w-xs mx-auto text-center">
        
        {/* Minimal Title */}
        <h1 className="text-3xl font-light tracking-[0.2em] text-white/90 mb-12 uppercase drop-shadow-md">
          XZY
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="relative group">
            <input
              type="password"
              value={key}
              onChange={(e) => {
                setKey(e.target.value);
                setError('');
              }}
              placeholder="ENTER KEY"
              className="w-full py-3 bg-transparent border-b border-white/30 focus:border-white/80 focus:outline-none transition-all text-white placeholder:text-white/30 text-center tracking-[0.5em] text-xl font-light"
              autoFocus
            />
            {/* Minimal error indicator */}
            {error && (
              <div className="absolute top-full left-0 w-full mt-2">
                 <p className="text-red-200/80 text-xs font-light tracking-wider animate-pulse">{error}</p>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="group flex items-center justify-center gap-2 mx-auto text-white/60 hover:text-white transition-colors duration-300"
          >
            <span className="text-sm font-light tracking-widest uppercase">Enter</span>
            <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
