const { initializeApp } = require('firebase-admin/app');
const { HttpsError, onCall } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');

initializeApp();

const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const GEMINI_MAX_RETRIES = 1;
const GEMINI_RETRY_BASE_DELAY_MS = 1000;
const GEMINI_REQUEST_TIMEOUT_MS = 20000;
const GEMINI_RESPONSE_BODY_TIMEOUT_MS = 10000;
const GEMINI_TOTAL_BUDGET_MS = 45000;
const REGION = 'asia-northeast3';
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const MAX_CONCURRENT_REQUESTS_PER_UID = 2;
const MAX_PREFERRED_PLACES = 12;
const MAX_TEXT_LENGTH = 120;
const MAX_DURATION_DAYS = 5;
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
  return Math.min(max, Math.max(min, parsed));
};

const parseLocalDate = (dateString) => {
  const [year, month, day] = String(dateString).slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
};

const sanitizeTripDate = (value, fieldName) => {
  const date = sanitizeString(value, '', 20);
  if (!date) return '';
  if (!DATE_PATTERN.test(date)) {
    throw new HttpsError('invalid-argument', `${fieldName} 형식이 올바르지 않습니다.`);
  }
  return date;
};

const getInclusiveDurationDays = (startDate, endDate) => {
  if (!startDate || !endDate) return null;
  const diffMs = parseLocalDate(endDate) - parseLocalDate(startDate);
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
  const dateDurationDays = getInclusiveDurationDays(travelStartDate, travelEndDate);
  if (travelStartDate && travelEndDate && !dateDurationDays) {
    throw new HttpsError('invalid-argument', '여행 종료일은 시작일보다 빠를 수 없습니다.');
  }
  if (dateDurationDays && dateDurationDays > MAX_DURATION_DAYS) {
    throw new HttpsError('invalid-argument', `AI 여행 코스는 최대 ${MAX_DURATION_DAYS}일까지 생성할 수 있습니다.`);
  }

  return {
    planningMode: sanitizeString(input.planningMode, 'custom', 20),
    sourceFolderName: sanitizeString(input.sourceFolderName, '', 80),
    regionName,
    durationDays: dateDurationDays || durationDays,
    travelStartDate,
    travelEndDate,
    travelStyle: sanitizeStringList(input.travelStyle, 10),
    companionType: sanitizeString(input.companionType, '미정', 30),
    peopleCount: sanitizeNumber(input.peopleCount, 1, 1, 10),
    budgetLevel: sanitizeString(input.budgetLevel, '보통', 20),
    totalBudgetLabel: sanitizeString(input.totalBudgetLabel, '미정', 80),
    pace: sanitizeString(input.pace, '보통', 20),
    weatherKeyword: sanitizeString(input.weatherKeyword, '', 80),
    startTime: sanitizeString(input.startTime, '10:00', 10),
    endTime: sanitizeString(input.endTime, '18:00', 10),
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
13. saveGuide에는 Firebase 위시리스트 폴더로 저장하기 좋은 folderName, memo, checklist를 포함하세요.

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
      const plan = validateTripPlan(parseGeminiJson(text));

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
