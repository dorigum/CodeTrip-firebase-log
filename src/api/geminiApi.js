const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT = `당신은 한국 여행 코스를 설계하는 여행 큐레이션 어시스턴트입니다.
사용자의 지역, 일정, 취향, 날씨, 동행 유형, 선택한 여행지 후보를 바탕으로 현실적인 여행 코스를 생성합니다.
반드시 유효한 JSON만 반환해야 합니다.
Markdown, 코드블록, 설명 문장, 주석은 반환하지 않습니다.`;

const toListText = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean).join(', ') || '없음';
  return value || '없음';
};

const BUDGET_GUIDE = {
  낮음: '1일 1인 3만 원 이하, 무료/저가 관광지와 가성비 식사 중심',
  보통: '1일 1인 3만~8만 원, 일반 입장료·식사·카페 포함',
  높음: '1일 1인 8만 원 이상, 유료 전시·체험·분위기 좋은 식당/카페 포함',
};

const normalizePlace = (place) => ({
  contentid: place.contentid || place.contentId || null,
  title: place.title || place.placeName || '여행지',
  addr1: place.addr1 || place.address || null,
  contenttypeid: place.contenttypeid || place.contentTypeId || null,
});

export const buildTripPrompt = (input) => {
  const preferredPlaces = (input.preferredPlaces || []).map(normalizePlace).slice(0, 12);

  return `${SYSTEM_PROMPT}

다음 조건을 바탕으로 한국 여행 코스를 생성해주세요.

[사용자 조건]
- 생성 방식: ${input.planningMode === 'folder' ? '위시리스트 폴더 기반' : '조건 기반 새 코스'}
- 기준 폴더: ${input.sourceFolderName || '없음'}
- 지역: ${input.regionName || '미정'}
- 여행 일수: ${input.durationDays || 1}일
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
${JSON.stringify(preferredPlaces, null, 2)}

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
};

const stripJsonFence = (text) => text
  .trim()
  .replace(/^```json\s*/i, '')
  .replace(/^```\s*/i, '')
  .replace(/```$/i, '')
  .trim();

export const parseGeminiJson = (text) => {
  const cleaned = stripJsonFence(text || '');
  try {
    return JSON.parse(cleaned);
  } catch {
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first >= 0 && last > first) {
      return JSON.parse(cleaned.slice(first, last + 1));
    }
    throw new Error('CodeTrip 여행 코스 응답을 해석하지 못했습니다.');
  }
};

export const validateTripPlan = (plan) => {
  if (!plan || typeof plan !== 'object') throw new Error('AI 코스 응답이 비어 있습니다.');
  if (!plan.title || typeof plan.title !== 'string') throw new Error('AI 코스 제목이 없습니다.');
  if (!Array.isArray(plan.days) || plan.days.length === 0) throw new Error('AI 코스 일정이 없습니다.');
  if (!plan.saveGuide?.folderName) throw new Error('저장용 폴더명이 없습니다.');

  plan.days.forEach((day) => {
    if (!Array.isArray(day.items)) throw new Error('일정 항목 구조가 올바르지 않습니다.');
  });

  return plan;
};

const createGeminiError = async (response) => {
  let payload = null;
  let rawMessage = '';
  try {
    payload = await response.json();
    rawMessage = payload?.error?.message || '';
  } catch {
    rawMessage = await response.text();
  }

  console.error('Gemini API error detail:', {
    status: response.status,
    statusText: response.statusText,
    payload,
    rawMessage,
  });

  if (response.status === 429) {
    return new Error('CodeTrip 여행 코스 생성 한도를 초과했거나 현재 프로젝트에서 사용할 수 있는 할당량이 없습니다. 잠시 후 다시 시도하거나 설정을 확인해주세요.');
  }

  if (response.status === 400) {
    return new Error('CodeTrip 여행 코스 요청 형식이 올바르지 않습니다. 입력 조건을 조금 단순하게 다시 시도해주세요.');
  }

  if (response.status === 401 || response.status === 403) {
    return new Error('CodeTrip 여행 코스 생성 권한을 확인해주세요. API 키, 프로젝트, 사용 설정 점검이 필요합니다.');
  }

  if (response.status >= 500) {
    return new Error('CodeTrip 여행 코스 생성 서버가 혼잡합니다. 잠시 후 다시 시도해주세요.');
  }

  return new Error(`CodeTrip 여행 코스 생성 요청에 실패했습니다. 상태 코드: ${response.status}`);
};

export const generateTripPlan = async (input) => {
  if (!GEMINI_API_KEY) {
    throw new Error('VITE_GEMINI_API_KEY가 설정되어 있지 않습니다.');
  }

  const response = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: buildTripPrompt(input) }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    throw await createGeminiError(response);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
  return validateTripPlan(parseGeminiJson(text));
};
