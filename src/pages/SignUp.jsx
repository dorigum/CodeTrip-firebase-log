import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authApi from '../api/authApi';
import ConfirmModal from '../components/ConfirmModal';

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [signupSuccessOpen, setSignupSuccessOpen] = useState(false);
  const [, setIsLoading] = useState(false);
  const navigate = useNavigate();

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
            className="w-full py-4 bg-primary text-white font-headline font-bold rounded-2xl shadow-lg hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
          >
            <span className="material-symbols-outlined text-xl">app_registration</span>
            Create Account
          </button>
        </form>

        <div className="mt-8 text-center text-sm">
          <span className="text-on-secondary-container">Already have an account? </span>
          <Link to="/login" className="text-primary font-bold hover:underline">Sign In</Link>
        </div>
      </div>

      <ConfirmModal
        open={signupSuccessOpen}
        title="회원가입 완료"
        description="CodeTrip 계정이 생성되었습니다. 로그인 후 위시리스트와 AI 여행 코스를 이용해보세요."
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
