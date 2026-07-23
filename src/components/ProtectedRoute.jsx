import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import ConfirmModal from './ConfirmModal';

const ProtectedRoute = ({ children, title = '회원 전용 페이지', description }) => {
  const { isLoggedIn, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  if (isLoggedIn) return children;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-outline">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="font-mono text-xs uppercase tracking-widest">// checking_auth_session...</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-[60vh] bg-background" />
      <ConfirmModal
        open
        title={title}
        description={description || '이 페이지는 로그인한 사용자만 이용할 수 있습니다. 로그인 후 위시리스트, AI 코스, 게시판 기능을 이어서 사용해보세요.'}
        confirmText="LOGIN"
        cancelText="HOME"
        icon="lock"
        tone="primary"
        onConfirm={() => navigate('/login', { state: { from: location.pathname } })}
        onCancel={() => navigate('/')}
      />
    </>
  );
};

export default ProtectedRoute;
