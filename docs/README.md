# CodeTrip 프로젝트 문서

CodeTrip은 여행지 탐색, 여행 정보 확인, 찜·폴더 관리, AI 여행 일정 생성, 여행 커뮤니티를 제공하는 심사 가능한 MVP를 목표로 한다.

## 문서 목록

1. [프로젝트 헌장](01-project-charter.md)
2. [제품 요구사항](02-product-requirements.md)
3. [사용자 흐름](03-user-flows.md)
4. [기술 아키텍처](04-architecture.md)
5. [데이터·보안](05-data-security.md)
6. [품질 계획](06-quality-plan.md)
7. [WBS·로드맵](07-wbs-roadmap.md)
8. [운영·릴리스](08-operations-release.md)
9. [KPI·평가 지표](09-metrics.md)
10. [기술 노트 마인드맵](tech-notes/README.md)
11. [Gemini 하네스 엔지니어링](10-ai-harness-engineering.md)
12. [AI 문서 분석 규칙](11-ai-document-analysis-rules.md)
13. [기술 부채 등록부](12-technical-debt-register.md)
14. [검증 보고서](13-validation-report.md)
15. [백로그](14-backlog.md)
16. [심사 시연 시나리오](15-demo-scenario.md)
17. [공모전 1차 심사 제출 준비](16-contest-submission-checklist.md)
18. [제출 산출물 manifest](17-submission-artifact-manifest.md)
19. [공모전 기능설명서 제출 갭 분석](18-submission-gap-analysis.md)
20. [심사용 테스트 계정 검증 절차](19-test-account-verification.md)
21. [한국관광공사 OpenAPI 제출 정보 검증 절차](20-openapi-submission-verification.md)
22. [서비스 URL 제출 전 검증 절차](21-service-url-verification.md)
23. [공모전 기능설명서 최종 제출 런북](22-final-submission-runbook.md)
24. [공모전 지역 특화 제출 전략](23-regional-specialization-strategy.md)
25. [공모전 기능설명서 제출용 문구](24-submission-copywriting.md)
26. [공모전 최종 입력값 체크표](25-final-input-checklist.md)
27. [기능설명서 PPTX 최종 반영 작업 지시서](26-pptx-final-editing-guide.md)
28. [공모전 최종 검증 실행표](27-final-validation-execution-sheet.md)
29. [공모전 제출 준비도 대시보드](28-submission-readiness-dashboard.md)
30. [공모전 심사 대응 Q&A](29-contest-judge-qa.md)
31. [공모전 사용자 제공 입력값 준비 패킷](30-user-provided-submission-inputs.md)
32. [공모전 기능설명서 화면 캡처 계획](31-submission-screenshot-plan.md)
33. [공모전 서비스 URL Smoke Test 실행표](32-service-url-smoke-test-runbook.md)
34. [공모전 테스트 계정 시연 데이터 세팅 절차](33-test-account-demo-data-runbook.md)
35. [공모전 OpenAPI 제출용 작성표](34-openapi-submission-copy-sheet.md)

## 공모전 제출 준비 빠른 사용 순서

공모전 1차 심사 자료를 준비할 때는 아래 순서로 문서를 확인한다.

1. [공모전 제출 준비도 대시보드](28-submission-readiness-dashboard.md)에서 현재 상태와 차단 항목을 먼저 확인한다.
2. [공모전 기능설명서 제출 갭 분석](18-submission-gap-analysis.md)에서 제출 조건별 충족·미충족 상태를 확인한다.
3. [공모전 사용자 제공 입력값 준비 패킷](30-user-provided-submission-inputs.md)에서 저장소에 남기면 안 되는 값과 사용자 직접 확인값을 분리한다.
4. [공모전 기능설명서 최종 제출 런북](22-final-submission-runbook.md)의 실행 순서에 따라 작업한다.
5. [공모전 최종 입력값 체크표](25-final-input-checklist.md)로 접수 팀명, 테스트 계정, OpenAPI, 서비스 URL 등 실제 입력값을 점검한다.
6. [공모전 OpenAPI 제출용 작성표](34-openapi-submission-copy-sheet.md)로 제출 페이지와 기능설명서에 적을 API 목록을 대조한다.
7. [공모전 지역 특화 제출 전략](23-regional-specialization-strategy.md)에서 전국 단위 제출 또는 지역 특화 제출 여부를 확정한다.
8. [공모전 기능설명서 제출용 문구](24-submission-copywriting.md)의 축약 문구를 기준으로 PPTX 문구를 정리한다.
9. [공모전 테스트 계정 시연 데이터 세팅 절차](33-test-account-demo-data-runbook.md)에 따라 찜·폴더·AI 일정·커뮤니티 시연 데이터를 준비한다.
10. [공모전 기능설명서 화면 캡처 계획](31-submission-screenshot-plan.md)에 따라 대표 이미지와 상세 이미지 후보를 확보한다.
11. [공모전 서비스 URL Smoke Test 실행표](32-service-url-smoke-test-runbook.md)로 제출 URL, 직접 경로 새로고침, 로그인 후 화면을 확인한다.
12. [기능설명서 PPTX 최종 반영 작업 지시서](26-pptx-final-editing-guide.md)에 따라 최종 PPTX를 수정한다.
13. [공모전 최종 검증 실행표](27-final-validation-execution-sheet.md)로 제출 직전 차단 조건을 검증한다.
14. [제출 산출물 manifest](17-submission-artifact-manifest.md)에 최종 PPTX/PDF 파일명, 생성일, checksum, 전달 위치를 기록한다.
15. [검증 보고서](13-validation-report.md)에 최종 URL, 테스트 계정, PDF 검증 요약을 남긴다.
16. [공모전 심사 대응 Q&A](29-contest-judge-qa.md)로 기능설명서와 시연 답변의 표현을 맞춘다.

실제 비밀번호, OpenAPI 인증키, 개인 이메일, 팀원 개인정보는 저장소에 기록하지 않는다. `output/` 산출물은 별도 지시 전까지 커밋 대상에서 제외한다.

의사결정은 [`decision-log/README.md`](decision-log/README.md), 회고는 [`retrospectives/README.md`](retrospectives/README.md)에 기록한다. 기존의 일일 개발 기록과 장애 기록은 `CodeTrip_Firebase/project-log/` 및 `CodeTrip_Firebase/TROUBLESHOOTING.md`에서 유지한다.

## 문서 운영 규칙

- 기능·구조 변경 시 관련 문서를 같은 변경에 갱신한다.
- 수치가 없는 평가는 측정 방법과 증빙 위치를 함께 기록한다.
- 확정되지 않은 내용은 `제안` 또는 `미결정`으로 표시한다.
- 문서는 UTF-8로 저장하고 파일명은 영문 kebab-case를 사용한다.
- 배포 가능한 변경은 릴리스 체크리스트와 변경 기록을 남긴다.
