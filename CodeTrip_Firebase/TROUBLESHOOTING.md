# CodeTrip 트러블슈팅

Firebase 및 서비스 개발 과정에서 발생한 주요 문제와 해결 기록에 접근하기 위한 색인입니다.

## 1. Firebase 배포 초기화 오류 수정

- **발생일**: 2026-05-02
- **요약**: Firebase Hosting 배포 환경에서 앱 초기화와 인증 세션 복원 충돌 에러 조치
- **상세 기록**: [2026-05-02 개발 로그](project-log/2026-05-02.md)

## 2. Firebase Auth 가입 및 로그인 오류 처리

- **발생일**: 2026-05-02
- **요약**: 중복 이메일, 보안 약한 비밀번호 등 발생 시 Firebase API 원본 에러를 사용자 친화적인 한국어 오류 토스트 메시지로 가공
- **상세 기록**: [2026-05-02 개발 로그](project-log/2026-05-02.md)

## 3. 게시글 상세/삭제 권한 오류 수정

- **발생일**: 2026-07-20
- **요약**: Realtime Database Rules의 `auth.uid` 조건 불일치로 인한 권한 거부 문제 해결 및 429 API 캐시 노드 접근 제한 해제
- **상세 기록**: [2026-07-20 개발 로그](project-log/2026-07-20.md)

## 4. Gemini API key 트러블슈팅 및 알림 오류 처리 보정

- **발생일**: 2026-07-22
- **요약**: Gemini 기능 로컬 테스트 과정에서의 API key 전달 오류 수정 및 원본 API 에러를 정제하여 알림 노드 권한 문제 해결
- **상세 기록**: [2026-07-22 개발 로그](project-log/2026-07-22.md)

## 5. Firebase API key 제한으로 인한 로그인 403 오류

- **발생일**: 2026-07-23
- **요약**: `identitytoolkit.googleapis.com` 로그인 API가 Firebase Browser key 제한에 의해 차단되어 `signInWithPassword` 403 오류가 발생한 문제를 분석하고, 실제 로컬 앱이 사용하는 Firebase Browser key를 재확인
- **상세 기록**: [2026-07-23 개발 로그](project-log/2026-07-23.md)

## 6. AI 플래너 저장 구조 및 관광공사 API 후보 미반영 문제

- **발생일**: 2026-07-23
- **요약**: Gemini가 TourAPI 미등록 장소 위주로 코스를 생성하여 위시리스트 카드 저장률이 낮고, 위시리스트 폴더 기반 저장 시 동일 폴더가 중복 생성되던 문제를 관광공사 후보 우선 전달 및 기존 폴더 저장 방식으로 보정
- **상세 기록**: [2026-07-23 개발 로그](project-log/2026-07-23.md)

## 7. ESLint가 Obsidian 플러그인 번들 파일까지 검사한 문제

- **발생일**: 2026-07-23
- **요약**: `CodeTrip_Firebase/.obsidian/plugins` 하위 번들 JS 파일이 ESLint 검사 대상에 포함되어 수천 개 오류가 발생한 문제를 `eslint.config.js`의 `globalIgnores`에 `**/.obsidian/**`, `**/.claude/**`, `**/.claudian/**`를 추가해 해결
- **상세 기록**: [2026-07-23 개발 로그](project-log/2026-07-23.md)

## 💡 참고 사항

- 로컬 및 배포 관련 환경은 [CodeTrip 실행 가이드](guides/Guide.md) 혹은 [Firebase 배포 가이드](guides/Project_Firebase_배포.md)를 참고하세요.
- 새로운 트러블슈팅 이력은 날짜별 로그에 기록을 작성한 뒤, 이 색인 문서에 추가합니다.
## 8. AI 여행 코스가 폴더 메모로 저장되는 문제

- **발생일**: 2026-07-23
- **요약**: AI 여행 코스 전체 본문이 `wishlistNotes/MEMO`에 저장되어 마이페이지 `FOLDER_NOTES > MEMO` 영역에 긴 코스 설명이 노출되던 문제를 `aiTripPlans` 별도 노드 저장 및 `AI_COURSE.md` 문서형 카드 출력 방식으로 보정
- **처리 내용**:
  - 새 AI 코스 저장 시 `users/{uid}/aiTripPlans/{planId}`에 제목, 요약, Day별 일정 원본을 분리 저장
  - 마이페이지 폴더 선택 화면에서 AI 코스를 `AI_COURSE.md` 카드 형태로 표시
  - 기존에 잘못 저장된 `[AI 여행 코스]` 메모는 메모 목록에서 숨김 처리
  - TourAPI contentId가 있는 장소는 기존처럼 위시리스트 카드로 저장하고, 준비 항목은 체크리스트로 유지
- **상세 기록**: [2026-07-23 개발 로그](project-log/2026-07-23.md)
