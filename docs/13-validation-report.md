# 검증 보고서

이 문서는 CodeTrip의 릴리스 또는 주요 변경 단위 검증 결과를 기록한다. 검증 보고서는 완료 주장보다 증빙 위치를 우선한다. 실행하지 않은 항목은 `미실행`, 측정값이 없는 항목은 `측정값 없음`으로 기록한다.

## 기록 기준

- 검증 단위는 커밋, PR, 릴리스, 배포 중 하나로 잡는다.
- `npm run lint`, `npm run build`, 핵심 시나리오, 권한 점검, 성능 측정, 배포 확인을 분리해 기록한다.
- 수동 검증은 수행자, 환경, 확인 흐름, 실패 지점을 남긴다.
- 정량 지표는 측정 방법과 원본 위치가 있을 때만 실제값으로 기록한다.
- 미해결 이슈는 기술 부채 등록부 또는 백로그와 연결한다.

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

## 핵심 사용자 흐름 체크리스트

릴리스 전 아래 흐름을 최소 1회 확인한다.

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
| YYYY-MM-DD | `commit` | 시연 세션 | 캐시 적중률 | 미측정 | TBD | 캐시 측정표 | memory/local/remote/network/stale 구분 |
| YYYY-MM-DD | `commit` | AI 생성 시나리오 | AI 생성 성공률 | 미측정 | TBD | 운영 로그 또는 수동 기록 | timeout/429/JSON 실패 구분 |

## 보고 규칙

- `통과`는 실행 결과와 증빙 위치가 있을 때만 사용한다.
- `최근 검증 기록 있음`은 현재 커밋에서 재실행하지 않았다는 의미이며, 릴리스 통과와 동일하게 취급하지 않는다.
- 문서만 변경된 커밋도 README 링크, 문서 번호, 증빙 경로가 깨지지 않았는지 확인한다.
- 검증 중 발견한 리스크는 `docs/12-technical-debt-register.md` 또는 백로그 문서에 연결한다.
