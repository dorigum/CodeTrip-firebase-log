# Google OAuth 추가 계획

이 문서는 CodeTrip에 Google OAuth 로그인을 추가하기 전 검토해야 할 범위와 실행 계획을 정리한다. 현재 공모전 제출 준비 단계에서는 코드 구현보다 제출 필수값과 테스트 계정 검증이 우선이므로, 이 문서는 구현 전 계획 문서로 관리한다.

## 결론

Google OAuth 추가는 가능하다. 다만 공모전 심사용 로그인 방식은 이메일·비밀번호 테스트 계정을 기본으로 유지하고, Google OAuth는 선택 로그인 수단으로 추가하는 방향을 권장한다.

Kakao, Naver OAuth는 Firebase Authentication 기본 제공 Provider가 아니므로 현재 MVP 제출 직전 범위에서는 제외하고, MVP 이후 백로그로 관리한다.

## 적용 전략

| 항목 | 결정 |
|---|---|
| 기본 심사용 로그인 | 이메일·비밀번호 테스트 계정 유지 |
| 추가 후보 | Google OAuth |
| 현재 구현 여부 | 계획됨 |
| 공모전 제출 전 필수 여부 | 필수 아님 |
| Kakao/Naver OAuth | MVP 이후 백로그 |
| 구현 전 선행 조건 | 제출 팀명, 테스트 계정, OpenAPI 확인, 최종 캡처 우선 |

## 현재 인증 구조 영향 분석

| 영역 | 현재 상태 | OAuth 추가 시 영향 |
|---|---|---|
| Firebase Auth | 이메일·비밀번호 로그인 사용 | Google Provider 활성화 필요 |
| `src/api/authApi.js` | `signup`, `login`, `forgotPassword`, `updatePassword` 중심 | `loginWithGoogle` 추가 필요 |
| `src/store/useAuthStore.js` | `onAuthStateChanged` 기반 | OAuth 사용자도 수용 가능 |
| 사용자 프로필 | `users/{uid}`에 별도 저장 | 최초 OAuth 로그인 시 프로필 upsert 필요 |
| 세션 정책 | 2시간 만료 정책 | Google OAuth 로그인 후 동일 정책 적용 필요 |
| 비밀번호 변경 | 이메일 계정 기준 | OAuth 계정은 비밀번호 변경 UI 예외 처리 필요 |
| 제출 테스트 계정 | 이메일·비밀번호 방식 | 그대로 유지 권장 |

## 구현 전 Firebase Console 확인 항목

| ID | 확인 항목 | 기준 |
|---|---|---|
| GO-01 | Google Provider 활성화 | Firebase Console > Authentication > Sign-in method에서 Google 활성화 |
| GO-02 | 지원 이메일 설정 | Google Provider 설정에 프로젝트 지원 이메일 지정 |
| GO-03 | 승인 도메인 확인 | `dorigum-codetrip.web.app`이 Authorized domains에 포함되어 있는지 확인 |
| GO-04 | 로컬 개발 도메인 확인 | 필요 시 `localhost` 승인 도메인 유지 |
| GO-05 | API 키 제한 확인 | Identity Toolkit API, Firebase Auth 관련 호출이 차단되지 않는지 확인 |
| GO-06 | 개인정보 표시 확인 | Google 계정 이메일이 화면 캡처에 노출되지 않도록 UI 확인 |

## 코드 구현 계획

구현이 필요해지면 아래 순서로 진행한다.

| 순서 | 작업 | 대상 |
|---:|---|---|
| 1 | Firebase Auth import 추가 | `src/api/authApi.js` |
| 2 | `GoogleAuthProvider`, `signInWithPopup` 또는 `signInWithRedirect` 사용 | `src/api/authApi.js` |
| 3 | 최초 로그인 시 `users/{uid}` 프로필 생성 또는 갱신 | `src/api/authApi.js` |
| 4 | `loginWithGoogle()` 반환값을 기존 `login()` 흐름과 맞춤 | `src/api/authApi.js`, `src/store/useAuthStore.js` |
| 5 | 로그인 화면에 “Google로 계속하기” 버튼 추가 | `src/pages/Login.jsx` |
| 6 | OAuth 계정의 비밀번호 변경 화면 예외 처리 | `src/pages/Settings.jsx` |
| 7 | 테스트 계정 검증표에 Google OAuth 선택 검증 항목 추가 | `docs/19-test-account-verification.md` |
| 8 | 빌드·수동 로그인 검증 | `docs/13-validation-report.md` |

## 권장 구현 방식

| 방식 | 장점 | 주의점 | 권장 |
|---|---|---|---|
| `signInWithPopup` | 구현이 단순하고 SPA에 적합 | 팝업 차단 가능성 | 1차 후보 |
| `signInWithRedirect` | 모바일·팝업 차단 환경에 강함 | 리다이렉트 처리 복잡도 증가 | 모바일 이슈 발생 시 검토 |

현재 MVP에서는 `signInWithPopup`을 우선 검토한다.

## 프로필 upsert 기준

Google OAuth 로그인 후 `users/{uid}`에 프로필이 없으면 아래 형태로 생성한다.

| 필드 | 값 |
|---|---|
| `email` | `authUser.email` |
| `name` | `authUser.displayName` 또는 이메일 |
| `profileImg` | `authUser.photoURL` 또는 빈 문자열 |
| `favoriteRegions` | 기존 값이 없으면 빈 배열 |
| `created_at` | 최초 생성 시각 |
| `updated_at` | 로그인 또는 프로필 갱신 시각 |
| `provider` | `google.com` |

기존 이메일 계정과 동일 이메일로 Google 로그인할 때의 계정 연결 정책은 Firebase 기본 동작과 Console 설정을 확인한 뒤 별도로 결정한다.

## Settings 화면 예외 처리

OAuth 계정은 이메일·비밀번호로 재인증할 수 없으므로 비밀번호 변경 기능에서 예외 처리가 필요하다.

| 상태 | 처리 |
|---|---|
| 이메일·비밀번호 계정 | 현재 비밀번호 변경 기능 유지 |
| Google OAuth 계정 | 비밀번호 변경 입력 대신 “Google 계정에서 비밀번호를 관리합니다.” 안내 표시 |
| 복수 Provider 계정 | Firebase providerData 기준으로 표시 정책 결정 |

## 공모전 제출 문구

Google OAuth를 실제 구현한 뒤에만 아래처럼 표기한다.

> 기본 심사용 테스트 계정은 이메일·비밀번호 방식으로 제공하며, 사용자 편의 확장을 위해 Google OAuth 로그인을 선택 기능으로 지원한다.

구현 전에는 기능설명서에 Google OAuth 지원을 완료 기능처럼 작성하지 않는다.

## 제외 범위

| 항목 | 제외 사유 |
|---|---|
| Kakao OAuth | Firebase 기본 Provider가 아니며 OIDC 또는 커스텀 토큰 연동 검토가 필요 |
| Naver OAuth | Firebase 기본 Provider가 아니며 OIDC 또는 커스텀 토큰 연동 검토가 필요 |
| OAuth 계정 통합 정책 | 동일 이메일 계정 충돌 정책을 별도 설계해야 함 |
| 운영 수준 권한 감사 | 공모전 MVP 이후 보안 점검 항목으로 관리 |

## 검증 기준

구현 후에는 아래 항목을 통과해야 한다.

| ID | 검증 항목 | 통과 기준 |
|---|---|---|
| GO-V01 | Google 로그인 버튼 | 로그인 화면에서 버튼이 표시된다. |
| GO-V02 | Google 로그인 성공 | 배포 URL에서 Google 계정으로 로그인된다. |
| GO-V03 | 프로필 생성 | `users/{uid}` 프로필이 생성 또는 갱신된다. |
| GO-V04 | 세션 만료 | 기존 2시간 세션 정책이 적용된다. |
| GO-V05 | 보호 라우트 접근 | AI Planner, 마이페이지, 커뮤니티 접근이 가능하다. |
| GO-V06 | 로그아웃 | Firebase Auth와 로컬 세션이 함께 정리된다. |
| GO-V07 | 비밀번호 변경 예외 | OAuth 계정에서 비밀번호 변경 UI가 잘못 표시되지 않는다. |
| GO-V08 | 캡처 보안 | Google 계정 이메일이 기능설명서 캡처에 노출되지 않는다. |

## 현재 상태

Google OAuth는 현재 `계획됨` 상태다. 공모전 제출 전 필수 차단 항목은 아니며, 먼저 접수 팀명, 지역 특화 여부, 테스트 계정, OpenAPI 인증키 확인, 최종 PPTX/PDF 검증을 완료한다.
