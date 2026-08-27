import { create } from 'zustand';
import { getTravelList } from '../api/travelInfoApi';
import { DEFAULT_REGIONS } from '../constants/regions';

const DESKTOP_NUM_OF_ROWS = 10;
const MOBILE_NUM_OF_ROWS = 6;

const getExploreItemsPerPage = () => {
  if (typeof window === 'undefined') return DESKTOP_NUM_OF_ROWS;
  return window.innerWidth < 768 ? MOBILE_NUM_OF_ROWS : DESKTOP_NUM_OF_ROWS;
};

let exploreScrollY = 0;
let exploreFetchRequestId = 0;
export const getExploreScrollY = () => exploreScrollY;
export const setExploreScrollY = (y) => { exploreScrollY = y; };

const resetMainScroll = () => {
  if (typeof document === 'undefined') return;
  const mainScroll = document.getElementById('main-scroll');
  if (mainScroll) mainScroll.scrollTop = 0;
};

const useExploreStore = create((set, get) => ({
  regions: DEFAULT_REGIONS,

  selectedRegions: new Set(['']),
  selectedThemes: new Set(['']),

  appliedRegions: [''],
  appliedThemes: [''],

  keyword: '',
  sort: 'default',
  currentPage: 1,
  itemsPerPage: getExploreItemsPerPage(),
  posts: [],
  totalCount: 0,
  loading: false,
  initialized: false,
  fetchError: null,

  toggleRegion: (code) => {
    const s = String(code);
    set((state) => {
      if (s === '') return { selectedRegions: new Set(['']) };
      const next = new Set(state.selectedRegions);
      next.delete('');
      if (next.has(s)) { next.delete(s); if (next.size === 0) next.add(''); }
      else { next.add(s); }
      return { selectedRegions: next };
    });
  },

  toggleTheme: (code) => {
    const s = String(code);
    set((state) => {
      if (s === '') return { selectedThemes: new Set(['']) };
      const next = new Set(state.selectedThemes);
      next.delete('');
      if (next.has(s)) { next.delete(s); if (next.size === 0) next.add(''); }
      else { next.add(s); }
      return { selectedThemes: next };
    });
  },

  setKeyword: (keyword) => {
    const { selectedRegions, selectedThemes } = get();
    set({
      keyword,
      currentPage: 1,
      appliedRegions: Array.from(selectedRegions),
      appliedThemes: Array.from(selectedThemes),
    });
    get().fetchPosts();
  },

  clearKeyword: () => {
    set({ keyword: '' });
    get().fetchPosts();
  },

  applyFilter: () => {
    const { selectedRegions, selectedThemes } = get();
    set({
      appliedRegions: Array.from(selectedRegions),
      appliedThemes: Array.from(selectedThemes),
      currentPage: 1,
    });
    get().fetchPosts();
  },

  applyFavoriteRegions: (codes) => {
    if (!codes || codes.length === 0) {
      get().fetchPosts();
      return;
    }
    const regionSet = new Set(codes.map(String));
    set({ selectedRegions: regionSet, appliedRegions: Array.from(regionSet), currentPage: 1 });
    get().fetchPosts();
  },

  resetFilter: () => {
    set({
      selectedRegions: new Set(['']),
      selectedThemes: new Set(['']),
      appliedRegions: [''],
      appliedThemes: [''],
      currentPage: 1,
    });
    get().fetchPosts();
  },

  resetPage: () => {
    set({ currentPage: 1 });
    setExploreScrollY(0);
    get().fetchPosts();
  },

  resetPageAndClearKeyword: () => {
    set({ keyword: '', currentPage: 1 });
    setExploreScrollY(0);
    get().fetchPosts();
  },

  setSort: (sort) => {
    set({ sort, currentPage: 1 });
    get().fetchPosts();
  },

  changePage: (page) => {
    const { currentPage, totalCount, itemsPerPage } = get();
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    if (page < 1 || page > totalPages || page === currentPage) return;
    set({ currentPage: page });
    get().fetchPosts();
  },

  setItemsPerPage: (itemsPerPage) => {
    const current = get().itemsPerPage;
    if (!itemsPerPage || itemsPerPage === current) return;
    set({ itemsPerPage, currentPage: 1 });
    setExploreScrollY(0);
    resetMainScroll();
    get().fetchPosts();
  },

  fetchPosts: async () => {
    const requestId = ++exploreFetchRequestId;
    const { appliedRegions, appliedThemes, currentPage, keyword, sort, itemsPerPage } = get();
    set({ loading: true, fetchError: null });
    try {
      const { items, totalCount } = await getTravelList({
        regions: appliedRegions,
        themes: appliedThemes,
        pageNo: currentPage,
        numOfRows: itemsPerPage,
        keyword,
        sort,
      });
      if (requestId !== exploreFetchRequestId) return;
      set({ posts: items, totalCount, initialized: true });
    } catch (error) {
      if (requestId !== exploreFetchRequestId) return;
      console.error('Failed to fetch posts:', error);
      set({ fetchError: '여행지 데이터를 불러오는 데 실패했습니다.', initialized: true });
    } finally {
      if (requestId === exploreFetchRequestId) {
        set({ loading: false });
      }
    }
  },

}));

export { DESKTOP_NUM_OF_ROWS as NUM_OF_ROWS, getExploreItemsPerPage };
export default useExploreStore;
