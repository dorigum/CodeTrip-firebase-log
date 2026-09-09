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

이 섹션은 매일 확인하는 작업판입니다. 항목을 시작하면 `Next`에서 `Now`로 옮기고, PR을 열면 `Review / Deploy`로, 완료 증빙과 함께 종료하면 `Done`으로 옮깁니다. 아래의 실행 백로그 표는 장기 이력과 세부 작업을 보관하는 참조 목록으로 유지합니다.

### Now

- [ ] **STK-02 · 축제 전용 TourAPI 신규 정보 수집 설계 및 구현** — P1 / `in_progress`
  - `searchFestival2` 수집과 일반 최신 목록 `contentId` 중복 제거를 1차 구현했습니다.
  - 남은 완료 기준: 배포 환경의 Scheduler·RTDB 기록과 Header 노출 검증입니다.

- [ ] **STK-03 · 알림 설정 UI 추가** — P1 / `in_progress`
  - TourAPI 신규 정보 수신 여부 설정과 관심 지역 미설정 안내를 1차 구현했습니다.
  - 남은 완료 기준: 수신 설정 켜기/끄기 수동 검증입니다.

### Done

- [x] **STK-01 · PR #34 관심 지역 기반 알림 운영 검증 및 머지 준비** — 2026-09-09
  - 지역 코드 백필, 연결 재시도, Cloud Scheduler 성공, RTDB 기록, 전남 관심 지역 Header 알림 노출을 검증했고 PR #34를 머지했습니다.

- [x] **STK-00 · Header 알림 조회 범위·상태 변경 안정성 1차 보완** — 2026-09-08
  - 범위: 관심 지역 행정구역 코드와 TourAPI 지역 코드 변환, 최신 알림 조회 경쟁 조건, 읽은 알림 삭제 뒤 포커스 이동을 포함합니다.
  - 완료 기준: 지역 일치·불일치·미설정, 읽음·숨김·일괄 삭제, 키보드 포커스 수동 검증을 마치고 PR 리뷰를 재확인합니다.
  - 연결: `feat/notification-enhancement`, PR #34, [TourAPI 신규 여행지 알림 구현 계획](39-tourapi-update-notification-plan.md)

### Next

- [ ] **STK-02 · 축제 전용 TourAPI 신규 정보 수집 설계 및 구현** — P1 / `in_progress`
  - `searchFestival2` 기반 수집, 일반 신규 정보와의 `contentId` 중복 판별, 호출 주기·보관 수·실패 처리 기준을 정합니다.
  - 완료 기준: 관심 지역 축제/행사 알림이 일반 최신 등록 목록 포함 여부와 관계없이 감지되고, 테스트 fixture와 운영 검증 절차가 마련됩니다.

- [ ] **STK-03 · 알림 설정 UI 추가** — P1 / `in_progress`
  - TourAPI 알림 수신 여부와 관심 지역 미설정 안내를 마이페이지 설정에 제공합니다.
  - 완료 기준: 사용자가 수신 여부를 변경할 수 있고, 비활성화 시 공용 TourAPI 알림은 보이지 않으며 개인 알림은 유지됩니다.

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

### Review / Deploy

- [ ] **STK-08 · PR #34 리뷰 재확인 및 배포** — P1 / `blocked`
  - CodeRabbit 리뷰 제한이 해제된 뒤 최신 커밋을 재검토하고, 머지 후 `npm run build`와 Hosting·Database Rules 배포를 진행합니다.
  - 완료 기준: 운영 환경에서 STK-01 수동 검증 항목을 통과하고 배포 기록을 남깁니다.

### Done
  - 개인 알림 최신 30개 조회, 읽음·삭제 중복 요청 방지, 실패 안내, 읽은 알림 삭제 확인 모달을 반영했습니다.
  - 증빙: `b37e64d`, `f25d3ae`, [2026-09-08 작업 로그](../CodeTrip_Firebase/project-log/2026-09-08.md)

## GitHub Project 카드 목록

GitHub Project를 만들 때 아래 카드를 추가하고, `Status` 필드를 `Now`, `Next`, `Later`, `Review / Deploy`, `Done`으로 구성합니다. `Priority`는 P1/P2, `Type`은 Feature/Quality/Research로 관리하면 충분합니다.

| 카드 제목 | Status | Priority | Type | 완료 기준 |
|---|---|---|---|---|
| PR #34 관심 지역 기반 알림 운영 검증 및 머지 준비 | Now | P1 | Quality | STK-01 수동 검증 완료 및 PR 리뷰 확인 |
| 축제 전용 TourAPI 신규 정보 수집 | Next | P1 | Feature | `searchFestival2` 수집·중복 판별·테스트 완료 |
| 알림 설정 UI | Next | P1 | Feature | TourAPI 알림 수신 여부와 미설정 안내 제공 |
| AI 플래너 추천 프롬프트·근거 표시 고도화 | Next | P1 | Feature | 조건 요약과 장소별 추천 근거 표시 |
| RTDB 사용량 및 알림 조회 비용 관측 | Next | P2 | Research | 2~4주 측정값과 판단 기록 |
| 게시판 카테고리 분리 작업 고려 | Later | P2 | Research | 필요성·데이터 영향·마이그레이션 판단 기록 |
| 알림 지역 인덱스 최적화 검토 | Later | P2 | Research | 실제 사용량 기준으로 도입 여부 결정 |
| PR #34 리뷰 재확인 및 배포 | Review / Deploy | P1 | Quality | 머지·배포·운영 검증 기록 완료 |

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

## 현재 추천 처리 순서

1. STK-01: PR #34 관심 지역 기반 알림 운영 검증 및 머지 준비
2. STK-08: 리뷰 재확인, 머지와 배포 기록
3. STK-02: 축제 전용 TourAPI 신규 정보 수집
4. STK-03: 알림 설정 UI
5. STK-04: AI 플래너 추천 프롬프트·근거 표시 고도화
6. STK-05: RTDB 사용량 및 알림 조회 비용 관측

## 운영 규칙

- 백로그 항목은 작업이 끝날 때 `done`으로 바꾸기 전에 검증 보고서 또는 관련 문서의 증빙 위치를 채웁니다.
- 기술 부채에서 파생된 항목은 해결 후 `docs/12-technical-debt-register.md`의 상태도 함께 갱신합니다.
- MVP 범위에서 제외한 항목은 삭제하지 않고 `deferred`로 유지합니다.
- 우선순위 변경은 이유를 `decision-log/`에 남깁니다.
