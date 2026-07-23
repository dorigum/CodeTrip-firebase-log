import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './components/Layout/Header';
import SideBar from './components/Layout/SideBar';
import Footer from './components/Layout/Footer';
import useRegionStore from './store/useRegionStore';
import useAuthStore from './store/useAuthStore';
import { ToastProvider } from './context/ToastProvider';
import './App.css';

const App = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showTopButton, setShowTopButton] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const unsubscribeAuth = useAuthStore.getState().initAuthListener();
    useRegionStore.getState().fetchRegions();
    return () => {
      unsubscribeAuth?.();
    };
  }, []);

  useEffect(() => {
    const scrollNode = document.getElementById('main-scroll');
    if (!scrollNode) return undefined;

    const handleScroll = () => {
      setShowTopButton(scrollNode.scrollTop > 360);
    };

    handleScroll();
    scrollNode.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollNode.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const scrollNode = document.getElementById('main-scroll');
    scrollNode?.scrollTo({ top: 0, behavior: 'auto' });
    scrollNode?.dispatchEvent(new Event('scroll'));
  }, [location.pathname]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const scrollToTop = () => {
    const scrollNode = document.getElementById('main-scroll');
    scrollNode?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-background text-on-surface font-body selection:bg-primary-fixed overflow-hidden">
        {/* Side Navigation */}
        <SideBar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />

        {/* Main Wrapper */}
        <main className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isCollapsed ? 'md:ml-20' : 'md:ml-56'} h-screen`}>
          <Header toggleSidebar={toggleSidebar} />

          {/* Dynamic Content Area */}
          <div id="main-scroll" className="flex-1 overflow-y-auto custom-scrollbar no-scrollbar pb-16 md:pb-0" style={{ overflowAnchor: 'none' }}>
            <Outlet />

            {/* 푸터 복구 */}
            <Footer />
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            aria-label="상단으로 이동"
            className={`fixed bottom-24 right-5 z-[70] flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-xl shadow-primary/20 transition-all duration-300 hover:-translate-y-1 hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-primary/30 md:bottom-12 md:right-6 ${
              showTopButton ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
            }`}
          >
            <span className="material-symbols-outlined text-lg">keyboard_arrow_up</span>
          </button>
        </main>
      </div>
    </ToastProvider>
  );
};

export default App;
