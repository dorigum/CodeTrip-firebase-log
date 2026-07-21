# 2026.05.03 Firebase 수정 로그

## 작성 범위

이 문서는 2026.05.02부터 2026.05.03 현재까지 `firebase` 브랜치에서 진행한 Firebase 전환, 배포 안정화, 기능 복구, UI 개선, 위시리스트 폴더 연동 작업을 정리합니다.

대상 브랜치: `firebase`  
배포 URL: `https://newagent-9c2a8.web.app`  
Firebase 프로젝트: `newagent-9c2a8`

---

## 2026.05.02 Firebase Realtime Database 전환

### 핵심 변경

기존 Express/MySQL 중심 구조에서 Firebase Hosting, Firebase Authentication, Firebase Realtime Database 기반의 프론트 단독 배포 구조로 전환했습니다.

### 추가 및 수정 파일

- `.firebaserc`
  - 기본 Firebase 프로젝트를 `newagent-9c2a8`로 지정했습니다.

- `firebase.json`
  - Hosting 배포 대상 디렉터리를 `dist`로 설정했습니다.
  - SPA 라우팅을 위해 모든 경로를 `/index.html`로 rewrite하도록 설정했습니다.
  - Realtime Database Rules 파일로 `database.rules.json`을 연결했습니다.

- `database.rules.json`
  - `users`, `boardPosts`, `boardComments`, `travelComments`, `wishlists`, `wishlistFolders`, `wishlistNotes`, `notifications`, `apiCache` 노드별 접근 규칙을 정의했습니다.
  - 사용자 개인 데이터는 `auth.uid` 기준으로 소유자만 읽기/쓰기가 가능하도록 제한했습니다.
  - 게시판과 댓글류 데이터는 공개 읽기를 허용하고, 쓰기는 작성자 인증 기준으로 제한했습니다.
  - 공공데이터 API 캐시는 공개 읽기와 제한된 형식의 쓰기를 허용했습니다.

- `src/firebase.js`
  - Firebase App 초기화 코드를 추가했습니다.
  - `firebaseAuth`와 `realtimeDb` 인스턴스를 export하도록 구성했습니다.

- `package.json`, `package-lock.json`
  - `firebase` 패키지를 추가했습니다.

### API 레이어 전환

- `src/api/authApi.js`
  - 회원가입을 `createUserWithEmailAndPassword` 기반으로 변경했습니다.
  - 로그인을 `signInWithEmailAndPassword` 기반으로 변경했습니다.
  - 비밀번호 재설정을 `sendPasswordResetEmail` 기반으로 변경했습니다.
  - 사용자 프로필 수정과 비밀번호 변경 로직을 Firebase Auth와 Realtime Database 조합으로 변경했습니다.

- `src/api/firebaseHelpers.js`
  - Firebase Auth 현재 사용자 조회 헬퍼를 추가했습니다.
  - Realtime Database snapshot을 배열로 변환하는 공통 함수를 추가했습니다.
  - 날짜, 좋아요 맵, 사용자 저장 데이터 정규화 유틸을 추가했습니다.

- `src/api/boardApi.js`
  - 게시글 CRUD를 Realtime Database `boardPosts` 노드 기반으로 전환했습니다.
  - 댓글과 좋아요 데이터를 Firebase 구조에 맞게 읽고 쓰도록 변경했습니다.

- `src/api/wishlistApi.js`
  - 위시리스트 목록, 폴더, 폴더 메모, 체크리스트 기능을 Realtime Database 기반으로 전환했습니다.
  - `wishlists`, `wishlistFolders`, `wishlistNotes` 노드를 사용하도록 변경했습니다.
  - 기존 MySQL의 `folder_id`, `content_id`, 날짜 필드 구조를 프론트 상태와 호환되도록 정규화했습니다.

- `src/api/travelCommentApi.js`
  - 여행지 댓글과 좋아요를 Realtime Database 기반으로 전환했습니다.
  - 댓글 작성 시 위시리스트에 저장한 사용자에게 알림을 만들 수 있도록 연계했습니다.

- `src/api/notificationApi.js`
  - 알림 목록 조회, 읽음 처리, 삭제 기능을 Realtime Database 기반으로 변경했습니다.

- `src/api/travelApi.js`, `src/api/travelInfoApi.js`
  - 서버 API 의존을 줄이고 공공데이터 API를 프론트에서 직접 호출하는 구조로 변경했습니다.
  - Firebase 배포 환경에서 여행지 탐색과 추천 기능이 동작하도록 API 호출 경로를 정리했습니다.

---

## 2026.05.02 Firebase 배포 초기화 오류 수정

### 문제

Firebase 배포 환경에서 앱 초기화와 인증 상태 복원 과정에서 오류가 발생할 수 있었습니다.

### 수정 내용

- `src/api/axiosInstance.js`
  - Firebase 전환 이후에도 기존 axios 기반 코드가 일부 남아 있을 수 있어 인증 토큰 처리와 오류 처리를 보완했습니다.

- `src/store/useAuthStore.js`
  - Firebase Auth 상태와 로컬 사용자 상태가 어긋나지 않도록 초기화 로직을 보완했습니다.
  - 로그아웃 시 Firebase Auth와 로컬 상태를 함께 정리하도록 수정했습니다.

---

## 2026.05.02 Firebase Auth 가입 및 로그인 오류 처리

### 문제

Firebase Auth 설정, 이메일/비밀번호 로그인 활성화 여부, 중복 이메일, 약한 비밀번호 등에서 사용자에게 명확하지 않은 오류가 발생할 수 있었습니다.

### 수정 내용

- `src/api/authApi.js`
  - Firebase Auth 오류 코드를 사용자 친화적인 한국어 메시지로 변환했습니다.
  - 이메일/비밀번호 로그인 제공자가 비활성화된 경우 안내 메시지를 반환하도록 보완했습니다.

- `src/pages/Login.jsx`
  - 로그인 실패 시 Firebase 오류 메시지가 화면에서 확인되도록 보완했습니다.

- `src/pages/SignUp.jsx`
  - 회원가입 실패 원인을 표시하도록 수정했습니다.
  - 가입 성공 후 사용자 프로필 저장 흐름을 안정화했습니다.

- `src/firebase.js`
  - Auth 초기화와 설정을 Firebase 배포 환경에 맞게 보완했습니다.

---

## 2026.05.02 공공데이터 API 공유 캐시 추가

### 목적

Firebase Hosting은 프론트 정적 배포 방식이므로 기존 서버 캐시를 그대로 사용할 수 없습니다. 공공데이터 API 호출량과 응답 지연을 줄이기 위해 Realtime Database 기반 공유 캐시를 추가했습니다.

### 추가 및 수정 내용

- `src/api/apiCache.js`
  - API 응답을 `apiCache` 노드에 저장하는 공통 캐시 레이어를 추가했습니다.
  - `data`, `expiresAt`, `updatedAt` 구조로 캐시를 저장합니다.
  - 만료 시간이 지나지 않은 데이터는 외부 API를 다시 호출하지 않고 캐시를 재사용합니다.

- `database.rules.json`
  - `apiCache` 노드에 대한 읽기/쓰기 및 데이터 형식 검증 규칙을 추가했습니다.

- `src/api/travelInfoApi.js`
  - 공공데이터 API 호출에 캐시 레이어를 연결했습니다.

- `src/api/travelApi.js`
  - 탐색, 추천, 키워드 검색에서 캐시된 공공데이터 결과를 활용하도록 변경했습니다.

- `documents/Firebase/Project_Firebase_배포.md`
  - Firebase 배포 구조와 캐시 구조 설명을 추가했습니다.

---

## 2026.05.02 추천 및 위시리스트 기능 복구

### 문제

Firebase 전환 이후 기존 서버 API에 의존하던 추천 기능과 위시리스트 상세 표시가 일부 동작하지 않는 문제가 있었습니다.

### 수정 내용

- `src/api/travelApi.js`
  - 날씨 기반 추천과 지역 기반 추천 로직을 Firebase 배포 환경에서 동작하도록 정리했습니다.
  - 선호 지역이 없을 때 기본 지역으로 fallback하도록 보완했습니다.

- `src/api/weatherApi.js`
  - 날씨 API 응답에서 추천 키워드를 안정적으로 생성하도록 수정했습니다.

- `src/api/wishlistApi.js`
  - Realtime Database에 저장된 위시리스트 데이터를 MyPage 카드 렌더링 형식에 맞게 정규화했습니다.
  - `contentid`, `contentId`, `title`, `firstimage`, `folder_id`, `addr1` 형태를 맞췄습니다.

- `src/pages/Home.jsx`
  - 날씨 추천 문구와 추천 결과 표시가 깨지지 않도록 보완했습니다.

- `src/pages/MyPage.jsx`
  - Firebase 위시리스트 데이터 구조에 맞게 목록 표시와 폴더별 필터링을 조정했습니다.

- `src/store/useWishlistStore.js`
  - 위시리스트 초기화, 동기화, 폴더 목록 상태를 Firebase API 결과와 맞게 보완했습니다.

---

## 2026.05.02 선호 지역 날씨 및 Explore 필터 패널 개선

### 수정 내용

- `src/api/travelApi.js`
  - 사용자의 선호 지역을 기반으로 여행지 추천을 만드는 흐름을 정리했습니다.
  - 지역 코드와 날씨 키워드를 추천 로직에 반영하도록 수정했습니다.

- `src/pages/Explore.jsx`
  - Explore 필터 패널의 스크롤과 높이 처리 방식을 조정했습니다.
  - 필터 UI가 메인 화면 흐름에서 어색하게 끊기지 않도록 개선했습니다.

---

## 2026.05.02 슬롯머신 날씨 키워드 표기 수정

### 수정 내용

- `src/api/travelApi.js`
  - 날씨 키워드와 추천 이유 문구가 올바르게 표시되도록 수정했습니다.

- `src/api/weatherApi.js`
  - 날씨 상태에서 한글 라벨과 추천 키워드가 안정적으로 반환되도록 정리했습니다.

- `src/pages/Home.jsx`
  - 슬롯머신 추천 UI에 표시되는 날씨 관련 문구를 보완했습니다.

- `src/pages/Explore.jsx`
  - 필터 영역의 스크롤 처리와 레이아웃을 추가로 조정했습니다.

---

## 2026.05.02 Explore 필터 및 메인 스크롤바 인디케이터 제거

### 수정 내용

- `src/App.css`
  - `.no-scrollbar` 유틸을 추가하고 브라우저별 스크롤바 숨김 처리를 강화했습니다.
  - Firefox, IE/Edge Legacy, WebKit 계열 브라우저에서 스크롤 기능은 유지하면서 시각적 스크롤바를 숨기도록 설정했습니다.

- `src/App.jsx`
  - 메인 스크롤 컨테이너에 `no-scrollbar` 클래스를 적용했습니다.

- `src/pages/Explore.jsx`
  - Explore 필터 패널의 시각적 스크롤바 표시를 제거했습니다.

---

## 2026.05.03 위시리스트 폴더에서 Explore 추가 흐름 개선

### 초기 시도

처음에는 MyPage의 특정 위시리스트 폴더 화면에 `CONTENT ID`, `TITLE`, `IMAGE URL`을 직접 입력하는 `ADD_TO_CURRENT_FOLDER` 폼을 추가했습니다.

사용자 피드백에 따라 수동 입력 방식은 제거하고, 실제 여행지 탐색 흐름에 맞게 Explore 페이지에서 선택하는 방식으로 변경했습니다.

### 최종 수정 내용

- `src/pages/MyPage.jsx`
  - 특정 폴더 또는 `UNCATEGORIZED`를 선택했을 때 상단에 `EXPLORE_ADD` 버튼이 표시되도록 변경했습니다.
  - `EXPLORE_ADD` 버튼 클릭 시 `/explore`로 이동하면서 현재 선택한 폴더 정보를 router state로 전달합니다.
  - 빈 폴더의 `empty_data_node` 영역을 클릭해도 현재 선택 폴더 정보를 유지한 채 Explore로 이동하도록 변경했습니다.
  - 전달 데이터 구조:

```js
{
  targetWishlistFolder: {
    id: selectedFolderId === 'UNCATEGORIZED' ? null : selectedFolderId,
    name: currentFolderName
  }
}
```

- `src/pages/Explore.jsx`
  - `useLocation`, `useNavigate`를 추가했습니다.
  - `location.state.targetWishlistFolder`가 있을 경우 상단에 `ADD_TO_WISHLIST_FOLDER` 안내 배너를 표시합니다.
  - 이 상태에서 여행지 카드의 하트 버튼을 누르면 폴더 선택 모달을 띄우지 않고 전달받은 폴더로 바로 저장합니다.
  - 일반 Explore 진입 시에는 기존처럼 하트 버튼 클릭 시 폴더 선택 모달을 띄웁니다.
  - `BACK_TO_WISHLIST` 버튼으로 MyPage에 돌아갈 수 있도록 했습니다.

### 사용자 확인 흐름

1. `https://newagent-9c2a8.web.app/mypage` 접속
2. 위시리스트 폴더 선택
3. `EXPLORE_ADD` 클릭
4. Explore 페이지 상단 안내 배너 확인
5. 원하는 여행지 카드의 하트 클릭
6. 선택했던 위시리스트 폴더에 여행지가 바로 추가되는지 확인

---

## 2026.05.03 Firebase Hosting 배포

### 수행 명령

```bash
npm run build
firebase deploy --only hosting
```

### 결과

- Vite production build 정상 완료
- Firebase Hosting 배포 정상 완료
- Hosting URL: `https://newagent-9c2a8.web.app`

### 참고

배포 후 브라우저에 이전 화면이 남아 있으면 캐시 영향일 수 있으므로 `Ctrl + F5` 강력 새로고침이 필요합니다.

---

## 2026.07.20 Firebase DB 구조 재정비 1차 작업

### 작업 배경

공모전 제출을 앞두고 Firebase 전환 이후의 Realtime Database 구조를 점검했습니다.

확인 결과 Firebase Hosting, Firebase Authentication, Firebase Realtime Database 기반 전환은 이미 진행되어 있었지만, 사용자 개인 데이터가 전역 노드에 저장되고 있었습니다.

기존 개인 데이터 노드:

```text
wishlists
wishlistFolders
wishlistNotes
notifications
```

기존 구조에서는 클라이언트가 전역 노드를 전체 조회한 뒤 `user_id`로 현재 사용자 데이터를 필터링했습니다. 이 방식은 초기 구현에는 단순하지만, 인증된 사용자가 다른 사용자의 위시리스트나 알림 데이터를 읽을 수 있는 여지가 있고, 데이터가 늘어날수록 성능 문제가 발생할 수 있습니다.

따라서 사용자 개인 데이터는 `users/{uid}` 하위로 재배치하고, 공개 데이터와 개인 데이터의 경계를 명확히 하는 방향으로 1차 구조 재정비를 진행했습니다.

### 핵심 변경

사용자 개인 데이터 저장 경로를 다음과 같이 변경했습니다.

```text
wishlists              -> users/{uid}/wishlists
wishlistFolders        -> users/{uid}/wishlistFolders
wishlistNotes          -> users/{uid}/wishlistNotes
notifications          -> users/{uid}/notifications
```

변경 후 기준 데이터 구조:

```text
users/{uid}
  email
  name
  profileImg
  favoriteRegions
  created_at
  updated_at

  wishlists/{wishlistId}
    user_id
    contentId
    title
    imageUrl
    folder_id
    created_at

  wishlistFolders/{folderId}
    user_id
    name
    start_date
    end_date
    created_at
    updated_at

  wishlistNotes/{noteId}
    folder_id
    user_id
    content
    type
    is_completed
    created_at

  notifications/{notificationId}
    user_id
    message
    content_id
    is_read
    created_at
```

이번 작업에서는 사용자 개인 데이터 구조를 우선 정리했고, 다음 공개 데이터 노드는 기존 구조를 유지했습니다.

```text
boardPosts
boardComments
travelComments
apiCache
```

공개 데이터의 조회 최적화와 인덱스 구조는 후속 작업에서 별도로 정리할 예정입니다.

### 수정 파일

- `src/api/wishlistApi.js`
  - 위시리스트, 위시리스트 폴더, 폴더 메모/체크리스트 API가 `users/{uid}` 하위 경로를 사용하도록 변경했습니다.
  - 사용자별 경로를 일관되게 만들기 위해 `userPath(uid, child)` 헬퍼를 추가했습니다.
  - 기존처럼 전역 `wishlists`, `wishlistFolders`, `wishlistNotes`를 조회한 뒤 `user_id`로 필터링하지 않고, 현재 사용자 하위 데이터만 직접 조회하도록 수정했습니다.
  - 폴더 삭제 시 현재 사용자 하위의 폴더, 연결된 위시리스트 항목의 `folder_id`, 폴더 메모를 함께 정리하도록 경로를 조정했습니다.

- `src/api/notificationApi.js`
  - 알림 조회, 읽음 처리, 단일 삭제, 읽은 알림 삭제 기능이 `users/{uid}/notifications` 경로를 사용하도록 변경했습니다.
  - 기존 전역 `notifications` 전체 조회 후 `user_id` 필터링 방식을 제거했습니다.

- `src/api/boardApi.js`
  - 게시글 댓글 작성 시 타 사용자 알림을 직접 생성하는 fan-out 로직을 기본 비활성화했습니다.
  - 임시 안전장치로 `VITE_ENABLE_NOTIFICATION_FANOUT === 'true'` 조건을 추가했습니다.
  - 타 사용자 알림 생성은 클라이언트 직접 쓰기보다 Cloud Functions 또는 Firebase Admin SDK 기반 서버성 로직으로 처리하는 방향이 더 안전하다고 판단했습니다.

- `database.rules.json`
  - 사용자 개인 데이터 Rules를 `users/{uid}` 기준으로 재작성했습니다.
  - `users/{uid}` 하위 데이터는 인증된 본인만 읽고 쓸 수 있도록 제한했습니다.
  - `wishlists`, `wishlistFolders`, `wishlistNotes`, `notifications` 하위 노드에 최소 필수 필드 검증을 추가했습니다.
  - 각 개인 데이터의 `user_id`가 현재 `$uid`와 일치해야 유효하도록 제한했습니다.
  - `boardPosts`, `boardComments`, `travelComments`, `apiCache` 규칙은 이번 1차 작업에서 기존 방향을 유지했습니다.

### Rules 변경 요약

사용자 개인 데이터 접근 기준:

```json
".read": "auth != null && auth.uid === $uid"
".write": "auth != null && auth.uid === $uid"
```

검증 대상 필드:

```text
users/{uid}/wishlists
  user_id
  contentId
  title
  created_at

users/{uid}/wishlistFolders
  user_id
  name
  created_at
  updated_at

users/{uid}/wishlistNotes
  folder_id
  user_id
  content
  type
  is_completed
  created_at

users/{uid}/notifications
  user_id
  message
  is_read
  created_at
```

### 보류한 내용

#### 타 사용자 알림 fan-out

댓글 작성 시 게시글 작성자나 해당 여행지를 위시리스트에 담은 사용자에게 알림을 생성하는 기능은 이번 단계에서 완전히 확장하지 않았습니다.

보류 이유:

- 클라이언트가 `users/{otherUid}/notifications`에 직접 쓰도록 허용하면 보안상 위험할 수 있습니다.
- Rules에서 타 사용자 알림 쓰기 예외를 열면 검증 조건이 복잡해집니다.
- 공모전 제출용이라도 보안상 애매한 구조를 남기는 것보다, 서버성 로직으로 분리하는 편이 안정적입니다.

권장 후속 방식:

```text
Cloud Functions
또는 Firebase Admin SDK 기반 서버 API
```

#### 기존 데이터 마이그레이션

이번 작업은 코드와 Rules 구조 변경 중심으로 진행했습니다.

이미 Firebase Realtime Database에 기존 전역 노드 데이터가 들어 있다면, 실제 배포 전 별도 마이그레이션이 필요합니다.

마이그레이션 대상:

```text
wishlists              -> users/{uid}/wishlists
wishlistFolders        -> users/{uid}/wishlistFolders
wishlistNotes          -> users/{uid}/wishlistNotes
notifications          -> users/{uid}/notifications
```

### 검증 결과

#### 의존성 설치

처음 빌드 실행 시 `vite` 명령을 찾지 못했습니다.

원인:

```text
node_modules 미설치
```

조치:

```bash
npm ci
```

결과:

```text
added 388 packages
audited 389 packages
```

보안 경고:

```text
12 vulnerabilities
1 low
1 moderate
7 high
3 critical
```

이번 작업에서는 DB 구조 변경 검증을 우선했으며, 의존성 취약점 정리는 별도 후속 작업으로 남깁니다.

#### 빌드 검증

수행 명령:

```bash
npm run build
```

결과:

```text
✓ 423 modules transformed.
✓ built in 12.02s
```

빌드는 정상 완료되었습니다.

빌드 경고:

```text
Some chunks are larger than 500 kB after minification.
```

이는 번들 크기 경고이며, 이번 DB 구조 변경으로 인한 빌드 실패는 아닙니다.

#### 린트 검증

수행 명령:

```bash
npm run lint
```

최종 결과:

```text
0 errors
12 warnings
```

초기에는 `boardApi.js`의 임시 `false &&` 조건 때문에 린트 오류가 발생했으나, 환경변수 조건으로 변경해 오류를 제거했습니다.

남은 warning은 기존 React Hook 관련 경고입니다.

주요 warning 유형:

```text
react-hooks/set-state-in-effect
react-hooks/exhaustive-deps
```

이번 DB 구조 재정비와 직접 관련된 오류는 없습니다.

### 남은 리스크

- 실제 Firebase Realtime Database에 기존 전역 개인 데이터가 존재한다면 새 코드에서는 해당 데이터를 읽지 못합니다.
- 배포 전 기존 데이터 백업과 `users/{uid}` 하위 경로로의 마이그레이션이 필요할 수 있습니다.
- 타 사용자 알림 생성 기능은 서버성 처리 전까지 제한됩니다.
- `boardPosts`, `boardComments`, `travelComments`는 아직 전역 조회 구조를 사용하므로, 데이터가 늘어나면 조회 최적화가 필요합니다.

### 다음 작업 권장 순서

1. 공개 데이터와 개인 데이터 경계 정리
   - `boardPosts`
   - `boardComments`
   - `travelComments`

2. 조회 패턴 기반 인덱스 구조 추가
   - `boardCommentsByPost/{postId}/{commentId}`
   - `travelCommentsByContent/{contentId}/{commentId}`
   - `userActivities/{uid}/...`

3. 알림 생성 방식 재설계
   - Cloud Functions 또는 Firebase Admin SDK 기반 서버 API 사용
   - 클라이언트가 타 사용자 알림에 직접 쓰지 않도록 정리

4. 최종 Rules 정리 및 제출 전 점검
   - `.indexOn` 추가
   - 불필요한 전역 읽기 제거
   - Firebase Rules 배포 전 검증
   - Hosting 배포 전 체크리스트 작성

### 결과

Firebase Realtime Database의 사용자 개인 데이터 구조를 공모전 제출에 더 적합한 형태로 1차 재정비했습니다.

핵심 결과:

```text
개인 데이터 users/{uid} 하위 이동
Realtime Database Rules 재작성
위시리스트/알림 API 경로 수정
npm run build 성공
npm run lint 성공, error 0개
```

---

## 2026.07.20 Firebase 공개 데이터와 개인 활동 경계 정리 2차 작업

### 작업 배경

1차 작업에서 위시리스트, 폴더, 메모, 알림 같은 사용자 개인 데이터를 `users/{uid}` 하위로 이동했습니다.

이후 2차 작업에서는 게시판과 여행지 댓글처럼 공개 읽기가 필요한 데이터와, 마이페이지에서 사용하는 개인 활동 데이터를 분리하는 작업을 진행했습니다.

기존 `MyActivity` 화면은 다음 공개 노드를 전체 조회한 뒤 현재 사용자 기준으로 필터링했습니다.

```text
boardPosts
boardComments
travelComments
```

이 방식은 데이터가 적은 데모 단계에서는 동작하지만, 다음 문제가 있습니다.

- 내 활동 조회를 위해 공개 데이터 전체를 읽어야 합니다.
- 사용자 개인 활동과 공개 콘텐츠의 경계가 흐려집니다.
- 데이터가 늘어날수록 마이페이지 진입 비용이 커집니다.

따라서 공개 데이터는 기존 공개 노드에 유지하되, 개인 활동 조회용 인덱스를 `users/{uid}/activities` 하위에 추가했습니다.

### 핵심 변경

개인 활동 인덱스 구조를 추가했습니다.

```text
users/{uid}/activities
  boardPosts/{postId}
    post_id
    title
    created_at
    updated_at

  boardComments/{commentId}
    comment_id
    post_id
    post_title
    created_at

  travelComments/{commentId}
    comment_id
    content_id
    created_at

  likedPosts/{postId}
    post_id
    created_at
```

공개 콘텐츠 데이터는 기존처럼 공개 노드에 유지했습니다.

```text
boardPosts
boardComments
travelComments
```

즉, 콘텐츠 원본은 공개 노드에 두고, 마이페이지에서 필요한 "내가 작성한 것 / 내가 좋아요한 것" 목록만 사용자 하위 인덱스로 관리하는 구조입니다.

### 수정 파일

- `src/api/boardApi.js`
  - 게시글 작성 시 `boardPosts/{postId}`와 `users/{uid}/activities/boardPosts/{postId}`를 함께 생성하도록 변경했습니다.
  - 게시글 수정 시 활동 인덱스의 제목과 수정일도 함께 갱신하도록 변경했습니다.
  - 게시글 삭제 시 공개 게시글, 작성자 활동 인덱스, 작성자의 좋아요 인덱스를 함께 제거하도록 변경했습니다.
  - 게시글 삭제 과정에서 본인이 작성한 댓글 활동 인덱스도 함께 정리하도록 보강했습니다.
  - 게시판 댓글 작성 시 `boardComments/{commentId}`와 `users/{uid}/activities/boardComments/{commentId}`를 함께 생성하도록 변경했습니다.
  - 게시판 댓글 삭제 시 공개 댓글과 개인 활동 인덱스를 함께 제거하도록 변경했습니다.
  - 게시글 좋아요 토글 시 `users/{uid}/activities/likedPosts/{postId}`를 생성하거나 제거하도록 변경했습니다.
  - `getMyBoardPosts`, `getMyBoardComments`, `getMyTravelComments`, `getMyLikedPosts`가 전역 데이터를 필터링하지 않고 `users/{uid}/activities` 인덱스를 기준으로 조회하도록 변경했습니다.
  - 비용 문제로 Cloud Functions를 사용하지 않기로 했기 때문에, 타 사용자 알림 fan-out 코드를 제거했습니다.

- `src/api/travelCommentApi.js`
  - 여행지 댓글 작성 시 `travelComments/{commentId}`와 `users/{uid}/activities/travelComments/{commentId}`를 함께 생성하도록 변경했습니다.
  - 여행지 댓글 삭제 시 공개 댓글과 개인 활동 인덱스를 함께 제거하도록 변경했습니다.
  - 1차 작업에서 임시로 남아 있던 타 사용자 알림 fan-out 더미 로직을 제거했습니다.

- `database.rules.json`
  - `users/{uid}/activities` 하위 규칙을 추가했습니다.
  - `boardPosts`, `boardComments`, `travelComments`, `likedPosts` 활동 인덱스별 필수 필드를 검증하도록 추가했습니다.

### 조회 흐름 변경

#### 기존 MyActivity 조회 흐름

```text
MyActivity
  -> boardPosts 전체 조회
  -> boardComments 전체 조회
  -> travelComments 전체 조회
  -> 현재 user_id 기준 필터링
```

#### 변경 후 MyActivity 조회 흐름

```text
MyActivity
  -> users/{uid}/activities/boardPosts 조회
  -> 필요한 boardPosts/{postId}만 조회

  -> users/{uid}/activities/boardComments 조회
  -> 필요한 boardComments/{commentId}만 조회

  -> users/{uid}/activities/travelComments 조회
  -> 필요한 travelComments/{commentId}만 조회

  -> users/{uid}/activities/likedPosts 조회
  -> 필요한 boardPosts/{postId}만 조회
```

이 구조로 변경하면서 마이페이지의 개인 활동 조회가 공개 데이터 전체 스캔에 덜 의존하게 되었습니다.

### Rules 변경 요약

`users/{uid}`는 1차 작업과 동일하게 본인만 읽고 쓸 수 있습니다.

```json
".read": "auth != null && auth.uid === $uid"
".write": "auth != null && auth.uid === $uid"
```

이번 작업에서 추가한 활동 인덱스 검증:

```text
users/{uid}/activities/boardPosts/{postId}
  post_id
  title
  created_at

users/{uid}/activities/boardComments/{commentId}
  comment_id
  post_id
  created_at

users/{uid}/activities/travelComments/{commentId}
  comment_id
  content_id
  created_at

users/{uid}/activities/likedPosts/{postId}
  post_id
  created_at
```

각 인덱스는 경로의 ID와 데이터 내부 ID가 일치해야 유효하도록 제한했습니다.

### 보류한 내용

#### 타 사용자 활동 인덱스 정리

클라이언트 권한만 사용하는 현재 구조에서는 한 사용자가 게시글을 삭제할 때, 해당 게시글에 댓글을 작성한 다른 사용자의 `users/{otherUid}/activities/boardComments` 인덱스를 직접 지울 수 없습니다.

이번 작업에서는 본인 활동 인덱스 정리에 집중했고, 다른 사용자 하위 데이터 정리는 서버성 로직이 필요한 영역으로 남겼습니다.

다만 조회 시 공개 원본 댓글이나 게시글이 삭제되어 있으면 해당 항목은 화면에 표시하지 않도록 구성되어 있어, 오래된 인덱스가 남아도 사용자 화면에 깨진 항목이 바로 노출되지는 않습니다.

#### 기존 데이터 마이그레이션

이미 작성되어 있던 게시글, 댓글, 좋아요는 새 `users/{uid}/activities` 인덱스가 없을 수 있습니다.

따라서 실제 Firebase DB에 기존 데이터가 있다면 제출 전 다음 마이그레이션이 필요합니다.

```text
boardPosts에서 user_id 기준으로 users/{uid}/activities/boardPosts 생성
boardComments에서 user_id 기준으로 users/{uid}/activities/boardComments 생성
travelComments에서 user_id 기준으로 users/{uid}/activities/travelComments 생성
boardPosts.likeUserIds 기준으로 users/{uid}/activities/likedPosts 생성
```

### 검증 결과

#### 빌드 검증

수행 명령:

```bash
npm run build
```

결과:

```text
✓ 423 modules transformed.
✓ built in 13.20s
```

빌드는 정상 완료되었습니다.

빌드 경고:

```text
Some chunks are larger than 500 kB after minification.
```

이는 기존과 동일한 번들 크기 경고입니다.

#### 린트 검증

수행 명령:

```bash
npm run lint
```

최종 결과:

```text
0 errors
12 warnings
```

남은 warning은 기존 React Hook 관련 경고이며, 이번 DB 구조 변경으로 인한 lint error는 없습니다.

### 남은 리스크

- 기존 Firebase 데이터에는 `users/{uid}/activities` 인덱스가 없을 수 있으므로 마이그레이션이 필요합니다.
- 클라이언트 단독 구조에서는 다른 사용자의 활동 인덱스를 정리할 수 없습니다.
- 게시글별 댓글 조회와 여행지별 댓글 조회는 아직 `boardComments`, `travelComments` 전체 조회 후 필터링 구조가 남아 있습니다.
- 이 부분은 다음 단계인 조회 패턴 기반 인덱스 구조 추가 작업에서 정리해야 합니다.

### 다음 작업 권장 순서

1. 게시글별 댓글 인덱스 추가
   - `boardCommentsByPost/{postId}/{commentId}`

2. 여행지별 댓글 인덱스 추가
   - `travelCommentsByContent/{contentId}/{commentId}`

3. 댓글 조회 API 전환
   - `getBoardComments(postId)`
   - `getTravelComments(contentId)`

4. Rules에 `.indexOn` 또는 인덱스 경로 검증 추가

5. 기존 데이터 마이그레이션 스크립트 작성 여부 결정

### 결과

공개 콘텐츠와 개인 활동 데이터를 분리하는 2차 구조 재정비를 완료했습니다.

핵심 결과:

```text
users/{uid}/activities 인덱스 추가
MyActivity 조회 API를 개인 활동 인덱스 기준으로 전환
게시글/댓글/좋아요 생성 및 삭제 시 활동 인덱스 동기화
타 사용자 알림 fan-out 코드 제거
Realtime Database Rules에 activities 검증 추가
npm run build 성공
npm run lint 성공, error 0개
```

---

## 2026.07.20 댓글 조회 인덱스 구조 추가 3차 작업

### 작업 배경

2차 작업에서 `MyActivity` 화면의 개인 활동 조회를 `users/{uid}/activities` 인덱스 기준으로 전환했습니다.

이후 남아 있던 주요 전역 조회 지점은 게시글 상세와 여행지 상세의 댓글 조회였습니다.

기존 댓글 조회 흐름:

```text
getBoardComments(postId)
  -> boardComments 전체 조회
  -> post_id 기준 필터링

getTravelComments(contentId)
  -> travelComments 전체 조회
  -> content_id 기준 필터링
```

이 방식은 댓글 수가 적을 때는 문제가 없지만, 댓글 데이터가 늘어나면 상세 페이지 진입마다 전체 댓글 노드를 읽게 됩니다.

따라서 댓글 원본 데이터는 기존 전역 노드에 유지하되, 조회 패턴에 맞는 인덱스 노드를 추가했습니다.

### 핵심 변경

댓글 원본 노드는 유지했습니다.

```text
boardComments/{commentId}
travelComments/{commentId}
```

조회용 인덱스 노드를 추가했습니다.

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

이제 상세 페이지 댓글 조회는 전체 댓글 노드를 훑지 않고, 해당 게시글 또는 여행지에 연결된 댓글 ID 목록만 먼저 읽은 뒤 필요한 댓글 원본만 가져옵니다.

### 수정 파일

- `src/api/boardApi.js`
  - `boardCommentsByPost/{postId}/{commentId}` 경로를 만드는 `boardCommentIndexPath` 헬퍼를 추가했습니다.
  - 게시판 댓글 작성 시 `boardComments/{commentId}`, `boardCommentsByPost/{postId}/{commentId}`, `users/{uid}/activities/boardComments/{commentId}`를 함께 생성하도록 변경했습니다.
  - 게시판 댓글 삭제 시 댓글 원본, 게시글별 댓글 인덱스, 개인 활동 인덱스를 함께 삭제하도록 변경했습니다.
  - 게시글 삭제 시 `boardCommentsByPost/{postId}` 인덱스를 기준으로 연결 댓글을 찾아 삭제하도록 변경했습니다.
  - 게시글 목록의 댓글 수 계산도 `boardCommentsByPost` 인덱스 기준으로 변경했습니다.
  - 기존 `boardComments` 전체 조회 기반의 댓글 필터링 흐름을 제거했습니다.

- `src/api/travelCommentApi.js`
  - `travelCommentsByContent/{contentId}/{commentId}` 경로를 만드는 `travelCommentIndexPath` 헬퍼를 추가했습니다.
  - 여행지 댓글 조회가 `travelCommentsByContent/{contentId}` 인덱스를 기준으로 필요한 댓글만 가져오도록 변경했습니다.
  - 여행지 댓글 작성 시 댓글 원본, 여행지별 댓글 인덱스, 개인 활동 인덱스를 함께 생성하도록 변경했습니다.
  - 여행지 댓글 삭제 시 댓글 원본, 여행지별 댓글 인덱스, 개인 활동 인덱스를 함께 삭제하도록 변경했습니다.
  - 기존 `travelComments` 전체 조회 기반의 댓글 필터링 흐름을 제거했습니다.

- `database.rules.json`
  - `boardCommentsByPost` 노드 규칙을 추가했습니다.
  - `travelCommentsByContent` 노드 규칙을 추가했습니다.
  - 인덱스 데이터의 `comment_id`가 경로의 `$commentId`와 일치하도록 검증했습니다.
  - 인덱스 쓰기는 인증된 사용자 기준으로 제한했습니다.

### 조회 흐름 변경

#### 기존 게시글 댓글 조회

```text
BoardDetail
  -> boardComments 전체 조회
  -> post_id === 현재 게시글 ID 필터링
```

#### 변경 후 게시글 댓글 조회

```text
BoardDetail
  -> boardCommentsByPost/{postId} 조회
  -> 연결된 commentId 목록 확인
  -> boardComments/{commentId}만 조회
```

#### 기존 여행지 댓글 조회

```text
TravelDetail
  -> travelComments 전체 조회
  -> content_id === 현재 여행지 ID 필터링
```

#### 변경 후 여행지 댓글 조회

```text
TravelDetail
  -> travelCommentsByContent/{contentId} 조회
  -> 연결된 commentId 목록 확인
  -> travelComments/{commentId}만 조회
```

### Rules 변경 요약

게시글별 댓글 인덱스:

```text
boardCommentsByPost/{postId}/{commentId}
  comment_id
  user_id
  created_at
```

여행지별 댓글 인덱스:

```text
travelCommentsByContent/{contentId}/{commentId}
  comment_id
  user_id
  created_at
```

검증 조건:

```text
comment_id가 경로의 commentId와 일치해야 함
인증된 사용자만 작성 가능
기존 데이터 수정/삭제는 작성자 user_id 기준으로 제한
```

### 보류한 내용

#### 기존 댓글 데이터 인덱스 마이그레이션

실제 Firebase DB에 기존 댓글 데이터가 없다면 별도 작업은 필요 없습니다.

기존 댓글 데이터가 있다면 다음 인덱스 생성이 필요합니다.

```text
boardComments/{commentId}.post_id 기준
  -> boardCommentsByPost/{postId}/{commentId}

travelComments/{commentId}.content_id 기준
  -> travelCommentsByContent/{contentId}/{commentId}
```

현재 사용자가 확인한 상황상 Firebase 전환 이후 실제 배포 데이터는 거의 없을 것으로 보이므로, 우선 마이그레이션 없이 새 구조 기준으로 진행합니다.

#### 다른 사용자 활동 인덱스 정리

게시글 삭제 시 해당 게시글에 달린 다른 사용자의 `users/{otherUid}/activities/boardComments` 인덱스를 클라이언트에서 직접 삭제할 수는 없습니다.

현재 구조에서는 원본 댓글이 삭제되면 조회 시 존재하지 않는 댓글은 화면에 표시하지 않도록 처리합니다.

이 부분까지 완전 정리하려면 서버성 로직이 필요하지만, 비용을 발생시키는 Cloud Functions는 현재 도입하지 않기로 했습니다.

### 검증 결과

#### 빌드 검증

수행 명령:

```bash
npm run build
```

결과:

```text
✓ 423 modules transformed.
✓ built in 10.36s
```

빌드는 정상 완료되었습니다.

빌드 경고:

```text
Some chunks are larger than 500 kB after minification.
```

이는 기존과 동일한 번들 크기 경고입니다.

#### 린트 검증

수행 명령:

```bash
npm run lint
```

최종 결과:

```text
0 errors
12 warnings
```

남은 warning은 기존 React Hook 관련 경고이며, 이번 댓글 인덱스 구조 변경으로 인한 lint error는 없습니다.

### 남은 리스크

- 기존 Firebase DB에 댓글 데이터가 있다면 새 인덱스가 없어서 기존 댓글이 상세 화면에 표시되지 않을 수 있습니다.
- 기존 데이터가 있다면 댓글 인덱스 마이그레이션이 필요합니다.
- 클라이언트 단독 구조에서는 다른 사용자 하위 활동 인덱스까지 완전히 정리하기 어렵습니다.
- 게시글 목록 자체는 아직 `boardPosts` 전체 조회 기반입니다. 공모전 데모 규모에서는 허용 가능하지만, 데이터가 많아지면 페이지네이션/정렬 인덱스가 필요합니다.

### 결과

댓글 상세 조회용 인덱스 구조를 추가해 공개 댓글 전체 스캔 의존을 줄였습니다.

핵심 결과:

```text
boardCommentsByPost 인덱스 추가
travelCommentsByContent 인덱스 추가
게시글 댓글 조회를 인덱스 기준으로 전환
여행지 댓글 조회를 인덱스 기준으로 전환
게시글 목록 댓글 수 계산을 boardCommentsByPost 기준으로 전환
Realtime Database Rules에 댓글 인덱스 검증 추가
npm run build 성공
npm run lint 성공, error 0개
```

---

## 2026.07.20 게시글 상세/삭제 권한 오류 수정

### 문제

Realtime Database Rules를 콘솔에 반영한 뒤 게시판 기능 테스트 중 다음 문제가 확인되었습니다.

```text
기존 게시글 상세 진입 시 permission_denied 발생
내 게시글 삭제 시 permission_denied 발생
```

콘솔 로그상 주요 실패 지점은 다음과 같았습니다.

```text
update at /boardPosts/{postId} failed: permission_denied
```

### 원인

게시글 상세 진입 시 `getBoardPost` 함수가 게시글 조회 후 `view_count`를 1 증가시키고 있습니다.

```text
boardPosts/{postId}/view_count
```

하지만 기존 Rules는 `boardPosts/{postId}` 쓰기를 게시글 작성자 중심으로 제한하고 있어, 작성자가 아닌 사용자가 게시글을 상세 조회할 때 발생하는 조회수 증가 업데이트도 차단되었습니다.

또한 게시글 삭제 시 댓글 원본과 댓글 인덱스를 함께 정리하려는 과정에서, 클라이언트 권한만으로 다른 사용자가 작성한 댓글 원본까지 삭제하기 어려운 구조적 제한이 있었습니다.

### 수정 내용

- `database.rules.json`
  - `boardPosts/{postId}/view_count`에 별도 쓰기 규칙을 추가했습니다.
  - 인증된 사용자가 숫자 형태의 조회수를 기존 값 이상으로 갱신할 수 있도록 허용했습니다.
  - `boardPosts/{postId}/likeUserIds/{uid}`는 해당 사용자 본인만 쓰도록 별도 규칙을 추가했습니다.
  - `boardCommentsByPost/{postId}` 전체 삭제는 해당 게시글 작성자만 가능하도록 규칙을 추가했습니다.

- `src/api/boardApi.js`
  - 게시글 삭제 시 다른 사용자의 댓글 원본까지 직접 삭제하려는 처리를 제거했습니다.
  - 삭제 대상은 게시글 원본, 게시글별 댓글 인덱스, 작성자 본인의 활동 인덱스로 정리했습니다.
  - 클라이언트 단독 구조에서 다른 사용자의 개인 활동 인덱스를 직접 삭제하지 않는 방향으로 조정했습니다.

### 수정 후 동작 기준

게시글 상세 조회:

```text
boardPosts/{postId} 읽기
boardPosts/{postId}/view_count 증가
boardCommentsByPost/{postId} 기준 댓글 조회
```

게시글 삭제:

```text
boardPosts/{postId} 삭제
boardCommentsByPost/{postId} 삭제
users/{uid}/activities/boardPosts/{postId} 삭제
users/{uid}/activities/likedPosts/{postId} 삭제
```

댓글 원본은 게시글 삭제 시 일괄 삭제하지 않습니다. 게시글별 댓글 인덱스가 삭제되면 상세 화면에서는 더 이상 연결 댓글로 조회되지 않습니다.

### 검증 결과

수행 명령:

```bash
npm run build
npm run lint
```

결과:

```text
npm run build 성공
npm run lint 성공
lint error 0개
기존 React Hook warning 12개 유지
```

### 추가 조치 필요

이 수정은 로컬 `database.rules.json`에 반영된 상태입니다.

Firebase 콘솔의 Realtime Database Rules에도 동일 내용을 다시 붙여넣고 `Publish` 해야 실제 테스트 환경에 적용됩니다.

---

## 2026.07.20 로컬 기능 테스트 결과

### 테스트 환경

```text
로컬 개발 서버: http://localhost:5180
Firebase 프로젝트: newagent-9c2a8
Realtime Database Rules: Firebase Console에서 최신 database.rules.json 반영
테스트 계정: Firebase Authentication 로그인 사용자
```

### 사전 조치

로컬 테스트를 위해 루트 `.env` 파일에 Firebase Web App config와 공공데이터 API 키를 설정했습니다.

Firebase 환경변수 누락 시 다음 오류가 발생했습니다.

```text
Firebase: Error (auth/invalid-api-key)
```

`.env` 수정 후 Vite 개발 서버를 재시작해 Firebase 초기화 오류를 해소했습니다.

Realtime Database Rules가 원격 Firebase 프로젝트에 반영되지 않았을 때 다음 오류가 발생했습니다.

```text
PERMISSION_DENIED: Permission denied
```

Firebase Console의 Realtime Database Rules 탭에서 로컬 `database.rules.json` 내용을 붙여넣고 `Publish`하여 테스트 환경과 로컬 코드의 Rules 버전을 맞췄습니다.

### 정상 확인한 기능

다음 기능이 로컬 개발 서버에서 정상 동작하는 것을 확인했습니다.

```text
회원가입
로그인
로그아웃
위시리스트 저장
위시리스트 삭제
위시리스트 폴더 생성
체크리스트 생성
메모 생성
게시글 목록 조회
게시글 작성
게시글 상세 조회
게시글 삭제
게시글 댓글 작성
게시글 댓글 수정
게시글 댓글 삭제
게시글 좋아요
게시글 좋아요 취소
MyActivity Board Posts 조회
MyActivity Board Comments 조회
MyActivity Liked Posts 조회
여행지 댓글 작성
여행지 댓글 수정
여행지 댓글 삭제
MyActivity Travel Comments 조회
```

### Firebase 데이터 생성 확인 대상

테스트 과정에서 다음 구조가 생성 또는 갱신되는 것을 확인 대상으로 삼았습니다.

```text
users/{uid}/wishlists
users/{uid}/wishlistFolders
users/{uid}/wishlistNotes
users/{uid}/activities/boardPosts
users/{uid}/activities/boardComments
users/{uid}/activities/travelComments
users/{uid}/activities/likedPosts
boardPosts
boardComments
boardCommentsByPost
travelComments
travelCommentsByContent
```

### 테스트 중 발견 후 수정한 문제

#### 게시글 상세 조회 권한 오류

문제:

```text
기존 게시글 상세 진입 시 permission_denied 발생
```

원인:

```text
게시글 상세 진입 시 view_count를 증가시키지만,
Rules가 작성자 외 boardPosts 업데이트를 차단함
```

조치:

```text
boardPosts/{postId}/view_count 별도 쓰기 규칙 추가
인증된 사용자가 숫자 값을 기존 값 이상으로 갱신할 수 있도록 허용
```

#### 내 게시글 삭제 권한 오류

문제:

```text
내 게시글 삭제 시 permission_denied 발생 가능
```

원인:

```text
게시글 삭제 시 다른 사용자의 댓글 원본까지 함께 삭제하려는 구조는
클라이언트 단독 권한으로 처리하기 어려움
```

조치:

```text
게시글 삭제 시 boardPosts/{postId} 삭제
boardCommentsByPost/{postId} 삭제
작성자 본인의 users/{uid}/activities/boardPosts 삭제
작성자 본인의 users/{uid}/activities/likedPosts 삭제
다른 사용자의 댓글 원본 삭제 시도 제거
```

### 검증 결과

로컬 기능 테스트 이후 정적 검증을 다시 수행했습니다.

```bash
npm run build
npm run lint
```

결과:

```text
npm run build 성공
npm run lint 성공
lint error 0개
기존 React Hook warning 12개 유지
```

### 남은 주의사항

```text
Firebase CLI 로그인이 없는 환경에서는 Rules를 콘솔에서 직접 Publish해야 함
기존 Firebase DB 데이터가 있다면 users/{uid}/activities 및 댓글 인덱스 마이그레이션 필요
타 사용자 알림 fan-out은 비용 문제로 Cloud Functions를 쓰지 않고 비활성 유지
게시글 삭제 시 다른 사용자의 개인 활동 인덱스는 클라이언트 단독으로 정리하지 않음
```

---

## 2026.07.20 Firebase Hosting 및 Rules 최종 배포

### 수행 명령

Firebase CLI 로그인 후 다음 명령으로 Hosting과 Realtime Database Rules를 함께 배포했습니다.

```bash
npx firebase-tools deploy --only hosting,database
```

### 배포 결과

```text
Deploy complete
database rules syntax valid
database rules released successfully
hosting file upload complete
hosting version finalized
hosting release complete
```

### 배포 URL

```text
https://newagent-9c2a8.web.app
```

### Firebase Console

```text
https://console.firebase.google.com/project/newagent-9c2a8/overview
```

### 참고

배포 후 브라우저에 이전 번들이 남아 있으면 캐시 영향일 수 있으므로 `Ctrl + F5` 강력 새로고침 후 확인합니다.

---

## 2026.07.21 Firebase 제출용 저장소 정리

### 작업 배경

Firebase 전환 이후 프로젝트 실행 기준은 Vite 프론트엔드, Firebase Authentication, Realtime Database, Firebase Hosting입니다.

하지만 저장소에는 기존 AWS EC2, Docker, Express/MySQL 배포 구조에서 사용하던 파일과 스크립트가 일부 남아 있었습니다.

공모전 제출용 저장소의 기준을 명확히 하기 위해 현재 Firebase 배포 구조와 직접 관련 없는 파일을 정리했습니다.

### 문서 파일명 정리

Firebase 문서 파일명을 읽기 쉬운 형태로 변경하고 README 링크를 함께 수정했습니다.

변경 전:

```text
documents/Firebase/Firebase_수정로그.md
documents/Firebase/Firebase_상세내역서.md
```

변경 후:

```text
documents/Firebase/Firebase_수정 로그.md
documents/Firebase/Firebase_상세 내역서.md
```

README의 문서 구조와 문서 링크도 새 파일명 기준으로 수정했습니다.

### 서버 및 기존 배포 파일 정리

Firebase Hosting 기준에서는 별도 Express 서버와 Docker/Nginx 배포 파일을 사용하지 않으므로 다음 항목을 제거했습니다.

```text
server/
Dockerfile.frontend
docker-compose.yml
nginx.conf
```

### 미사용 API 파일 정리

기존 Express API 호출용 보조 파일과 더 이상 참조되지 않는 mock 데이터를 제거했습니다.

```text
src/api/axiosInstance.js
src/api/mockData.js
```

현재 여행지, 축제, 날씨 API 호출은 `axios` 패키지를 계속 사용하므로 `axios` 의존성은 유지했습니다.

### npm script 및 의존성 정리

기존 백엔드 동시 실행 스크립트를 제거했습니다.

제거한 script:

```json
"dev:server": "cd server && npm run dev"
"dev:all": "concurrently --kill-others-on-fail --names \"SERVER,CLIENT\" --prefix-colors \"yellow,cyan\" \"cd server && nodemon index.js\" \"vite\""
```

`concurrently`는 더 이상 필요하지 않아 devDependencies에서 제거하고 `package-lock.json`을 갱신했습니다.

현재 유지 script:

```json
"dev": "vite"
"build": "vite build"
"lint": "eslint ."
"preview": "vite preview"
```

### Vite 프록시 정리

기존 백엔드 서버용 로컬 프록시를 제거했습니다.

제거한 프록시:

```text
/api -> http://localhost:8080
/uploads -> http://localhost:8080
```

공공데이터 API 호출 보조용 `/B551011` 프록시는 유지했습니다.

### GitHub Actions CI 정리

기존 CI에는 `main`, `develop` PR과 backend dependency check가 포함되어 있었습니다.

현재 저장소는 `main` 단독 운영 기준이며 Express 서버를 제거했으므로 다음과 같이 정리했습니다.

```text
pull_request target: main
frontend lint/build job 유지
backend dependency check job 제거
```

### 검증 결과

정리 후 다음 명령으로 검증했습니다.

```bash
npm run lint
npm run build
```

결과:

```text
npm run lint 성공
lint error 0개
기존 React Hook warning 12개 유지

npm run build 성공
기존과 동일하게 일부 chunk size warning 발생
```

### 커밋 및 푸시

문서 파일명 정리와 불필요 파일 정리는 커밋을 분리해서 진행했습니다.

```text
2f074ed 260721 docs: Firebase 문서 파일명 및 README 링크 정리
525bc46 260721 chore: Firebase 기준 불필요한 서버 배포 파일 정리
```

두 커밋 모두 `origin/main`에 푸시했습니다.

---

## 2026.07.21 Gemini AI 여행 코스 생성 1차 구현

### 작업 배경

공모전 제출용 차별화 기능으로 Gemini API 기반 AI 여행 코스 생성 기능을 추가하기로 했습니다.

기존 CodeTrip 기능은 공공데이터 API 기반 여행지 탐색, 날씨 추천, 위시리스트 폴더, 메모, 체크리스트 기능을 제공하고 있습니다.

이번 작업에서는 Gemini가 생성한 여행 코스를 기존 위시리스트 폴더 구조로 저장할 수 있도록 1차 구현을 진행했습니다.

### 설계 문서 추가

Gemini 기능 구현 전 프롬프트, 입력값, 응답 JSON 구조, 저장 방향을 먼저 정리했습니다.

추가 문서:

```text
documents/Firebase/Gemini_프롬프트_설계.md
```

README 문서 목록에도 해당 설계 문서 링크를 추가했습니다.

### 환경 변수

Gemini API 호출을 위해 다음 환경 변수를 사용합니다.

```env
VITE_GEMINI_API_KEY=...
VITE_GEMINI_MODEL=gemini-2.0-flash
```

`VITE_GEMINI_MODEL`은 생략 가능하며, 코드에서는 기본값으로 `gemini-2.0-flash`를 사용합니다.

주의:

```text
VITE_ 접두사가 붙은 값은 브라우저 번들에 포함됩니다.
공모전 시연용 1차 구현에서는 프론트엔드 직접 호출 방식을 사용하지만,
실제 운영 환경에서는 Firebase Functions 또는 서버성 프록시로 이전하는 것이 안전합니다.
```

### Gemini API 모듈 추가

추가 파일:

```text
src/api/geminiApi.js
```

주요 역할:

```text
사용자 입력값 기반 프롬프트 생성
Gemini generateContent API 호출
JSON 응답 파싱
응답 필수 구조 검증
```

응답은 화면 렌더링과 Firebase 저장을 위해 JSON 형태로 고정했습니다.

### AI Planner 화면 추가

추가 파일:

```text
src/pages/AiPlanner.jsx
```

추가 라우트:

```text
/ai-planner
```

사이드바에도 `AI Planner` 메뉴를 추가했습니다.

입력 항목:

```text
지역
여행 일수
동행 유형
예산 수준
이동 강도
시작/종료 시간
날씨 키워드
여행 스타일
피하고 싶은 조건
위시리스트 후보 장소
```

### 위시리스트 폴더 저장 연동

`src/api/wishlistApi.js`에 AI 코스 저장용 헬퍼를 추가했습니다.

추가 함수:

```text
addWishlistToFolder
saveAiTripToFolder
```

저장 방식:

```text
1. Gemini 응답의 saveGuide.folderName으로 새 위시리스트 폴더 생성
2. 코스 요약과 일정 내용을 MEMO로 저장
3. saveGuide.checklist를 CHECKLIST로 저장
4. contentId가 있는 장소는 wishlists에 폴더 연결 상태로 저장
```

### README 반영

README에 다음 내용을 반영했습니다.

```text
VITE_GEMINI_API_KEY
VITE_GEMINI_MODEL
/ai-planner 라우트
Gemini 프롬프트 설계 문서 링크
```

### 검증 결과

정적 검증을 수행했습니다.

```bash
npm run lint
npm run build
```

결과:

```text
npm run lint 성공
lint error 0개
기존 React Hook warning 12개 유지

npm run build 성공
기존과 동일하게 일부 chunk size warning 발생
```

### 실제 API 호출 테스트 결과

로컬 브라우저에서 Gemini API 호출 테스트를 진행했습니다.

Gemini API key는 CodeTrip 프로젝트 기준으로 재생성하여 `.env`에 반영했으며, 요청은 Gemini API까지 도달했습니다.

다만 Google AI Studio 프로젝트 상태로 인해 실제 생성 결과 검증은 완료하지 못했습니다.

확인된 오류:

```text
HTTP 429 RESOURCE_EXHAUSTED
Gemini API 사용량 한도 초과 또는 현재 프로젝트에서 사용 가능한 quota 없음
Google AI Studio 결제 화면 기준 크레딧 잔액 0원
서비스 재개를 위해 크레딧 잔액이 0보다 커야 한다는 안내 표시
```

판단:

```text
현재 오류는 프론트엔드 코드 오류나 API key 누락 문제가 아니라
Google AI Studio 프로젝트의 크레딧/quota 제한으로 보는 것이 맞습니다.
```

조치:

```text
긴 Gemini 원본 오류 메시지는 사용자 화면에 그대로 노출하지 않도록 수정
429, 400, 401, 403, 500 계열 오류를 짧은 사용자 안내 문구로 변환
자세한 원본 오류는 개발자 콘솔에만 기록
```

### 남은 작업

```text
Google AI Studio 크레딧 충전 또는 사용 가능한 quota 확보
로컬 브라우저에서 실제 Gemini API 호출 재테스트
AI 코스 생성 결과 위시리스트 폴더 저장 end-to-end 테스트
Gemini API key 노출 위험 재검토
필요 시 응답 스키마 검증 강화
feature/gemini PR 생성 및 셀프 리뷰
```

---

## 2026.07.21 UI 헤더 및 반응형 레이아웃 정리

### 작업 배경

Gemini 기능 1차 구현 이후 화면을 확인하면서 공모전 제출용으로 전체 UI 톤을 더 일관되게 정리했습니다.

확인된 문제는 다음과 같습니다.

```text
왼쪽 사이드바 펼침 상태에서 Info 하위 메뉴가 길어지면 사용자 프로필/로그아웃 영역이 잘림
일부 화면의 한글 본문이 고정폭 계열로 보여 굴림처럼 어색하게 표시됨
전역 폰트 보정 후 material-symbols-outlined 아이콘이 텍스트로 깨져 표시됨
페이지별 상단 헤더 형식이 서로 달라 화면 통일감이 떨어짐
좁은 화면에서 상단 검색창이 hidden 처리되어 사라짐
```

### 사이드바 스크롤 구조 수정

수정 파일:

```text
src/components/Layout/SideBar.jsx
```

수정 내용:

```text
로고 아래 영역을 flex-1 min-h-0 구조로 분리
펼침 상태에서 메뉴와 사용자 프로필 영역이 함께 세로 스크롤되도록 변경
접힘 상태에서는 기존 플로팅 서브메뉴 동작을 유지
```

결과:

```text
Info 하위 메뉴가 길어져도 사용자 프로필과 로그아웃 영역이 화면 밖으로 잘리지 않음
메뉴 패널을 펼친 상태에서도 하단 영역까지 스크롤로 확인 가능
```

### 폰트 통일 및 아이콘 복구

수정 파일:

```text
src/App.css
```

수정 내용:

```text
본문 폰트 스택에 Inter, Pretendard, Noto Sans KR, Malgun Gothic, Apple SD Gothic Neo 적용
font-body, font-label, font-mono가 한글 화면에서 같은 산세리프 계열로 보이도록 보정
code, pre, kbd, samp, markdown code 영역은 JetBrains Mono 계열 유지
button 전체에 폰트를 강제하던 규칙 제거
material-symbols-outlined에는 Material Symbols Outlined 폰트를 명시적으로 복구
```

결과:

```text
보드 페이지와 여행지 상세 설명의 한글 본문이 홈 설명 페이지와 유사한 반듯한 글씨체로 표시됨
menu_open, favorite 등 아이콘이 텍스트로 깨져 보이던 문제 복구
```

### 공통 페이지 헤더 컴포넌트 추가

추가 파일:

```text
src/components/PageHeader.jsx
```

공통 형식:

```text
// file_name.ext
페이지 제목.
설명 문구
```

적용 방향:

```text
AI 여행 코스 페이지의 // ai_trip.planner 형식을 기준으로 통일
행사 정보 페이지처럼 .exe, .log, .md 등 개발자스러운 파일 확장자 형식 유지
여행지 탐색의 청록색 제목 점을 다른 주요 페이지에도 동일하게 적용
```

적용 파일:

```text
src/pages/Explore.jsx
src/pages/Festivals.jsx
src/pages/AiPlanner.jsx
src/pages/Board.jsx
src/pages/BoardWrite.jsx
src/pages/TravelTagSearch.jsx
src/pages/MyActivity.jsx
src/pages/MyPage.jsx
src/pages/Settings.jsx
```

대표 라벨:

```text
// travel_explore.exe
// system_events.exe
// ai_trip.planner
// board.log
// new_post.md
// tag_destination_search.exe
// my_activity.log
// wishlist.workspace
// account_settings.exe
```

### 상단 검색창 반응형 유지

수정 파일:

```text
src/components/Layout/Header.jsx
```

수정 내용:

```text
검색창의 hidden sm:block 조건 제거
헤더 좌우 padding과 gap을 작은 화면 기준으로 축소
검색 영역에 flex-1, min-w-0, min-w-[150px] 적용
오른쪽 알림/프로필/로그아웃 영역의 간격과 버튼 크기를 작은 화면 기준으로 축소
placeholder는 좁은 화면에서 자연스럽게 줄임 처리
```

결과:

```text
화면 폭을 줄여도 상단 검색창이 사라지지 않음
프로필/알림 영역과 검색창이 같은 줄에서 함께 유지됨
```

### 검증 결과

다음 명령으로 검증했습니다.

```bash
npm run lint
npm run build
```

결과:

```text
npm run lint 성공
lint error 0개
기존 React Hook warning 11개 유지

npm run build 성공
기존과 동일하게 일부 chunk size warning 발생
```
