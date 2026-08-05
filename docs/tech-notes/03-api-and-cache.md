# API 연계와 캐시

## 핵심 주제

- 외부 API의 입력·출력·오류 계약
- 캐시 키, TTL, 만료 처리
- 메모리·localStorage·Realtime Database 캐시의 차이
- 중복 요청 방지와 재시도
- 공급자 장애 시 fallback

## CodeTrip 적용 위치

공공 여행 정보, 날씨, 지오코딩, 지도, Gemini 연계는 `src/api`에서 관리한다. `src/api/apiCache.js`의 공통 정책과 각 API의 TTL을 함께 기록해야 실제 동작과 문서가 어긋나지 않는다.
