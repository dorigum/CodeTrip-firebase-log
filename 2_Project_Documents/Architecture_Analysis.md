# CodeTrip 프로젝트 상세 내역서

> 작성일: 2026-05-24  
> 대상 브랜치: main  
> 변경 범위: Firebase Auth 복원 안정화, Realtime Database 접근 안정화, 위시리스트 데이터 정규화

---

## 1. 문서 목적

이 문서는 2026-05-24에 반영한 Firebase 인증 복원 대기 및 위시리스트 저장 데이터 정규화 작업을 프로젝트 구조 관점에서 정리합니다.

이번 변경은 화면 UI를 크게 바꾸는 작업이 아니라, Firebase 전환 이후 발생할 수 있는 인증 타이밍 문제와 데이터 필드 불일치 문제를 줄이는 안정화 작업입니다. 특히 새로고침 직후의 `auth=null` 권한 오류 가능성을 줄이고, 여러 화면에서 전달되는 여행지 데이터를 위시리스트 저장 전에 같은 형태로 맞추는 것이 핵심입니다.

---

## 2. 변경 배경

### 2.1 Firebase Auth 복원 타이밍 문제

CodeTrip은 Firebase 전환 이후 브라우저에서 Firebase Auth와 Realtime Database를 직접 사용합니다. 이 구조에서는 다음 두 상태가 동시에 맞아야 합니다.

- 앱 내부 로그인 상태: `localStorage`의 `trip_user`, Zustand `useAuthStore`
- Firebase 서버 인증 상태: Firebase Auth SDK의 `firebaseAuth.currentUser`

새로고침 직후에는 `localStorage` 데이터가 즉시 읽히지만, Firebase Auth SDK가 실제 로그인 세션을 복원하는 데는 짧은 시간이 걸릴 수 있습니다. 이때 앱이 `localStorage`만 보고 로그인된 사용자라고 판단해 Realtime Database 요청을 보내면, Firebase 서버 입장에서는 아직 `auth = null`인 요청으로 보일 수 있습니다.

Realtime Database Rules는 클라이언트의 `localStorage`를 신뢰하지 않고 `auth.uid`를 기준으로 권한을 판단합니다. 따라서 인증 복원 전에 다음 기능들이 먼저 실행되면 권한 오류가 발생할 수 있었습니다.

- 위시리스트 조회 및 저장
- 위시리스트 폴더 조회 및 생성
- 알림 조회
- 게시글 작성, 댓글 작성, 좋아요
- 여행지 댓글 작성, 수정, 삭제
- 관심 지역 조회 및 저장

### 2.2 위시리스트 입력 데이터 불일치 문제

위시리스트 기능은 여러 화면에서 공통으로 사용됩니다.

```text
Explore.jsx
TravelDetail.jsx
Festivals.jsx
WishlistModal.jsx
MyPage.jsx
```

하지만 각 화면이 다루는 여행지 데이터 출처가 다르기 때문에 필드명이 완전히 같지 않을 수 있습니다.

예를 들어 여행지 ID는 `contentid`, `contentId`, `content_id`처럼 전달될 수 있고, 대표 이미지는 `firstimage`, `imageUrl`, `image_url`, `firstImage`처럼 전달될 수 있습니다. 위시리스트 저장 로직이 특정 필드명만 기대하면 다음 문제가 생길 수 있습니다.

- 하트 클릭 후 저장된 데이터에 여행지 ID가 비어 있음
- 같은 여행지인데 중복 판정이 실패함
- 폴더 지정 저장 시 `folder_id`가 누락됨
- MyPage에서 위시리스트 카드 이미지나 제목이 비어 보임

---

## 3. 인증 구조 변경

### 3.1 변경 전 흐름

```text
API 함수 실행
  -> getCurrentUser()
  -> firebaseAuth.currentUser 확인
  -> currentUser가 없으면 localStorage trip_user 사용
  -> Realtime Database 요청 실행
```

이 방식은 앱 내부 상태 복원에는 빠르지만, Firebase Database Rules의 인증 기준과 다를 수 있었습니다. `localStorage` 사용자 정보가 있어도 Firebase Auth 세션이 준비되지 않았다면 Realtime Database 요청은 인증되지 않은 요청으로 처리됩니다.

### 3.2 변경 후 흐름

```text
API 함수 실행
  -> await getCurrentUser()
  -> firebaseAuth.currentUser 확인
  -> currentUser가 없으면 onAuthStateChanged로 Auth 복원 완료 대기
  -> 복원 후에도 Firebase Auth 사용자가 없으면 로그인 필요 오류
  -> authUser.uid 기준으로 Realtime Database 요청 실행
```

`src/api/firebaseHelpers.js`의 `getCurrentUser()`는 비동기 함수로 변경되었습니다. 내부에서 `onAuthStateChanged`를 한 번 구독해 Firebase Auth가 현재 세션을 복원할 시간을 줍니다.

### 3.3 사용자 ID 기준

변경 후 DB 접근에 사용하는 사용자 ID는 `authUser.uid`입니다.

```text
Firebase Auth auth.uid
  == users/{uid}
  == wishlists.user_id
  == wishlistFolders.user_id
  == boardPosts.user_id
  == comments.user_id
  == notifications.user_id
```

이렇게 앱 데이터의 `user_id`와 Realtime Database Rules의 `auth.uid` 기준을 맞춰 권한 판단의 일관성을 높였습니다.

---

## 4. API 적용 범위

### 4.1 `src/api/firebaseHelpers.js`

핵심 변경 파일입니다.

- `onAuthStateChanged` import 추가
- `waitForAuthUser()` 추가
- `getCurrentUser()`를 비동기 함수로 변경
- Firebase Auth 사용자가 없을 때 `로그인이 필요합니다.` 오류 반환
- 반환 사용자 ID를 `authUser.uid` 기준으로 고정
- `localStorage`의 사용자 정보는 이메일, 이름, 프로필 이미지 보조값으로만 사용

### 4.2 `src/api/authApi.js`

다음 기능에서 `await getCurrentUser()`를 사용합니다.

- 프로필 수정
- 관심 지역 조회
- 관심 지역 저장

이로써 사용자 프로필과 관심 지역 데이터가 Firebase Auth 복원 이후에만 DB에 접근하도록 정리했습니다.

### 4.3 `src/api/wishlistApi.js`

다음 위시리스트 관련 기능에서 인증 복원을 기다립니다.

- `getWishlistDetails()`
- `toggleWishlist(contentId, title, imageUrl, folderId)`
- `getFolders()`
- `createFolder(name, startDate, endDate)`
- `deleteFolder(folderId)`
- `moveItem(contentId, folderId)`
- `getFolderNotes(folderId)`
- `createNote(folderId, content, type)`

위시리스트 기능은 로그인 사용자 데이터에 직접 접근하므로, Firebase Auth 사용자 확인을 가장 중요하게 적용했습니다.

### 4.4 `src/api/boardApi.js`

다음 게시판 관련 기능에서 인증 복원을 기다립니다.

- 게시글 작성, 수정, 삭제
- 댓글 작성, 수정, 삭제
- 게시글 좋아요, 댓글 좋아요
- 내 게시글 조회
- 내가 좋아요한 게시글 조회
- 내가 작성한 게시판 댓글 조회
- 내가 작성한 여행지 댓글 조회

공개 조회 기능은 기존처럼 동작하지만, 사용자 쓰기 작업과 내 활동 조회는 인증된 사용자 기준으로 실행됩니다.

### 4.5 `src/api/notificationApi.js`

알림 목록은 사용자별 개인 데이터입니다. `getMyNotifications()` 내부에서 `await getCurrentUser()`를 사용하도록 변경해, 새로고침 직후 알림 조회가 Firebase Auth 복원보다 먼저 실행되는 문제를 줄였습니다.

### 4.6 `src/api/travelCommentApi.js`

다음 여행지 댓글 기능에서 인증 복원을 기다립니다.

- 댓글 좋아요
- 댓글 작성
- 댓글 수정
- 댓글 삭제

댓글 작성 시 같은 여행지를 위시리스트에 담은 다른 사용자에게 알림을 만드는 흐름도 인증된 Firebase 사용자 기준으로 실행됩니다.

---

## 5. 위시리스트 데이터 정규화 구조

### 5.1 정규화 위치

정규화는 `src/store/useWishlistStore.js`에서 담당합니다. API 레이어가 아니라 Zustand store 레벨에서 처리하는 이유는 화면별 입력 데이터가 store로 모이는 구조이기 때문입니다.

```text
화면 컴포넌트
  -> useWishlistStore.toggleWishlist(itemData)
  -> normalizeWishlistItem(itemData)
  -> wishlistApi.toggleWishlist(contentid, title, firstimage, folder_id)
  -> Firebase Realtime Database 저장/삭제
```

### 5.2 정규화 규칙

| 내부 기준 필드 | 허용 입력 필드 | 처리 방식 |
|---|---|---|
| `contentid` | `contentid`, `contentId`, `content_id` | 문자열로 변환해 중복 판정 기준으로 사용 |
| `title` | `title`, `facltNm` | 값이 없으면 `여행지` 사용 |
| `firstimage` | `firstimage`, `imageUrl`, `image_url`, `firstImage` | 값이 없으면 빈 문자열 사용 |
| `folder_id` | `folder_id` | 값이 없으면 `null` 사용 |

### 5.3 잘못된 입력 방어

`contentid`가 비어 있으면 Firebase 요청을 보내지 않고 `false`를 반환합니다.

이 처리는 여행지 ID가 없는 깨진 데이터가 `wishlists` 노드에 저장되는 것을 막습니다. 위시리스트의 중복 판정과 삭제는 여행지 ID를 기준으로 하므로, ID 없는 데이터는 저장하지 않는 편이 안전합니다.

---

## 6. 주요 사용자 흐름

### 6.1 Explore에서 일반 위시리스트 추가

```text
사용자가 Explore 카드 하트 클릭
  -> handleHeartToggle(post)
  -> useWishlistStore.toggleWishlist(post)
  -> normalizeWishlistItem(post)
  -> wishlistApi.toggleWishlist(contentid, title, firstimage, null)
  -> await getCurrentUser()
  -> 기존 wishlists 항목 확인
  -> 없으면 추가, 있으면 삭제
  -> syncWithServer()
```

### 6.2 TravelDetail에서 위시리스트 추가

```text
사용자가 상세 페이지 헤더 하트 클릭
  -> handleWishlistToggle()
  -> useWishlistStore.toggleWishlist(common)
  -> normalizeWishlistItem(common)
  -> Firebase 인증 복원 확인
  -> wishlists 노드 저장 또는 삭제
```

상세 API의 데이터가 Explore 목록 데이터와 완전히 같지 않아도 정규화 단계에서 저장에 필요한 최소 필드를 맞춥니다.

### 6.3 폴더 선택 모달을 통한 저장

```text
사용자가 하트 클릭
  -> WishlistModal 열림
  -> 폴더 선택
  -> travelData를 contentid/title/firstimage/folder_id 형태로 1차 정리
  -> useWishlistStore.toggleWishlist()
  -> normalizeWishlistItem()으로 최종 정규화
  -> Firebase 저장
```

### 6.4 특정 폴더에서 Explore로 이동해 바로 추가

```text
MyPage에서 폴더 선택
  -> EXPLORE_ADD 클릭
  -> /explore로 targetWishlistFolder state 전달
  -> Explore 카드 하트 클릭
  -> itemData에 folder_id 포함
  -> normalizeWishlistItem()이 folder_id 유지
  -> wishlists/{id}.folder_id에 폴더 ID 저장
```

이 흐름은 사용자가 폴더 화면에서 여행지를 추가하려 할 때, 모달을 다시 고르지 않고 해당 폴더로 바로 저장되게 하기 위한 구조입니다.

---

## 7. Realtime Database 권한 관점

이번 변경은 Database Rules 자체를 바꾸지는 않았습니다. 대신 프론트엔드 요청이 Rules의 기대 조건을 만족하도록 인증 준비 순서를 맞췄습니다.

주요 기준은 다음과 같습니다.

```text
users/{uid}
  -> auth.uid === uid

wishlists/{wishlistId}
  -> newData.child('user_id').val() === auth.uid

wishlistFolders/{folderId}
  -> newData.child('user_id').val() === auth.uid

boardPosts, boardComments, travelComments
  -> 작성자 user_id와 auth.uid 기준으로 쓰기 제한

notifications
  -> notification.user_id와 auth.uid 기준으로 사용자별 접근
```

즉, 클라이언트가 `user_id`에 넣는 값과 Firebase Auth의 `auth.uid`가 같아야 정상적으로 쓰기가 허용됩니다. `getCurrentUser()`가 `authUser.uid`를 기준으로 값을 반환하도록 바꾼 이유가 여기에 있습니다.

---

## 8. 검증 및 남은 작업

### 완료한 검증

- `src/api` 및 `src/store` 하위 JavaScript 파일에 대해 Node 문법 검사(`node --check`)를 실행했습니다.
- `getCurrentUser()` 호출부를 검색해 API 레이어에서 `await getCurrentUser()` 형태로 변경되어 있는지 확인했습니다.
- 위시리스트 관련 호출부에서 `contentid`, `contentId`, `content_id`, `firstimage`, `imageUrl`, `image_url`, `firstImage`, `folder_id`가 정규화 규칙에 포함되는지 확인했습니다.

### 아직 실행하지 못한 검증

- 현재 로컬 환경에는 일반 `npm` 실행 파일과 설치된 `node_modules`가 없어 `npm run build`는 실행하지 못했습니다.
- 의존성 설치 후에는 다음 확인이 필요합니다.

```bash
npm install
npm run build
npm run dev
```

### 수동 테스트 권장 항목

- 로그인 상태에서 새로고침 직후 MyPage 위시리스트가 권한 오류 없이 열리는지 확인
- Explore에서 하트 클릭 시 위시리스트 추가/삭제가 정상 동작하는지 확인
- TravelDetail에서 하트 클릭 시 같은 여행지 중복 저장 없이 토글되는지 확인
- MyPage에서 특정 폴더 선택 후 `EXPLORE_ADD`로 이동해 하트를 누르면 해당 폴더에 저장되는지 확인
- 알림 드롭다운이 새로고침 직후에도 권한 오류 없이 조회되는지 확인
- 게시글/댓글/좋아요 작업이 로그인 사용자 기준으로 정상 처리되는지 확인

---
