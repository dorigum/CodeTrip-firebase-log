# Gemini API 하네스 엔지니어링 설계

## 1. 목적

CodeTrip의 Gemini 여행 일정 생성을 단순 API 호출이 아니라, 입력 검증·컨텍스트 구성·모델 호출·출력 검증·저장·평가가 연결된 신뢰 가능한 실행 계층으로 운영합니다.

하네스의 성공 기준은 “Gemini가 응답했다”가 아니라 다음을 모두 만족하는 것입니다.

- 인증된 사용자만 요청할 수 있습니다.
- 모델에 전달되는 입력이 유효하고 제한되어 있습니다.
- TourAPI 검증 장소와 AI 추천 장소가 구분됩니다.
- 응답이 CodeTrip의 실제 도메인 스키마를 만족합니다.
- 오류·재시도·재생성·fallback이 구분됩니다.
- 모델·프롬프트·검증 결과를 추적할 수 있습니다.

## 2. 현재 구조와 주요 위험

2026-08-16 기준으로 Gemini 호출은 클라이언트 직접 호출에서 Firebase Callable Function 프록시 호출 구조로 전환했습니다.

현재 저장소의 `src/api/geminiApi.js`는 다음 책임만 가집니다.

- 로그인 사용자 존재 여부 사전 확인
- `httpsCallable(firebaseFunctions, 'generateTripPlan')` 호출
- Callable 오류 코드를 사용자용 메시지로 변환

Gemini API 키 로드, Gemini API 호출, timeout·retry, 프롬프트 생성, JSON 파싱, 기본 응답 검증은 `functions/index.js`의 `generateTripPlan` Callable Function으로 이동했습니다.

이전 구조의 `src/api/geminiApi.js`는 다음을 한 파일에서 처리했습니다.

- 브라우저에서 Gemini API 직접 호출
- API 키 로드
- timeout·retry
- 프롬프트 생성
- JSON 파싱
- 기본 응답 검증

이전 구조는 MVP 실험에는 빠르지만, `VITE_GEMINI_API_KEY`가 브라우저 번들에 포함될 수 있어 공개 서비스의 비밀키 보호에는 적합하지 않았습니다. 현재 코드에서는 브라우저의 `VITE_GEMINI_API_KEY` 의존성을 제거했고, `generateTripPlan` Callable Function 배포, `GEMINI_API_KEY` Secret version 2 등록, Hosting 재배포, 신규 키 smoke test, 기존 노출 가능 키 삭제까지 완료했습니다. 남은 검증은 사용자별 호출 제한 반복 검증과 잘못된 입력 케이스 검증입니다.

## 3. 목표 실행 흐름

```text
AiPlanner 입력
  ↓
Input Guard
  ├─ 인증 확인
  ├─ 타입·범위 검증
  ├─ 문자열 길이 제한
  └─ 입력 정규화
  ↓
Context Builder
  ├─ 사용자 조건
  ├─ TourAPI verified 장소
  ├─ 사용자 선택 장소
  └─ 날씨·지역 정보
  ↓
Prompt Builder
  ↓
Model Runner
  ├─ timeout
  ├─ 재시도
  └─ rate limit 처리
  ↓
Output Guard
  ├─ JSON parse
  ├─ schema validation
  ├─ 도메인 검증
  └─ 결과 정규화
  ↓
Persistence Adapter
  ↓
Telemetry·평가 기록
```

## 4. 권장 모듈 구조

향후 `src/ai/` 또는 Functions 내부에 다음 책임을 분리합니다.

```text
ai/
├─ geminiClient.js       # HTTP 호출, timeout, retry
├─ tripPlanPrompt.js     # system/user/repair prompt
├─ tripPlanSchema.js     # 입력·출력 계약
├─ tripPlanValidator.js  # 형식·도메인 검증
├─ tripPlanNormalizer.js # 필드명·출처·기본값 정규화
├─ tripPlanHarness.js    # 전체 실행 오케스트레이션
└─ aiTelemetry.js        # 성공률·지연·검증 실패 기록
```

## 5. 데이터 계약

### 입력 계약

필수: `regionName`, `durationDays`, `travelStyle`, `companionType`.

선택: `peopleCount`, `budgetLevel`, `pace`, `weatherKeyword`, `startTime`, `endTime`, `travelStartDate`, `travelEndDate`, `preferredPlaces`, `avoidKeywords`.

입력 가드 기본 기준:

- 여행 기간은 MVP 화면 기준 최대 5일로 제한합니다.
- 여행 시작일과 종료일은 선택값이며, 입력 시 `YYYY-MM-DD` 형식과 시작일·종료일 순서를 검증합니다.
- 인원 수 1~10명
- 시작 시간은 종료 시간보다 이릅니다.
- 배열·문자열 길이에 상한을 둡니다.
- `preferredPlaces`는 필요한 개수만 제한적으로 전달합니다.
- HTML, 스크립트, 불필요한 개인정보는 제거합니다.

### 출력 계약

현재 CodeTrip 화면과 저장 로직의 기준은 `days[].items`입니다. 모든 신규 서버 구현도 이 계약을 유지해야 하며, `days[].schedule`을 사용하려면 별도 변환 계층을 둡니다.

```json
{
  "title": "string",
  "summary": "string",
  "regionName": "string",
  "durationDays": 1,
  "tags": ["string"],
  "days": [
    {
      "day": 1,
      "theme": "string",
      "items": [
        {
          "order": 1,
          "time": "10:00",
          "placeName": "string",
          "contentId": "string or null",
          "address": "string or null",
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

## 6. 검증 계층

### 형식 검증

JSON 여부, 필수 필드, 타입, 배열 구조, 시간 형식을 확인합니다.

### 도메인 검증

- `durationDays`와 `days.length` 일치
- day 번호와 item order의 순서성
- 일정 시간이 사용자 활동 시간 안에 있음
- 입력된 `contentId` 보존
- 공식 장소·후보·AI 추천 출처 구분
- 지역 조건과 일정 장소의 과도한 불일치 감지
- 빈 일정·비정상적으로 많은 장소 감지

### 결과 정규화

`contentId`, `contentid`, `content_id`를 내부 기준인 `contentId`로 통일합니다. 출처는 다음 세 종류로 통일합니다.

- `verified`: TourAPI 또는 서비스가 확인한 장소
- `candidate`: 입력에 존재하지만 상세 검증이 필요한 장소
- `suggested`: AI가 추천했으나 공식 식별자가 없는 장소

## 7. 오류 처리 정책

네트워크 재시도와 결과 재생성을 구분합니다.

- 네트워크 재시도: 408, 5xx, timeout, 일시적 fetch 실패
- 429: quota·요청 한도 보호를 위해 재시도하지 않고 즉시 사용자에게 대기 안내를 반환합니다.
- 결과 재생성: JSON 파싱 실패, 스키마 실패, 시간·일수·지역 규칙 위반
- 치명적 검증 실패: 사용자에게 실패 안내 및 재시도 제공
- 경고 수준: 결과를 표시하되 `warnings`와 UI 안내로 노출

재생성은 최대 1회로 제한합니다. 재생성 프롬프트에는 검증 실패 항목만 전달하고, 사용자의 원래 조건은 유지합니다.

## 8. Firebase Functions 전환

현재 목표 구조는 Callable Function 기준으로 확정했습니다.

```text
React + Firebase Auth
  ↓ httpsCallable(generateTripPlan)
Firebase Functions
  ├─ request.auth 검증
  ├─ 입력 가드
  ├─ Gemini API 호출
  ├─ 출력·도메인 검증
  └─ 정제된 plan 반환
```

Gemini API 키는 Secret Manager의 `defineSecret('GEMINI_API_KEY')`으로 관리합니다. 클라이언트의 로그인 확인은 UX용 사전 확인일 뿐이며, 실제 보안 경계는 Function의 `request.auth` 검증입니다. Functions 리전은 프론트와 서버 모두 `asia-northeast3`로 맞춥니다.

## 9. 제안 코드 리뷰

검토 대상: `C:\Users\kkama\Downloads\geminiApi.js`, `C:\Users\kkama\Downloads\gemini-proxy-function.js`.

### 좋은 점

- 클라이언트에서 Callable Function을 호출하는 방향은 적절합니다.
- Functions에서 Secret Manager를 사용하려는 방향은 API 키 보호에 적합합니다.
- 인증, 입력 검증, timeout, retry, 사용자 메시지 변환을 고려했습니다.
- Gemini 응답을 서버에서 파싱하려는 계층 분리가 시작되어 있습니다.

### 병합 전 수정 필수

1. **응답 스키마 충돌**: 제안 Function은 `days[].schedule`을 생성하지만 현재 CodeTrip은 `days[].items`를 사용합니다. 화면과 저장 로직을 깨뜨릴 수 있으므로 기존 `items` 계약을 유지합니다.
2. **검증 부족**: `title`과 `days` 배열 존재만 확인합니다. `durationDays`, day 번호, 시간 범위, contentId 보존, 장소 출처를 검증해야 합니다.
3. **오류 코드 손실 가능성**: 파싱용 `try/catch`가 내부에서 발생한 `HttpsError`까지 다시 `internal`로 감쌀 수 있습니다. 기존 `HttpsError`는 그대로 재전파해야 합니다.
4. **프롬프트 불일치**: 시스템 프롬프트는 Markdown 본문을 요구하면서 JSON 반환을 요구합니다. 구조화된 JSON만 반환하도록 한 가지 계약으로 통일합니다.
5. **의존성·배포 구조**: `functions/` 디렉터리와 Functions용 `package.json`을 추가했습니다. Node.js 20 런타임의 기본 `fetch`를 사용하므로 `node-fetch` 의존성은 추가하지 않습니다.
6. **모델명 하드코딩**: 모델명을 Function 코드에 고정하지 말고 환경 설정 또는 버전이 기록되는 설정으로 분리합니다.
7. **요청 제한 검증 부족**: 사용자별 rate limit, 입력 크기 제한, 동시 요청 제한 코드는 반영했습니다. 현재 제한은 Functions 인스턴스 로컬 메모리 기반의 근사 방어선이므로 전역 quota를 보장하지 않습니다. 전역 한도가 필요하면 Firestore 또는 Realtime Database 기반 uid별 카운터로 이전합니다.
8. **민감정보 반환**: Function 반환값에 `uid`를 포함할 필요가 없습니다. 인증 정보는 서버 내부 로그에서만 관리합니다.
9. **오류 원문 노출**: Gemini 응답 원문을 `HttpsError` 메시지에 그대로 포함하면 내부 정보가 사용자에게 노출될 수 있습니다. 상세 원문은 서버 로그, 사용자는 정제 메시지만 받아야 합니다.
10. **Callable 클라이언트 초기화**: `getFunctions(undefined, ...)`보다 초기화된 Firebase App을 명시하고, 프로젝트의 실제 배포 리전과 일치하는지 확인합니다.

## 10. 단계별 도입 계획

### 1단계: 계약 고정

- 현재 `days[].items` 스키마를 기준으로 문서화
- 입력·출력 타입과 허용 범위 정의
- `validateTripPlan`을 형식·도메인 검증으로 확장

### 2단계: 하네스 모듈화

- 프롬프트·HTTP 클라이언트·검증·정규화 분리
- prompt version과 generation metadata 추가
- 검증 실패 사유를 구조화

### 3단계: 서버 프록시 전환

- `functions/` 프로젝트 구성: 완료
- `GEMINI_API_KEY` Secret Manager 설정: 완료, 현재 배포는 Secret version 2 기준
- `generateTripPlan` Callable Function 배포: 완료
- Firebase Hosting 재배포: 완료
- 배포 산출물 Gemini 키 미포함 확인: 완료
- 기존 노출 가능 Gemini 키 삭제: 완료
- Callable 인증 smoke test: 완료
- rate limit·입력 제한 반복 검증: 미완료
- 잘못된 입력 케이스 검증: 미완료

### 4단계: 평가·운영

- 고정 평가 케이스 10개 구성
- JSON·도메인 검증 통과율 기록
- 응답 시간·재시도·재생성·실패율 기록
- 배포 전 AI smoke test 추가

## 11. 완료 기준

- 브라우저 번들에 Gemini API 키가 포함되지 않습니다.
- 프론트엔드와 Functions의 출력 스키마가 일치합니다.
- 정상·오류·빈 입력·timeout·429·잘못된 JSON을 검증합니다.
- 공식 장소와 AI 추천 장소가 UI와 저장 데이터에서 구분됩니다.
- prompt version, model, validation status, retry count를 추적할 수 있습니다.
- 고정 평가 케이스의 결과와 실패 사유가 문서화됩니다.
