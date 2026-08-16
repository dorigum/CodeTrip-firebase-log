# 기술 부채 등록부

이 문서는 CodeTrip MVP에서 확인되었거나 문서상 관리 대상으로 정의된 기술 부채를 추적합니다. 기술 부채는 결함과 동일하지 않으며, 현재 MVP 목표를 달성하는 데 허용했지만 이후 품질·보안·운영 리스크를 줄이기 위해 해결해야 하는 항목입니다.

상태는 다음 기준으로 관리합니다.

- `identified`: 문제와 영향이 식별됨
- `planned`: 해결 방향과 완료 기준이 정리됨
- `in_progress`: 구현 또는 검증 진행 중
- `resolved`: 코드, 테스트, 문서, 배포 증빙으로 해결 확인
- `accepted`: MVP 범위에서는 의식적으로 수용하고 이후 백로그로 이동

## 등록 항목

| ID | 기술 부채 | 영향 | 현재 상태 | 우선순위 | 해결 기준 | 증빙 |
|---|---|---|---|---|---|---|
| TD-01 | Vite 500kB 초과 청크 경고 | 초기 로딩 성능 저하, 모바일 네트워크 체감 지연 가능성 | planned | P1 | 라우트 단위 코드 스플리팅 적용 전후 `npm run build` 청크 크기 비교, 남은 500kB 초과 청크 원인 기록 | `docs/04-architecture.md`, `docs/06-quality-plan.md`, `docs/09-metrics.md` |
| TD-02 | Gemini API 키의 클라이언트 번들 노출 가능성 | 공개 배포 환경에서 비밀키 보호 한계, 호출 남용 가능성 | planned | P0 | Firebase Functions 또는 동등한 서버 프록시로 Gemini 호출 이전, 클라이언트 번들에서 `VITE_GEMINI_API_KEY` 제거 확인 | `docs/10-ai-harness-engineering.md`, `docs/05-data-security.md` |
| TD-03 | 성능·캐시·AI 성공률의 누적 측정값 부재 | KPI를 정량 성과로 주장하기 어려움 | planned | P1 | 릴리스별 측정표에 로딩, API 응답, 캐시 이벤트, AI 성공·실패 이벤트를 기록 | `docs/06-quality-plan.md`, `docs/09-metrics.md` |
| TD-04 | 핵심 사용자 여정 자동 테스트 부재 | 회귀 위험을 수동 확인에 의존 | identified | P1 | 대표 여정 E2E 또는 시나리오 테스트 도입 여부 결정, 최소 수동 검증 보고서 작성 | `docs/06-quality-plan.md`, `docs/07-wbs-roadmap.md` |
| TD-05 | Firebase Rules 검증의 자동화 부족 | 사용자 소유 데이터와 커뮤니티 권한 회귀 위험 | identified | P0 | Rules 변경 시 권한 시나리오 검증 결과 기록, 가능하면 Emulator 기반 테스트 도입 | `docs/05-data-security.md`, `database.rules.json` |
| TD-06 | 원시 운영 로그 구조 미확정 | 장애 분석·성능 분석 증빙 부족 또는 반대로 개인정보·저장비용 증가 가능성 | planned | P2 | 원시 로그 장기 저장 대신 릴리스별 집계 지표 우선 원칙 유지, 필요한 경우 보존 기간과 Rules 정의 | `docs/06-quality-plan.md`, `docs/09-metrics.md` |
| TD-07 | 의사결정 로그와 회고의 실제 기록 부족 | 기술 선택의 배경과 변경 이유 추적성 부족 | identified | P2 | 주요 결정마다 `decision-log/` 기록 생성, 스프린트 종료 시 `retrospectives/` 기록 추가 | `docs/decision-log/README.md`, `docs/retrospectives/README.md` |
| TD-08 | 외부 API 장애 시나리오의 정량 증빙 부족 | fallback 정책은 있으나 장애 대응 성공률을 수치로 설명하기 어려움 | planned | P2 | TourAPI, Open-Meteo, Nominatim, Gemini 실패 케이스별 사용자 안내와 fallback 결과 기록 | `docs/06-quality-plan.md`, `docs/08-operations-release.md` |

## 우선순위 기준

- P0: 보안, 데이터 권한, 공개 배포 신뢰성에 직접 영향을 주는 항목
- P1: MVP 심사 품질, 성능, 회귀 방지에 큰 영향을 주는 항목
- P2: 운영 성숙도와 장기 유지보수성을 높이는 항목

## 운영 규칙

- 기술 부채가 해결되었다고 주장하려면 코드 변경, 검증 결과, 문서 갱신 중 최소 하나 이상의 증빙 위치를 함께 남깁니다.
- 측정값이 없는 항목은 `resolved`로 표시하지 않습니다.
- MVP 범위에서 해결하지 않기로 결정한 항목은 `accepted`로 바꾸고, 수용 이유와 재검토 조건을 `decision-log/`에 기록합니다.
- 새 기술 부채가 발견되면 이 문서에 먼저 등록하고, WBS 또는 백로그 문서에 실행 작업으로 분리합니다.
