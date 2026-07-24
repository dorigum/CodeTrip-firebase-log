import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import useWishlistStore from '../store/useWishlistStore';
import useToast from '../hooks/useToast';
import PageHeader from '../components/PageHeader';
import ConfirmModal from '../components/ConfirmModal';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000&auto=format&fit=crop';
const DATE_MIN = '1000-01-01';
const DATE_MAX = '9999-12-31';
const FOUR_DIGIT_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const REGION_MATCHERS = [
  { key: '서울', aliases: ['서울', '서울특별시'] },
  { key: '부산', aliases: ['부산', '부산광역시'] },
  { key: '대구', aliases: ['대구', '대구광역시'] },
  { key: '인천', aliases: ['인천', '인천광역시'] },
  { key: '광주', aliases: ['광주', '광주광역시'] },
  { key: '대전', aliases: ['대전', '대전광역시'] },
  { key: '울산', aliases: ['울산', '울산광역시'] },
  { key: '세종', aliases: ['세종', '세종특별자치시'] },
  { key: '경기', aliases: ['경기', '경기도'] },
  { key: '강원', aliases: ['강원', '강원도', '강원특별자치도'] },
  { key: '충북', aliases: ['충북', '충청북도'] },
  { key: '충남', aliases: ['충남', '충청남도'] },
  { key: '전북', aliases: ['전북', '전라북도', '전북특별자치도'] },
  { key: '전남', aliases: ['전남', '전라남도'] },
  { key: '경북', aliases: ['경북', '경상북도'] },
  { key: '경남', aliases: ['경남', '경상남도'] },
  { key: '제주', aliases: ['제주', '제주도', '제주특별자치도'] },
];

const getRegionKey = (value) => {
  const text = String(value || '').trim();
  if (!text) return '';

  return REGION_MATCHERS.find(({ aliases }) => aliases.some((alias) => text.includes(alias)))?.key || '';
};

const MyPage = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuthStore();
  
  const {
    wishlistItems, folders, loading, syncError,
    initWishlist, toggleWishlist, createFolder, updateFolder, deleteFolder, moveItem,
    fetchNotes, fetchAiTripPlans, migrateLegacyAiCourseNotes, updateAiTripPlan, deleteAiTripPlan,
    addNote, toggleNote: toggleNoteAction, deleteNote: deleteNoteAction
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
  const [selectedAiPlan, setSelectedAiPlan] = useState(null);
  const [editingAiPlan, setEditingAiPlan] = useState(false);
  const [editAiPlanTitle, setEditAiPlanTitle] = useState('');
  const [editAiPlanSummary, setEditAiPlanSummary] = useState('');
  const [aiPlanPending, setAiPlanPending] = useState(false);
  const [planDeleteTarget, setPlanDeleteTarget] = useState(null);
  const [legacyMigrationOpen, setLegacyMigrationOpen] = useState(false);
  const [legacyMigrationPending, setLegacyMigrationPending] = useState(false);

  // --- Note(Memo/Checklist) States ---
  const [notes, setNotes] = useState([]);
  const [aiTripPlans, setAiTripPlans] = useState([]);
  const [noteInput, setNoteInput] = useState('');
  const [noteType, setNoteType] = useState('CHECKLIST'); // 'CHECKLIST' or 'MEMO'
  const legacyAiCourseNotes = useMemo(
    () => notes.filter((note) => (
      (note.type || 'CHECKLIST') === 'MEMO'
      && String(note.content || '').trim().startsWith('[AI 여행 코스]')
    )),
    [notes]
  );
  const visibleNotes = useMemo(
    () => notes.filter((note) => (
      (note.type || 'CHECKLIST') === noteType
      && !legacyAiCourseNotes.some((legacyNote) => legacyNote.id === note.id)
    )),
    [notes, noteType, legacyAiCourseNotes]
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
    let isMounted = true;
    const loadFolderData = async () => {
      if (selectedFolderId && selectedFolderId !== 'UNCATEGORIZED') {
        const [noteData, planData] = await Promise.all([
          fetchNotes(selectedFolderId),
          fetchAiTripPlans(selectedFolderId),
        ]);
        if (!isMounted) return;
        setNotes(noteData);
        setAiTripPlans(planData);
        return;
      }
      if (!isMounted) return;
      setNotes([]);
      setAiTripPlans([]);
    };
    loadFolderData();
    return () => {
      isMounted = false;
    };
  }, [selectedFolderId, fetchNotes, fetchAiTripPlans]);

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

  const handleMigrateLegacyAiCourses = async () => {
    if (!selectedFolderId || legacyMigrationPending || legacyAiCourseNotes.length === 0) return;

    setLegacyMigrationPending(true);
    const result = await migrateLegacyAiCourseNotes(
      selectedFolderId,
      legacyAiCourseNotes.map((note) => note.id)
    );

    if (!result) {
      showToast('기존 AI 코스 메모를 변환하지 못했습니다. 잠시 후 다시 시도해주세요.');
      setLegacyMigrationPending(false);
      return;
    }

    const [noteData, planData] = await Promise.all([
      fetchNotes(selectedFolderId),
      fetchAiTripPlans(selectedFolderId),
    ]);
    setNotes(noteData);
    setAiTripPlans(planData);
    setLegacyMigrationPending(false);
    setLegacyMigrationOpen(false);
    showToast(
      `기존 AI 코스 메모 ${result.migratedCount}개를 코스 문서로 변환했습니다.`,
      'success'
    );
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

  const isValidFolderDate = (value) => !value || (
    FOUR_DIGIT_DATE_PATTERN.test(value)
    && value >= DATE_MIN
    && value <= DATE_MAX
  );

  const updateFolderDate = (value, setter) => {
    if (!isValidFolderDate(value)) {
      showToast('여행 일정의 연도는 4자리로 입력해주세요.');
      return false;
    }
    setter(value);
    return true;
  };

  const validateFolderSchedule = (startDate, endDate) => {
    if (!isValidFolderDate(startDate) || !isValidFolderDate(endDate)) {
      showToast('여행 일정의 연도는 4자리로 입력해주세요.');
      return false;
    }
    if (startDate && endDate && endDate < startDate) {
      showToast('종료일은 시작일보다 빠를 수 없습니다.');
      return false;
    }
    return true;
  };

  const handleUpdateFolder = async (e) => {
    e.preventDefault();
    if (!editFolderName.trim()) return;
    if (!validateFolderSchedule(editFolderStart, editFolderEnd)) return;
    // 날짜 문자열을 그대로 서버에 전송 (타임존 변환 방지)
    await updateFolder(editingFolder.id, editFolderName.trim(), editFolderStart || null, editFolderEnd || null);
    closeEditModal();
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    if (!validateFolderSchedule(newFolderStart, newFolderEnd)) return;
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
    const latestAiPlanRegion = aiTripPlans
      .map((plan) => plan.generation_context?.regionName || plan.generationContext?.regionName)
      .find(Boolean);
    const expectedRegionKey = getRegionKey(latestAiPlanRegion);

    return items.filter((item) => {
      if (item.source === 'ai_generated' || item.aiSuggestedContentId) return false;

      if (item.verified_at && expectedRegionKey) {
        const itemRegionKey = getRegionKey(item.addr1 || item.address);
        if (itemRegionKey && itemRegionKey !== expectedRegionKey) return false;
      }

      return true;
    });
  }, [aiTripPlans, wishlistItems, selectedFolderId]);

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

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return 'N/A';

    return `${formatDate(dateStr)} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
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

  const getPlanItems = (day) => (
    Array.isArray(day?.items) ? day.items : []
  ).filter(Boolean);

  const getPlanPlaceName = (item) => item.placeName || item.title || item.name || '추천 장소';
  const getPlanAddress = (item) => item.address || item.addr1 || item.location || '';
  const getPlanNote = (item) => item.reason || item.description || item.tip || item.memo || item.note || '';
  const getPlanSourceBadge = (item) => {
    if (item.tourApiVerified) {
      return { label: 'TourAPI verified', className: 'bg-primary/10 text-primary' };
    }
    if (item.source === 'ai_generated' || !(item.contentId || item.contentid || item.content_id)) {
      return { label: 'AI 추천', className: 'bg-slate-100 text-slate-500' };
    }
    return { label: 'TourAPI legacy', className: 'bg-amber-100 text-amber-700' };
  };
  const getPlanItemCount = (plan) => (
    Array.isArray(plan?.days) ? plan.days : []
  ).reduce((total, day) => total + getPlanItems(day).length, 0);

  const openAiPlan = (plan) => {
    setEditingAiPlan(false);
    setSelectedAiPlan(plan);
  };

  const closeAiPlan = () => {
    if (aiPlanPending) return;
    setEditingAiPlan(false);
    setSelectedAiPlan(null);
  };

  const startAiPlanEdit = () => {
    setEditAiPlanTitle(selectedAiPlan?.title || selectedFolder?.name || '');
    setEditAiPlanSummary(selectedAiPlan?.summary || '');
    setEditingAiPlan(true);
  };

  const handleUpdateAiPlan = async () => {
    if (!selectedAiPlan || aiPlanPending) return;
    if (!editAiPlanTitle.trim()) {
      showToast('코스 문서 제목을 입력해주세요.', 'info');
      return;
    }

    setAiPlanPending(true);
    const updated = await updateAiTripPlan(selectedAiPlan.id, {
      title: editAiPlanTitle.trim(),
      summary: editAiPlanSummary.trim(),
    });
    setAiPlanPending(false);

    if (!updated) {
      showToast('AI 여행 코스 문서를 수정하지 못했습니다.');
      return;
    }

    const nextPlan = { ...selectedAiPlan, ...updated };
    setSelectedAiPlan(nextPlan);
    setAiTripPlans((prev) => prev.map((plan) => (
      String(plan.id) === String(nextPlan.id) ? nextPlan : plan
    )));
    setEditingAiPlan(false);
    showToast('AI 여행 코스 문서를 수정했습니다.', 'success');
  };

  const handleDeleteAiPlan = async () => {
    if (!planDeleteTarget || aiPlanPending) return;

    setAiPlanPending(true);
    const deleted = await deleteAiTripPlan(planDeleteTarget.id);
    setAiPlanPending(false);

    if (!deleted) {
      showToast('AI 여행 코스 문서를 삭제하지 못했습니다.');
      return;
    }

    setAiTripPlans((prev) => prev.filter((plan) => String(plan.id) !== String(planDeleteTarget.id)));
    if (String(selectedAiPlan?.id) === String(planDeleteTarget.id)) {
      setSelectedAiPlan(null);
      setEditingAiPlan(false);
    }
    setPlanDeleteTarget(null);
    showToast('AI 여행 코스 문서를 삭제했습니다.', 'success');
  };

  const handleRegenerateAiPlan = () => {
    if (!selectedAiPlan) return;
    navigate('/ai-planner', {
      state: {
        regeneratePlan: selectedAiPlan,
        folderId: selectedFolderId,
      },
    });
  };

  const handleSelectFolder = (folderId) => {
    setSelectedAiPlan(null);
    setEditingAiPlan(false);
    setSelectedFolderId(folderId);
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
                  <input type="date" min={DATE_MIN} max={DATE_MAX} value={newFolderStart} onChange={(e) => { if (updateFolderDate(e.target.value, setNewFolderStart) && newFolderEnd && e.target.value > newFolderEnd) setNewFolderEnd(''); }} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-mono outline-none focus:border-primary transition-all" />
                  <span className="text-slate-400 font-mono text-xs shrink-0">~</span>
                  <input type="date" value={newFolderEnd} min={newFolderStart || DATE_MIN} max={DATE_MAX} onChange={(e) => updateFolderDate(e.target.value, setNewFolderEnd)} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-mono outline-none focus:border-primary transition-all" />
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
                  <input type="date" min={DATE_MIN} max={DATE_MAX} value={editFolderStart} onChange={(e) => { if (updateFolderDate(e.target.value, setEditFolderStart) && editFolderEnd && e.target.value > editFolderEnd) setEditFolderEnd(''); }} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-mono outline-none focus:border-primary transition-all" />
                  <span className="text-slate-400 font-mono text-xs shrink-0">~</span>
                  <input type="date" value={editFolderEnd} min={editFolderStart || DATE_MIN} max={DATE_MAX} onChange={(e) => updateFolderDate(e.target.value, setEditFolderEnd)} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-mono outline-none focus:border-primary transition-all" />
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

      {selectedAiPlan && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <article className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant/20 bg-slate-950 px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-300" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <span className="font-label text-[11px] font-bold uppercase tracking-[0.22em] text-white/60">AI_COURSE_DETAIL.md</span>
              </div>
              <button
                type="button"
                onClick={closeAiPlan}
                className="material-symbols-outlined rounded-lg p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
                aria-label="AI 코스 상세 닫기"
              >
                close
              </button>
            </div>

            <div className="custom-scrollbar grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_260px] lg:overflow-hidden">
              <div className="p-5 md:p-8 lg:overflow-y-auto">
                <p className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.22em] text-primary"># CodeTrip course document</p>
                {editingAiPlan ? (
                  <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-5">
                    <div>
                      <label className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
                        Course_title
                      </label>
                      <input
                        type="text"
                        value={editAiPlanTitle}
                        onChange={(event) => setEditAiPlanTitle(event.target.value)}
                        className="w-full rounded-xl border border-outline-variant/30 bg-white px-4 py-3 font-headline text-lg font-bold text-slate-950 outline-none transition focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
                        Course_summary
                      </label>
                      <textarea
                        value={editAiPlanSummary}
                        onChange={(event) => setEditAiPlanSummary(event.target.value)}
                        rows={5}
                        className="min-h-36 w-full resize-y rounded-xl border border-outline-variant/30 bg-white px-4 py-3 text-sm leading-7 text-slate-600 outline-none transition focus:border-primary"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingAiPlan(false)}
                        disabled={aiPlanPending}
                        className="h-10 rounded-xl px-4 text-xs font-bold text-slate-500 transition hover:bg-white disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleUpdateAiPlan}
                        disabled={aiPlanPending}
                        className="h-10 rounded-xl bg-primary px-4 text-xs font-bold text-white transition hover:brightness-110 disabled:opacity-50"
                      >
                        {aiPlanPending ? 'Saving...' : 'Save_changes'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="font-headline text-3xl font-bold text-slate-950">{selectedAiPlan.title || selectedFolder?.name}</h2>
                    {selectedAiPlan.summary && (
                      <blockquote className="mt-5 border-l-4 border-primary bg-primary/5 px-5 py-4 text-sm leading-7 text-slate-600">
                        {selectedAiPlan.summary}
                      </blockquote>
                    )}
                  </>
                )}

                {selectedAiPlan.legacy_content && (
                  <section className="mt-8 overflow-hidden rounded-2xl border border-outline-variant/20">
                    <div className="border-b border-outline-variant/15 bg-slate-50 px-5 py-4">
                      <p className="font-mono text-xs font-bold text-primary">## LEGACY_COURSE_CONTENT</p>
                    </div>
                    <div className="whitespace-pre-wrap px-5 py-5 text-sm leading-8 text-slate-600">
                      {selectedAiPlan.legacy_content}
                    </div>
                  </section>
                )}

                <div className="mt-8 space-y-6">
                  {(selectedAiPlan.days || []).map((day, dayIndex) => (
                    <section key={`${selectedAiPlan.id}-detail-${day.day || dayIndex}`} className="rounded-2xl border border-outline-variant/20">
                      <div className="border-b border-outline-variant/15 bg-slate-50 px-5 py-4">
                        <p className="font-mono text-xs font-bold text-primary">## DAY_{day.day || dayIndex + 1}</p>
                        <h3 className="mt-1 font-headline text-xl font-bold text-slate-950">{day.theme || day.title || '추천 일정'}</h3>
                      </div>
                      <div className="divide-y divide-outline-variant/10">
                        {getPlanItems(day).map((item, itemIndex) => (
                          <div key={`${selectedAiPlan.id}-detail-${dayIndex}-${itemIndex}`} className="grid gap-4 px-5 py-5 md:grid-cols-[86px_minmax(0,1fr)]">
                            <span className="font-mono text-sm font-bold text-primary">{item.time || item.startTime || `${itemIndex + 1}.`}</span>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-headline text-lg font-bold text-slate-950">{getPlanPlaceName(item)}</h4>
                                {(item.category || item.cat3Name || item.type) && (
                                  <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                                    {item.category || item.cat3Name || item.type}
                                  </span>
                                )}
                                <span className={`rounded-md px-2 py-1 text-[10px] font-bold ${getPlanSourceBadge(item).className}`}>
                                  {getPlanSourceBadge(item).label}
                                </span>
                              </div>
                              {getPlanAddress(item) && (
                                <p className="mt-1 text-xs text-slate-400">{getPlanAddress(item)}</p>
                              )}
                              {getPlanNote(item) && (
                                <p className="mt-3 text-sm leading-7 text-slate-600">{getPlanNote(item)}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </div>

              <aside className="border-t border-outline-variant/20 bg-slate-50 p-5 md:p-6 lg:border-l lg:border-t-0">
                <p className="font-label text-[10px] font-bold uppercase tracking-[0.22em] text-primary">Course_Meta</p>
                <dl className="mt-5 space-y-4 text-sm">
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Folder</dt>
                    <dd className="mt-1 font-bold text-slate-900">{selectedFolder?.name || 'UNKNOWN'}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Created</dt>
                    <dd className="mt-1 font-bold text-slate-900">{formatDateTime(selectedAiPlan.created_at)}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Days</dt>
                    <dd className="mt-1 font-bold text-slate-900">{selectedAiPlan.days?.length || 0}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Places</dt>
                    <dd className="mt-1 font-bold text-slate-900">{getPlanItemCount(selectedAiPlan)}</dd>
                  </div>
                </dl>
                <div className="mt-8 space-y-2">
                  <button
                    type="button"
                    onClick={startAiPlanEdit}
                    disabled={editingAiPlan || aiPlanPending}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary/25 bg-white text-xs font-bold uppercase tracking-wider text-primary transition hover:bg-primary/5 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-base">edit</span>
                    Edit_document
                  </button>
                  <button
                    type="button"
                    onClick={handleRegenerateAiPlan}
                    disabled={aiPlanPending}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary/25 bg-white text-xs font-bold uppercase tracking-wider text-primary transition hover:bg-primary/5 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-base">refresh</span>
                    Regenerate
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlanDeleteTarget(selectedAiPlan)}
                    disabled={aiPlanPending}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white text-xs font-bold uppercase tracking-wider text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                    Delete_document
                  </button>
                  <button
                    type="button"
                    onClick={closeAiPlan}
                    className="h-11 w-full rounded-xl bg-primary text-xs font-bold uppercase tracking-wider text-white transition hover:brightness-110"
                  >
                    Return_to_folder
                  </button>
                </div>
              </aside>
            </div>
          </article>
        </div>
      )}

      <ConfirmModal
        open={Boolean(planDeleteTarget)}
        title="AI 여행 코스 문서를 삭제할까요?"
        description="코스 문서만 삭제됩니다. 같은 폴더에 저장된 여행지, 체크리스트와 메모는 유지됩니다."
        confirmText={aiPlanPending ? '삭제 중...' : '코스 문서 삭제'}
        cancelText="취소"
        icon="delete"
        tone="danger"
        onConfirm={handleDeleteAiPlan}
        onCancel={() => {
          if (!aiPlanPending) setPlanDeleteTarget(null);
        }}
      />

      <ConfirmModal
        open={legacyMigrationOpen}
        title="기존 AI 코스 메모를 변환할까요?"
        description={`일반 메모에 저장된 AI 여행 코스 ${legacyAiCourseNotes.length}개를 별도의 코스 문서로 옮깁니다. 원문과 기존 생성일은 코스 문서에 그대로 보존됩니다.`}
        confirmText={legacyMigrationPending ? '변환 중...' : '코스 문서로 변환'}
        cancelText="나중에"
        icon="upgrade"
        tone="primary"
        onConfirm={handleMigrateLegacyAiCourses}
        onCancel={() => {
          if (!legacyMigrationPending) setLegacyMigrationOpen(false);
        }}
      />

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
              <button onClick={() => handleSelectFolder(null)} className={`flex justify-between px-3 py-3 rounded-lg text-[13px] font-body font-bold tracking-tight transition-all ${!selectedFolderId ? 'bg-primary text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
                <span className="font-mono uppercase">ALL_NODES</span>
                <span className="opacity-60 font-mono text-[11px]">{wishlistItems.length}</span>
              </button>
              <button onClick={() => handleSelectFolder('UNCATEGORIZED')} className={`flex justify-between px-3 py-3 rounded-lg text-[13px] font-body font-bold tracking-tight transition-all ${selectedFolderId === 'UNCATEGORIZED' ? 'bg-primary text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
                <span className="font-mono uppercase">UNCATEGORIZED</span>
                <span className="opacity-60 font-mono text-[11px]">{wishlistItems.filter(i => !i.folder_id).length}</span>
              </button>
              <div className="h-2" />
              {folders.map(folder => (
                <button key={folder.id} onClick={() => handleSelectFolder(folder.id)} className={`flex justify-between items-start px-3 py-3 rounded-lg text-[13px] font-body font-bold tracking-tight group transition-all ${selectedFolderId === folder.id ? 'bg-primary text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
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

          {selectedFolder && legacyAiCourseNotes.length > 0 && (
            <section className="mb-6 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined mt-0.5 text-amber-600">history</span>
                <div>
                  <p className="font-headline text-sm font-bold text-amber-950">이전 방식으로 저장된 AI 코스가 있습니다.</p>
                  <p className="mt-1 text-xs leading-5 text-amber-800">
                    일반 메모 {legacyAiCourseNotes.length}개를 코스 문서로 변환하면 일정과 메모를 분리해서 관리할 수 있습니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLegacyMigrationOpen(true)}
                className="h-10 shrink-0 rounded-xl bg-amber-600 px-4 text-xs font-bold text-white transition hover:bg-amber-700"
              >
                Convert_to_course
              </button>
            </section>
          )}

          {selectedFolder && aiTripPlans.length > 0 && (
            <section className="mb-8 space-y-4">
              {aiTripPlans.map((plan, planIndex) => {
                const sequence = aiTripPlans.length - planIndex;
                const documentName = `AI_COURSE_${String(sequence).padStart(2, '0')}.md`;

                return (
                <article key={plan.id} className="overflow-hidden rounded-2xl border border-outline-variant/20 bg-white shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-outline-variant/15 bg-slate-50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg">terminal</span>
                      <span className="font-label text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{documentName}</span>
                      <span className={`rounded-full px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-wider ${
                        plan.source === 'legacy_wishlist_note'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-primary/10 text-primary'
                      }`}>
                        {plan.source === 'legacy_wishlist_note' ? 'Legacy_import' : 'Saved_course'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {planIndex === 0 && (
                        <span className="rounded-full bg-emerald-100 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-emerald-700">
                          Latest
                        </span>
                      )}
                      <span className="font-mono text-[10px] text-slate-400">{formatDateTime(plan.created_at)}</span>
                      <button
                        type="button"
                        onClick={() => openAiPlan(plan)}
                        className="rounded-lg bg-primary px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white transition hover:brightness-110"
                      >
                        View_Markdown
                      </button>
                    </div>
                  </div>

                  <div className="p-5 md:p-6">
                    <div className="mb-5">
                      <p className="mb-2 inline-flex rounded-full bg-primary/10 px-3 py-1 font-label text-[10px] font-bold uppercase tracking-widest text-primary">
                        CodeTrip generated course
                      </p>
                      <h4 className="font-headline text-2xl font-bold text-slate-950">{plan.title || selectedFolder.name}</h4>
                      <p className="mt-2 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {Array.isArray(plan.days) ? plan.days.length : 0} days · {getPlanItemCount(plan)} places
                      </p>
                      {plan.summary && (
                        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{plan.summary}</p>
                      )}
                    </div>

                    <div className="space-y-4">
                      {plan.days.length === 0 ? (
                        plan.legacy_content ? (
                          <div className="rounded-xl border border-outline-variant/20 bg-slate-50 px-5 py-4">
                            <p className="line-clamp-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">{plan.legacy_content}</p>
                          </div>
                        ) : (
                          <p className="rounded-xl border border-dashed border-outline-variant/30 px-4 py-8 text-center font-mono text-xs text-slate-400">// no_course_items</p>
                        )
                      ) : (
                        plan.days.map((day, dayIndex) => (
                          <section key={`${plan.id}-day-${day.day || dayIndex}`} className="rounded-xl border border-outline-variant/20 bg-slate-50/70">
                            <div className="flex items-center justify-between border-b border-outline-variant/15 px-4 py-3">
                              <div>
                                <p className="font-label text-[10px] font-bold uppercase tracking-widest text-primary">Day {day.day || dayIndex + 1}</p>
                                <h5 className="mt-1 font-headline text-base font-bold text-slate-900">{day.theme || day.title || '추천 일정'}</h5>
                              </div>
                              <span className="material-symbols-outlined text-primary/60">route</span>
                            </div>

                            <div className="divide-y divide-outline-variant/10">
                              {getPlanItems(day).map((item, itemIndex) => (
                                <div key={`${plan.id}-${dayIndex}-${itemIndex}`} className="grid gap-3 px-4 py-4 sm:grid-cols-[72px_minmax(0,1fr)]">
                                  <span className="font-mono text-xs font-bold text-primary">{item.time || item.startTime || `${itemIndex + 1}.`}</span>
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="font-headline text-base font-bold text-slate-950">{getPlanPlaceName(item)}</p>
                                      {(item.category || item.cat3Name || item.type) && (
                                        <span className="rounded-md bg-white px-2 py-1 text-[10px] font-bold text-slate-500 ring-1 ring-outline-variant/20">
                                          {item.category || item.cat3Name || item.type}
                                        </span>
                                      )}
                                      <span className={`rounded-md px-2 py-1 text-[10px] font-bold ${getPlanSourceBadge(item).className}`}>
                                        {getPlanSourceBadge(item).label}
                                      </span>
                                    </div>
                                    {getPlanAddress(item) && (
                                      <p className="mt-1 text-xs text-slate-400">{getPlanAddress(item)}</p>
                                    )}
                                    {getPlanNote(item) && (
                                      <p className="mt-2 text-sm leading-6 text-slate-600">{getPlanNote(item)}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </section>
                        ))
                      )}
                    </div>
                  </div>
                </article>
                );
              })}
            </section>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" /></div>
          ) : sortedWishList.length === 0 ? (
            <div className="border-2 border-dashed border-outline-variant/30 rounded-xl flex flex-col items-center justify-center p-20 cursor-pointer" onClick={selectedFolderId ? openExploreForCurrentFolder : () => navigate('/explore')}>
              <span className="material-symbols-outlined text-4xl text-primary mb-4">add_location_alt</span>
              <p className="text-xs font-mono text-slate-400">// empty_data_node</p>
              {selectedFolderId && selectedFolderId !== 'UNCATEGORIZED' && (notes.length > 0 || aiTripPlans.length > 0) && (
                <p className="mt-3 max-w-xl text-center text-xs leading-5 text-slate-400 md:whitespace-nowrap">
                  이 폴더에는 저장된 여행지 카드는 없고 AI 코스 또는 체크리스트만 저장되어 있습니다.
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
