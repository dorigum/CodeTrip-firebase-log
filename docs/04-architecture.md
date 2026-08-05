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

## 캐시 정책

현재 정책 기준: 여행지 목록 12시간, 키워드 검색 6시간, 상세·이미지 14일, 지역코드 30일, 날씨 1시간, 지오코딩 30일. 캐시 키는 요청 조건을 모두 반영하고 만료 시 원천 API를 재호출한다.

## 주요 설계 원칙

- 공공 API 데이터는 캐시로 호출량과 응답 지연을 줄인다.
- 개인 데이터는 Firebase UID를 기준으로 분리한다.
- AI 결과는 확정된 공공 데이터와 추천 텍스트를 구분한다.
- 외부 의존성은 실패를 전제로 로딩·fallback·재시도를 제공한다.

## 구조적 한계

브라우저가 외부 API를 직접 호출하므로 키 보호, CORS, 공급자 장애에 민감하다. 상용화 시 서버리스 함수 또는 백엔드 프록시, 비밀관리, 관측성 도입을 검토한다.
