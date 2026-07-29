# 2026-07-29 CodeRabbit PR 피드백 반영 로그

## 작업 개요

feature/cache PR 리뷰 과정에서 CodeRabbit이 지적한 문서 불일치, AI 코스 장소 출처 분류 중복, `apiCache` 보안 범위를 정리했습니다.

## 변경 내용

### AI 코스 장소 출처 분류 공통화

- `src/utils/aiPlanSource.js`를 추가했습니다.
- AI 코스 장소의 `contentId` 추출, 출처 타입 판정, 출처 배지 라벨/스타일을 공통 유틸로 분리했습니다.
- `verified`, `candidate`, `suggested` 분류 기준을 한 파일에서 관리하도록 정리했습니다.
- `src/pages/MyPage.jsx`의 중복 helper를 제거하고 공통 유틸을 사용하도록 변경했습니다.
- `src/pages/AiPlanner.jsx`의 인라인 출처 배지 분기를 제거하고 같은 공통 유틸을 사용하도록 변경했습니다.

### apiCache 보안 범위 조정

- `database.rules.json`에서 `apiCache/{cacheKey}` 단위로 읽기 권한을 `auth != null`로 제한했습니다.
- 반올림 좌표 기반 위치명 캐시 등 사용자의 위치 조회 흔적이 공개적으로 노출되지 않도록 조정했습니다.
- `src/api/apiCache.js`에서 로그인하지 않은 사용자는 Realtime Database 원격 캐시 read/write를 시도하지 않도록 변경했습니다.
- 비회원 공개 페이지에서는 메모리 캐시, localStorage, 외부 API 직접 호출 fallback만 사용합니다.

### 문서 정합성 보정

- `README.md`
  - 현재 검증 상태의 기존 React Hook warning 개수를 10개로 통일했습니다.
  - 비회원 공개 화면에서 Realtime Database 공유 캐시를 사용하지 않는 운영 기준을 추가했습니다.
- `CodeTrip_Firebase/guides/Contest_Submission_Checklist.md`
  - Gemini API key 프론트엔드 포함 상태를 최종 제출 배포 차단 조건으로 명시했습니다.
  - 제출 전 Firebase Functions endpoint와 Functions Secret 이전을 필수 체크 항목으로 승격했습니다.
- `CodeTrip_Firebase/guides/Project_Firebase_배포.md`
  - 최종 제출 전 Gemini API key를 Functions Secret으로 이전해야 한다는 기준을 보강했습니다.
  - `apiCache` 권한과 비회원 fallback 기준을 최신 로직에 맞춰 수정했습니다.
- `CodeTrip_Firebase/info/Firebase_상세 내역서.md`
  - Firebase 배포 기준 브랜치를 `firebase`에서 `main`으로 수정했습니다.
- `CodeTrip_Firebase/project-log/2026-07-24.md`
  - Firebase 검증 경로를 `users/{uid}/aiTripPlans/{planId}/tour_api_verification` 전체 경로로 통일했습니다.

## 트러블슈팅

### 1. apiCache 공개 read 제한

- **문제**: Realtime Database `apiCache`에 공개 read가 적용되어 있으면, 반올림 좌표 기반 위치명 캐시 등 사용자의 위치 조회 흔적이 공개적으로 읽힐 수 있습니다.
- **원인**: 공공데이터 API 호출량 절감을 위해 공유 캐시를 추가하면서 공개 페이지에서도 읽을 수 있도록 설계했던 초기 규칙이 남아 있었습니다.
- **처리**:
  - Rules에서 `apiCache` 상위 read를 제거하고 `apiCache/{cacheKey}` 단위 읽기 권한만 로그인 사용자로 제한했습니다.
  - 클라이언트에서도 비회원 상태에서는 원격 캐시 read/write를 시도하지 않도록 변경했습니다.
- **결과**: 공개 페이지는 원격 캐시 접근 없이 메모리/localStorage 캐시와 외부 API 호출 fallback으로 동작하고, 로그인 사용자는 Realtime Database 공유 캐시를 사용할 수 있습니다.

### 2. apiCache 인증 사용자 쓰기 오염 가능성

- **문제**: `apiCache` 쓰기를 `auth != null`만으로 허용하면 모든 로그인 사용자가 임의의 캐시 데이터를 저장할 수 있습니다.
- **원인**: 공유 캐시를 클라이언트에서 직접 쓰는 구조에서는 cache key, TTL, data schema를 신뢰할 수 있는 서버에서 통제하지 못합니다.
- **처리**:
  - `database.rules.json`에서 `apiCache/$cacheKey` 쓰기를 `false`로 변경했습니다.
  - `src/api/apiCache.js`에서 Realtime Database 원격 캐시 쓰기 호출을 제거했습니다.
  - 현재는 메모리/localStorage 캐시를 우선 사용하고, 원격 공유 캐시는 읽기 전용으로만 둡니다.
- **결과**: 인증 사용자에 의한 공유 캐시 오염 가능성을 차단했습니다. 추후 공유 캐시 쓰기가 필요하면 Firebase Functions/Admin SDK에서 key, TTL, data schema를 검증하는 방식으로 전환합니다.

### 3. AI 코스 메모 중복 제출 가능성

- **문제**: AI 코스 상세 문서에서 메모 저장 요청이 완료되기 전에 버튼을 빠르게 반복 클릭하면 같은 메모가 여러 건 저장될 수 있습니다.
- **처리**:
  - `aiPlanMemoPending` 상태를 추가했습니다.
  - 저장 요청 중에는 early return, 입력창 비활성화, 제출 버튼 비활성화를 적용했습니다.
  - `finally`에서 pending 상태를 해제하도록 처리했습니다.
- **결과**: 코스 메모의 빠른 연속 제출로 인한 중복 저장 가능성을 줄였습니다.

### 4. 미검증 TourAPI 후보 상세 링크 제한

- **문제**: `contentId`만 있는 미검증 후보 장소도 공식 상세 페이지로 이동할 수 있어, 실제 검증 여부와 상세 링크 계약이 어긋날 수 있습니다.
- **처리**:
  - `canOpenPlanDetail()` 공통 유틸을 추가했습니다.
  - 상세 링크는 `tourApiVerified === true`이고 `contentId`가 있는 장소에만 표시하도록 제한했습니다.
  - 미검증 후보와 코스 추천 장소는 문서 전용 안내만 표시합니다.
- **결과**: 공식 검증 장소와 문서 전용 추천 장소의 사용자 흐름을 분리했습니다.

### 5. AI 코스 장소 출처 분류 중복

- **문제**: AI 코스 생성 미리보기와 상세 문서에서 공식 여행지, 공식 후보, 코스 추천 장소를 판정하는 기준이 각각 따로 구현되어 있었습니다.
- **원인**: `AiPlanner.jsx`와 `MyPage.jsx`에서 UI 구현을 진행하면서 출처 분류 로직이 화면 단위로 분산되었습니다.
- **처리**:
  - `src/utils/aiPlanSource.js`로 공통 유틸을 분리했습니다.
  - 두 화면이 동일한 `getPlanSourceBadge()` 기준을 사용하도록 변경했습니다.
- **결과**: 향후 출처 라벨이나 분류 기준을 수정할 때 한쪽 화면만 바뀌는 불일치 위험을 줄였습니다.

## 검증 필요

- 비회원 상태에서 홈, 여행지 탐색, 축제 페이지 진입 시 `apiCache` permission denied warning이 반복되지 않는지 확인
- 로그인 상태에서 날씨/위치/공공데이터 API 캐시가 정상 동작하는지 확인
- AI 코스 생성 미리보기와 AI 코스 상세 문서의 출처 배지 라벨이 동일하게 표시되는지 확인
- AI 코스 상세 문서에서 메모를 빠르게 연속 클릭해도 중복 저장되지 않는지 확인
- 미검증 후보 장소에는 `View_Data` 버튼이 표시되지 않는지 확인
- 최종 제출 전 Gemini API key를 Firebase Functions + Functions Secret 구조로 이전하는지 확인
