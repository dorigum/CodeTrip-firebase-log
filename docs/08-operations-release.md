# 운영·릴리스

## 배포 절차

1. 변경 범위와 관련 문서 확인
2. `npm run lint` 및 `npm run build`
3. 핵심 시나리오와 권한 점검
4. 외부 API의 호출 실패·stale cache fallback 정책 확인
5. `dist` 생성 결과 확인
6. Firebase Hosting 배포
7. 공개 URL에서 smoke test
8. 릴리스 기록과 알려진 이슈 작성

## 장애 대응

외부 API 오류는 호출자별 정책에 따라 재시도하거나, 공통 캐시 계층의 stale fallback을 사용합니다. `cachedApiRequest`는 fetcher를 기본 1회 호출한 뒤 실패하면 remote·local·memory 순서로 `data`가 실제 존재하는 stale 항목을 선택합니다. 인증·DB 오류는 영향을 받는 기능을 격리하고, Firebase 콘솔 로그와 재현 조건을 기록합니다. AI 실패는 원문 오류를 사용자에게 노출하지 않고 재시도와 기본 추천 경로를 제공합니다.

## 변경 관리

기술·기획 선택은 `decision-log/`에 배경, 선택지, 결정, 영향, 재검토 조건을 기록합니다. 스프린트 종료 시 `retrospectives/`에 잘된 점, 문제, 다음 액션을 남깁니다.
