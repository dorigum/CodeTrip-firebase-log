# CodeTrip Firebase

CodeTrip은 공공 여행 데이터, 날씨 정보, 사용자 선호 지역, 위시리스트 폴더, 커뮤니티 기능을 결합한 여행 큐레이션 웹 애플리케이션입니다.

현재 이 저장소는 기존 Express/MySQL 기반 구조에서 Firebase 기반 무료 배포 구조로 전환한 버전을 기준으로 관리합니다.

## 배포 정보

- Firebase Hosting: https://newagent-9c2a8.web.app
- Firebase Project ID: `newagent-9c2a8`
- Realtime Database URL: `https://newagent-9c2a8.firebaseio.com`
- 주요 브랜치: `firebase`

## 기술 스택

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

## Firebase 전환 구조

기존 구조:

```text
React / Vite
  -> Express API
  -> MySQL
```

Firebase 전환 후 구조:

```text
React / Vite
  -> Firebase Hosting
  -> Firebase Authentication
  -> Firebase Realtime Database
  -> Public Data API
```

서버 API 의존도를 줄이고, 브라우저에서 Firebase Web SDK와 공공데이터 API를 직접 사용하는 구조입니다.

## 주요 기능

### 여행지 탐색

- 지역 필터와 테마 필터 기반 여행지 탐색
- 공공데이터 API 기반 여행지 목록 조회
- 키워드 검색
- 페이지네이션
- 사용자 선호 지역 기반 빠른 필터

### 날씨 기반 추천

- Open-Meteo 날씨 데이터를 기반으로 추천 키워드 생성
- 사용자의 선호 지역과 현재 날씨를 반영한 여행지 추천
- 선호 지역이 없을 경우 기본 지역 기반 추천 fallback

### 위시리스트와 여행 폴더

- 여행지를 위시리스트에 저장
- 폴더별 여행지 분류
- 폴더별 여행 일정 설정
- 폴더별 메모와 체크리스트 작성
- 폴더 통계 위젯 제공
- 폴더에서 `EXPLORE_ADD`를 통해 Explore로 이동한 뒤, 원하는 여행지의 하트 버튼으로 해당 폴더에 바로 추가

### 축제 탐색

- 전국 축제 데이터 조회
- 날짜와 최신순 정렬
- 축제 위시리스트 저장

### 커뮤니티

- Markdown 기반 게시글 작성
- 게시글 목록, 상세, 수정, 삭제
- 댓글과 좋아요
- 여행지 태그 기반 상세 페이지 이동
- 사용자 활동 내역 확인

### 알림

- 게시글 댓글, 여행지 댓글 등 사용자 활동 기반 알림
- 읽음 처리
- 개별 삭제와 전체 삭제

### 사용자 계정

- Firebase Authentication 기반 회원가입과 로그인
- 비밀번호 재설정
- 프로필 수정
- 선호 지역 설정

## 주요 디렉터리 구조

```text
2_Code_Trip/
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
├─ 2_Project_Documents/
│  └─ Firebase/
│     ├─ Firebase_수정로그.md
│     ├─ Firebase_상세내역서.md
│     └─ Project_Firebase_배포.md
├─ database.rules.json
├─ firebase.json
├─ package.json
└─ vite.config.js
```

`server/` 디렉터리는 기존 Express/MySQL 구조의 흔적이 남아 있지만, Firebase 배포 버전의 핵심 실행 경로는 프론트엔드와 Firebase SDK입니다.

## Realtime Database 데이터 구조

```text
users
boardPosts
boardComments
travelComments
wishlists
wishlistFolders
wishlistNotes
notifications
apiCache
```

### 위시리스트 예시

```text
wishlists/{wishlistId}
  user_id
  contentId
  title
  imageUrl
  folder_id
  created_at
```

### 위시리스트 폴더 예시

```text
wishlistFolders/{folderId}
  user_id
  name
  start_date
  end_date
  created_at
  updated_at
```

### API 캐시 예시

```text
apiCache/{cacheKey}
  data
  expiresAt
  updatedAt
```

## 환경 변수

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
VITE_KAKAO_MAP_API_KEY=...
```

Firebase config 값은 브라우저 번들에 포함됩니다. 실제 데이터 보호는 Firebase Authentication과 `database.rules.json`의 보안 규칙으로 제어합니다.

## 로컬 실행

```bash
npm install
npm run dev
```

기본 접속 주소:

```text
http://localhost:5173
```

## 빌드

```bash
npm run build
```

빌드 결과물은 `dist/`에 생성됩니다.

## Firebase 배포

```bash
firebase deploy --only hosting
```

배포 대상은 `firebase.json`의 Hosting 설정에 따라 `dist/`입니다.

## 주요 라우트

| 경로 | 페이지 | 설명 |
| --- | --- | --- |
| `/` | Home | 날씨와 선호 지역 기반 추천 |
| `/explore` | Explore | 여행지 탐색, 필터, 위시리스트 추가 |
| `/explore/:contentId` | TravelDetail | 여행지 상세, 지도, 댓글 |
| `/festivals` | Festivals | 전국 축제 목록 |
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

## 문서

- [Firebase 수정 로그](2_Project_Documents/Firebase/Firebase_수정로그.md)
- [Firebase 상세내역서](2_Project_Documents/Firebase/Firebase_상세내역서.md)
- [Firebase 배포 전환 문서](2_Project_Documents/Firebase/Project_Firebase_배포.md)

## 운영 메모

- Firebase 배포 버전은 `firebase` 브랜치 기준으로 관리합니다.
- 팀 협업용 `main` 브랜치에는 Firebase 배포 실험 변경을 직접 병합하지 않는 것을 전제로 합니다.
- 개인 기록용 저장소는 `firebase-log` remote로 분리되어 있습니다.
- 팀 원격 저장소 `origin`에는 별도 요청이 있을 때만 푸시합니다.

## Last Updated

2026.05.03
