import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getFestivalList } from '../api/travelApi';
import useWishlistStore from '../store/useWishlistStore';
import useAuthStore from '../store/useAuthStore';
import WishlistModal from '../components/WishlistModal';
import useToast from '../hooks/useToast';
import PageHeader from '../components/PageHeader';

const Festivals = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const ITEMS_PER_PAGE = 8;

  // URL 파라미터에서 현재 상태 읽기
  const page = parseInt(searchParams.get('page')) || 1;
  const sortOrder = searchParams.get('sort') || 'default';

  const { isLoggedIn } = useAuthStore();
  const { wishlistIds, toggleWishlist, initWishlist, initialized: wishlistInitialized } = useWishlistStore();
  const showToast = useToast();

  const [wishlistLoadingId, setWishlistLoadingId] = useState(null);
  const [selectedTravel, setSelectedTravel] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchFestivals = async () => {
      setLoading(true);
      try {
        const data = await getFestivalList(page, ITEMS_PER_PAGE, sortOrder);
        setFestivals(data.items || []);
        setTotalPages(data.totalPages || 0);
      } catch (err) {
        console.error('Fetch festivals failed:', err);
        showToast('축제 데이터를 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchFestivals();
  }, [page, sortOrder, showToast]);

  useEffect(() => {
    if (isLoggedIn && !wishlistInitialized) {
      initWishlist();
    }
  }, [isLoggedIn, wishlistInitialized]);

  const handlePageChange = (newPage) => {
    setSearchParams({ page: newPage, sort: sortOrder });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = (newSort) => {
    setSearchParams({ page: 1, sort: newSort }); // 정렬 변경 시 1페이지로
  };

  const handleHeartToggle = async (e, post) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      alert('로그인이 필요한 서비스입니다.');
      return;
    }

    const postId = String(post.contentid);
    if (wishlistLoadingId === postId) return;

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
      setSelectedTravel(post);
      setIsModalOpen(true);
    }
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 flex-1 flex flex-col bg-background">
      {/* Header 섹션 */}
      <div className="border-b border-outline-variant/20 pb-6">
        <PageHeader
          label="system_events.exe"
          title="전국 축제 및 행사 정보"
          description="대한민국 곳곳에서 열리는 활기찬 축제 데이터를 탐색하세요."
          action={(
          <select 
            value={sortOrder}
            onChange={(e) => handleSortChange(e.target.value)}
            className="bg-surface-container-low text-[10px] font-mono px-3 py-1.5 rounded-lg outline-none border border-outline-variant/10 cursor-pointer uppercase font-bold tracking-tighter"
          >
            <option value="default">DEFAULT_NODES</option>
            <option value="date_asc">DATE_ASCENDING</option>
            <option value="date_desc">DATE_DESCENDING</option>
          </select>
          )}
        />
      </div>

      {/* 리스트 섹션 */}
      <div className="flex-1 min-h-[600px]">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-4 opacity-50">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-mono uppercase animate-pulse">loading_node_data...</p>
          </div>
        ) : festivals.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 grayscale opacity-30">
            <span className="material-symbols-outlined text-6xl">inventory_2</span>
            <p className="font-mono text-sm">// no_festivals_found_in_cache</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-slate-200/50 uppercase font-mono tracking-tight flex items-center gap-1.5 shadow-lg z-10">
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
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <h3 className="font-headline font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-1">{fest.title}</h3>
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                        <span className="material-symbols-outlined text-sm">location_on</span>
                        <p className="truncate font-body">{fest.addr1 || '전국 각지'}</p>
                      </div>
                    </div>
                    <div className="pt-2 flex items-center justify-between border-t border-slate-50">
                      <span className="text-[10px] text-slate-300 font-mono uppercase tracking-tighter">type: 15_fest</span>
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
