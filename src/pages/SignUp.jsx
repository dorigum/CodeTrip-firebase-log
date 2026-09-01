import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authApi from '../api/authApi';
import ConfirmModal from '../components/ConfirmModal';
import useAuthStore from '../store/useAuthStore';

const GoogleIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
    <path fill="#4285F4" d="M21.35 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.2 2.91-7.22Z" />
    <path fill="#34A853" d="M12 21.6c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.6Z" />
    <path fill="#FBBC05" d="M6.54 13.69a5.86 5.86 0 0 1 0-3.38V7.78H3.3a9.72 9.72 0 0 0 0 8.44l3.24-2.53Z" />
    <path fill="#EA4335" d="M12 6.28c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.39 14.63 2.4 12 2.4a9.74 9.74 0 0 0-8.7 5.38l3.24 2.53C7.31 8 9.46 6.28 12 6.28Z" />
  </svg>
);

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [signupSuccessOpen, setSignupSuccessOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, cancelLogin, isLoggedIn } = useAuthStore();
  const navigate = useNavigate();
  const googleSignupInProgressRef = useRef(false);

  useEffect(() => {
    if (isLoggedIn && !googleSignupInProgressRef.current) navigate('/', { replace: true });
  }, [isLoggedIn, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      await authApi.signup({
        email: formData.email.trim(),
        password: formData.password,
        name: formData.name.trim()
      });
      setSignupSuccessOpen(true);
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    googleSignupInProgressRef.current = true;
    try {
      setIsLoading(true);
      const data = await authApi.loginWithGoogle();
      if (!data.isNewUser) {
        cancelLogin();
        setError('이미 Google 계정으로 가입되어 있습니다. 로그인 화면에서 Google 로그인을 이용해 주세요.');
        return;
      }
      login(data.user);
      localStorage.setItem('trip_token', data.token);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Google 회원가입에 실패했습니다.');
    } finally {
      googleSignupInProgressRef.current = false;
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md glass-panel p-10 rounded-3xl shadow-2xl border border-white/50">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary rounded-2xl mb-4">
            <span className="material-symbols-outlined text-4xl">person_add</span>
          </div>
          <h2 className="text-3xl font-headline font-bold text-on-background">Initialize Account</h2>
          <p className="text-on-secondary-container mt-2 font-label text-sm uppercase tracking-widest">// Register New Developer</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold rounded flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ... 필드 부분은 동일 ... */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-primary ml-1 uppercase tracking-tighter">Full Name</label>
            <div className="flex h-14 items-center gap-3 rounded-2xl bg-surface-container-low px-4 transition-all focus-within:bg-surface-container-lowest focus-within:ring-2 focus-within:ring-primary">
              <span className="material-symbols-outlined flex h-5 w-5 items-center justify-center text-lg leading-none text-outline">badge</span>
              <input
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="h-full min-w-0 flex-1 border-none bg-transparent p-0 text-sm leading-none outline-none placeholder:text-outline"
                placeholder="Name or Nickname"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-primary ml-1 uppercase tracking-tighter">Email Address</label>
            <div className="flex h-14 items-center gap-3 rounded-2xl bg-surface-container-low px-4 transition-all focus-within:bg-surface-container-lowest focus-within:ring-2 focus-within:ring-primary">
              <span className="material-symbols-outlined flex h-5 w-5 items-center justify-center text-lg leading-none text-outline">mail</span>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
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
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                className="h-full min-w-0 flex-1 border-none bg-transparent p-0 text-sm leading-none outline-none placeholder:text-outline"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-primary ml-1 uppercase tracking-tighter">Confirm Password</label>
            <div className="flex h-14 items-center gap-3 rounded-2xl bg-surface-container-low px-4 transition-all focus-within:bg-surface-container-lowest focus-within:ring-2 focus-within:ring-primary">
              <span className="material-symbols-outlined flex h-5 w-5 items-center justify-center text-lg leading-none text-outline">verified_user</span>
              <input
                name="confirmPassword"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="h-full min-w-0 flex-1 border-none bg-transparent p-0 text-sm leading-none outline-none placeholder:text-outline"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-primary text-white font-headline font-bold rounded-2xl shadow-lg hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4 disabled:cursor-wait disabled:opacity-70"
          >
            <span className="material-symbols-outlined text-xl">app_registration</span>
            Create Account
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-outline">
          <span className="h-px flex-1 bg-outline/20" /><span>OR</span><span className="h-px flex-1 bg-outline/20" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-outline/20 bg-white py-4 font-headline font-bold text-on-background transition-all hover:bg-surface-container-low disabled:cursor-wait disabled:opacity-70"
        >
          <GoogleIcon />
          Sign up with Google
        </button>

        <div className="mt-8 text-center text-sm">
          <span className="text-on-secondary-container">Already have an account? </span>
          <Link to="/login" className="text-primary font-bold hover:underline">Sign In</Link>
        </div>
      </div>

      <ConfirmModal
        open={signupSuccessOpen}
        title="회원가입 완료"
        description="CodeTrip 계정이 생성되었습니다. 로그인 후 위시리스트와 AI 여행 플래너를 이용해보세요."
        confirmText="로그인하기"
        cancelText="닫기"
        icon="check_circle"
        tone="success"
        onConfirm={() => navigate('/login')}
        onCancel={() => navigate('/login')}
      />
    </div>
  );
};

export default SignUp;
