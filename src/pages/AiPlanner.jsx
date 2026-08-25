import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { generateTripPlan } from '../api/geminiApi';
import { getDetailCommon, getTravelList } from '../api/travelInfoApi';
import { saveAiTripToFolder } from '../api/wishlistApi';
import useAuthStore from '../store/useAuthStore';
import useWishlistStore from '../store/useWishlistStore';
import useToast from '../hooks/useToast';
import PageHeader from '../components/PageHeader';
import { getPlanSourceBadge } from '../utils/aiPlanSource';

const STYLE_OPTIONS = ['실내', '문화', '맛집', '자연', '힐링', '카페', '사진', '역사'];
const AVOID_OPTIONS = ['장거리 이동', '등산', '혼잡한 장소', '야외 위주', '비싼 코스'];
const DATE_MIN = '1000-01-01';
const DATE_MAX = '9999-12-31';
const FOUR_DIGIT_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DURATION_DAYS = 5;

const DEFAULT_FORM = {
  regionName: '서울',
  durationDays: 1,
  travelStartDate: '',
  travelEndDate: '',
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

const BROAD_REGION_TOUR_CODES = {
  서울: '11',
  서울특별시: '11',
  부산: '26',
  부산광역시: '26',
  대구: '27',
  대구광역시: '27',
  인천: '28',
  인천광역시: '28',
  광주: '29',
  광주광역시: '29',
  대전: '30',
  대전광역시: '30',
  울산: '31',
  울산광역시: '31',
  경기: '41',
  경기도: '41',
  충북: '43',
  충청북도: '43',
  충남: '44',
  충청남도: '44',
  전북: '52',
  전라북도: '52',
  전남: '46',
  전라남도: '46',
  경북: '47',
  경상북도: '47',
  경남: '48',
  경상남도: '48',
  제주: '50',
  제주도: '50',
  제주특별자치도: '50',
  강원: '51',
  강원도: '51',
  강원특별자치도: '51',
  세종: '36110',
  세종특별자치시: '36110',
};

const getBroadRegionTourCode = (regionName) => {
  const normalized = String(regionName || '').trim();
  return BROAD_REGION_TOUR_CODES[normalized] || '';
};

const getPlaceAreaKey = (place = {}) => {
  const address = String(place.addr1 || place.address || '').trim();
  if (!address) return String(place.title || place.placeName || '').trim();
  return address.split(/\s+/).slice(0, 2).join(' ');
};

const diversifyPreferredPlaces = (places = [], limit = 12) => {
  const buckets = new Map();
  places.forEach((place) => {
    const key = getPlaceAreaKey(place) || 'unknown';
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(place);
  });

  const result = [];
  const areaLists = Array.from(buckets.values());
  let index = 0;
  while (result.length < limit && areaLists.some((list) => index < list.length)) {
    areaLists.forEach((list) => {
      if (result.length < limit && list[index]) result.push(list[index]);
    });
    index += 1;
  }

  return result;
};

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

const parseTripDateParts = (dateString) => {
  if (!FOUR_DIGIT_DATE_PATTERN.test(dateString)) return null;
  const [year, month, day] = dateString.split('-').map(Number);
  return { year, month, day };
};

const parseLocalDate = (dateString) => {
  const parts = parseTripDateParts(dateString);
  if (!parts) return null;
  const date = new Date(0);
  date.setFullYear(parts.year, parts.month - 1, parts.day);
  date.setHours(0, 0, 0, 0);
  return date;
};

const isValidTripDate = (value) => {
  if (!value) return true;
  if (value < DATE_MIN || value > DATE_MAX) return false;

  const parts = parseTripDateParts(value);
  if (!parts) return false;

  const date = parseLocalDate(value);
  return (
    date
    && date.getFullYear() === parts.year
    && date.getMonth() === parts.month - 1
    && date.getDate() === parts.day
  );
};

const formatDateInput = (date) => (
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
);

const addDaysToDate = (dateString, daysToAdd) => {
  if (!isValidTripDate(dateString) || !dateString) return '';
  const date = parseLocalDate(dateString);
  date.setDate(date.getDate() + daysToAdd);
  return formatDateInput(date);
};

const subtractDaysFromDate = (dateString, daysToSubtract) => {
  if (!isValidTripDate(dateString) || !dateString) return '';
  const date = parseLocalDate(dateString);
  date.setDate(date.getDate() - daysToSubtract);
  return formatDateInput(date);
};

const normalizeDurationDays = (value, fallback = 1) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(MAX_DURATION_DAYS, Math.max(1, Math.trunc(parsed)));
};

const getMaxTripStartDate = (durationDays) => (
  subtractDaysFromDate(DATE_MAX, normalizeDurationDays(durationDays) - 1) || DATE_MAX
);

const getInclusiveDurationDays = (startDate, endDate) => {
  if (!startDate || !endDate || !isValidTripDate(startDate) || !isValidTripDate(endDate)) return null;
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  if (!start || !end) return null;
  const diffMs = end - start;
  if (diffMs < 0) return null;
  return Math.round(diffMs / 86400000) + 1;
};

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

const getNormalizedFolderSchedule = (folder) => {
  const startDate = String(folder?.start_date || '').slice(0, 10);
  const endDate = String(folder?.end_date || '').slice(0, 10);
  const hasStartDate = Boolean(startDate);
  const hasEndDate = Boolean(endDate);

  if (!hasStartDate && !hasEndDate) {
    return {
      durationDays: DEFAULT_FORM.durationDays,
      travelStartDate: '',
      travelEndDate: '',
      adjusted: false,
    };
  }

  if (!hasStartDate || !isValidTripDate(startDate)) {
    return {
      durationDays: DEFAULT_FORM.durationDays,
      travelStartDate: '',
      travelEndDate: '',
      adjusted: true,
    };
  }

  if (!hasEndDate || !isValidTripDate(endDate)) {
    return {
      durationDays: 1,
      travelStartDate: startDate,
      travelEndDate: startDate,
      adjusted: true,
    };
  }

  const folderDurationDays = getInclusiveDurationDays(startDate, endDate);
  if (!folderDurationDays) {
    return {
      durationDays: 1,
      travelStartDate: startDate,
      travelEndDate: startDate,
      adjusted: true,
    };
  }

  if (folderDurationDays > MAX_DURATION_DAYS) {
    return {
      durationDays: MAX_DURATION_DAYS,
      travelStartDate: startDate,
      travelEndDate: addDaysToDate(startDate, MAX_DURATION_DAYS - 1),
      adjusted: true,
    };
  }

  return {
    durationDays: folderDurationDays,
    travelStartDate: startDate,
    travelEndDate: endDate,
    adjusted: false,
  };
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

const FieldLabel = ({ children, htmlFor }) => (
  <label
    htmlFor={htmlFor}
    className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2"
  >
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
  const [form, setForm] = useState(() => {
    const initialForm = {
      ...DEFAULT_FORM,
      ...regenerationContext,
    };
    return {
      ...initialForm,
      durationDays: normalizeDurationDays(initialForm.durationDays),
      travelStartDate: initialForm.travelStartDate || '',
      travelEndDate: initialForm.travelEndDate || '',
    };
  });
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
  const [folderHydrating, setFolderHydrating] = useState(false);
  const [isPlanSaved, setIsPlanSaved] = useState(false);
  const generationInFlightRef = useRef(false);
  const saveInFlightRef = useRef(false);
  const plannerRevisionRef = useRef(0);
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

  const plannerBusy = generating || saving || folderHydrating;
  const plannerActionBusy = generating || saving;
  const maxTripStartDate = useMemo(
    () => getMaxTripStartDate(form.durationDays),
    [form.durationDays]
  );

  const invalidateCurrentPlan = useCallback(() => {
    plannerRevisionRef.current += 1;
    setPlan(null);
    setIsPlanSaved(false);
  }, []);

  const updateForm = useCallback(
    (key, value) => {
      invalidateCurrentPlan();
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [invalidateCurrentPlan]
  );

  const handleCompanionChange = (value) => {
    if (plannerBusy) return;
    invalidateCurrentPlan();
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
    if (plannerBusy) return;
    const nextCount = Math.max(1, Number(value) || 1);
    if (form.companionType === '혼자' && nextCount > 1) {
      updateForm('peopleCount', 1);
      showToast('동행 유형이 혼자일 때는 2명 이상으로 설정할 수 없습니다.', 'info');
      return;
    }

    updateForm('peopleCount', Math.min(nextCount, 10));
  };

  const handleDurationDaysChange = (value) => {
    if (plannerBusy) return;
    const nextDays = normalizeDurationDays(value, normalizeDurationDays(form.durationDays));
    const nextEndDate = form.travelStartDate
      ? addDaysToDate(form.travelStartDate, nextDays - 1)
      : form.travelEndDate;

    if (form.travelStartDate && !isValidTripDate(nextEndDate)) {
      showToast('여행 종료일이 허용 범위를 넘습니다. 여행 기간 또는 시작일을 조정해주세요.');
      return;
    }

    invalidateCurrentPlan();
    setForm((prev) => ({
      ...prev,
      durationDays: nextDays,
      travelEndDate: nextEndDate,
    }));
  };

  const handleTripStartDateChange = (value) => {
    if (plannerBusy) return;
    if (!isValidTripDate(value)) {
      showToast('여행 시작일의 연도는 4자리로 입력해주세요.');
      return;
    }

    const nextDays = normalizeDurationDays(form.durationDays);
    const nextEndDate = value ? addDaysToDate(value, nextDays - 1) : '';
    if (value && !isValidTripDate(nextEndDate)) {
      showToast('여행 종료일이 허용 범위를 넘습니다. 여행 기간 또는 시작일을 조정해주세요.');
      return;
    }

    invalidateCurrentPlan();
    setForm((prev) => ({
      ...prev,
      durationDays: nextDays,
      travelStartDate: value,
      travelEndDate: nextEndDate,
    }));
  };

  const handleTripEndDateChange = (value) => {
    if (plannerBusy) return;
    if (!isValidTripDate(value)) {
      showToast('여행 종료일의 연도는 4자리로 입력해주세요.');
      return;
    }

    const nextDuration = getInclusiveDurationDays(form.travelStartDate, value);
    if (form.travelStartDate && value && !nextDuration) {
      showToast('종료일은 시작일보다 빠를 수 없습니다.');
      return;
    }
    if (nextDuration && nextDuration > MAX_DURATION_DAYS) {
      showToast(`AI 여행 플래너는 최대 ${MAX_DURATION_DAYS}일까지 생성할 수 있습니다.`);
      return;
    }

    invalidateCurrentPlan();
    setForm((prev) => ({
      ...prev,
      travelEndDate: value,
      ...(nextDuration ? { durationDays: nextDuration } : {}),
    }));
  };

  const handlePlanningModeChange = (mode) => {
    if (plannerBusy) return;
    setPlanningMode(mode);
    invalidateCurrentPlan();
    setSelectedContentIds(new Set());
    if (mode === PLAN_MODE.CUSTOM) {
      folderSelectionRequestRef.current += 1;
      setSelectedFolderId('');
    }
  };

  const handleFolderChange = useCallback(async (folderId) => {
    if (plannerActionBusy) return;
    const requestId = ++folderSelectionRequestRef.current;
    invalidateCurrentPlan();
    const folderSelectionRevision = plannerRevisionRef.current;
    setSelectedFolderId(folderId);
    const nextFolderPlaces = wishlistItems.filter((item) => folderId && String(item.folder_id) === String(folderId));
    const selectedFolder = folders.find((folder) => String(folder.id) === String(folderId));
    const folderSchedule = getNormalizedFolderSchedule(selectedFolder);

    setSelectedContentIds(new Set(nextFolderPlaces.map((item) => String(item.contentid || item.contentId))));
    setForm((prev) => ({
      ...prev,
      durationDays: folderSchedule.durationDays,
      travelStartDate: folderSchedule.travelStartDate,
      travelEndDate: folderSchedule.travelEndDate,
    }));
    if (folderSchedule.adjusted) {
      showToast(`선택한 폴더 일정은 AI 코스 생성 기준에 맞춰 유효한 1~${MAX_DURATION_DAYS}일 범위로 조정했습니다.`, 'info');
    }

    setFolderHydrating(true);
    try {
      let placesWithAddresses = nextFolderPlaces;
      try {
        placesWithAddresses = await hydratePlaceAddresses(nextFolderPlaces);
      } catch (err) {
        console.warn('Folder place address hydration failed:', err);
      }

      if (
        requestId !== folderSelectionRequestRef.current
        || folderSelectionRevision !== plannerRevisionRef.current
      ) {
        return;
      }

      const folderRegion = getFolderRegion(selectedFolder, placesWithAddresses);
      if (folderRegion) {
        setForm((prev) => ({ ...prev, regionName: folderRegion }));
      }
    } finally {
      if (
        requestId === folderSelectionRequestRef.current
        && folderSelectionRevision === plannerRevisionRef.current
      ) {
        setFolderHydrating(false);
      }
    }
  }, [folders, invalidateCurrentPlan, plannerActionBusy, showToast, wishlistItems]);

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
    if (plannerBusy || generationInFlightRef.current) {
      return;
    }

    if (!form.regionName.trim()) {
      showToast('여행 지역을 입력해주세요.');
      return;
    }

    if (form.companionType === '혼자' && Number(form.peopleCount) > 1) {
      updateForm('peopleCount', 1);
      showToast('동행 유형이 혼자일 때는 인원 수를 1명으로 설정해주세요.');
      return;
    }

    if (!isValidTripDate(form.travelStartDate) || !isValidTripDate(form.travelEndDate)) {
      showToast('여행 날짜는 YYYY-MM-DD 형식으로 입력해주세요.');
      return;
    }

    const hasTripStartDate = Boolean(form.travelStartDate);
    const hasTripEndDate = Boolean(form.travelEndDate);
    if (hasTripStartDate !== hasTripEndDate) {
      showToast('여행 시작일과 종료일을 모두 입력하거나 모두 비워주세요.');
      return;
    }

    const tripDuration = getInclusiveDurationDays(form.travelStartDate, form.travelEndDate);
    if (form.travelStartDate && form.travelEndDate && !tripDuration) {
      showToast('여행 종료일은 시작일보다 빠를 수 없습니다.');
      return;
    }

    if (tripDuration && tripDuration > MAX_DURATION_DAYS) {
      showToast(`AI 여행 플래너는 최대 ${MAX_DURATION_DAYS}일까지 생성할 수 있습니다.`);
      return;
    }

    const normalizedDurationDays = tripDuration || normalizeDurationDays(form.durationDays);

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

    generationInFlightRef.current = true;
    const generationRevision = ++plannerRevisionRef.current;
    setGenerating(true);
    setPlan(null);
    setIsPlanSaved(false);
    try {
      let preferredPlaces = selectedPlaces;

      if (planningMode === PLAN_MODE.CUSTOM) {
        const broadRegionCode = getBroadRegionTourCode(form.regionName.trim());
        const { items } = await getTravelList({
          keyword: broadRegionCode ? '' : form.regionName.trim(),
          regions: broadRegionCode ? [broadRegionCode] : [''],
          pageNo: 1,
          numOfRows: broadRegionCode ? 30 : 18,
          sort: 'default',
        });
        preferredPlaces = diversifyPreferredPlaces(
          items.map(normalizeTourCandidate).filter((item) => item.contentid),
          12
        );
      }

      const result = await generateTripPlan({
        ...form,
        planningMode,
        sourceFolderName: folders.find((folder) => String(folder.id) === String(selectedFolderId))?.name || '',
        regionName: form.regionName.trim(),
        durationDays: normalizedDurationDays,
        peopleCount: Number(form.peopleCount) || 1,
        totalBudgetLabel: getTotalBudgetLabel(form.budgetLevel, form.peopleCount),
        preferredPlaces,
      });
      if (generationRevision !== plannerRevisionRef.current) return;
      setPlan({
        ...result,
        generationContext: {
          planningMode,
          sourceFolderId: planningMode === PLAN_MODE.FOLDER ? selectedFolderId : null,
          regionName: form.regionName.trim(),
          durationDays: normalizedDurationDays,
          travelStartDate: form.travelStartDate || null,
          travelEndDate: form.travelEndDate || null,
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
      if (generationRevision !== plannerRevisionRef.current) return;
      console.error('CodeTrip trip generation failed:', error);
      showToast(error.message || 'CodeTrip이 여행 코스를 생성하지 못했습니다.');
    } finally {
      generationInFlightRef.current = false;
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!plan || saveInFlightRef.current || isPlanSaved) return;
    const saveRevision = plannerRevisionRef.current;
    const planToSave = plan;
    const targetFolderId = planningMode === PLAN_MODE.FOLDER ? selectedFolderId : null;
    saveInFlightRef.current = true;
    setSaving(true);
    try {
      const result = await saveAiTripToFolder(planToSave, {
        folderId: targetFolderId,
      });
      const isSamePlanTarget = (
        saveRevision === plannerRevisionRef.current
        && planToSave === plan
        && targetFolderId === (planningMode === PLAN_MODE.FOLDER ? selectedFolderId : null)
      );
      if (isSamePlanTarget) {
        setIsPlanSaved(true);
      }
      try {
        await syncWithServer();
      } catch (syncError) {
        console.error('AI trip sync failed after save:', syncError);
        showToast('CodeTrip 여행 코스는 저장했지만 목록 동기화에 실패했습니다. 새로고침 후 확인해주세요.');
        return;
      }
      if (result.savedPlaces > 0) {
        const documentOnlyMessage = result.documentOnlyPlaces > 0
          ? ` / 미검증 추천 장소 ${result.documentOnlyPlaces}개는 코스 문서에만 보관`
          : '';
        showToast(
          `CodeTrip 여행 코스를 "${result.folder.name}" 폴더로 저장했습니다.\n관광공사 검증 여행지 ${result.savedPlaces}개 / 체크리스트 ${result.savedChecklist}개 저장${documentOnlyMessage}`,
          'success'
        );
      } else {
        showToast(
          `CodeTrip 여행 코스를 "${result.folder.name}" 폴더로 저장했습니다.\n관광공사 미검증 추천 장소 ${result.documentOnlyPlaces}개는 코스 문서에만 보관했습니다.`,
          'success'
        );
      }
    } catch (error) {
      if (saveRevision !== plannerRevisionRef.current) return;
      console.error('Save AI trip failed:', error);
      showToast(error.message || 'CodeTrip 여행 코스를 저장하지 못했습니다.');
    } finally {
      saveInFlightRef.current = false;
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8 pb-24 md:pb-8">
      <PageHeader
        label="ai_trip.planner"
        title="AI 여행 플래너"
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
            <div className="grid grid-cols-1 gap-2 rounded-xl border border-outline-variant/30 bg-slate-50 p-1 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handlePlanningModeChange(PLAN_MODE.CUSTOM)}
                disabled={plannerBusy}
                className={`min-h-11 rounded-lg px-3 py-2 text-[11px] font-black leading-snug break-keep transition-all ${
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
                disabled={plannerBusy}
                className={`min-h-11 rounded-lg px-3 py-2 text-[11px] font-black leading-snug break-keep transition-all ${
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
                  disabled={plannerBusy}
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
                            disabled={plannerBusy}
                            onClick={() => setSelectedContentIds((prev) => {
                              invalidateCurrentPlan();
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
                disabled={plannerBusy}
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
                max={MAX_DURATION_DAYS}
                step="1"
                value={form.durationDays}
                onChange={(e) => handleDurationDaysChange(e.target.value)}
                disabled={plannerBusy}
                className="w-full h-11 px-3 rounded-lg border border-outline-variant/40 focus:border-primary focus:outline-none text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="ai-planner-travel-start-date">Travel Start</FieldLabel>
              <input
                id="ai-planner-travel-start-date"
                type="date"
                min={DATE_MIN}
                max={maxTripStartDate}
                value={form.travelStartDate}
                onChange={(e) => handleTripStartDateChange(e.target.value)}
                disabled={plannerBusy}
                className="w-full h-11 px-3 rounded-lg border border-outline-variant/40 focus:border-primary focus:outline-none text-sm"
              />
            </div>
            <div>
              <FieldLabel htmlFor="ai-planner-travel-end-date">Travel End</FieldLabel>
              <input
                id="ai-planner-travel-end-date"
                type="date"
                min={form.travelStartDate || DATE_MIN}
                max={DATE_MAX}
                value={form.travelEndDate}
                onChange={(e) => handleTripEndDateChange(e.target.value)}
                disabled={plannerBusy}
                className="w-full h-11 px-3 rounded-lg border border-outline-variant/40 focus:border-primary focus:outline-none text-sm"
              />
            </div>
            <p className="col-span-2 -mt-2 text-[10px] leading-4 text-slate-400">
              여행 날짜를 입력하면 저장 폴더의 일정에도 함께 반영됩니다.
              {form.travelStartDate && (
                <span className="block text-primary font-bold">
                  {form.travelStartDate} ~ {form.travelEndDate || '미정'} · {normalizeDurationDays(form.durationDays)}일 코스
                </span>
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Companion</FieldLabel>
              <select
                value={form.companionType}
                onChange={(e) => handleCompanionChange(e.target.value)}
                disabled={plannerBusy}
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
                disabled={plannerBusy}
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
                disabled={plannerBusy}
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
                disabled={plannerBusy}
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
                disabled={plannerBusy}
                className="w-full h-11 px-3 rounded-lg border border-outline-variant/40 focus:border-primary focus:outline-none text-sm"
              />
            </div>
            <div>
              <FieldLabel>End</FieldLabel>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => updateForm('endTime', e.target.value)}
                disabled={plannerBusy}
                className="w-full h-11 px-3 rounded-lg border border-outline-variant/40 focus:border-primary focus:outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <FieldLabel>Weather</FieldLabel>
            <input
              value={form.weatherKeyword}
              onChange={(e) => updateForm('weatherKeyword', e.target.value)}
              disabled={plannerBusy}
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
                  disabled={plannerBusy}
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
                  disabled={plannerBusy}
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
            disabled={plannerBusy}
            aria-busy={generating}
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
                  disabled={saving || isPlanSaved}
                  aria-busy={saving}
                  className="h-11 px-4 rounded-lg bg-slate-950 text-white text-xs font-black uppercase tracking-wider inline-flex items-center justify-center gap-2 hover:bg-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-base">{saving ? 'hourglass_top' : isPlanSaved ? 'check_circle' : 'save'}</span>
                  {saving ? 'Saving...' : isPlanSaved ? 'Saved' : 'Save Folder'}
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
                      {(day.items || []).map((item, index) => {
                        const sourceBadge = getPlanSourceBadge(item);

                        return (
                          <div key={`${day.day}-${item.order || index}`} className="p-4 grid grid-cols-[68px_1fr] gap-4">
                            <div className="text-xs font-black text-primary font-mono">{item.time || '--:--'}</div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-black text-slate-900">{item.placeName}</h4>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-bold">{item.category}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${sourceBadge.className}`}>
                                  {sourceBadge.label}
                                </span>
                              </div>
                              {item.address && <p className="text-xs text-slate-400 mt-1">{item.address}</p>}
                              <p className="text-sm text-slate-600 mt-3 leading-6">{item.reason}</p>
                              {item.tip && <p className="text-xs text-slate-400 mt-2 font-mono">// {item.tip}</p>}
                            </div>
                          </div>
                        );
                      })}
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
