# CodeTrip Firebase

CodeTrip은 공공 여행 데이터, 날씨 정보, 사용자 선호 지역, 위시리스트 폴더, 커뮤니티 기능을 결합한 여행 큐레이션 웹 애플리케이션입니다.

현재 이 저장소는 기존 Express/MySQL 기반 구조에서 Firebase 기반 무료 배포 구조로 전환한 뒤, 공모전 제출용으로 데이터 구조와 배포 문서를 재정비한 버전입니다.

## 🚀 배포 정보

- Firebase Hosting: https://dorigum-codetrip.web.app
- Firebase Project ID: `newagent-9c2a8`
- Realtime Database URL: `https://newagent-9c2a8.firebaseio.com`
- 주요 브랜치: `main`

## 🛠 기술 스택

- React 19
- Vite 8
- Tailwind CSS
- Zustand
- React Router
- Firebase Authentication
- Firebase Realtime Database
- Firebase Hosting
- Korea Tourism Organization TourAPI
- Open-Meteo Weather API
- Kakao Maps SDK

## 🔥 Firebase 실행 구조

```text
React / Vite
  -> Firebase Hosting
  -> Firebase Authentication
  -> Firebase Realtime Database
  -> Public Data API
```

서버 API 의존도를 줄이고, 브라우저에서 Firebase Web SDK와 공공데이터 API를 직접 사용하는 구조입니다.
이전 Express/MySQL 기반 문서는 `documents/archive-pre-firebase/`에 보관합니다.

## ✨ 주요 기능

### 🧭 여행지 탐색

- 지역 필터와 테마 필터 기반 여행지 탐색
- 공공데이터 API 기반 여행지 목록 조회
- 키워드 검색
- 페이지네이션
- 사용자 선호 지역 기반 빠른 필터

### 🌤 날씨 기반 추천

- Open-Meteo 날씨 데이터를 기반으로 추천 키워드 생성
- 사용자의 선호 지역과 현재 날씨를 반영한 여행지 추천
- 선호 지역이 없을 경우 기본 지역 기반 추천 fallback

### 💾 위시리스트와 여행 폴더

- 여행지를 위시리스트에 저장
- 폴더별 여행지 분류
- 폴더별 여행 일정 설정
- 폴더별 메모와 체크리스트 작성
- 폴더 통계 위젯 제공
- 폴더에서 `EXPLORE_ADD`를 통해 Explore로 이동한 뒤, 원하는 여행지의 하트 버튼으로 해당 폴더에 바로 추가

### 🎉 축제 탐색

- 전국 축제 데이터 조회
- 날짜와 최신순 정렬
- 축제 위시리스트 저장

### 💬 커뮤니티

- Markdown 기반 게시글 작성
- 게시글 목록, 상세, 수정, 삭제
- 댓글과 좋아요
- 여행지 태그 기반 상세 페이지 이동
- 사용자 활동 내역 확인

### 🔔 알림

- 게시글 댓글, 여행지 댓글 등 사용자 활동 기반 알림
- 읽음 처리
- 개별 삭제와 전체 삭제

### 👤 사용자 계정

- Firebase Authentication 기반 회원가입과 로그인
- 비밀번호 재설정
- 프로필 수정
- 선호 지역 설정

## 📁 주요 디렉터리 구조

```text
CodeTrip-firebase-log-work/
├─ src/
│  ├─ api/
│  │  ├─ authApi.js
│  │  ├─ boardApi.js
│  │  ├─ firebaseHelpers.js
│  │  ├─ notificationApi.js
│  │  ├─ travelApi.js
│  │  ├─ travelCommentApi.js
│  │  ├─ travelInfoApi.js
│  │  ├─ weatherApi.js
│  │  └─ wishlistApi.js
│  ├─ components/
│  ├─ constants/
│  ├─ hooks/
│  ├─ pages/
│  ├─ store/
│  ├─ App.jsx
│  ├─ firebase.js
│  └─ main.jsx
├─ public/
├─ dist/
├─ documents/
│  ├─ Firebase/
│  │  ├─ Firebase_수정 로그.md
│  │  ├─ Firebase_상세 내역서.md
│  │  └─ Project_Firebase_배포.md
│  └─ archive-pre-firebase/
├─ database.rules.json
├─ firebase.json
├─ package.json
└─ vite.config.js
```

Firebase 제출/배포 기준 실행 경로는 Vite 프론트엔드와 Firebase SDK입니다.

## 🗄 Realtime Database 데이터 구조

```text
users
boardPosts
boardComments
boardCommentsByPost
travelComments
travelCommentsByContent
apiCache
```

### 🔐 사용자 개인 데이터 예시

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
  activities/boardPosts/{postId}
  activities/boardComments/{commentId}
  activities/travelComments/{commentId}
  activities/likedPosts/{postId}
```

### 🧾 댓글 조회 인덱스 예시

```text
boardCommentsByPost/{postId}/{commentId}
  comment_id
  user_id
  created_at

travelCommentsByContent/{contentId}/{commentId}
  comment_id
  user_id
  created_at
```

### ⚡ API 캐시 예시

```text
apiCache/{cacheKey}
  data
  expiresAt
  updatedAt
```

## 🔑 환경 변수

루트 `.env`에 다음 값이 필요합니다.

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
VITE_GEMINI_API_KEY=...
VITE_GEMINI_MODEL=gemini-3.5-flash
```

Firebase config 값은 브라우저 번들에 포함됩니다. 실제 데이터 보호는 Firebase Authentication과 `database.rules.json`의 보안 규칙으로 제어합니다.

## 🧠 Gemini 제출 전 전환 메모

현재 Gemini 기능은 로컬 `.env` 기반으로 UI, 프롬프트, 응답 데이터 구조를 검증하는 단계입니다.
공모전 최종 제출 전에는 API key가 프론트엔드 번들에 포함되지 않도록 서버성 구조로 전환합니다.

- 제출 전 Firebase 프로젝트를 Blaze 요금제로 전환합니다.
- Gemini API 호출을 Firebase Functions로 이동합니다.
- Gemini API key는 Functions Secret으로 관리합니다.
- 프론트엔드는 Gemini API를 직접 호출하지 않고 Functions 엔드포인트만 호출합니다.
- `npm run lint`, `npm run build` 후 Firebase Hosting과 Functions를 함께 배포합니다.
- 배포 후 AI 여행 코스 생성, 저장, 사용량 초과 안내 메시지를 최종 테스트합니다.

Blaze 전환은 결제 계정 연결이 필요한 작업이므로, 현재는 후순위로 두고 제출 직전에 진행합니다.

## 💻 로컬 실행

```bash
npm install
npm run dev
```

접속 주소는 Vite 콘솔에 표시되는 주소를 기준으로 확인합니다.
최근 로컬 테스트는 다음 주소에서 진행했습니다.

```text
http://localhost:5180
```

## 🔎 코드 품질 확인

개발 중이거나 빌드/배포 전에 `lint`를 먼저 실행해 문법 오류, 사용하지 않는 코드, React Hook 사용 방식 등 잠재적인 문제를 확인합니다.

```bash
npm run lint
```

권장 확인 순서는 다음과 같습니다.

```bash
npm run lint
npm run build
npm run dev
```

`lint`의 error는 배포 전 수정 대상이며, warning은 당장 실행을 막지는 않지만 추후 안정성 개선을 위해 정리합니다.

## 📦 빌드

```bash
npm run build
```

빌드 결과물은 `dist/`에 생성됩니다.

## 🚢 Firebase 배포

```bash
npm run build
npx firebase-tools deploy --only hosting,database
```

Firebase CLI 로그인이 되어 있지 않은 환경에서는 Realtime Database Rules를 Firebase Console에서 직접 반영할 수 있습니다.

```text
Firebase Console
-> Realtime Database
-> Rules
-> database.rules.json 내용 붙여넣기
-> Publish
```

Hosting 배포 대상은 `firebase.json`의 Hosting 설정에 따라 `dist/`입니다.

## ✅ 검증 상태

- 로컬 개발 서버에서 회원가입, 로그인, 로그아웃 정상 동작 확인
- 위시리스트 저장, 폴더 생성, 체크리스트와 메모 생성 정상 동작 확인
- 게시글 목록, 작성, 상세 보기, 수정, 삭제 정상 동작 확인
- 게시글 댓글, 좋아요, 내 활동 조회 정상 동작 확인
- Realtime Database Rules 반영 후 권한 오류 수정 확인
- `npm run build` 성공
- `npm run lint` error 0개 확인
- 기존 React Hook warning 12개는 남아 있으나, Firebase 데이터 구조 변경으로 인한 신규 lint error는 없음
- `npx firebase-tools deploy --only hosting,database`로 Firebase Hosting과 Realtime Database Rules 배포 완료
- Firebase Hosting 배포 URL 접속 확인: https://dorigum-codetrip.web.app

## 🧭 주요 라우트

| 경로 | 페이지 | 설명 |
| --- | --- | --- |
| `/` | Home | 날씨와 선호 지역 기반 추천 |
| `/explore` | Explore | 여행지 탐색, 필터, 위시리스트 추가 |
| `/explore/:contentId` | TravelDetail | 여행지 상세, 지도, 댓글 |
| `/festivals` | Festivals | 전국 축제 목록 |
| `/ai-planner` | AiPlanner | Gemini 기반 AI 여행 코스 생성 |
| `/board` | Board | 커뮤니티 게시판 |
| `/board/write` | BoardWrite | 게시글 작성 |
| `/board/:id` | BoardDetail | 게시글 상세 |
| `/board/tag-search` | TravelTagSearch | 게시글 여행지 태그 검색 |
| `/mypage` | MyPage | 위시리스트, 폴더, 메모, 체크리스트 |
| `/my-activity` | MyActivity | 사용자 활동 내역 |
| `/settings` | Settings | 프로필과 선호 지역 설정 |
| `/login` | Login | 로그인 |
| `/signup` | SignUp | 회원가입 |
| `/forgot-password` | ForgotPassword | 비밀번호 재설정 |

## 📚 문서

- [Firebase 수정 로그](documents/Firebase/Firebase_수정%20로그.md)
- [Firebase 상세 내역서](documents/Firebase/Firebase_상세%20내역서.md)
- [Firebase 배포 전환 문서](documents/Firebase/Project_Firebase_배포.md)
- [Gemini 프롬프트 설계](documents/Firebase/Gemini_프롬프트_설계.md)

## 📝 운영 메모

- 이 저장소는 개인 단독 작업 기준으로 관리합니다.
- Firebase 배포 가능한 기준 브랜치는 `main`으로 둡니다.
- 일반적인 수정은 `main`에서 바로 진행합니다.
- 실험적 기능이나 변경 범위가 큰 작업은 `feature/...` 브랜치에서 진행한 뒤 PR 또는 셀프 리뷰 후 `main`으로 병합합니다.
- PR은 필수 절차가 아니라 변경 이력 정리나 셀프 리뷰가 필요할 때 선택적으로 사용합니다.
- Firebase 배포 전에는 `npm run lint`, `npm run build`, Realtime Database Rules 반영 여부를 확인합니다.

## 🗓 Last Updated

2026.07.22
