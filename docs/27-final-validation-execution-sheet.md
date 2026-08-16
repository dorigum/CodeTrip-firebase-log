# 공모전 최종 검증 실행표

이 문서는 CodeTrip 기능설명서 최종본과 한국관광 콘텐츠랩 제출 페이지 입력값을 실제 제출 직전에 검증하기 위한 실행표입니다. `docs/25-final-input-checklist.md`가 “무엇을 준비해야 하는지”를 정리한 문서라면, 이 문서는 “제출 직전에 어떤 순서로 확인하고 어떤 증빙을 남길지”를 기록합니다.

비밀번호, OpenAPI 인증키, 개인 이메일, 팀원 개인정보 등 민감정보 원문은 기록하지 않습니다. 검증 결과는 `통과`, `부분 통과`, `실패`, `미실행` 중 하나로 작성합니다. 제출 직전 차단 조건에 포함된 필수 항목은 `부분 통과`도 제출 보류 상태로 봅니다.

## 사용 시점

- 기능설명서 최종 PPTX/PDF를 생성한 직후
- 테스트 계정을 생성하고 로그인 검증을 수행한 직후
- OpenAPI 인증키와 활용 API 목록을 제출 페이지에 입력하기 직전
- 한국관광 콘텐츠랩 제출 페이지에서 최종 제출 버튼을 누르기 직전

## 실행 환경 기록

| 항목 | 값 |
|---|---|
| 검증일 | YYYY-MM-DD |
| 검증자 | 이름 |
| 기준 브랜치 | `docs/contest-submission-materials` |
| 기준 커밋 | `commit hash` |
| 배포 커밋 | Firebase Hosting에 배포된 commit hash |
| 배포 식별자 | Firebase 배포 ID 또는 배포 시각 |
| 배포 URL | `https://dorigum-codetrip.web.app` |
| 기준 PPTX | `output/contest/CodeTrip_2026_관광데이터_공모전_기능설명서_최종.pptx` |
| 기준 PDF | `output/contest/CodeTrip_2026_관광데이터_공모전_기능설명서_최종.pdf` |
| 브라우저·OS | 예: Chrome / Windows |

## 제출 페이지 입력값 검증

| ID | 검증 항목 | 확인 방법 | 결과 | 증빙 위치 | 후속 조치 |
|---|---|---|---|---|---|
| VE-01 | 접수 계정 로그인·이메일 인증 | 한국관광 콘텐츠랩 접수 계정으로 로그인하고 이메일 인증 가능 여부 확인 | 미실행 | 제출 페이지 확인 기록 |  |
| VE-02 | 팀명·팀원 정보 | 제출 페이지 팀명과 최종 팀원 정보 확인. 팀원 개인정보 원문은 저장소에 기록하지 않음 | 미실행 | 제출 페이지 확인 기록 |  |
| VE-03 | 서비스명·유형 | 서비스명 `CodeTrip`, 서비스 유형 `웹` 또는 `웹 서비스`로 입력했는지 확인 | 미실행 | 제출 페이지 확인 기록, 최종 PDF |  |
| VE-04 | 서비스 개요 | 제출 페이지 문구와 기능설명서 2페이지 문구가 같은 방향인지 확인 | 미실행 | `docs/24-submission-copywriting.md`, 최종 PDF |  |
| VE-05 | 지역 특화 여부 | 전국 단위 또는 특정 지역 특화 선택이 제출 페이지와 기능설명서에서 일치하는지 확인 | 미실행 | `docs/23-regional-specialization-strategy.md`, 최종 PDF |  |
| VE-06 | 서비스 URL | 제출 URL 접속, 직접 경로 새로고침, 공개 화면 로딩 확인 | 미실행 | `docs/21-service-url-verification.md`, `docs/13-validation-report.md` |  |
| VE-07 | 테스트 계정 | 제출용 계정으로 로그인, 로그아웃 후 재로그인 확인 | 미실행 | `docs/19-test-account-verification.md`, `docs/13-validation-report.md` |  |
| VE-08 | OpenAPI 인증키 | 공공데이터포털의 인코딩키·디코딩키 또는 일반 인증키를 제출 페이지에만 입력했는지 확인하고, 배포 서비스가 사용하는 키와 제출 계정 키가 일치하는지 대조합니다. 불일치하면 제출을 보류합니다. | 부분 통과 | `docs/20-openapi-submission-verification.md`, `docs/34-openapi-submission-copy-sheet.md` | 코드·로컬·배포 동작은 확인했습니다. 제출 페이지 입력값은 원문 기록 없이 사용자가 직접 확인해야 합니다. |
| VE-09 | OpenAPI 활용 목록 | 제출 페이지, 기능설명서, 실제 코드 endpoint 목록이 일치하는지 확인 | 부분 통과 | `docs/20-openapi-submission-verification.md`, `docs/34-openapi-submission-copy-sheet.md`, 최종 PDF | 코드 endpoint 목록은 확인했습니다. 최종 PDF 5페이지와 제출 페이지 입력 목록 대조가 필요합니다. |
| VE-10 | 동일 서비스 중복 출품 여부 | 동일 서비스로 타 부문 또는 공사 주관 지원 사업 수상·수혜 이력이 없는지 확인 | 미실행 | 팀 내부 확인 기록 |  |
| VE-11 | 제출 부문·양식 일치 여부 | 웹·앱 개발 부문 제출 페이지와 웹·앱 개발 부문 기능설명서 양식이 일치하는지 확인 | 미실행 | 제출 페이지, 최종 PDF |  |
| VE-12 | 마감 전 수정 가능 시간 | 2026-09-21 16:00 전 제출·수정 가능 시간을 확보했는지 확인 | 미실행 | 제출 일정 확인 기록 |  |

## Gemini 공개 생성 보안 검증

공개 URL에서 Gemini 생성 기능을 제공하려면 아래 항목을 모두 통과해야 합니다. 최종 제출 통과 기준은 Firebase Functions 프록시 기반 생성 성공 또는 보안 게이트를 통과한 뒤 저장된 기존 AI 일정 결과 표시입니다. 비활성화 안내 화면만으로는 AI 일정 기능 통과로 보지 않습니다.

| ID | 검증 항목 | 기준 | 결과 | 증빙 위치 | 후속 조치 |
|---|---|---|---|---|---|
| AI-SEC-01 | Functions 프록시 배포 | Gemini 호출이 클라이언트가 아닌 Firebase Functions 프록시를 통해 실행됩니다. | 통과 | `generateTripPlan` v2 callable Function 배포, `functions:list`, `docs/13-validation-report.md` |  |
| AI-SEC-02 | 서버 측 Secret 저장 | Gemini API 키가 Functions Secret 또는 승인된 Secret Manager에 저장되고 클라이언트 번들에 포함되지 않습니다. | 통과 | `GEMINI_API_KEY` Secret version 2 등록 및 `generateTripPlan` 재배포, 과거 version 1은 교체 전 이력으로만 취급 |  |
| AI-SEC-03 | 클라이언트 키 제거 | 공개 빌드에서 Gemini API 키를 직접 참조하거나 `x-goog-api-key`를 브라우저에서 전송하지 않습니다. | 통과 | `dist secret scan: not found`, `src/api/geminiApi.js` Callable 호출 구조 |  |
| AI-SEC-04 | Gemini 공개 생성 보안 게이트 | AI-SEC-01~AI-SEC-03, AI-SEC-07~AI-SEC-11이 미완료이면 공개 URL의 Gemini 신규 생성을 제출 통과 상태로 보지 않습니다. | 부분 통과 | Functions·Hosting 배포 완료, 미인증 401 차단, 인증 성공 smoke test 확인. 단, AI-SEC-07·AI-SEC-08 반복 검증 전까지 최종 제출 통과로 보지 않습니다. | 반복 호출 및 잘못된 입력 검증 필요 |
| AI-SEC-05 | 키 교체·만료 완료 | 기존 클라이언트 노출 가능 키는 실제로 폐기 또는 만료 처리되어야 합니다. 서버는 신규 Secret을 사용해야 하며, Secret version, 검증일, 호출 결과로 사용 상태를 확인합니다. | 통과 | AI Studio 키 목록에서 기존 `Gemini API Key_temp` 미표시, `GEMINI_API_KEY` Secret version 2 등록, 검증일 2026-08-16, Function 재배포 후 smoke test 성공 |  |
| AI-SEC-06 | 민감정보 기록 제한 | 검증 보고서와 캡처에는 키 원문 또는 키 식별자 일부 없이 성공 여부, Secret version, 검증일, 호출 결과만 기록합니다. | 통과 | `docs/13-validation-report.md`, `docs/36-final-blockers-summary.md`에 키 원문 없이 Secret version 2와 기존 키 삭제 상태만 기록 |  |
| AI-SEC-07 | 사용자별 호출 제한 | Functions 프록시에서 Firebase Auth로 검증된 `uid` 기준 rate limit, quota, 동시 요청 제한을 적용합니다. | 부분 통과 | `functions/index.js`의 `uid` 기준 rate limit·동시 요청 제한 코드. 현재 구현은 인스턴스 로컬 메모리 기반 근사 제한이며 전역 한도는 아닙니다. | 반복 호출 검증 필요. 전역 한도가 필요하면 DB 기반 카운터로 이전 |
| AI-SEC-08 | 서버 측 입력 검증 | Functions 프록시에서 입력 크기, 필수 필드, 형식, 민감정보 포함 여부를 검증합니다. | 부분 통과 | `functions/index.js`의 입력 정규화·길이·범위 제한 코드 | 잘못된 입력 케이스 검증 필요 |
| AI-SEC-09 | 로그 민감정보 마스킹 | 요청 원문, 응답 원문, API 키, 사용자 민감정보가 Functions 로그와 브라우저 콘솔에 남지 않는지 확인합니다. | 통과 | Functions 로그에 `uid`, `durationDays`, `preferredPlaces`만 기록. 키·프롬프트·응답 원문 미기록 |  |
| AI-SEC-10 | Firebase Auth ID token 검증 | Functions 프록시는 클라이언트 요청의 Firebase Auth ID token을 서버에서 검증하고, 검증된 사용자 식별자만 Gemini 호출에 사용합니다. | 통과 | 테스트 계정 ID token 기반 Callable 호출 성공, Functions 로그 `auth: VALID` |  |
| AI-SEC-11 | 미인증 요청 거부 | Firebase Auth ID token이 없거나 유효하지 않은 요청은 Gemini 호출 전에 401 또는 403으로 거부합니다. | 통과 | 미인증 Callable 요청 `401` 차단 확인 |  |

현재 구현 메모: 2026-08-16 브랜치 `security/gemini-functions-proxy`에서 클라이언트 직접 Gemini 호출을 Firebase Callable Function 호출로 교체하고, `functions/index.js`에 `generateTripPlan` 프록시를 추가했습니다. `GEMINI_API_KEY` Secret 등록, `generateTripPlan` v2 callable Function 배포, Hosting 배포, 배포 산출물 키 미포함, 미인증 요청 401 차단, 인증 성공 smoke test까지 확인했습니다. 신규 Gemini 키를 Secret version 2로 반영하고 재검증했으며, 기존 `Gemini API Key_temp`는 AI Studio 키 목록에서 삭제된 상태로 확인했습니다.

현재 PR 메모: `stabilize/api-cache-and-ui` 안정화 PR에서는 문서·UI·비동기 요청 경합 방지와 API 호출 축소를 수정하며, Firebase Hosting 재배포는 아직 수행하지 않았습니다. 따라서 제출 직전에는 이 표의 `배포 커밋`과 `배포 식별자`를 최신 Hosting 재배포 결과로 다시 채워야 합니다.

## 서비스 URL smoke test

상세 실행 순서는 `docs/32-service-url-smoke-test-runbook.md`를 따릅니다. 이 표에는 제출 직전 요약 결과만 기록합니다.

| ID | 경로 | 확인 항목 | 결과 | 증빙 위치 | 후속 조치 |
|---|---|---|---|---|---|
| URL-01 | `/` | 홈 화면이 로딩되고 서비스 소개 또는 주요 카드가 보입니다. | 통과 | `docs/32-service-url-smoke-test-runbook.md`, `docs/13-validation-report.md` | 2026-08-16 중간 smoke test 기준 |
| URL-02 | `/explore` | 여행지 목록, 검색 또는 필터 UI가 보입니다. | 통과 | `docs/32-service-url-smoke-test-runbook.md`, `docs/13-validation-report.md` | 2026-08-16 중간 smoke test 기준 |
| URL-03 | `/festivals` | 축제·행사 목록 또는 빈 결과·오류 상태가 구분되어 표시됩니다. | 통과 | `docs/32-service-url-smoke-test-runbook.md`, `docs/13-validation-report.md` | 2026-08-16 중간 smoke test 기준 |
| URL-04 | `/login` | 이메일·비밀번호 로그인 폼이 보입니다. | 통과 | `docs/32-service-url-smoke-test-runbook.md`, `docs/13-validation-report.md` | 2026-08-16 중간 smoke test 기준 |
| URL-05 | `/ai-planner` | 비로그인 상태에서는 보호 안내, 로그인 상태에서는 보안 프록시 기반 AI 일정 입력·생성 결과 또는 보안 게이트 통과 후 저장된 기존 결과 화면이 보입니다. | 부분 통과 | `docs/32-service-url-smoke-test-runbook.md`, `docs/13-validation-report.md` | 화면 접근과 보호 라우트는 확인했습니다. Gemini 신규 생성은 비용 관리상 미실행입니다. |
| URL-06 | `/board` | 커뮤니티 화면 또는 인증 흐름이 정상 표시됩니다. | 통과 | `docs/32-service-url-smoke-test-runbook.md`, `docs/13-validation-report.md` | 2026-08-16 중간 smoke test 기준 |
| URL-07 | 직접 경로 새로고침 | `/explore`, `/festivals`, `/login`, `/ai-planner`, `/board` 직접 접근 시 404가 발생하지 않습니다. | 통과 | `docs/32-service-url-smoke-test-runbook.md`, `docs/13-validation-report.md` | 2026-08-16 HTTP HEAD 기준 전체 200 확인 |

## 테스트 계정 기능 검증

| ID | 화면 | 확인 항목 | 결과 | 증빙 위치 | 후속 조치 |
|---|---|---|---|---|---|
| TA-01 | 홈 | 로그인 상태에서 홈 화면이 정상 표시됩니다. | 통과 | `docs/32-service-url-smoke-test-runbook.md`, `docs/13-validation-report.md` | 2026-08-16 중간 smoke test 기준 |
| TA-02 | 여행지 탐색 | 목록과 필터가 표시되고 찜 버튼 또는 보호 흐름을 확인할 수 있습니다. | 통과 | `docs/32-service-url-smoke-test-runbook.md`, `docs/13-validation-report.md` | 2026-08-16 중간 smoke test 기준 |
| TA-03 | 찜·폴더 또는 마이페이지 | 사용자 소유 데이터 화면에 접근 가능합니다. | 통과 | `docs/32-service-url-smoke-test-runbook.md`, `docs/13-validation-report.md` | 2026-08-16 중간 smoke test 기준 |
| TA-04 | AI Planner | 로그인 상태에서 보안 프록시 기반 Gemini 생성이 성공하거나, AI-SEC 필수 항목 통과 후 저장된 기존 AI 일정 결과가 표시됩니다. 명시적 비활성화 안내 화면만으로는 통과하지 않습니다. | 부분 통과 | `docs/32-service-url-smoke-test-runbook.md`, `docs/13-validation-report.md`, `AI-SEC` 검증 결과 | AI Planner 화면 접근은 확인했습니다. Gemini 신규 생성은 비용 관리상 미실행이며, 사용자 수동 확인값과 별도 기록합니다. |
| TA-05 | 커뮤니티 | 게시글 목록, 작성, 상세, 댓글 중 최소 1개 흐름을 확인합니다. | 부분 통과 | `docs/32-service-url-smoke-test-runbook.md`, `docs/13-validation-report.md` | 게시글 목록은 확인했습니다. 작성·상세·댓글 작성은 미실행입니다. |
| TA-06 | 로그아웃 후 재로그인 | 제출용 계정으로 다시 로그인 가능합니다. | 미실행 | `docs/13-validation-report.md` |  |

## 기능설명서 최종 PDF 검증

슬라이드별 검수는 `docs/35-pptx-slide-final-review-checklist.md`를 함께 사용합니다.

| ID | 검증 항목 | 기준 | 결과 | 증빙 위치 | 후속 조치 |
|---|---|---|---|---|---|
| PDF-01 | 제공 양식 사용 | 공모전 제공 PPTX 양식 기반이며 필수 항목을 삭제하지 않았습니다. | 미실행 | 최종 PDF 육안 확인 |  |
| PDF-02 | 페이지 수 | 5페이지 이하 | 미실행 | `docs/17-submission-artifact-manifest.md` |  |
| PDF-03 | 글자 크기 | 12포인트 이상 | 미실행 | `docs/13-validation-report.md` |  |
| PDF-04 | 파일 용량 | 10MB 미만 | 미실행 | `docs/17-submission-artifact-manifest.md` |  |
| PDF-05 | 정상 열람 | PDF가 열리고 슬라이드 잘림, 깨짐, 원본 가이드 문구 잔존이 없습니다. | 미실행 | `docs/13-validation-report.md` |  |
| PDF-06 | 팀명 placeholder 제거 | `[접수 팀명 입력]` 문구가 남아 있지 않습니다. | 미실행 | 최종 PDF 1페이지 |  |
| PDF-07 | 화면 캡처 적절성 | 대표 이미지 1장과 상세 이미지 3~5장이 실제 서비스 화면이며 개인정보·키 노출이 없습니다. | 부분 통과 | `docs/17-submission-artifact-manifest.md`, 최종 PDF 3페이지 | 화면 캡처 후보는 확보했습니다. 최종 PPTX/PDF 반영 후 재확인합니다. |
| PDF-08 | 데이터 활용 목록 | 한국관광공사 OpenAPI 활용 목록이 제출 페이지와 일치합니다. | 부분 통과 | `docs/20-openapi-submission-verification.md`, `docs/34-openapi-submission-copy-sheet.md`, 최종 PDF 5페이지 | 코드 기준 목록은 확인했습니다. 최종 PDF와 제출 페이지 대조가 필요합니다. |
| PDF-09 | checksum 기록 | 최종 PPTX/PDF의 SHA-256, 생성일, 파일 크기, 전달 위치를 manifest에 기록했습니다. | 미실행 | `docs/17-submission-artifact-manifest.md` |  |

## 제출 리스크 최종 확인

| ID | 검증 항목 | 기준 | 결과 | 증빙 위치 | 후속 조치 |
|---|---|---|---|---|---|
| SUB-01 | 부문 오첨부 방지 | 웹·앱 개발 부문 제출 페이지에 웹·앱 개발 부문 기능설명서 PDF를 첨부합니다. | 미실행 | 제출 페이지 확인 기록 |  |
| SUB-02 | 파일 버전 확인 | 최종 파일명이 초안이 아니며, 서비스명 `CodeTrip`과 최종 checksum이 manifest와 일치합니다. | 미실행 | `docs/17-submission-artifact-manifest.md` |  |
| SUB-03 | 제출 후 수정 제한 확인 | 마감 후 수정 불가 조건을 확인하고, 제출 완료 전 모든 필수 항목을 다시 열람합니다. | 미실행 | 제출 페이지 확인 기록 |  |

## 제출 직전 차단 조건

아래 항목 중 하나라도 `부분 통과`, `실패`, `미실행`이면 최종 제출을 보류합니다. 필수 항목의 `부분 통과`는 보완 필요 상태이며, 허용되는 예외는 이 문서에 별도로 명시된 경우에만 인정합니다.

- VE-01 접수 계정 로그인·이메일 인증
- VE-06 서비스 URL
- VE-07 테스트 계정
- VE-08 OpenAPI 인증키
- VE-09 OpenAPI 활용 목록
- VE-10 동일 서비스 중복 출품 여부
- VE-11 제출 부문·양식 일치 여부
- VE-12 마감 전 수정 가능 시간
- AI-SEC-01 Functions 프록시 배포
- AI-SEC-02 서버 측 Secret 저장
- AI-SEC-03 클라이언트 키 제거
- AI-SEC-04 Gemini 공개 생성 보안 게이트
- AI-SEC-05 키 교체·만료 절차
- AI-SEC-06 민감정보 기록 제한
- AI-SEC-07 사용자별 호출 제한
- AI-SEC-08 서버 측 입력 검증
- AI-SEC-09 로그 민감정보 마스킹
- AI-SEC-10 Firebase Auth ID token 검증
- AI-SEC-11 미인증 요청 거부
- PDF-01 제공 양식 사용
- PDF-02 페이지 수
- PDF-03 글자 크기
- PDF-04 파일 용량
- PDF-05 정상 열람
- PDF-06 팀명 placeholder 제거
- PDF-09 checksum 기록
- SUB-01 부문 오첨부 방지
- SUB-02 파일 버전 확인
- SUB-03 제출 후 수정 제한 확인

## 비차단 검증 항목

아래 항목은 세부 품질과 증빙을 보강하기 위한 비차단 항목입니다. 다만 비차단 항목의 실패가 위 차단 조건의 근거 항목에 영향을 주면 해당 차단 항목의 판정에 반영합니다.

- VE-02~VE-05: 제출 페이지의 팀·서비스·지역 특화 입력값 정합성 확인
- URL-01~URL-07: 서비스 URL smoke test의 세부 경로별 확인
- TA-01~TA-06: 테스트 계정 기반 핵심 기능 세부 확인
- PDF-07~PDF-08: 기능설명서 화면 캡처와 데이터 활용 목록의 보조 검수

## 최종 판정

| 항목 | 값 |
|---|---|
| 최종 판정 | 미실행 |
| 제출 가능 여부 | 미정 |
| 제출 보류 사유 | 해당 시 작성 |
| 제출 완료일 | 제출 후 작성 |
| 제출 산출물 checksum | 제출 후 manifest와 일치 여부 확인 |

## 기록 위치

- 세부 검증 결과는 이 문서의 표에 작성합니다.
- 주요 검증 요약은 `docs/13-validation-report.md`에 추가합니다.
- 최종 PPTX/PDF 파일명, 생성일, 파일 크기, checksum, 외부 전달 위치는 `docs/17-submission-artifact-manifest.md`에 기록합니다.
- 체크리스트 상태 변경은 `docs/16-contest-submission-checklist.md`와 `docs/25-final-input-checklist.md`에 반영합니다.
