import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getFestivalList } from '../api/travelApi';
import { getSubRegions } from '../api/travelInfoApi';
import useWishlistStore from '../store/useWishlistStore';
import useAuthStore from '../store/useAuthStore';
import WishlistModal from '../components/WishlistModal';
import useToast from '../hooks/useToast';
import PageHeader from '../components/PageHeader';
import { DEFAULT_REGIONS } from '../constants/regions';

const getFestivalItemsPerPage = () => {
  if (typeof window === 'undefined') return 9;
  if (window.innerWidth >= 1280) return 12;
  if (window.innerWidth >= 1024) return 9;
  if (window.innerWidth >= 640) return 10;
  return 6;
};

const Festivals = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(getFestivalItemsPerPage);

  // URL 파라미터에서 현재 상태 읽기
  const page = parseInt(searchParams.get('page')) || 1;
  const sortOrder = searchParams.get('sort') || 'default';
  const regionCode = searchParams.get('region') || '';
  const subRegionCode = searchParams.get('sigungu') || '';
  const keyword = searchParams.get('keyword')?.trim() || '';

  const { isLoggedIn } = useAuthStore();
  const { wishlistIds, toggleWishlist, initWishlist, initialized: wishlistInitialized } = useWishlistStore();
  const showToast = useToast();

  const [wishlistLoadingId, setWishlistLoadingId] = useState(null);
  const [selectedTravel, setSelectedTravel] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subRegions, setSubRegions] = useState([]);
  const [subRegionLoading, setSubRegionLoading] = useState(false);
  const [festivalError, setFestivalError] = useState('');
  const previousItemsPerPageRef = useRef(itemsPerPage);

  useEffect(() => {
    let frameId = null;

    const handleResize = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        setItemsPerPage((current) => {
          const next = getFestivalItemsPerPage();
          return current === next ? current : next;
        });
      });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const makeFestivalParams = useCallback(({
    nextPage = page,
    nextSort = sortOrder,
    nextRegion = regionCode,
    nextSubRegion = subRegionCode,
    nextKeyword = keyword,
  } = {}) => {
    const params = {
      page: String(nextPage),
      sort: nextSort,
    };
    if (nextRegion) params.region = nextRegion;
    if (nextSubRegion) params.sigungu = nextSubRegion;
    if (nextKeyword) params.keyword = nextKeyword;
    return params;
  }, [page, sortOrder, regionCode, subRegionCode, keyword]);

  useEffect(() => {
    if (!regionCode) {
      setSubRegions([]);
      setSubRegionLoading(false);
      if (subRegionCode) {
        setSearchParams(makeFestivalParams({ nextPage: 1, nextSubRegion: '' }));
      }
      return;
    }

    let ignore = false;
    const fetchSubRegionOptions = async () => {
      setSubRegionLoading(true);
      try {
        const items = await getSubRegions(regionCode);
        if (!ignore) setSubRegions(items);
      } catch (error) {
        console.error('Fetch festival sub regions failed:', error);
        if (!ignore) setSubRegions([]);
      } finally {
        if (!ignore) setSubRegionLoading(false);
      }
    };

    fetchSubRegionOptions();
    return () => {
      ignore = true;
    };
  }, [regionCode, subRegionCode, setSearchParams, makeFestivalParams]);

  useEffect(() => {
    if (!subRegionCode || subRegionLoading) return;
    if (subRegions.length > 0 && !subRegions.some((subRegion) => subRegion.code === subRegionCode)) {
      setSearchParams(makeFestivalParams({ nextPage: 1, nextSubRegion: '' }));
    }
  }, [subRegionCode, subRegions, subRegionLoading, setSearchParams, makeFestivalParams]);

  useEffect(() => {
    let cancelled = false;

    const fetchFestivals = async () => {
      const previousItemsPerPage = previousItemsPerPageRef.current;
      if (previousItemsPerPage !== itemsPerPage && totalPages > 0) {
        const estimatedTotalItems = Math.max(
          festivals.length,
          ((totalPages - 1) * previousItemsPerPage) + festivals.length,
        );
        const nextTotalPages = Math.max(1, Math.ceil(estimatedTotalItems / itemsPerPage));
        previousItemsPerPageRef.current = itemsPerPage;
        if (page > nextTotalPages) {
          setSearchParams(makeFestivalParams({ nextPage: nextTotalPages }));
          return;
        }
      } else {
        previousItemsPerPageRef.current = itemsPerPage;
      }

      setLoading(true);
      setFestivalError('');
      try {
        const data = await getFestivalList(
          page,
          itemsPerPage,
          sortOrder,
          regionCode,
          keyword,
          regionCode ? subRegionCode : '',
        );
        if (cancelled) return;
        setFestivalError('');
        setFestivals(data.items || []);
        setTotalPages(data.totalPages || 0);
        if (data.totalPages > 0 && page > data.totalPages) {
          setSearchParams(makeFestivalParams({ nextPage: data.totalPages }));
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Fetch festivals failed:', err);
        setFestivalError('축제 데이터를 불러오지 못했습니다.');
        showToast('축제 데이터를 불러오는 데 실패했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchFestivals();

    return () => {
      cancelled = true;
    };
  }, [page, itemsPerPage, totalPages, festivals.length, sortOrder, regionCode, subRegionCode, keyword, showToast, setSearchParams, makeFestivalParams]);

  useEffect(() => {
    if (isLoggedIn && !wishlistInitialized) {
      initWishlist();
    }
  }, [isLoggedIn, wishlistInitialized]);

  const handlePageChange = (newPage) => {
    setSearchParams(makeFestivalParams({ nextPage: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = (newSort) => {
    setSearchParams(makeFestivalParams({ nextPage: 1, nextSort: newSort }));
  };

  const handleRegionChange = (newRegion) => {
    setSearchParams(makeFestivalParams({ nextPage: 1, nextRegion: newRegion, nextSubRegion: '' }));
  };

  const handleSubRegionChange = (newSubRegion) => {
    setSearchParams(makeFestivalParams({ nextPage: 1, nextSubRegion: newSubRegion }));
  };

  const handleClearKeyword = () => {
    setSearchParams(makeFestivalParams({ nextPage: 1, nextKeyword: '' }));
  };

  const handleHeartToggle = async (e, post) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      showToast('로그인 후 위시리스트에 저장할 수 있습니다.');
      return;
    }

    const postId = String(post.contentid);
    if (wishlistLoadingId === postId) return;

    if (wishlistIds.has(postId)) {
      try {
        setWishlistLoadingId(postId);
        const result = await toggleWishlist(post);
        if (!result.success) {
          showToast('위시리스트에서 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.');
          return;
        }
        showToast('위시리스트에서 삭제되었습니다.', 'success');
      } catch (error) {
        console.error('Wishlist error:', error);
      } finally {
        setWishlistLoadingId(null);
      }
    } else {
      setSelectedTravel(post);
      setIsModalOpen(true);
    }
  };

  return (
    <div className="flex flex-1 flex-col space-y-8 bg-background px-4 py-8 sm:p-6 lg:p-10">
      {/* Header 섹션 */}
      <div className="border-b border-outline-variant/20 pb-6">
        <PageHeader
          label="system_events.exe"
          title="전국 축제 및 행사 정보"
          description="대한민국 곳곳에서 열리는 활기찬 축제 데이터를 탐색하세요."
          action={(
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                aria-label="지역 선택"
                value={regionCode}
                onChange={(e) => handleRegionChange(e.target.value)}
                className="bg-surface-container-low text-[10px] font-mono px-3 py-1.5 rounded-lg outline-none border border-outline-variant/10 cursor-pointer uppercase font-bold tracking-tighter"
              >
                {DEFAULT_REGIONS.map((region) => (
                  <option key={region.code || 'all'} value={region.code}>
                    {region.code ? `REGION_${region.name}` : 'REGION_ALL'}
                  </option>
                ))}
              </select>
              <select
                aria-label="시군구 선택"
                value={subRegionCode}
                onChange={(e) => handleSubRegionChange(e.target.value)}
                disabled={!regionCode || subRegionLoading || subRegions.length === 0}
                className="bg-surface-container-low text-[10px] font-mono px-3 py-1.5 rounded-lg outline-none border border-outline-variant/10 cursor-pointer uppercase font-bold tracking-tighter disabled:cursor-not-allowed disabled:opacity-40"
              >
                <option value="">
                  {regionCode ? (subRegionLoading ? 'CITY_LOADING' : 'CITY_ALL') : 'CITY_DISABLED'}
                </option>
                {subRegions.map((subRegion) => (
                  <option key={subRegion.code} value={subRegion.code}>
                    CITY_{subRegion.name}
                  </option>
                ))}
              </select>
              <select
                aria-label="정렬 기준 선택"
                value={sortOrder}
                onChange={(e) => handleSortChange(e.target.value)}
                className="bg-surface-container-low text-[10px] font-mono px-3 py-1.5 rounded-lg outline-none border border-outline-variant/10 cursor-pointer uppercase font-bold tracking-tighter"
              >
                <option value="default">DEFAULT_NODES</option>
                <option value="date_asc">DATE_ASCENDING</option>
                <option value="date_desc">DATE_DESCENDING</option>
              </select>
            </div>
          )}
        />
        {keyword && (
          <div className="mt-4 inline-flex items-center gap-3 bg-surface-container-low border border-primary/20 rounded-lg px-4 py-2 font-mono text-sm">
            <span className="text-outline">// searching_festivals:</span>
            <span className="text-primary font-bold">"{keyword}"</span>
            <button
              aria-label="검색어 삭제"
              onClick={handleClearKeyword}
              className="ml-1 text-outline hover:text-on-surface transition-colors flex items-center"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}
      </div>

      {/* 리스트 섹션 */}
      <div className="flex-1 min-h-[600px]">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-4 opacity-50">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-mono uppercase animate-pulse">loading_node_data...</p>
          </div>
        ) : festivalError ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-center">
            <span className="material-symbols-outlined text-6xl text-error">error</span>
            <p className="font-mono text-sm text-error">{festivalError}</p>
            <p className="text-xs text-outline">잠시 후 다시 시도해주세요.</p>
          </div>
        ) : festivals.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 grayscale opacity-30">
            <span className="material-symbols-outlined text-6xl">inventory_2</span>
            <p className="font-mono text-sm">// no_active_or_upcoming_festivals</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-6">
            {festivals.map((fest) => (
              <div 
                key={fest.contentid} 
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group border border-outline-variant/10 flex flex-col relative"
              >
                <button 
                  onClick={(e) => handleHeartToggle(e, fest)}
                  className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-75 ${
                    wishlistIds.has(String(fest.contentid)) 
                      ? 'bg-red-50 text-red-500' 
                      : 'bg-white/90 text-slate-400 hover:text-red-500'
                  }`}
                >
                  <span className={`material-symbols-outlined text-lg ${wishlistIds.has(String(fest.contentid)) ? 'fill-1' : ''}`}>
                    favorite
                  </span>
                </button>

                <Link to={`/explore/${fest.contentid}`} className="flex flex-col h-full">
                  <div className="aspect-[4/3] overflow-hidden relative bg-slate-100">
                    <img 
                      src={fest.firstimage || 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=2070'} 
                      alt={fest.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=2070'; }}
                    />
                    <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-lg border border-slate-200/50 bg-white/90 px-2 py-1 text-[9px] font-bold uppercase tracking-tight text-slate-900 shadow-lg backdrop-blur-md sm:left-3 sm:top-3 sm:gap-1.5 sm:px-2.5 sm:py-1.5 sm:text-[10px]">
                      <span className="material-symbols-outlined text-[12px] text-primary">calendar_today</span>
                      <span>
                        {fest.eventstartdate && String(fest.eventstartdate).length >= 8 ? (
                          `${String(fest.eventstartdate).slice(4, 6)}.${String(fest.eventstartdate).slice(6, 8)} - ${
                            fest.eventenddate && String(fest.eventenddate).length >= 8
                              ? `${String(fest.eventenddate).slice(4, 6)}.${String(fest.eventenddate).slice(6, 8)}`
                              : '진행중'
                          }`
                        ) : '날짜정보없음'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col justify-between space-y-3 p-4 sm:p-5">
                    <div className="space-y-1">
                      <h3 className="line-clamp-2 min-h-[2.5rem] font-headline text-sm font-bold leading-5 text-slate-900 transition-colors group-hover:text-primary sm:text-base">{fest.title}</h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 sm:text-xs">
                        <span className="material-symbols-outlined text-[13px] sm:text-sm">location_on</span>
                        <p className="truncate font-body">{fest.addr1 || '전국 각지'}</p>
                      </div>
                    </div>
                    <div className="pt-2 flex items-center justify-between border-t border-slate-50">
                      <span className="hidden text-[10px] text-slate-300 font-mono uppercase tracking-tighter sm:inline">type: 15_fest</span>
                      <div className="flex items-center gap-1 text-primary group-hover:gap-2 transition-all">
                        <span className="text-[10px] font-bold tracking-widest font-label uppercase">Explore</span>
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 페이지네이션 UI */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-10 pb-6">
          <button
            onClick={() => handlePageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-outline-variant/20 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </button>
          
          <div className="flex items-center gap-1">
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              let pageNum = page <= 3 ? i + 1 : (page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i);
              if (pageNum > totalPages) pageNum = totalPages;
              if (pageNum <= 0) return null;

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-10 h-10 rounded-lg font-mono text-sm transition-all ${
                    page === pageNum 
                      ? 'bg-primary text-white font-bold shadow-lg shadow-primary/20' 
                      : 'hover:bg-slate-50 text-slate-500'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-outline-variant/20 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </div>
      )}

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

export default Festivals;
