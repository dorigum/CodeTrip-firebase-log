import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTravelList } from '../api/travelInfoApi';
import useBoardWriteStore from '../store/useBoardWriteStore';
import useRegionStore from '../store/useRegionStore';
import { DEFAULT_THEMES } from '../constants/themes';
import PageHeader from '../components/PageHeader';

const NUM_OF_ROWS = 12;

const TravelTagSearch = () => {
  const navigate = useNavigate();
  const { tags, setTags } = useBoardWriteStore();
  const { regions } = useRegionStore();

  // 기존 태그를 초기 선택 상태로
  const [selectedMap, setSelectedMap] = useState(() => {
    const map = new Map();
    tags.forEach((t) => map.set(t.content_id, t));
    return map;
  });

  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('');

  const fetchItems = useCallback(async (page, kw, region, theme) => {
    setLoading(true);
    try {
      const data = await getTravelList({
        regions: [region],
        themes: theme ? [theme] : [''],
        pageNo: page,
        numOfRows: NUM_OF_ROWS,
        keyword: kw,
      });
      setItems(data.items || []);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems(currentPage, keyword, selectedRegion, selectedTheme);
  }, [currentPage, keyword, selectedRegion, selectedTheme, fetchItems]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setKeyword(searchInput);
  };

  const toggleItem = (item) => {
    setSelectedMap((prev) => {
      const next = new Map(prev);
      if (next.has(item.contentid)) {
        next.delete(item.contentid);
      } else {
        next.set(item.contentid, {
          content_id: item.contentid,
          title: item.title,
          firstimage: item.firstimage || '',
        });
      }
      return next;
    });
  };

  const handleConfirm = () => {
    setTags(Array.from(selectedMap.values()));
    navigate('/board/write', { state: { fromTagSearch: true } });
  };

  const handleCancel = () => {
    navigate('/board/write', { state: { fromTagSearch: true } });
  };

  const totalPages = Math.ceil(totalCount / NUM_OF_ROWS);
  const selectedCount = selectedMap.size;

  return (
    <div className="bg-background text-on-surface font-body min-h-screen pb-20">
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Header */}
        <PageHeader
          className="mb-6"
          label="tag_destination_search.exe"
          title="여행지 태그"
          description="여러 여행지를 선택한 후 확인 버튼을 눌러주세요."
          action={(
            <div className="flex items-center gap-3">
              {selectedCount > 0 && (
                <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-mono font-bold border border-primary/20">
                  {selectedCount} selected
                </span>
              )}
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-xs font-bold font-label border border-outline-variant/30 rounded-xl text-on-secondary-container hover:bg-slate-50 transition-all"
              >
                CANCEL
              </button>
              <button
                onClick={handleConfirm}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold font-label hover:brightness-110 transition-all"
              >
                <span className="material-symbols-outlined text-sm">check</span>
                CONFIRM_SELECTION.SH
              </button>
            </div>
          )}
        />

        {/* Selected Preview Strip */}
        {selectedCount > 0 && (
          <div className="mb-5 p-3 bg-primary/5 border border-primary/10 rounded-xl">
            <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-2">selected_tags</p>
            <div className="flex flex-wrap gap-2">
              {Array.from(selectedMap.values()).map((t) => (
                <span
                  key={t.content_id}
                  onClick={() => setSelectedMap((prev) => { const n = new Map(prev); n.delete(t.content_id); return n; })}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs font-mono font-bold border border-primary/20 cursor-pointer hover:bg-error/10 hover:text-error hover:border-error/20 transition-all"
                >
                  <span className="material-symbols-outlined text-xs">location_on</span>
                  {t.title}
                  <span className="material-symbols-outlined text-xs">close</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Search & Filter */}
        <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-5 mb-6">
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <div className="flex-1 flex items-center gap-3 border border-outline-variant/20 rounded-xl px-4 py-2.5 focus-within:border-primary transition-colors">
              <span className="material-symbols-outlined text-outline text-lg">search</span>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="// 여행지 검색..."
                className="flex-1 bg-transparent font-mono text-sm text-on-surface placeholder:text-outline outline-none"
              />
              {searchInput && (
                <button type="button" onClick={() => { setSearchInput(''); setKeyword(''); setCurrentPage(1); }}>
                  <span className="material-symbols-outlined text-outline hover:text-on-surface text-lg transition-colors">close</span>
                </button>
              )}
            </div>
            <button type="submit" className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold font-label hover:brightness-110 transition-all">
              SEARCH
            </button>
          </form>

          {/* Region Filter */}
          <div className="mb-3">
            <p className="text-[10px] font-mono text-outline uppercase tracking-widest mb-2">region</p>
            <div className="flex flex-wrap gap-1.5">
              {regions.map((r) => (
                <button
                  key={r.code}
                  onClick={() => { setSelectedRegion(r.code); setCurrentPage(1); }}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-all border ${
                    selectedRegion === r.code
                      ? 'bg-primary text-white border-primary font-bold'
                      : 'text-outline border-outline-variant/20 hover:border-primary hover:text-primary'
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Filter */}
          <div>
            <p className="text-[10px] font-mono text-outline uppercase tracking-widest mb-2">theme</p>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_THEMES.map((t) => (
                <button
                  key={t.code}
                  onClick={() => { setSelectedTheme(t.code); setCurrentPage(1); }}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-all border ${
                    selectedTheme === t.code
                      ? 'bg-primary text-white border-primary font-bold'
                      : 'text-outline border-outline-variant/20 hover:border-primary hover:text-primary'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Result Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-mono text-outline">
            <span className="text-primary">{totalCount}</span> destinations_found
          </p>
          <p className="text-xs font-mono text-outline">
            page {currentPage} / {totalPages || 1}
          </p>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            <p className="text-xs font-mono text-outline animate-pulse">// searching_destinations...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="material-symbols-outlined text-5xl text-outline/30">search_off</span>
            <p className="text-sm font-mono text-outline">// no_destinations_found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {items.map((item) => {
              const isSelected = selectedMap.has(item.contentid);
              return (
                <button
                  key={item.contentid}
                  onClick={() => toggleItem(item)}
                  className={`relative flex flex-col overflow-hidden rounded-xl border-2 transition-all text-left group ${
                    isSelected
                      ? 'border-primary shadow-lg shadow-primary/20'
                      : 'border-outline-variant/10 hover:border-primary/40 hover:shadow-md'
                  }`}
                >
                  {/* Image */}
                  <div className="h-32 bg-slate-100 overflow-hidden relative">
                    {item.firstimage ? (
                      <img
                        src={item.firstimage}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-slate-300 text-3xl">image</span>
                      </div>
                    )}
                    {/* Selected Overlay */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                          <span className="material-symbols-outlined text-white text-lg">check</span>
                        </div>
                      </div>
                    )}
                    {/* Hover Overlay */}
                    {!isSelected && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <div className="w-8 h-8 bg-white/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
                          <span className="material-symbols-outlined text-primary text-lg">add</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className={`px-3 py-2.5 transition-colors ${isSelected ? 'bg-primary/5' : 'bg-white'}`}>
                    <p className={`text-xs font-mono font-bold truncate transition-colors ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                      <span className={`mr-0.5 ${isSelected ? 'text-primary' : 'text-outline/60'}`}>#</span>
                      {item.title}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-1 mt-8">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded-lg text-xs font-mono text-outline border border-outline-variant/20 hover:border-primary hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let page;
              if (totalPages <= 7) page = i + 1;
              else if (currentPage <= 4) page = i + 1;
              else if (currentPage >= totalPages - 3) page = totalPages - 6 + i;
              else page = currentPage - 3 + i;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg text-xs font-mono transition-all border ${
                    currentPage === page
                      ? 'bg-primary text-white border-primary font-bold'
                      : 'text-outline border-outline-variant/20 hover:border-primary hover:text-primary'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 rounded-lg text-xs font-mono text-outline border border-outline-variant/20 hover:border-primary hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        )}

        {/* Floating Confirm Bar (mobile) */}
        {selectedCount > 0 && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 md:hidden z-40">
            <button
              onClick={handleConfirm}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full text-sm font-bold font-label shadow-xl hover:brightness-110 transition-all"
            >
              <span className="material-symbols-outlined text-base">check</span>
              {selectedCount}개 선택 완료
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TravelTagSearch;
