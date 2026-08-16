# 공모전 기능설명서 슬라이드별 최종 검수표

이 문서는 CodeTrip 공모전 기능설명서 최종 PPTX/PDF를 제출하기 직전에 슬라이드별로 확인할 항목을 정리한 검수표입니다. `docs/26-pptx-final-editing-guide.md`가 편집 지시서라면, 이 문서는 최종본을 열어 놓고 빠뜨린 항목을 확인하는 체크리스트입니다.

## 사용 시점

- 최종 PPTX 편집을 마친 직후
- PDF 변환 직후
- 한국관광 콘텐츠랩 제출 페이지에 PDF를 첨부하기 직전
- 최종 제출 후 manifest와 검증 보고서를 갱신하기 직전

## 공통 검수 기준

| ID | 검수 항목 | 통과 기준 | 결과 |
|---|---|---|---|
| ALL-01 | 제공 양식 사용 | 공모전 제공 PPTX 양식을 기반으로 작성했습니다. | 미실행 |
| ALL-02 | 필수 항목 유지 | 양식의 필수 작성 항목을 임의로 삭제하지 않았습니다. | 미실행 |
| ALL-03 | 페이지 수 | PDF 기준 5페이지 이하입니다. | 미실행 |
| ALL-04 | 글자 크기 | 모든 주요 텍스트가 12포인트 이상입니다. | 미실행 |
| ALL-05 | 파일 용량 | PDF 파일이 10MB 미만입니다. | 미실행 |
| ALL-06 | 정상 열람 | PDF가 정상적으로 열리고, 글자·이미지·표가 잘리지 않습니다. | 미실행 |
| ALL-07 | 원본 가이드 문구 제거 | 작성 안내용 placeholder 또는 원본 가이드 문구가 남아 있지 않습니다. | 미실행 |
| ALL-08 | 민감정보 미노출 | 비밀번호, OpenAPI 인증키, 개인 이메일, 팀원 개인정보가 노출되지 않습니다. | 미실행 |
| ALL-09 | 초안 파일명 아님 | 제출 파일명이 `초안`이 아닌 최종본 이름입니다. | 미실행 |
| ALL-10 | checksum 기록 | 최종 PPTX/PDF의 파일명, 크기, SHA-256, 외부 전달 위치를 기록했습니다. | 미실행 |

## 슬라이드 1 검수: 표지

| ID | 검수 항목 | 통과 기준 | 연결 문서 | 결과 |
|---|---|---|---|---|
| S1-01 | 팀명 placeholder 제거 | `[접수 팀명 입력]` 문구가 남아 있지 않습니다. | `docs/25-final-input-checklist.md` | 미실행 |
| S1-02 | 팀명 일치 | 접수 페이지의 팀명과 기능설명서 팀명이 일치합니다. | `docs/16-contest-submission-checklist.md` | 미실행 |
| S1-03 | 서비스명 일치 | 서비스명이 `CodeTrip`으로 표시되어 제출 페이지와 일치합니다. | `docs/01-project-charter.md` | 미실행 |
| S1-04 | 개인정보 미노출 | 팀원 개인정보, 이메일, 전화번호가 불필요하게 노출되지 않습니다. | `docs/30-user-provided-submission-inputs.md` | 미실행 |

## 슬라이드 2 검수: 서비스 소개

| ID | 검수 항목 | 통과 기준 | 연결 문서 | 결과 |
|---|---|---|---|---|
| S2-01 | 서비스 유형 | 웹 서비스 또는 웹으로 명확히 적혀 있습니다. | `docs/16-contest-submission-checklist.md` | 미실행 |
| S2-02 | 서비스 개요 | 여행지 탐색, 찜·폴더, AI 일정, 커뮤니티 연결 흐름이 드러납니다. | `docs/24-submission-copywriting.md` | 미실행 |
| S2-03 | 주제 선정 이유 | 사용자가 여행 정보를 찾은 뒤 계획·공유까지 따로 해야 하는 문제를 설명합니다. | `docs/24-submission-copywriting.md` | 미실행 |
| S2-04 | 핵심 기능 | 최대 5개 핵심 기능이 간결하게 정리되어 있습니다. | `docs/16-contest-submission-checklist.md` | 미실행 |
| S2-05 | 과장 표현 방지 | 측정하지 않은 수치, 검증되지 않은 100% 완료 표현이 없습니다. | `docs/11-ai-document-analysis-rules.md` | 미실행 |

## 슬라이드 3 검수: 대표 이미지와 상세 이미지

| ID | 검수 항목 | 통과 기준 | 연결 문서 | 결과 |
|---|---|---|---|---|
| S3-01 | 대표 이미지 | 대표 이미지 1장이 실제 서비스 화면이며 서비스 콘셉트를 보여줍니다. | `docs/31-submission-screenshot-plan.md` | 미실행 |
| S3-02 | 상세 이미지 수 | 상세 이미지 3~5장이 포함되어 있습니다. | `docs/16-contest-submission-checklist.md` | 미실행 |
| S3-03 | 로그인 후 화면 포함 | AI 일정, 찜·폴더/마이페이지, 커뮤니티 중 최소 2개 이상이 로그인 후 화면으로 포함됩니다. | `docs/31-submission-screenshot-plan.md` | 미실행 |
| S3-04 | 빈 화면 회피 | 캡처가 빈 데이터, 무한 로딩, 오류 토스트만 보여주지 않습니다. | `docs/33-test-account-demo-data-runbook.md` | 미실행 |
| S3-05 | 민감정보 미노출 | 캡처에 비밀번호, 인증키, 개인 이메일, UID, Firebase Console이 보이지 않습니다. | `docs/31-submission-screenshot-plan.md` | 미실행 |
| S3-06 | 캡처 manifest | 최종 반영 캡처의 파일명과 상태가 manifest에 기록되어 있습니다. | `docs/17-submission-artifact-manifest.md` | 미실행 |

## 슬라이드 4 검수: 핵심 기능별 흐름

| ID | 검수 항목 | 통과 기준 | 연결 문서 | 결과 |
|---|---|---|---|---|
| S4-01 | 기능 수 | 핵심 기능이 최대 5개로 정리되어 있습니다. | `docs/16-contest-submission-checklist.md` | 미실행 |
| S4-02 | 흐름 연결 | 탐색 → 상세 → 찜·폴더 → AI 일정 → 커뮤니티 흐름이 끊기지 않습니다. | `docs/03-user-flows.md` | 미실행 |
| S4-03 | 기능명 일관성 | 슬라이드 2, 슬라이드 4, 시연 시나리오의 기능명이 서로 충돌하지 않습니다. | `docs/15-demo-scenario.md` | 미실행 |
| S4-04 | 구현 상태와 일치 | 실제 구현되지 않았거나 MVP 제외인 기능을 핵심 기능처럼 표현하지 않습니다. | `docs/02-product-requirements.md` | 미실행 |
| S4-05 | 심사 설명 가능성 | 각 기능이 어떤 심사 기준에 기여하는지 설명 가능합니다. | `docs/29-contest-judge-qa.md` | 미실행 |

## 슬라이드 5 검수: 데이터 활용, 차별성, 발전계획

| ID | 검수 항목 | 통과 기준 | 연결 문서 | 결과 |
|---|---|---|---|---|
| S5-01 | OpenAPI 서비스명 | `KorService2`, `PhotoGalleryService1`가 실제 활용 API로 정리되어 있습니다. | `docs/34-openapi-submission-copy-sheet.md` | 미실행 |
| S5-02 | Endpoint 일치 | 최종 PDF의 endpoint 목록이 코드 근거와 일치합니다. | `docs/20-openapi-submission-verification.md` | 미실행 |
| S5-03 | 기타 API 구분 | Open-Meteo, Kakao Maps, Gemini API, Firebase 등은 기타 API·기술로 구분되어 있습니다. | `docs/04-architecture.md` | 미실행 |
| S5-04 | 차별성 | 공공 관광 데이터, AI 일정 생성, 저장·커뮤니티 흐름의 결합이 드러납니다. | `docs/24-submission-copywriting.md` | 미실행 |
| S5-05 | 발전계획 | Functions 프록시, 권한 검증, 성능 측정, E2E 테스트 등 실제 백로그와 연결되어 있습니다. | `docs/14-backlog.md` | 미실행 |
| S5-06 | 보안 리스크 표현 | Gemini API 키 노출 등 리스크를 숨기거나 상용 운영 완료처럼 과장하지 않습니다. | `docs/10-ai-harness-engineering.md` | 미실행 |

## PDF 변환 후 최종 검수

| ID | 검수 항목 | 통과 기준 | 기록 위치 | 결과 |
|---|---|---|---|---|
| PDF-R01 | 페이지 수 | PDF 5페이지 이하 | `docs/17-submission-artifact-manifest.md` | 미실행 |
| PDF-R02 | 글자 크기 | 12포인트 미만 텍스트 없음 | `docs/13-validation-report.md` | 미실행 |
| PDF-R03 | 파일 용량 | 10MB 미만 | `docs/17-submission-artifact-manifest.md` | 미실행 |
| PDF-R04 | 열람 가능 | PDF가 정상 열리고 슬라이드가 깨지지 않음 | `docs/13-validation-report.md` | 미실행 |
| PDF-R05 | 파일명 | 최종 파일명이며 초안 파일과 혼동되지 않음 | `docs/17-submission-artifact-manifest.md` | 미실행 |
| PDF-R06 | checksum | 최종 PPTX/PDF checksum 기록 | `docs/17-submission-artifact-manifest.md` | 미실행 |
| PDF-R07 | 제출 부문 | 웹·앱 개발 부문 양식과 제출 페이지가 일치 | `docs/27-final-validation-execution-sheet.md` | 미실행 |

## 제출 보류 조건

아래 항목 중 하나라도 실패하면 최종 제출을 보류합니다.

- S1-01 팀명 placeholder 제거 실패
- S3-03 로그인 후 화면 포함 실패
- S3-05 민감정보 미노출 실패
- S5-01 OpenAPI 서비스명 누락
- S5-02 endpoint 목록 불일치
- PDF-R01 페이지 수 초과
- PDF-R02 12포인트 미만 텍스트 존재
- PDF-R03 10MB 초과
- PDF-R04 정상 열람 실패
- PDF-R06 checksum 미기록
- PDF-R07 제출 부문·양식 불일치

## 현재 상태

현재 기능설명서 5페이지 제출 항목 정리 초안은 존재하며, 페이지 수·용량·12포인트 이상 조건은 초안 기준으로 확인되어 있습니다. 그러나 접수 팀명, 로그인 후 내부 화면 캡처, 최종 OpenAPI 계정 대조, 최종 PDF checksum·외부 전달 위치는 아직 최종본 기준으로 확인되지 않았습니다.
