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

## 현재 작업 스택

이 섹션은 매일 확인하는 작업판입니다. 항목을 시작하면 `Next`에서 `Now`로 옮기고, 완료 증빙과 함께 `Done`으로 옮깁니다. 아래의 실행 백로그 표는 장기 이력과 세부 작업을 보관하는 참조 목록으로 유지합니다.

### Now

- [ ] **STK-09 · 1차 심사 제출본 최신 화면 캡처·PDF 확정** — P0 / `in_progress`
  - 현재 배포본 기준의 AI 플래너·폴더·커뮤니티 화면으로 기능설명서 캡처를 교체하고, 최종 PDF의 양식·개인정보·제출값을 점검합니다.

### Next

- [ ] **STK-04 · AI 플래너 추천 프롬프트·근거 표시 고도화** — P1 / `ready`
  - 날씨, 예산, 동행 관계, 인원, 이동 부담을 입력·프롬프트·결과 요약에 일관되게 반영합니다.
  - 완료 기준: 추천 결과에서 조건 요약과 장소별 추천 근거를 확인할 수 있습니다.

- [ ] **STK-05 · RTDB 사용량 및 알림 조회 비용 관측** — P2 / `ready`
  - Firebase Usage에서 다운로드량·저장량·Functions 호출량을 2~4주 관찰합니다.
  - 완료 기준: 측정값과 유지·추가 최적화 판단을 `docs/38-cache-measurement-sheet.md` 또는 결정 로그에 기록합니다.

### Later

- [ ] **STK-06 · 게시판 카테고리 분리 작업 고려** — P2 / `todo`
  - 여행 후기, 여행 질문, 동행 모집 등 카테고리 필요성과 필터·목록 요약·기존 게시글 마이그레이션 영향을 검토합니다.
  - 재검토 조건: 게시글 수와 사용자 요구가 늘어 목록 탐색성이 실제로 떨어질 때입니다.

- [ ] **STK-07 · 알림 지역 인덱스 최적화 검토** — P2 / `todo`
  - 공용 피드가 현재 보관 한도(100개)를 넘어 늘어날 때 지역별 인덱스 또는 서버 측 필터링의 비용 대비 효과를 측정합니다.
  - 재검토 조건: Header 알림 조회의 다운로드량이 목표치를 초과하거나 보관 한도를 확장할 때입니다.

### Done

- [x] **STK-00 · Header 알림 조회 범위·상태 변경 안정성 1차 보완** — 2026-09-08
  - 개인 알림 최신 30개 조회, 읽음·삭제 중복 요청 방지, 실패 안내, 읽은 알림 삭제 확인 모달을 반영했습니다.
  - 증빙: `b37e64d`, `f25d3ae`, [2026-09-08 작업 로그](../CodeTrip_Firebase/project-log/2026-09-08.md)

- [x] **STK-01 · 관심 지역 기반 알림 운영 검증 및 병합** — 2026-09-09
  - 지역 코드 백필, 연결 재시도, Cloud Scheduler 성공, RTDB 기록과 관심 지역 Header 알림 노출을 검증했습니다.

- [x] **STK-02 · 축제 전용 TourAPI 신규 정보 수집 설계 및 구현** — 2026-09-17
  - `searchFestival2` 수집, 일반 최신 목록과의 `contentId` 중복 제거, Scheduler·RTDB 기록과 Header 노출을 배포 환경에서 확인했습니다.

- [x] **STK-03 · 알림 설정 UI 추가** — 2026-09-17
  - 신규 여행지·축제 수신 설정과 관심 지역 미설정 안내를 구현하고, 수신 설정 켜기·끄기 흐름을 배포 환경에서 확인했습니다.

## GitHub Project 카드 목록

GitHub Project를 만들 때 아래 카드를 추가하고, `Status` 필드를 `Now`, `Next`, `Later`, `Done`으로 구성합니다. `Priority`는 P1/P2, `Type`은 Feature/Quality/Research로 관리하면 충분합니다.

| 카드 제목 | Status | Priority | Type | 완료 기준 |
|---|---|---|---|---|
| 1차 심사 제출본 최신 화면 캡처·PDF 확정 | Now | P0 | Quality | 최신 배포 화면 반영, 최종 PDF 열람·제출값 점검 |
| 핵심 사용자 여정 E2E 확장 | Next | P1 | Quality | 인증·AI 저장을 격리 데이터 전략으로 확장 |
| AI 플래너 추천 프롬프트·근거 표시 고도화 | Next | P1 | Feature | 조건 요약과 장소별 추천 근거 표시 |
| RTDB 사용량 및 알림 조회 비용 관측 | Next | P2 | Research | 2~4주 측정값과 판단 기록 |
| 게시판 카테고리 분리 작업 고려 | Later | P2 | Research | 필요성·데이터 영향·마이그레이션 판단 기록 |
| 알림 지역 인덱스 최적화 검토 | Later | P2 | Research | 실제 사용량 기준으로 도입 여부 결정 |

## 실행 백로그

| ID | 작업 | 우선순위 | 상태 | 연결 항목 | 완료 기준 | 증빙 위치 |
|---|---|---|---|---|---|---|
| BL-01 | Gemini API 호출을 Firebase Functions 프록시로 이전 | P0 | done | `TD-02`, `FR-05` | 클라이언트 번들에서 Gemini API 키 제거, Function 인증·입력 검증·오류 메시지 정제 확인 | `docs/10-ai-harness-engineering.md`, `docs/13-validation-report.md`, `CodeTrip_Firebase/project-log/2026-08-16.md` |
| BL-02 | Firebase Rules 권한 시나리오 검증표 작성 | P0 | done | `TD-05`, 비기능 요구사항 | Emulator 기반 15개 권한 테스트를 실행하고 CI에 포함 | `docs/13-validation-report.md`, `database.rules.json`, `test/database.rules.test.js` |
| BL-03 | 라우트 단위 코드 스플리팅 적용 여부 결정 및 구현 | P1 | done | `TD-01` | 적용 전후 `npm run build` 청크 크기 비교, 남은 500kB 초과 경고 원인 기록 | `src/main.jsx`, `docs/13-validation-report.md`, 빌드 로그 |
| BL-04 | 번들 크기 기준선 측정표 작성 | P1 | done | `TD-01`, 성능 지표 | 현재 빌드의 주요 청크 크기와 경고 여부 기록 | `docs/13-validation-report.md` |
| BL-05 | 핵심 사용자 여정 수동 검증 보고서 작성 | P1 | done | `TD-04`, `FR-01`~`FR-07` | VF-01~VF-07 배포 환경 결과를 검증 보고서에 기록 | `docs/13-validation-report.md` |
| BL-06 | 핵심 사용자 여정 E2E 테스트 도입 검토 | P1 | in_progress | `TD-04` | 공개·보호 경로 E2E와 테스트 계정 로그인 스모크를 추가하고, AI 생성·폴더 저장은 격리 환경에서 확장 | `e2e/`, `docs/40-authenticated-e2e-runbook.md` |
| BL-07 | 성능·캐시·AI 성공률 릴리스별 측정 방식 확정 | P1 | todo | `TD-03`, `TD-06` | raw log 장기 저장 여부, 집계 지표, 보존 기간, 책임자 결정 | `docs/09-metrics.md`, `decision-log/` |
| BL-08 | 외부 API 장애 시나리오별 smoke test 작성 | P2 | in_progress | `TD-08` | TourAPI 오류 응답, 날씨·위치 fallback, Gemini 오류 안내를 자동 검증하고 실제 네트워크 단절 시나리오를 추가 기록 | `docs/13-validation-report.md`, `functions/test/tourApiUpdates.test.js`, `src/utils/externalServiceErrors.test.js` |
| BL-09 | 주요 의사결정 로그 3건 작성 | P2 | ready | `TD-07` | 애자일 문서 체계, AI 분석 규칙, 성능 측정 원칙 결정 기록 작성 | `docs/decision-log/` |
| BL-10 | 스프린트 회고 첫 기록 작성 | P2 | done | `TD-07` | MVP 안정화·심사 제출 준비 스프린트의 목표, 잘된 점, 문제, 다음 액션 기록 | `docs/retrospectives/2026-09-mvp-hardening-retrospective.md` |
| BL-11 | 심사 시연 시나리오 작성 | P2 | done | WBS 6~8주차 | 탐색, 상세, 로그인, 찜, AI 일정, 마이페이지, 커뮤니티, 품질 설명 흐름 정의 | `docs/15-demo-scenario.md` |
| BL-12 | 상용 예약·결제·관리자 기능 백로그 보관 | P3 | deferred | `FR-08` | MVP 범위 제외 사유와 상용화 단계 재검토 조건 기록 | `docs/02-product-requirements.md`, `decision-log/` |
| BL-13 | 공모전 1차 심사 제출 항목 매핑 | P0 | done | 제출 안내, 기능설명서 양식 | 제출 항목, 기능설명서 슬라이드, OpenAPI 활용 목록, 제출 전 체크리스트 정리 | `docs/16-contest-submission-checklist.md` |
| BL-14 | 기능설명서 PPTX 작성 및 PDF 변환 | P0 | in_progress | 제출 안내, 기능설명서 양식 | 제공 양식 기반 기능설명서 작성, PDF 변환 후 열람 확인, 제출 산출물 manifest 작성 | `docs/17-submission-artifact-manifest.md`, `docs/13-validation-report.md` |
| BL-15 | React Hook effect 경고 정리 | P2 | done | `TD-09` | 데이터 요청 effect와 상태 갱신을 화면별로 리팩터링하고 린트 경고 0건 확인 | `docs/12-technical-debt-register.md`, `docs/13-validation-report.md` |

## 현재 추천 처리 순서

1. STK-09: 1차 심사 제출본 최신 화면 캡처·PDF 확정
2. BL-06: 인증·AI 저장을 포함한 격리 E2E 확장
3. STK-04: AI 플래너 추천 프롬프트·근거 표시 고도화
4. STK-05: RTDB 사용량 및 알림 조회 비용 관측

## 운영 규칙

- 백로그 항목은 작업이 끝날 때 `done`으로 바꾸기 전에 검증 보고서 또는 관련 문서의 증빙 위치를 채웁니다.
- 기술 부채에서 파생된 항목은 해결 후 `docs/12-technical-debt-register.md`의 상태도 함께 갱신합니다.
- MVP 범위에서 제외한 항목은 삭제하지 않고 `deferred`로 유지합니다.
- 우선순위 변경은 이유를 `decision-log/`에 남깁니다.
