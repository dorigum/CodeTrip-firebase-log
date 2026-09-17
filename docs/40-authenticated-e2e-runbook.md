# 인증 E2E 스모크 실행 가이드

## 목적

## 최근 수동 실행 결과

- 2026-09-17 Firebase Hosting 배포본에서 개인 테스트 계정으로 로그인 후 홈, `/mypage`, `/ai-planner` 접근을 확인했다.
- 인증 세션이 유지됐고 기존 저장 여행지·폴더 데이터가 정상적으로 로드됐다. 이 실행에서는 생성·저장·삭제를 수행하지 않았다.
- 계정 식별자와 비밀번호는 이 문서, Git, CI 로그에 기록하지 않는다.

Firebase Hosting 배포본에서 테스트 계정 로그인과 보호 페이지 접근을 자동 확인합니다. 이 스모크는 AI 생성과 폴더 저장을 실행하지 않으므로 Gemini 비용과 테스트 데이터 변경을 만들지 않습니다.

## 준비

- Firebase Authentication에 테스트 전용 이메일 계정을 만듭니다.
- 계정 정보는 저장소·문서·스크린샷에 기록하지 않고 로컬 환경변수 또는 GitHub Actions Secret으로만 관리합니다.
- 운영 사용자 계정, 개인 계정, 공모전 제출용 최종 계정은 사용하지 않습니다.

## 로컬 실행

PowerShell에서 테스트 계정을 현재 세션에만 설정한 뒤 실행합니다.

```powershell
$env:E2E_EMAIL = "test-account@example.com"
$env:E2E_PASSWORD = "test-password"
npm run test:e2e -- e2e/authenticated.smoke.spec.js
```

환경변수가 없으면 해당 테스트는 명시적으로 skip됩니다. 공개·보호 경로 E2E는 계속 실행됩니다.

## 다음 확장 기준

AI 생성과 폴더 저장은 다음을 준비한 후에만 추가합니다.

1. 매 실행 뒤 삭제할 전용 폴더명과 정리 절차
2. Gemini 호출 허용 횟수와 비용 한도
3. Functions Emulator 또는 테스트 프로젝트에서 사용할 Secret 구성
4. 생성 결과, 저장 폴더, 홈 일정 반영, 정리 완료를 함께 검증하는 단일 시나리오
