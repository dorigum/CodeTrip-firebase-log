# 공모전 기능설명서 제출 갭 분석

이 문서는 CodeTrip 기능설명서 초안이 2026 관광데이터 활용 공모전 웹·앱 개발 부문 1차 심사 제출 조건에 얼마나 부합하는지 현재 증빙 기준으로 점검한다. 실제 인증키, 비밀번호, 개인 이메일 등 민감정보는 저장소에 기록하지 않는다.

## 현재 결론

현재 상태는 “제출 항목 정리본 초안은 존재하지만, 최종 제출본은 아직 아니다”로 분류한다.

가장 제출본에 가까운 산출물은 `output/contest/CodeTrip_2026_관광데이터_공모전_기능설명서_5페이지_제출항목정리_초안.pdf`다. 이 파일은 PDF 5페이지, 394311 bytes로 확인되었고, 전체 1~5번 슬라이드 PNG 렌더링을 통해 원본 가이드 문구가 제거된 읽기 가능한 초안임을 확인했다.

텍스트 객체 54개의 글자 크기도 검사했으며, 최소 글자 크기는 12pt이고 12pt 미만 텍스트는 0개로 확인했다. 다만 접수 팀명, 테스트 계정, OpenAPI 인증키, 로그인 후 내부 기능 화면, 양식 수정 없음 조건의 최종 육안 검증은 아직 미완료다.

최종 제출 페이지에 실제로 입력해야 하는 값과 탈락 리스크는 `docs/25-final-input-checklist.md`에서 별도로 관리한다.
기능설명서 PPTX의 슬라이드별 최종 수정 지시는 `docs/26-pptx-final-editing-guide.md`에서 관리한다.
제출 직전 실제 검증 실행 결과는 `docs/27-final-validation-execution-sheet.md`에서 관리한다.
전체 제출 준비도와 차단 항목 현황은 `docs/28-submission-readiness-dashboard.md`에서 요약한다.

## 제출 조건별 상태

| 구분 | 요구 조건 | 현재 상태 | 판정 | 증빙 | 다음 조치 |
|---|---|---|---|---|---|
| 제출 양식 | 제공 PPTX 양식 기반 작성 | 제공 양식을 기반으로 5페이지 정리본 초안 생성, 슬라이드별 최종 편집 지시서 작성 | 부분 충족 | `docs/17-submission-artifact-manifest.md`, `docs/26-pptx-final-editing-guide.md` | 최종본에서 양식 수정 금지 조건 육안 확인 |
| PDF 페이지 수 | PDF 5페이지 이하 | 5페이지 확인 | 충족 | `docs/13-validation-report.md` | 최종본 변환 후 재확인 |
| PDF 용량 | 10MB 미만 | 394311 bytes 확인 | 충족 | `docs/17-submission-artifact-manifest.md` | 최종본 변환 후 재확인 |
| 글자 크기 | 12포인트 이상 | 텍스트 객체 54개 검사, 최소 12pt, 12pt 미만 0개 확인 | 충족 | `docs/13-validation-report.md` | 최종본 변경 시 재검사 |
| 서비스명 | 서비스명 기재 | `CodeTrip` 기재 | 충족 | 제출 항목 정리본 1페이지 | 최종 제출 전 표기 일관성 확인 |
| 팀 정보 | 접수 팀명·최종 팀원 정보 | `[접수 팀명 입력]` placeholder 유지 | 미완료 | 제출 항목 정리본 1페이지 | 접수 페이지 기준 팀명 입력 |
| 서비스 개요 | 서비스 개요·유형·주제 선정 이유 | 웹 서비스, 개요, 주제 선정 이유, 핵심 기능 작성 및 제출용 축약 문구 문서화 | 충족 | 제출 항목 정리본 2페이지, `docs/24-submission-copywriting.md` | 최종 PPTX 공간에 맞춰 축약 문구 반영 |
| 대표·상세 이미지 | 대표 이미지 1장, 상세 이미지 3~5장 | 비로그인 공개 화면 중심 캡처 삽입 | 부분 충족 | 제출 항목 정리본 3페이지 | 로그인 후 AI·마이페이지·커뮤니티 내부 화면으로 일부 교체 |
| 핵심 기능 흐름 | 핵심 기능명·설명·흐름도 최대 5개 | 5개 핵심 기능 흐름을 1페이지에 압축 작성 | 부분 충족 | 제출 항목 정리본 4페이지 | 필요 시 도식형 흐름도로 시각 보강 |
| 한국관광공사 OpenAPI | 활용 API 목록 필수 | KorService2, PhotoGalleryService1 및 endpoint 작성, 제출 정보 검증 절차 문서화 | 부분 충족 | 제출 항목 정리본 5페이지, `docs/16-contest-submission-checklist.md`, `docs/20-openapi-submission-verification.md` | 인증키와 제출 계정 기준 호출 정보는 제출 페이지에서 별도 확인 |
| 기타 API | 기타 API·기술 활용 작성 | Open-Meteo, Nominatim, Kakao Maps, Gemini, Firebase, React/Vite/Tailwind/Zustand 작성 | 충족 | 제출 항목 정리본 5페이지 | 과도한 기술 나열 여부 최종 검토 |
| 차별성·발전계획 | 서비스 차별성·발전계획 작성 | AI 일정화, TourAPI 검증, 프록시·Rules·성능·E2E 발전계획 작성 및 제출용 문구 문서화 | 충족 | 제출 항목 정리본 5페이지, `docs/24-submission-copywriting.md` | Gemini 키 노출 리스크는 발전계획으로 정직하게 표현 |
| 서비스 URL | 접속 가능한 서비스 URL 제출 | `https://dorigum-codetrip.web.app` 후보와 검증 절차 문서화 | 부분 충족 | `README.md`, `docs/16-contest-submission-checklist.md`, `docs/21-service-url-verification.md` | 제출 직전 URL 접속과 최신 배포 여부 확인 |
| 테스트 계정 | 필요 시 지정 형식의 테스트 전용 계정 | 검증 절차 문서화, 계정 정보 미확정 | 미완료 | `docs/16-contest-submission-checklist.md`, `docs/19-test-account-verification.md` | 전용 계정 생성 후 로그인 가능 여부 확인 |
| OpenAPI 인증키 | 인코딩키·디코딩키 제출 | 저장소 기록 금지, 검증 절차 문서화, 실제 키 확인 필요 | 미완료 | `docs/16-contest-submission-checklist.md`, `docs/20-openapi-submission-verification.md` | 제출 페이지에만 입력 |
| 지역 특화 | 선택 항목, 가점 가능 | 전국 단위 제출을 기본 권장으로 정리했고, 특정 지역 특화 전환 조건을 별도 문서화 | 전략 문서화, 최종 결정 필요 | `docs/16-contest-submission-checklist.md`, `docs/23-regional-specialization-strategy.md` | 전국 단위 유지 또는 특정 지역 특화 전환 여부 최종 결정 |

## 심사 기준 관점 갭

| 심사항목 | 배점 | 현재 강점 | 현재 약점 | 보강 우선순위 |
|---|---:|---|---|---|
| 서비스 기획력 | 30 | 탐색 → 저장 → AI 일정 → 공유 흐름이 명확하고, 제출용 서비스 개요·주제 선정 이유·차별성 문구를 문서화했다. | 최종 제출 전략을 전국 단위로 확정할지, 특정 지역 특화로 전환할지 결정이 필요하다. | 중 |
| 서비스 완성도 | 30 | 배포 URL과 공개 화면 캡처, 기능 흐름 초안이 존재한다. | 로그인 후 AI·마이페이지·커뮤니티 실제 화면 증빙이 부족하다. | 높음 |
| 데이터 활용 적절성 | 20 | TourAPI endpoint 목록과 활용 맥락이 정리되어 있다. | 제출용 인증키 정보와 실제 호출 이력 확인은 별도 작업이다. | 높음 |
| 서비스 발전성 | 20 | 기술 부채·백로그 기반 발전계획이 구체적이다. | 발전계획이 기술 중심이라 사용자/사업 확장 관점 보강 여지가 있다. | 중 |

## 최종 제출 전 우선순위

1. `docs/22-final-submission-runbook.md` 순서에 따라 최종 제출 전 확인을 진행한다.
2. `docs/25-final-input-checklist.md`의 FI-01~FI-16을 기준으로 최종 입력값 누락 여부를 점검한다.
3. `docs/28-submission-readiness-dashboard.md`의 차단 항목 B-01~B-09를 순서대로 해소한다.
4. 접수 팀명과 최종 팀원 정보를 확인해 기능설명서 1페이지와 제출 페이지에 반영한다.
5. `docs/19-test-account-verification.md` 절차에 따라 심사용 테스트 전용 계정을 생성하고 로그인 가능 여부를 확인한다.
6. 로그인 후 AI 일정 생성, 마이페이지 또는 찜/폴더, 커뮤니티 내부 화면을 캡처해 3페이지 이미지를 교체한다.
7. `docs/20-openapi-submission-verification.md` 절차에 따라 한국관광공사 OpenAPI 인코딩키·디코딩키와 활용 API 목록을 제출 페이지 기준으로 확인한다.
8. `docs/21-service-url-verification.md` 절차에 따라 제출 후보 URL과 최신 배포 상태를 확인한다.
9. `docs/26-pptx-final-editing-guide.md` 기준으로 최종 PPTX를 반영한 뒤 PDF로 변환하고, 5페이지 이하, 12포인트 이상, 10MB 미만, 정상 열람 여부를 다시 확인한다.
10. 최종 파일명, 생성일, checksum, 외부 제출 위치를 `docs/17-submission-artifact-manifest.md`에 갱신한다.

## 제출 가능 판정 기준

아래 항목이 모두 충족되어야 최종 제출 가능 상태로 판정한다.

- 기능설명서 1페이지에 실제 접수 팀명이 반영되어 있다.
- 제출 페이지에 입력할 서비스 URL과 테스트 계정이 검증되어 있다.
- 한국관광공사 OpenAPI 인증키와 활용 API 목록이 제출 페이지 기준으로 준비되어 있다.
- 최종 PDF가 5페이지 이하, 12포인트 이상, 10MB 미만이며 정상 열람된다.
- 대표 이미지 1장과 상세 이미지 3~5장이 실제 서비스 화면으로 구성되어 있다.
- `docs/17-submission-artifact-manifest.md`에 최종 파일의 checksum과 전달 위치가 기록되어 있다.
- `docs/25-final-input-checklist.md`의 최종 입력값 항목이 제출 직전 확인되어 있다.
- `docs/27-final-validation-execution-sheet.md`의 제출 직전 차단 조건이 모두 통과되어 있다.
