# CodeTrip

CodeTrip은 한국관광공사 OpenAPI 기반 여행지 탐색 결과를 찜·폴더로 저장하고, Gemini AI로 여행 일정 초안을 생성해 커뮤니티 공유까지 연결하는 여행 계획 웹 서비스 MVP입니다.

이 저장소는 2026 관광데이터 활용 공모전 웹·앱 개발 부문 제출을 목표로, 기존 프론트엔드 기능을 Firebase 기반 인증·데이터·배포·AI 프록시 구조와 프로젝트 문서 체계로 정리한 버전입니다.

## 프로젝트 문서

프로젝트 헌장, 요구사항, 사용자 흐름, 아키텍처, 데이터·보안, 품질 계획, WBS, 운영, KPI, AI 하네스, 공모전 제출 문서는 [통합 프로젝트 문서](docs/README.md)에서 관리합니다.

최근 작업 기록은 다음 문서에서 확인합니다.

- [2026-08-16 작업 로그](CodeTrip_Firebase/project-log/2026-08-16.md)
- [검증 보고서](docs/13-validation-report.md)
- [기술 부채 등록부](docs/12-technical-debt-register.md)
- [백로그](docs/14-backlog.md)
- [트러블슈팅](CodeTrip_Firebase/TROUBLESHOOTING.md)

## 배포 정보

- Firebase Hosting: [https://dorigum-codetrip.web.app](https://dorigum-codetrip.web.app)
- Firebase Project ID: `newagent-9c2a8`
- Hosting target: `codetrip`
- Functions region: `asia-northeast3`
- Realtime Database URL: `https://newagent-9c2a8.firebaseio.com`
- 주요 브랜치: `main`

현재 진행 중인 안정화 PR 작업은 별도 브랜치에서 진행하며, `output/` 산출물은 별도 지시 전까지 커밋 대상에서 제외합니다.

## 기술 스택

| 영역 | 사용 기술 |
|---|---|
| Frontend | React 19, Vite 8, React Router, Tailwind CSS, Zustand |
| Backend/BaaS | Firebase Authentication, Realtime Database, Hosting, Cloud Functions v2 |
| AI | Gemini API, Firebase Callable Function, Functions Secret |
| 외부 데이터 | 한국관광공사 TourAPI/KorService2, TourAPI 관광사진, Open-Meteo, Nominatim, Kakao Maps SDK |
| 문서·검증 | Markdown docs, 프로젝트 로그, 검증 보고서, 기술 부채 등록부, 공모전 제출 체크리스트 |

## 현재 시스템 구조

```text
React / Vite
  -> Firebase Hosting
  -> Firebase Authentication
  -> Firebase Realtime Database
  -> Firebase Callable Function: generateTripPlan
       -> Functions Secret: GEMINI_API_KEY
       -> Gemini API
  -> TourAPI / Open-Meteo / Nominatim / Kakao Maps
```

프론트엔드는 공공 관광 데이터와 날씨·지도 데이터를 사용자 화면에 연결하고, 개인 데이터와 커뮤니티 데이터는 Firebase Realtime Database로 관리합니다. Gemini 일정 생성은 더 이상 브라우저에서 API 키를 직접 사용하지 않고, `generateTripPlan` Callable Function을 통해 서버 측에서 처리합니다.

## 주요 기능

### 여행지 탐색

- 지역, 테마, 키워드 기반 여행지 검색
- 한국관광공사 OpenAPI 기반 목록·상세·이미지 조회
- 사용자 선호 지역 기반 빠른 필터
- 찜 버튼을 통한 위시리스트 저장

### 축제 탐색

- 전국 축제·행사 목록 조회
- 날짜순·최신순 정렬
- 반응형 화면 폭에 따른 페이지당 표시 개수 보정
- 축제 상세 조회와 위시리스트 저장

### 상세 정보

- 여행지·행사 상세 정보, 이미지, 주소, 운영 정보 표시
- Kakao Maps SDK 지도 표시
- 지도 SDK 지연 또는 실패 시 카카오맵 외부 링크 fallback 제공
- 여행지별 댓글 지연 로딩과 재시도 UI 제공

### 위시리스트와 여행 폴더

- 여행지 찜, 폴더별 분류, 폴더 통계 표시
- 폴더별 메모와 체크리스트 작성
- 폴더 화면에서 탐색 화면으로 이동해 현재 폴더에 바로 추가
- AI 코스 문서와 같은 폴더의 여행지·체크리스트·메모 연동

### AI 여행 코스 생성

- 설정 조건 기반 새 코스 생성
- 위시리스트 폴더 기반 코스 생성
- Firebase Callable Function을 통한 Gemini 서버 프록시 호출
- 관광공사 검증 장소와 AI 추천 장소 구분
- 코스 저장, 상세 문서 보기, 수정, 재생성, 삭제
- 생성·저장 중복 실행 방지와 저장 완료 상태 보호

### 커뮤니티

- Markdown 기반 게시글 작성·수정·삭제
- 게시글 댓글, 좋아요, 조회수
- 여행지 태그 기반 상세 페이지 이동
- 사용자 활동 내역 확인

### 사용자 계정

- Firebase Authentication 기반 이메일·비밀번호 회원가입과 로그인
- 비밀번호 재설정
- 프로필 수정
- 선호 지역 설정
- Google OAuth는 현재 계획 문서만 작성되어 있으며, MVP 제출 필수 범위에는 포함하지 않습니다.

## API 호출과 캐시 정책

공공 데이터와 위치·날씨 API는 호출 비용과 응답 지연을 줄이기 위해 메모리, localStorage, Realtime Database 기반 캐시를 함께 사용합니다.

| 데이터 | 현재 기준 |
|---|---|
| TourAPI 여행지 목록 | 12시간 |
| TourAPI 키워드 검색 | 6시간 |
| TourAPI 상세 | 14일 |
| TourAPI 갤러리 이미지 | 1일 |
| TourAPI 지역 코드 | 30일 |
| Open-Meteo 현재 날씨 | 1시간 |
| Nominatim 위치명 역지오코딩 | 30일 |

최근 안정화 작업에서 Home 트렌딩 축제 미리보기의 pool 조회 상한을 줄이고, 상세 댓글 조회를 본문 조회와 분리해 초기 화면의 불필요한 대기와 호출 부담을 낮췄습니다. 캐시 효과는 [캐시 측정표](docs/38-cache-measurement-sheet.md)에 따라 개발·시연 세션 단위로 기록합니다.

## Firebase 데이터 구조

```text
users
boardPosts
boardComments
boardCommentsByPost
travelComments
travelCommentsByContent
apiCache
```

사용자 소유 데이터는 `users/{uid}` 하위에서 관리합니다.

```text
users/{uid}
  email
  name
  profileImg
  favoriteRegions
  wishlists/{wishlistId}
  wishlistFolders/{folderId}
  wishlistNotes/{noteId}
  notifications/{notificationId}
  aiTripPlans/{planId}
  activities/boardPosts/{postId}
  activities/boardComments/{commentId}
  activities/travelComments/{commentId}
  activities/likedPosts/{postId}
```

댓글 조회는 전체 댓글 스캔을 줄이기 위해 조회용 인덱스를 사용합니다.

```text
boardCommentsByPost/{postId}/{commentId}
travelCommentsByContent/{contentId}/{commentId}
```

## Gemini Functions 구조

Gemini 호출은 `functions/index.js`의 `generateTripPlan` v2 Callable Function에서 처리합니다.

- 클라이언트는 `httpsCallable(firebaseFunctions, 'generateTripPlan')`만 호출합니다.
- Gemini API 키는 `GEMINI_API_KEY` Functions Secret으로 관리합니다.
- 현재 배포는 Secret version 2 기준으로 smoke test를 완료했습니다.
- 기존 클라이언트 노출 가능 키는 삭제했습니다.
- Functions는 Firebase Auth 인증, 입력 크기·범위 검증, timeout·retry, JSON 파싱, 응답 정규화를 담당합니다.
- 로그에는 요청 원문, 응답 원문, API 키를 남기지 않고 최소 실행 정보만 남깁니다.

남은 보강 항목은 사용자별 호출 제한 반복 검증, 잘못된 입력 케이스 검증, 운영 모니터링입니다.

## 환경 변수

루트 `.env`에는 프론트엔드에서 필요한 공개 설정과 외부 API 키가 필요합니다.

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=newagent-9c2a8.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=newagent-9c2a8
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_DATABASE_URL=https://newagent-9c2a8.firebaseio.com
VITE_TRAVEL_INFO_API_KEY=...
VITE_TOUR_API_KEY=...
VITE_KAKAO_MAP_API_KEY=...
```

Gemini API 키는 루트 `.env`에 두지 않고 Firebase Functions Secret에 등록합니다.

```bash
firebase functions:secrets:set GEMINI_API_KEY
```

필요한 경우 Functions 런타임 모델명은 Functions 환경에서 관리합니다.

```text
GEMINI_MODEL=gemini-3.5-flash-lite
```

실제 API 키, 테스트 계정 비밀번호, 개인 이메일, 팀원 개인정보는 저장소 문서에 원문으로 기록하지 않습니다.

## 로컬 실행

```bash
npm install
npm run dev
```

Vite가 출력하는 로컬 주소로 접속합니다.

Functions lint가 필요하면 아래 명령을 사용합니다.

```bash
npm --prefix functions install
npm --prefix functions run lint
```

## 검증

```bash
npm run lint
npm run build
```

현재 기준:

- `npm run lint`: error 0개, 기존 warning 11개 유지
- `npm run build`: 성공
- Vite 500kB 초과 청크 경고는 기술 부채로 관리 중

빌드 중 Windows 환경에서 `node_modules/.vite-temp` 임시 파일 쓰기 `EPERM`이 발생할 수 있습니다. 이 경우 권한 문제를 해소한 뒤 다시 실행하면 빌드가 통과하는 것으로 확인했습니다.

## 배포

Hosting 배포:

```bash
npm run build
firebase deploy --only hosting:codetrip
```

Functions 배포:

```bash
firebase deploy --only functions:generateTripPlan
```

Realtime Database Rules 배포:

```bash
firebase deploy --only database
```

Firebase CLI가 없으면 `npx firebase-tools`를 사용할 수 있습니다. 배포 후에는 공개 URL에서 홈, 탐색, 축제, 상세, 로그인, AI Planner, 마이페이지, 커뮤니티 smoke test를 수행하고 결과를 [검증 보고서](docs/13-validation-report.md)에 기록합니다.

## 주요 라우트

| 경로 | 페이지 | 설명 |
|---|---|---|
| `/` | Home | 서비스 소개, 저장 데이터 요약, 날씨·지역 기반 추천 |
| `/explore` | Explore | 여행지 탐색, 필터, 위시리스트 추가 |
| `/explore/:contentId` | TravelDetail | 여행지 상세, 지도, 댓글 |
| `/festivals` | Festivals | 전국 축제 목록 |
| `/ai-planner` | AiPlanner | Gemini 기반 AI 여행 코스 생성 |
| `/board` | Board | 커뮤니티 게시판 |
| `/board/write` | BoardWrite | 게시글 작성 |
| `/board/:id` | BoardDetail | 게시글 상세 |
| `/board/tag-search` | TravelTagSearch | 게시글 여행지 태그 검색 |
| `/mypage` | MyPage | 위시리스트, 폴더, 메모, 체크리스트, AI 코스 문서 |
| `/my-activity` | MyActivity | 사용자 활동 내역 |
| `/settings` | Settings | 프로필과 선호 지역 설정 |
| `/login` | Login | 로그인 |
| `/signup` | SignUp | 회원가입 |
| `/forgot-password` | ForgotPassword | 비밀번호 재설정 |

## 주요 디렉터리

```text
CodeTrip-firebase-log-work/
├─ src/
│  ├─ api/
│  ├─ components/
│  ├─ constants/
│  ├─ context/
│  ├─ hooks/
│  ├─ pages/
│  ├─ store/
│  ├─ utils/
│  ├─ firebase.js
│  └─ main.jsx
├─ functions/
│  ├─ index.js
│  ├─ package.json
│  └─ package-lock.json
├─ docs/
├─ CodeTrip_Firebase/
│  ├─ PROJECT_LOG.md
│  ├─ TROUBLESHOOTING.md
│  ├─ guides/
│  ├─ info/
│  └─ project-log/
├─ database.rules.json
├─ firebase.json
├─ package.json
└─ vite.config.js
```

## 공모전 제출 준비 상태

공모전 제출 관련 문서는 `docs/16` 이후 문서와 `docs/28` 대시보드에서 관리합니다.

현재 완료 또는 부분 완료된 주요 항목은 다음과 같습니다.

- 프로젝트 문서 체계화
- 공모전 제출 체크리스트와 기능설명서 문구 정리
- 테스트 계정 시연 데이터 준비 절차 문서화
- Gemini Callable Function 프록시 전환
- 신규 Gemini Secret version 2 smoke test
- API 호출 최적화와 캐시 측정표 작성
- 지도 fallback, 축제 반응형 표시, AI Planner 중복 실행 방지 보강

남은 제출 전 확인 항목은 다음과 같습니다.

- 최종 테스트 계정 데이터 검증
- 서비스 URL smoke test
- Firebase Rules 권한 시나리오 검증표 작성
- 최종 PPTX/PDF 생성, 5페이지 이하·12pt 이상·10MB 미만·정상 열람 검증
- OpenAPI 제출 정보와 기능설명서 API 목록 최종 대조
- 성능·캐시 측정값 기록

---

*Last Updated: 2026-08-16*
