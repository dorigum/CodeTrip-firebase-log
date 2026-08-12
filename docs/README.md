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

의사결정은 [`decision-log/README.md`](decision-log/README.md), 회고는 [`retrospectives/README.md`](retrospectives/README.md)에 기록한다. 기존의 일일 개발 기록과 장애 기록은 `CodeTrip_Firebase/project-log/` 및 `CodeTrip_Firebase/TROUBLESHOOTING.md`에서 유지한다.

## 문서 운영 규칙

- 기능·구조 변경 시 관련 문서를 같은 변경에 갱신한다.
- 수치가 없는 평가는 측정 방법과 증빙 위치를 함께 기록한다.
- 확정되지 않은 내용은 `제안` 또는 `미결정`으로 표시한다.
- 문서는 UTF-8로 저장하고 파일명은 영문 kebab-case를 사용한다.
- 배포 가능한 변경은 릴리스 체크리스트와 변경 기록을 남긴다.
