# Google OAuth 추가 계획

이 문서는 CodeTrip에 Google OAuth 로그인을 추가하기 전 검토해야 할 범위와 실행 계획을 정리합니다. 현재 공모전 제출 준비 단계에서는 코드 구현보다 제출 필수값과 테스트 계정 검증이 우선이므로, 이 문서는 구현 전 계획 문서로 관리합니다.

## 결론

Google OAuth 추가는 가능합니다. 다만 공모전 심사용 로그인 방식은 이메일·비밀번호 테스트 계정을 기본으로 유지하고, Google OAuth는 선택 로그인 수단으로 추가하는 방향을 권장합니다.

Kakao, Naver OAuth는 Firebase Authentication 기본 제공 Provider가 아니므로 현재 MVP 제출 직전 범위에서는 제외하고, MVP 이후 백로그로 관리합니다.

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
| `src/store/useAuthStore.js` | `onAuthStateChanged` 기반 | OAuth 사용자도 `prepareLogin()` → Firebase 인증 → `login()` 흐름으로 연결 |
| 사용자 프로필 | `users/{uid}`에 별도 저장 | 최초 OAuth 로그인 시에만 기본 프로필 생성, 기존 프로필은 사용자 관리 필드를 보존하며 병합 |
| 세션 정책 | 2시간 만료 정책, 만료·로그아웃 시 `trip_token` 정리 | Google OAuth도 `browserSessionPersistence`와 기존 2시간 만료·정리 정책을 동일하게 적용 |
| 비밀번호 변경 | 이메일 계정 기준 | Provider 구성에 따라 이메일·비밀번호 계정만 허용하고 Google-only 계정은 명확한 안내 표시 |
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

구현이 필요해지면 아래 순서로 진행합니다.

| 순서 | 작업 | 대상 |
|---:|---|---|
| 1 | Firebase Auth import 추가 | `src/api/authApi.js` |
| 2 | `GoogleAuthProvider`, `signInWithPopup` 또는 `signInWithRedirect` 사용 | `src/api/authApi.js` |
| 3 | 로그인 시작 전 `prepareLogin()` 호출, Firebase Auth는 `browserSessionPersistence` 사용 | `src/api/authApi.js`, `src/store/useAuthStore.js` |
| 4 | 최초 로그인 시 `users/{uid}` 프로필 생성 또는 기존 프로필 병합 | `src/api/authApi.js` |
| 5 | `loginWithGoogle()` 반환값을 기존 `login()` 흐름과 맞춤 | `src/api/authApi.js`, `src/store/useAuthStore.js` |
| 6 | 로그인 화면에 “Google로 계속하기” 버튼 추가 | `src/pages/Login.jsx` |
| 7 | OAuth 계정의 비밀번호 변경 화면 예외 처리 | `src/pages/Settings.jsx` |
| 8 | 테스트 계정 검증표에 Google OAuth 선택 검증 항목 추가 | `docs/19-test-account-verification.md` |
| 9 | 빌드·수동 로그인 검증 | `docs/13-validation-report.md` |

## 권장 구현 방식

| 방식 | 장점 | 주의점 | 권장 |
|---|---|---|---|
| `signInWithPopup` | 구현이 단순하고 SPA에 적합 | 팝업 차단 가능성 | 1차 후보 |
| `signInWithRedirect` | 모바일·팝업 차단 환경에 강함 | 리다이렉트 처리 복잡도 증가 | 모바일 이슈 발생 시 검토 |

현재 MVP에서는 `signInWithPopup`을 우선 검토합니다.

## 세션 연결 기준

Google OAuth는 별도 세션 체계를 만들지 않고 현재 이메일·비밀번호 로그인과 같은 세션 계약을 사용합니다.

| 항목 | 기준 |
|---|---|
| 로그인 시작 | OAuth 팝업 또는 리다이렉트 실행 전에 `useAuthStore.prepareLogin()`을 호출합니다. |
| Firebase Auth persistence | `browserSessionPersistence`를 사용해 브라우저 세션 기준으로 Firebase Auth 상태를 유지합니다. |
| 앱 로그인 완료 | Firebase 인증 성공 후 기존 `login()` 경로로 앱 사용자 상태를 반영합니다. |
| 세션 만료 | 기존 2시간 만료 정책을 동일하게 적용합니다. |
| `trip_token` 정리 | 로그아웃 또는 만료 시 기존 정리 로직을 그대로 적용합니다. |

현재 `trip_token`은 `localStorage`에 저장되므로 탭 종료만으로 자동 삭제된다고 가정하지 않습니다. 탭 종료를 세션 종료로 정의하려면 `trip_token` 저장소와 GO-V04·GO-V06 검증 기준을 함께 변경해야 합니다.

## 프로필 upsert 기준

Google OAuth 로그인 후 `users/{uid}` 프로필이 없을 때만 기본 프로필을 생성합니다. 이미 프로필이 있으면 로그인 정보는 병합하되 사용자가 관리하는 필드는 덮어쓰지 않습니다.

| 필드 | 값 |
|---|---|
| `email` | `authUser.email` |
| `name` | `authUser.displayName`이 있으면 사용하되, 없으면 `CodeTrip 사용자` 같은 중립 placeholder 사용 |
| `profileImg` | 신규 프로필에서만 `authUser.photoURL` 또는 빈 문자열 사용 |
| `favoriteRegions` | 신규 프로필에서만 빈 배열 |
| `created_at` | 최초 생성 시각 |
| `updated_at` | 로그인 또는 프로필 갱신 시각 |
| `provider` | `google.com` |

기존 프로필이 있는 경우 `name`, `profileImg`, `favoriteRegions`, `created_at`처럼 사용자가 직접 관리하거나 최초 생성 의미가 있는 필드는 보존합니다. 반복 로그인 시에는 `updated_at`, 마지막 로그인 provider 같은 시스템 관리 필드만 갱신합니다.

이메일은 화면 표시 이름 fallback으로 사용하지 않습니다. Google 계정에 `displayName`이 없는 경우에도 기능설명서 캡처와 렌더링 화면에 이메일이 이름처럼 노출되지 않아야 합니다.

## 동일 이메일 계정 연결 정책

동일 이메일로 이메일·비밀번호 계정과 Google 계정이 충돌하는 경우 자동 병합하지 않습니다. 기본 정책은 `차단 후 복구 안내`니다.

| 상황 | 처리 |
|---|---|
| 기존 이메일·비밀번호 계정이 있고 Google 로그인을 시도함 | 기존 방식으로 먼저 로그인하라고 안내하고, 이후 명시적 계정 연결 플로우에서 `linkWithCredential`을 검토합니다. |
| 기존 Google 계정이 있고 이메일·비밀번호 가입을 시도함 | Google 로그인으로 계속하라고 안내하거나, 별도 비밀번호 설정 복구 플로우를 제공합니다. |
| 복수 Provider 연결을 지원하기로 결정한 경우 | 기존 Provider로 재인증한 뒤 `linkWithCredential`을 사용하고, 실패 시 계정 충돌 복구 안내를 제공합니다. |
| 충돌 계정 테스트 | 동일 이메일을 가진 이메일·비밀번호 계정과 Google 계정 테스트 케이스를 별도 준비합니다. |

복구 안내는 지원하는 로그인 방식별로 분리합니다. 이메일·비밀번호 사용자는 비밀번호 재설정 또는 기존 로그인 후 연결을 안내하고, Google 사용자는 Google 로그인 유지 또는 계정 연결 대기 상태를 안내합니다.

## Settings 화면 예외 처리

OAuth 계정은 이메일·비밀번호로 재인증할 수 없으므로 비밀번호 변경 기능에서 예외 처리가 필요합니다. `authApi.updatePassword`를 수정할 때는 `authUser.providerData`에 `password` provider가 연결되어 있는지 먼저 확인하고, 최근 로그인 요구 오류를 명확히 처리합니다.

| 상태 | 처리 |
|---|---|
| 이메일·비밀번호 계정 | 최근 재인증 후 현재 비밀번호 변경 기능 유지 |
| Google OAuth 계정 | 비밀번호 변경 입력 대신 “Google 계정에서 비밀번호를 관리합니다.” 안내 표시 |
| 복수 Provider 계정 | `password` provider가 연결되어 있으면 이메일·비밀번호 재인증 후 변경 허용, 없으면 Google-only 계정과 동일하게 안내 |
| 최근 로그인 필요 | Firebase의 recent login 요구를 사용자에게 명확히 안내하고 다시 로그인하도록 유도 |

Settings UI와 `authApi.updatePassword`는 같은 정책을 사용해야 합니다. UI에서 숨긴 기능이 API에서 실행되거나, API가 거부하는 기능이 UI에 표시되지 않도록 검증합니다.

## 공모전 제출 문구

Google OAuth를 실제 구현한 뒤에만 아래처럼 표기합니다.

> 기본 심사용 테스트 계정은 이메일·비밀번호 방식으로 제공하며, 사용자 편의 확장을 위해 Google OAuth 로그인을 선택 기능으로 지원합니다.

구현 전에는 기능설명서에 Google OAuth 지원을 완료 기능처럼 작성하지 않습니다.

## 제외 범위

| 항목 | 제외 사유 |
|---|---|
| Kakao OAuth | Firebase 기본 Provider가 아니며 OIDC 또는 커스텀 토큰 연동 검토가 필요 |
| Naver OAuth | Firebase 기본 Provider가 아니며 OIDC 또는 커스텀 토큰 연동 검토가 필요 |
| Kakao/Naver 계정 통합 | MVP 이후 Provider 추가 시 별도 계정 연결 정책 필요 |
| 운영 수준 권한 감사 | 공모전 MVP 이후 보안 점검 항목으로 관리 |

## 검증 기준

구현 후에는 아래 항목을 통과해야 합니다.

| ID | 검증 항목 | 통과 기준 |
|---|---|---|
| GO-V01 | Google 로그인 버튼 | 로그인 화면에서 버튼이 표시됩니다. |
| GO-V02 | Google 로그인 성공 | 배포 URL에서 Google 계정으로 로그인됩니다. |
| GO-V03 | 프로필 생성 | 신규 프로필은 기본값으로 생성되고 기존 프로필은 사용자 관리 필드를 보존한 채 병합됩니다. |
| GO-V04 | 세션 만료 | `browserSessionPersistence`와 기존 2시간 세션 정책이 함께 적용됩니다. |
| GO-V05 | 보호 라우트 접근 | AI Planner, 마이페이지, 커뮤니티 접근이 가능합니다. |
| GO-V06 | 로그아웃 | Firebase Auth와 로컬 세션, `trip_token`이 함께 정리됩니다. |
| GO-V07 | 비밀번호 변경 예외 | Google-only 계정에서는 비밀번호 변경 UI가 잘못 표시되지 않고, 복수 Provider 계정은 `password` provider 기준으로 처리됩니다. |
| GO-V08 | 캡처 보안 | Google 계정 이메일이 이름 fallback으로 렌더링되거나 기능설명서 캡처에 노출되지 않습니다. |
| GO-V09 | 반복 로그인 | 동일 Google 계정으로 반복 로그인해도 `created_at`, `favoriteRegions`, 사용자 지정 `name`, `profileImg`가 덮어써지지 않습니다. |
| GO-V10 | displayName 없음 | `authUser.displayName`이 없는 Google 계정도 중립 placeholder로 표시되고 이메일은 노출되지 않습니다. |
| GO-V11 | 동일 이메일 충돌 | 이메일·비밀번호 계정과 Google 계정의 동일 이메일 충돌 시 자동 병합하지 않고 복구 안내를 제공합니다. |

## 현재 상태

Google OAuth는 현재 `계획됨` 상태입니다. 공모전 제출 전 필수 차단 항목은 아니며, 먼저 접수 팀명, 지역 특화 여부, 테스트 계정, OpenAPI 인증키 확인, 최종 PPTX/PDF 검증을 완료합니다.
