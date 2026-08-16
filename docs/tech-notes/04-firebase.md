# Firebase

## 핵심 주제

- Authentication 사용자 생명주기
- Realtime Database 계층형 모델
- 조회용 역색인
- Security Rules의 인증·소유권·검증
- Hosting과 SPA rewrite
- 비용·쿼터·운영 환경 분리

## CodeTrip 적용 위치

Firebase 설정은 `firebase.json`, `.firebaserc`, `src/firebase.js`, `database.rules.json`에 분산되어 있습니다. 이 네 파일의 변경은 배포·보안·데이터 접근에 영향을 주므로 의사결정 로그와 검증 결과를 남깁니다.
