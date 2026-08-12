# 기술 아키텍처

## 구성

```text
사용자 브라우저
  └─ React 19 / React Router / Tailwind CSS / Zustand
       ├─ Firebase Authentication
       ├─ Firebase Realtime Database
       ├─ Firebase Hosting (Vite dist)
       ├─ TourAPI
       ├─ Open-Meteo / Nominatim
       ├─ Kakao Maps SDK
       └─ Gemini API
```

프론트엔드는 `pages`, `components`, `store`, `hooks`, `api`로 구분된다. `apiCache`가 메모리·localStorage·Realtime Database 캐시를 공통으로 다루며, Firebase SDK를 브라우저에서 직접 사용한다.

## 번들 구조와 코드 스플리팅 계획

현재 라우팅은 `src/main.jsx`에서 페이지 컴포넌트를 정적 import하는 구조다. Vite 빌드가 500kB 초과 청크 경고를 출력할 수 있으므로, 성능 개선 과제로 라우트 단위 코드 스플리팅을 검토한다. 1차 대상은 초기 진입에 반드시 필요하지 않은 `AiPlanner`, `Board`, `BoardWrite`, `BoardDetail`, `MyPage`, `Settings`, `TravelDetail`, `Festivals` 화면이다.

적용 순서는 먼저 `React.lazy`와 `Suspense`로 라우트 단위 lazy loading을 적용하고, 적용 전후 `npm run build`의 청크 크기를 비교한다. 이후에도 특정 vendor 청크가 과도하게 크면 `vite.config.js`의 `build.rollupOptions.output.manualChunks`로 Firebase, React, 지도·마크다운 관련 의존성 분리를 검토한다. 이 항목은 아직 성능 개선 계획이며, 실제 완료 여부는 빌드 로그와 측정표로 증빙한다.

## 캐시 정책

현재 정책 기준: 여행지 목록 12시간, 키워드 검색 6시간, 여행지 상세 14일, 갤러리 이미지 1일, 지역코드 30일, 날씨 1시간, 지오코딩 30일. 캐시 키는 요청 조건을 모두 반영하고 만료 시 원천 API를 재호출한다. 외부 API 호출 실패 시 유효한 stale 캐시가 있으면 이를 fallback으로 사용한다.

## 주요 설계 원칙

- 공공 API 데이터는 캐시로 호출량과 응답 지연을 줄인다.
- 개인 데이터는 Firebase UID를 기준으로 분리한다.
- AI 결과는 확정된 공공 데이터와 추천 텍스트를 구분한다.
- 외부 의존성은 실패를 전제로 로딩·fallback·재시도를 제공한다.

## 구조적 한계

브라우저가 외부 API를 직접 호출하므로 키 보호, CORS, 공급자 장애에 민감하다. 상용화 시 서버리스 함수 또는 백엔드 프록시, 비밀관리, 관측성 도입을 검토한다.
