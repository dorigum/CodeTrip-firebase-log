const { initializeApp } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const { onValueWritten } = require('firebase-functions/v2/database');
const { HttpsError, onCall } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const { parseRecentTourApiItemsResponse } = require('./tourApiUpdates');
const { applyCompanionConsistency, applyTransportationChecklist } = require('./tripPlanChecklist');
const { isValidTripTime, isValidTripTimeRange } = require('./tripPlanTime');
const { dedupeTourApiItems } = require('./tourApiUpdates');
const { buildBoardPostNotification } = require('./boardPostNotifications');

initializeApp();

const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');
const TOUR_API_SERVICE_KEY = defineSecret('TOUR_API_SERVICE_KEY');
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const TOUR_API_BASE_URL = 'https://apis.data.go.kr/B551011/KorService2';
const GEMINI_MAX_RETRIES = 1;
const GEMINI_RETRY_BASE_DELAY_MS = 1000;
const GEMINI_REQUEST_TIMEOUT_MS = 20000;
const GEMINI_RESPONSE_BODY_TIMEOUT_MS = 10000;
const GEMINI_TOTAL_BUDGET_MS = 45000;
const REGION = 'asia-northeast3';
const DATABASE_INSTANCE = 'newagent-9c2a8';
const DATABASE_TRIGGER_REGION = 'us-central1';
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const MAX_CONCURRENT_REQUESTS_PER_UID = 2;
const MAX_PREFERRED_PLACES = 12;
const MAX_TEXT_LENGTH = 120;
const MAX_DURATION_DAYS = 5;
const TOUR_UPDATE_LOOKBACK_ROWS = 30;
const TOUR_UPDATE_RETENTION_LIMIT = 100;
const TOUR_API_MAX_RETRIES = 2;
const TOUR_API_RETRY_BASE_DELAY_MS = 1000;
const TOUR_API_REQUEST_TIMEOUT_MS = 15000;
const DATE_MIN = '1000-01-01';
const DATE_MAX = '9999-12-31';
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const requestBuckets = new Map();
const concurrentRequests = new Map();

const sleep = (delayMs) => new Promise((resolve) => {
  setTimeout(resolve, delayMs);
});

const isRetryableStatus = (status) => status === 408 || status >= 500;
const isRetryableFetchError = (error) => (
  error?.name === 'AbortError' || error instanceof TypeError
);

const sanitizeString = (value, fallback = '', maxLength = MAX_TEXT_LENGTH) => {
  const normalized = String(value || fallback).trim();
  return normalized.slice(0, maxLength);
};

const sanitizeStringList = (value, limit = 10) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => sanitizeString(item, '', 40))
    .filter(Boolean)
    .slice(0, limit);
};

const sanitizeNumber = (value, fallback, min, max) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
};

const parseTripDateParts = (dateString) => {
  if (!DATE_PATTERN.test(dateString)) return null;
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

const sanitizeTripDate = (value, fieldName) => {
  const date = sanitizeString(value, '', 20);
  if (!date) return '';
  if (!DATE_PATTERN.test(date) || date < DATE_MIN || date > DATE_MAX) {
    throw new HttpsError('invalid-argument', `${fieldName} 형식이 올바르지 않습니다.`);
  }

  const parts = parseTripDateParts(date);
  const parsedDate = parseLocalDate(date);
  const isRealCalendarDate = (
    parsedDate
    && parsedDate.getFullYear() === parts.year
    && parsedDate.getMonth() === parts.month - 1
    && parsedDate.getDate() === parts.day
  );
  if (!isRealCalendarDate) {
    throw new HttpsError('invalid-argument', `${fieldName} 형식이 올바르지 않습니다.`);
  }

  return date;
};

const sanitizeTripTime = (value, fieldName) => {
  const time = sanitizeString(value, '', 10);
  if (!isValidTripTime(time)) {
    throw new HttpsError('invalid-argument', `${fieldName} 형식이 올바르지 않습니다.`);
  }
  return time;
};

const getInclusiveDurationDays = (startDate, endDate) => {
  if (!startDate || !endDate) return null;
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  if (!start || !end) return null;
  const diffMs = end - start;
  if (diffMs < 0) return null;
  return Math.round(diffMs / 86400000) + 1;
};

const normalizePlace = (place = {}) => ({
  contentid: sanitizeString(place.contentid || place.contentId, '', 40) || null,
  title: sanitizeString(place.title || place.placeName, '여행지', 80),
  addr1: sanitizeString(place.addr1 || place.address, '', 120) || null,
  contenttypeid: sanitizeString(place.contenttypeid || place.contentTypeId, '', 20) || null,
});

const sanitizeInput = (input = {}) => {
  const regionName = sanitizeString(input.regionName, '', 80);
  if (!regionName) {
    throw new HttpsError('invalid-argument', '여행 지역을 입력해주세요.');
  }

  const durationDays = sanitizeNumber(input.durationDays, 1, 1, MAX_DURATION_DAYS);
  const travelStartDate = sanitizeTripDate(input.travelStartDate, '여행 시작일');
  const travelEndDate = sanitizeTripDate(input.travelEndDate, '여행 종료일');
  if (Boolean(travelStartDate) !== Boolean(travelEndDate)) {
    throw new HttpsError('invalid-argument', '여행 시작일과 종료일을 모두 입력하거나 모두 비워주세요.');
  }

  const dateDurationDays = getInclusiveDurationDays(travelStartDate, travelEndDate);
  if (travelStartDate && !dateDurationDays) {
    throw new HttpsError('invalid-argument', '여행 종료일은 시작일보다 빠를 수 없습니다.');
  }
  if (dateDurationDays && dateDurationDays > MAX_DURATION_DAYS) {
    throw new HttpsError('invalid-argument', `AI 여행 코스는 최대 ${MAX_DURATION_DAYS}일까지 생성할 수 있습니다.`);
  }

  const companionType = sanitizeString(input.companionType, '미정', 30);
  const minimumPeopleCount = companionType === '혼자' ? 1 : 2;
  const startTime = sanitizeTripTime(input.startTime || '10:00', '일정 시작 시간');
  const endTime = sanitizeTripTime(input.endTime || '18:00', '일정 종료 시간');
  if (!isValidTripTimeRange(startTime, endTime)) {
    throw new HttpsError('invalid-argument', '일정 종료 시간은 시작 시간보다 늦어야 합니다.');
  }

  return {
    planningMode: sanitizeString(input.planningMode, 'custom', 20),
    sourceFolderName: sanitizeString(input.sourceFolderName, '', 80),
    regionName,
    durationDays: dateDurationDays || durationDays,
    travelStartDate,
    travelEndDate,
    travelStyle: sanitizeStringList(input.travelStyle, 10),
    companionType,
    peopleCount: sanitizeNumber(input.peopleCount, minimumPeopleCount, minimumPeopleCount, 10),
    transportation: sanitizeString(input.transportation, '대중교통', 30),
    priorities: sanitizeStringList(input.priorities, 5),
    budgetLevel: sanitizeString(input.budgetLevel, '보통', 20),
    totalBudgetLabel: sanitizeString(input.totalBudgetLabel, '미정', 80),
    pace: sanitizeString(input.pace, '보통', 20),
    weatherKeyword: sanitizeString(input.weatherKeyword, '', 80),
    startTime,
    endTime,
    avoidKeywords: sanitizeStringList(input.avoidKeywords, 10),
    preferredPlaces: Array.isArray(input.preferredPlaces)
      ? input.preferredPlaces.map(normalizePlace).slice(0, MAX_PREFERRED_PLACES)
      : [],
  };
};

const BUDGET_GUIDE = {
  낮음: '1일 1인 3만 원 이하, 무료/저가 관광지와 가성비 식사 중심',
  보통: '1일 1인 3만~8만 원, 일반 입장료·식사·카페 포함',
  높음: '1일 1인 8만 원 이상, 유료 전시·체험·분위기 좋은 식당/카페 포함',
};

const SYSTEM_PROMPT = `당신은 한국 여행 코스를 설계하는 여행 큐레이션 어시스턴트입니다.
사용자의 지역, 일정, 취향, 날씨, 동행 유형, 선택한 여행지 후보를 바탕으로 현실적인 여행 코스를 생성합니다.
반드시 유효한 JSON만 반환해야 합니다.
Markdown, 코드블록, 설명 문장, 주석은 반환하지 않습니다.`;

const toListText = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean).join(', ') || '없음';
  return value || '없음';
};

const getRegionDiversityGuide = (regionName = '') => {
  const region = String(regionName || '').trim();
  if (['서울', '서울특별시'].includes(region)) {
    return [
      '서울처럼 넓은 시 단위 지역이 입력되면 특정 구에 고정하지 마세요.',
      '성북구/성북동만 반복하지 말고, 사용자의 취향과 날씨에 맞춰 종로구, 중구, 마포구, 용산구, 성동구, 서대문구, 송파구, 강남구, 영등포구 등 여러 구를 후보로 고려하세요.',
      '단, 하루 일정의 이동 부담이 커지지 않도록 실제 코스는 인접한 1~3개 권역 안에서 자연스럽게 묶어주세요.',
      'title, summary, day theme에는 특정 구 이름을 단정적으로 반복하기보다 서울의 코스 성격이 드러나게 작성하세요.',
    ].join('\n');
  }

  return [
    '시/도 단위처럼 넓은 지역이 입력되면 특정 동네 하나에만 고정하지 말고, 후보 장소의 주소를 참고해 여러 시군구 또는 권역을 함께 고려하세요.',
    '다만 실제 하루 코스는 이동 부담이 과하지 않도록 가까운 장소끼리 묶어주세요.',
  ].join('\n');
};

const buildTripPrompt = (input) => `${SYSTEM_PROMPT}

다음 조건을 바탕으로 한국 여행 코스를 생성해주세요.

[사용자 조건]
- 생성 방식: ${input.planningMode === 'folder' ? '위시리스트 폴더 기반' : '조건 기반 새 코스'}
- 기준 폴더: ${input.sourceFolderName || '없음'}
- 지역: ${input.regionName || '미정'}
- 여행 일수: ${input.durationDays || 1}일
- 여행 시작일: ${input.travelStartDate || '미정'}
- 여행 종료일: ${input.travelEndDate || '미정'}
- 여행 스타일: ${toListText(input.travelStyle)}
- 동행 유형: ${input.companionType || '미정'}
- 인원 수: ${input.peopleCount || 1}명
- 이동수단: ${input.transportation || '대중교통'}
- 여행 우선순위: ${toListText(input.priorities)}
- 예산 수준: ${input.budgetLevel || '보통'}
- 예산 기준: ${BUDGET_GUIDE[input.budgetLevel] || BUDGET_GUIDE.보통}
- 예상 총예산 범위: ${input.totalBudgetLabel || '미정'}
- 이동 강도: ${input.pace || '보통'}
- 날씨 키워드: ${input.weatherKeyword || '없음'}
- 시작 시간: ${input.startTime || '10:00'}
- 종료 시간: ${input.endTime || '18:00'}
- 피하고 싶은 조건: ${toListText(input.avoidKeywords)}

[사용자가 선택한 여행지 후보]
${JSON.stringify(input.preferredPlaces, null, 2)}

[지역 분산 및 권역 선택 규칙]
${getRegionDiversityGuide(input.regionName)}

[응답 규칙]
1. 반드시 JSON만 반환하세요.
2. Markdown 코드블록을 사용하지 마세요.
3. JSON 외의 설명 문장을 추가하지 마세요.
4. preferredPlaces에 포함된 장소는 관광공사 API 또는 사용자의 위시리스트에 연결된 장소입니다. 가능한 한 이 장소들을 주요 방문지로 우선 사용하세요.
5. preferredPlaces의 contentid는 응답의 contentId에 그대로 넣어주세요.
6. contentid가 없는 장소를 새로 제안할 경우 contentId는 null로 작성하세요.
7. 생성 방식이 위시리스트 폴더 기반이면 preferredPlaces를 주요 방문지로 우선 배치하고, 필요한 식사/카페/보조 장소만 추가하세요.
8. 생성 방식이 조건 기반 새 코스이고 preferredPlaces가 있다면, preferredPlaces만으로 일정 구성이 부족할 때만 contentId가 null인 장소를 추가 제안하세요.
9. 하루 일정은 시간 순서대로 작성하세요.
10. 이동이 과도하게 많지 않도록 같은 지역 중심으로 구성하세요.
11. 날씨 키워드가 있으면 실내/실외 비중에 반영하세요.
12. 예산은 1일 1인 기준과 예상 총예산 범위를 함께 고려하여 식사, 카페, 유료 체험 수준을 조절하세요.
13. 비·폭염·한파 등 날씨 키워드는 실내/실외 비중과 대체 장소에 반영하세요.
14. 아이·부모님 동반은 이동 구간과 일정 수를 줄이고 휴식 시간을 포함하세요. 친구·연인은 선택한 여행 스타일과 체험·식사 비중을 우선하세요.
15. 대중교통은 환승과 장거리 이동을 줄이고, 자차는 주차·접근성을 고려하세요. 도보는 가까운 권역에 집중하세요.
16. 여행 우선순위(예산, 휴식, 맛집, 체험, 사진, 문화)는 장소 선정과 일정 배치의 충돌 시 우선 반영하세요.
17. saveGuide에는 Firebase 위시리스트 폴더로 저장하기 좋은 folderName, memo, checklist를 포함하세요.
18. checklist의 이동 준비 항목은 선택한 이동수단에 정확히 맞춰 작성하세요. 대중교통은 교통카드·환승 경로·배차 간격, 자차는 주차 가능 여부·주차 요금·도로 혼잡 구간, 도보는 이동 거리·경사·편한 신발을 확인합니다. 자차 또는 도보 코스에는 배차·환승·교통카드 항목을 넣지 마세요.
19. 동행 유형은 제목, 요약, 태그, 일정 테마, 추천 이유와 팁에 일관되게 반영하세요. 동행 유형이 혼자이면 친구·연인·가족과 함께라는 표현을 절대 사용하지 말고 혼자 여행에 맞는 표현만 사용하세요.
20. 동행 유형이 혼자가 아니면 인원 수는 본인을 포함해 최소 2명입니다. 인원 수와 동행 유형이 충돌하지 않게 일정 규모와 예산을 제안하세요.

[응답 JSON 스키마]
{
  "title": "string",
  "summary": "string",
  "regionName": "string",
  "durationDays": number,
  "tags": ["string"],
  "days": [
    {
      "day": number,
      "theme": "string",
      "items": [
        {
          "order": number,
          "time": "HH:mm",
          "placeName": "string",
          "contentId": "string 또는 null",
          "address": "string 또는 null",
          "duration": "string",
          "category": "string",
          "reason": "string",
          "tip": "string"
        }
      ]
    }
  ],
  "saveGuide": {
    "folderName": "string",
    "memo": "string",
    "checklist": ["string"]
  },
  "warnings": ["string"]
}`;

const stripJsonFence = (text) => text
  .trim()
  .replace(/^```json\s*/i, '')
  .replace(/^```\s*/i, '')
  .replace(/```$/i, '')
  .trim();

const parseGeminiJson = (text) => {
  const cleaned = stripJsonFence(text || '');
  try {
    return JSON.parse(cleaned);
  } catch {
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first >= 0 && last > first) {
      return JSON.parse(cleaned.slice(first, last + 1));
    }
    throw new HttpsError('internal', 'AI 코스 응답을 해석하지 못했습니다.');
  }
};

const validateTripPlan = (plan) => {
  if (!plan || typeof plan !== 'object') throw new HttpsError('internal', 'AI 코스 응답이 비어 있습니다.');
  if (!plan.title || typeof plan.title !== 'string') throw new HttpsError('internal', 'AI 코스 제목이 없습니다.');
  if (!Array.isArray(plan.days) || plan.days.length === 0) throw new HttpsError('internal', 'AI 코스 일정이 없습니다.');
  if (!plan.saveGuide?.folderName) throw new HttpsError('internal', '저장용 폴더명이 없습니다.');

  plan.days.forEach((day) => {
    if (!Array.isArray(day.items)) throw new HttpsError('internal', '일정 항목 구조가 올바르지 않습니다.');
  });

  return plan;
};

const readResponseJson = async (response) => {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new HttpsError('deadline-exceeded', 'AI 코스 응답 읽기 시간이 초과되었습니다.'));
    }, GEMINI_RESPONSE_BODY_TIMEOUT_MS);
  });

  try {
    return await Promise.race([response.json(), timeout]);
  } finally {
    clearTimeout(timeoutId);
  }
};

const createGeminiError = (response) => {
  logger.warn('Gemini request failed', {
    status: response.status,
    statusText: response.statusText,
  });

  if (response.status === 429) {
    return new HttpsError('resource-exhausted', 'AI 코스 생성 한도를 초과했습니다.');
  }

  if (response.status === 400) {
    return new HttpsError('invalid-argument', 'AI 코스 요청 형식이 올바르지 않습니다.');
  }

  if (response.status === 401 || response.status === 403) {
    return new HttpsError('permission-denied', 'AI 코스 생성 권한을 확인해주세요.');
  }

  if (response.status >= 500) {
    return new HttpsError('unavailable', 'AI 코스 생성 서버가 혼잡합니다.');
  }

  return new HttpsError('internal', 'AI 코스 생성 요청에 실패했습니다.');
};

const fetchGeminiWithRetry = async (payload) => {
  const deadline = Date.now() + GEMINI_TOTAL_BUDGET_MS;

  for (let attempt = 0; attempt <= GEMINI_MAX_RETRIES; attempt += 1) {
    const remainingBudget = deadline - Date.now();
    if (remainingBudget <= 0) {
      throw new HttpsError('deadline-exceeded', 'AI 코스 생성 응답 시간이 초과되었습니다.');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, Math.min(GEMINI_REQUEST_TIMEOUT_MS, remainingBudget));

    try {
      const response = await fetch(GEMINI_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY.value(),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (response.ok || !isRetryableStatus(response.status) || attempt === GEMINI_MAX_RETRIES) {
        return response;
      }

      await response.body?.cancel().catch(() => {});
    } catch (error) {
      if (!isRetryableFetchError(error) || attempt === GEMINI_MAX_RETRIES) {
        if (error?.name === 'AbortError') {
          throw new HttpsError('deadline-exceeded', 'AI 코스 생성 응답 시간이 초과되었습니다.');
        }
        throw new HttpsError('unavailable', 'AI 코스 생성 서버에 연결하지 못했습니다.');
      }
    } finally {
      clearTimeout(timeoutId);
    }

    const exponentialDelay = GEMINI_RETRY_BASE_DELAY_MS * (2 ** attempt);
    const jitter = Math.floor(Math.random() * 250);
    const retryDelay = exponentialDelay + jitter;
    const nextAttemptMinimumBudget = retryDelay + Math.min(GEMINI_REQUEST_TIMEOUT_MS, GEMINI_TOTAL_BUDGET_MS);

    if (deadline - Date.now() < nextAttemptMinimumBudget) {
      throw new HttpsError('deadline-exceeded', 'AI 코스 생성 응답 시간이 초과되었습니다.');
    }

    await sleep(retryDelay);
  }

  throw new HttpsError('internal', 'AI 코스 재시도 처리 중 오류가 발생했습니다.');
};

const assertQuota = (uid) => {
  const now = Date.now();
  if (requestBuckets.size > 1000) {
    requestBuckets.forEach((entry, key) => {
      if (now >= entry.resetAt) requestBuckets.delete(key);
    });
  }

  const bucket = requestBuckets.get(uid) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  if (now >= bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }

  if (bucket.count >= RATE_LIMIT_MAX_REQUESTS) {
    throw new HttpsError('resource-exhausted', 'AI 코스 생성 요청 한도를 초과했습니다.');
  }

  bucket.count += 1;
  requestBuckets.set(uid, bucket);
};

const enterConcurrentRequest = (uid) => {
  const current = concurrentRequests.get(uid) || 0;
  if (current >= MAX_CONCURRENT_REQUESTS_PER_UID) {
    throw new HttpsError('resource-exhausted', '동시에 처리 중인 AI 코스 생성 요청이 많습니다.');
  }
  concurrentRequests.set(uid, current + 1);
};

const leaveConcurrentRequest = (uid) => {
  const current = concurrentRequests.get(uid) || 0;
  if (current <= 1) {
    concurrentRequests.delete(uid);
    return;
  }
  concurrentRequests.set(uid, current - 1);
};

const getBoardPostUpdatedAt = (post) => (
  typeof post.updated_at === 'string' && post.updated_at.trim() !== ''
    ? post.updated_at
    : post.created_at
);

const createBoardPostSummary = (post) => ({
  user_id: post.user_id,
  nickname: post.nickname,
  title: post.title,
  content_preview: String(post.content || '').replace(/\s+/g, ' ').trim().slice(0, 240),
  tags: post.tags || [],
  view_count: Number(post.view_count || 0),
  created_at: post.created_at,
  updated_at: getBoardPostUpdatedAt(post),
});

const hasBoardPostSummaryFields = (post) => (
  typeof post?.user_id === 'string' && post.user_id.trim() !== ''
  && typeof post?.nickname === 'string' && post.nickname.trim() !== ''
  && typeof post?.title === 'string' && post.title.trim() !== ''
  && typeof post?.created_at === 'string' && post.created_at.trim() !== ''
);

exports.syncBoardPostSummary = onValueWritten(
  { ref: '/boardPosts/{postId}', region: DATABASE_TRIGGER_REGION, instance: DATABASE_INSTANCE },
  async (event) => {
    const summaryRef = getDatabase().ref(`boardPostSummaries/${event.params.postId}`);

    if (!event.data.after.exists()) {
      return summaryRef.remove();
    }

    const post = event.data.after.val();
    if (!hasBoardPostSummaryFields(post)) {
      logger.warn('Skipping invalid board post summary', { postId: event.params.postId });
      return summaryRef.remove();
    }

    return summaryRef.set(createBoardPostSummary(post));
  }
);

const createBoardPostOwnerNotification = async ({ postId, actorId, actorNickname, interaction, commentBody, notificationId }) => {
  const db = getDatabase();
  const postSnapshot = await db.ref(`boardPosts/${postId}`).once('value');
  if (!postSnapshot.exists()) return null;

  const notification = buildBoardPostNotification({
    postOwnerId: postSnapshot.child('user_id').val(),
    actorId,
    actorNickname,
    interaction,
    postId,
    commentBody,
    createdAt: new Date().toISOString(),
  });
  if (!notification) return null;

  await db.ref(`users/${notification.user_id}/notifications/${notificationId}`).set(notification);
  logger.info('Created board post interaction notification', { postId, actorId, interaction });
  return null;
};

exports.notifyBoardPostComment = onValueWritten(
  { ref: '/boardComments/{commentId}', region: DATABASE_TRIGGER_REGION, instance: DATABASE_INSTANCE },
  async (event) => {
    if (event.data.before.exists() || !event.data.after.exists()) return null;

    const comment = event.data.after.val() || {};
    const postId = String(comment.post_id || '').trim();
    const actorId = String(comment.user_id || '').trim();
    if (!postId || !actorId) return null;

    return createBoardPostOwnerNotification({
      postId,
      actorId,
      actorNickname: comment.nickname,
      interaction: 'comment',
      notificationId: `board-comment-${event.params.commentId}`,
    });
  },
);

exports.notifyBoardCommentLike = onValueWritten(
  { ref: '/likes/boardComments/{commentId}/{actorId}', region: DATABASE_TRIGGER_REGION, instance: DATABASE_INSTANCE },
  async (event) => {
    if (event.data.before.val() === true || event.data.after.val() !== true) return null;

    const db = getDatabase();
    const [commentSnapshot, userSnapshot] = await Promise.all([
      db.ref(`boardComments/${event.params.commentId}`).once('value'),
      db.ref(`users/${event.params.actorId}`).once('value'),
    ]);
    if (!commentSnapshot.exists()) return null;

    const comment = commentSnapshot.val() || {};
    const postId = String(comment.post_id || '').trim();
    const notification = buildBoardPostNotification({
      postOwnerId: comment.user_id,
      actorId: event.params.actorId,
      actorNickname: userSnapshot.child('name').val() || userSnapshot.child('nickname').val(),
      interaction: 'comment_like',
      postId,
      commentBody: comment.body,
      createdAt: new Date().toISOString(),
    });
    if (!postId || !notification) return null;

    await db.ref(`users/${notification.user_id}/notifications/board-comment-like-${event.params.commentId}-${event.params.actorId}`).set(notification);
    logger.info('Created board comment like notification', { commentId: event.params.commentId, actorId: event.params.actorId });
    return null;
  },
);

exports.notifyBoardPostLike = onValueWritten(
  { ref: '/likes/boardPosts/{postId}/{actorId}', region: DATABASE_TRIGGER_REGION, instance: DATABASE_INSTANCE },
  async (event) => {
    if (event.data.before.val() === true || event.data.after.val() !== true) return null;

    const db = getDatabase();
    const userSnapshot = await db.ref(`users/${event.params.actorId}`).once('value');
    return createBoardPostOwnerNotification({
      postId: event.params.postId,
      actorId: event.params.actorId,
      actorNickname: userSnapshot.child('name').val() || userSnapshot.child('nickname').val(),
      interaction: 'like',
      notificationId: `board-post-like-${event.params.postId}-${event.params.actorId}`,
    });
  },
);

const buildTourApiUrl = (endpoint, extraParams = {}) => {
  const params = new URLSearchParams({
    serviceKey: decodeURIComponent(TOUR_API_SERVICE_KEY.value() || ''),
    MobileOS: 'ETC',
    MobileApp: 'CodeTrip',
    _type: 'json',
    arrange: 'R',
    pageNo: '1',
    numOfRows: String(TOUR_UPDATE_LOOKBACK_ROWS),
    ...extraParams,
  });

  return `${TOUR_API_BASE_URL}/${endpoint}?${params.toString()}`;
};

const fetchTourApiItems = async (endpoint, extraParams = {}) => {
  const url = buildTourApiUrl(endpoint, extraParams);
  let response;

  for (let attempt = 0; attempt <= TOUR_API_MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TOUR_API_REQUEST_TIMEOUT_MS);

    try {
      response = await fetch(url, { signal: controller.signal });
      if (response.ok) {
        const data = await response.json();
        return parseRecentTourApiItemsResponse(data, logger);
      }
      if (!isRetryableStatus(response.status) || attempt === TOUR_API_MAX_RETRIES) {
        break;
      }

      logger.warn('TourAPI update sync received retryable response', {
        attempt: attempt + 1,
        status: response.status,
        statusText: response.statusText,
      });
      await response.body?.cancel().catch(() => {});
    } catch (error) {
      const isLastAttempt = attempt === TOUR_API_MAX_RETRIES;
      logger.warn('TourAPI update request failed', {
        attempt: attempt + 1,
        retrying: !isLastAttempt && isRetryableFetchError(error),
        errorName: error?.name,
        errorMessage: error?.message,
        causeCode: error?.cause?.code,
        causeMessage: error?.cause?.message,
      });

      if (!isRetryableFetchError(error) || isLastAttempt) {
        if (!isRetryableFetchError(error)) throw error;
        throw new Error('TourAPI 신규 여행지 서버에 연결하지 못했습니다.', { cause: error });
      }
    } finally {
      clearTimeout(timeoutId);
    }

    await sleep(TOUR_API_RETRY_BASE_DELAY_MS * (attempt + 1));
  }

  if (!response) {
    throw new Error('TourAPI 신규 여행지 서버에 연결하지 못했습니다.');
  }

  if (!response.ok) {
    logger.warn('TourAPI update sync failed', {
      status: response.status,
      statusText: response.statusText,
    });
    throw new Error('TourAPI 신규 여행지 조회에 실패했습니다.');
  }

};

const fetchRecentTourApiItems = async () => fetchTourApiItems('areaBasedList2');

const fetchRecentTourApiFestivalItems = async () => {
  const year = new Date().getFullYear();
  return fetchTourApiItems('searchFestival2', { eventStartDate: `${year}0101` });
};

const readExistingTourApiUpdates = async (itemsRef) => {
  const snapshot = await itemsRef.once('value');
  const items = [];
  snapshot.forEach((child) => {
    items.push({
      key: child.key,
      detectedAt: child.child('detectedAt').val() || '',
      areaCode: child.child('areaCode').val() || '',
    });
  });
  return items;
};

const buildTourApiUpdateCleanup = (items) => {
  return items
    .sort((a, b) => String(b.detectedAt).localeCompare(String(a.detectedAt)))
    .slice(TOUR_UPDATE_RETENTION_LIMIT)
    .reduce((updates, item) => {
      updates[`tourApiUpdates/items/${item.key}`] = null;
      return updates;
    }, {});
};

exports.generateTripPlan = onCall(
  {
    region: REGION,
    secrets: [GEMINI_API_KEY],
    timeoutSeconds: 60,
    memory: '512MiB',
    maxInstances: 10,
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const uid = request.auth.uid;
    assertQuota(uid);
    enterConcurrentRequest(uid);

    try {
      const input = sanitizeInput(request.data);
      const response = await fetchGeminiWithRetry({
        contents: [
          {
            role: 'user',
            parts: [{ text: buildTripPrompt(input) }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });

      if (!response.ok) {
        throw createGeminiError(response);
      }

      const data = await readResponseJson(response);
      const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
      let plan = validateTripPlan(parseGeminiJson(text));
      plan.saveGuide.checklist = applyTransportationChecklist(
        plan.saveGuide.checklist,
        input.transportation
      );
      plan = applyCompanionConsistency(plan, input.companionType);

      logger.info('Gemini trip plan generated', {
        uid,
        durationDays: input.durationDays,
        preferredPlaces: input.preferredPlaces.length,
      });

      return plan;
    } finally {
      leaveConcurrentRequest(uid);
    }
  }
);

exports.syncTourApiUpdates = onSchedule(
  {
    region: REGION,
    schedule: 'every 24 hours',
    timeZone: 'Asia/Seoul',
    secrets: [TOUR_API_SERVICE_KEY],
    timeoutSeconds: 60,
    memory: '256MiB',
    maxInstances: 1,
  },
  async () => {
    const db = getDatabase();
    const itemsRef = db.ref('tourApiUpdates/items');
    const now = new Date().toISOString();
    const [recentDestinationItems, recentFestivalItems, existingItems] = await Promise.all([
      fetchRecentTourApiItems(),
      fetchRecentTourApiFestivalItems(),
      readExistingTourApiUpdates(itemsRef),
    ]);
    const recentItems = dedupeTourApiItems([
      ...recentFestivalItems.map((item) => ({ ...item, source: 'KorService2.searchFestival2' })),
      ...recentDestinationItems.map((item) => ({ ...item, source: 'KorService2.areaBasedList2' })),
    ]);
    const existingItemsById = new Map(existingItems.map((item) => [item.key, item]));
    const nextItemsForRetention = [...existingItems];
    const updates = {
      'tourApiUpdates/state/lastRunAt': now,
      'tourApiUpdates/state/source': 'KorService2.areaBasedList2, KorService2.searchFestival2',
    };
    let newItemCount = 0;
    let backfilledAreaCodeCount = 0;

    recentItems.forEach((item) => {
      const existingItem = existingItemsById.get(item.contentId);
      if (existingItem) {
        if (item.areaCode && String(existingItem.areaCode) !== item.areaCode) {
          updates[`tourApiUpdates/items/${item.contentId}/areaCode`] = item.areaCode;
          backfilledAreaCodeCount += 1;
        }
        return;
      }

      newItemCount += 1;
      nextItemsForRetention.push({ key: item.contentId, detectedAt: now });
      updates[`tourApiUpdates/items/${item.contentId}`] = {
        ...item,
        detectedAt: now,
      };
    });

    Object.assign(updates, buildTourApiUpdateCleanup(nextItemsForRetention));
    updates['tourApiUpdates/state/lastSuccessAt'] = now;
    updates['tourApiUpdates/state/lastNewItemCount'] = newItemCount;
    await db.ref().update(updates);

    logger.info('TourAPI update sync completed', {
      checkedCount: recentItems.length,
      checkedFestivalCount: recentFestivalItems.length,
      newItemCount,
      backfilledAreaCodeCount,
    });
  }
);
