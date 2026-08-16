# KPI·객관적 평가 지표

| 영역 | 지표 | 기간·대상 | 분자 / 분모·이벤트 | 집계 위치·책임자 | 증빙 |
|---|---|---|---|---|---|
| 제품 | 핵심 여정 완료율 | 릴리스별 대표 시나리오 사용자 | 성공 이벤트 / 고유 시도 이벤트 | 테스트 기록·개발 담당 | 테스트 기록 |
| 제품 | 요구사항 구현률 | 스프린트 종료 시 Must·Should | 완료 항목 / 전체 항목 | 요구사항 문서·PO | 요구사항 표 |
| 사용성 | 작업 성공률·오류 | 시연 또는 사용성 세션별 | 성공 과업 / 시작 과업, 오류 이벤트 | 시연 기록·개발 담당 | 시연 기록 |
| 기술 | build/lint 통과율 | 모든 PR·릴리스 | 통과 실행 / 전체 실행 | CI 또는 로컬 로그·개발 담당 | CI 또는 로그 |
| 품질 | 테스트 통과율 | 모든 PR·릴리스 | 통과 테스트 / 전체 테스트 | 테스트 리포트·개발 담당 | 테스트 리포트 |
| 성능 | 로딩·API 응답 | 릴리스별 동일 환경 | 측정된 p95 또는 평균 | 브라우저/API 측정·개발 담당 | 측정표 |
| 성능 | 번들 크기 | 릴리스별 동일 Node/Vite 환경의 `npm run build` | Vite 출력 기준 minified raw kB와 gzip kB, 초기 로딩 청크와 주요 lazy 청크 분리 | 빌드 로그·개발 담당 | 빌드 결과 캡처 |
| 성능 | 캐시 적중률 | 개발·시연 세션별 | fresh hit 이벤트(memory·local·remote) / 전체 cache 이벤트(memory·local·remote·network·stale) | 디버깅 이벤트 또는 세션 측정표·개발 담당 | 캐시 측정표 |
| 안정성 | stale fallback 비율 | 개발·시연 세션별 | stale fallback 이벤트 / 전체 cache 이벤트 | 디버깅 이벤트 또는 세션 측정표·개발 담당 | 캐시 측정표 |
| 안정성 | 외부 API 실패율 | 릴리스 또는 시연 세션별 | TourAPI·Open-Meteo·Nominatim 실패·fallback 이벤트 / 전체 외부 API 호출 이벤트 | 운영 로그 또는 수동 기록·개발 담당 | 운영 로그 또는 검증 기록 |
| 안정성 | AI 생성 성공률 | 릴리스 또는 AI 시나리오별 | Gemini 생성 성공 이벤트 / 전체 Gemini 생성 시도 이벤트 | 운영 로그 또는 수동 기록·개발 담당 | 운영 로그 또는 검증 기록 |
| 보안 | 권한 테스트 통과율 | Rules 변경 및 릴리스 | 통과 시나리오 / 전체 권한 시나리오 | 보안 점검표·개발 담당 | 보안 점검표 |
| 운영 | 배포 재현성·문서 최신성 | 릴리스별 | 체크리스트 통과 / 전체 항목 | 릴리스 기록·릴리스 담당 | 릴리스 기록 |
| 관리 | 스프린트 달성률 | 스프린트별 | 완료 항목 / 계획 항목 | 회고 기록·스프린트 담당 | 회고 기록 |

초기에는 측정값을 기준선으로 확보하고, MVP 종료 시 각 지표에 목표값과 실제값을 함께 기록합니다. 측정되지 않은 값은 성과로 주장하지 않습니다.

## 성능 지표 증빙 기준

번들 크기 최적화는 `React.lazy` 적용 여부만으로 완료 처리하지 않습니다. 적용 전후 동일한 Node.js, Vite, 의존성 lockfile 환경에서 `npm run build`를 실행하고, Vite가 출력하는 minified raw 크기와 gzip 크기를 함께 기록합니다. 초기 로딩 청크와 lazy 청크를 분리해 비교하고, 500kB 초과 경고가 남는 경우 남은 청크의 원인을 기록합니다.

캐시 적중률은 현재 개발 모드 패널이 최신 이벤트 1건을 보여주는 수준이므로, 운영 KPI로 주장하려면 별도 집계가 필요합니다. 현재 측정 범위는 개발·시연 세션으로 제한합니다. fresh cache hit의 분자는 `memory`, `local`, `remote` 이벤트로 제한하며, `stale`은 원천 API 실패 후 만료 캐시를 반환한 fallback이므로 캐시 적중이 아니라 별도 안정성 지표로 집계합니다. 원시 사용자 로그를 장기 저장하기보다는 릴리스별 측정표에 memory, local, remote, network, stale 이벤트 수를 기록합니다.

외부 API 실패율과 AI 생성 성공률은 서로 다른 호출 집합이므로 별도 KPI로 관리합니다. TourAPI, Open-Meteo, Nominatim의 실패·fallback은 외부 API 안정성 지표로 집계하고, Gemini 생성 성공·timeout·429·JSON 파싱 실패·재생성 한도 초과는 AI 생성 지표로 집계합니다. AI 운영 지표는 기존 `users/{uid}/aiTripPlans/{planId}/tour_api_verification`의 검증 통계와 Gemini 호출 telemetry를 구분합니다. `tour_api_verification`은 장소 검증 결과의 증빙이며, AI 생성 성공률·retry count·latency의 직접 증빙은 별도 기록이 있어야 합니다. 현재 `src/api/geminiApi.js`에는 Gemini 성공·실패·retry count·latency를 저장하는 writer가 없으므로, Gemini 호출 telemetry는 구현 완료가 아니라 계획된 지표로 취급합니다.
