import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import useExploreStore from '../../store/useExploreStore';
import useWishlistStore from '../../store/useWishlistStore';
import { getNotifications, markAllRead, markOneRead, deleteOneNotification, deleteReadNotifications } from '../../api/notificationApi';
import useToast from '../../hooks/useToast';
import useRecentSearch from '../../hooks/useRecentSearch';

const formatDate = (str) => {
  const d = new Date(str);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

const Header = () => {
  const { user, logout } = useAuthStore();
  const { setKeyword } = useExploreStore();
  const { clearWishlist } = useWishlistStore();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');

  const showToast = useToast();
  const { recents, addSearch, removeSearch, clearAll: clearSearches } = useRecentSearch();
  const [searchFocused, setSearchFocused] = useState(false);
  const searchContainerRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notiOpen, setNotiOpen] = useState(false);
  const notiRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      const authBoundaryError = /permission|auth|login|로그인/i.test(`${error?.code || ''} ${error?.message || ''}`);
      if (authBoundaryError) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      showToast('알림을 불러오는 데 실패했습니다.');
    }
  }, [showToast]);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
  }, [user, fetchNotifications]);

  // 외부 클릭 시 닫기 (알림 + 검색창)
  useEffect(() => {
    const handler = (e) => {
      if (notiRef.current && !notiRef.current.contains(e.target)) setNotiOpen(false);
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) setSearchFocused(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpenNoti = () => {
    setNotiOpen(prev => !prev);
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleDeleteOne = async (e, id) => {
    e.stopPropagation();
    await deleteOneNotification(id);
    setNotifications(prev => {
      const removed = prev.find(n => n.id === id);
      if (removed && !removed.is_read) setUnreadCount(c => Math.max(0, c - 1));
      return prev.filter(n => n.id !== id);
    });
  };

  const handleDeleteRead = async () => {
    await deleteReadNotifications();
    setNotifications(prev => prev.filter(n => !n.is_read));
  };

  const handleClickNoti = async (noti) => {
    if (!noti.is_read) {
      await markOneRead(noti.id);
      setNotifications(prev => prev.map(n => n.id === noti.id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setNotiOpen(false);
    if (noti.content_id) {
      // board 댓글 알림: content_id = '/board/123'
      // 여행지 알림: content_id = '125276' (숫자 문자열)
      navigate(noti.content_id.startsWith('/') ? noti.content_id : `/explore/${noti.content_id}`);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    if (!searchInput.trim()) {
      alert('검색어를 입력해 주세요.');
      return;
    }
    const kw = searchInput.trim();
    addSearch(kw);
    setKeyword(kw);
    setSearchInput('');
    setSearchFocused(false);
    navigate('/explore');
  };

  const handleRecentClick = (keyword) => {
    addSearch(keyword);
    setKeyword(keyword);
    setSearchInput('');
    setSearchFocused(false);
    navigate('/explore');
  };

  const handleLogout = () => {
    if (!window.confirm('로그아웃 하시겠습니까?')) return;
    logout();
    clearWishlist();
    navigate('/login');
  };

  return (
    <header className="flex items-center justify-between gap-2 px-3 sm:px-6 w-full h-16 sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-outline-variant/10 font-['Plus_Jakarta_Sans']">
      <div className="flex items-center flex-1 min-w-0">
        <div className="relative block w-full max-w-md lg:max-w-xl min-w-[150px]" ref={searchContainerRef}>
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-outline text-sm">search</span>
          </div>
          <input
            className="bg-surface-container-high border-none rounded-lg py-2.5 pl-10 pr-3 text-sm w-full focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest transition-all outline-none truncate"
            placeholder="Search destinations, festivals, themes..."
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onFocus={() => setSearchFocused(true)}
          />
          {/* 최근 검색어 드롭다운 */}
          {searchFocused && recents.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-outline-variant/10 overflow-hidden z-[200]">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">recent_searches</span>
                <button onMouseDown={clearSearches} className="text-[10px] font-mono text-slate-400 hover:text-red-400 transition-colors">전체 삭제</button>
              </div>
              {recents.map((kw) => (
                <div
                  key={kw}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 group cursor-pointer"
                  onMouseDown={() => handleRecentClick(kw)}
                >
                  <span className="material-symbols-outlined text-sm text-slate-300">history</span>
                  <span className="flex-1 text-sm text-on-surface">{kw}</span>
                  <button
                    onMouseDown={(e) => { e.stopPropagation(); removeSearch(kw); }}
                    className="material-symbols-outlined text-sm text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >close</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {user ? (
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="text-right hidden md:block leading-tight">
              <p className="text-[10px] font-bold text-primary uppercase tracking-tighter mb-0.5">Authenticated</p>
              <p className="text-sm font-bold text-on-surface">{user.name}</p>
            </div>

            <div className="flex items-center gap-0.5 sm:gap-1 bg-surface-container-low rounded-xl p-1 pr-1 border border-outline-variant/10">

              {/* 알림 벨 */}
              <div className="relative" ref={notiRef}>
                <button
                  onClick={handleOpenNoti}
                  className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/5 transition-all"
                  title="알림"
                >
                  <span className="material-symbols-outlined text-lg">notifications</span>
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-background" />
                  )}
                </button>

                {/* 알림 드롭다운 */}
                {notiOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-outline-variant/10 overflow-hidden z-[100]">
                    {/* 헤더 */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-sm">notifications</span>
                        <span className="text-xs font-mono font-bold text-on-surface uppercase tracking-widest">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-[10px] font-mono text-primary hover:underline"
                          >
                            모두 읽음
                          </button>
                        )}
                        {notifications.some(n => n.is_read) && (
                          <button
                            onClick={handleDeleteRead}
                            className="text-[10px] font-mono text-slate-400 hover:text-red-400 transition-colors"
                          >
                            읽은 알림 삭제
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 알림 목록 */}
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2">
                          <span className="material-symbols-outlined text-3xl text-slate-200">notifications_off</span>
                          <p className="text-xs font-mono text-slate-400">// no_notifications</p>
                        </div>
                      ) : (
                        notifications.map(noti => (
                          <div
                            key={noti.id}
                            className={`relative flex items-start gap-3 px-4 py-3 border-b border-slate-50 group/noti ${!noti.is_read ? 'bg-primary/5' : ''}`}
                          >
                            <button
                              onClick={() => handleClickNoti(noti)}
                              className="flex items-start gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
                            >
                              <span className={`material-symbols-outlined text-sm mt-0.5 shrink-0 ${!noti.is_read ? 'text-primary' : 'text-slate-300'}`}>
                                location_on
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs leading-relaxed ${!noti.is_read ? 'text-on-surface font-bold' : 'text-slate-500'}`}>
                                  {noti.message}
                                </p>
                                <p className="text-[10px] font-mono text-slate-400 mt-1">{formatDate(noti.created_at)}</p>
                              </div>
                            </button>
                            <div className="flex items-center gap-1 shrink-0 mt-0.5">
                              {!noti.is_read && (
                                <span className="w-1.5 h-1.5 bg-primary rounded-full group-hover/noti:hidden" />
                              )}
                              <button
                                onClick={(e) => handleDeleteOne(e, noti.id)}
                                className="material-symbols-outlined text-sm text-slate-300 hover:text-red-400 transition-colors opacity-0 group-hover/noti:opacity-100"
                                title="알림 삭제"
                              >close</button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Link to="/settings" className="p-1 relative group cursor-pointer">
                <img
                  src={user.profileImg || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                  alt="Profile"
                  className="w-8 h-8 rounded-lg border border-outline-variant/30 group-hover:border-primary transition-colors object-cover"
                  onError={(e) => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png'; }}
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-background rounded-full" />
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all group/logout"
                title="Sign Out"
              >
                <span className="material-symbols-outlined text-lg group-hover/logout:translate-x-0.5 transition-transform">logout</span>
                <span className="text-[10px] font-bold uppercase tracking-widest hidden lg:inline">Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <Link
            to="/login"
            className="px-5 py-2 bg-primary text-white font-headline font-bold rounded-lg hover:brightness-110 transition-all text-sm flex items-center gap-2 shadow-md"
          >
            <span className="material-symbols-outlined text-base font-normal">login</span>
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
