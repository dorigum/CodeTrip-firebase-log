import React, { useState, useEffect } from 'react';
import useWishlistStore from '../store/useWishlistStore';
import useToast from '../hooks/useToast';

const WishlistModal = ({ isOpen, onClose, travelData }) => {
  const { folders, syncWithServer, createFolder, toggleWishlist } = useWishlistStore();
  const showToast = useToast();
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      syncWithServer(); // fetchFolders 대신 syncWithServer 사용
    }
  }, [isOpen, syncWithServer]);

  if (!isOpen) return null;

  const handleSelectFolder = async (folderId) => {
    // travelData의 다양한 필드명을 contentid, title, firstimage 형식으로 통일
    const travelInfo = {
      contentid: travelData.contentid || travelData.content_id || travelData.contentId,
      title: travelData.title || travelData.facltNm,
      firstimage: travelData.firstimage || travelData.image_url || travelData.firstImage,
      addr1: travelData.addr1 || travelData.address || travelData.addr,
      folder_id: folderId
    };
    const wishlisted = await toggleWishlist(travelInfo);
    if (!wishlisted) {
      showToast('위시리스트에 저장하지 못했습니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    showToast('위시리스트에 추가되었습니다.', 'success');
    onClose();
  };

  const handleCreateAndSave = async () => {
    if (!newFolderName.trim()) return;
    const newFolder = await createFolder(newFolderName);
    if (newFolder) {
      await handleSelectFolder(newFolder.id);
    }
    setNewFolderName('');
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-outline-variant/20 animate-in fade-in zoom-in duration-200">
        {/* Terminal Style Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ba1a1a' }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#5a5f65' }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#00b8d4' }} />
          </div>
          <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest">save_to_folder.sh</span>
          <button onClick={onClose} className="material-symbols-outlined text-slate-400 hover:text-on-surface transition-colors text-lg">close</button>
        </div>

        <div className="p-6 max-h-[350px] overflow-y-auto custom-scrollbar space-y-2">
          {/* 기본 미분류 폴더 */}
          <button
            onClick={() => handleSelectFolder(null)}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-primary/30 hover:bg-white hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">inventory_2</span>
              <span className="font-mono text-xs font-bold text-slate-600 uppercase tracking-tight group-hover:text-on-surface">UNCATEGORIZED</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">SELECT_NODE</span>
          </button>

          {/* 사용자 정의 폴더 목록 */}
          {folders.map(folder => (
            <button
              key={folder.id}
              onClick={() => handleSelectFolder(folder.id)}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-primary/30 hover:bg-white hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">folder</span>
                <span className="font-mono text-xs font-bold text-slate-600 uppercase tracking-tight group-hover:text-on-surface truncate max-w-[150px]">{folder.name}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">SELECT_NODE</span>
            </button>
          ))}
        </div>

        <div className="p-6 bg-slate-50/50 border-t border-slate-100">
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-3 flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 text-slate-400 hover:text-primary hover:border-primary/30 hover:bg-white transition-all font-mono text-[11px] font-bold uppercase tracking-widest"
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              create_new_folder
            </button>
          ) : (
            <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-200">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="새 폴더 이름 입력..."
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-body focus:outline-none focus:border-primary transition-all shadow-inner"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-500 rounded-lg font-body text-[11px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  취소
                </button>
                <button
                  onClick={handleCreateAndSave}
                  className="flex-1 py-2.5 bg-primary text-white rounded-lg font-body text-[11px] font-bold uppercase tracking-widest hover:brightness-110 shadow-md transition-all"
                >
                  확인
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WishlistModal;
