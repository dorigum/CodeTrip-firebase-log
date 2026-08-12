# 공모전 심사 대응 Q&A

이 문서는 CodeTrip 기능설명서, 시연, 제출 페이지를 기준으로 심사자가 물어볼 수 있는 질문과 답변 방향을 정리한다. 답변은 현재 구현·문서·검증 상태를 기준으로 하며, 측정되지 않은 성과나 아직 완료되지 않은 기능을 완료된 것처럼 표현하지 않는다.

## 답변 원칙

- 먼저 사용자 문제와 서비스 흐름을 설명한다.
- 기술명은 선택 이유와 사용자 가치로 연결해 설명한다.
- 현재 MVP 범위와 향후 발전계획을 분리한다.
- 보안·성능·검증의 미완료 항목은 숨기지 않고 백로그와 보완 계획으로 설명한다.
- 인증키, 비밀번호, 개인 이메일, 팀원 개인정보는 답변이나 문서에 노출하지 않는다.

## 서비스 기획력 관련 질문

| 질문 | 답변 방향 | 연결 문서 |
|---|---|---|
| CodeTrip은 어떤 문제를 해결하는 서비스인가요? | 국내 여행 정보는 여러 출처에 흩어져 있고, 사용자는 여행지를 찾은 뒤 후보 저장과 일정 구성을 다시 해야 한다. CodeTrip은 탐색, 저장, AI 일정 생성, 커뮤니티 공유를 하나의 흐름으로 연결해 이 부담을 줄이는 MVP다. | `docs/01-project-charter.md`, `docs/24-submission-copywriting.md` |
| 왜 여행지 탐색에 AI 일정 생성을 붙였나요? | 검색 결과가 실제 계획으로 이어지지 않으면 사용자가 다시 수동으로 일정을 구성해야 한다. Gemini AI는 사용자의 조건과 후보 여행지를 바탕으로 일정 초안을 빠르게 만드는 보조 역할을 한다. | `docs/10-ai-harness-engineering.md`, `docs/24-submission-copywriting.md` |
| 서비스의 핵심 사용자 여정은 무엇인가요? | 여행지 탐색 → 상세 확인 → 찜·폴더 저장 → AI 일정 생성 → 커뮤니티 공유 흐름이다. 기능설명서와 시연은 이 흐름을 중심으로 구성한다. | `docs/03-user-flows.md`, `docs/15-demo-scenario.md` |
| 지역 특화 서비스인가요? | 현재 기본 제출 전략은 전국 단위 서비스다. 특정 비서울 지역을 선택할 명확한 화면 증빙과 사용자 문제가 준비되면 지역 특화로 전환할 수 있지만, 현재 MVP는 전국 단위 흐름이 구현과 문서에 더 잘 맞는다. | `docs/23-regional-specialization-strategy.md`, `docs/28-submission-readiness-dashboard.md` |
| 다른 여행 서비스와 차별점은 무엇인가요? | 공공 관광 데이터 기반 탐색, 개인 저장, Gemini AI 일정화, 커뮤니티 공유를 한 흐름으로 묶은 점이다. 단순 정보 조회가 아니라 탐색 결과가 개인 여행 계획과 사용자 참여로 이어진다. | `docs/24-submission-copywriting.md` |

## 서비스 완성도 관련 질문

| 질문 | 답변 방향 | 연결 문서 |
|---|---|---|
| 현재 어디까지 구현되어 있나요? | 여행지 탐색, 축제 조회, 상세 정보, 인증, 찜·폴더, AI 일정 생성, 커뮤니티 흐름을 MVP 범위로 정리했다. 다만 최종 제출 전 테스트 계정 검증과 로그인 후 내부 화면 캡처가 필요하다. | `docs/18-submission-gap-analysis.md`, `docs/28-submission-readiness-dashboard.md` |
| 심사자가 직접 테스트할 수 있나요? | Firebase Hosting 공개 URL을 제출하고, 로그인 기능이 필요한 경우 지정 형식의 테스트 전용 계정을 제출 페이지에 입력한다. 최종 제출 전 URL smoke test와 테스트 계정 검증을 수행해야 한다. | `docs/19-test-account-verification.md`, `docs/21-service-url-verification.md` |
| 실패 화면이나 빈 결과도 고려했나요? | 여행지와 축제 조회는 로딩, 빈 결과, 오류 상태를 구분해 다루는 방향으로 정리했다. 최종 시연 전에는 URL smoke test와 핵심 사용자 흐름 검증으로 확인한다. | `docs/06-quality-plan.md`, `docs/27-final-validation-execution-sheet.md` |
| 기능설명서의 화면 캡처는 충분한가요? | 현재 초안은 비로그인 공개 화면 중심이다. 최종 제출 전 테스트 계정이 준비되면 AI 일정, 마이페이지 또는 찜·폴더, 커뮤니티 내부 화면으로 일부 교체하는 것이 필요하다. | `docs/16-contest-submission-checklist.md`, `docs/26-pptx-final-editing-guide.md` |
| 최종 제출 가능 상태인가요? | 현재는 제출 초안 준비 완료, 최종 제출은 보류 상태다. 접수 팀명, 테스트 계정, OpenAPI 인증키, 로그인 후 캡처, 최종 PDF 검증이 끝나야 제출 가능으로 판정한다. | `docs/28-submission-readiness-dashboard.md`, `docs/27-final-validation-execution-sheet.md` |

## 데이터 활용 관련 질문

| 질문 | 답변 방향 | 연결 문서 |
|---|---|---|
| 한국관광공사 OpenAPI를 어디에 사용했나요? | `KorService2`를 통해 여행지 목록, 키워드 검색, 상세 정보, 상세 이미지, 지역 코드, 축제·행사 정보를 활용하고, `PhotoGalleryService1`의 `galleryList1`을 홈 화면 관광 이미지에 활용한다. | `docs/20-openapi-submission-verification.md`, `docs/16-contest-submission-checklist.md` |
| OpenAPI 활용이 서비스 핵심과 어떻게 연결되나요? | TourAPI는 여행지 탐색과 상세 정보의 중심 데이터다. AI 일정 생성에서도 관광공사 기반 장소와 AI 추천 장소를 구분해 결과 신뢰성을 관리하는 근거로 활용한다. | `docs/10-ai-harness-engineering.md`, `docs/20-openapi-submission-verification.md` |
| OpenAPI 인증키는 문서에 포함되나요? | 아니다. 인코딩키와 디코딩키는 제출 페이지에만 입력하고 저장소에는 기록하지 않는다. 문서에는 확인 절차와 증빙 위치만 남긴다. | `docs/20-openapi-submission-verification.md`, `docs/25-final-input-checklist.md` |
| 기타 API는 무엇을 사용하나요? | Open-Meteo는 날씨, Nominatim은 위치명 보조, Kakao Maps는 지도, Gemini API는 일정 초안 생성, Firebase는 인증·DB·배포에 사용한다. | `docs/04-architecture.md`, `docs/16-contest-submission-checklist.md` |

## 기술·아키텍처 관련 질문

| 질문 | 답변 방향 | 연결 문서 |
|---|---|---|
| 왜 Firebase를 사용했나요? | 심사 가능한 MVP에서 인증, Realtime Database, Hosting을 빠르게 통합하기 위해 사용했다. 사용자 데이터와 커뮤니티 데이터 권한은 Rules와 검증 계획으로 관리한다. | `docs/04-architecture.md`, `docs/05-data-security.md` |
| Gemini API 하네스란 무엇인가요? | 단순 API 호출이 아니라 입력 검증, 컨텍스트 구성, 모델 호출, JSON 응답 검증, 저장, 평가를 연결한 실행 계층이다. 성공 기준은 Gemini 응답 여부가 아니라 서비스 저장 구조와 사용자 안내까지 포함한다. | `docs/10-ai-harness-engineering.md` |
| AI 결과의 신뢰성은 어떻게 관리하나요? | Gemini가 생성한 일정을 JSON 계약으로 검증하고, TourAPI 기반 장소와 AI 보조 추천 장소를 구분한다. 실패 시 timeout, 429, 잘못된 JSON 같은 오류 유형을 품질 게이트에 포함한다. | `docs/10-ai-harness-engineering.md`, `docs/06-quality-plan.md` |
| 보안상 가장 큰 리스크는 무엇인가요? | 현재 가장 큰 리스크는 Gemini API 키가 클라이언트 번들에 포함될 수 있다는 점이다. 공개 운영 단계에서는 Firebase Functions 프록시와 Secret Manager 이전이 필요하며, 미완료 시 호출량 제한과 키 교체 절차를 준비한다. | `docs/10-ai-harness-engineering.md`, `docs/14-backlog.md` |
| 성능은 검증했나요? | 빌드와 일부 산출물 검증 기록은 있으나, Lighthouse, 캐시 적중률, API 지연시간 같은 누적 정량 측정은 아직 부족하다. 성능 측정 계약과 백로그는 문서화되어 있다. | `docs/09-metrics.md`, `docs/13-validation-report.md`, `docs/12-technical-debt-register.md` |

## 발전성 관련 질문

| 질문 | 답변 방향 | 연결 문서 |
|---|---|---|
| MVP 이후 가장 먼저 개선할 항목은 무엇인가요? | Firebase Rules 검증, 테스트 계정 기반 핵심 흐름 검증, Gemini API Functions 프록시 이전, 성능 기준선 측정, 코드 스플리팅, E2E 테스트를 우선순위로 둔다. | `docs/14-backlog.md`, `docs/28-submission-readiness-dashboard.md` |
| 상용화하려면 무엇이 더 필요한가요? | API 키 보호, 운영 로그, 성능 측정, 장애 대응, E2E 테스트, 운영 지표 수집이 필요하다. 현재 문서는 심사 가능한 MVP와 이후 운영 고도화 항목을 분리한다. | `docs/08-operations-release.md`, `docs/12-technical-debt-register.md` |
| 지역 특화 확장 가능성은 있나요? | 현재는 전국 단위 MVP지만, 향후 특정 지역 큐레이션, 지역 축제 특화 일정, 로컬 관광 사업자 연계 기능으로 확장할 수 있다. 다만 지역 특화 제출은 별도 화면 증빙과 지역 문제 정의가 필요하다. | `docs/23-regional-specialization-strategy.md`, `docs/24-submission-copywriting.md` |

## 답변 시 피해야 할 표현

| 피해야 할 표현 | 이유 | 대체 표현 |
|---|---|---|
| 모든 기능이 완성되었습니다. | 테스트 계정, 최종 PDF, OpenAPI 제출 정보 검증이 아직 남아 있다. | MVP 핵심 흐름은 구현·문서화했고, 최종 제출 전 검증 항목을 관리하고 있습니다. |
| AI 결과는 항상 정확합니다. | 생성형 AI 결과는 실패와 오류 가능성이 있다. | AI 결과는 JSON 계약과 TourAPI 장소 구분 기준으로 검증하고, 실패 시 fallback을 안내합니다. |
| 성능 최적화가 완료되었습니다. | 정량 측정값이 부족하다. | 성능 측정 계약과 코드 스플리팅 백로그를 관리하고 있습니다. |
| 보안 문제는 없습니다. | Gemini API 키 노출 리스크가 문서화되어 있다. | 현재 리스크를 인식하고 있으며, Functions 프록시 이전과 키 관리 고도화를 P0/P1 과제로 관리합니다. |
| 지역 특화 서비스입니다. | 현재 기본 전략은 전국 단위 제출이다. | 현재는 전국 단위 MVP이며, 지역 특화는 별도 지역과 화면 증빙이 준비될 때 전환할 수 있습니다. |

## 최종 제출 전 확인

- 기능설명서 문구는 `docs/24-submission-copywriting.md`와 일치해야 한다.
- 제출 가능 여부는 `docs/27-final-validation-execution-sheet.md`의 차단 조건으로 판단한다.
- 현재 준비도는 `docs/28-submission-readiness-dashboard.md`에서 확인한다.
- 최종 답변에서 실제 인증키, 비밀번호, 개인 이메일, 팀원 개인정보를 말하거나 문서에 남기지 않는다.
