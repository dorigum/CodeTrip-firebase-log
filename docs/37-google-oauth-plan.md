# Google OAuth 추가 계획

이 문서는 CodeTrip의 Google OAuth 로그인·회원가입 구현 범위, 설정값, 검증 절차와 장애 대응을 정리합니다.

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

## 현재 프로젝트 기준값

아래 값은 OAuth 구현과 검증에 사용할 공개 설정 기준값입니다. 비밀번호, API 키, OAuth Client Secret과 같은 비밀값은 문서와 저장소에 기록하지 않습니다.

| 항목 | 현재 값 또는 확인 상태 | 용도 |
|---|---|---|
| Firebase 프로젝트 ID | `newagent-9c2a8` | Firebase Console 프로젝트 선택 기준 |
| Hosting 서비스 도메인 | `https://dorigum-codetrip.web.app` | 배포 환경 OAuth 승인 도메인 및 최종 검증 URL |
| 로컬 개발 도메인 | `http://localhost:5173`, `http://localhost:5180` | 개발 환경 승인 도메인 확인 및 로컬 검증 |
| Firebase Auth 도메인 | `.env`의 `VITE_FIREBASE_AUTH_DOMAIN` 값 확인 필요 | Firebase 초기화 및 OAuth 리디렉션 기준 |
| Functions 리전 | `asia-northeast3` | 현재 Firebase Functions 호출 리전과 일치 여부 확인 |
| Google Provider 활성화 | Console에서 활성화 완료 | Authentication > Sign-in method에서 확인 |
| 지원 이메일 | Console 설정 확인 필요 | Google Provider 설정에서 확인 |

현재 코드에는 Google 로그인 버튼과 `GoogleAuthProvider` 기반 팝업 인증 흐름이 추가되었습니다. Provider 활성화 후에도 이메일·비밀번호 테스트 계정 로그인은 유지합니다.

## 401 `deleted_client` 대응

Google 팝업에서 `401: deleted_client` 또는 `flowName=GeneralOAuthFlow`가 표시되면, Google이 요청에 사용된 OAuth 클라이언트 ID를 삭제된 클라이언트로 판단한 상태입니다. 일반적으로 코드나 Firebase 사용자 데이터 문제가 아니라 Firebase 프로젝트와 Google Cloud OAuth 클라이언트의 연결 상태 문제입니다.

1. Firebase Console에서 `newagent-9c2a8` 프로젝트를 선택하고 `Authentication > Sign-in method > Google`로 이동합니다.
2. Google Provider가 사용 설정되어 있는지 확인하고, 프로젝트 지원 이메일을 지정한 뒤 저장합니다.
3. Google Cloud Console의 같은 프로젝트에서 `APIs & Services > Credentials`를 열고 OAuth 2.0 Client ID 목록을 확인합니다. 삭제됨 또는 잘못된 프로젝트에 속한 웹 클라이언트는 사용하지 않습니다.
4. 웹 클라이언트가 없다면 `Create credentials > OAuth client ID > Web application`으로 새 클라이언트를 생성합니다. 승인된 JavaScript 원본에 `http://localhost:5173`, 실제 사용 포트인 `http://localhost:5180`, `https://dorigum-codetrip.web.app`을 등록합니다.
5. Firebase Authentication의 Google Provider 설정에서 연결된 웹 클라이언트가 새 클라이언트인지 확인합니다. Firebase가 자동으로 관리하는 클라이언트가 보이면 삭제하거나 교체하지 말고, 새 클라이언트 생성 후 설정을 다시 저장합니다.
6. `Authentication > Settings > Authorized domains`에 `localhost`와 `dorigum-codetrip.web.app`이 등록되어 있는지 확인합니다. 커스텀 도메인을 사용하면 해당 도메인도 추가합니다.
7. 브라우저의 기존 Google 로그인 팝업·Firebase 세션을 닫고 시크릿 창에서 다시 테스트합니다. 여전히 같은 오류가 나면 배포된 JS가 최신 버전인지, `.env`의 `VITE_FIREBASE_PROJECT_ID`와 `VITE_FIREBASE_AUTH_DOMAIN`이 해당 Firebase 프로젝트를 가리키는지 확인합니다.

OAuth Client Secret은 프론트엔드 코드나 저장소에 넣지 않습니다. 웹 팝업 로그인에는 Client ID와 Firebase의 승인 도메인 설정만 필요합니다.

## OAuth 직후 Realtime Database 권한 오류 대응

Google 계정이 Firebase Authentication의 사용자 목록에 생성되고 `users/{uid}` Rules가 `auth.uid === $uid`인데도 첫 로그인에서 `PERMISSION_DENIED`가 발생할 수 있습니다. OAuth 팝업 성공 직후 Realtime Database 연결이 새 ID 토큰을 아직 반영하지 않은 경우입니다.

`loginWithGoogle()`은 인증 성공 직후 ID 토큰을 먼저 확보하고, 사용자 프로필을 처음 읽는 요청에서만 권한 오류가 발생하면 토큰을 강제 갱신한 뒤 한 번 재시도합니다. 재시도도 실패하면 실제 Rules·프로젝트·데이터베이스 인스턴스 설정 문제로 처리합니다. 브라우저 Console의 `Cross-Origin-Opener-Policy` 팝업 경고는 이 권한 오류와 별개이며, OAuth 인증 실패를 뜻하지 않습니다.

## 코드 구현 계획

구현 및 검증은 아래 순서로 진행합니다.

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

동일 이메일로 이메일·비밀번호 계정과 Google 계정이 충돌하는 경우 자동 병합하지 않습니다. 기본 정책은 `차단 후 복구 안내`입니다.

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

Google OAuth는 현재 `코드 구현 완료·환경별 검증 대기` 상태입니다. 공모전 제출 전 필수 차단 항목은 아니며, 이메일·비밀번호 테스트 계정과 기존 세션 흐름을 유지한 선택 로그인으로 추가했습니다. Firebase Console의 Google Provider, 지원 이메일, 승인 도메인 설정을 확인한 뒤 로컬과 배포 환경에서 GO-V01~GO-V11 검증 기준을 실행합니다.
