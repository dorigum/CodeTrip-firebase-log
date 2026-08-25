# CodeTrip Firebase 배포 전환 문서

> 작성일: 2026-05-02
> 대상 브랜치: `main`
> 배포 URL: https://dorigum-codetrip.web.app
> Realtime Database URL: `https://newagent-9c2a8.firebaseio.com`

---

## 1. 문서 목적

이 문서는 CodeTrip 프로젝트를 기존 Express/MySQL 기반 구조에서 Firebase 기반 무료 배포 구조로 전환한 작업 내역을 정리합니다.

현재 CodeTrip은 개인 단독 작업 기준으로 관리하며, Firebase 배포 가능한 기준 브랜치는 `main`입니다. 위험도가 있는 변경이나 장기 실험은 짧은 `feature/...` 브랜치에서 작업한 뒤 `main`으로 병합합니다.

---

## 2. 전환 배경

초기 배포 방향은 Firebase Hosting에 프론트엔드를 배포하고, Express 서버는 Cloud Run, MySQL은 Cloud SQL로 운영하는 구조였습니다.

하지만 다음 이유로 Cloud SQL/Firestore 대신 Realtime Database로 방향을 변경했습니다.

1. Cloud SQL은 계속 무료로 운영하기 어렵습니다.
2. 복구한 Firebase 프로젝트 `newagent-9c2a8`의 기본 Firestore DB가 `DATASTORE_MODE`였습니다.
3. `DATASTORE_MODE` DB는 Firebase Web SDK용 Firestore Native mode로 바로 사용할 수 없습니다.
4. 별도 Firestore Native DB 생성을 시도했지만 결제 연결이 필요했습니다.
5. 프로젝트 목적이 소규모 시연/개인 배포이므로 Realtime Database로도 충분하다고 판단했습니다.

최종 결정:

```text
Firebase Hosting
+ Firebase Authentication
+ Firebase Realtime Database
+ Vite/React 프론트 단독 배포
```

---

## 3. 최종 아키텍처

### 3.1 기존 구조

```text
React/Vite Frontend
  -> /api
  -> Express Server
  -> MySQL
```

주요 구성:

```text
server/index.js
server/routes/*
server/config/db.js
server/db/init.js
src/api/axiosInstance.js
src/api/*Api.js
```

### 3.2 Firebase 전환 후 구조

```text
React/Vite Frontend
  -> Firebase Auth
  -> Firebase Realtime Database
  -> 공공데이터 API 직접 호출
  -> Firebase Hosting
```

서버 없이 브라우저에서 직접 Firebase SDK를 사용합니다.

```text
src/firebase.js
src/api/authApi.js
src/api/boardApi.js
src/api/wishlistApi.js
src/api/travelCommentApi.js
src/api/notificationApi.js
database.rules.json
firebase.json
```

---

## 4. Firebase 프로젝트 설정

### 4.1 사용 프로젝트

```text
Firebase Project ID: newagent-9c2a8
Firebase Project Name: CodeTrip
Hosting URL: https://dorigum-codetrip.web.app
Realtime Database URL: https://newagent-9c2a8.firebaseio.com
```

### 4.2 Firebase 콘솔에서 활성화한 기능

Firebase 콘솔에서 다음 기능을 사용합니다.

```text
Build
  Authentication
  Realtime Database
  Storage
  Hosting
```

Storage는 프로필 이미지와 게시글 첨부 이미지 업로드에 사용합니다. 브라우저에서 선택한 이미지는 Storage에 저장하고, 프로필 또는 게시글 본문에는 다운로드 URL만 저장합니다.

---

## 5. 환경 변수

루트 `.env`에 Firebase 웹 앱 설정과 Realtime Database URL을 추가했습니다.

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=newagent-9c2a8.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=newagent-9c2a8
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_DATABASE_URL=https://newagent-9c2a8.firebaseio.com
```

주의:

- `VITE_` 접두사가 붙은 값은 브라우저 번들에 포함됩니다.
- Firebase 웹 config는 비밀키가 아니지만, DB 보안은 반드시 Firebase Rules로 제어해야 합니다.
- `server/.env`는 Firebase 배포 버전에서는 사용하지 않습니다.

---

## 6. 코드 변경 요약

### 6.1 Firebase SDK 추가

`firebase` 패키지를 설치했습니다.

```bash
npm install firebase
```

변경 파일:

```text
package.json
package-lock.json
```

### 6.2 Firebase 초기화 파일 추가

파일:

```text
src/firebase.js
```

역할:

```text
Firebase App 초기화
Firebase Auth 인스턴스 생성
Realtime Database 인스턴스 생성
```

현재 구조:

```js
export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const realtimeDb = getDatabase(firebaseApp);
```

### 6.3 공통 Firebase 헬퍼 추가

파일:

```text
src/api/firebaseHelpers.js
```

주요 역할:

```text
현재 로그인 사용자 조회
localStorage 사용자 정보 조회
Realtime Database snapshot -> 배열 변환
날짜 ISO 문자열 변환
좋아요 map -> userId 배열 변환
게시글/댓글 응답 shape 정규화
```

---

## 7. API 레이어 전환 내역

기존에는 `axios`로 Express API를 호출했습니다.

```text
/api/signup
/api/login
/api/board/posts
/api/wishlist/details
/api/travel-comments/:contentId
/api/notifications
```

Firebase 전환 후에는 각 API 파일이 Realtime Database SDK를 직접 호출합니다.

### 7.1 인증 API

파일:

```text
src/api/authApi.js
```

전환 내용:

```text
회원가입: createUserWithEmailAndPassword
로그인: signInWithEmailAndPassword
비밀번호 재설정: sendPasswordResetEmail
비밀번호 변경: reauthenticateWithCredential + updatePassword
프로필 수정: updateProfile + users/{uid} update
관심 지역 저장: users/{uid}/favoriteRegions
```

기존 JWT 기반 인증은 Firebase Auth 토큰 기반으로 대체했습니다. 다만 기존 화면 호환을 위해 `trip_user`, `trip_token` localStorage 구조는 유지했습니다.

### 7.2 게시판 API

파일:

```text
src/api/boardApi.js
```

전환 내용:

```text
boardPosts
boardComments
notifications
```

지원 기능:

```text
게시글 목록 조회
게시글 상세 조회
게시글 작성/수정/삭제
게시글 조회수 증가
게시글 좋아요
게시글 댓글 작성/수정/삭제
댓글 좋아요
내가 쓴 게시글 조회
내가 쓴 게시글 댓글 조회
내가 좋아요한 게시글 조회
내가 쓴 여행지 댓글 조회
```

Realtime Database는 Firestore처럼 복합 쿼리가 강하지 않으므로, 소규모 데이터 기준으로 전체 데이터를 읽고 클라이언트에서 필터링/정렬합니다.

### 7.3 여행지 댓글 API

파일:

```text
src/api/travelCommentApi.js
```

전환 내용:

```text
travelComments
wishlists
notifications
```

지원 기능:

```text
여행지별 댓글 조회
여행지 댓글 작성/수정/삭제
여행지 댓글 좋아요
찜한 여행지에 댓글 작성 시 알림 생성
```

### 7.4 알림 API

파일:

```text
src/api/notificationApi.js
```

전환 내용:

```text
notifications
```

지원 기능:

```text
알림 목록 조회
읽지 않은 알림 수 계산
전체 읽음 처리
개별 읽음 처리
개별 알림 삭제
읽은 알림 전체 삭제
```

### 7.5 위시리스트 API

파일:

```text
src/api/wishlistApi.js
```

전환 내용:

```text
wishlists
wishlistFolders
wishlistNotes
```

지원 기능:

```text
찜 목록 조회
찜 추가/삭제 toggle
폴더 목록 조회
폴더 생성/수정/삭제
여행지 폴더 이동
폴더별 노트 조회
노트 생성
체크리스트 완료 toggle
노트 삭제
```

### 7.6 공공데이터 API

파일:

```text
src/api/travelApi.js
src/api/travelInfoApi.js
```

기존에는 Express 서버가 공공데이터 API 프록시 및 캐시 역할을 했습니다.

Firebase 무료 배포 버전에서는 서버를 제거했으므로 브라우저에서 공공데이터 API를 호출해야 하지만, 429 오류를 줄이기 위해 Realtime Database 공유 캐시를 추가했습니다.

캐시 조회 순서:

```text
메모리 캐시
-> localStorage 캐시
-> Realtime Database apiCache
-> 공공데이터 API 직접 호출
-> 성공 시 Realtime Database + localStorage + 메모리에 저장
```

캐시 TTL:

```text
지역 코드 목록: 30일
여행지 목록: 12시간
키워드 검색: 6시간
상세 정보/이미지: 14일
포토 갤러리: 1일
```

공공데이터 API 호출이 실패하면 만료된 캐시라도 존재할 경우 fallback 데이터로 사용합니다.

주의:

- 첫 요청 또는 캐시 만료 이후에는 외부 API 호출이 발생합니다.
- 서버 프록시가 없으므로 API 키를 완전히 숨길 수는 없습니다.
- `apiCache`는 반올림 좌표 기반 위치명 캐시 등 사용 흔적이 포함될 수 있으므로 로그인 사용자만 읽을 수 있도록 제한하고, 클라이언트 쓰기는 차단합니다.
- 비회원 공개 페이지에서는 Realtime Database 공유 캐시를 호출하지 않고, 메모리/localStorage 캐시 또는 외부 API 직접 호출 fallback을 사용합니다.

---

## 8. Realtime Database 데이터 구조

현재 Realtime Database는 다음 JSON 트리 구조를 사용합니다.

```json
{
  "users": {
    "uid": {
      "email": "user@example.com",
      "name": "User Name",
      "profileImg": "",
      "favoriteRegions": ["11", "26"],
      "created_at": "2026-05-02T00:00:00.000Z",
      "updated_at": "2026-05-02T00:00:00.000Z"
    }
  },
  "boardPosts": {
    "postId": {
      "user_id": "uid",
      "nickname": "User Name",
      "title": "게시글 제목",
      "content": "게시글 내용",
      "tags": [],
      "view_count": 0,
      "likeUserIds": {
        "uid": true
      },
      "created_at": "2026-05-02T00:00:00.000Z",
      "updated_at": "2026-05-02T00:00:00.000Z"
    }
  },
  "boardComments": {
    "commentId": {
      "post_id": "postId",
      "user_id": "uid",
      "nickname": "User Name",
      "body": "댓글 내용",
      "likeUserIds": {},
      "created_at": "2026-05-02T00:00:00.000Z",
      "updated_at": "2026-05-02T00:00:00.000Z"
    }
  },
  "travelComments": {
    "commentId": {
      "content_id": "12345",
      "user_id": "uid",
      "nickname": "User Name",
      "body": "댓글 내용",
      "likeUserIds": {},
      "created_at": "2026-05-02T00:00:00.000Z",
      "updated_at": "2026-05-02T00:00:00.000Z"
    }
  },
  "wishlists": {
    "wishlistId": {
      "user_id": "uid",
      "contentId": "12345",
      "title": "여행지명",
      "imageUrl": "",
      "folder_id": null,
      "created_at": "2026-05-02T00:00:00.000Z"
    }
  },
  "wishlistFolders": {
    "folderId": {
      "user_id": "uid",
      "name": "여행 폴더",
      "start_date": "2026-05-10",
      "end_date": "2026-05-12",
      "created_at": "2026-05-02T00:00:00.000Z",
      "updated_at": "2026-05-02T00:00:00.000Z"
    }
  },
  "wishlistNotes": {
    "noteId": {
      "folder_id": "folderId",
      "user_id": "uid",
      "content": "준비물",
      "type": "CHECKLIST",
      "is_completed": false,
      "created_at": "2026-05-02T00:00:00.000Z"
    }
  },
  "notifications": {
    "notificationId": {
      "user_id": "uid",
      "message": "알림 메시지",
      "content_id": "/board/postId",
      "is_read": false,
      "created_at": "2026-05-02T00:00:00.000Z"
    }
  },
  "apiCache": {
    "tour_xxxxx": {
      "data": {},
      "expiresAt": 1770000000000,
      "updatedAt": 1769900000000
    }
  }
}
```

---

## 9. 보안 규칙

파일:

```text
database.rules.json
```

주요 원칙:

```text
users/{uid}: 본인만 읽기/쓰기
boardPosts: 누구나 읽기, 로그인 사용자만 쓰기
boardComments: 누구나 읽기, 로그인 사용자만 쓰기
travelComments: 누구나 읽기, 로그인 사용자만 쓰기
wishlists: 로그인 사용자만 읽기, 본인 데이터만 쓰기
wishlistFolders: 로그인 사용자만 읽기, 본인 데이터만 쓰기
apiCache: 로그인 사용자만 읽기, 클라이언트 쓰기 차단
wishlistNotes: 로그인 사용자만 읽기, 본인 데이터만 쓰기
notifications: 로그인 사용자만 읽기, 본인 데이터만 쓰기
```

주의:

현재 Realtime Database 특성상 `wishlists`, `wishlistFolders`, `wishlistNotes`, `notifications`는 로그인 사용자 전체에게 read가 열려 있고, 클라이언트에서 `user_id`로 필터링합니다. 소규모 시연용으로는 동작하지만, 실제 운영 서비스라면 사용자별 하위 경로 구조로 재설계하는 것이 더 안전합니다.

예시 개선 구조:

```text
userWishlists/{uid}/{wishlistId}
userFolders/{uid}/{folderId}
userNotifications/{uid}/{notificationId}
```

---

## 10. Firebase 설정 파일

### 10.1 `.firebaserc`

Firebase CLI의 기본 프로젝트를 지정합니다.

```json
{
  "projects": {
    "default": "newagent-9c2a8"
  }
}
```

### 10.2 `firebase.json`

Hosting, Realtime Database Rules, Storage Rules 배포 설정입니다.

```json
{
  "database": {
    "rules": "database.rules.json"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

SPA 라우팅을 위해 모든 경로를 `/index.html`로 rewrite합니다.

---

## 11. 배포 절차

Firebase 배포는 `main` 브랜치 기준으로 진행합니다. 기능 브랜치에서 작업한 경우 PR 또는 셀프 리뷰 후 `main`으로 병합한 뒤 배포합니다.

```bash
git switch main
npm run build
npx firebase-tools deploy --only hosting,database
```

배포 성공 시 확인할 URL:

```text
https://dorigum-codetrip.web.app
```

Realtime Database 데이터 확인:

```text
Firebase Console
-> Build
-> Realtime Database
-> Data
```

---

## 12. 검증 내역

전환 작업 후 다음 명령을 실행했습니다.

```bash
npm run build
npm run lint
npx firebase-tools deploy --only hosting,database
```

결과:

```text
npm run build: 성공
npm run lint: 오류 없음, 기존 React Hook warning 10개 확인
firebase deploy: Hosting + Realtime Database rules 배포 성공
```

배포 완료 메시지:

```text
Hosting URL: https://dorigum-codetrip.web.app
```

---

## 13. Git 브랜치 운영

### 13.1 브랜치 운영 기준

현재 저장소는 개인 단독 작업 기준으로 관리합니다.
Firebase 배포 가능한 기준 브랜치는 `main`입니다.

```text
main
  Firebase 배포 기준 브랜치

feature/...
  위험도가 있는 기능, 실험, 문서 정리 작업을 분리하는 짧은 작업 브랜치
```

### 13.2 작업 커밋 기준

커밋 메시지는 날짜와 태그를 포함해 작성합니다.

```text
yymmdd 태그: 작업한 내용
```

예시:

```text
260729 feat: 날씨 및 위치 API 캐시 적용
```

### 13.3 PR 사용 기준

PR은 필수 절차가 아니며, 다음 상황에서 선택적으로 사용합니다.

```text
변경 범위가 큰 기능 작업
CodeRabbit 리뷰가 필요한 작업
main 병합 전 셀프 리뷰가 필요한 작업
공모전 제출 전 최종 점검
```

일반적인 소규모 수정은 `main`에서 바로 진행할 수 있습니다.

---

## 14. 기능 테스트 체크리스트

배포 후 다음 순서로 테스트합니다.

```text
1. 회원가입
2. 로그인
3. 게시글 작성
4. 게시글 상세 조회
5. 게시글 좋아요
6. 게시글 댓글 작성/수정/삭제
7. 여행지 상세 페이지 댓글 작성
8. 여행지 찜 추가/삭제
9. 위시리스트 폴더 생성/수정/삭제
10. 폴더 노트/체크리스트 생성
11. 알림 생성/읽음/삭제
12. 설정 페이지에서 관심 지역 저장
13. Firebase 콘솔 Realtime Database에서 데이터 생성 확인
```

---

## 15. 현재 한계와 주의사항

### 15.1 서버 캐시 제거

Express 서버를 제거하면서 기존 서버 메모리 캐시도 사라졌습니다.

영향:

```text
공공데이터 API 호출이 브라우저에서 직접 발생
API 호출량 증가 가능
429 Too Many Requests 가능성 증가
CORS 정책 영향 가능
```

소규모 시연에서는 허용 가능한 수준으로 판단했습니다.

### 15.2 Realtime Database 쿼리 구조

Realtime Database는 Firestore보다 복합 쿼리가 약하므로, 2026.07.20 구조 재정비 작업에서 자주 사용하는 조회 흐름은 인덱스 노드로 분리했습니다.

현재 주요 구조:

```text
users/{uid}/wishlists
users/{uid}/wishlistFolders
users/{uid}/wishlistNotes
users/{uid}/notifications
users/{uid}/activities/boardPosts
users/{uid}/activities/boardComments
users/{uid}/activities/travelComments
users/{uid}/activities/likedPosts
boardCommentsByPost/{postId}/{commentId}
travelCommentsByContent/{contentId}/{commentId}
```

남은 한계:

```text
게시글 목록 검색: boardPosts 전체 로드 후 클라이언트 필터
게시글 좋아요순 정렬: boardPosts 전체 로드 후 클라이언트 정렬
기존 데이터가 있는 경우 users/{uid}/activities 및 댓글 인덱스 마이그레이션 필요
```

공모전 제출용 데모 규모에서는 허용 가능한 수준으로 판단했습니다.

### 15.3 프로필·게시글 이미지 저장 방식

Firebase Storage에 이미지를 업로드하고 다운로드 URL을 저장합니다.

장점:

```text
Firebase Auth photoURL 길이 제한 회피
Realtime Database에 base64 이미지 본문 저장 방지
프로필 이미지와 게시글 첨부 이미지 저장 경로 분리
```

주의:

```text
Storage Rules 배포 필요
공개 렌더링을 위해 다운로드 URL은 읽기 가능한 자원으로 취급
이미지 파일 타입과 크기 제한 검증 필요
```

현재 `src/api/storageApi.js`에서 이미지 타입 검증, 1MB 초과 이미지 압축, Storage 업로드, 다운로드 URL 반환을 공통 처리합니다. Storage Rules는 `users/{uid}/profile`, `users/{uid}/board` 경로에 대해 동일 UID의 이미지 쓰기만 허용합니다.

### 15.4 보안 규칙과 알림 처리

현재 구조는 클라이언트 단독 Firebase Web SDK 기반입니다.

타 사용자 알림 fan-out은 클라이언트에서 직접 `users/{otherUid}/notifications`에 쓰지 않도록 비활성화했습니다.

```text
게시글 댓글 알림
여행지 댓글 알림
```

위 기능을 안전하게 구현하려면 다음과 같은 서버성 로직이 필요합니다.

```text
Cloud Functions
또는 Firebase Admin SDK 기반 서버 API
```

---

## 16. 향후 개선 방향

1. 기존 Firebase 데이터가 있는 경우 마이그레이션 스크립트 작성
2. 게시글 목록 검색/정렬용 인덱스 추가 검토
3. 공공데이터, 날씨, 위치명 API 캐시 정책 지속 점검
4. Firebase Storage 또는 압축 이미지 정책 개선
5. Cloud Functions 도입 가능 시 알림 fan-out 재설계
6. Firebase Hosting preview channel 도입
7. Gemini API 호출을 Firebase Functions로 이전
8. Gemini API key를 Functions Secret으로 관리
9. 최종 제출 빌드에서 프론트엔드 `VITE_GEMINI_API_KEY` 제거 확인

Gemini API key가 프론트엔드 번들에 포함된 상태는 최종 제출 배포 차단 조건으로 봅니다. 제출 직전에는 Blaze 전환, Functions endpoint 구성, Functions Secret 등록, AI 코스 생성/저장 회귀 테스트를 완료한 뒤 배포합니다.

---

## 17. 운영 명령어 요약

### 개발 서버 실행

```bash
npm run dev
```

기본 접속:

```text
http://localhost:5180
```

### 빌드

```bash
npm run build
```

### 린트

```bash
npm run lint
```

### Firebase 배포

```bash
npx firebase-tools deploy --only hosting,database
```

Firebase CLI 로그인이 되어 있지 않거나 CLI 사용이 어려운 경우, Realtime Database Rules는 콘솔에서 직접 반영합니다.

```text
Firebase Console
-> Realtime Database
-> Rules
-> database.rules.json 내용 붙여넣기
-> Publish
```

Hosting만 배포할 경우:

```bash
npx firebase-tools deploy --only hosting
```

Rules만 배포할 경우:

```bash
npx firebase-tools deploy --only database
```

---

## 18. 2026.07.20 로컬 테스트 결과

### 테스트 환경

```text
로컬 개발 서버: http://localhost:5180
Firebase Project ID: newagent-9c2a8
Realtime Database Rules: Firebase Console에서 database.rules.json 반영
```

### 정상 확인한 기능

```text
회원가입
로그인
로그아웃
위시리스트 저장
위시리스트 삭제
위시리스트 폴더 생성
폴더 메모 생성
폴더 체크리스트 생성
게시글 목록 조회
게시글 작성
게시글 상세 조회
게시글 삭제
게시글 댓글 작성/수정/삭제
게시글 좋아요/좋아요 취소
MyActivity Board Posts 조회
MyActivity Board Comments 조회
MyActivity Liked Posts 조회
여행지 댓글 작성/수정/삭제
MyActivity Travel Comments 조회
```

### 테스트 중 발견 후 수정한 문제

```text
Firebase 환경변수 누락으로 auth/invalid-api-key 발생
Realtime Database Rules 미반영으로 boardCommentsByPost permission_denied 발생
boardPosts/{postId}/view_count 업데이트 권한 부족으로 게시글 상세 조회 오류 발생
게시글 삭제 시 다른 사용자 댓글 원본 삭제 시도 가능성으로 permission_denied 발생
```

### 조치 결과

```text
.env에 Firebase Web App config 추가
database.rules.json을 Firebase Console Rules에 반영
view_count 별도 쓰기 규칙 추가
likeUserIds/{uid} 본인 쓰기 규칙 추가
게시글 삭제 로직에서 다른 사용자 댓글 원본 삭제 시도 제거
npm run build 성공
npm run lint 성공, error 0개
```

### 작업 브랜치 흐름

```bash
git switch feature/작업명

# 작업
npm run build

git add -A
git commit -m "260729 feat: ..."
git push origin feature/작업명
```

배포가 필요한 경우 `main` 병합 후 Firebase Hosting 배포를 진행합니다.

---

## 19. 결론

Firebase 전환 버전은 CodeTrip을 공모전 제출과 시연에 맞게 운영하기 위한 기준 구조입니다.
현재는 `main` 브랜치를 Firebase 배포 기준으로 두고, 실험성 작업만 `feature/...` 브랜치로 분리하는 방식이 가장 단순하고 안전합니다.

---

## 20. 2026.07.20 최종 배포 결과

### 수행 명령

```bash
npx firebase-tools deploy --only hosting,database
```

### 결과

```text
Deploy complete
database rules syntax valid
database rules released successfully
hosting release complete
```

### 배포 URL

```text
https://dorigum-codetrip.web.app
```

### 배포 범위

```text
Firebase Hosting
Realtime Database Rules
```
