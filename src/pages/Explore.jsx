import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../App.css';
import useExploreStore, { NUM_OF_ROWS, getExploreScrollY, setExploreScrollY } from '../store/useExploreStore';
import useWishlistStore from '../store/useWishlistStore';
import useAuthStore from '../store/useAuthStore';
import WishlistModal from '../components/WishlistModal';
import PageHeader from '../components/PageHeader';
import { DEFAULT_THEMES } from '../constants/themes';
import authApi from '../api/authApi';
import useToast from '../hooks/useToast';
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000&auto=format&fit=crop';

const Explore = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm] = useState('');
  const [regionOpen, setRegionOpen] = useState(true);
  const [themeOpen, setThemeOpen] = useState(true);
  const [activeAnimId, setActiveAnimId] = useState(null); // 강제 애니메이션 트리거용 ID
  const [pageInput, setPageInput] = useState('');
  const [favoriteRegions, setFavoriteRegions] = useState([]);

  const { isLoggedIn } = useAuthStore();
  const { wishlistIds, toggleWishlist, initWishlist, initialized: wishlistInitialized } = useWishlistStore();

  const {
    regions,
    selectedRegions, toggleRegion,
    selectedThemes, toggleTheme,
    posts, loading, totalCount, currentPage,
    keyword, clearKeyword,
    sort, setSort,
    initialized, fetchError,
    applyFilter, changePage, applyFavoriteRegions, resetFilter,
  } = useExploreStore();

  const showToast = useToast();
  useEffect(() => {
    if (fetchError) showToast(fetchError);
  }, [fetchError, showToast]);

  const [wishlistLoadingId, setWishlistLoadingId] = useState(null);
  const [selectedTravel, setSelectedTravel] = useState(null); // 모달용
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setShowLoginDialog] = useState(false);
  const targetWishlistFolder = location.state?.targetWishlistFolder || null;

  const handleHeartToggle = async (post) => {
    if (!isLoggedIn) {
      setShowLoginDialog(true);
      return;
    }

    const postId = String(post.contentid);
    if (wishlistLoadingId === postId) return;

    // 이미 찜한 상태라면 즉시 삭제
    if (wishlistIds.has(postId)) {
      try {
        setWishlistLoadingId(postId);
        await toggleWishlist(post);
        alert('위시리스트에서 삭제되었습니다.');
      } catch (error) {
        console.error('Wishlist error:', error);
      } finally {
        setWishlistLoadingId(null);
      }
    } else {
      if (targetWishlistFolder) {
        try {
          setWishlistLoadingId(postId);
          await toggleWishlist({
            ...post,
            folder_id: targetWishlistFolder.id || null,
          });
          alert(`${targetWishlistFolder.name} 폴더에 추가되었습니다.`);
        } catch (error) {
          console.error('Wishlist error:', error);
        } finally {
          setWishlistLoadingId(null);
        }
        return;
      }

      // 처음 찜하는 상태라면 폴더 선택 모달 오픈
      setSelectedTravel(post);
      setIsModalOpen(true);
    }
  };

  const handleImageDoubleClick = (post) => {
    if (!isLoggedIn) {
      setShowLoginDialog(true);
      return;
    }
    
    const postId = String(post.contentid);
    // 위시리스트에 없는 상태에서 더블 클릭 시 애니메이션 트리거 및 모달 오픈
    if (!wishlistIds.has(postId)) {
      setActiveAnimId(postId);
      handleHeartToggle(post);
      setTimeout(() => setActiveAnimId(null), 1500);
    } else {
      handleHeartToggle(post);
    }
  };

  const totalPages = Math.ceil(totalCount / NUM_OF_ROWS);

  useEffect(() => {
    const init = async () => {
      let favCodes = [];
      if (isLoggedIn) {
        try { favCodes = await authApi.getFavoriteRegions(); } catch { /* 비로그인 시 무시 */ }
      }
      setFavoriteRegions(favCodes);
      if (!initialized) applyFavoriteRegions(favCodes);
    };
    init();
  }, []);

  // DOM 변경 이전에 실행되는 cleanup으로 정확한 scrollTop 저장
  useLayoutEffect(() => {
    return () => {
      const el = document.getElementById('main-scroll');
      if (el) setExploreScrollY(el.scrollTop);
    };
  }, []);

  // DOM 반영 후 스크롤 복원 (즉시 + rAF 재시도로 브라우저 scroll anchor 덮어씀)
  useLayoutEffect(() => {
    if (!initialized) return;
    const target = getExploreScrollY();
    if (!target) return;
    const el = document.getElementById('main-scroll');
    if (!el) return;
    el.scrollTop = target;
    const raf = requestAnimationFrame(() => { el.scrollTop = target; });
    return () => cancelAnimationFrame(raf);
  }, [initialized]);

  useEffect(() => {
    if (isLoggedIn && !wishlistInitialized) {
      initWishlist();
    }
  }, [isLoggedIn, wishlistInitialized]);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const el = document.getElementById('main-scroll');
    if (el) el.scrollTop = 0;
  }, [currentPage]);

  const handlePageInputSubmit = (e) => {
    e.preventDefault();
    const page = parseInt(pageInput);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      changePage(page);
    }
    setPageInput('');
  };

  const getPageNumbers = () => {
    const WINDOW = 2;
    const start = Math.max(1, currentPage - WINDOW);
    const end = Math.min(totalPages, currentPage + WINDOW);
    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const filteredPosts = posts.filter((post) =>
    post.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen">
      <header className="mb-10">
        <PageHeader
          label="travel_explore.exe"
          title="여행지 탐색"
          description="지역과 테마를 조합해 지금 필요한 여행지 데이터를 탐색하세요."
        />
        {keyword && (
          <div className="mt-4 inline-flex items-center gap-3 bg-surface-container-low border border-primary/20 rounded-lg px-4 py-2 font-mono text-sm">
            <span className="text-outline">// searching:</span>
            <span className="text-primary font-bold">"{keyword}"</span>
            <button
              onClick={clearKeyword}
              className="ml-1 text-outline hover:text-on-surface transition-colors flex items-center"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}
      </header>

      <div className="grid grid-cols-12 gap-8">
        {/* Sidebar Filters */}
        <aside className="col-span-12 lg:col-span-3 xl:col-span-2 self-start">
          <div className="bg-surface-container-low rounded-xl p-5 lg:sticky lg:top-8 border border-outline-variant/10 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-outline-variant/20 pb-4">
              <span className="material-symbols-outlined text-primary text-lg">settings_ethernet</span>
              <span className="font-bold text-on-surface font-mono text-sm uppercase tracking-tight">FILTERS.CONFIG</span>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:block lg:space-y-6">
              {/* Region */}
              <section>
                <div
                  className="flex items-center gap-1 mb-2 cursor-pointer select-none"
                  onClick={() => setRegionOpen(!regionOpen)}
                >
                  <span className={`material-symbols-outlined text-sm text-outline transition-transform duration-150 ${regionOpen ? 'rotate-45' : ''}`}>
                    chevron_right
                  </span>
                  <span className="material-symbols-outlined text-sm text-yellow-500">
                    {regionOpen ? 'folder_open' : 'folder'}
                  </span>
                  <span className="syntax-keyword text-sm">Region</span>
                </div>
                {regionOpen && (
                  <ul className="grid grid-cols-3 gap-x-4 gap-y-2 mt-2 ml-4 border-l border-outline-variant/30 pl-4 sm:grid-cols-4 lg:grid-cols-2 lg:gap-x-2">
                    {regions.map((r) => (
                      <li
                        key={r.code}
                        className="flex items-center gap-1.5 cursor-pointer group"
                        onClick={() => toggleRegion(r.code)}
                      >
                        <span className={`w-1.5 h-1.5 flex-shrink-0 transition-colors ${r.code === '' ? 'rounded-sm' : 'rounded-full'} ${selectedRegions.has(String(r.code)) ? 'bg-primary' : 'bg-outline-variant group-hover:bg-primary'}`} />
                        <span className={`text-[12px] font-body truncate transition-colors ${selectedRegions.has(String(r.code)) ? 'text-primary font-bold' : 'text-slate-500 group-hover:text-primary'}`}>
                          {r.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Theme */}
              <section>
                <div
                  className="flex items-center gap-1 mb-2 cursor-pointer select-none"
                  onClick={() => setThemeOpen(!themeOpen)}
                >
                  <span className={`material-symbols-outlined text-sm text-outline transition-transform duration-150 ${themeOpen ? 'rotate-45' : ''}`}>
                    chevron_right
                  </span>
                  <span className="material-symbols-outlined text-sm text-yellow-500">
                    {themeOpen ? 'folder_open' : 'folder'}
                  </span>
                  <span className="syntax-keyword text-sm">Theme</span>
                </div>
                {themeOpen && (
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-2 ml-4 border-l border-outline-variant/30 pl-4 sm:grid-cols-3 lg:block lg:space-y-2">
                    {DEFAULT_THEMES.map((t) => (
                      <li
                        key={t.code}
                        className="flex items-center gap-2 cursor-pointer group"
                        onClick={() => toggleTheme(t.code)}
                      >
                        <span className={`w-1.5 h-1.5 transition-colors flex-shrink-0 ${t.code === '' ? 'rounded-sm' : 'rounded-full'} ${selectedThemes.has(String(t.code)) ? 'bg-primary' : 'bg-outline-variant group-hover:bg-primary'}`} />
                        <span className={`text-[12px] font-body transition-colors ${selectedThemes.has(String(t.code)) ? 'text-primary font-bold' : 'text-slate-500 group-hover:text-primary'}`}>
                          {t.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <div className="flex flex-col gap-2 md:col-span-2 md:grid md:grid-cols-3 lg:flex lg:flex-col">
                <button
                  onClick={applyFilter}
                  className="w-full py-2.5 bg-primary text-white rounded-lg font-mono text-[11px] font-bold hover:brightness-110 transition-all shadow-md tracking-tighter"
                >
                  RUN_FILTER.SH
                </button>
                {isLoggedIn && favoriteRegions.length > 0 && (
                  <button
                    onClick={() => applyFavoriteRegions(favoriteRegions)}
                    className="w-full py-2 border border-primary/40 text-primary rounded-lg font-mono text-[11px] font-bold hover:bg-primary/10 transition-all tracking-tighter flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">star</span>
                    MY_REGIONS.SH
                  </button>
                )}
                <button
                  onClick={resetFilter}
                  className="w-full py-2 text-slate-400 rounded-lg font-mono text-[11px] hover:bg-slate-100 transition-all tracking-tighter"
                >
                  RESET_ALL.SH
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Content */}
        <div className="col-span-12 lg:col-span-9 xl:col-span-10">
          {targetWishlistFolder && (
            <section className="mb-6 bg-primary/10 border border-primary/20 rounded-xl px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold text-primary">ADD_TO_WISHLIST_FOLDER</h2>
                <p className="text-[12px] text-slate-500 mt-1">
                  하트 버튼을 누르면 <span className="font-bold text-on-surface">{targetWishlistFolder.name}</span> 폴더로 바로 추가됩니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/mypage')}
                className="w-full sm:w-auto px-4 py-2 bg-white border border-primary/20 text-primary rounded-lg text-[11px] font-bold hover:bg-primary hover:text-white transition-all"
              >
                BACK_TO_WISHLIST
              </button>
            </section>
          )}

          {/* Sort Bar */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-[11px] font-mono text-outline">
              {loading ? '// loading...' : `// ${totalCount.toLocaleString()} results`}
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-surface-container-low text-[10px] font-mono px-3 py-1.5 rounded-lg outline-none border border-outline-variant/10 cursor-pointer uppercase font-bold tracking-tighter"
            >
              <option value="default">DEFAULT_NODES</option>
              <option value="createdtime_desc">CREATED_NEWEST</option>
              <option value="createdtime_asc">CREATED_OLDEST</option>
              <option value="modifiedtime_desc">MODIFIED_NEWEST</option>
              <option value="modifiedtime_asc">MODIFIED_OLDEST</option>
            </select>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
              <p className="text-xs font-mono text-outline animate-pulse">// fetching_data...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-on-secondary-container">
              <span className="material-symbols-outlined text-5xl mb-4 opacity-30">search_off</span>
              <p className="font-body text-sm text-slate-400 font-bold">// NO_RESULTS_FOUND</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredPosts.map((post) => (
                  <article
                    key={post.contentid}
                    className="group/card bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-outline-variant/10"
                  >
                    <div 
                      className="relative h-64 overflow-hidden bg-surface-container-low cursor-pointer"
                      onDoubleClick={() => handleImageDoubleClick(post)}
                    >
                      <img
                        src={post.firstimage || FALLBACK_IMAGE}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                        onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-[18px] font-body font-bold text-on-surface mb-1 truncate tracking-tight">{post.title}</h3>
                      <div className="flex items-center gap-1 text-slate-400 text-[12px] font-body mb-4">
                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                        <span className="truncate font-bold">{post.addr1}</span>
                      </div>
                      <div className="mt-6 flex justify-between items-center">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleHeartToggle(post);
                          }}
                          className={`group/heart relative flex items-center justify-center w-10 h-10 rounded-full transition-all shadow-sm active:scale-75 select-none outline-none cursor-pointer ${
                            wishlistIds.has(String(post.contentid)) 
                              ? 'bg-red-50 text-red-500' 
                              : 'bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500'
                          }`}
                        >
                          <span className={`material-symbols-outlined text-xl select-none ${wishlistIds.has(String(post.contentid)) ? 'fill-1 text-red-500' : ''}`}>
                            favorite
                          </span>
                          {/* Classic Simple Bubbling Hearts */}
                          <span className={`material-symbols-outlined heart-bubble heart-bubble-1 text-[10px] fill-1 select-none group-hover/heart:animate-[bubble-heart_1.5s_ease-out_infinite] ${activeAnimId === post.contentid ? 'animate-[bubble-heart_1.5s_ease-out_infinite]' : ''}`}>favorite</span>
                          <span className={`material-symbols-outlined heart-bubble heart-bubble-2 text-[10px] fill-1 select-none group-hover/heart:animate-[bubble-heart_1.5s_ease-out_infinite_0.4s] ${activeAnimId === post.contentid ? 'animate-[bubble-heart_1.5s_ease-out_infinite_0.4s]' : ''}`}>favorite</span>
                        </button>
                        <Link
                          to={`/explore/${post.contentid}`}
                          state={{ firstimage: post.firstimage }}
                          className="px-5 py-2 bg-primary text-white rounded-lg text-[12px] font-body font-bold hover:brightness-110 transition-all shadow-md"
                        >
                          상세보기
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-1 font-mono">
                  <button
                    onClick={() => changePage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg text-on-secondary-container hover:bg-surface-container-high disabled:opacity-30 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>

                  {getPageNumbers()[0] > 1 && (
                    <>
                      <button onClick={() => changePage(1)} className="w-9 h-9 rounded-lg text-xs hover:bg-surface-container-high transition-colors">1</button>
                      {getPageNumbers()[0] > 2 && <span className="w-9 h-9 flex items-center justify-center text-xs text-outline">..</span>}
                    </>
                  )}

                  {getPageNumbers().map((page) => (
                    <button
                      key={page}
                      onClick={() => changePage(page)}
                      className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                        page === currentPage ? 'bg-primary text-white shadow-md scale-110' : 'text-on-secondary-container hover:bg-surface-container-high'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  {getPageNumbers().at(-1) < totalPages && (
                    <>
                      {getPageNumbers().at(-1) < totalPages - 1 && <span className="w-9 h-9 flex items-center justify-center text-xs text-outline">..</span>}
                      <button onClick={() => changePage(totalPages)} className="w-9 h-9 rounded-lg text-xs hover:bg-surface-container-high transition-colors">{totalPages}</button>
                    </>
                  )}

                  <button
                    onClick={() => changePage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg text-on-secondary-container hover:bg-surface-container-high disabled:opacity-30 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>

                  <span className="ml-4 text-[10px] text-outline">
                    {currentPage} / {totalPages} ({totalCount.toLocaleString()} 건)
                  </span>

                  <form onSubmit={handlePageInputSubmit} className="ml-4 flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={pageInput}
                      onChange={(e) => setPageInput(e.target.value)}
                      placeholder="페이지"
                      className="w-16 h-9 text-center text-xs font-mono bg-surface-container-low border border-outline-variant/30 rounded-lg focus:outline-none focus:border-primary text-on-surface"
                    />
                    <button
                      type="submit"
                      className="h-9 px-2 rounded-lg text-xs font-mono text-on-secondary-container hover:bg-surface-container-high transition-colors"
                    >
                      GO
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 위시리스트 폴더 선택 모달 */}
      <WishlistModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTravel(null);
        }}
        travelData={selectedTravel}
      />
    </div>
  );
};

export default Explore;
