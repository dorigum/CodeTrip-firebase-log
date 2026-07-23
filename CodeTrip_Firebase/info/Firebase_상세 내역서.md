# 2026.05.03 Firebase 상세내역서

## 1. 문서 목적

이 문서는 CodeTrip 프로젝트가 기존 Express/MySQL 기반 구조에서 Firebase 기반 배포 구조로 변경되면서 달라진 프로젝트 구조, 데이터 흐름, 주요 기능, 운영 방식을 상세히 정리한 문서입니다.

대상 브랜치: `firebase`  
배포 방식: Firebase Hosting 정적 배포  
인증 방식: Firebase Authentication  
데이터 저장소: Firebase Realtime Database  
배포 URL: `https://newagent-9c2a8.web.app`

---

## 2. 전체 아키텍처 변경

### 기존 구조

```text
React / Vite Frontend
  -> Express API Server
  -> MySQL Database
  -> TourAPI / Weather API
```

기존 구조에서는 프론트엔드가 `/api` 경로로 Express 서버에 요청하고, Express 서버가 MySQL과 외부 API를 중계했습니다.

### Firebase 전환 후 구조

```text
React / Vite Frontend
  -> Firebase Hosting
  -> Firebase Authentication
  -> Firebase Realtime Database
  -> Public Data API / Weather API
```

Firebase 전환 후에는 별도 Express 서버 없이 브라우저에서 Firebase Web SDK를 사용합니다. 사용자 데이터는 Realtime Database에 저장하고, 정적 파일은 Firebase Hosting에서 제공합니다.

---

## 3. Firebase 프로젝트 구성

### Firebase 프로젝트 정보

```text
Project ID: newagent-9c2a8
Project Name: CodeTrip
Hosting URL: https://newagent-9c2a8.web.app
Realtime Database URL: https://newagent-9c2a8.firebaseio.com
```

### 사용 Firebase 기능

- Firebase Hosting
  - Vite 빌드 결과물 `dist`를 배포합니다.
  - SPA 라우팅을 위해 모든 요청을 `/index.html`로 rewrite합니다.

- Firebase Authentication
  - 이메일/비밀번호 회원가입과 로그인을 처리합니다.
  - 비밀번호 재설정과 사용자 프로필 변경을 담당합니다.

- Firebase Realtime Database
  - 사용자 프로필, 게시판, 댓글, 위시리스트, 알림, API 캐시를 저장합니다.

### 사용하지 않는 Firebase 기능

- Firestore
  - 프로젝트의 기본 Firestore DB가 Datastore Mode라 Web SDK 기반 Native Firestore로 바로 사용하기 어렵기 때문에 사용하지 않았습니다.

- Firebase Storage
  - 현재 프로젝트에서는 이미지 업로드 저장소로 사용하지 않습니다.
  - 사용자 이미지가 필요한 경우 data URL 또는 외부 이미지 URL을 사용합니다.

---

## 4. 주요 설정 파일

### `.firebaserc`

역할:

- 기본 Firebase 프로젝트를 `newagent-9c2a8`로 지정합니다.
- `firebase deploy` 실행 시 대상 프로젝트를 자동으로 선택합니다.

### `firebase.json`

역할:

- Hosting public 디렉터리를 `dist`로 설정합니다.
- `database.rules.json`을 Realtime Database Rules 파일로 연결합니다.
- 모든 경로를 `/index.html`로 rewrite해서 React Router의 SPA 라우팅을 지원합니다.

핵심 구조:

```json
{
  "database": {
    "rules": "database.rules.json"
  },
  "hosting": {
    "public": "dist",
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### `database.rules.json`

역할:

- Realtime Database 노드별 읽기/쓰기 권한을 제어합니다.
- 사용자 개인 데이터는 인증된 본인만 접근하도록 제한합니다.
- 공개 콘텐츠는 읽기를 허용하되 쓰기는 작성자 기준으로 제한합니다.

주요 노드:

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

---

## 5. 프론트엔드 Firebase 초기화 구조

### `src/firebase.js`

역할:

- Firebase App을 초기화합니다.
- Firebase Auth 인스턴스를 생성합니다.
- Realtime Database 인스턴스를 생성합니다.

사용 export:

```js
export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const realtimeDb = getDatabase(firebaseApp);
```

환경 변수:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=newagent-9c2a8.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=newagent-9c2a8
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_DATABASE_URL=https://newagent-9c2a8.firebaseio.com
```

주의 사항:

- `VITE_` 접두사가 붙은 환경 변수는 브라우저 번들에 포함됩니다.
- Firebase config 자체는 비밀값이 아니며, 실제 보안은 Database Rules와 Auth 정책으로 제어합니다.

---

## 6. 공통 Firebase 헬퍼 구조

### `src/api/firebaseHelpers.js`

주요 역할:

- 현재 Firebase Auth 사용자 조회
- localStorage에 저장된 사용자 정보 조회
- Realtime Database snapshot을 배열로 변환
- 날짜를 ISO 문자열로 변환
- 좋아요 map을 id 배열로 변환
- 댓글과 게시글 데이터 shape 정규화

대표 책임:

```text
Firebase SDK의 원시 데이터 구조
  -> React 컴포넌트와 Zustand store가 사용하기 쉬운 배열/객체 구조로 변환
```

이 헬퍼는 Firebase 전환 후 각 API 파일에서 반복되는 변환 로직을 줄이는 역할을 합니다.

---

## 7. 인증 기능 상세

### 관련 파일

```text
src/api/authApi.js
src/store/useAuthStore.js
src/pages/Login.jsx
src/pages/SignUp.jsx
src/pages/ForgotPassword.jsx
src/pages/Settings.jsx
```

### 회원가입

흐름:

```text
사용자 입력
  -> createUserWithEmailAndPassword
  -> Firebase Auth 계정 생성
  -> updateProfile로 displayName 저장
  -> users/{uid}에 앱 사용자 프로필 저장
```

저장 데이터 예시:

```text
users/{uid}
  id
  email
  name
  profile_image
  favorite_regions
  created_at
  updated_at
```

### 로그인

흐름:

```text
이메일/비밀번호 입력
  -> signInWithEmailAndPassword
  -> users/{uid} 프로필 조회
  -> Zustand auth store 저장
  -> localStorage 동기화
```

### 로그아웃

흐름:

```text
firebaseAuth.signOut()
  -> Zustand 상태 초기화
  -> localStorage 사용자 정보 정리
  -> 위시리스트 상태 초기화
```

### 오류 처리

Firebase Auth 오류 코드를 한국어 안내 메시지로 변환합니다.

예시:

```text
auth/email-already-in-use
auth/weak-password
auth/invalid-credential
auth/operation-not-allowed
```

---

## 8. 위시리스트 기능 상세

### 관련 파일

```text
src/api/wishlistApi.js
src/store/useWishlistStore.js
src/components/WishlistModal.jsx
src/pages/MyPage.jsx
src/pages/Explore.jsx
src/pages/TravelDetail.jsx
src/pages/Festivals.jsx
```

### Realtime Database 노드

```text
wishlists
wishlistFolders
wishlistNotes
```

### 위시리스트 저장 데이터

```text
wishlists/{wishlistId}
  user_id
  contentId
  title
  imageUrl
  folder_id
  created_at
```

### 위시리스트 폴더 데이터

```text
wishlistFolders/{folderId}
  user_id
  name
  start_date
  end_date
  created_at
  updated_at
```

### 폴더 메모 및 체크리스트 데이터

```text
wishlistNotes/{noteId}
  folder_id
  user_id
  content
  type
  is_completed
  created_at
```

`type` 값:

```text
CHECKLIST
MEMO
```

### Zustand store 역할

`useWishlistStore.js`는 다음 상태를 관리합니다.

```text
wishlistItems
folders
wishlistIds
loading
initialized
syncError
```

주요 액션:

```text
initWishlist
syncWithServer
clearWishlist
toggleWishlist
createFolder
updateFolder
deleteFolder
moveItem
fetchNotes
addNote
toggleNote
deleteNote
```

### 위시리스트 추가 흐름

일반 Explore 진입:

```text
Explore 카드 하트 클릭
  -> WishlistModal 열림
  -> 폴더 선택
  -> wishlists 노드에 저장
```

특정 폴더에서 Explore로 이동한 경우:

```text
MyPage에서 폴더 선택
  -> EXPLORE_ADD 클릭
  -> /explore로 targetWishlistFolder state 전달
  -> Explore 카드 하트 클릭
  -> 모달 없이 해당 folder_id로 바로 저장
```

이 방식은 사용자가 직접 `CONTENT ID`를 입력하지 않고 실제 Explore 목록에서 여행지를 선택하게 합니다.

---

## 9. 게시판 기능 상세

### 관련 파일

```text
src/api/boardApi.js
src/pages/Board.jsx
src/pages/BoardDetail.jsx
src/pages/BoardWrite.jsx
src/pages/TravelTagSearch.jsx
```

### Realtime Database 노드

```text
boardPosts
boardComments
```

### 게시글 기능

- 게시글 목록 조회
- 게시글 상세 조회
- 게시글 작성
- 게시글 수정
- 게시글 삭제
- 좋아요 처리
- 여행지 태그 연결

### 댓글 기능

- 댓글 작성
- 댓글 삭제
- 작성자 기준 권한 확인

Firebase Rules에서 공개 읽기와 작성자 기반 쓰기 권한을 분리했습니다.

---

## 10. 여행지 댓글 및 알림 기능 상세

### 관련 파일

```text
src/api/travelCommentApi.js
src/api/notificationApi.js
src/pages/TravelDetail.jsx
```

### Realtime Database 노드

```text
travelComments
notifications
wishlists
```

### 여행지 댓글

여행지 상세 페이지에서 댓글을 작성하면 `travelComments` 노드에 저장합니다.

댓글 데이터는 다음 정보를 포함합니다.

```text
contentId
user_id
user_name
content
created_at
like_user_ids
```

### 알림

여행지 댓글 작성 시 해당 여행지를 위시리스트에 담은 다른 사용자에게 알림을 만들 수 있습니다.

알림 데이터 예시:

```text
notifications/{notificationId}
  user_id
  type
  title
  message
  link
  is_read
  created_at
```

---

## 11. 여행지 탐색 및 추천 기능 상세

### 관련 파일

```text
src/api/travelApi.js
src/api/travelInfoApi.js
src/api/weatherApi.js
src/api/apiCache.js
src/store/useExploreStore.js
src/pages/Home.jsx
src/pages/Explore.jsx
src/pages/Festivals.jsx
```

### 공공데이터 API 호출

Firebase 전환 후 Express 서버를 거치지 않고 프론트에서 직접 공공데이터 API를 호출합니다.

주요 기능:

- 여행지 목록 조회
- 키워드 검색
- 지역 필터
- 테마 필터
- 행사/축제 목록
- 날씨 기반 추천
- 선호 지역 기반 추천

### API 캐시

`apiCache` 노드를 사용해 공공데이터 API 응답을 공유 캐시로 저장합니다.

캐시 데이터 구조:

```text
apiCache/{cacheKey}
  data
  expiresAt
  updatedAt
```

장점:

- 외부 API 호출량 감소
- 새로고침 및 사용자 간 반복 요청 비용 감소
- Firebase 정적 배포 환경에서 서버 캐시 대체

---

## 12. 라우팅과 배포 구조

### React Router 경로

```text
/
/explore
/explore/:contentId
/login
/signup
/mypage
/settings
/forgot-password
/festivals
/info
/board
/board/write
/board/tag-search
/board/:id
/my-activity
```

### Firebase Hosting rewrite

Firebase Hosting은 정적 파일 서버이므로 `/mypage`, `/explore/123` 같은 직접 접근 경로를 알지 못합니다. 이를 해결하기 위해 모든 경로를 `/index.html`로 rewrite합니다.

```text
요청: /mypage
Hosting rewrite: /index.html
React Router: MyPage 렌더링
```

---

## 13. UI 및 사용자 경험 변경

### 메인 스크롤바 숨김

`src/App.css`에 `.no-scrollbar` 유틸을 추가하고 `src/App.jsx`의 메인 스크롤 컨테이너에 적용했습니다.

목적:

- 스크롤 기능은 유지
- 시각적 스크롤바 인디케이터는 숨김
- 배포 페이지의 디자인 일관성 개선

### Explore 필터 패널 개선

Explore 필터 패널의 불필요한 스크롤바 표시를 제거하고, 전체 페이지 스크롤 흐름과 자연스럽게 연결되도록 수정했습니다.

### 위시리스트 폴더 기반 Explore 추가

MyPage의 폴더 화면에서 `EXPLORE_ADD` 버튼을 제공하고, Explore에서 실제 여행지를 선택해 현재 폴더에 바로 저장하는 방식으로 개선했습니다.

---

## 14. 배포 및 운영 방법

### 로컬 실행

```bash
npm run dev
```

기본 접속:

```text
http://localhost:5173
```

### 빌드

```bash
npm run build
```

빌드 결과:

```text
dist/
```

### Firebase Hosting 배포

```bash
firebase deploy --only hosting
```

배포 완료 후 접속:

```text
https://newagent-9c2a8.web.app
```

### 배포 확인 체크리스트

- 로그인/회원가입 가능 여부
- MyPage 위시리스트 목록 조회 여부
- 위시리스트 폴더 생성/수정/삭제 여부
- Explore에서 하트 클릭 후 위시리스트 저장 여부
- 특정 폴더에서 `EXPLORE_ADD`로 이동 후 해당 폴더에 바로 저장되는지 여부
- 게시판 목록/작성/상세 조회 여부
- 여행지 상세 댓글 및 알림 동작 여부

---

## 15. 남은 주의 사항

### 인덱싱과 대용량 데이터

Realtime Database는 단순 구조와 빠른 실시간 동기화에는 적합하지만 복잡한 조건 검색에는 한계가 있습니다. 데이터가 커질 경우 다음 개선이 필요할 수 있습니다.

- 사용자별 하위 경로 재구성
- 조회 빈도가 높은 데이터의 별도 인덱스 노드 구성
- Rules에 `.indexOn` 추가

### 외부 API 키 관리

프론트 단독 배포에서는 `VITE_` 환경 변수가 브라우저에 노출됩니다. 공공 API 키 정책에 따라 필요하면 별도 프록시 서버 또는 Cloud Functions 도입을 검토해야 합니다.

### Firestore 미사용

현재는 프로젝트 상황상 Realtime Database를 사용합니다. 향후 결제 설정이나 Firestore Native DB 구성이 가능해지면 게시판, 알림, 위시리스트 등 일부 기능을 Firestore 컬렉션 구조로 이전할 수 있습니다.

