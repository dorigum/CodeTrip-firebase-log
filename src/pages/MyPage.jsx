import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import useWishlistStore from '../store/useWishlistStore';
import useToast from '../hooks/useToast';
import PageHeader from '../components/PageHeader';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000&auto=format&fit=crop';

const MyPage = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuthStore();
  
  const {
    wishlistItems, folders, loading, syncError,
    initWishlist, toggleWishlist, createFolder, updateFolder, deleteFolder, moveItem,
    fetchNotes, addNote, toggleNote: toggleNoteAction, deleteNote: deleteNoteAction
  } = useWishlistStore();

  const showToast = useToast();
  useEffect(() => {
    if (syncError) showToast(syncError);
  }, [syncError, showToast]);

  const [sortBy, setSortBy] = useState('CREATED');
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderStart, setNewFolderStart] = useState('');
  const [newFolderEnd, setNewFolderEnd] = useState('');
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [editFolderStart, setEditFolderStart] = useState('');
  const [editFolderEnd, setEditFolderEnd] = useState('');
  const [movingItemId, setMovingItemId] = useState(null);

  // --- Note(Memo/Checklist) States ---
  const [notes, setNotes] = useState([]);
  const [noteInput, setNoteInput] = useState('');
  const [noteType, setNoteType] = useState('CHECKLIST'); // 'CHECKLIST' or 'MEMO'
  const visibleNotes = useMemo(
    () => notes.filter((note) => (note.type || 'CHECKLIST') === noteType),
    [notes, noteType]
  );

  // Authentication & Initial Data Load
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    } else {
      initWishlist();
    }
  }, [isLoggedIn, navigate, initWishlist]);

  // 폴더 변경 시 노트 로드
  useEffect(() => {
    if (selectedFolderId && selectedFolderId !== 'UNCATEGORIZED') {
      const loadNotes = async () => {
        const data = await fetchNotes(selectedFolderId);
        setNotes(data);
      };
      loadNotes();
    } else {
      setNotes([]);
    }
  }, [selectedFolderId, fetchNotes]);

  const handleRemoveWish = async (e, contentId) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('위시리스트에서 삭제하시겠습니까?')) {
      await toggleWishlist({ contentid: contentId });
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteInput.trim() || !selectedFolderId || selectedFolderId === 'UNCATEGORIZED') return;
    const newNote = await addNote(selectedFolderId, noteInput.trim(), noteType);
    if (newNote) {
      setNotes(prev => [...prev, newNote]);
      setNoteInput('');
    }
  };

  const handleToggleNote = async (noteId) => {
    await toggleNoteAction(noteId);
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, is_completed: !n.is_completed } : n));
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    await deleteNoteAction(noteId);
    setNotes(prev => prev.filter(n => n.id !== noteId));
  };

  const openEditModal = (folder) => {
    setEditingFolder(folder);
    setEditFolderName(folder.name);
    // 서버에서 이미 YYYY-MM-DD 형식의 문자열로 오므로 그대로 사용
    setEditFolderStart(folder.start_date ? String(folder.start_date).slice(0, 10) : '');
    setEditFolderEnd(folder.end_date ? String(folder.end_date).slice(0, 10) : '');
  };

  const closeEditModal = () => {
    setEditingFolder(null);
    setEditFolderName('');
    setEditFolderStart('');
    setEditFolderEnd('');
  };

  const handleUpdateFolder = async (e) => {
    e.preventDefault();
    if (!editFolderName.trim()) return;
    // 날짜 문자열을 그대로 서버에 전송 (타임존 변환 방지)
    await updateFolder(editingFolder.id, editFolderName.trim(), editFolderStart || null, editFolderEnd || null);
    closeEditModal();
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    // 날짜 문자열을 그대로 서버에 전송 (타임존 변환 방지)
    await createFolder(newFolderName.trim(), newFolderStart || null, newFolderEnd || null);
    setNewFolderName('');
    setNewFolderStart('');
    setNewFolderEnd('');
    setShowFolderModal(false);
  };

  const filteredItems = useMemo(() => {
    let items = wishlistItems || [];
    if (selectedFolderId === 'UNCATEGORIZED') {
      items = items.filter(item => !item.folder_id);
    } else if (selectedFolderId) {
      items = items.filter(item => String(item.folder_id) === String(selectedFolderId));
    }
    return items;
  }, [wishlistItems, selectedFolderId]);

  const sortedWishList = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const titleA = a.title || '';
      const titleB = b.title || '';
      if (sortBy === 'TITLE') return titleA.localeCompare(titleB);
      if (sortBy === 'TITLE_DESC') return titleB.localeCompare(titleA);
      return String(b.contentid || b.content_id).localeCompare(String(a.contentid || a.content_id));
    });
  }, [filteredItems, sortBy]);

  const stats = useMemo(() => {
    const total = wishlistItems.length;
    const folderCount = folders.length;
    const uncategorized = wishlistItems.filter(i => !i.folder_id).length;
    const topFolder = folders.reduce((acc, f) => {
      const count = wishlistItems.filter(i => String(i.folder_id) === String(f.id)).length;
      return count > (acc?.count ?? 0) ? { name: f.name, count } : acc;
    }, null);
    return { total, folderCount, uncategorized, topFolder };
  }, [wishlistItems, folders]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    // 날짜 형식이 YYYY-MM-DD 형식이면 parseLocalDate 사용, 아니면 일반 Date 사용 (생성일 등)
    if (String(dateStr).includes('-') && String(dateStr).length <= 10) {
      const d = parseLocalDate(dateStr);
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    }
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  const DAYS_KO = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const parseLocalDate = (str) => {
    if (!str) return new Date();
    // YYYY-MM-DD 문자열을 타임존 영향 없이 로컬 Date 객체로 변환
    const dateOnly = String(str).slice(0, 10);
    const [y, m, d] = dateOnly.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const formatScheduleShort = (startStr, endStr) => {
    if (!startStr) return null;
    const s = parseLocalDate(startStr);
    const startLabel = `${String(s.getMonth() + 1).padStart(2, '0')}.${String(s.getDate()).padStart(2, '0')}(${DAYS_KO[s.getDay()]})`;
    if (!endStr) return startLabel;
    const e = parseLocalDate(endStr);
    const endLabel = `${String(e.getMonth() + 1).padStart(2, '0')}.${String(e.getDate()).padStart(2, '0')}(${DAYS_KO[e.getDay()]})`;
    const nights = Math.round((e - s) / 86400000);
    return `${startLabel} ~ ${endLabel} : ${nights === 0 ? '당일치기' : `${nights}박 ${nights + 1}일`}`;
  };

  const formatScheduleFull = (startStr, endStr) => {
    if (!startStr) return null;
    const s = parseLocalDate(startStr);
    const startLabel = `${s.getFullYear()}.${String(s.getMonth() + 1).padStart(2, '0')}.${String(s.getDate()).padStart(2, '0')}(${DAYS_KO[s.getDay()]})`;
    if (!endStr) return startLabel;
    const e = parseLocalDate(endStr);
    const endLabel = `${e.getFullYear()}.${String(e.getMonth() + 1).padStart(2, '0')}.${String(e.getDate()).padStart(2, '0')}(${DAYS_KO[e.getDay()]})`;
    const nights = Math.round((e - s) / 86400000);
    return `${startLabel}\n~ ${endLabel}\n: ${nights === 0 ? '당일치기' : `${nights}박 ${nights + 1}일`}`;
  };

  const selectedFolder = selectedFolderId ? folders.find(f => String(f.id) === String(selectedFolderId)) : null;
  const currentFolderName = selectedFolderId === 'UNCATEGORIZED' ? 'UNCATEGORIZED' : (selectedFolder?.name || 'UNKNOWN');
  const openExploreForCurrentFolder = () => {
    navigate('/explore', {
      state: {
        targetWishlistFolder: {
          id: selectedFolderId === 'UNCATEGORIZED' ? null : selectedFolderId,
          name: currentFolderName,
        },
      },
    });
  };

  if (!isLoggedIn) return null;

  return (
    <div className="flex-1 bg-background overflow-y-auto custom-scrollbar">
      {/* Folder Modals (Creation & Edit) ... 생략 가능하지만 전체 코드를 쓰기로 함 */}
      {showFolderModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-outline-variant/20 animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest">mkdir_new_folder.sh</span>
              <button onClick={() => setShowFolderModal(false)} className="material-symbols-outlined text-slate-400 hover:text-on-surface transition-colors">close</button>
            </div>
            <form onSubmit={handleCreateFolder} className="p-6 flex flex-col gap-5">
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1.5">folder_name</label>
                <input autoFocus type="text" placeholder="예: 부산 1박 2일 맛집투어" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm outline-none focus:border-primary transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1.5">travel_schedule</label>
                <div className="flex items-center gap-2">
                  <input type="date" value={newFolderStart} onChange={(e) => { setNewFolderStart(e.target.value); if (newFolderEnd && e.target.value > newFolderEnd) setNewFolderEnd(''); }} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-mono outline-none focus:border-primary transition-all" />
                  <span className="text-slate-400 font-mono text-xs shrink-0">~</span>
                  <input type="date" value={newFolderEnd} min={newFolderStart || undefined} onChange={(e) => setNewFolderEnd(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-mono outline-none focus:border-primary transition-all" />
                </div>
                {newFolderStart && <p className="text-[10px] font-mono text-primary mt-2">{formatScheduleShort(newFolderStart, newFolderEnd)}</p>}
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowFolderModal(false)} className="flex-1 py-3 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl">CANCEL</button>
                <button type="submit" className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-bold">CREATE_FOLDER</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingFolder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-outline-variant/20 animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest">edit_folder.sh</span>
              <button onClick={closeEditModal} className="material-symbols-outlined text-slate-400 hover:text-on-surface transition-colors">close</button>
            </div>
            <form onSubmit={handleUpdateFolder} className="p-6 flex flex-col gap-5">
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1.5">folder_name</label>
                <input autoFocus type="text" placeholder="폴더 이름" value={editFolderName} onChange={(e) => setEditFolderName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm outline-none focus:border-primary transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1.5">travel_schedule</label>
                <div className="flex items-center gap-2">
                  <input type="date" value={editFolderStart} onChange={(e) => { setEditFolderStart(e.target.value); if (editFolderEnd && e.target.value > editFolderEnd) setEditFolderEnd(''); }} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-mono outline-none focus:border-primary transition-all" />
                  <span className="text-slate-400 font-mono text-xs shrink-0">~</span>
                  <input type="date" value={editFolderEnd} min={editFolderStart || undefined} onChange={(e) => setEditFolderEnd(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-mono outline-none focus:border-primary transition-all" />
                </div>
                {editFolderStart && <p className="text-[10px] font-mono text-primary mt-2">{formatScheduleShort(editFolderStart, editFolderEnd)}</p>}
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={closeEditModal} className="flex-1 py-3 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl">CANCEL</button>
                <button type="submit" className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-bold">SAVE_CHANGES</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <main className="p-10 flex flex-col lg:flex-row gap-8 max-w-[1600px] mx-auto">
        <aside className="w-full lg:w-72 flex flex-col gap-6 flex-shrink-0">
          <PageHeader
            label="wishlist.workspace"
            title={`${user?.name || 'user'} wishlist`}
            description="저장한 여행지와 폴더별 메모를 관리합니다."
            compact
          />

          {/* TRAVEL_STATS */}
          <section className="bg-inverse-surface text-inverse-on-surface p-5 rounded-xl font-mono text-[10px] leading-relaxed shadow-lg">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
              <span className="material-symbols-outlined text-primary-container text-sm">analytics</span>
              <span className="uppercase opacity-60 tracking-widest">Travel_Stats</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="opacity-40">TOTAL_NODES:</span>
                <span className="text-emerald-400 font-bold">{stats.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="opacity-40">FOLDERS:</span>
                <span className="text-emerald-400 font-bold">{stats.folderCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="opacity-40">UNCATEGORIZED:</span>
                <span className="text-cyan-400 font-bold">{stats.uncategorized}</span>
              </div>
              {stats.topFolder?.count > 0 && (
                <div className="flex justify-between items-start border-t border-white/5 pt-2.5 mt-1">
                  <span className="opacity-40 shrink-0">TOP_FOLDER:</span>
                  <span className="text-yellow-400 font-bold text-right ml-2 truncate">
                    {stats.topFolder.name}
                    <span className="opacity-50 font-normal"> ({stats.topFolder.count})</span>
                  </span>
                </div>
              )}
            </div>
          </section>

          <section className="bg-surface-container-low p-5 rounded-xl border border-outline-variant/10 shadow-sm">
            <div className="flex items-center justify-between border-b border-outline-variant/15 pb-3 mb-4">
              <span className="font-label text-xs font-bold uppercase tracking-wider">FOLDERS</span>
              <button onClick={() => setShowFolderModal(true)} className="material-symbols-outlined text-primary text-sm bg-primary/10 w-6 h-6 rounded flex items-center justify-center">add</button>
            </div>
            
            <nav className="flex flex-col gap-1">
              <button onClick={() => setSelectedFolderId(null)} className={`flex justify-between px-3 py-3 rounded-lg text-[13px] font-body font-bold tracking-tight transition-all ${!selectedFolderId ? 'bg-primary text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
                <span className="font-mono uppercase">ALL_NODES</span>
                <span className="opacity-60 font-mono text-[11px]">{wishlistItems.length}</span>
              </button>
              <button onClick={() => setSelectedFolderId('UNCATEGORIZED')} className={`flex justify-between px-3 py-3 rounded-lg text-[13px] font-body font-bold tracking-tight transition-all ${selectedFolderId === 'UNCATEGORIZED' ? 'bg-primary text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
                <span className="font-mono uppercase">UNCATEGORIZED</span>
                <span className="opacity-60 font-mono text-[11px]">{wishlistItems.filter(i => !i.folder_id).length}</span>
              </button>
              <div className="h-2" />
              {folders.map(folder => (
                <button key={folder.id} onClick={() => setSelectedFolderId(folder.id)} className={`flex justify-between items-start px-3 py-3 rounded-lg text-[13px] font-body font-bold tracking-tight group transition-all ${selectedFolderId === folder.id ? 'bg-primary text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
                  <div className="flex-1 min-w-0 text-left">
                    <span className="block truncate uppercase">{folder.name}</span>
                    {folder.start_date && (
                      <span className={`block text-[10px] font-mono font-normal mt-0.5 truncate ${selectedFolderId === folder.id ? 'text-white/70' : 'text-slate-400'}`}>
                        {formatScheduleShort(folder.start_date, folder.end_date)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[11px] shrink-0 ml-2 mt-0.5">
                    <span className="opacity-60">{wishlistItems.filter(i => String(i.folder_id) === String(folder.id)).length}</span>
                    <span onClick={(e) => { e.stopPropagation(); openEditModal(folder); }} className={`material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-opacity ${selectedFolderId === folder.id ? 'hover:text-white/80' : 'hover:text-primary'}`}>edit</span>
                    <span onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }} className={`material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-opacity ${selectedFolderId === folder.id ? 'hover:text-red-300' : 'hover:text-red-500'}`}>delete</span>
                  </div>
                </button>
              ))}
            </nav>
          </section>

          {/* FOLDER_NOTES (신규 추가 섹션) */}
          {selectedFolder && (
            <section className="bg-surface-container-high p-5 rounded-xl border border-outline-variant/10 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between border-b border-outline-variant/15 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">edit_note</span>
                  <span className="font-label text-[10px] font-bold uppercase tracking-widest text-primary">Folder_Notes</span>
                </div>
                <div className="flex bg-slate-100 rounded-md p-0.5">
                  <button onClick={() => setNoteType('CHECKLIST')} className={`px-2 py-0.5 text-[9px] font-bold rounded transition-all ${noteType === 'CHECKLIST' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}>LIST</button>
                  <button onClick={() => setNoteType('MEMO')} className={`px-2 py-0.5 text-[9px] font-bold rounded transition-all ${noteType === 'MEMO' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}>MEMO</button>
                </div>
              </div>

              {/* 노트 입력 폼 */}
              <form onSubmit={handleAddNote} className="mb-4">
                <div className="relative group">
                  <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder={noteType === 'CHECKLIST' ? "새 체크리스트..." : "메모 작성..."}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 pr-10 text-[11px] outline-none focus:border-primary transition-all font-body"
                  />
                  <button type="submit" className="absolute right-2 inset-y-0 flex items-center justify-center material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors text-lg leading-none">subdirectory_arrow_left</button>
                </div>
              </form>

              {/* 노트 리스트 */}
              <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-2">
                {visibleNotes.length === 0 ? (
                  <p className="text-[10px] text-slate-300 font-mono text-center py-2">// no_notes_found</p>
                ) : (
                  visibleNotes.map(note => (
                    <div key={note.id} className="flex items-start gap-2 group">
                      {note.type === 'CHECKLIST' ? (
                        <button onClick={() => handleToggleNote(note.id)} className={`material-symbols-outlined text-base mt-0.5 shrink-0 transition-colors ${note.is_completed ? 'text-emerald-500 fill-1' : 'text-slate-300'}`}>
                          {note.is_completed ? 'check_box' : 'check_box_outline_blank'}
                        </button>
                      ) : (
                        <span className="material-symbols-outlined text-base mt-0.5 shrink-0 text-primary/40">notes</span>
                      )}
                      <div className="flex-1 min-w-0 flex flex-col">
                        <span className={`text-[11px] leading-relaxed break-words font-body transition-all ${note.is_completed ? 'text-slate-300 line-through' : 'text-slate-600'}`}>
                          {note.content}
                        </span>
                        <span className="text-[8px] font-mono text-slate-300 mt-0.5">{formatDate(note.created_at)}</span>
                      </div>
                      <button onClick={() => handleDeleteNote(note.id)} className="material-symbols-outlined text-xs text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0 mt-0.5">delete</button>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {selectedFolder && (
            <section className="bg-inverse-surface text-inverse-on-surface p-5 rounded-xl font-mono text-[10px] leading-relaxed shadow-lg">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
                <span className="material-symbols-outlined text-primary-container text-sm">info</span>
                <span className="uppercase opacity-60 tracking-widest">Folder_Metadata</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center"><span className="opacity-40">CREATED_AT:</span><span className="text-emerald-400 font-bold">{formatDate(selectedFolder.created_at)}</span></div>
                <div className="flex justify-between items-center"><span className="opacity-40">LAST_UPDATED:</span><span className="text-emerald-400 font-bold">{formatDate(selectedFolder.updated_at || selectedFolder.created_at)}</span></div>
                {selectedFolder.start_date && (
                  <div className="flex flex-col gap-1.5 border-t border-white/5 pt-2 mt-2">
                    <span className="opacity-40">TRAVEL_DATE:</span>
                    <span className="text-cyan-400 font-bold whitespace-pre-line">{formatScheduleFull(selectedFolder.start_date, selectedFolder.end_date)}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          <section className="mt-4 pt-6 border-t border-dashed border-outline-variant/20">
            <div className="bg-slate-50/50 rounded-xl p-4 border border-outline-variant/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
                  <span className="font-mono text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Sync_Active</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-600 font-bold bg-white px-2 py-0.5 rounded border border-emerald-100 shadow-sm">200_OK</span>
              </div>
              <p className="text-[11px] text-slate-500 font-body leading-relaxed">사용자의 데이터 노드가 원격 서버와 <br/>실시간으로 동기화되고 있습니다.</p>
            </div>
          </section>
        </aside>

        <div className="flex-1">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="font-headline text-xl font-bold">{selectedFolderId === 'UNCATEGORIZED' ? '미분류' : selectedFolderId ? folders.find(f => f.id === selectedFolderId)?.name : '전체 위시리스트'}</h3>
              {selectedFolder?.start_date && <p className="text-[11px] font-mono text-primary mt-1">{formatScheduleShort(selectedFolder.start_date, selectedFolder.end_date)}</p>}
            </div>
            <div className="flex items-center gap-2">
              {selectedFolderId && (
                <button
                  type="button"
                  onClick={openExploreForCurrentFolder}
                  className="px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-bold hover:brightness-110 transition-all flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">travel_explore</span>
                  EXPLORE_ADD
                </button>
              )}
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-surface-container-low text-[10px] font-mono px-3 py-1.5 rounded-lg outline-none border border-outline-variant/10">
                <option value="CREATED">NEWEST</option>
                <option value="TITLE">TITLE A-Z</option>
                <option value="TITLE_DESC">TITLE Z-A</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" /></div>
          ) : sortedWishList.length === 0 ? (
            <div className="border-2 border-dashed border-outline-variant/30 rounded-xl flex flex-col items-center justify-center p-20 cursor-pointer" onClick={selectedFolderId ? openExploreForCurrentFolder : () => navigate('/explore')}>
              <span className="material-symbols-outlined text-4xl text-primary mb-4">add_location_alt</span>
              <p className="text-xs font-mono text-slate-400">// empty_data_node</p>
              {selectedFolderId && selectedFolderId !== 'UNCATEGORIZED' && notes.length > 0 && (
                <p className="mt-3 max-w-sm text-center text-xs leading-5 text-slate-400">
                  이 폴더에는 저장된 여행지 카드는 없고 AI 메모와 체크리스트만 저장되어 있습니다.
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {sortedWishList.map((item) => {
                const itemId = item.contentid || item.content_id;
                const itemTitle = item.title || '여행지';
                const itemImage = item.firstimage || item.image_url || FALLBACK_IMAGE;

                return (
                  <div key={itemId} className="group bg-white rounded-xl overflow-hidden border border-outline-variant/10 hover:border-primary/30 transition-all shadow-sm relative">
                    {movingItemId === itemId && (
                      <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-sm p-6 flex flex-col">
                        <div className="flex justify-between mb-4 border-b pb-2"><span className="text-[10px] font-bold font-mono text-primary">MOVE_TO_FOLDER</span><button onClick={() => setMovingItemId(null)} className="material-symbols-outlined text-xs">close</button></div>
                        <div className="flex-1 overflow-y-auto space-y-1">
                          <button onClick={() => { moveItem(itemId, null); setMovingItemId(null); }} className="w-full text-left px-3 py-2 text-xs font-mono hover:bg-slate-50 rounded-lg flex justify-between">
                            <span>// UNCATEGORIZED</span>
                            {!item.folder_id && <span className="material-symbols-outlined text-xs text-emerald-500">check</span>}
                          </button>
                          {folders.map(f => (
                            <button key={f.id} onClick={() => { moveItem(itemId, f.id); setMovingItemId(null); }} className="w-full text-left px-3 py-2 text-xs font-mono hover:bg-slate-50 rounded-lg flex justify-between">
                              <span>// {f.name}</span>
                              {String(item.folder_id) === String(f.id) && <span className="material-symbols-outlined text-xs text-emerald-500">check</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="relative h-48">
                      <img src={itemImage} alt={itemTitle} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />
                      <div className="absolute top-3 right-3 flex flex-col gap-2">
                        <button onClick={(e) => handleRemoveWish(e, itemId)} className="w-8 h-8 bg-white/90 text-red-500 rounded-lg flex items-center justify-center shadow-lg transition-all"><span className="material-symbols-outlined text-lg fill-1">favorite</span></button>
                        <button onClick={() => setMovingItemId(itemId)} className="w-8 h-8 bg-white/90 text-slate-500 rounded-lg flex items-center justify-center shadow-lg transition-all"><span className="material-symbols-outlined text-lg">folder_shared</span></button>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-headline text-base font-bold truncate mb-1">{itemTitle}</h3>
                      <p className="text-[10px] text-slate-400 font-mono mb-4 truncate">{item.addr1 || '주소 정보 없음'}</p>
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">FOLDER: {item.folder_id ? (folders.find(f => String(f.id) === String(item.folder_id))?.name || '...') : 'UNCATEGORIZED'}</span>
                        <Link to={`/explore/${itemId}`} className="bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-primary hover:text-white transition-all border border-slate-100">VIEW_DATA</Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyPage;
