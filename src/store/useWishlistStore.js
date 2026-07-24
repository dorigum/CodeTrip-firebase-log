import { create } from 'zustand';
import * as wishlistApi from '../api/wishlistApi';

const normalizeWishlistItem = (itemData = {}) => {
  const contentid = itemData.contentid ?? itemData.contentId ?? itemData.content_id;
  const title = itemData.title ?? itemData.facltNm ?? '여행지';
  const firstimage = itemData.firstimage ?? itemData.imageUrl ?? itemData.image_url ?? itemData.firstImage ?? '';
  const addr1 = itemData.addr1 ?? itemData.address ?? itemData.addr ?? '';

  return {
    ...itemData,
    contentid: contentid != null ? String(contentid) : '',
    title,
    firstimage,
    addr1,
    folder_id: itemData.folder_id ?? null,
  };
};

const useWishlistStore = create((set, get) => ({
  wishlistItems: [],
  folders: [],
  wishlistIds: new Set(),
  loading: false,
  initialized: false,
  syncError: null,

  // 노드는 별도 로컬 상태로 관리 (MyPage에서 fetch)
  // 하지만 공통 액션은 여기에 정의할 수 있음

  initWishlist: async () => {
    if (get().initialized) return;
    await get().syncWithServer();
    set({ initialized: true });
  },

  syncWithServer: async () => {
    set({ loading: true, syncError: null });
    try {
      const [items, folders] = await Promise.all([
        wishlistApi.getWishlistDetails(),
        wishlistApi.getFolders()
      ]);
      const ids = new Set(items.map(item => String(item.contentid || item.content_id)));
      set({ wishlistItems: items, folders, wishlistIds: ids });
    } catch (err) {
      console.error('Wishlist sync failed:', err);
      set({ syncError: '위시리스트를 불러오는 데 실패했습니다.' });
    } finally {
      set({ loading: false });
    }
  },

  clearWishlist: () => {
    set({ wishlistItems: [], folders: [], wishlistIds: new Set(), initialized: false });
  },

  toggleWishlist: async (itemData) => {
    const { contentid, title, firstimage, addr1, folder_id } = normalizeWishlistItem(itemData);
    if (!contentid) return false;

    try {
      const result = await wishlistApi.toggleWishlist(contentid, title, firstimage, folder_id, addr1);
      await get().syncWithServer();
      return result.wishlisted;
    } catch (err) {
      console.error('Toggle wishlist failed:', err);
      return false;
    }
  },

  createFolder: async (name, startDate, endDate) => {
    try {
      const folder = await wishlistApi.createFolder(name, startDate, endDate);
      await get().syncWithServer();
      return folder;
    } catch (err) {
      console.error('Create folder failed:', err);
      return null;
    }
  },

  updateFolder: async (folderId, name, startDate, endDate) => {
    try {
      await wishlistApi.updateFolder(folderId, name, startDate, endDate);
      await get().syncWithServer();
    } catch (err) {
      console.error('Update folder failed:', err);
    }
  },

  deleteFolder: async (folderId) => {
    if (!window.confirm('폴더를 삭제하시겠습니까? (안의 여행지들은 미분류로 이동됩니다)')) return;
    try {
      await wishlistApi.deleteFolder(folderId);
      await get().syncWithServer();
    } catch (err) {
      console.error('Delete folder failed:', err);
    }
  },

  moveItem: async (contentId, folderId) => {
    try {
      await wishlistApi.moveItem(contentId, folderId);
      await get().syncWithServer();
    } catch (err) {
      console.error('Move item failed:', err);
    }
  },

  // --- Note Actions (State는 MyPage에서 관리하거나 필요시 스토어 확장) ---
  fetchNotes: async (folderId) => {
    try {
      return await wishlistApi.getFolderNotes(folderId);
    } catch (err) {
      console.error('Fetch notes failed:', err);
      return [];
    }
  },

  fetchAiTripPlans: async (folderId) => {
    try {
      return await wishlistApi.getAiTripPlans(folderId);
    } catch (err) {
      console.error('Fetch AI trip plans failed:', err);
      return [];
    }
  },

  migrateLegacyAiCourseNotes: async (folderId, noteIds) => {
    try {
      return await wishlistApi.migrateLegacyAiCourseNotes(folderId, noteIds);
    } catch (err) {
      console.error('Migrate legacy AI course notes failed:', err);
      return null;
    }
  },

  addNote: async (folderId, content, type) => {
    try {
      return await wishlistApi.createNote(folderId, content, type);
    } catch (err) {
      console.error('Add note failed:', err);
      return null;
    }
  },

  toggleNote: async (noteId) => {
    try {
      await wishlistApi.toggleNote(noteId);
    } catch (err) {
      console.error('Toggle note failed:', err);
    }
  },

  deleteNote: async (noteId) => {
    try {
      await wishlistApi.deleteNote(noteId);
    } catch (err) {
      console.error('Delete note failed:', err);
    }
  }
}));

export default useWishlistStore;
