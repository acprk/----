import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Mail, Lock, User, Key, AlertCircle, CheckCircle } from 'lucide-react';

const Login = () => {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [formData, setFormData] = useState({ email: '', password: '', key: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, signup, resetPassword, loginWithKey, isSupabaseConfigured } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
        if (mode === 'login') {
            const { data, error } = await login(formData.email, formData.password);
            if (error) throw error;
            if (data.user) navigate('/');
        } 
        else if (mode === 'register') {
            const { data, error } = await signup(formData.email, formData.password);
            if (error) throw error;
            if (data.user) {
                setMessage('Registration successful! Please check your email to confirm.');
                setMode('login');
            }
        } 
        else if (mode === 'forgot') {
            const { error } = await resetPassword(formData.email);
            if (error) throw error;
            setMessage('Password reset link sent to your email.');
            setMode('login');
        }
    } catch (err) {
        setError(err.message || 'An error occurred');
    } finally {
        setLoading(false);
    }
  };

  const handleKeyLogin = (e) => {
      e.preventDefault();
      if (loginWithKey(formData.key.trim())) {
          navigate('/');
      } else {
          setError('Invalid Demo Key');
      }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center bg-slate-900 bg-cover bg-center relative font-sans"
      style={{ 
        backgroundImage: "url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=3270&auto=format&fit=crop')" 
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      <div className="relative z-10 w-full max-w-md px-6">
        <h1 className="text-4xl font-light tracking-[0.2em] text-white/90 mb-2 text-center uppercase drop-shadow-lg">
          XZY
        </h1>
        <p className="text-white/60 text-center mb-10 font-light tracking-widest text-sm uppercase">
            {mode === 'login' && 'Access Control'}
            {mode === 'register' && 'New Identity'}
            {mode === 'forgot' && 'Recovery'}
        </p>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-2xl">
            {/* Error / Success Messages */}
            {error && (
                <div className="mb-6 bg-red-500/20 border border-red-500/50 p-3 rounded-lg flex items-center gap-3 text-red-100 text-sm">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}
            {message && (
                <div className="mb-6 bg-green-500/20 border border-green-500/50 p-3 rounded-lg flex items-center gap-3 text-green-100 text-sm">
                    <CheckCircle size={16} />
                    {message}
                </div>
            )}

            {!isSupabaseConfigured ? (
                 /* Legacy Key Mode if no Cloud Config */
                 <form onSubmit={handleKeyLogin} className="space-y-6">
                    <div className="relative group">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" size={18} />
                        <input
                        type="password"
                        value={formData.key}
                        onChange={(e) => setFormData({...formData, key: e.target.value})}
                        placeholder="ENTER DEMO KEY"
                        className="w-full py-3 pl-10 pr-4 bg-black/20 border border-white/10 rounded-lg focus:border-white/50 focus:bg-black/40 focus:outline-none transition-all text-white placeholder:text-white/30 tracking-widest text-center"
                        />
                    </div>
                    <button type="submit" className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white font-light tracking-widest uppercase transition-all hover:scale-[1.02]">
                        Enter System
                    </button>
                 </form>
            ) : (
                /* Cloud Auth Forms */
                <form onSubmit={handleSubmit} className="space-y-5">
                    {mode !== 'forgot' && (
                        <>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" size={18} />
                                <input
                                    required
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    placeholder="Email Address"
                                    className="w-full py-3 pl-10 pr-4 bg-black/20 border border-white/10 rounded-lg focus:border-white/50 focus:bg-black/40 focus:outline-none transition-all text-white placeholder:text-white/30"
                                />
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" size={18} />
                                <input
                                    required
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    placeholder="Password"
                                    className="w-full py-3 pl-10 pr-4 bg-black/20 border border-white/10 rounded-lg focus:border-white/50 focus:bg-black/40 focus:outline-none transition-all text-white placeholder:text-white/30"
                                />
                            </div>
                        </>
                    )}

                    {mode === 'forgot' && (
                        <div className="relative group">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" size={18} />
                            <input
                                required
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                placeholder="Enter your email to reset"
                                className="w-full py-3 pl-10 pr-4 bg-black/20 border border-white/10 rounded-lg focus:border-white/50 focus:bg-black/40 focus:outline-none transition-all text-white placeholder:text-white/30"
                            />
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-3 bg-white/90 hover:bg-white text-slate-900 rounded-lg font-bold tracking-widest uppercase transition-all hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processing...' : (
                            <>
                                {mode === 'login' && 'Sign In'}
                                {mode === 'register' && 'Create Account'}
                                {mode === 'forgot' && 'Send Reset Link'}
                                <ArrowRight size={16} />
                            </>
                        )}
                    </button>
                </form>
            )}

            {/* Mode Switchers */}
            {isSupabaseConfigured && (
                <div className="mt-6 flex flex-col gap-3 text-center text-xs text-white/50 font-light tracking-wide">
                    {mode === 'login' && (
                        <>
                            <button onClick={() => setMode('register')} className="hover:text-white underline decoration-white/30 underline-offset-4 transition-colors">
                                No account? Create one
                            </button>
                            <button onClick={() => setMode('forgot')} className="hover:text-white transition-colors">
                                Forgot password?
                            </button>
                        </>
                    )}
                    {mode === 'register' && (
                        <button onClick={() => setMode('login')} className="hover:text-white underline decoration-white/30 underline-offset-4 transition-colors">
                            Already have an account? Sign In
                        </button>
                    )}
                    {mode === 'forgot' && (
                        <button onClick={() => setMode('login')} className="hover:text-white transition-colors">
                            Back to Sign In
                        </button>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Login;
