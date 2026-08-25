# CodeTrip 트러블슈팅

Firebase 및 서비스 개발 과정에서 발생한 주요 문제와 해결 기록에 접근하기 위한 색인입니다.

## 1. Firebase 배포 초기화 오류 수정

- **발생일**: 2026-05-02
- **요약**: Firebase Hosting 배포 환경에서 앱 초기화와 인증 세션 복원 충돌 에러 조치
- **상세 기록**: [2026-05-02 개발 로그](project-log/2026-05-02.md)

## 2. Firebase Auth 가입 및 로그인 오류 처리

- **발생일**: 2026-05-02
- **요약**: 중복 이메일, 보안 약한 비밀번호 등 발생 시 Firebase API 원본 에러를 사용자 친화적인 한국어 오류 토스트 메시지로 가공
- **상세 기록**: [2026-05-02 개발 로그](project-log/2026-05-02.md)

## 3. 게시글 상세/삭제 권한 오류 수정

- **발생일**: 2026-07-20
- **요약**: Realtime Database Rules의 `auth.uid` 조건 불일치로 인한 권한 거부 문제 해결 및 429 API 캐시 노드 접근 제한 해제
- **상세 기록**: [2026-07-20 개발 로그](project-log/2026-07-20.md)

## 4. Gemini API key 트러블슈팅 및 알림 오류 처리 보정

- **발생일**: 2026-07-22
- **요약**: Gemini 기능 로컬 테스트 과정에서의 API key 전달 오류 수정 및 원본 API 에러를 정제하여 알림 노드 권한 문제 해결
- **상세 기록**: [2026-07-22 개발 로그](project-log/2026-07-22.md)

## 5. Firebase API key 제한으로 인한 로그인 403 오류

- **발생일**: 2026-07-23
- **요약**: `identitytoolkit.googleapis.com` 로그인 API가 Firebase Browser key 제한에 의해 차단되어 `signInWithPassword` 403 오류가 발생한 문제를 분석하고, 실제 로컬 앱이 사용하는 Firebase Browser key를 재확인
- **상세 기록**: [2026-07-23 개발 로그](project-log/2026-07-23.md)

## 6. AI 플래너 저장 구조 및 관광공사 API 후보 미반영 문제

- **발생일**: 2026-07-23
- **요약**: Gemini가 TourAPI 미등록 장소 위주로 코스를 생성하여 위시리스트 카드 저장률이 낮고, 위시리스트 폴더 기반 저장 시 동일 폴더가 중복 생성되던 문제를 관광공사 후보 우선 전달 및 기존 폴더 저장 방식으로 보정
- **상세 기록**: [2026-07-23 개발 로그](project-log/2026-07-23.md)

## 7. ESLint가 Obsidian 플러그인 번들 파일까지 검사한 문제

- **발생일**: 2026-07-23
- **요약**: `CodeTrip_Firebase/.obsidian/plugins` 하위 번들 JS 파일이 ESLint 검사 대상에 포함되어 수천 개 오류가 발생한 문제를 `eslint.config.js`의 `globalIgnores`에 `**/.obsidian/**`, `**/.claude/**`, `**/.claudian/**`를 추가해 해결
- **상세 기록**: [2026-07-23 개발 로그](project-log/2026-07-23.md)

## 8. AI 여행 코스가 폴더 메모로 저장되는 문제

- **발생일**: 2026-07-23
- **요약**: AI 여행 코스 전체 본문이 `wishlistNotes/MEMO`에 저장되어 마이페이지 `FOLDER_NOTES > MEMO` 영역에 긴 코스 설명이 노출되던 문제를 `aiTripPlans` 별도 노드 저장 및 `AI_COURSE.md` 문서형 카드 출력 방식으로 보정
- **처리 내용**:
  - 새 AI 코스 저장 시 `users/{uid}/aiTripPlans/{planId}`에 제목, 요약, Day별 일정 원본을 분리 저장
  - 마이페이지 폴더 선택 화면에서 AI 코스를 `AI_COURSE.md` 카드 형태로 표시
  - 기존에 잘못 저장된 `[AI 여행 코스]` 메모는 메모 목록에서 숨김 처리
  - TourAPI contentId가 있는 장소는 기존처럼 위시리스트 카드로 저장하고, 준비 항목은 체크리스트로 유지
- **상세 기록**: [2026-07-23 개발 로그](project-log/2026-07-23.md)

## 9. AI가 반환한 TourAPI contentId와 장소 정보가 일치하지 않는 문제

- **발생일**: 2026-07-24
- **영향 범위**: AI 여행 코스 저장, 관광공사 검증 장소 저장, 위시리스트 카드 표시
- **요약**: AI가 응답한 `contentId`가 실제 장소명/주소와 일치하지 않아 엉뚱한 관광공사 장소가 위시리스트 카드로 저장될 수 있었습니다.
- **처리**: 저장 전 장소명, 주소, 지역 일치 여부를 재검증하고 불일치 항목은 위시리스트 카드가 아닌 AI 코스 문서 내부 추천 장소로만 보관하도록 변경했습니다.
- **확인**: 관광공사 검증 장소와 AI 추천 장소가 구분 표시되고, 검증 실패 장소는 카드 목록에 저장되지 않는 것을 확인했습니다.
- **상세 기록**: [2026-07-24 개발 로그](project-log/2026-07-24.md)의 AI 추천 장소 검증 및 저장 결과 보정 섹션 참고

## 10. 위시리스트 카드 삭제가 일부 항목에서 동작하지 않은 문제

- **발생일**: 2026-07-24
- **영향 범위**: 마이페이지 위시리스트 카드 삭제, Realtime Database 위시리스트 데이터
- **요약**: AI 코스 저장 과정에서 생성된 일부 위시리스트 카드가 화면에서는 보이지만 삭제 요청이 정확한 항목을 찾지 못하는 문제가 있었습니다.
- **처리**: 삭제 대상 기준을 관광공사 `contentId`가 아닌 Firebase wishlist record `id` 중심으로 보정하고, 삭제 확인 팝업을 프로젝트 UI 톤에 맞게 변경했습니다.
- **확인**: 위시리스트 카드 삭제 후 Realtime Database에 해당 카드가 남지 않는 것을 확인했습니다.
- **상세 기록**: [2026-07-24 개발 로그](project-log/2026-07-24.md)의 위시리스트 삭제 로직 및 통계 라벨 보완 섹션 참고

## 11. CodeRabbit 리뷰 대응 중 빌드 권한 및 위시리스트 성공 토스트 오판 문제

- **발생일**: 2026-07-24
- **영향 범위**: 위시리스트 토스트, AI 코스 문서 렌더링, Gemini API 호출 안정성, 로컬 빌드 검증
- **요약**: CodeRabbit 리뷰를 통해 위시리스트 토글 실패 시에도 성공 메시지가 표시될 수 있는 구조와 `plan.days` 비정상 데이터 렌더링 위험, Gemini API 네트워크 예외 처리 부족 문제가 확인되었습니다.
- **처리**: 위시리스트 토글 반환값을 `{ success, wishlisted, error }` 구조로 변경하고, AI 코스 문서 렌더링 방어값과 Gemini API timeout/retry 처리를 보완했습니다.
- **확인**: ESLint와 production build를 통과했으며, 기존 React Hook dependency 경고와 번들 크기 경고만 유지되었습니다.
- **보류**: `REGION_MATCHERS/getRegionKey` 공통 유틸 추출은 후속 리팩터링으로 분리했습니다.
- **상세 기록**: [2026-07-24 개발 로그](project-log/2026-07-24.md)의 CodeRabbit 리뷰 피드백 대응 섹션 참고

## 12. 같은 AI 코스를 여러 폴더에 저장하면 기존 폴더의 장소가 사라지는 문제

- **발생일**: 2026-07-24
- **영향 범위**: AI 여행 코스 저장, 위시리스트 폴더별 장소 카운트, 마이페이지 폴더 목록
- **요약**: 같은 조건의 AI 코스를 여러 폴더에 저장하면 이전 폴더에 있던 관광공사 검증 장소가 새 폴더로 이동되어 기존 폴더의 장소 수가 `0`으로 표시되었습니다.
- **처리**: 기존 카드 재사용 기준을 `contentId` 단독에서 `contentId + folder_id`로 변경해 폴더별 카드가 독립 저장되도록 수정했습니다.
- **확인**: 같은 장소가 여러 폴더에 저장되어도 기존 폴더의 카드와 카운트가 유지되는 것을 확인했습니다.
- **상세 기록**: [2026-07-24 개발 로그](project-log/2026-07-24.md)의 AI 코스 중복 저장 시 기존 폴더 장소 이동 문제 수정 섹션 참고

## 13. 위시리스트 폴더 선택 시 다른 폴더 여행지가 함께 표시되는 문제

- **발생일**: 2026-07-24
- **영향 범위**: 마이페이지 위시리스트 폴더 필터링, 카드 렌더링, 폴더별 장소 목록
- **요약**: 특정 폴더를 선택해도 다른 폴더의 여행지 카드가 함께 보이는 문제가 있었습니다.
- **처리**: 폴더별 카드 목록을 선택 폴더의 `folder_id` 기준으로만 필터링하고, React key를 Firebase wishlist record `id` 우선으로 사용하도록 변경했습니다.
- **확인**: 폴더 선택 시 카드 하단 `FOLDER:` 라벨이 현재 선택 폴더와 일치하고, `ALL_PLACES`에서는 전체 저장 장소가 표시되는 것을 확인했습니다.
- **상세 기록**: [2026-07-24 개발 로그](project-log/2026-07-24.md)의 위시리스트 폴더 선택 시 다른 폴더 여행지가 함께 보이는 문제 보정 섹션 참고

## 14. AI 추천 장소가 위시리스트 카드 목록에 보이지 않는 현상

- **발생일**: 2026-07-24
- **영향 범위**: AI 코스 문서, 위시리스트 카드 목록, 사용자 데이터 확인 흐름
- **요약**: AI 추천 장소가 위시리스트 카드 목록에 표시되지 않아 데이터가 삭제된 것처럼 보일 수 있었습니다.
- **처리**: 관광공사 검증 장소와 AI 추천 장소의 표시 기준을 문서화했습니다. `TourAPI verified` 장소만 위시리스트 카드로 저장하고, `AI 추천` 장소는 코스 문서 내부에만 보관합니다.
- **확인**: AI 추천 장소는 삭제된 것이 아니라 코스 문서 일정 안에 유지되는 것을 확인했습니다.
- **상세 기록**: [2026-07-24 개발 로그](project-log/2026-07-24.md)의 AI 추천 장소와 위시리스트 카드 표시 기준 정리 섹션 참고

## 15. 같은 contentId 장소 삭제 시 다른 폴더 카드까지 삭제될 수 있는 문제

- **발생일**: 2026-07-25
- **영향 범위**: 위시리스트 카드 삭제, 폴더별 동일 장소 관리
- **요약**: 같은 관광공사 `contentId`를 가진 장소가 여러 폴더에 저장된 경우, 한 폴더의 카드 삭제가 다른 폴더의 동일 장소 카드까지 삭제할 수 있는 위험이 확인되었습니다.
- **처리**: 삭제 대상을 `contentId`가 아닌 Firebase wishlist record `id`로 한정하고, 삭제 후 반환값에서 최종 삭제 상태를 확인하도록 보완했습니다.
- **확인**: 같은 장소가 여러 폴더에 있을 때 선택한 카드 1개만 삭제되는지 검증 대상으로 정리했습니다.
- **상세 기록**: [2026-07-25 개발 로그](project-log/2026-07-25.md)의 같은 contentId 장소 삭제 시 다른 폴더 카드까지 삭제될 수 있는 문제 섹션 참고

## 16. Gemini 응답 본문 소비 지연 시 생성 상태가 오래 유지될 수 있는 문제

- **발생일**: 2026-07-25
- **영향 범위**: AI 여행 코스 생성, Gemini API 응답 처리, 생성 중 상태 표시
- **요약**: `fetch()` 요청 자체에는 timeout이 있었지만, 응답 본문을 `json()` 또는 `text()`로 읽는 단계에는 별도 timeout이 없어 생성 상태가 오래 유지될 수 있었습니다.
- **처리**: Gemini 응답 본문 소비에도 45초 timeout을 적용하고, 지연 또는 파싱 실패 시 사용자 친화 메시지를 반환하도록 보완했습니다.
- **확인**: Gemini 생성 요청의 네트워크 예외, HTTP 재시도, 본문 소비 지연이 분리 처리되도록 정리했습니다.
- **상세 기록**: [2026-07-25 개발 로그](project-log/2026-07-25.md)의 Gemini 응답 본문 소비 지연 시 생성 상태가 오래 유지될 수 있는 문제 섹션 참고

## 17. 날씨/지역 API가 캐시 없이 반복 호출될 수 있는 문제

- **발생일**: 2026-07-29
- **영향 범위**: 메인 홈 화면, 날씨 기반 추천, 현재 위치 기반 지역명 표시
- **요약**: TourAPI 계열은 공통 캐시를 사용하고 있었지만, Open-Meteo 날씨 API와 Nominatim reverse geocoding API는 직접 호출 구조로 남아 있어 홈 화면 진입과 위치 갱신 시 반복 호출될 수 있었습니다.
- **처리**: `getWeather()`와 `getLocationName()`에 `cachedApiRequest()`를 적용하고, 좌표 반올림 기반 캐시 키와 TTL 정책을 추가했습니다.
- **확인**: ESLint와 production build를 통해 import, 번들링, 문법 오류가 없는 것을 확인했습니다.
- **상세 기록**: [2026-07-29 개발 로그](project-log/2026-07-29.md)의 날씨/지역 API 캐시 적용 섹션 참고

## 18. Vite build 임시 파일 생성 권한 오류

- **발생일**: 2026-07-29
- **영향 범위**: 로컬 production build 검증
- **요약**: sandbox 환경에서 `npm run build` 실행 시 Vite가 `node_modules/.vite-temp` 하위 임시 파일을 생성하지 못해 `EPERM` 오류가 발생했습니다.
- **처리**: 동일 명령을 권한 상승 후 재실행했습니다.
- **확인**: 권한 상승 후 production build가 정상 완료되었습니다.
- **상세 기록**: [2026-07-29 개발 로그](project-log/2026-07-29.md)의 Vite build 임시 파일 생성 권한 오류 섹션 참고

## 19. Firebase Functions Secret 등록과 배포에 Blaze 요금제가 필요한 문제

- **발생일**: 2026-08-16
- **영향 범위**: Gemini Callable Function 배포, Functions Secret 등록, 공개 AI 생성 기능
- **요약**: Gemini API 키를 클라이언트 번들에서 제거하고 Functions Secret으로 이전하려면 Firebase Functions와 Secret Manager 사용이 필요했습니다. 이 과정에서 Spark 요금제만으로는 Secret 등록과 Functions 배포를 완료할 수 없어 Blaze 요금제 전환이 필요했습니다.
- **처리**: Firebase 프로젝트 `newagent-9c2a8`을 Blaze 요금제로 전환하고 예산 알림을 설정한 뒤, `GEMINI_API_KEY` Secret 등록과 `generateTripPlan` Callable Function 배포를 진행했습니다.
- **확인**: `generateTripPlan` v2 Callable Function이 `asia-northeast3` 리전에 배포되었고, Hosting 배포 후 인증 smoke test까지 완료했습니다.
- **상세 기록**: [2026-08-16 개발 로그](project-log/2026-08-16.md)의 Firebase Functions Secret 등록과 배포에 Blaze 요금제가 필요한 문제 섹션 참고

## 20. Gemini 429 RESOURCE_EXHAUSTED와 AI Studio 크레딧 부족 문제

- **발생일**: 2026-08-16
- **영향 범위**: AI Planner, Gemini Callable Function, 공개 시연용 AI 일정 생성
- **요약**: Functions 배포와 인증 흐름은 정상임에도 AI Planner 생성 요청이 429로 실패했습니다. 직접 Gemini 최소 호출을 확인한 결과 Google AI Studio 선불 크레딧 부족으로 `RESOURCE_EXHAUSTED`가 발생한 것으로 판단했습니다.
- **처리**: Google AI Studio에서 선불 크레딧을 충전한 뒤 신규 호출을 재검증했습니다. 이후 quota 보호를 위해 Gemini 429 응답은 재시도하지 않고 사용자에게 대기 안내를 반환하는 방향으로 재시도 정책을 조정했습니다.
- **확인**: Gemini 최소 호출이 200으로 응답했고, 테스트 계정 기반 `generateTripPlan` Callable smoke test가 성공했습니다.
- **상세 기록**: [2026-08-16 개발 로그](project-log/2026-08-16.md)의 Gemini 429 RESOURCE_EXHAUSTED와 AI Studio 크레딧 부족 문제 섹션 참고

## 21. Gemini API 키의 클라이언트 노출 가능성 제거

- **발생일**: 2026-08-16
- **영향 범위**: AI Planner, Gemini API 키 보안, Firebase Hosting 공개 배포
- **요약**: 기존 구조는 브라우저에서 Gemini API를 직접 호출할 수 있어 공개 Hosting 배포 시 API 키 노출과 호출 남용 위험이 있었습니다.
- **처리**: Gemini 호출을 Firebase Callable Function `generateTripPlan`으로 이전하고, API 키를 Firebase Functions Secret `GEMINI_API_KEY`로 관리하도록 변경했습니다. 신규 Gemini 키를 Secret version 2로 반영하고 기존 노출 가능 키는 AI Studio에서 삭제했습니다.
- **확인**: `dist` 산출물에서 Gemini API 키 원문이 발견되지 않았고, 미인증 요청은 401로 차단되었으며, 인증된 테스트 계정의 Callable smoke test가 성공했습니다.
- **상세 기록**: [2026-08-16 개발 로그](project-log/2026-08-16.md)의 Gemini API 키의 클라이언트 노출 가능성 제거 섹션 참고

## 22. 배포 환경에서 카카오 지도 SDK가 로딩되지 않는 문제

- **발생일**: 2026-08-16
- **영향 범위**: 여행지 상세 페이지, 행사 상세 페이지, 카카오 지도 JavaScript SDK, Firebase Hosting 배포 URL
- **요약**: 상세 페이지의 지도 영역에서 카카오 지도 SDK가 정상 표시되지 않았습니다. 코드상 fallback은 동작했지만, 실제 배포 환경에서는 카카오 JavaScript 키와 JavaScript SDK 도메인 설정이 CodeTrip 배포 도메인과 맞지 않아 지도가 표시되지 않았습니다.
- **처리**: 무료 쿼터가 적용된 기존 카카오 앱을 재활성화하고, JavaScript SDK 도메인에 `http://localhost:5180`과 `https://dorigum-codetrip.web.app`을 추가했습니다. `.env`의 `VITE_KAKAO_MAP_API_KEY`를 해당 앱의 JavaScript 키로 교체하고, `TravelDetail.jsx`의 SDK 로딩 방어 로직을 보강했습니다.
- **확인**: 로컬 상세 페이지와 Firebase Hosting 배포 상세 페이지에서 카카오 지도가 정상 표시되는 것을 확인했습니다. `npm run lint`와 `npm run build`도 통과했습니다.
- **상세 기록**: [2026-08-16 개발 로그](project-log/2026-08-16.md)의 배포 환경에서 카카오 지도 SDK가 로딩되지 않는 문제 최종 보정 섹션 참고

## 23. 로그아웃 시 보호 라우트 로그인 안내 모달이 순간적으로 표시되는 문제

- **발생일**: 2026-08-22
- **영향 범위**: 보호 라우트, 로그아웃 UX, Header, SideBar, AI Planner, My Page, Board
- **요약**: 로그인한 사용자만 접근 가능한 페이지에서 로그아웃하면 홈으로 이동하기 직전 보호 라우트가 비로그인 접근으로 판단해 로그인 안내 모달을 순간적으로 표시할 수 있었습니다.
- **처리**: 명시적인 로그아웃 흐름에서 `codetrip:logout_redirecting` 플래그를 저장하고, `ProtectedRoute`가 해당 플래그를 감지하면 로그인 안내 모달을 렌더링하지 않고 홈으로 이동하도록 수정했습니다.
- **확인**: `npm run lint`와 `npm run build`를 통과했습니다. 로그아웃 리다이렉션 제품 코드 변경 파일은 `Header.jsx`, `SideBar.jsx`, `ProtectedRoute.jsx` 3개로 제한했고, 관련 문서 변경은 트러블슈팅과 프로젝트 로그에 기록했습니다.
- **상세 기록**: [2026-08-22 개발 로그](project-log/2026-08-22.md)의 로그아웃 시 보호 라우트 로그인 안내 모달이 순간적으로 표시되는 문제 섹션 참고

## 24. AI 플래너 폴더 일정과 비동기 폴더 선택 결과가 사용자 입력과 어긋날 수 있는 문제

- **발생일**: 2026-08-23
- **영향 범위**: AI Planner, 폴더 기반 AI 일정 생성, 마이페이지 폴더 일정, CodeRabbit PR #28 리뷰 대응
- **요약**: 폴더 기반 AI 일정 생성에서 폴더의 시작일·종료일·일수가 서로 다른 기준으로 처리되거나, 폴더 장소 주소 보강 결과가 늦게 도착해 사용자가 수정한 지역 입력을 덮어쓸 수 있는 문제가 있었습니다.
- **처리**:
  - 폴더 일정이 모두 비어 있는 경우만 기본값을 유지하고, 시작일 또는 종료일이 누락·무효·역전·5일 초과인 경우에는 유효한 1~5일 범위로 정규화하도록 했습니다.
  - 폴더 선택 후 `hydratePlaceAddresses()`가 완료되기 전 사용자가 지역·날짜·생성 조건을 바꾸거나 생성 흐름을 시작하면, 이전 폴더 선택 결과가 `regionName`을 자동 반영하지 않도록 `requestId`와 `plannerRevisionRef`를 함께 검증했습니다.
- **확인**: `npm run lint`와 `npm run build`를 통과했습니다. 기존 React Hook warning 11개와 Vite 500kB 초과 청크 경고는 유지됩니다.
- **상세 기록**: [2026-08-23 개발 로그](project-log/2026-08-23.md)의 AI 플래너 폴더 일정 정규화 보완, 비동기 폴더 선택 최신성 검증 보완 섹션 참고

## 25. TourAPI 신규 여행지 스케줄 함수 배포 후 DB 경로가 바로 생성되지 않는 문제

- **발생일**: 2026-08-25
- **영향 범위**: Firebase Functions `syncTourApiUpdates`, Realtime Database `tourApiUpdates/items`, `tourApiUpdates/state`, Header 알림
- **요약**: `syncTourApiUpdates` Scheduled Function은 배포 직후 즉시 실행되는 함수가 아니므로, Firebase Console에서 함수가 정상 배포되어도 요청 수가 0이면 Realtime Database에 `tourApiUpdates/items`와 `tourApiUpdates/state` 경로가 아직 보이지 않을 수 있습니다.
- **처리**: Functions 화면에서 `syncTourApiUpdates`가 `asia-northeast3` 리전의 v2 스케줄 함수로 배포된 것을 확인했습니다. 즉시 DB 경로가 없는 상태는 “아직 스케줄 실행 전”으로 분류하고, 다음 스케줄 실행 후 Functions 로그와 Realtime Database 경로를 재확인하기로 했습니다.
- **확인**: Firebase Console에서 `syncTourApiUpdates` 요청 수가 0이고 호출 그래프에 데이터가 없는 상태를 확인했습니다. 후속 확인은 스케줄 실행 이후 진행합니다.
- **상세 기록**: [2026-08-25 개발 로그](project-log/2026-08-25.md)의 TourAPI 신규 여행지 알림 구조 추가 및 CodeRabbit 피드백 반영 섹션 참고

## 26. TourAPI 신규 여행지 동기화가 실패 응답을 성공한 빈 결과로 기록할 수 있는 문제

- **발생일**: 2026-08-25
- **영향 범위**: Firebase Functions `syncTourApiUpdates`, TourAPI 신규 여행지 알림, Realtime Database `tourApiUpdates/state`
- **요약**: TourAPI HTTP 응답이 200이어도 `response.header.resultCode`가 실패 코드이거나 `response.body.items.item` 구조가 없으면 실제 동기화 실패입니다. 기존 구조에서는 이런 응답을 빈 결과처럼 처리할 가능성이 있어 신규 여행지 알림 실패를 정상 실행으로 오해할 수 있었습니다.
- **처리**: `resultCode === "0000"` 검증과 `response.body.items.item` 구조 검증을 추가했습니다. 실패 코드 또는 잘못된 응답 구조는 오류로 던져 동기화 실패로 기록되도록 했습니다. 신규 등록 감지 목적에 맞게 TourAPI 조회 정렬 기준도 이미지 포함 등록일 최신순으로 변경했습니다.
- **확인**: `npm --prefix functions run lint`, `npm run lint`, `npm run build`가 통과했습니다. 기존 React Hook warning 11개와 Vite 500kB 초과 청크 경고는 유지됩니다.
- **상세 기록**: [2026-08-25 개발 로그](project-log/2026-08-25.md)의 TourAPI 신규 여행지 알림 CodeRabbit 피드백 반영 섹션 참고

## 27. 프로필 이미지 data URL이 Firebase Auth photoURL 제한을 초과하는 문제

- **발생일**: 2026-08-25
- **영향 범위**: 프로필 수정 화면, Firebase Authentication `photoURL`, 게시글 이미지 첨부 UX
- **요약**: 데스크톱 파일을 프로필 이미지로 선택하면 기존 구현이 이미지를 base64 data URL로 변환해 `photoURL`에 저장했습니다. 이 값이 길어지면 Firebase Auth가 `auth/invalid-profile-attribute` 오류를 반환해 프로필 저장이 실패했습니다. 게시글 이미지도 외부 URL 직접 입력에 의존해 사용자가 로컬 이미지를 첨부하기 어려웠습니다.
- **처리**: 프로필 이미지와 게시글 이미지를 Firebase Storage에 업로드하고, 다운로드 URL만 프로필 또는 Markdown 본문에 저장하도록 변경했습니다. Storage Rules는 `users/{uid}/profile`, `users/{uid}/board` 경로에 대해 동일 UID만 이미지 파일을 쓸 수 있도록 제한했습니다.
- **확인**: `npm run lint`와 `npm run build`를 통과했습니다. 기존 React Hook warning 11개와 Vite 500kB 초과 청크 경고는 유지됩니다. 실제 확인은 Storage Rules와 Hosting 배포 후 프로필 이미지 업로드·저장, 게시글 이미지 업로드·미리보기·상세 표시 흐름으로 수행합니다.
- **상세 기록**: [2026-08-25 개발 로그](project-log/2026-08-25.md)의 프로필·게시글 이미지 Firebase Storage 업로드 전환 섹션 참고

## 28. TourAPI 정상 빈 응답이 동기화 실패로 오인될 수 있는 문제

- **발생일**: 2026-08-25
- **영향 범위**: Firebase Functions `syncTourApiUpdates`, TourAPI 신규 여행지 알림, Realtime Database `tourApiUpdates/state`
- **요약**: 한국관광공사 TourAPI는 조회 결과가 없을 때도 `resultCode: "0000"`, `totalCount: "0"`, `items: ""` 형태의 정상 응답을 반환할 수 있습니다. 이 경우를 응답 구조 오류로 처리하면 신규 데이터가 없는 정상 상태를 장애로 오해할 수 있습니다.
- **처리**: TourAPI 응답 파싱 로직을 분리하고, `totalCount`가 0이면 빈 배열로 반환하도록 수정했습니다. 반대로 `totalCount`가 0이 아닌데 `items.item`이 없으면 구조 오류로 유지했습니다.
- **확인**: 정상 빈 응답 fixture, 비정상 누락 구조 fixture, 단일 item 정규화 fixture를 `functions/test/tourApiUpdates.test.js`에 추가했고, `npm --prefix functions test`에서 3건 모두 통과했습니다.
- **상세 기록**: [2026-08-25 개발 로그](project-log/2026-08-25.md)의 PR #29 CodeRabbit 추가 피드백 반영 섹션 참고

## 29. 작은 용량의 초고해상도 이미지가 압축 없이 업로드될 수 있는 문제

- **발생일**: 2026-08-25
- **영향 범위**: Firebase Storage 이미지 업로드, 프로필 이미지, 게시글 첨부 이미지, 모바일 렌더링 성능
- **요약**: 기존 압축 로직은 파일 용량이 1MB 이하이면 바로 원본을 반환했습니다. 이 경우 용량은 작지만 해상도가 큰 이미지가 그대로 업로드되어 렌더링 비용이 커질 수 있었습니다.
- **처리**: 업로드 전 모든 이미지의 실제 해상도를 확인하고, 가로 또는 세로가 1920px을 초과하면 용량과 관계없이 리사이즈하도록 수정했습니다.
- **확인**: `src/api/storageApi.js`에서 이미지 로드 후 해상도 기준을 먼저 계산하도록 변경했습니다. 실제 업로드 검증은 Storage 배포 환경에서 프로필 이미지와 게시글 이미지 첨부 흐름으로 확인합니다.
- **상세 기록**: [2026-08-25 개발 로그](project-log/2026-08-25.md)의 PR #29 CodeRabbit 추가 피드백 반영 섹션 참고

## 30. 프로필 이미지 변경 시 Storage 파일이 계속 누적될 수 있는 문제

- **발생일**: 2026-08-25
- **영향 범위**: 프로필 수정 화면, Firebase Storage `users/{uid}/profile`, Storage 사용량
- **요약**: 프로필 이미지를 바꿀 때마다 timestamp 기반 새 파일이 생성되어 이전 프로필 이미지가 Storage에 계속 남을 수 있었습니다.
- **처리**: 프로필 이미지는 `users/{uid}/profile/avatar` 고정 경로에 업로드해 덮어쓰기 방식으로 관리하도록 수정했습니다. 같은 URL 캐시 문제를 줄이기 위해 저장 URL에는 업로드 시각 기반 `v` 쿼리 파라미터를 추가합니다.
- **확인**: 게시글 이미지는 과거 게시글 본문 참조를 유지해야 하므로 기존 timestamp 누적 저장 방식을 유지합니다. 프로필 이미지는 배포 후 여러 번 변경하면서 Storage `profile/avatar` 객체만 갱신되는지 확인합니다.
- **상세 기록**: [2026-08-25 개발 로그](project-log/2026-08-25.md)의 프로필 이미지 저장 경로 보정 섹션 참고

## 31. 이미지 압축 실패 시 업로드 제한을 우회할 수 있는 문제

- **발생일**: 2026-08-25
- **영향 범위**: Firebase Storage 이미지 업로드, 프로필 이미지, 게시글 첨부 이미지
- **요약**: 이미지 압축 과정에서 Canvas context 생성 실패, Blob 생성 실패, 이미지 로드 실패가 발생하면 원본 파일을 그대로 반환할 수 있었습니다. 이 경우 1MB 또는 1920px 제한을 만족하지 않는 이미지가 Storage 업로드로 이어질 수 있었습니다.
- **처리**: 압축 실패와 기준 초과 상황을 업로드 실패로 처리하도록 변경했습니다. 압축 결과가 1MB 이하가 되지 않으면 사용자에게 용량 제한 안내 오류를 반환합니다.
- **확인**: `npm run lint`와 `npm run build`로 정적 검증과 production build를 확인합니다. 배포 후에는 초과 용량 이미지 업로드 실패 안내와 정상 이미지 업로드 성공 흐름을 수동 검증합니다.
- **상세 기록**: [2026-08-25 개발 로그](project-log/2026-08-25.md)의 PR #29 CodeRabbit 추가 피드백 2차 반영 섹션 참고

## 32. 읽은 TourAPI 알림 삭제가 최신 10개에만 적용될 수 있는 문제

- **발생일**: 2026-08-25
- **영향 범위**: Header 알림, TourAPI 신규 여행지 알림, 사용자별 `tourApiUpdateReads`
- **요약**: `deleteReadNotifications()`가 표시용 기본 제한을 사용하면 최신 10개를 초과하는 읽은 TourAPI 알림은 숨김 처리되지 않고 목록에 남을 수 있었습니다.
- **처리**: 읽은 알림 삭제 시에는 `limit: null`로 TourAPI 알림 전체를 조회하도록 수정했습니다. 표시용 조회 제한과 일괄 상태 변경용 조회 범위를 분리했습니다.
- **확인**: 10개를 초과하는 TourAPI 알림 데이터가 누적된 상태에서 읽은 알림 삭제를 실행해 오래된 읽은 알림까지 숨김 처리되는지 배포 환경에서 추가 확인합니다.
- **상세 기록**: [2026-08-25 개발 로그](project-log/2026-08-25.md)의 PR #29 CodeRabbit 추가 피드백 2차 반영 섹션 참고

## 참고 사항

- 로컬 및 배포 관련 환경은 [CodeTrip 실행 가이드](guides/Guide.md) 혹은 [Firebase 배포 가이드](guides/Project_Firebase_배포.md)를 참고하세요.
- 새로운 트러블슈팅 이력은 날짜별 로그에 상세 기록을 작성한 뒤, 이 색인 문서에는 요약 형태로 추가합니다.
