# Gemini 프롬프트 설계

작성일: 2026.07.21  
작업 브랜치 예정: `feature/gemini`  
대상 기능: Gemini API 기반 AI 여행 코스 생성

---

## 1. 작업 목적

CodeTrip의 기존 기능은 공공데이터 API 기반 여행지 탐색, 날씨 추천, 위시리스트, 여행 폴더, 게시판 기능을 중심으로 구성되어 있습니다.

Gemini API를 추가하는 목적은 단순 추천 목록을 넘어서, 사용자의 조건과 저장된 여행지 정보를 바탕으로 실제 여행 일정에 가까운 코스를 생성하는 것입니다.

핵심 차별점:

```text
공공데이터 API로 여행지 후보를 확보하고,
사용자 선호 지역과 날씨 정보를 반영한 뒤,
Gemini가 개인화된 여행 코스를 생성하고,
생성 결과를 위시리스트 폴더로 저장할 수 있게 한다.
```

---

## 2. 1차 구현 범위

1차 구현은 기능을 과하게 넓히지 않고, 공모전 제출 시 보여주기 좋은 핵심 흐름에 집중합니다.

포함 범위:

```text
AI 여행 코스 생성
사용자 입력 기반 프롬프트 구성
Gemini 응답 JSON 구조 고정
생성 결과 화면 표시
생성 결과를 위시리스트 폴더로 저장
README 및 Firebase 수정 로그 문서화
```

제외 또는 후순위:

```text
실시간 지도 동선 최적화
교통수단별 정확한 이동 시간 계산
예약/결제 연동
다중 사용자 공유 일정 편집
Cloud Functions 기반 보안 프록시
```

---

## 3. 사용자 흐름

```text
1. 사용자가 AI 코스 생성 화면에 진입
2. 지역, 일정, 여행 스타일, 동행 유형, 예산, 이동 강도 등을 입력
3. 선택 사항으로 위시리스트 또는 검색된 여행지 후보를 포함
4. Gemini API 요청
5. JSON 응답을 검증하고 화면에 코스 형태로 표시
6. 사용자가 마음에 들면 위시리스트 폴더로 저장
7. 저장된 폴더에서 메모/체크리스트와 함께 관리
```

---

## 4. 입력값 설계

### 필수 입력

| 필드 | 타입 | 설명 | 예시 |
| --- | --- | --- | --- |
| `regionName` | string | 여행 지역명 | `서울` |
| `durationDays` | number | 여행 일수 | `1` |
| `travelStyle` | string[] | 여행 스타일 | `["실내", "문화", "맛집"]` |
| `companionType` | string | 동행 유형 | `혼자`, `연인`, `가족`, `친구` |

### 선택 입력

| 필드 | 타입 | 설명 | 예시 |
| --- | --- | --- | --- |
| `budgetLevel` | string | 예산 수준 | `낮음`, `보통`, `높음` |
| `pace` | string | 이동 강도 | `여유`, `보통`, `알참` |
| `weatherKeyword` | string | 날씨 키워드 | `비`, `맑음`, `더움` |
| `startTime` | string | 시작 시간 | `10:00` |
| `endTime` | string | 종료 시간 | `18:00` |
| `preferredPlaces` | array | 사용자가 선택한 여행지 후보 | TourAPI item 배열 |
| `avoidKeywords` | string[] | 피하고 싶은 조건 | `["등산", "장거리 이동"]` |

### 프론트엔드 입력 객체 예시

```json
{
  "regionName": "서울",
  "durationDays": 1,
  "travelStyle": ["실내", "문화", "맛집"],
  "companionType": "친구",
  "budgetLevel": "보통",
  "pace": "여유",
  "weatherKeyword": "비",
  "startTime": "10:00",
  "endTime": "18:00",
  "preferredPlaces": [
    {
      "contentid": "126508",
      "title": "국립중앙박물관",
      "addr1": "서울특별시 용산구 서빙고로 137",
      "contenttypeid": "14",
      "firstimage": "https://..."
    }
  ],
  "avoidKeywords": ["장거리 이동"]
}
```

---

## 5. 응답 JSON 구조

Gemini 응답은 화면 렌더링과 Firebase 저장을 쉽게 하기 위해 반드시 JSON 형태로 고정합니다.

```json
{
  "title": "비 오는 날 즐기는 서울 실내 문화 코스",
  "summary": "비 예보가 있는 날에도 이동 부담이 적도록 실내 문화 공간과 식사 동선을 중심으로 구성한 하루 코스입니다.",
  "regionName": "서울",
  "durationDays": 1,
  "tags": ["실내", "문화", "맛집", "우천"],
  "days": [
    {
      "day": 1,
      "theme": "실내 문화와 여유로운 맛집 코스",
      "items": [
        {
          "order": 1,
          "time": "10:00",
          "placeName": "국립중앙박물관",
          "contentId": "126508",
          "address": "서울특별시 용산구 서빙고로 137",
          "duration": "2시간",
          "category": "문화",
          "reason": "실내 관람 중심이라 비가 오는 날에도 쾌적하게 즐길 수 있습니다.",
          "tip": "주말에는 오전 시간대 방문을 추천합니다."
        }
      ]
    }
  ],
  "saveGuide": {
    "folderName": "서울 실내 문화 코스",
    "memo": "비 오는 날 친구와 함께 가기 좋은 실내 중심 여행 코스",
    "checklist": [
      "우산 챙기기",
      "전시 운영 시간 확인",
      "식당 대기 시간 확인"
    ]
  },
  "warnings": []
}
```

---

## 6. 응답 규칙

Gemini가 지켜야 할 규칙입니다.

```text
1. 반드시 JSON만 반환한다.
2. Markdown 코드블록을 사용하지 않는다.
3. JSON 앞뒤에 설명 문장을 붙이지 않는다.
4. 사용자가 제공한 preferredPlaces가 있으면 해당 장소를 우선 사용한다.
5. 제공된 장소가 부족할 경우 일반적인 장소명을 제안할 수 있지만, 확정 정보처럼 과장하지 않는다.
6. contentId가 제공된 장소는 그대로 유지한다.
7. contentId가 없는 추천 장소는 contentId를 null로 둔다.
8. 이동 동선은 같은 지역 안에서 무리하지 않는 순서로 구성한다.
9. reason과 tip은 짧고 구체적으로 작성한다.
10. 응답에는 title, summary, days, saveGuide를 반드시 포함한다.
```

---

## 6-1. 2026.07.23 프롬프트 보강 사항

AI 플래너 테스트 결과, Gemini가 관광공사 API에 등록되지 않은 장소를 과도하게 생성하면 CodeTrip의 공공데이터 기반 여행지 탐색 기능과 연결성이 약해지는 문제가 확인되었습니다.

이에 따라 프롬프트와 프론트엔드 요청 구조를 다음 방향으로 보강했습니다.

### 생성 모드 분리

```text
custom: 설정한 조건으로 새 코스 생성하기
folder: 위시리스트 폴더 기반으로 코스 생성하기
```

### 조건 기반 새 코스 생성

```text
1. 사용자가 입력한 regionName으로 관광공사 API searchKeyword2를 먼저 호출한다.
2. 조회된 TourAPI 장소 후보를 preferredPlaces로 Gemini에 전달한다.
3. Gemini는 preferredPlaces를 주요 방문지로 우선 사용한다.
4. preferredPlaces만으로 일정 구성이 부족할 때만 contentId가 null인 장소를 추가 제안한다.
5. contentId가 있는 장소는 저장 시 위시리스트 카드로 연결될 수 있다.
```

### 위시리스트 폴더 기반 코스 생성

```text
1. 사용자가 기존 위시리스트 폴더를 선택한다.
2. 선택한 폴더 안의 여행지를 preferredPlaces로 Gemini에 전달한다.
3. Gemini는 selected preferredPlaces를 주요 방문지로 우선 배치한다.
4. 필요한 식사, 카페, 보조 장소만 추가한다.
5. 저장 시 새 폴더를 만들지 않고 기존 폴더에 AI 코스 메모와 체크리스트를 추가한다.
```

### 보강된 사용자 조건

```text
- 생성 방식: 조건 기반 새 코스 또는 위시리스트 폴더 기반
- 기준 폴더: 사용자가 선택한 위시리스트 폴더명
- 인원 수: 실제 여행 인원 수
- 예산 기준:
  - 낮음: 1일 1인 3만 원 이하, 무료/저가 관광지와 가성비 식사 중심
  - 보통: 1일 1인 3만~8만 원, 일반 입장료·식사·카페 포함
  - 높음: 1일 1인 8만 원 이상, 유료 전시·체험·분위기 좋은 식당/카페 포함
- 예상 총예산 범위: 인원 수를 반영한 1일 총예산
```

### 보강된 응답 규칙

```text
preferredPlaces에 포함된 장소는 관광공사 API 또는 사용자의 위시리스트에 연결된 장소로 간주한다.
가능한 한 preferredPlaces를 주요 방문지로 우선 사용한다.
preferredPlaces의 contentid는 응답의 contentId에 그대로 넣는다.
조건 기반 새 코스에서 preferredPlaces가 있다면, 부족할 때만 contentId가 null인 장소를 추가 제안한다.
위시리스트 폴더 기반이면 preferredPlaces를 주요 방문지로 우선 배치하고, 필요한 식사/카페/보조 장소만 추가한다.
예산은 1일 1인 기준과 예상 총예산 범위를 함께 고려하여 식사, 카페, 유료 체험 수준을 조절한다.
```

### 인원 수와 예산 계산 방식

기존에는 `동행 유형`만 전달했기 때문에 친구/가족/연인 여부는 알 수 있었지만, 실제 몇 명이 여행하는지는 프롬프트에 반영되지 않았습니다.

2026.07.23 보강 작업에서 AI 플래너 입력값에 `peopleCount`를 추가하고, 프롬프트에는 1인 기준 예산과 인원 수를 곱한 총예산 범위를 함께 전달하도록 변경했습니다.

예시:

```text
- 동행 유형: 친구
- 인원 수: 2명
- 예산 수준: 보통
- 예산 기준: 1일 1인 3만~8만 원, 일반 입장료·식사·카페 포함
- 예상 총예산 범위: 1일 총 6만 원~16만 원
```

예산 범위:

```text
낮음: 1일 1인 3만 원 이하
보통: 1일 1인 3만~8만 원
높음: 1일 1인 8만 원 이상
```

총예산 계산 예시:

```text
2명 + 낮음: 1일 총 6만 원 이하
2명 + 보통: 1일 총 6만~16만 원
2명 + 높음: 1일 총 16만 원 이상
4명 + 보통: 1일 총 12만~32만 원
```

### AI 생성 장소 처리 방향

TourAPI `contentId`가 없는 AI 생성 장소는 기존 여행지 상세 페이지와 연결할 수 없기 때문에, 장기적으로는 위시리스트 카드와 분리된 `AI 코스 기록` 형태로 관리하는 방향이 적절합니다.

권장 구조:

```text
TourAPI 장소
- 위시리스트 카드
- VIEW_DATA
- 관광공사 상세 정보 연결

AI 생성 코스
- AI 코스 기록 카드
- VIEW_COURSE
- title, summary, days, items, tips, checklist 기반 상세 화면
```

---

## 7. 프롬프트 초안

### System Prompt

```text
당신은 한국 여행 코스를 설계하는 여행 큐레이션 어시스턴트입니다.
사용자의 지역, 일정, 취향, 날씨, 동행 유형, 선택한 여행지 후보를 바탕으로 현실적인 여행 코스를 생성합니다.

반드시 유효한 JSON만 반환해야 합니다.
Markdown, 코드블록, 설명 문장, 주석은 반환하지 않습니다.
```

### User Prompt Template

```text
다음 조건을 바탕으로 한국 여행 코스를 생성해주세요.

[사용자 조건]
- 지역: {{regionName}}
- 여행 일수: {{durationDays}}일
- 여행 스타일: {{travelStyle}}
- 동행 유형: {{companionType}}
- 예산 수준: {{budgetLevel}}
- 이동 강도: {{pace}}
- 날씨 키워드: {{weatherKeyword}}
- 시작 시간: {{startTime}}
- 종료 시간: {{endTime}}
- 피하고 싶은 조건: {{avoidKeywords}}

[사용자가 선택한 여행지 후보]
{{preferredPlacesJson}}

[응답 규칙]
1. 반드시 JSON만 반환하세요.
2. Markdown 코드블록을 사용하지 마세요.
3. JSON 외의 설명 문장을 추가하지 마세요.
4. preferredPlaces에 포함된 장소를 우선 사용하세요.
5. preferredPlaces의 contentid는 응답의 contentId에 그대로 넣어주세요.
6. contentid가 없는 장소를 새로 제안할 경우 contentId는 null로 작성하세요.
7. 하루 일정은 시간 순서대로 작성하세요.
8. 이동이 과도하게 많지 않도록 같은 지역 중심으로 구성하세요.
9. 비, 더위, 추위 등 날씨 키워드가 있으면 실내/실외 비중에 반영하세요.
10. saveGuide에는 Firebase 위시리스트 폴더로 저장하기 좋은 folderName, memo, checklist를 포함하세요.

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
}
```

---

## 8. 프론트엔드 검증 규칙

Gemini 응답을 그대로 신뢰하지 않고, 화면 표시 전 최소 검증을 수행합니다.

검증 항목:

```text
JSON parse 가능 여부
title 존재 여부
days 배열 존재 여부
days[].items 배열 존재 여부
saveGuide.folderName 존재 여부
필수 문자열 필드의 타입 확인
contentId가 없으면 null 허용
```

검증 실패 시:

```text
사용자에게 "AI 코스를 생성하지 못했습니다. 조건을 조금 단순하게 다시 시도해주세요." 메시지 표시
원본 응답은 콘솔에만 출력
Firebase에는 저장하지 않음
```

---

## 9. Firebase 저장 방향

1차 구현에서는 기존 위시리스트 폴더 구조를 최대한 재사용합니다.

저장 후보:

```text
users/{uid}/wishlistFolders/{folderId}
users/{uid}/wishlistNotes/{noteId}
users/{uid}/wishlists/{wishlistId}
```

저장 방식 초안:

```text
1. saveGuide.folderName으로 새 폴더 생성
2. saveGuide.memo를 폴더 메모로 저장
3. saveGuide.checklist를 체크리스트로 저장
4. contentId가 있는 코스 장소는 wishlists에 저장
5. contentId가 없는 장소는 memo로만 저장하거나 저장 대상에서 제외
```

추가 검토:

```text
AI 생성 코스 원본 JSON을 별도 노드에 저장할지 여부
예: users/{uid}/aiTrips/{tripId}
```

1차 구현에서는 기존 폴더/메모/체크리스트 구조 재사용을 우선합니다.

---

## 10. 보안 및 운영 주의사항

Gemini API key를 브라우저 번들에 직접 포함하면 노출될 수 있습니다.

공모전 시연용으로 프론트엔드 `.env` 기반 호출을 사용할 수는 있지만, 실제 운영 기준에서는 다음 구조가 더 안전합니다.

```text
Client
-> Firebase Functions 또는 별도 서버 API
-> Gemini API
```

비용 문제로 Cloud Functions를 사용하지 않는다면 README와 수정 로그에 다음 한계를 명시합니다.

```text
Gemini API key는 프론트엔드 환경 변수로 주입되며,
실제 운영 서비스에서는 서버성 프록시로 이전하는 것이 안전합니다.
```

### 1차 구현 환경변수

```env
VITE_GEMINI_API_KEY=...
VITE_GEMINI_MODEL=gemini-3.5-flash
```

`VITE_GEMINI_MODEL`은 생략할 수 있으며, 생략 시 코드에서 `gemini-3.5-flash`를 기본값으로 사용합니다.

---

## 11. 테스트 시나리오

### 정상 케이스

```text
서울, 1일, 실내/문화, 친구, 비
부산, 2일, 바다/맛집, 연인, 맑음
제주, 3일, 자연/힐링, 가족, 여유
```

### 예외 케이스

```text
지역만 입력하고 나머지 조건이 비어 있는 경우
preferredPlaces가 빈 배열인 경우
Gemini 응답이 JSON이 아닌 경우
contentId가 없는 장소가 포함된 경우
API 호출 실패 또는 quota 초과 발생
```

### 저장 테스트

```text
AI 코스 생성 결과가 화면에 표시되는지 확인
폴더 저장 버튼 클릭 시 wishlistFolders 생성 확인
memo 저장 확인
checklist 저장 확인
contentId가 있는 장소만 wishlists 저장 확인
My Page에서 저장된 폴더와 메모가 표시되는지 확인
```

---

## 12. 구현 작업 목록

```text
[Research] Gemini API 연동 방식 조사
[Security] API key 보안 처리 방향 트레이드오프
[Design] Gemini 프롬프트 설계
[Design] Gemini 응답 데이터 구조 설계
[UI/UX] AI 여행 코스 생성 UI 설계
[Feat] Gemini AI 생성 코스 위시리스트 폴더 저장
[Test] Gemini 기능 로컬 테스트
[Docs] Gemini 기능 작업 내역 및 README/Firebase 문서화
[Review] feature/gemini PR 생성 및 셀프 리뷰
```

---

## 13. 1차 결론

Gemini 기능은 먼저 AI 여행 코스 생성에 집중합니다.

프롬프트는 자유 문장 응답이 아니라 JSON 응답을 강제하고, 기존 위시리스트 폴더/메모/체크리스트 구조에 저장 가능한 형태로 설계합니다.

이후 구현 단계에서는 `feature/gemini` 브랜치에서 API 연동, UI 구성, 저장 기능을 분리해서 진행합니다.

---

## 14. 2026.07.21 구현 및 테스트 보류 기록

### 구현 완료 범위

```text
Gemini API 호출 모듈 추가
AI Planner 화면 및 /ai-planner 라우트 추가
사이드바 AI Planner 메뉴 추가
Gemini 응답 JSON 파싱 및 필수 구조 검증
Gemini 응답 기반 위시리스트 폴더/메모/체크리스트 저장 헬퍼 추가
Gemini API 오류 메시지 간소화 처리
모바일 사이드바 hover 애니메이션 보정
```

### 정적 검증 결과

```text
npm run lint 성공
lint error 0개
기존 React Hook warning 12개 유지

npm run build 성공
기존과 동일하게 일부 chunk size warning 발생
```

### 실제 API 호출 테스트 결과

Gemini API key를 CodeTrip 프로젝트 기준으로 재생성하여 `.env`에 반영한 뒤 로컬에서 호출을 테스트했습니다.

요청은 Gemini API까지 도달했으나 Google AI Studio에서 다음 상태가 확인되어 실제 생성 결과 검증은 진행하지 못했습니다.

```text
HTTP 429 RESOURCE_EXHAUSTED
Gemini API 사용량 한도 또는 현재 프로젝트 quota 없음
Google AI Studio 결제 화면 기준 크레딧 잔액 0원
서비스 재개를 위해 크레딧 잔액이 0보다 커야 한다는 안내 표시
```

따라서 현재 상태는 코드 오류가 아니라 Google AI Studio 프로젝트의 크레딧/quota 제한으로 보는 것이 맞습니다.

### 후속 진행 조건

```text
Google AI Studio 크레딧 충전 또는 사용 가능한 quota 확보
동일 .env 설정으로 로컬 브라우저 재테스트
AI 코스 생성 결과 화면 렌더링 확인
생성 결과 위시리스트 폴더 저장 end-to-end 테스트
필요 시 feature/gemini PR 생성 및 셀프 리뷰
```

---

## 15. 2026.07.22 Gemini API key 트러블슈팅 기록

### 작업 배경

2026.07.21 기준으로는 Gemini API 호출이 `429 RESOURCE_EXHAUSTED`로 중단되어 실제 생성 결과 검증을 완료하지 못했습니다.
2026.07.22에는 CodeTrip 프로젝트 기준 Gemini API key를 재확인하고, 로컬 환경에서 실제 호출이 어느 단계까지 통과하는지 추적했습니다.

### 확인한 문제 흐름

```text
1. API key를 새로 입력했는데도 기존 오류 메시지가 반복됨
2. Google Cloud 사용자 인증 정보 화면에서 CodeTrip 프로젝트 키와 별도 Gemini API 프로젝트 키가 함께 표시됨
3. 일부 키는 서비스 계정에 바인딩되어 웹사이트 HTTP referrer 제한을 걸 수 없음
4. 기존 .env의 VITE_GEMINI_MODEL이 gemini-2.0-flash로 남아 있음
5. 모델명을 gemini-3.5-flash로 변경한 뒤 API key 인증 단계는 통과함
6. 이후 503 Service Unavailable이 발생하여 Gemini 모델 서버 혼잡 상태로 판단함
```

### 상태 코드별 판단 기준

```text
401 Unauthorized
- API key 값, 프로젝트, API 사용 설정, 서비스 계정 바인딩, API 제한 설정 문제 가능성이 큼
- CodeTrip 프로젝트(newagent-9c2a8)에서 생성한 Gemini API key인지 확인 필요

429 RESOURCE_EXHAUSTED
- quota, 사용량 한도, 결제/크레딧 상태 문제 가능성이 큼
- Google AI Studio 또는 Google Cloud Billing의 quota/credit 상태 확인 필요

503 Service Unavailable
- API key 인증 이후 Gemini 모델 서버가 일시적으로 혼잡한 상태
- 코드나 key 설정 문제보다는 모델 수요 과부하로 판단
- 잠시 후 재시도하거나 Lite 계열 모델 검토
```

### API key 설정 관련 결론

```text
프론트엔드에서 Gemini API를 직접 호출하는 현재 구조에서는 API key가 브라우저 번들에 포함됩니다.
HTTP referrer 제한을 걸면 허용 도메인 밖 사용은 줄일 수 있지만, key 자체가 숨겨지는 것은 아닙니다.
Google Cloud에서 서비스 계정 바인딩 Gemini API key는 웹사이트 referrer 제한을 사용할 수 없었습니다.
따라서 로컬 검증 단계에서는 서비스 계정 바인딩 key와 API 제한을 사용하고,
최종 제출 전에는 Firebase Functions + Functions Secret 구조로 전환하는 방향을 유지합니다.
```

### 반영한 코드 수정

수정 파일:

```text
src/api/geminiApi.js
README.md
```

수정 내용:

```text
Gemini 기본 모델을 gemini-2.0-flash에서 gemini-3.5-flash로 변경
README 환경변수 예시의 VITE_GEMINI_MODEL도 gemini-3.5-flash로 변경
500번대 Gemini 오류 안내 문구를 "Gemini 서버가 혼잡합니다. 잠시 후 다시 시도해주세요."로 변경
```

### 현재 검증 결과

```text
Gemini API key는 비어 있지 않고 로컬 .env에서 읽히는 상태
모델명을 gemini-3.5-flash로 변경 후 401/429가 아닌 503 응답 확인
따라서 현재 남은 오류는 key 인증 문제가 아니라 Gemini 모델 서버 혼잡 문제로 판단
```

### 후속 작업

```text
잠시 후 동일 조건으로 Gemini 생성 재시도
503이 반복되면 gemini-3.5-flash-lite 또는 사용 가능한 Lite 계열 모델 검토
생성 성공 시 AI 코스 결과 렌더링 확인
생성 결과 위시리스트 폴더/메모/체크리스트 저장 end-to-end 테스트
제출 직전 Blaze 전환 후 Firebase Functions + Secret 구조로 전환
```

---

## 16. 추후 개발 계획 - 좌표 기반 동선 최적화 MVP

### 현재 상태

현재 AI 여행 코스는 프롬프트에서 시간 순서와 같은 지역 중심 구성을 요청하고 있습니다.
따라서 Gemini가 장소명과 주소를 바탕으로 이동 순서를 추정하지만, 실제 좌표·거리·이동 시간은 계산하지 않습니다.

```text
현재 방식: AI가 주소와 지역 정보를 바탕으로 동선을 추정
목표 방식: 관광공사 좌표로 가까운 장소 순서를 계산한 뒤 AI가 일정 구성
```

### 구현 예정 범위

공모전 제출 전후로 복잡도를 과도하게 높이지 않는 좌표 기반 MVP를 우선 검토합니다.

1. 관광공사 API 응답의 `mapx`, `mapy` 좌표를 위시리스트와 AI 플래너 입력 데이터에 포함
2. 선택된 장소 사이의 직선거리를 Haversine 공식으로 계산
3. 가까운 장소가 연속되도록 방문 후보 순서를 우선 정렬
4. 정렬된 장소명, 주소, 좌표, 이전 장소와의 예상 직선거리를 Gemini 프롬프트에 전달
5. Gemini가 이동 순서를 유지하면서 식사·카페·관람 시간 등 세부 일정을 구성
6. 생성 결과에 `예상 이동 거리` 또는 `다음 장소까지 약 N km` 수준의 참고 정보 표시

### 구현 원칙

- 관광공사에 등록된 좌표가 있는 장소를 우선 사용
- 좌표가 없는 장소는 거리 계산 대상에서 제외하고 Gemini 보조 추천으로 처리
- 계산된 직선거리는 실제 도로 거리나 이동 시간이 아니라는 안내 표시
- 위시리스트 폴더 기반 코스에서 우선 적용한 뒤 조건 기반 코스로 확대
- 별도 유료 길찾기 API 없이 프론트엔드에서 계산 가능한 범위로 제한

### 후순위 범위

다음 기능은 좌표 기반 MVP보다 복잡도와 운영 비용이 높아 별도 작업으로 분리합니다.

```text
카카오 길찾기 API 기반 실제 도로 경로
대중교통·자동차·도보별 정확한 이동 시간
실시간 교통 상황 반영
다중 경유지 최적화
지도 위 전체 코스 경로선 표시
```

### 기대 효과

- AI가 임의로 나열한 일정이 아니라 실제 위치 관계를 고려한 코스 제공
- 관광공사 API의 좌표 데이터를 AI 기능과 직접 연결
- 장거리 왕복이나 지역 간 불필요한 이동 감소
- 공공데이터와 생성형 AI를 결합한 CodeTrip의 차별점 강화
