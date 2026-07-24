import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import authApi from '../api/authApi';

const Login = () => {
  const [email, setEmail] = useState(() => localStorage.getItem('remembered_email') || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('remembered_email'));
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, prepareLogin, cancelLogin } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      setIsLoading(true);
      prepareLogin();
      const data = await authApi.login({ email: email.trim(), password });
      
      // Handle Remember Me
      if (rememberMe) {
        localStorage.setItem('remembered_email', email);
      } else {
        localStorage.removeItem('remembered_email');
      }

      // Store token and user data in Zustand + LocalStorage
      login(data.user);
      localStorage.setItem('trip_token', data.token);
      
      navigate('/');
    } catch (err) {
      cancelLogin();
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md glass-panel p-10 rounded-3xl shadow-2xl border border-white/50">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary rounded-2xl mb-4">
            <span className="material-symbols-outlined text-4xl">terminal</span>
          </div>
          <h2 className="text-3xl font-headline font-bold text-on-background">Welcome Back</h2>
          <p className="text-on-secondary-container mt-2 font-label text-sm uppercase tracking-widest">// Authenticate System</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold rounded flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-primary ml-1 uppercase tracking-tighter">Email Address</label>
            <div className="flex h-14 items-center gap-3 rounded-2xl bg-surface-container-low px-4 transition-all focus-within:bg-surface-container-lowest focus-within:ring-2 focus-within:ring-primary">
              <span className="material-symbols-outlined flex h-5 w-5 items-center justify-center text-lg leading-none text-outline">mail</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-full min-w-0 flex-1 border-none bg-transparent p-0 text-sm leading-none outline-none placeholder:text-outline"
                placeholder="developer@codetrip.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-primary ml-1 uppercase tracking-tighter">Password</label>
            <div className="flex h-14 items-center gap-3 rounded-2xl bg-surface-container-low px-4 transition-all focus-within:bg-surface-container-lowest focus-within:ring-2 focus-within:ring-primary">
              <span className="material-symbols-outlined flex h-5 w-5 items-center justify-center text-lg leading-none text-outline">lock</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-full min-w-0 flex-1 border-none bg-transparent p-0 text-sm leading-none outline-none placeholder:text-outline"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-label">
            <label className="flex items-center gap-2 text-on-secondary-container cursor-pointer">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-primary rounded border-none bg-surface-container-high" 
              />
              Remember Me
            </label>
            <Link to="/forgot-password" data-testid="forgot-password" className="text-primary hover:underline">Forgot Password?</Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-primary text-white font-headline font-bold rounded-2xl shadow-lg hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4 disabled:cursor-wait disabled:opacity-70 disabled:active:scale-100"
          >
            <span className={`material-symbols-outlined text-xl ${isLoading ? 'animate-spin' : ''}`}>
              {isLoading ? 'progress_activity' : 'login'}
            </span>
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm">
          <span className="text-on-secondary-container">Don't have an account? </span>
          <Link to="/signup" className="text-primary font-bold hover:underline">Create Account</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
