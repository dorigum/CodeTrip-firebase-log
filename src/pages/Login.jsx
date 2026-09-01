import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import authApi from '../api/authApi';

const RETURN_AFTER_LOGIN_KEY = 'codetrip:return_after_login';
const PRESERVE_EXPLORE_STATE_KEY = 'codetrip:preserve_explore_state';
let preserveExploreCleanupTimer = null;

const getSafeReturnPath = (stateFrom) => {
  const storedFrom = sessionStorage.getItem(RETURN_AFTER_LOGIN_KEY);
  const candidate = typeof stateFrom === 'string' ? stateFrom : storedFrom;
  if (!candidate?.startsWith('/') || candidate.startsWith('//') || candidate.startsWith('/login')) {
    return '/';
  }
  return candidate;
};

const GoogleIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
    <path fill="#4285F4" d="M21.35 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.2 2.91-7.22Z" />
    <path fill="#34A853" d="M12 21.6c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.6Z" />
    <path fill="#FBBC05" d="M6.54 13.69a5.86 5.86 0 0 1 0-3.38V7.78H3.3a9.72 9.72 0 0 0 0 8.44l3.24-2.53Z" />
    <path fill="#EA4335" d="M12 6.28c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.39 14.63 2.4 12 2.4a9.74 9.74 0 0 0-8.7 5.38l3.24 2.53C7.31 8 9.46 6.28 12 6.28Z" />
  </svg>
);

const Login = () => {
  const [email, setEmail] = useState(() => localStorage.getItem('remembered_email') || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('remembered_email'));
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, prepareLogin, cancelLogin } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const returnPath = getSafeReturnPath(location.state?.from);
  const shouldKeepExploreStateRef = useRef(false);

  useEffect(() => {
    if (preserveExploreCleanupTimer) {
      clearTimeout(preserveExploreCleanupTimer);
      preserveExploreCleanupTimer = null;
    }

    return () => {
      preserveExploreCleanupTimer = setTimeout(() => {
        if (!shouldKeepExploreStateRef.current) {
          sessionStorage.removeItem(PRESERVE_EXPLORE_STATE_KEY);
        }
        preserveExploreCleanupTimer = null;
      }, 0);
    };
  }, []);

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
      sessionStorage.removeItem(RETURN_AFTER_LOGIN_KEY);
      if (returnPath.startsWith('/explore')) {
        shouldKeepExploreStateRef.current = true;
      } else {
        sessionStorage.removeItem(PRESERVE_EXPLORE_STATE_KEY);
      }
      
      navigate(returnPath, { replace: true });
    } catch (err) {
      shouldKeepExploreStateRef.current = false;
      cancelLogin();
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      setIsLoading(true);
      prepareLogin();
      const data = await authApi.loginWithGoogle();
      login(data.user);
      localStorage.setItem('trip_token', data.token);
      sessionStorage.removeItem(RETURN_AFTER_LOGIN_KEY);
      if (returnPath.startsWith('/explore')) {
        shouldKeepExploreStateRef.current = true;
      } else {
        sessionStorage.removeItem(PRESERVE_EXPLORE_STATE_KEY);
      }
      navigate(returnPath, { replace: true });
    } catch (err) {
      shouldKeepExploreStateRef.current = false;
      cancelLogin();
      setError(err.message || 'Google 로그인에 실패했습니다.');
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

        <div className="my-6 flex items-center gap-3 text-xs text-outline">
          <span className="h-px flex-1 bg-outline/20" />
          <span>OR</span>
          <span className="h-px flex-1 bg-outline/20" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-outline/20 bg-white py-4 font-headline font-bold text-on-background transition-all hover:bg-surface-container-low disabled:cursor-wait disabled:opacity-70"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="mt-8 text-center text-sm">
          <span className="text-on-secondary-container">Don't have an account? </span>
          <Link to="/signup" className="text-primary font-bold hover:underline">Create Account</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
