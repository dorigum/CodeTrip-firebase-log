import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { generateTripPlan } from '../api/geminiApi';
import { getDetailCommon, getTravelList } from '../api/travelInfoApi';
import { saveAiTripToFolder } from '../api/wishlistApi';
import useAuthStore from '../store/useAuthStore';
import useWishlistStore from '../store/useWishlistStore';
import useToast from '../hooks/useToast';
import PageHeader from '../components/PageHeader';

const STYLE_OPTIONS = ['실내', '문화', '맛집', '자연', '힐링', '카페', '사진', '역사'];
const AVOID_OPTIONS = ['장거리 이동', '등산', '혼잡한 장소', '야외 위주', '비싼 코스'];

const DEFAULT_FORM = {
  regionName: '서울',
  durationDays: 1,
  companionType: '친구',
  peopleCount: 2,
  budgetLevel: '보통',
  pace: '여유',
  weatherKeyword: '',
  startTime: '10:00',
  endTime: '18:00',
  travelStyle: ['실내', '문화'],
  avoidKeywords: [],
};

const REGION_HELP = '시/도, 시/군/구, 동네명까지 입력할 수 있습니다. 예: 부산, 해운대, 서울 종로';

const BUDGET_HELP = {
  낮음: '1일 1인 3만 원 이하, 무료/저가 관광지와 가성비 식사 중심',
  보통: '1일 1인 3만~8만 원, 일반 입장료·식사·카페 포함',
  높음: '1일 1인 8만 원 이상, 유료 전시·체험·분위기 좋은 식당/카페 포함',
};

const BUDGET_RANGE = {
  낮음: [0, 30000],
  보통: [30000, 80000],
  높음: [80000, null],
};

const PLAN_MODE = {
  CUSTOM: 'custom',
  FOLDER: 'folder',
};

const REGION_ALIASES = {
  서울특별시: '서울',
  부산광역시: '부산',
  대구광역시: '대구',
  인천광역시: '인천',
  광주광역시: '광주',
  대전광역시: '대전',
  울산광역시: '울산',
  세종특별자치시: '세종',
  경기도: '경기',
  강원특별자치도: '강원',
  강원도: '강원',
  충청북도: '충북',
  충청남도: '충남',
  전북특별자치도: '전북',
  전라북도: '전북',
  전라남도: '전남',
  경상북도: '경북',
  경상남도: '경남',
  제주특별자치도: '제주',
};

const toggleValue = (list, value) =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

const getRegionFromText = (value) => {
  const text = String(value || '').trim();
  if (!text) return '';

  const fullNameMatch = Object.entries(REGION_ALIASES)
    .find(([fullName]) => text.includes(fullName));
  if (fullNameMatch) return fullNameMatch[1];

  return [...new Set(Object.values(REGION_ALIASES))]
    .sort((a, b) => b.length - a.length)
    .find((region) => text.includes(region)) || '';
};

const GENERIC_FOLDER_WORDS = new Set([
  '여행', '투어', '코스', '일정', '폴더', '실내', '문화', '맛집',
  '힐링', '가족', '친구', '혼자', '당일', '주말', '추천', '고양이',
]);

const getFolderLocality = (folder, places) => {
  const folderTokens = String(folder?.name || '').match(/[가-힣A-Za-z0-9]+/g) || [];
  const placeTitles = places.map((place) => String(place.title || ''));
  const placeAddresses = places.map((place) => String(place.addr1 || place.address || ''));
  const requiredMatches = Math.max(1, Math.ceil(places.length / 2));

  return folderTokens.find((token) => {
    if (token.length < 2 || GENERIC_FOLDER_WORDS.has(token) || getRegionFromText(token)) {
      return false;
    }

    const titleMatches = placeTitles.filter((title) => title.includes(token)).length;
    const addressMatches = placeAddresses.filter((address) => address.includes(token)).length;
    return titleMatches >= requiredMatches || addressMatches > 0;
  }) || '';
};

const isUsableAddress = (value) => {
  const address = String(value || '').trim();
  return address && address !== '정보' && address !== '정보 없음';
};

const getAdministrativeParts = (address) => {
  const parts = String(address || '').trim().split(/\s+/);
  return parts.filter((part, index) => (
    index < 4 && /(?:특별시|광역시|특별자치시|특별자치도|도|시|군|구|읍|면|동)$/.test(part)
  ));
};

const getAddressRegion = (places) => {
  const addressParts = places
    .map((place) => place.addr1 || place.address || '')
    .filter(isUsableAddress)
    .map(getAdministrativeParts)
    .filter((parts) => parts.length > 0);

  if (addressParts.length === 0) return '';

  const commonParts = addressParts[0].filter((part, index) => (
    addressParts.every((parts) => parts[index] === part)
  ));
  return commonParts.join(' ');
};

const hydratePlaceAddresses = async (places) => Promise.all(places.map(async (place) => {
  if (isUsableAddress(place.addr1 || place.address)) return place;

  const contentId = place.contentid || place.contentId;
  if (!contentId) return place;

  try {
    const detail = await getDetailCommon(contentId);
    return detail?.addr1 ? { ...place, addr1: detail.addr1 } : place;
  } catch {
    return place;
  }
}));

const getFolderRegion = (folder, places) => {
  const addressRegion = getAddressRegion(places);
  if (addressRegion) {
    const folderLocality = getFolderLocality(folder, places);
    if (folderLocality && !addressRegion.includes(folderLocality)) {
      return `${addressRegion} ${folderLocality}`;
    }
    return addressRegion;
  }

  const explicitRegion = folder?.region_name || folder?.regionName || folder?.region;
  if (explicitRegion) return getRegionFromText(explicitRegion) || explicitRegion;

  return getFolderLocality(folder, places) || getRegionFromText(folder?.name);
};

const getFolderDurationDays = (folder) => {
  if (!folder?.start_date) return null;
  if (!folder.end_date) return 1;

  const start = Date.parse(`${folder.start_date}T00:00:00Z`);
  const end = Date.parse(`${folder.end_date}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;

  return Math.min(5, Math.floor((end - start) / 86400000) + 1);
};

const normalizeTourCandidate = (item) => ({
  contentid: item.contentid,
  contentId: item.contentid,
  title: item.title,
  addr1: item.addr1,
  firstimage: item.firstimage,
  contenttypeid: item.contenttypeid,
});

const formatWon = (value) => `${Math.round(value / 10000)}만 원`;

const getTotalBudgetLabel = (budgetLevel, peopleCount) => {
  const count = Math.max(1, Number(peopleCount) || 1);
  const [min, max] = BUDGET_RANGE[budgetLevel] || BUDGET_RANGE.보통;
  if (min === 0) return `1일 총 ${formatWon(max * count)} 이하`;
  if (max == null) return `1일 총 ${formatWon(min * count)} 이상`;
  return `1일 총 ${formatWon(min * count)}~${formatWon(max * count)}`;
};

const FieldLabel = ({ children }) => (
  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
    {children}
  </label>
);

const AiPlanner = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const showToast = useToast();
  const { isLoggedIn } = useAuthStore();
  const { wishlistItems, folders, initWishlist, syncWithServer } = useWishlistStore();
  const regeneratePlan = location.state?.regeneratePlan || null;
  const regenerationContext = regeneratePlan?.generation_context || regeneratePlan?.generationContext || {};
  const regenerateFolderId = location.state?.folderId || regenerationContext.sourceFolderId || '';
  const [form, setForm] = useState(() => ({
    ...DEFAULT_FORM,
    ...regenerationContext,
  }));
  const [planningMode, setPlanningMode] = useState(
    regenerateFolderId ? PLAN_MODE.FOLDER : (regenerationContext.planningMode || PLAN_MODE.CUSTOM)
  );
  const [selectedFolderId, setSelectedFolderId] = useState(
    regenerateFolderId ? String(regenerateFolderId) : ''
  );
  const [selectedContentIds, setSelectedContentIds] = useState(new Set());
  const [plan, setPlan] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const folderSelectionRequestRef = useRef(0);
  const regenerationHydratedRef = useRef(false);

  useEffect(() => {
    if (!isLoggedIn) {
      showToast('로그인 후 이용할 수 있습니다.');
      navigate('/login');
      return;
    }
    initWishlist();
  }, [isLoggedIn, initWishlist, navigate, showToast]);

  const folderPlaces = useMemo(
    () => wishlistItems.filter((item) => selectedFolderId && String(item.folder_id) === String(selectedFolderId)),
    [wishlistItems, selectedFolderId]
  );

  const selectedPlaces = useMemo(
    () => wishlistItems.filter((item) => selectedContentIds.has(String(item.contentid || item.contentId))),
    [wishlistItems, selectedContentIds]
  );

  const updateForm = useCallback(
    (key, value) => setForm((prev) => ({ ...prev, [key]: value })),
    []
  );

  const handleCompanionChange = (value) => {
    setForm((prev) => ({
      ...prev,
      companionType: value,
      peopleCount: value === '혼자' ? 1 : prev.peopleCount,
    }));

    if (value === '혼자' && Number(form.peopleCount) > 1) {
      showToast('동행 유형이 혼자일 때는 인원 수가 1명으로 설정됩니다.', 'info');
    }
  };

  const handlePeopleCountChange = (value) => {
    const nextCount = Math.max(1, Number(value) || 1);
    if (form.companionType === '혼자' && nextCount > 1) {
      updateForm('peopleCount', 1);
      showToast('동행 유형이 혼자일 때는 2명 이상으로 설정할 수 없습니다.', 'info');
      return;
    }

    updateForm('peopleCount', Math.min(nextCount, 10));
  };

  const handlePlanningModeChange = (mode) => {
    setPlanningMode(mode);
    setPlan(null);
    setSelectedContentIds(new Set());
    if (mode === PLAN_MODE.CUSTOM) {
      folderSelectionRequestRef.current += 1;
      setSelectedFolderId('');
    }
  };

  const handleFolderChange = useCallback(async (folderId) => {
    const requestId = ++folderSelectionRequestRef.current;
    setSelectedFolderId(folderId);
    const nextFolderPlaces = wishlistItems.filter((item) => folderId && String(item.folder_id) === String(folderId));
    const selectedFolder = folders.find((folder) => String(folder.id) === String(folderId));
    const folderDurationDays = getFolderDurationDays(selectedFolder);

    setSelectedContentIds(new Set(nextFolderPlaces.map((item) => String(item.contentid || item.contentId))));
    setForm((prev) => ({
      ...prev,
      ...(folderDurationDays ? { durationDays: folderDurationDays } : {}),
    }));

    const placesWithAddresses = await hydratePlaceAddresses(nextFolderPlaces);
    if (requestId !== folderSelectionRequestRef.current) return;

    const folderRegion = getFolderRegion(selectedFolder, placesWithAddresses);
    if (folderRegion) {
      updateForm('regionName', folderRegion);
    }
  }, [folders, updateForm, wishlistItems]);

  useEffect(() => {
    if (!regeneratePlan || regenerationHydratedRef.current) return;

    if (!regenerateFolderId) {
      regenerationHydratedRef.current = true;
      navigate('/ai-planner', { replace: true, state: null });
      showToast('기존 코스의 생성 조건을 불러왔습니다. 조건을 확인한 뒤 다시 생성해주세요.', 'info');
      return;
    }

    if (wishlistItems.length === 0 || folders.length === 0) return;
    const sourceFolder = folders.find((folder) => String(folder.id) === String(regenerateFolderId));
    if (!sourceFolder) return;

    regenerationHydratedRef.current = true;
    queueMicrotask(() => {
      handleFolderChange(String(regenerateFolderId));
    });
    navigate('/ai-planner', { replace: true, state: null });
    showToast('기존 코스와 위시리스트 폴더 조건을 불러왔습니다.', 'info');
  }, [
    folders,
    handleFolderChange,
    navigate,
    regenerateFolderId,
    regeneratePlan,
    showToast,
    wishlistItems,
  ]);

  const handleGenerate = async () => {
    if (!form.regionName.trim()) {
      showToast('여행 지역을 입력해주세요.');
      return;
    }

    if (form.companionType === '혼자' && Number(form.peopleCount) > 1) {
      updateForm('peopleCount', 1);
      showToast('동행 유형이 혼자일 때는 인원 수를 1명으로 설정해주세요.');
      return;
    }

    if (planningMode === PLAN_MODE.FOLDER) {
      if (!selectedFolderId) {
        showToast('코스 기준으로 사용할 위시리스트 폴더를 선택해주세요.');
        return;
      }
      if (selectedPlaces.length === 0) {
        showToast('선택한 폴더에서 코스에 반영할 여행지를 1개 이상 선택해주세요.');
        return;
      }
    }

    setGenerating(true);
    setPlan(null);
    try {
      let preferredPlaces = selectedPlaces;

      if (planningMode === PLAN_MODE.CUSTOM) {
        const { items } = await getTravelList({
          keyword: form.regionName.trim(),
          pageNo: 1,
          numOfRows: 12,
          sort: 'default',
        });
        preferredPlaces = items.map(normalizeTourCandidate).filter((item) => item.contentid);
      }

      const result = await generateTripPlan({
        ...form,
        planningMode,
        sourceFolderName: folders.find((folder) => String(folder.id) === String(selectedFolderId))?.name || '',
        regionName: form.regionName.trim(),
        durationDays: Number(form.durationDays) || 1,
        peopleCount: Number(form.peopleCount) || 1,
        totalBudgetLabel: getTotalBudgetLabel(form.budgetLevel, form.peopleCount),
        preferredPlaces,
      });
      setPlan({
        ...result,
        generationContext: {
          planningMode,
          sourceFolderId: planningMode === PLAN_MODE.FOLDER ? selectedFolderId : null,
          regionName: form.regionName.trim(),
          durationDays: Number(form.durationDays) || 1,
          companionType: form.companionType,
          peopleCount: Number(form.peopleCount) || 1,
          budgetLevel: form.budgetLevel,
          pace: form.pace,
          weatherKeyword: form.weatherKeyword,
          startTime: form.startTime,
          endTime: form.endTime,
          travelStyle: form.travelStyle,
          avoidKeywords: form.avoidKeywords,
        },
      });
      showToast(
        planningMode === PLAN_MODE.CUSTOM && preferredPlaces.length > 0
          ? `관광공사 등록 장소 ${preferredPlaces.length}개를 우선 반영해 CodeTrip 여행 코스를 생성했습니다.`
          : 'CodeTrip 여행 코스를 생성했습니다.',
        'success'
      );
    } catch (error) {
      console.error('CodeTrip trip generation failed:', error);
      showToast(error.message || 'CodeTrip이 여행 코스를 생성하지 못했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!plan) return;
    setSaving(true);
    try {
      const result = await saveAiTripToFolder(plan, {
        folderId: planningMode === PLAN_MODE.FOLDER ? selectedFolderId : null,
      });
      await syncWithServer();
      if (result.savedPlaces > 0) {
        const documentOnlyMessage = result.documentOnlyPlaces > 0
          ? ` 검증되지 않은 추천 장소 ${result.documentOnlyPlaces}개는 코스 문서에만 보관했습니다.`
          : '';
        showToast(
          `CodeTrip 여행 코스를 "${result.folder.name}" 폴더로 저장했습니다. 관광공사 검증 여행지 ${result.savedPlaces}개와 체크리스트 ${result.savedChecklist}개가 저장됐습니다.${documentOnlyMessage}`,
          'success'
        );
      } else {
        showToast(
          `CodeTrip 여행 코스를 "${result.folder.name}" 폴더로 저장했습니다. 관광공사에서 확인되지 않은 추천 장소 ${result.documentOnlyPlaces}개는 코스 문서에만 보관했습니다.`,
          'success'
        );
      }
    } catch (error) {
      console.error('Save AI trip failed:', error);
      showToast(error.message || 'CodeTrip 여행 코스를 저장하지 못했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8 pb-24 md:pb-8">
      <PageHeader
        label="ai_trip.planner"
        title="AI 여행 코스"
        description="조건을 입력하고 저장 가능한 여행 코스를 생성합니다."
        action={(
          <button
            type="button"
            onClick={() => navigate('/mypage')}
            className="inline-flex items-center justify-center gap-2 px-4 h-11 rounded-lg border border-outline-variant/50 text-slate-600 hover:text-primary hover:border-primary/40 transition-colors text-xs font-bold uppercase tracking-wider"
          >
            <span className="material-symbols-outlined text-base">folder</span>
            My Folders
          </button>
        )}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[500px_minmax(0,1fr)] gap-6">
        <section className="bg-white border border-outline-variant/30 rounded-xl shadow-sm p-5 space-y-5">
          <div>
            <FieldLabel>Plan Mode</FieldLabel>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-1 border border-outline-variant/30">
              <button
                type="button"
                onClick={() => handlePlanningModeChange(PLAN_MODE.CUSTOM)}
                className={`h-11 rounded-lg px-2 text-[11px] font-black leading-none whitespace-nowrap transition-all ${
                  planningMode === PLAN_MODE.CUSTOM
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-500 hover:text-primary hover:bg-white'
                }`}
              >
                설정한 조건으로 새 코스 생성하기
              </button>
              <button
                type="button"
                onClick={() => handlePlanningModeChange(PLAN_MODE.FOLDER)}
                className={`h-11 rounded-lg px-2 text-[11px] font-black leading-none whitespace-nowrap transition-all ${
                  planningMode === PLAN_MODE.FOLDER
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-500 hover:text-primary hover:bg-white'
                }`}
              >
                위시리스트 폴더 기반으로 코스 생성하기
              </button>
            </div>
            <p className="mt-2 text-[10px] leading-4 text-slate-400">
              폴더 기반은 저장해둔 여행지를 우선 반영하고, 조건 기반은 입력한 지역과 취향으로 새 코스를 생성합니다.
            </p>
          </div>

          {planningMode === PLAN_MODE.FOLDER && (
            <div className="rounded-xl border border-primary/15 bg-primary/5 p-4 space-y-3">
              <div>
                <FieldLabel>Source Folder</FieldLabel>
                <select
                  value={selectedFolderId}
                  onChange={(e) => handleFolderChange(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-primary/20 focus:border-primary focus:outline-none text-sm bg-white"
                >
                  <option value="">폴더를 선택해주세요</option>
                  {folders.map((folder) => {
                    const count = wishlistItems.filter((item) => String(item.folder_id) === String(folder.id)).length;
                    return (
                      <option key={folder.id} value={folder.id}>
                        {folder.name} ({count})
                      </option>
                    );
                  })}
                </select>
                <p className="mt-1.5 text-[10px] leading-4 text-slate-400">
                  선택한 폴더 안의 여행지를 기준으로 이동 순서와 세부 일정을 추천합니다.
                </p>
              </div>

              {selectedFolderId && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <FieldLabel>Folder Places</FieldLabel>
                    <span className="text-[10px] font-mono font-bold text-primary">
                      {selectedPlaces.length} / {folderPlaces.length}
                    </span>
                  </div>
                  <div className="max-h-44 overflow-y-auto border border-outline-variant/30 rounded-lg divide-y divide-outline-variant/20 bg-white">
                    {folderPlaces.length === 0 ? (
                      <p className="text-xs text-slate-400 font-mono p-4">// empty_folder_places</p>
                    ) : (
                      folderPlaces.map((item) => {
                        const id = String(item.contentid || item.contentId);
                        const selected = selectedContentIds.has(id);
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setSelectedContentIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(id)) next.delete(id);
                              else next.add(id);
                              return next;
                            })}
                            className={`w-full text-left px-3 py-2 flex items-center gap-2 text-xs transition-colors ${
                              selected ? 'bg-primary/5 text-primary' : 'hover:bg-slate-50 text-slate-600'
                            }`}
                          >
                            <span className="material-symbols-outlined text-base">{selected ? 'check_circle' : 'radio_button_unchecked'}</span>
                            <span className="truncate font-semibold">{item.title}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Region</FieldLabel>
              <input
                value={form.regionName}
                onChange={(e) => updateForm('regionName', e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-outline-variant/40 focus:border-primary focus:outline-none text-sm"
                placeholder="서울"
              />
              <p className="mt-1.5 text-[10px] leading-4 text-slate-400">{REGION_HELP}</p>
            </div>
            <div>
              <FieldLabel>Days</FieldLabel>
              <input
                type="number"
                min="1"
                max="5"
                value={form.durationDays}
                onChange={(e) => updateForm('durationDays', e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-outline-variant/40 focus:border-primary focus:outline-none text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Companion</FieldLabel>
              <select
                value={form.companionType}
                onChange={(e) => handleCompanionChange(e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-outline-variant/40 focus:border-primary focus:outline-none text-sm bg-white"
              >
                {['혼자', '연인', '가족', '친구'].map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>People</FieldLabel>
              <input
                type="number"
                min="1"
                max={form.companionType === '혼자' ? '1' : '10'}
                value={form.peopleCount}
                onChange={(e) => handlePeopleCountChange(e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-outline-variant/40 focus:border-primary focus:outline-none text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <FieldLabel>Budget</FieldLabel>
              <select
                value={form.budgetLevel}
                onChange={(e) => updateForm('budgetLevel', e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-outline-variant/40 focus:border-primary focus:outline-none text-sm bg-white"
              >
                {['낮음', '보통', '높음'].map((item) => <option key={item}>{item}</option>)}
              </select>
              <p className="mt-1.5 text-[10px] leading-4 text-slate-400">
                {BUDGET_HELP[form.budgetLevel] || BUDGET_HELP.보통}
                <span className="block text-primary font-bold">
                  {getTotalBudgetLabel(form.budgetLevel, form.peopleCount)}
                </span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <FieldLabel>Pace</FieldLabel>
              <select
                value={form.pace}
                onChange={(e) => updateForm('pace', e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-outline-variant/40 focus:border-primary focus:outline-none text-sm bg-white"
              >
                {['여유', '보통', '알참'].map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>Start</FieldLabel>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => updateForm('startTime', e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-outline-variant/40 focus:border-primary focus:outline-none text-sm"
              />
            </div>
            <div>
              <FieldLabel>End</FieldLabel>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => updateForm('endTime', e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-outline-variant/40 focus:border-primary focus:outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <FieldLabel>Weather</FieldLabel>
            <input
              value={form.weatherKeyword}
              onChange={(e) => updateForm('weatherKeyword', e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-outline-variant/40 focus:border-primary focus:outline-none text-sm"
              placeholder="비, 맑음, 더움"
            />
          </div>

          <div>
            <FieldLabel>Style</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {STYLE_OPTIONS.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => updateForm('travelStyle', toggleValue(form.travelStyle, style))}
                  className={`px-3 h-9 rounded-lg border text-xs font-bold transition-colors ${
                    form.travelStyle.includes(style)
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-slate-500 border-outline-variant/40 hover:border-primary/50'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div>
            <FieldLabel>Avoid</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {AVOID_OPTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => updateForm('avoidKeywords', toggleValue(form.avoidKeywords, item))}
                  className={`px-3 h-9 rounded-lg border text-xs font-bold transition-colors ${
                    form.avoidKeywords.includes(item)
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-500 border-outline-variant/40 hover:border-slate-400'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="w-full h-12 rounded-lg bg-primary text-white font-black text-sm uppercase tracking-wider hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">{generating ? 'hourglass_top' : 'auto_awesome'}</span>
            {generating ? 'Generating...' : 'Generate Course'}
          </button>
        </section>

        <section className="min-h-[620px] bg-white border border-outline-variant/30 rounded-xl shadow-sm overflow-hidden">
          {!plan ? (
            <div className="h-full min-h-[620px] flex flex-col items-center justify-center text-center px-6">
              <span className="material-symbols-outlined text-6xl text-primary/30 mb-4">travel_explore</span>
              <p className="font-mono text-xs text-slate-400">// generated_course_preview</p>
            </div>
          ) : (
            <div className="p-5 md:p-6 space-y-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(plan.tags || []).map((tag) => (
                      <span key={tag} className="px-2.5 py-1 rounded-lg bg-primary/5 text-primary text-[10px] font-black uppercase tracking-wider">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-950">{plan.title}</h2>
                  <p className="text-sm text-slate-500 mt-3 leading-6">{plan.summary}</p>
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="h-11 px-4 rounded-lg bg-slate-950 text-white text-xs font-black uppercase tracking-wider inline-flex items-center justify-center gap-2 hover:bg-primary transition-colors disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-base">{saving ? 'hourglass_top' : 'save'}</span>
                  {saving ? 'Saving...' : 'Save Folder'}
                </button>
              </div>

              <div className="space-y-5">
                {(plan.days || []).map((day) => (
                  <article key={day.day} className="border border-outline-variant/30 rounded-xl overflow-hidden">
                    <header className="px-4 py-3 bg-slate-50 border-b border-outline-variant/20 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Day {day.day}</p>
                        <h3 className="text-sm font-black text-slate-800">{day.theme}</h3>
                      </div>
                      <span className="material-symbols-outlined text-primary/60">route</span>
                    </header>
                    <div className="divide-y divide-outline-variant/20">
                      {(day.items || []).map((item, index) => (
                        <div key={`${day.day}-${item.order || index}`} className="p-4 grid grid-cols-[68px_1fr] gap-4">
                          <div className="text-xs font-black text-primary font-mono">{item.time || '--:--'}</div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-black text-slate-900">{item.placeName}</h4>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-bold">{item.category}</span>
                              {item.tourApiVerified ? (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-primary/5 text-primary font-bold">TourAPI verified</span>
                              ) : item.contentId ? (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-sky-50 text-sky-700 font-bold">TourAPI 후보</span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-bold">AI 추천</span>
                              )}
                            </div>
                            {item.address && <p className="text-xs text-slate-400 mt-1">{item.address}</p>}
                            <p className="text-sm text-slate-600 mt-3 leading-6">{item.reason}</p>
                            {item.tip && <p className="text-xs text-slate-400 mt-2 font-mono">// {item.tip}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-outline-variant/30 rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Folder</p>
                  <p className="font-black text-slate-900">{plan.saveGuide?.folderName}</p>
                  <p className="text-sm text-slate-500 mt-2 leading-6">{plan.saveGuide?.memo}</p>
                </div>
                <div className="border border-outline-variant/30 rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Checklist</p>
                  <ul className="space-y-2">
                    {(plan.saveGuide?.checklist || []).map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="material-symbols-outlined text-base text-primary mt-0.5">check_circle</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AiPlanner;
