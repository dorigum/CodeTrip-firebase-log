# 검증 보고서

이 문서는 CodeTrip의 릴리스 또는 주요 변경 단위 검증 결과를 기록합니다. 검증 보고서는 완료 주장보다 증빙 위치를 우선합니다. 실행하지 않은 항목은 `미실행`, 측정값이 없는 항목은 `측정값 없음`으로 기록합니다.

## 기록 기준

- 검증 단위는 커밋, PR, 릴리스, 배포 중 하나로 잡습니다.
- `npm run lint`, `npm run build`, 핵심 시나리오, 권한 점검, 성능 측정, 배포 확인을 분리해 기록합니다.
- 수동 검증은 수행자, 환경, 확인 흐름, 실패 지점을 남깁니다.
- 정량 지표는 측정 방법과 원본 위치가 있을 때만 실제값으로 기록합니다.
- 미해결 이슈는 기술 부채 등록부 또는 백로그와 연결합니다.

## 검증 결과 기록

| 날짜 | 기준 커밋 | 검증 항목 | 결과 | 증빙 | 미해결 이슈 |
|---|---|---|---|---|---|
| 2026-08-11 | `6314e03` | 문서 체계 갱신 확인 | 통과 | `docs/README.md`, `docs/11-ai-document-analysis-rules.md`, `docs/12-technical-debt-register.md` | 로컬 브랜치명이 원격 브랜치명과 다를 수 있음 |
| 2026-08-11 | `6314e03` | `npm run lint` | 최근 검증 기록 있음, 현재 문서 변경 후 재실행 필요 | 이전 로컬 실행 로그 | React Hook 경고는 별도 기술 부채 후보 |
| 2026-08-11 | `6314e03` | `npm run build` | 최근 검증 기록 있음, 현재 문서 변경 후 재실행 필요 | 이전 로컬 실행 로그 | Vite 500kB 초과 청크 경고는 `TD-01`로 추적 |
| 2026-08-11 | `6314e03` | 핵심 사용자 흐름 수동 검증 | 미실행 | 없음 | 대표 시나리오 검증 보고 필요 |
| 2026-08-11 | `6314e03` | Firebase Rules 권한 검증 | 미실행 | 없음 | `TD-05`로 추적 |
| 2026-08-11 | `6314e03` | 성능·캐시·AI 성공률 측정 | 측정값 없음 | `docs/09-metrics.md` 측정 계약 | `TD-03`으로 추적 |
| 2026-08-11 | `6314e03` | Firebase Hosting 배포 확인 | 최근 배포 기록 있음, 이 문서 변경 후 재배포 미실행 | Firebase deploy 로그, 공개 URL | 문서 변경만 포함되므로 서비스 동작 영향 없음 |
| 2026-08-11 | `61116ed` | 기능설명서 PPTX/PDF 초안 열람 검증 | 초안 열람 가능, 최종 제출 조건 추가 검증 필요 | `docs/17-submission-artifact-manifest.md` | 실제 화면 캡처 미삽입, 5페이지 이하 조건 추가 편집 필요 |
| 2026-08-12 | `8aa3187` | 기능설명서 5페이지 압축 초안 검증 | PDF 5페이지, 198252 bytes로 10MB 미만 확인 | `docs/17-submission-artifact-manifest.md`, `output/contest/CodeTrip_2026_관광데이터_공모전_기능설명서_5페이지_초안.pdf` | 실제 화면 캡처 미삽입, 양식 수정 없음·모든 항목 작성·12포인트 이상 조건은 최종본 육안 검증 필요 |
| 2026-08-12 | `f11bd8c` | 기능설명서 화면 캡처 삽입 초안 검증 | PDF 5페이지, 374454 bytes로 10MB 미만 확인. 3번 슬라이드 PNG 렌더 육안 확인 | `docs/17-submission-artifact-manifest.md`, `output/contest/CodeTrip_2026_관광데이터_공모전_기능설명서_5페이지_화면캡처_초안.pdf`, `output/contest/rendered/screen-draft-slide3-final.png` | 로그인 후 AI·마이페이지·커뮤니티 내부 화면은 테스트 계정 생성 후 교체 필요. 모든 슬라이드의 12포인트 이상 조건은 최종본 육안 검증 필요 |
| 2026-08-12 | `520c721` | 기능설명서 제출 항목 정리본 전체 슬라이드 QA | PDF 5페이지, 394335 bytes로 10MB 미만 확인. 1~5번 슬라이드 PNG 렌더 육안 확인 | `docs/17-submission-artifact-manifest.md`, `output/contest/CodeTrip_2026_관광데이터_공모전_기능설명서_5페이지_제출항목정리_초안.pdf`, `output/contest/rendered/submission-draft-all/` | 접수 팀명 입력 필요, 로그인 후 AI·마이페이지·커뮤니티 내부 화면 교체 필요, 최종 제출 전 12포인트 이상·양식 수정 없음 조건 육안 검증 필요 |
| 2026-08-12 | `da66290` | 기능설명서 제출 항목 정리본 글자 크기 검증 | 텍스트 객체 54개 검사, 최소 글자 크기 12pt, 12pt 미만 0개 확인. PDF 5페이지, 394311 bytes로 10MB 미만 확인 | `docs/17-submission-artifact-manifest.md`, `output/contest/CodeTrip_2026_관광데이터_공모전_기능설명서_5페이지_제출항목정리_초안.pptx`, `output/contest/CodeTrip_2026_관광데이터_공모전_기능설명서_5페이지_제출항목정리_초안.pdf` | 접수 팀명 입력 필요, 로그인 후 AI·마이페이지·커뮤니티 내부 화면 교체 필요, 양식 수정 없음 조건은 최종본 육안 검증 필요 |
| 2026-08-12 | `88be462` | 공모전 제출 문서 링크 무결성 검사 | 통과. `docs/` 내 마크다운 상대 링크가 모두 존재하는 파일을 가리키는지 확인 | 로컬 링크 검사 스크립트 출력 `OK`, `docs/README.md` | `output/` 산출물은 커밋 제외 정책 유지 |
| 2026-08-12 | `a7cc6e3` | 제출 준비도 대시보드 포함 문서 링크 무결성 재검사 | 통과. `docs/28-submission-readiness-dashboard.md` 추가 후 `docs/` 내 마크다운 상대 링크가 모두 존재하는 파일을 가리키는지 확인 | 로컬 링크 검사 스크립트 출력 `OK`, `docs/README.md`, `docs/28-submission-readiness-dashboard.md` | `output/` 산출물은 커밋 제외 정책 유지 |
| 2026-08-12 | `94bccb7` | 공모전 제출 준비 문서 사용 순서 링크 검사 | 통과. `docs/README.md`에 제출 준비 빠른 사용 순서를 추가한 뒤 상대 링크가 모두 존재하는 파일을 가리키는지 확인 | 로컬 링크 검사 스크립트 출력 `OK`, `docs/README.md` | `output/` 산출물은 커밋 제외 정책 유지 |
| 2026-08-12 | `edb02a7` | 심사 대응 Q&A 추가 후 문서 링크 무결성 검사 | 통과. `docs/29-contest-judge-qa.md` 추가 후 `docs/` 내 마크다운 상대 링크가 모두 존재하는 파일을 가리키는지 확인 | 로컬 링크 검사 스크립트 출력 `OK`, `docs/README.md`, `docs/29-contest-judge-qa.md` | `output/` 산출물은 커밋 제외 정책 유지 |
| 2026-08-12 | `7514213` | 제출 제외 리스크 커버리지 보강 후 링크 검사 | 통과. 중복 출품, 부문·양식 오첨부, 마감 전 수정 가능 시간 확인 항목을 보강한 뒤 `docs/` 내 마크다운 상대 링크가 모두 존재하는 파일을 가리키는지 확인 | 로컬 링크 검사 스크립트 출력 `OK`, `docs/16-contest-submission-checklist.md`, `docs/25-final-input-checklist.md`, `docs/27-final-validation-execution-sheet.md` | 실제 중복 출품 여부와 제출 부문 확인은 제출 직전 수동 확인 필요 |
| 2026-08-12 | `30ab724` | 제출 차단 항목 번호 정합성 확인 | 통과. 대시보드 차단 항목이 B-10까지 확장된 뒤 최종 입력값 체크표의 참조 범위를 B-01~B-10으로 맞추고 링크 무결성을 재확인 | 로컬 링크 검사 스크립트 출력 `OK`, `docs/25-final-input-checklist.md`, `docs/28-submission-readiness-dashboard.md` | `output/` 산출물은 커밋 제외 정책 유지 |
| 2026-08-12 | `a6d91bd` | 사용자 제공 입력값 준비 패킷 추가 후 문서 링크 무결성 검사 | 통과. 저장소 기록 가능 값과 기록 금지 값을 분리하는 `docs/30-user-provided-submission-inputs.md`를 추가하고 README, 런북, 대시보드 연결을 확인 | 로컬 링크 검사 스크립트 출력 `OK`, `docs/30-user-provided-submission-inputs.md`, `docs/README.md`, `docs/22-final-submission-runbook.md`, `docs/28-submission-readiness-dashboard.md` | 실제 팀명, 테스트 계정, OpenAPI 인증키, 로그인 후 캡처는 사용자 제공 및 제출 직전 수동 확인 필요. `output/` 산출물은 커밋 제외 정책 유지 |
| 2026-08-12 | `223e5ab` | 기능설명서 화면 캡처 계획 추가 후 문서 링크 무결성 검사 | 통과. 대표 이미지와 상세 이미지 후보, 로그인 후 캡처 우선순위, 개인정보·보안 점검 기준을 `docs/31-submission-screenshot-plan.md`에 정의하고 README, 런북, PPTX 지시서, 대시보드 연결을 확인 | 로컬 링크 검사 스크립트 출력 `OK`, `docs/31-submission-screenshot-plan.md`, `docs/README.md`, `docs/22-final-submission-runbook.md`, `docs/26-pptx-final-editing-guide.md`, `docs/28-submission-readiness-dashboard.md` | 실제 SC-04~SC-06 캡처는 테스트 전용 계정 준비 후 수행 필요. `output/` 산출물은 커밋 제외 정책 유지 |
| 2026-08-12 | `785cdab` | 서비스 URL smoke test 실행표 추가 후 문서 링크 무결성 검사 | 통과. 제출 후보 URL, 공개 URL, 직접 경로 새로고침, 로그인 후 핵심 기능 검증을 `docs/32-service-url-smoke-test-runbook.md`에 실행표로 분리하고 README, URL 검증 문서, 런북, 최종 검증표, 대시보드 연결을 확인 | 로컬 링크 검사 스크립트 출력 `OK`, `docs/32-service-url-smoke-test-runbook.md`, `docs/README.md`, `docs/21-service-url-verification.md`, `docs/22-final-submission-runbook.md`, `docs/27-final-validation-execution-sheet.md`, `docs/28-submission-readiness-dashboard.md` | 실제 URL smoke test는 최신 배포와 테스트 전용 계정 준비 후 제출 직전에 수행 필요. `output/` 산출물은 커밋 제외 정책 유지 |
| 2026-08-12 | `9989170` | 테스트 계정 시연 데이터 세팅 절차 추가 후 문서 링크 무결성 검사 | 통과. 찜·폴더·AI 일정·커뮤니티 시연 데이터를 준비하는 기준을 `docs/33-test-account-demo-data-runbook.md`에 정의하고 README, 테스트 계정 검증 절차, 런북, 캡처 계획, 대시보드 연결을 확인 | 로컬 링크 검사 스크립트 출력 `OK`, `docs/33-test-account-demo-data-runbook.md`, `docs/README.md`, `docs/19-test-account-verification.md`, `docs/22-final-submission-runbook.md`, `docs/31-submission-screenshot-plan.md`, `docs/28-submission-readiness-dashboard.md` | 실제 테스트 계정 생성과 DD-01~DD-06 데이터 세팅은 제출 직전 또는 캡처 작업 전에 수행 필요. `output/` 산출물은 커밋 제외 정책 유지 |
| 2026-08-12 | `34af5f7` | OpenAPI 제출용 작성표 추가 후 문서 링크 무결성 검사 | 통과. 제출 페이지와 기능설명서에 옮겨 적을 OpenAPI 명칭, endpoint별 보조 설명, 인증키 비기록 원칙을 `docs/34-openapi-submission-copy-sheet.md`에 정의하고 README, OpenAPI 검증 절차, 런북, 최종 검증표, 대시보드, 제출 체크리스트 연결을 확인 | 로컬 링크 검사 스크립트 출력 `OK`, `docs/34-openapi-submission-copy-sheet.md`, `docs/README.md`, `docs/20-openapi-submission-verification.md`, `docs/22-final-submission-runbook.md`, `docs/27-final-validation-execution-sheet.md`, `docs/28-submission-readiness-dashboard.md`, `docs/16-contest-submission-checklist.md` | 실제 제출 계정의 인코딩키·디코딩키, 배포 환경변수와 제출 계정 키 일치 여부, 최종 PDF 5페이지 API 목록 대조는 제출 직전 확인 필요. `output/` 산출물은 커밋 제외 정책 유지 |
| 2026-08-12 | `2046133` | 기능설명서 슬라이드별 최종 검수표 추가 후 문서 링크 무결성 검사 | 통과. 슬라이드 1~5와 PDF 제약을 제출 직전에 확인하는 `docs/35-pptx-slide-final-review-checklist.md`를 추가하고 README, PPTX 지시서, 런북, 최종 검증표, 대시보드 연결을 확인 | 로컬 링크 검사 스크립트 출력 `OK`, `docs/35-pptx-slide-final-review-checklist.md`, `docs/README.md`, `docs/26-pptx-final-editing-guide.md`, `docs/22-final-submission-runbook.md`, `docs/27-final-validation-execution-sheet.md`, `docs/28-submission-readiness-dashboard.md` | 실제 최종 PPTX/PDF 생성 후 슬라이드별 검수와 PDF 제약 검증은 제출 직전에 수행 필요. `output/` 산출물은 커밋 제외 정책 유지 |
| 2026-08-12 | `4753dc7` | 최종 제출 차단 항목 요약 추가 후 문서 링크 무결성 검사 | 통과. 남은 차단 항목을 사용자·팀 확인값, 계정·서비스 검증, OpenAPI, 최종 산출물, 제출 리스크로 묶은 `docs/36-final-blockers-summary.md`를 추가하고 README, 런북, 대시보드 연결을 확인 | 로컬 링크 검사 스크립트 출력 `OK`, `docs/36-final-blockers-summary.md`, `docs/README.md`, `docs/22-final-submission-runbook.md`, `docs/28-submission-readiness-dashboard.md` | 실제 제출 가능 판정은 사용자 제공값, 테스트 계정, OpenAPI 키, 최종 PPTX/PDF, 제출 페이지 검증이 끝난 뒤에만 가능. `output/` 산출물은 커밋 제외 정책 유지 |
| 2026-08-12 | `de2822f` | Google OAuth 계획 문서와 제출 입력값 일부 반영 후 링크 무결성 검사 | 통과. Google OAuth를 선택 로그인 후보로 정리한 `docs/37-google-oauth-plan.md`를 추가하고, 접수 팀명 `CodeTrip`, 지역 특화 서비스 없음, OpenAPI 키 원문 비기록 기준을 제출 준비 문서에 반영 | 로컬 링크 검사 스크립트 출력 `OK`, `docs/37-google-oauth-plan.md`, `docs/README.md`, `docs/25-final-input-checklist.md`, `docs/28-submission-readiness-dashboard.md`, `docs/36-final-blockers-summary.md` | Google OAuth는 계획됨 상태이며 코드 구현 미진행. OpenAPI 인코딩키·디코딩키는 공공데이터포털에서 확인 후 제출 페이지에만 입력 필요. `output/` 산출물은 커밋 제외 정책 유지 |
| 2026-08-16 | `security/gemini-functions-proxy` | Gemini Callable Function 프록시 배포 검증 | 통과. `GEMINI_API_KEY` Functions Secret 등록, `generateTripPlan` v2 callable Function 배포, Artifact Registry 1일 cleanup policy 설정, Hosting 배포, 배포 산출물 Gemini 키 원문 미포함, 미인증 Callable 요청 401 차단, 인증 성공 smoke test, 기존 노출 가능 키 삭제를 확인했습니다. | Firebase CLI 배포 로그, `functions:list` 결과, `dist secret scan: not found`, `callable unauth blocked: 401`, `Callable authenticated smoke test: success`, Hosting URL `https://dorigum-codetrip.web.app` | 없음 |
| 2026-08-16 | `security/gemini-functions-proxy` | Gemini Callable Function 인증 성공 smoke test | 통과. AI Studio 선불 크레딧 충전 후 Gemini 최소 호출 200 확인, 제출용 테스트 계정 Firebase ID token 기반 `generateTripPlan` Callable 호출 성공, 1일 코스 title과 days 응답 확인, Functions 로그에 `Gemini trip plan generated` 기록 확인 | `Gemini minimal call status: 200`, `Callable authenticated smoke test: success`, Functions 로그 `auth: VALID`, `Gemini trip plan generated` | 없음 |
| 2026-08-16 | `security/gemini-functions-proxy` | Gemini API 키 교체 및 Secret version 2 smoke test | 통과. 기존 2026-07-22 키를 `Gemini API Key_temp`로 식별 가능하게 이름 변경한 뒤 삭제했고, 2026-08-16 신규 키를 `.env`와 Firebase Secret `GEMINI_API_KEY` version 2로 등록했습니다. `generateTripPlan` 재배포 후 신규 키 최소 호출 200과 Callable 인증 호출 성공을 확인했습니다. | AI Studio 키 목록에서 기존 `Gemini API Key_temp` 미표시, Secret version 2 생성 로그, 검증일 2026-08-16, `Gemini new key minimal call status: 200`, `Callable new secret smoke test: success` | 없음 |
| 2026-08-16 | `f96c944` | 상세 지도 fallback과 축제 목록 9개 표시 보정 | 부분 검증. Kakao SDK 로딩 지연·로드 실패·API 키 누락 시 fallback UI를 표시하도록 했고, 데스크톱 3열 축제 목록 기준 페이지당 표시 개수를 9개로 조정했습니다. 정적 검증과 빌드는 통과했지만 실제 브라우저 수동 검증 로그는 별도로 필요합니다. | 정적 증빙: `src/pages/TravelDetail.jsx`, `src/pages/Festivals.jsx`, `npm run lint`, `npm run build` | 배포 후 Kakao Developers 도메인·키 설정, 상세 화면 fallback, 데스크톱 3열 표시를 수행 환경·브라우저·실패 지점과 함께 기록 필요 |
| 2026-08-16 | `ebace7c` | 축제 API pool 호출 최적화 | 부분 검증. 기본 축제 pool 상한을 3000건에서 1000건으로 줄이고, Home 트렌딩 미리보기는 `poolMaxRows: 100`으로 제한했습니다. 코드와 빌드는 확인했지만 실제 호출 수 감소는 아직 측정하지 않았습니다. | 정적 증빙: `src/api/travelInfoApi.js`, `src/api/travelApi.js`, `src/pages/Home.jsx`, `npm run lint`, `npm run build` | 개발 모드 Network 탭 또는 캐시 측정표로 호출 수를 세션별 기록 필요 |
| 2026-08-16 | `3a36800` | 축제 목록 반응형 표시 개수 보정 | 부분 검증. grid breakpoint에 맞춰 4열 12개, 3열 9개, 2열 10개, 1열 8개로 표시 개수를 동적으로 계산하도록 했습니다. 실제 화면 폭별 육안 검증 로그는 아직 없습니다. | 정적 증빙: `src/pages/Festivals.jsx`, `npm run lint`, `npm run build` | 데스크톱·태블릿·모바일 폭에서 표시 개수와 페이지 보정 결과를 수동 검증표에 기록 필요 |
| 2026-08-16 | `3437fe6` | AI Planner 중복 실행 방지 | 부분 검증. `generationInFlightRef`와 `saveInFlightRef`를 추가해 생성·저장 함수 진입 즉시 중복 실행을 차단했습니다. 생성/저장 버튼에 `aria-busy`를 추가했습니다. 실제 버튼 연타 Network 검증 로그는 아직 없습니다. | 정적 증빙: `src/pages/AiPlanner.jsx`, `npm run lint`, `npm run build` | 배포 후 버튼 연타 시 `generateTripPlan` Network 요청과 저장 요청이 1회만 발생하는지 기록 필요 |
| 2026-08-16 | `로컬 수정` | 카카오 지도 SDK 로딩 대기 보정 | 부분 검증. 기존 `kakao-map-script`가 이미 존재하지만 아직 로딩 중인 경우에도 `load`/`error` 이벤트를 기다리도록 수정했습니다. timeout은 20초로 늘리고, timeout 직전 Kakao Maps 준비 여부를 재확인하도록 했습니다. 실제 상세 화면 지도 표시 수동 로그는 별도로 필요합니다. | 정적 증빙: `src/pages/TravelDetail.jsx`, `npm run lint`, `npm run build` | 로컬·배포 상세 페이지에서 실제 지도 표시 여부와 실패 시 fallback 링크 동작을 기록 필요 |
| 2026-08-16 | `로컬 수정` | Home 자동 호출 지연·축소 | 부분 검증. Home 초기 진입에서 날씨 키워드 기반 여행지 추천 사전 검색을 제거하고, 위치 기반 보정 호출을 1.5초 지연 실행하도록 했습니다. 실제 호출 감소 수치는 아직 측정하지 않았습니다. | 정적 증빙: `src/pages/Home.jsx`, `npm run lint`, `npm run build` | 개발 모드 Home Network 탭에서 초기 호출 수와 슬롯 실행 시 호출 분리를 측정표에 기록 필요 |
| 2026-08-16 | `로컬 수정` | 상세 댓글 지연 로딩 | 부분 검증. 상세 TourAPI 조회와 Firebase 댓글 조회를 분리하고 댓글 전용 loading/error/retry UI를 추가했습니다. 실제 본문 선표시와 댓글 별도 로딩 수동 로그는 아직 없습니다. | 정적 증빙: `src/pages/TravelDetail.jsx`, `npm run lint`, `npm run build` | 상세 페이지에서 본문 선표시, 댓글 로딩, 실패 후 재시도 흐름을 수행 환경과 함께 기록 필요 |
| 2026-08-16 | `로컬 수정` | API 캐시 측정표 작성 | 통과. 캐시 이벤트를 memory, local, remote, network, stale로 분리하고 fresh hit과 stale fallback 계산식을 정의했습니다. | `docs/38-cache-measurement-sheet.md`, `docs/README.md` | 실제 세션별 측정값은 아직 미측정 |
| 2026-08-16 | `로컬 수정` | 카카오 지도 SDK 배포 표시 검증 | 통과. 무료 쿼터가 적용된 카카오 앱의 JavaScript SDK 도메인에 `http://localhost:5180`과 `https://dorigum-codetrip.web.app`을 등록하고, `.env`의 `VITE_KAKAO_MAP_API_KEY`를 JavaScript 키로 교체했습니다. 로컬 상세 페이지와 Firebase Hosting 배포 상세 페이지에서 카카오 지도가 정상 표시되는 것을 확인했습니다. | `src/pages/TravelDetail.jsx`, `CodeTrip_Firebase/project-log/2026-08-16.md`, `CodeTrip_Firebase/TROUBLESHOOTING.md`, 사용자 제공 배포 화면 캡처, `npm run lint`, `npm run build` | 배포 도메인 또는 로컬 포트 변경 시 Kakao Developers JavaScript SDK 도메인 목록을 함께 갱신해야 합니다. |
| 2026-08-16 | `9a3da63` | Firebase Hosting 서비스 URL smoke test | 부분 통과. 공개 URL `/`, `/explore`, `/festivals`, `/login`, `/board`와 직접 경로 접근은 정상 확인했습니다. 비로그인 `/ai-planner`와 `/board` 보호 안내, 로그인 후 홈·여행지 탐색·마이페이지·AI Planner 입력 화면·게시판 목록 접근도 확인했습니다. Gemini 신규 생성은 API 비용과 quota 관리를 위해 미실행으로 분리했습니다. | `docs/32-service-url-smoke-test-runbook.md`, `docs/27-final-validation-execution-sheet.md`, Hosting URL `https://dorigum-codetrip.web.app` | 최종 제출 직전 로그아웃 후 재로그인, 댓글 작성·수정·삭제, Gemini 생성 또는 저장된 AI 일정 결과 표시 증빙을 추가 확인해야 합니다. |
| 2026-08-16 | `로컬 수정` | OpenAPI 제출 정보와 최종 PDF 검증 절차 보강 | 부분 통과. `KorService2`, `PhotoGalleryService1`의 제출용 명칭과 endpoint 목록, 인증키 원문 비기록 원칙, 제출 페이지 직접 확인 항목, 최종 PDF 검증 절차를 보강했습니다. 코드·배포 화면의 관광 데이터 표시는 확인되었지만 제출 페이지 인증키 입력과 최종 PDF 5페이지 API 목록 대조는 최종본 기준으로 남겨두었습니다. | `docs/20-openapi-submission-verification.md`, `docs/34-openapi-submission-copy-sheet.md`, `docs/35-pptx-slide-final-review-checklist.md`, `docs/27-final-validation-execution-sheet.md`, `docs/17-submission-artifact-manifest.md` | 최종 PPTX/PDF 생성 후 페이지 수, 12pt 이상, 10MB 미만, 정상 열람, checksum, 외부 전달 위치를 기록해야 합니다. |
| 2026-08-16 | `5aacad6` | Firebase Hosting 주요 경로 HTTP smoke test | 통과. 공개 URL `/`, `/explore`, `/festivals`, `/login`, `/board`, `/ai-planner`에 대해 HTTP HEAD 요청을 실행했고, 모든 경로가 `200 text/html; charset=utf-8`로 응답했습니다. SPA 직접 경로가 Firebase 404로 떨어지지 않는 것을 확인했습니다. | `docs/32-service-url-smoke-test-runbook.md`, `docs/27-final-validation-execution-sheet.md`, Hosting URL `https://dorigum-codetrip.web.app` | HTTP 응답 확인은 통과했지만 최종 제출 전에는 브라우저 화면 기준으로 로그인·로그아웃·AI 저장 결과·댓글 흐름을 다시 확인하는 것이 좋습니다. |

## 핵심 사용자 흐름 체크리스트

릴리스 전 아래 흐름을 최소 1회 확인합니다.

| ID | 흐름 | 결과 | 증빙 | 비고 |
|---|---|---|---|---|
| VF-01 | 비로그인 여행지 탐색, 검색, 상세 조회 | 미실행 | 없음 | 탐색·상세·빈 결과 포함 |
| VF-02 | 회원가입, 로그인, 로그아웃 | 미실행 | 없음 | 인증 상태별 보호 화면 포함 |
| VF-03 | 찜, 폴더, 메모 생성·수정·삭제 | 미실행 | 없음 | 본인 데이터 접근만 허용되는지 확인 |
| VF-04 | AI 일정 생성, 실패 안내, 저장 | 미실행 | 없음 | timeout, 429, JSON 실패는 별도 케이스 |
| VF-05 | 게시글, 댓글, 좋아요 작성·수정·삭제 | 미실행 | 없음 | 작성자 권한 확인 |
| VF-06 | 마이페이지 활동 내역 확인 | 미실행 | 없음 | AI 코스 문서 표시 포함 |
| VF-07 | 모바일·데스크톱 반응형 확인 | 미실행 | 없음 | 주요 화면 최소 확인 |

## 성능 측정 기록 템플릿

| 날짜 | 기준 커밋 | 측정 환경 | 항목 | 현재값 | 목표값 | 증빙 | 비고 |
|---|---|---|---|---|---|---|---|
| YYYY-MM-DD | `commit` | 브라우저·네트워크·기기 | 초기 로딩 청크 크기 | 미측정 | TBD | 빌드 로그 | 적용 전후 비교 필요 |
| YYYY-MM-DD | `commit` | 브라우저·네트워크·기기 | Lighthouse LCP | 미측정 | TBD | Lighthouse 결과 | 동일 환경 반복 측정 |
| YYYY-MM-DD | `commit` | 시연 세션 | 캐시 적중률 | 미측정 | TBD | `docs/38-cache-measurement-sheet.md` | memory/local/remote/network/stale 구분 |
| YYYY-MM-DD | `commit` | AI 생성 시나리오 | AI 생성 성공률 | 미측정 | TBD | 운영 로그 또는 수동 기록 | timeout/429/JSON 실패 구분 |

## 보고 규칙

- `통과`는 실행 결과와 증빙 위치가 있을 때만 사용합니다.
- `최근 검증 기록 있음`은 현재 커밋에서 재실행하지 않았다는 의미이며, 릴리스 통과와 동일하게 취급하지 않습니다.
- 문서만 변경된 커밋도 README 링크, 문서 번호, 증빙 경로가 깨지지 않았는지 확인합니다.
- 검증 중 발견한 리스크는 `docs/12-technical-debt-register.md` 또는 백로그 문서에 연결합니다.
