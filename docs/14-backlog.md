# 백로그

이 문서는 CodeTrip MVP 이후 작업을 우선순위에 따라 관리합니다. 백로그 항목은 제품 요구사항, 기술 부채, 품질 계획, WBS와 연결합니다. 완료 여부는 코드 변경, 검증 결과, 문서 갱신, 배포 기록 중 필요한 증빙이 있을 때만 갱신합니다.

## 우선순위 기준

- P0: 보안, 데이터 권한, 공개 배포 신뢰성에 직접 영향을 주며 먼저 처리해야 하는 항목
- P1: MVP 심사 품질, 성능, 회귀 방지, 사용자 경험에 큰 영향을 주는 항목
- P2: 운영 성숙도, 유지보수성, 포트폴리오 설명력을 높이는 항목
- P3: MVP 이후 상용화 또는 확장 단계에서 검토할 항목

## 상태 기준

- `todo`: 작업 정의됨
- `ready`: 바로 착수 가능
- `in_progress`: 진행 중
- `blocked`: 외부 조건 또는 결정 필요
- `done`: 완료 기준과 증빙 확인
- `deferred`: MVP 이후로 연기

## 실행 백로그

| ID | 작업 | 우선순위 | 상태 | 연결 항목 | 완료 기준 | 증빙 위치 |
|---|---|---|---|---|---|---|
| BL-01 | Gemini API 호출을 Firebase Functions 프록시로 이전 | P0 | done | `TD-02`, `FR-05` | 클라이언트 번들에서 Gemini API 키 제거, Function 인증·입력 검증·오류 메시지 정제 확인 | `docs/10-ai-harness-engineering.md`, `docs/13-validation-report.md`, `CodeTrip_Firebase/project-log/2026-08-16.md` |
| BL-02 | Firebase Rules 권한 시나리오 검증표 작성 | P0 | ready | `TD-05`, 비기능 요구사항 | 사용자 소유 데이터, 커뮤니티 수정·삭제, API cache 권한 시나리오 결과 기록 | `docs/13-validation-report.md`, `database.rules.json` |
| BL-03 | 라우트 단위 코드 스플리팅 적용 여부 결정 및 구현 | P1 | ready | `TD-01` | 적용 전후 `npm run build` 청크 크기 비교, 남은 500kB 초과 경고 원인 기록 | `docs/09-metrics.md`, 빌드 로그 |
| BL-04 | 번들 크기 기준선 측정표 작성 | P1 | ready | `TD-01`, 성능 지표 | 현재 빌드의 주요 청크 크기와 경고 여부 기록 | `docs/13-validation-report.md` |
| BL-05 | 핵심 사용자 여정 수동 검증 보고서 작성 | P1 | ready | `TD-04`, `FR-01`~`FR-07` | VF-01~VF-07 결과, 환경, 실패 지점 기록 | `docs/13-validation-report.md` |
| BL-06 | 핵심 사용자 여정 E2E 테스트 도입 검토 | P1 | todo | `TD-04` | 도구 도입 여부 결정, 최소 대표 흐름 1개 자동화 또는 보류 사유 기록 | `docs/06-quality-plan.md`, `decision-log/` |
| BL-07 | 성능·캐시·AI 성공률 릴리스별 측정 방식 확정 | P1 | todo | `TD-03`, `TD-06` | raw log 장기 저장 여부, 집계 지표, 보존 기간, 책임자 결정 | `docs/09-metrics.md`, `decision-log/` |
| BL-08 | 외부 API 장애 시나리오별 smoke test 작성 | P2 | todo | `TD-08` | TourAPI, Open-Meteo, Nominatim, Gemini 실패 시 사용자 안내와 fallback 결과 기록 | `docs/13-validation-report.md` |
| BL-09 | 주요 의사결정 로그 3건 작성 | P2 | ready | `TD-07` | 애자일 문서 체계, AI 분석 규칙, 성능 측정 원칙 결정 기록 작성 | `docs/decision-log/` |
| BL-10 | 스프린트 회고 첫 기록 작성 | P2 | todo | `TD-07` | 문서 체계화 작업의 목표, 잘된 점, 문제, 다음 액션 기록 | `docs/retrospectives/` |
| BL-11 | 심사 시연 시나리오 작성 | P2 | done | WBS 6~8주차 | 탐색, 상세, 로그인, 찜, AI 일정, 마이페이지, 커뮤니티, 품질 설명 흐름 정의 | `docs/15-demo-scenario.md` |
| BL-12 | 상용 예약·결제·관리자 기능 백로그 보관 | P3 | deferred | `FR-08` | MVP 범위 제외 사유와 상용화 단계 재검토 조건 기록 | `docs/02-product-requirements.md`, `decision-log/` |
| BL-13 | 공모전 1차 심사 제출 항목 매핑 | P0 | done | 제출 안내, 기능설명서 양식 | 제출 항목, 기능설명서 슬라이드, OpenAPI 활용 목록, 제출 전 체크리스트 정리 | `docs/16-contest-submission-checklist.md` |
| BL-14 | 기능설명서 PPTX 작성 및 PDF 변환 | P0 | in_progress | 제출 안내, 기능설명서 양식 | 제공 양식 기반 기능설명서 작성, PDF 변환 후 열람 확인, 제출 산출물 manifest 작성 | `docs/17-submission-artifact-manifest.md`, `docs/13-validation-report.md` |

## 추천 처리 순서

1. BL-02: Firebase Rules 권한 시나리오 검증표 작성
2. BL-14: 기능설명서 PPTX 작성 및 PDF 변환
3. BL-04: 번들 크기 기준선 측정표 작성
4. BL-03: 라우트 단위 코드 스플리팅 적용 여부 결정 및 구현
5. BL-05: 핵심 사용자 여정 수동 검증 보고서 작성
6. BL-09: 주요 의사결정 로그 작성

## 운영 규칙

- 백로그 항목은 작업이 끝날 때 `done`으로 바꾸기 전에 검증 보고서 또는 관련 문서의 증빙 위치를 채웁니다.
- 기술 부채에서 파생된 항목은 해결 후 `docs/12-technical-debt-register.md`의 상태도 함께 갱신합니다.
- MVP 범위에서 제외한 항목은 삭제하지 않고 `deferred`로 유지합니다.
- 우선순위 변경은 이유를 `decision-log/`에 남깁니다.
