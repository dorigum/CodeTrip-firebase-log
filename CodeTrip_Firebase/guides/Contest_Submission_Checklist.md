# CodeTrip 공모전 제출 체크리스트

> 작성일: 2026-07-29  
> 기준 브랜치: `main`  
> 배포 URL: https://dorigum-codetrip.web.app

---

## 1. 문서 목적

이 문서는 CodeTrip 공모전 제출 직전에 확인해야 할 기능, 배포, 보안, 보류 작업을 한곳에 정리하기 위한 체크리스트입니다.

상세 작업 과정은 날짜별 개발 로그에 기록하고, 이 문서는 제출 전 최종 점검용으로 유지합니다.

---

## 2. 제출 전 필수 확인

- [ ] `main` 브랜치 기준 최신 코드 확인
- [ ] `.env` 값 최신화
- [ ] Firebase Realtime Database Rules 반영 여부 확인
- [ ] `npm run lint` 실행
- [ ] `npm run build` 실행
- [ ] Firebase Hosting 배포
- [ ] 배포 URL 접속 확인
- [ ] 회원가입, 로그인, 로그아웃 확인
- [ ] 여행지 탐색, 상세 보기, 위시리스트 저장/삭제 확인
- [ ] 위시리스트 폴더 생성, 수정, 삭제 확인
- [ ] AI 여행 코스 생성, 저장, 상세 보기, 수정, 재생성, 삭제 확인
- [ ] 게시판 목록, 작성, 상세 보기, 수정, 삭제 확인
- [ ] 모바일 화면 주요 페이지 확인

---

## 3. 주요 기능 소개 정리

제출 자료에는 다음 기능을 중심으로 소개합니다.

- 한국관광공사 TourAPI 기반 여행지 탐색
- 날씨와 위치 기반 추천
- 위시리스트 폴더 기반 여행 준비 관리
- CodeTrip AI 여행 코스 생성
- 관광공사 검증 장소와 AI 추천 장소 분리 저장
- AI 코스 문서 기반 일정 관리
- 여행 게시판과 사용자 활동 기록
- Firebase Authentication, Realtime Database, Hosting 기반 배포 구조
- 공공 API 호출량 절감을 위한 공통 캐시 구조

---

## 4. Firebase 전환 구조 요약

```text
React / Vite
  -> Firebase Hosting
  -> Firebase Authentication
  -> Firebase Realtime Database
  -> TourAPI / Weather API / Location API
  -> Gemini API
```

현재 구조는 프론트엔드 단독 배포와 Firebase Web SDK 직접 호출을 기준으로 합니다.

공공데이터, 날씨, 위치명 조회는 `apiCache`를 통해 메모리, localStorage, Realtime Database 캐시를 함께 사용합니다.

---

## 5. Gemini 기능 제출 전 메모

현재 Gemini 기능은 프론트엔드에서 API를 호출하는 구조입니다. 공모전 최종 제출 전에는 아래 방향으로 전환하는 것을 권장합니다.

- Firebase 프로젝트 Blaze 요금제 전환
- Firebase Functions 추가
- Gemini API key를 Functions Secret으로 관리
- 프론트엔드는 Gemini API key를 직접 사용하지 않고 Functions endpoint 호출
- Functions 전환 후 AI 코스 생성/저장/오류 안내 흐름 재테스트

Blaze 전환은 결제 계정 연결이 필요한 작업이므로 제출 직전 최종 단계에서 진행합니다.

---

## 6. 보류 및 추후 개발 계획

- Gemini API 호출을 Firebase Functions로 이전
- Gemini API key를 Functions Secret으로 관리
- 관광공사 좌표 기반 장소 간 직선거리 정렬 적용
- 카카오 지도 API를 활용한 실제 이동 경로 검증
- AI 코스 상세 화면 날짜별 탭, 장소 카드 접기/펼치기 고도화
- 사용자별 Realtime Database 경로 재설계 검토
- Firebase Storage 또는 이미지 압축/저장 정책 개선
- Cloud Functions 기반 알림 fan-out 재설계
- GitHub Actions 또는 Firebase preview channel 기반 배포 자동화 검토

---

## 7. 최종 제출 전 테스트 기록 위치

테스트 상세 기록은 아래 문서에 남깁니다.

- 날짜별 상세 작업 로그: `CodeTrip_Firebase/project-log/YYYY-MM-DD.md`
- 전체 작업 요약: `CodeTrip_Firebase/PROJECT_LOG.md`
- 문제 해결 색인: `CodeTrip_Firebase/TROUBLESHOOTING.md`
