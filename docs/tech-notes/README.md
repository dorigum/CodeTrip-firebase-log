# CodeTrip 기술 노트

이 문서는 CodeTrip을 개발·운영하면서 배우고 결정한 내용을 주제별로 축적하는 기술 노트입니다. 한 문서에 모든 설명을 몰아넣지 않고, `영역 → 하위 주제 → 실제 프로젝트 적용` 순서로 확장합니다.

## 전체 마인드맵

```text
CodeTrip 기술 노트
├─ 01. 웹 개발 기초
│  ├─ 브라우저와 HTTP
│  ├─ 비동기 JavaScript
│  ├─ 상태와 데이터 흐름
│  └─ 인증과 세션
├─ 02. React 프론트엔드
│  ├─ 컴포넌트 설계
│  ├─ React Hooks
│  ├─ React Router
│  ├─ Zustand 상태관리
│  ├─ 폼·로딩·오류 UX
│  └─ 반응형·접근성
├─ 03. API와 데이터 연계
│  ├─ REST API
│  ├─ TourAPI
│  ├─ 날씨·지오코딩 API
│  ├─ Kakao Maps SDK
│  ├─ API 캐시와 TTL
│  └─ 외부 API 장애 대응
├─ 04. Firebase
│  ├─ Authentication
│  ├─ Realtime Database
│  ├─ 데이터 모델링
│  ├─ Security Rules
│  ├─ Hosting
│  └─ 비용·쿼터·운영
├─ 05. 생성형 AI
│  ├─ Gemini API 연계
│  ├─ 프롬프트 설계
│  ├─ 구조화된 출력
│  ├─ 검증 데이터와 추천 데이터 구분
│  ├─ 실패·재시도·fallback
│  └─ 비용·안전·개인정보
├─ 06. 소프트웨어 공학
│  ├─ 요구사항과 사용자 스토리
│  ├─ MVP와 우선순위
│  ├─ 경량 애자일
│  ├─ WBS와 릴리스
│  ├─ 기술부채
│  └─ 의사결정 기록
├─ 07. 품질·보안·성능
│  ├─ lint와 build
│  ├─ 테스트 전략
│  ├─ Firebase 권한 검증
│  ├─ 성능 측정
│  ├─ 번들 크기와 코드 스플리팅
│  └─ 장애·관측성
└─ 08. 배포·운영
   ├─ Vite 빌드
   ├─ Firebase Hosting 배포
   ├─ 환경변수 관리
   ├─ 릴리스 체크리스트
   ├─ 장애 대응
   └─ 회고와 개선
```

## 우선 작성할 노트

| 순서 | 노트 | CodeTrip 적용 질문 |
|---|---|---|
| 1 | Firebase Realtime Database 모델링 | 왜 이 계층 구조와 역색인을 선택했는가? |
| 2 | Firebase Security Rules | 사용자는 어떤 데이터에 접근할 수 있는가? |
| 3 | API 캐시 설계 | TTL과 캐시 위치를 어떻게 정했는가? |
| 4 | Gemini 프롬프트 설계 | AI 결과의 신뢰성과 오류를 어떻게 다루는가? |
| 5 | React 상태관리 | 서버 데이터와 UI 상태를 어떻게 분리하는가? |
| 6 | 외부 API 장애 대응 | API가 느리거나 실패해도 서비스가 어떻게 동작하는가? |
| 7 | 테스트 전략 | 핵심 사용자 여정을 어떻게 검증하는가? |
| 8 | Firebase Hosting 배포 | 어떤 조건을 통과해야 배포하는가? |

## 노트 작성 형식

각 노트는 다음 순서를 권장합니다.

1. 한 줄 정의
2. 왜 필요한가
3. 핵심 개념
4. CodeTrip에서의 적용 위치
5. 간단한 코드·데이터 예시
6. 선택한 이유와 대안
7. 실패 사례와 주의점
8. 관련 문서·다음 학습 주제

## 기존 문서와의 관계

- 프로젝트의 확정 정책: [`../04-architecture.md`](../04-architecture.md), [`../05-data-security.md`](../05-data-security.md)
- 제품·일정·운영 기준: [`../02-product-requirements.md`](../02-product-requirements.md), [`../07-wbs-roadmap.md`](../07-wbs-roadmap.md), [`../08-operations-release.md`](../08-operations-release.md)
- 날짜별 개발 기록: [`../../CodeTrip_Firebase/project-log/`](../../CodeTrip_Firebase/project-log/)

기술 노트는 학습·설명용이고, 실제 운영 기준이 바뀌면 위의 프로젝트 기준 문서를 먼저 갱신한 뒤 관련 노트를 보완합니다.
