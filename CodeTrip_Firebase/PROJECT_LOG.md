# CodeTrip Project Log

CodeTrip의 Firebase 전환 과정과 주요 개발/수정 내역을 정리한 문서 목차입니다.

## 📌 핵심 문서

- [Firebase 상세 내역서](info/Firebase_상세%20내역서.md)
- [Gemini 프롬프트 설계](info/Gemini_프롬프트_설계.md)
- [Firebase 배포 가이드](guides/Project_Firebase_배포.md)
- [CodeTrip 실행 가이드](guides/Guide.md)
- [문서 작성 가이드](guides/Document_Guide.md)
- [공모전 제출 체크리스트](guides/Contest_Submission_Checklist.md)
- [트러블슈팅 색인](TROUBLESHOOTING.md)

## 📅 날짜별 개발 기록

- [2026-09-04](project-log/2026-09-04.md): Firebase 인증 세션 복원 전 홈이 비회원 화면을 먼저 표시하는 깜빡임을 보정하고, 인증 초기화 중 홈 데이터·위시리스트 요청을 보류했습니다. Google-only 계정에는 비밀번호 변경 폼 대신 Google 계정 관리 안내를 표시하고 API에서도 변경 요청을 차단했습니다.
- [2026-09-01](project-log/2026-09-01.md): Google OAuth 로그인·회원가입을 도입하고 Firebase·Google Cloud OAuth 설정의 `deleted_client`, `redirect_uri_mismatch`, 인증 직후 Realtime Database 권한 지연 문제를 보완했습니다. 기존 Google 계정 재가입 안내와 인증 상태 경쟁을 정리했으며, 게시글·댓글 좋아요를 사용자 UID별 원자 트랜잭션으로 전환하고 레거시 좋아요 데이터 마이그레이션 및 동시성 보호 절차를 추가했습니다.
- [2026-08-25](project-log/2026-08-25.md): PR #28 CodeRabbit 피드백 대응으로 AI 플래너 폴더 주소 보강 상태와 Info 모바일 UI를 정리하고, TourAPI 신규 여행지 감지 알림을 Firebase Scheduled Function과 공용 업데이트 피드 구조로 추가했습니다. 이후 PR #29 CodeRabbit 피드백에 따라 TourAPI 최신 등록순 조회, 응답 구조 검증, 숨김 알림 필터 순서, 관련 트러블슈팅 색인을 보강했습니다. 프로필 이미지와 게시글 첨부 이미지는 data URL 저장 방식에서 Firebase Storage 업로드 후 다운로드 URL 저장 방식으로 전환했습니다.
- [2026-08-23](project-log/2026-08-23.md): PR #28 CodeRabbit 피드백 대응으로 AI 플래너 폴더 일정 정규화와 비동기 폴더 선택 최신성 검증을 보완하고, 공모전 1차 제출 자료 누락 여부와 남은 제출 차단 항목을 재점검
- [2026-08-22](project-log/2026-08-22.md): 비회원 위시리스트 안내 모달과 로그인 후 탐색 복귀 흐름 안정화, 탐색 페이지 상태 보존·초기화 기준 정리, 검색어 삭제와 페이지 초기화 요청 통합, 로그아웃 시 보호 라우트 로그인 안내 모달이 순간적으로 표시되는 문제 보정, AI 여행 계획 생성 날짜 입력과 마이페이지 폴더 일정 수정 진입점 추가
- [2026-08-16](project-log/2026-08-16.md): Gemini API 호출을 Firebase Callable Function 프록시로 전환, Functions Secret 등록과 배포, Hosting 재배포, 신규 Gemini 키 교체와 기존 temp 키 삭제, 인증 smoke test 및 보안 검증 문서 반영, 카카오 지도 JavaScript 키와 SDK 도메인 설정 보정 후 배포 상세 페이지 지도 표시 확인
- [2026-08-15](project-log/2026-08-15.md): CodeRabbit 리뷰 대응, Gemini 공개 시연 보안 게이트 강화, Google OAuth 계획 보강, 제출 차단 조건과 민감정보 기록 기준 정리
- [2026-08-12](project-log/2026-08-12.md): 공모전 1차 심사 제출 문서 체계 세분화, 기능설명서 초안·제출 런북·최종 검증 실행표·대시보드·화면 캡처 계획·OpenAPI 제출표 정리
- [2026-08-11](project-log/2026-08-11.md): 프로젝트 구조화 문서 체계 추가, AI 문서 분석 규칙·기술 부채 등록부·검증 보고서·백로그·심사 시연 시나리오·공모전 제출 체크리스트 작성
- [2026-07-29](project-log/2026-07-29.md): 날씨 API와 위치명 역지오코딩 API에 공통 캐시 레이어 적용, 좌표 반올림 기반 캐시 키와 TTL 정책 정리, README/배포 가이드/공모전 제출 체크리스트 최신화, AI 코스 상세 문서와 폴더 체크리스트 연결, AI 코스 장소 출처 구분 표시 개선, AI 코스 상세 날짜별 탭 추가, AI 코스 장소 카드 접기/펼치기 추가, AI 코스 문서와 여행지 상세 보기 연결 강화, AI 코스 상세 상단 요약 및 메모 작성 기능 추가
- [2026-07-24](project-log/2026-07-24.md): Gemini 기본 모델 Flash-Lite 전환, API 재시도 로직 보정, AI 코스 상세 보기와 레거시 AI 메모 마이그레이션, 위시리스트 안내 UI 및 폴더 조건 자동 반영, 관광공사 contentId 재검증과 공식 장소 정보 저장 보정, AI 코스 지역 불일치 카드 방어 및 저장 토스트/상세 모달 UI 보완
- [2026-07-23](project-log/2026-07-23.md): Gemini AI 여행 코스 생성 모드 분리, 관광공사 API 후보 우선 반영, 위시리스트 저장 구조 보정, 비회원 홈 UX 개편, 로그인 사용자 홈 대시보드 추가, 개발자 감성 메인 UI 보강, 회원 전용 접근 안내 모달 및 반응형 UI 정리, ESLint 검사 제외 범위 보정
- [2026-07-22](project-log/2026-07-22.md): Gemini API key 트러블슈팅 및 알림 오류 처리 보정
- [2026-07-21](project-log/2026-07-21.md): Firebase 제출용 저장소 정리, Gemini AI 여행 코스 생성 1차 구현, UI 헤더 및 반응형 레이아웃 정리
- [2026-07-20](project-log/2026-07-20.md): Firebase DB 구조 재정비 1차 작업, Firebase 공개 데이터와 개인 활동 경계 정리 2차 작업, 댓글 조회 인덱스 구조 추가 3차 작업 등
- [2026-05-03](project-log/2026-05-03.md): 위시리스트 폴더에서 Explore 추가 흐름 개선, Firebase Hosting 배포
- [2026-05-02](project-log/2026-05-02.md): Firebase Realtime Database 전환, Firebase 배포 초기화 오류 수정, Firebase Auth 가입 및 로그인 오류 처리 등

## ✍🏻 작성 기준

1. 구현 및 수정 내역은 작업 날짜에 맞춰 `project-log/` 하위 파일에 기록합니다.
2. 장애 오류 분석과 트러블슈팅 이력은 해당 일자 로그에 작성 후 `TROUBLESHOOTING.md`에 링크를 연결합니다.
3. 실행 및 배포 가이드라인이 수정될 시 `guides/` 하위 문서를 최신으로 유지합니다.
4. 커밋 생성 전에는 날짜별 작업 로그와 필요한 트러블슈팅 색인 갱신을 먼저 완료합니다.
