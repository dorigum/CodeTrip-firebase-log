import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import useWishlistStore from '../../store/useWishlistStore';
import ConfirmModal from '../ConfirmModal';

const NAV_ITEMS = [
  {
    icon: 'home',
    label: 'Home',
    path: '/',
    animation: 'home-glow',
    extra: <div className="home-halo" />,
  },
  {
    icon: 'explore',
    label: 'Explore',
    path: '/explore',
    animation: 'explore-spin',
    extra: <div className="explore-halo" />,
  },
  {
    icon: 'celebration',
    label: 'Festivals',
    path: '/festivals',
    animation: 'fest-glow',
    extra: (
      <>
        <div className="firework-spark spark-1"></div>
        <div className="firework-spark spark-2"></div>
        <div className="firework-spark spark-3"></div>
        <div className="firework-spark spark-4"></div>
      </>
    ),
  },
  {
    icon: 'auto_awesome',
    label: 'AI Planner',
    path: '/ai-planner',
    animation: 'ai-sparkle',
    extra: <div className="ai-halo" />,
  },
  {
    icon: 'article',
    label: 'Board',
    path: '/board',
    animation: 'board-pop-flip',
    extra: <div className="board-halo" />,
  },
];

const MY_PAGE_ITEM = {
  icon: 'person',
  label: 'My Page',
  paths: ['/mypage', '/settings', '/my-activity', '/my-activity'],
  animation: 'account-shake',
  extra: <div className="settings-halo" />,
};

const MY_PAGE_SUB_ITEMS = [
  { icon: 'favorite', label: 'WishList', href: '/mypage', external: false },
  { icon: 'history', label: 'My Activity', href: '/my-activity', external: false },
  { icon: 'manage_accounts', label: 'UserInfo Edit', href: '/settings', external: false },
];

const INFO_ITEM = {
  icon: 'lightbulb',
  label: 'Info',
  path: '/info',
  animation: 'bulb-flicker',
  extra: <div className="bulb-glow" />,
};

const INFO_SUB_ITEMS = [
  { icon: 'wifi', label: 'Public_Wifi', href: 'https://www.wififree.kr/index.do', external: true },
  { icon: 'health_and_safety', label: 'Safestay', href: 'https://safestay.visitkorea.or.kr/usr/main/mainSelectList.kto', external: true },
  { icon: 'train', label: 'KTX_Booking', href: 'https://www.letskorail.com/', external: true },
  { icon: 'directions_railway', label: 'SRT_Booking', href: 'https://etk.srail.kr/', external: true },
  { icon: 'directions_bus', label: 'BUS_Booking', href: 'https://txbus.t-money.co.kr/', external: true },
  { icon: 'info', label: 'About_CodeTrip', href: '/info', external: false },
];

const SideBar = ({ isCollapsed, toggleSidebar }) => {
  const [myPageSubOpen, setMyPageSubOpen] = useState(false);
  const [infoSubOpen, setInfoSubOpen] = useState(false);
  const [mobileMyPageOpen, setMobileMyPageOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [accessConfirmOpen, setAccessConfirmOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout, isLoggedIn, isLoading } = useAuthStore();
  const { clearWishlist } = useWishlistStore();

  const isActive = (path) => (path === '/' ? pathname === '/' : pathname.startsWith(path));

  const handleNavClick = (e, item) => {
    const protectedPaths = ['/mypage', '/settings', '/my-activity', '/ai-planner', '/board'];
    if (protectedPaths.includes(item.path) && !isLoggedIn) {
      e.preventDefault();
      setAccessConfirmOpen(true);
      setMobileMyPageOpen(false);
      return;
    }

    setMobileMyPageOpen(false);
  };

  const handleLogout = () => {
    setLogoutConfirmOpen(false);
    logout();
    clearWishlist();
    navigate('/');
  };

  return (
    <>
      <aside 
        className={`fixed left-0 top-0 h-full bg-white border-r border-outline-variant/30 z-[55] flex flex-col transition-all duration-300 select-none ${
          isCollapsed ? 'w-20 overflow-visible' : 'w-56 overflow-hidden'
        } hidden md:flex`}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center px-6 shrink-0 border-b border-outline-variant/10">
          {!isCollapsed ? (
            <Link 
              to="/" 
              className="flex items-center gap-2 text-xl font-bold tracking-tighter text-slate-900 transition-opacity duration-300 hover:text-primary opacity-100"
            >
              <img src="/favicon.svg" alt="" className="h-8 w-8 rounded-lg shadow-sm" />
              <span>CodeTrip</span>
            </Link>
          ) : (
            <div className="w-0 overflow-hidden opacity-0">CodeTrip</div>
          )}
          
          <button 
            onClick={toggleSidebar} 
            className={`material-symbols-outlined text-primary hover:bg-primary/5 p-1 rounded-lg transition-all ${isCollapsed ? 'mx-auto' : 'ml-auto'}`}
          >
            {isCollapsed ? 'menu' : 'menu_open'}
          </button>
        </div>

        <div className={`flex-1 min-h-0 flex flex-col ${isCollapsed ? 'overflow-visible' : 'overflow-y-auto overflow-x-hidden no-scrollbar'}`}>
          {/* Navigation Items */}
          <nav className="py-8 flex flex-col gap-2 shrink-0">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                onClick={(e) => handleNavClick(e, item)}
                className={`flex items-center gap-4 px-6 py-3 transition-all duration-300 group ${
                  isActive(item.path)
                    ? 'text-primary bg-primary/5 border-r-4 border-primary font-semibold'
                    : 'text-slate-600 hover:text-primary hover:bg-slate-50'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <span className={`material-symbols-outlined ${isActive(item.path) ? 'fill-1' : ''} transition-all duration-300 ${item.animation}`}>
                    {item.icon}
                  </span>
                  {item.extra}
                </div>
                <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                  {item.label}
                </span>
              </Link>
            ))}

          {/* My Page 아이템 + 플로팅 서브메뉴 */}
          <div className="group relative">
            <button
              onClick={() => !isCollapsed && setMyPageSubOpen(prev => !prev)}
              className={`w-full flex items-center gap-4 px-6 py-3 transition-all duration-300 ${
                MY_PAGE_ITEM.paths.some(p => pathname.startsWith(p))
                  ? 'text-primary bg-primary/5 border-r-4 border-primary font-semibold'
                  : 'text-slate-600 hover:text-primary hover:bg-slate-50'
              }`}
            >
              <div className="relative flex items-center justify-center shrink-0">
                <span className={`material-symbols-outlined ${MY_PAGE_ITEM.paths.some(p => pathname.startsWith(p)) ? 'fill-1' : ''} transition-all duration-300 ${MY_PAGE_ITEM.animation}`}>
                  {MY_PAGE_ITEM.icon}
                </span>
                {MY_PAGE_ITEM.extra}
              </div>
              <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                {MY_PAGE_ITEM.label}
              </span>
              {!isCollapsed && (
                <span className={`material-symbols-outlined text-base ml-auto text-slate-400 transition-transform duration-300 ${myPageSubOpen ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              )}
            </button>

            {/* 서브메뉴: 접혔을 땐 플로팅, 펼쳐졌을 땐 아코디언 */}
            <div className={`
              ${isCollapsed 
                ? 'absolute left-full top-0 ml-2 w-48 bg-white border border-outline-variant/20 rounded-xl shadow-2xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-x-2 group-hover:translate-x-0 transition-all duration-200 z-[60]' 
                : `overflow-hidden transition-all duration-300 ${myPageSubOpen ? 'max-h-36 opacity-100' : 'max-h-0 opacity-0'}`
              }
            `}>
              {MY_PAGE_SUB_ITEMS.map((sub) => (
                <Link
                  key={sub.label}
                  to={sub.href}
                  onClick={(e) => handleNavClick(e, { path: sub.href })}
                  className={`flex items-center gap-3 py-2 transition-all duration-200 group/sub ${
                    isCollapsed ? 'px-4' : 'pl-14 pr-6'
                  } ${
                    isActive(sub.href) ? 'text-primary font-semibold' : 'text-slate-400 hover:text-primary hover:bg-slate-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] shrink-0">{sub.icon}</span>
                  <span className="text-[11px] font-mono font-bold uppercase tracking-widest truncate">{sub.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Info 아이템 + 플로팅 서브메뉴 */}
          <div className="group relative">
            <button
              onClick={() => !isCollapsed && setInfoSubOpen(prev => !prev)}
              className={`w-full flex items-center gap-4 px-6 py-3 transition-all duration-300 ${
                isActive(INFO_ITEM.path)
                  ? 'text-primary bg-primary/5 border-r-4 border-primary font-semibold'
                  : 'text-slate-600 hover:text-primary hover:bg-slate-50'
              }`}
            >
              <div className="relative flex items-center justify-center shrink-0">
                <span className={`material-symbols-outlined ${isActive(INFO_ITEM.path) ? 'fill-1' : ''} transition-all duration-300 ${INFO_ITEM.animation}`}>
                  {INFO_ITEM.icon}
                </span>
                {INFO_ITEM.extra}
              </div>
              <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                {INFO_ITEM.label}
              </span>
              {!isCollapsed && (
                <span className={`material-symbols-outlined text-base ml-auto text-slate-400 transition-transform duration-300 ${infoSubOpen ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              )}
            </button>

            <div className={`
              ${isCollapsed 
                ? 'absolute left-full top-0 ml-2 w-48 bg-white border border-outline-variant/20 rounded-xl shadow-2xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-x-2 group-hover:translate-x-0 transition-all duration-200 z-[60]' 
                : `overflow-hidden transition-all duration-300 ${infoSubOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`
              }
            `}>
              {INFO_SUB_ITEMS.map((sub) =>
                sub.external ? (
                  <a
                    key={sub.label}
                    href={sub.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 py-2 text-slate-400 hover:text-primary hover:bg-slate-50 transition-all duration-200 group/sub ${
                      isCollapsed ? 'px-4' : 'pl-14 pr-6'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px] shrink-0">{sub.icon}</span>
                    <span className="text-[11px] font-mono font-bold uppercase tracking-widest truncate">{sub.label}</span>
                    <span className="material-symbols-outlined text-[12px] ml-auto opacity-0 group-hover/sub:opacity-100 transition-opacity">open_in_new</span>
                  </a>
                ) : (
                  <Link
                    key={sub.label}
                    to={sub.href}
                    className={`flex items-center gap-3 py-2 transition-all duration-200 group/sub ${
                      isCollapsed ? 'px-4' : 'pl-14 pr-6'
                    } ${
                      isActive(sub.href) ? 'text-primary font-semibold' : 'text-slate-400 hover:text-primary hover:bg-slate-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px] shrink-0">{sub.icon}</span>
                    <span className="text-[11px] font-mono font-bold uppercase tracking-widest truncate">{sub.label}</span>
                  </Link>
                )
              )}
            </div>
          </div>
          </nav>

          {/* User Profile Area */}
          <div className={`border-t border-outline-variant/10 mt-auto shrink-0 ${isCollapsed ? 'px-0 py-4 flex justify-center' : 'p-4'}`}>
            {isLoading ? (
              <div className={`h-10 animate-pulse rounded-full bg-surface-container-low ${isCollapsed ? 'w-10' : 'w-full'}`} />
            ) : isLoggedIn && user ? (
              <div className={`flex flex-col gap-4 ${isCollapsed ? 'items-center' : ''}`}>
                <div className={`flex items-center overflow-hidden ${isCollapsed ? 'justify-center gap-0 w-full' : 'gap-4'}`}>
                  <img 
                    src={user.profileImg || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                    alt="User" 
                    className="w-10 h-10 rounded-full border border-outline-variant/15 shrink-0 object-cover" 
                    onError={(e) => {
                      e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                    }}
                  />
                  <div className={`transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                    <p className="text-sm font-bold truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest truncate">Premium Core</p>
                  </div>
                </div>
                {!isCollapsed && (
                  <button 
                    onClick={() => setLogoutConfirmOpen(true)}
                    className="w-full py-2 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2 group/logout"
                  >
                    <span className="material-symbols-outlined text-sm transition-transform duration-300 group-hover/logout:-translate-x-1">logout</span>
                    LOGOUT_SYSTEM
                  </button>
                )}
              </div>
            ) : (
              <Link to="/login" className={`flex items-center gap-4 transition-all group ${isCollapsed ? 'justify-center' : 'px-2'}`}>
                <span className="material-symbols-outlined text-primary transition-transform duration-300 group-hover:scale-110">account_circle</span>
                {!isCollapsed && <span className="text-sm font-bold uppercase text-primary">Sign In</span>}
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile My Page 서브메뉴 팝업 */}
      {mobileMyPageOpen && (
        <>
          <div
            className="fixed inset-0 z-[54] md:hidden"
            onClick={() => setMobileMyPageOpen(false)}
          />
          <div className="fixed bottom-16 right-0 z-[56] md:hidden w-48 bg-white border border-outline-variant/20 rounded-tl-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
            {MY_PAGE_SUB_ITEMS.map((sub) => (
              <Link
                key={sub.label}
                to={sub.href}
                onClick={(e) => { handleNavClick(e, { path: sub.href }); setMobileMyPageOpen(false); }}
                className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${
                  isActive(sub.href)
                    ? 'text-primary bg-primary/5 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className={`material-symbols-outlined text-base ${isActive(sub.href) ? 'fill-1' : ''}`}>{sub.icon}</span>
                <span className="text-[11px] font-mono font-bold uppercase tracking-widest">{sub.label}</span>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-outline-variant/30 z-[55] flex md:hidden items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            onClick={(e) => handleNavClick(e, item)}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all group ${
              isActive(item.path) ? 'text-primary' : 'text-slate-400'
            }`}
          >
            <span className="relative flex items-center justify-center">
              <span className={`material-symbols-outlined text-2xl ${isActive(item.path) ? 'fill-1' : ''} transition-all duration-300 ${item.animation}`}>
                {item.icon}
              </span>
              {item.extra}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
          </Link>
        ))}
        <button
          onClick={() => setMobileMyPageOpen(prev => !prev)}
          className={`group flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all ${
            MY_PAGE_ITEM.paths.some(p => pathname.startsWith(p)) ? 'text-primary' : 'text-slate-400'
          } ${mobileMyPageOpen ? 'is-mobile-open text-primary' : ''}`}
        >
          <span className="relative flex items-center justify-center">
            <span className={`material-symbols-outlined text-2xl ${MY_PAGE_ITEM.paths.some(p => pathname.startsWith(p)) ? 'fill-1' : ''} transition-all duration-300 ${MY_PAGE_ITEM.animation}`}>
              {mobileMyPageOpen ? 'close' : MY_PAGE_ITEM.icon}
            </span>
            {MY_PAGE_ITEM.extra}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-tighter">My Page</span>
        </button>
      </nav>

      <ConfirmModal
        open={logoutConfirmOpen}
        title="로그아웃"
        description="현재 계정에서 로그아웃하시겠습니까? 저장된 위시리스트 상태는 서버에 보관됩니다."
        confirmText="LOGOUT"
        cancelText="CANCEL"
        icon="logout"
        tone="danger"
        onConfirm={handleLogout}
        onCancel={() => setLogoutConfirmOpen(false)}
      />
      <ConfirmModal
        open={accessConfirmOpen}
        title="회원 전용 페이지"
        description="이 페이지는 로그인한 사용자만 이용할 수 있습니다. 로그인 후 AI 코스, 게시판, 마이페이지 기능을 이어서 사용해보세요."
        confirmText="LOGIN"
        cancelText="HOME"
        icon="lock"
        tone="primary"
        onConfirm={() => {
          setAccessConfirmOpen(false);
          navigate('/login');
        }}
        onCancel={() => {
          setAccessConfirmOpen(false);
          navigate('/');
        }}
      />
    </>
  );
};

export default SideBar;
