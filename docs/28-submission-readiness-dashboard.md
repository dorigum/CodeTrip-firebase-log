# 공모전 제출 준비도 대시보드

이 문서는 CodeTrip의 2026 관광데이터 활용 공모전 웹·앱 개발 부문 1차 심사 자료 제출 준비 상태를 한눈에 보기 위한 요약 문서다. 세부 절차는 각 기준 문서에 따르며, 이 문서는 최종 의사결정과 남은 차단 항목 파악을 돕기 위한 현황판이다.

## 현재 종합 판정

현재 상태는 `제출 초안 준비 완료, 최종 제출은 보류`로 분류한다.

문서 체계, 기능설명서 5페이지 초안, 제출용 문구, 최종 입력값 체크표, 사용자 제공 입력값 준비 패킷, PPTX 최종 편집 지시서, 최종 검증 실행표는 준비되어 있다. 다만 실제 접수 팀명, 테스트 전용 계정, OpenAPI 인증키, 로그인 후 내부 화면 캡처, 최종 PDF 생성·검증은 아직 완료되지 않았다.

따라서 현재 문서만으로는 제출 준비 방향을 설명할 수 있지만, 실제 제출 버튼을 누르기 전에는 `docs/27-final-validation-execution-sheet.md`의 차단 조건을 모두 통과해야 한다.

## 준비도 요약

| 영역 | 현재 상태 | 판정 | 근거 | 다음 조치 |
|---|---|---|---|---|
| 제출 문서 체계 | 문서 목록, 체크리스트, 런북, 검증표까지 구성됨 | 준비됨 | `docs/README.md`, `docs/13-validation-report.md` | 실제 검증 결과 반영 |
| 사용자 제공 입력값 | 저장소 기록 가능 값과 금지 값을 분리함 | 준비됨 | `docs/30-user-provided-submission-inputs.md` | UI-01~UI-13 실제 값 확인 |
| 기능설명서 초안 | 5페이지 제출 항목 정리본 초안 존재 | 부분 준비 | `docs/17-submission-artifact-manifest.md`, `docs/18-submission-gap-analysis.md` | 팀명·캡처·최종 입력값 반영 |
| 제출용 문구 | 서비스 개요, 주제 선정 이유, 차별성, 발전계획 문구 정리 | 준비됨 | `docs/24-submission-copywriting.md` | PPTX 공간에 맞춰 최종 반영 |
| 지역 특화 전략 | 전국 단위 제출 기본 권장과 전환 조건 문서화 | 결정 필요 | `docs/23-regional-specialization-strategy.md` | 전국 단위 유지 또는 특정 지역 특화 확정 |
| 서비스 URL | 후보 URL과 검증 절차 문서화 | 부분 준비 | `docs/21-service-url-verification.md` | 제출 직전 smoke test 실행 |
| 테스트 계정 | 생성·검증 절차 문서화 | 미완료 | `docs/19-test-account-verification.md` | 제출용 전용 계정 생성 |
| OpenAPI 제출 정보 | 활용 API 목록과 검증 절차 문서화 | 미완료 | `docs/20-openapi-submission-verification.md` | 인코딩키·디코딩키와 제출 계정 확인 |
| 로그인 후 화면 캡처 | 교체 우선순위 문서화 | 미완료 | `docs/16-contest-submission-checklist.md`, `docs/26-pptx-final-editing-guide.md` | AI·마이페이지·커뮤니티 내부 화면 캡처 |
| 화면 캡처 계획 | 대표·상세 이미지 후보와 보안 점검 기준 정의 | 준비됨 | `docs/31-submission-screenshot-plan.md` | SC-04~SC-06 실제 캡처 확보 |
| 최종 PDF 검증 | 초안 PDF의 페이지·용량·글자 크기 검증 기록 있음 | 부분 준비 | `docs/13-validation-report.md`, `docs/17-submission-artifact-manifest.md` | 최종본 변환 후 재검증 |
| 제출 직전 실행표 | VE, URL, TA, PDF 검증표 작성 | 준비됨 | `docs/27-final-validation-execution-sheet.md` | 실제 제출 직전 결과 입력 |
| 제출 리스크 관리 | 중복 출품, 부문 오첨부, 마감 전 수정 가능 시간 확인 항목 보강 | 부분 준비 | `docs/25-final-input-checklist.md`, `docs/27-final-validation-execution-sheet.md` | 제출 직전 실제 확인 |

## 참고 준비도

아래 수치는 완료 주장이 아니라 현재 작업 상태를 빠르게 보기 위한 참고값이다.

| 구분 | 준비도 | 해석 |
|---|---:|---|
| 문서 체계 | 90% | 문서 구조와 연결은 갖춰졌고 링크 무결성 검사도 통과했다. |
| 기능설명서 초안 | 70% | 5페이지 초안은 있으나 팀명, 로그인 후 캡처, 최종 입력값 반영이 남아 있다. |
| 제출 페이지 입력 준비 | 45% | 입력 항목은 정리됐지만 실제 팀명, 계정, OpenAPI 키 확인이 필요하다. |
| 서비스 검증 | 40% | 검증 절차는 있으나 최종 URL smoke test와 테스트 계정 검증은 미실행이다. |
| 최종 제출 가능성 | 55% | 방향과 문서는 준비됐지만 차단 조건이 아직 남아 있다. |

## 제출 직전 차단 항목

아래 항목은 완료 전까지 최종 제출을 보류한다.

| ID | 차단 항목 | 현재 상태 | 해소 기준 | 기준 문서 |
|---|---|---|---|---|
| B-01 | 접수 팀명 placeholder 제거 | 미완료 | 기능설명서 1페이지에 실제 접수 팀명 반영 | `docs/25-final-input-checklist.md`, `docs/26-pptx-final-editing-guide.md` |
| B-02 | 테스트 전용 계정 생성·검증 | 미완료 | 제출용 계정으로 로그인, 로그아웃 후 재로그인, 보호 기능 접근 확인 | `docs/19-test-account-verification.md` |
| B-03 | OpenAPI 인증키 확인 | 미완료 | 공공데이터포털 인코딩키·디코딩키를 제출 페이지에만 입력 | `docs/20-openapi-submission-verification.md` |
| B-04 | OpenAPI 활용 목록 최종 대조 | 부분 준비 | 제출 페이지, 기능설명서, 코드 endpoint 목록 일치 | `docs/20-openapi-submission-verification.md` |
| B-05 | 로그인 후 내부 화면 캡처 | 미완료 | AI 일정, 마이페이지 또는 찜·폴더, 커뮤니티 화면 중 핵심 캡처 확보 | `docs/26-pptx-final-editing-guide.md`, `docs/31-submission-screenshot-plan.md` |
| B-06 | 최종 PPTX/PDF 생성 | 미완료 | 최종 파일명으로 PPTX/PDF 생성 | `docs/26-pptx-final-editing-guide.md` |
| B-07 | 최종 PDF 제약 검증 | 미완료 | 5페이지 이하, 12pt 이상, 10MB 미만, 정상 열람 확인 | `docs/27-final-validation-execution-sheet.md` |
| B-08 | 최종 checksum·전달 위치 기록 | 미완료 | 최종 산출물의 SHA-256, 파일 크기, 생성일, 전달 위치 기록 | `docs/17-submission-artifact-manifest.md` |
| B-09 | 제출 직전 차단 조건 통과 | 미실행 | `VE`, `URL`, `TA`, `PDF` 차단 항목 모두 통과 | `docs/27-final-validation-execution-sheet.md` |
| B-10 | 중복 출품·부문 오첨부·마감 리스크 확인 | 미확인 | 동일 서비스 중복 출품 없음, 웹·앱 개발 부문 양식 일치, 마감 전 수정 가능 시간 확보 | `docs/25-final-input-checklist.md`, `docs/27-final-validation-execution-sheet.md` |

## 심사 기준 대응 상태

| 심사항목 | 배점 | 현재 대응 상태 | 보강 필요 |
|---|---:|---|---|
| 서비스 기획력 | 30 | 사용자 문제, 서비스 개요, 차별성 문구가 정리되어 있다. | 지역 특화 여부 최종 결정, PPTX 최종 문구 반영 |
| 서비스 완성도 | 30 | 배포 URL 후보, 공개 화면 캡처, 핵심 기능 흐름 초안이 있다. | 테스트 계정 검증, 로그인 후 내부 화면 캡처, 최종 smoke test |
| 데이터 활용 적절성 | 20 | TourAPI 활용 endpoint와 기타 API 목록이 정리되어 있다. | OpenAPI 인증키와 제출 계정 기준 활용 API 최종 대조 |
| 서비스 발전성 | 20 | Functions 프록시, 권한 검증, 성능 측정, E2E 테스트, 지역 큐레이션 발전계획이 정리되어 있다. | 최종 PPTX에서 기술 부채를 과장 없이 발전계획으로 표현 |

## 다음 실행 순서

1. 접수 페이지에서 팀명과 최종 팀원 정보를 확인한다.
2. `docs/30-user-provided-submission-inputs.md` 기준으로 사용자 제공 입력값과 민감정보 기록 금지 범위를 확인한다.
3. 지역 특화 여부를 전국 단위 제출로 유지할지 최종 결정한다.
4. 테스트 전용 계정을 생성하고 로그인·AI·마이페이지·커뮤니티 접근을 검증한다.
5. OpenAPI 인증키와 활용 API 목록을 제출 계정 기준으로 확인한다.
6. 로그인 후 내부 화면 캡처를 확보한다.
7. `docs/26-pptx-final-editing-guide.md` 기준으로 최종 PPTX를 수정한다.
8. 최종 PDF로 변환하고 `docs/27-final-validation-execution-sheet.md` 기준으로 검증한다.
9. 최종 산출물 checksum과 전달 위치를 `docs/17-submission-artifact-manifest.md`에 기록한다.
10. 중복 출품, 부문 오첨부, 마감 후 수정 불가 리스크를 제출 직전에 다시 확인한다.

## 상태 갱신 규칙

- 이 문서는 실제 확인이 끝날 때마다 갱신한다.
- 민감정보 원문은 기록하지 않는다.
- 준비도 수치는 참고값이며, 최종 제출 가능 여부는 `docs/27-final-validation-execution-sheet.md`의 차단 조건 통과 여부로 판단한다.
- 최종 제출을 완료하면 제출 완료일, 최종 PDF 파일명, checksum, 제출 직전 검증 결과를 갱신한다.
