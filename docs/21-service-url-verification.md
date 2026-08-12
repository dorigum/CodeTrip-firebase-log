# 서비스 URL 제출 전 검증 절차

이 문서는 공모전 1차 심사 제출 페이지에 입력할 CodeTrip 서비스 URL이 실제 심사자가 접속 가능한 상태인지 확인하기 위한 절차다.

## 제출 후보 URL

| 항목 | 값 |
|---|---|
| Firebase 프로젝트 | `newagent-9c2a8` |
| Hosting target | `codetrip` |
| Hosting site | `dorigum-codetrip` |
| 제출 후보 URL | `https://dorigum-codetrip.web.app` |
| 배포 public 디렉터리 | `dist` |
| SPA rewrite | `**` → `/index.html` |

위 값은 `firebase.json`, `.firebaserc`, `README.md` 기준으로 확인한다.

## 제출 전 확인 원칙

- 제출 URL은 심사자가 별도 VPN, 로컬 서버, 개발 계정 없이 접근 가능해야 한다.
- 제출 직전 최신 로컬 빌드가 실제 Hosting 배포본에 반영되었는지 확인한다.
- 로그인 없이 볼 수 있는 공개 화면과 로그인 후 필요한 보호 화면을 분리해 검증한다.
- 테스트 계정 정보는 제출 페이지에만 입력하고, 문서에는 검증 상태만 기록한다.

## URL smoke test

| ID | 경로 | 목적 | 기대 결과 |
|---|---|---|---|
| URL-01 | `/` | 홈 화면 접근 | 서비스 소개, 핵심 카드, 로그인 버튼이 표시된다. |
| URL-02 | `/explore` | 여행지 탐색 공개 화면 | 여행지 목록과 필터가 표시된다. |
| URL-03 | `/festivals` | 축제·행사 공개 화면 | 축제·행사 목록과 지역·정렬 필터가 표시된다. |
| URL-04 | `/login` | 로그인 화면 | 이메일·비밀번호 입력 폼이 표시된다. |
| URL-05 | `/ai-planner` | 보호 라우트 확인 | 비로그인 상태에서는 접근 제한 안내가 표시된다. 로그인 상태에서는 AI 일정 입력 또는 결과 화면이 표시된다. |
| URL-06 | `/board` | 커뮤니티 보호 라우트 확인 | 비로그인 상태에서는 접근 제한 또는 인증 확인 흐름이 표시된다. 로그인 상태에서는 게시판 화면이 표시된다. |
| URL-07 | 새로고침 | SPA rewrite 확인 | `/explore`, `/festivals`, `/ai-planner` 등 직접 경로 새로고침 시 404가 발생하지 않는다. |

## 검증 절차

1. `npm run lint`와 `npm run build`를 실행해 배포 전 정적 검증과 빌드 검증을 수행한다.
2. Firebase Hosting 배포 대상이 `codetrip`이고 public 디렉터리가 `dist`인지 확인한다.
3. 배포 후 `https://dorigum-codetrip.web.app`에 접속한다.
4. URL-01~URL-07을 같은 브라우저 환경에서 확인한다.
5. 비로그인 화면 캡처는 `output/contest/screenshots/`에 저장하고, 최종 기능설명서에 반영할 후보만 선별한다.
6. 테스트 계정이 준비되면 로그인 후 AI Planner, 마이페이지, 커뮤니티 화면을 다시 확인하고 캡처한다.
7. 검증 결과는 `docs/13-validation-report.md`에 날짜, 기준 커밋, 환경, 결과, 미해결 이슈로 기록한다.

## 현재 확보된 증빙

| 증빙 | 상태 |
|---|---|
| 홈 화면 캡처 | `output/contest/screenshots/01-home.png` 생성 |
| 여행지 탐색 화면 캡처 | `output/contest/screenshots/02-explore.png` 생성 |
| 축제·행사 화면 캡처 | `output/contest/screenshots/03-festivals.png` 생성 |
| 로그인 화면 캡처 | `output/contest/screenshots/06-login.png` 생성 |
| AI Planner 비로그인 접근 제한 캡처 | `output/contest/screenshots/04-ai-planner-login-gate.png` 생성 |
| 로그인 후 내부 화면 캡처 | 테스트 계정 생성 후 진행 필요 |

## 제출 전 판정

| 판정 | 조건 |
|---|---|
| 통과 | 제출 후보 URL에서 공개 화면, 로그인, 보호 라우트, 직접 경로 새로고침이 모두 정상 동작하고 테스트 계정 로그인 후 내부 화면까지 확인했다. |
| 부분 통과 | 공개 화면은 정상이나 테스트 계정 로그인 후 내부 화면 검증이 미완료다. |
| 실패 | 제출 후보 URL 접속 실패, 404, 빈 화면, API 오류로 핵심 화면 확인이 불가능하다. |

## 문서 갱신 규칙

- 최종 URL 검증이 끝나면 `docs/16-contest-submission-checklist.md`의 CS-03 상태를 갱신한다.
- 기능설명서에 사용한 캡처와 최종 PDF checksum은 `docs/17-submission-artifact-manifest.md`에 기록한다.
- 실제 배포 명령과 결과는 `docs/13-validation-report.md` 또는 릴리스 기록에 남긴다.
