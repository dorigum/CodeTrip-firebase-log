# 공모전 기능설명서 최종 제출 런북

이 문서는 CodeTrip의 2026 관광데이터 활용 공모전 웹·앱 개발 부문 1차 심사 자료를 최종 제출하기 직전에 따라야 할 실행 순서를 정리한다. 개별 검증 문서가 많아진 상태에서 제출 누락을 줄이기 위한 최상위 실행 문서다.

## 사용 시점

아래 조건 중 하나라도 해당하면 이 문서를 기준으로 제출 준비 상태를 재점검한다.

- 기능설명서 최종 PPTX/PDF를 만들기 직전
- 한국관광 콘텐츠랩 제출 페이지에 값을 입력하기 직전
- 테스트 계정 또는 OpenAPI 인증키 정보를 확정하기 직전
- 제출 파일을 PDF로 변환하고 첨부하기 직전

## 실행 순서

| 순서 | 작업 | 참조 문서 | 완료 증빙 |
|---:|---|---|---|
| 1 | 공모전 접수 계정 로그인과 이메일 인증 가능 여부 확인 | `docs/16-contest-submission-checklist.md` | 제출 페이지 접근 가능 여부 |
| 2 | 전체 제출 준비도와 차단 항목 확인 | `docs/28-submission-readiness-dashboard.md`, `docs/36-final-blockers-summary.md` | B-01~B-10 현재 상태와 우선순위 확인 |
| 3 | 사용자 제공 입력값과 민감정보 기록 금지 범위 확인 | `docs/30-user-provided-submission-inputs.md` | UI-01~UI-13 준비 상태 확인 |
| 4 | 접수 팀명과 최종 팀원 정보 확인 | `docs/16-contest-submission-checklist.md` | 기능설명서 1페이지 팀명 반영 |
| 5 | 최종 입력값 누락 여부 1차 점검 | `docs/25-final-input-checklist.md` | FI-01~FI-19 현재 상태 확인 |
| 6 | 전국 단위 제출 또는 지역 특화 제출 여부 결정 | `docs/23-regional-specialization-strategy.md`, `docs/25-final-input-checklist.md` | 제출 페이지와 기능설명서 반영 방향 확정 |
| 7 | 서비스 URL 최신 배포 상태 확인 | `docs/21-service-url-verification.md`, `docs/32-service-url-smoke-test-runbook.md` | `docs/13-validation-report.md` URL smoke test 기록 |
| 8 | 테스트 전용 계정 생성 및 로그인 후 기능 검증 | `docs/19-test-account-verification.md`, `docs/33-test-account-demo-data-runbook.md` | `docs/13-validation-report.md` TA-01~TA-06 기록 |
| 9 | OpenAPI 인증키와 활용 API 목록 확인 | `docs/20-openapi-submission-verification.md`, `docs/34-openapi-submission-copy-sheet.md` | 제출 계정 기준 키 확인, CS-05~CS-06 갱신 |
| 10 | 로그인 후 실제 기능 화면 캡처 | `docs/19-test-account-verification.md`, `docs/21-service-url-verification.md`, `docs/31-submission-screenshot-plan.md` | `output/contest/screenshots/` 캡처 후보 생성 |
| 11 | 기능설명서 PPTX 최종 반영 | `docs/16-contest-submission-checklist.md`, `docs/18-submission-gap-analysis.md`, `docs/23-regional-specialization-strategy.md`, `docs/24-submission-copywriting.md`, `docs/25-final-input-checklist.md`, `docs/26-pptx-final-editing-guide.md` | 팀명, 캡처, API 목록, 지역 특화 여부, 서비스 소개 문구, 발전계획 반영 |
| 12 | PDF 변환 및 제출 조건 검증 | `docs/17-submission-artifact-manifest.md`, `docs/35-pptx-slide-final-review-checklist.md` | 5페이지 이하, 12pt 이상, 10MB 미만, 정상 열람 확인 |
| 13 | 산출물 manifest 갱신 | `docs/17-submission-artifact-manifest.md` | 최종 파일명, 생성일, checksum, 외부 전달 위치 |
| 14 | 중복 출품·부문 오첨부·마감 리스크 확인 | `docs/25-final-input-checklist.md`, `docs/27-final-validation-execution-sheet.md` | FI-17~FI-19, VE-10~VE-12, SUB-01~SUB-03 확인 |
| 15 | 제출 페이지 입력·첨부 전 최종 확인 | `docs/18-submission-gap-analysis.md`, `docs/25-final-input-checklist.md`, `docs/27-final-validation-execution-sheet.md`, `docs/28-submission-readiness-dashboard.md` | 모든 제출 가능 판정 기준 충족 |

## 최종 제출 전 입력값

아래 값은 저장소에 실제 원문을 남기지 않는다. 제출 페이지나 최종 PDF에 반영할 때만 사용한다.

| 입력값 | 저장소 기록 여부 | 확인 위치 | 반영 위치 |
|---|---|---|---|
| 접수 팀명 | 실제 값 기록 가능하나 제출 페이지 기준 확인 필요 | 한국관광 콘텐츠랩 접수 페이지 | 기능설명서 1페이지, 제출 페이지 |
| 팀원 정보 | 개인정보이므로 저장소 기록 금지 | 한국관광 콘텐츠랩 접수 페이지 | 제출 페이지 |
| 테스트 계정 ID/PW | 저장소 기록 금지 | Firebase Auth, 제출 페이지 | 제출 페이지 서비스 테스트 정보 |
| OpenAPI 인코딩키·디코딩키 | 저장소 기록 금지 | 공공데이터포털 | 제출 페이지 OpenAPI 활용 정보 |
| 지역 특화 여부 | 결정 결과 기록 가능 | `docs/23-regional-specialization-strategy.md` 기준 결정 | 제출 페이지, 기능설명서 |
| 최종 PDF 파일 | 바이너리 커밋 제외 | `output/contest/` 또는 외부 저장 위치 | 제출 첨부파일 |

## 최종 제출 가능 판정

아래 항목이 모두 `통과` 또는 `완료` 상태가 되어야 제출 가능으로 판정한다.

| 항목 | 판정 기준 | 현재 기준 문서 |
|---|---|---|
| 제출 파일 형식 | 제공 양식 기반 PPTX 작성 후 PDF 변환 | `docs/16-contest-submission-checklist.md` |
| PPTX 최종 편집 | 슬라이드별 팀명, 문구, 캡처, OpenAPI, 발전계획 반영 | `docs/26-pptx-final-editing-guide.md` |
| PDF 제약 | 5페이지 이하, 12pt 이상, 10MB 미만, 정상 열람 | `docs/17-submission-artifact-manifest.md` |
| 서비스 URL | 공개 URL 접속, 직접 경로 새로고침, 주요 공개 화면 확인 | `docs/21-service-url-verification.md` |
| 테스트 계정 | 전용 계정 생성, 로그인, 보호 기능 접근 확인 | `docs/19-test-account-verification.md` |
| OpenAPI | 제출 계정 키, 실제 환경변수, 기능설명서 API 목록, 코드 endpoint 목록 일치 | `docs/20-openapi-submission-verification.md` |
| 지역 특화 여부 | 전국 단위 유지 또는 특정 지역 특화 전환 여부가 제출 페이지·기능설명서와 일치 | `docs/23-regional-specialization-strategy.md` |
| 화면 캡처 | 대표 이미지 1장, 상세 이미지 3~5장, 개인정보·키 노출 없음 | `docs/17-submission-artifact-manifest.md` |
| 최종 manifest | 파일명, 생성일, checksum, 외부 전달 위치 기록 | `docs/17-submission-artifact-manifest.md` |
| 최종 입력값 | FI-01~FI-16 항목의 제출 전 확인 상태 기록 | `docs/25-final-input-checklist.md` |
| 최종 검증 실행 | 제출 페이지 입력값, URL, 테스트 계정, PDF 제약, checksum의 실행 결과 기록 | `docs/27-final-validation-execution-sheet.md` |
| 제출 준비도 | 제출 초안, 차단 항목, 심사 기준 대응 상태 요약 | `docs/28-submission-readiness-dashboard.md` |

## 제출 후 기록

제출을 완료하면 아래 내용을 저장소 문서에 남긴다. 단, 인증키, 비밀번호, 개인 이메일, 개인정보는 기록하지 않는다.

- 제출 완료일
- 제출한 기능설명서 PDF 파일명
- 제출 산출물 checksum
- 외부 전달 위치 또는 제출 페이지 상태
- 제출 직전 서비스 URL smoke test 결과
- 제출 직전 테스트 계정 검증 결과
- 제출 직전 OpenAPI 활용 정보 대조 결과

## 현재 미완료 항목

현재 문서와 산출물 기준으로 남은 핵심 미완료 항목은 다음과 같다.

1. 접수 팀명과 최종 팀원 정보 확인
2. 전국 단위 제출 또는 지역 특화 제출 여부 최종 결정
3. `docs/25-final-input-checklist.md`의 FI-01~FI-16 상태 확인
4. 테스트 전용 계정 생성 및 로그인 후 기능 검증
5. 로그인 후 AI·마이페이지·커뮤니티 실제 화면 캡처 교체
6. OpenAPI 인증키와 제출 계정 기준 호출 정보 확인
7. 제출 직전 최신 배포 URL smoke test
8. 최종 PDF 생성 후 manifest의 외부 전달 위치 갱신
9. `docs/27-final-validation-execution-sheet.md` 기준으로 제출 직전 차단 조건 확인
10. 동일 서비스 중복 출품 여부, 웹·앱 개발 부문 양식 일치 여부, 마감 전 수정 가능 시간 확인
