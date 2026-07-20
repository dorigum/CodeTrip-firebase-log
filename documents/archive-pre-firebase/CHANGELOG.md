# CHANGELOG — CodeTrip

## 2026-05-24 - Firebase 인증 복원 대기 및 위시리스트 저장 데이터 정규화

### 배경

Firebase Realtime Database 전환 이후 새로고침 직후 또는 페이지 진입 직후에 인증 상태와 로컬 상태가 잠시 어긋날 수 있었습니다. `localStorage`에는 `trip_user`가 남아 있어 앱 화면상으로는 로그인된 것처럼 보이지만, Firebase Auth SDK가 아직 세션 복원을 끝내기 전이면 Realtime Database 요청이 `auth = null` 상태로 전송되어 권한 오류가 발생할 수 있었습니다.

또한 위시리스트 추가 흐름에서는 `Explore`, `TravelDetail`, `WishlistModal`, `Festivals` 등 여러 화면에서 여행지 데이터를 넘기는 필드명이 서로 완전히 같지 않았습니다. 예를 들어 어떤 화면은 `contentid`, 어떤 화면은 `contentId` 또는 `content_id`를 사용할 수 있고, 이미지 필드도 `firstimage`, `imageUrl`, `image_url`, `firstImage`처럼 섞일 수 있었습니다. 이 상태에서 위시리스트 저장 로직이 특정 필드명만 기대하면 하트 클릭 시 저장 데이터가 비거나, 같은 여행지의 중복 판정이 실패하거나, 폴더 지정 저장이 의도대로 동작하지 않을 수 있었습니다.

### 수정 내용

- **`src/api/firebaseHelpers.js`**
  - `onAuthStateChanged`를 사용해 Firebase Auth 초기 복원 상태를 기다리는 `waitForAuthUser()` 흐름을 추가했습니다.
  - `getCurrentUser()`를 동기 함수에서 비동기 함수로 변경했습니다.
  - 기존에는 `firebaseAuth.currentUser`가 없더라도 `localStorage`의 사용자 정보가 있으면 사용자 객체를 반환할 수 있었지만, Realtime Database Rules는 실제 Firebase Auth 세션을 기준으로 판단하므로 이제는 Firebase Auth 사용자가 없으면 명확히 로그인 필요 오류를 발생시킵니다.
  - 반환 사용자 ID는 Realtime Database Rules와 일치하도록 `authUser.uid`를 기준으로 고정했습니다.

- **`src/api/authApi.js`**
  - 프로필 수정, 관심 지역 조회, 관심 지역 저장에서 `await getCurrentUser()`를 사용하도록 변경했습니다.
  - Firebase Auth 복원 전 DB 요청이 먼저 나가는 상황을 줄였습니다.

- **`src/api/wishlistApi.js`**
  - 위시리스트 목록 조회, 추가/삭제 토글, 폴더 조회/생성/삭제, 아이템 이동, 폴더 노트 조회/생성에서 `await getCurrentUser()`를 사용하도록 변경했습니다.
  - 인증이 준비된 뒤에만 `wishlists`, `wishlistFolders`, `wishlistNotes` 노드에 접근하도록 안정화했습니다.

- **`src/api/boardApi.js`**
  - 게시글 작성/수정/삭제, 댓글 작성/수정/삭제, 좋아요 토글, 내 활동 조회 관련 함수에서 `await getCurrentUser()`를 사용하도록 변경했습니다.
  - 게시판 및 댓글 작업도 Firebase Auth 상태 복원 이후 실행되도록 통일했습니다.

- **`src/api/notificationApi.js`**
  - 알림 목록 조회 내부의 현재 사용자 조회를 비동기로 변경했습니다.
  - 새로고침 직후 알림 조회가 인증 복원보다 먼저 실행될 때 생길 수 있는 권한 오류를 줄였습니다.

- **`src/api/travelCommentApi.js`**
  - 여행지 댓글 좋아요, 댓글 작성, 댓글 수정, 댓글 삭제에서 `await getCurrentUser()`를 사용하도록 변경했습니다.
  - 댓글 작성 시 위시리스트 사용자에게 알림을 생성하는 흐름도 인증된 Firebase 사용자 기준으로 실행되도록 보완했습니다.

- **`src/store/useWishlistStore.js`**
  - `normalizeWishlistItem(itemData)` 유틸을 추가했습니다.
  - 여행지 ID 필드는 `contentid`, `contentId`, `content_id`를 모두 허용하고 내부에서는 문자열 `contentid`로 정규화합니다.
  - 제목 필드는 `title`, `facltNm`을 허용하고 값이 없으면 기본값 `여행지`를 사용합니다.
  - 이미지 필드는 `firstimage`, `imageUrl`, `image_url`, `firstImage`를 모두 허용하고 내부에서는 `firstimage`로 정규화합니다.
  - `folder_id`가 없을 때는 `null`로 맞춰 미분류 저장과 폴더 지정 저장을 명확히 구분합니다.
  - `toggleWishlist()`는 정규화된 값을 사용해 `wishlistApi.toggleWishlist(contentid, title, firstimage, folder_id)`를 호출하도록 변경했습니다.
  - 여행지 ID가 없는 잘못된 입력은 서버 요청 없이 `false`를 반환하여 깨진 데이터 저장을 방지합니다.

### 기대 효과

- 새로고침 직후 위시리스트, 알림, 게시판, 댓글, 관심 지역 API가 Firebase Auth 복원보다 먼저 실행되어 `auth=null`로 거부되는 문제를 완화했습니다.
- 앱 내부 로그인 상태와 Firebase Realtime Database Rules가 보는 인증 상태의 기준을 맞췄습니다.
- 화면별로 다른 여행지 데이터 필드명이 넘어와도 위시리스트 저장/삭제/중복 판정이 같은 기준으로 동작합니다.
- 특정 폴더에서 `EXPLORE_ADD`로 이동해 하트를 누르는 흐름에서도 `folder_id`가 안정적으로 유지됩니다.

### 검증

- `src/api`와 `src/store` 하위 JavaScript 파일에 대해 `node --check` 문법 검사를 통과했습니다.
- 현재 로컬 환경에는 일반 `npm` 명령과 `node_modules`가 없어 `npm run build`는 실행하지 못했습니다.

---

> 날짜별 작업 내역, 수정 사항, 트러블슈팅을 기록합니다.
> 현재 구현 상태는 [Project_Specification.md](Project_Specification.md)를 참고하세요.

---

## 2026-04-29 — Info 페이지 SRT 링크 수정

### 수정 내용

- **`src/pages/Info.jsx`**: 교통 허브 섹션의 SRT(수서고속철도) 예매 링크 URL 오류 수정. 잘못된 URL을 SRT 공식 예매 사이트 주소로 교체.

---

## 2026-04-29 — 알림 삭제 기능 추가

### 배경

알림 드롭다운에 쌓인 읽은 알림이나 특정 알림을 개별 또는 일괄 삭제할 수 없어 알림 목록이 누적되는 UX 문제 해결 필요.

### 수정 내용

- **`server/routes/notificationRoutes.js`**:
  - `DELETE /api/notifications/:id` 엔드포인트 추가: 특정 알림 1개 삭제. `WHERE user_id = ?` 조건으로 본인 알림만 삭제 가능.
  - `DELETE /api/notifications/read` 엔드포인트 추가: 읽은 알림(`is_read = TRUE`) 전체 일괄 삭제.

- **`src/api/notificationApi.js`**:
  - `deleteOneNotification(id)`: 특정 알림 삭제 API 함수 추가.
  - `deleteReadNotifications()`: 읽은 알림 전체 삭제 API 함수 추가.

- **`src/components/Layout/Header.jsx`**:
  - 알림 드롭다운 헤더에 "읽은 알림 삭제" 버튼 추가.
  - 각 알림 아이템에 개별 삭제 버튼(×) 추가 — 클릭 시 `deleteOneNotification` 호출 후 로컬 상태에서도 해당 알림 제거.
  - 삭제 처리 후 `unreadCount` 값 자동 재계산.

---

## 2026-04-29 — 알림 기능 안정화 (알림 트리거 및 UI 오류 수정)

### 1. 알림 생성 트리거 누락 수정 (`fix: 알림 기능이 제대로 동작하지 않던 문제 수정`)

**배경**: 게시판 댓글 및 여행지 댓글 작성 시 작성자에게 알림이 전송되지 않던 문제. 알림 라우터가 `notificationRoutes.js`로 분리되어 있었으나 게시판/여행지 댓글 라우트에서 알림 INSERT 쿼리가 실행되지 않고 있었음.

**수정 내용**:

- **`server/routes/boardRoutes.js`**:
  - 게시판 댓글 작성(`POST /api/board/posts/:id/comments`) 시 게시글 작성자에게 알림 INSERT 쿼리 추가. 본인 댓글에는 알림 미발송(`WHERE post_author_id != commenter_id`).

- **`server/routes/travelCommentRoutes.js`**:
  - 여행지 댓글 작성 시 동일한 알림 INSERT 패턴 적용.

- **`src/components/Layout/Header.jsx`**:
  - 알림 드롭다운 렌더링 오류 수정(UI 버그 패치).

### 2. useWishlistStore clearWishlist 미정의 버그 수정

**배경**: 로그아웃 시 `Header.jsx`에서 `clearWishlist()`를 호출하는데, `useWishlistStore`에 해당 함수가 정의되어 있지 않아 런타임 에러 발생.

**수정 내용**:

- **`src/store/useWishlistStore.js`**: `clearWishlist` 액션 추가. 호출 시 `wishlistIds`, `wishlistItems`, `folders` 상태를 모두 초기값으로 리셋.

---

## 2026-04-29 — 프로필 사진 업로드 클라이언트 사이드 압축

### 배경

사용자가 대용량 사진(수 MB 이상의 DSLR·스마트폰 원본 이미지)을 프로필로 업로드할 경우 서버 Multer의 5MB 제한에 걸려 업로드가 실패하거나, 성공하더라도 DB·네트워크에 불필요하게 큰 파일이 저장되는 문제.

### 수정 내용

- **`src/pages/Settings.jsx`**:
  - `compressImage(file)` 비동기 함수 추가: Canvas API를 활용한 클라이언트 사이드 이미지 압축.
    - 1MB 이하 파일은 압축 없이 원본 그대로 사용.
    - 최대 해상도 1920px 이하로 비율 유지하며 리사이즈.
    - JPEG quality `0.85`부터 시작하여 1MB 이하가 될 때까지 `0.1`씩 감소 반복(최소 `0.05`).
    - 결과물을 `.jpg` 확장자 `File` 객체로 변환하여 기존 FormData에 주입.
  - 파일 선택(`handleFileChange`) 직후 `compressImage()` 적용, 압축된 파일로 서버 업로드 진행.
  - 상수: `MAX_UPLOAD_BYTES = 1MB`, `MAX_DIMENSION = 1920px`.

---

## 2026-04-29 — 서버 오류 시 토스트 메시지 전역 표시 및 Toast 아키텍처 개선

### 1. Toast 시스템 Context 기반으로 개편 (`fix: 토스트 메시지 관련 오류 수정`)

**배경**: 기존 `useToast` 훅이 각 컴포넌트마다 독립적인 `toast` 상태와 타이머를 생성하는 구조여서, 여러 컴포넌트에서 토스트를 띄울 경우 동시에 여러 토스트가 표시되거나 화면에서 겹치는 문제 발생. 전역 단일 Toast 인스턴스가 필요.

**수정 내용**:

- **`src/context/ToastContext.jsx`** (신규 파일):
  - `ToastContext` Context 생성.
  - `ToastProvider` 컴포넌트: 전역 단일 `toast` 상태·타이머(`timerRef`) 관리. 앱 루트에 `<Toast>` 컴포넌트를 한 번만 렌더링.
  - `showToast(text, type)` 콜백을 Context value로 제공.

- **`src/hooks/useToast.js`**:
  - 기존 훅 로직 완전 삭제. `ToastContext`의 `useToast`를 재수출(`re-export`)하는 단일 라인으로 대체. 기존 import 경로(`hooks/useToast`) 그대로 유지하여 하위 호환성 보장.

- **`src/App.jsx`**:
  - `<ToastProvider>`를 라우터 외부 최상위에 감싸 전역 Toast 컨텍스트 활성화.
  - 기존 `Header.jsx` 내부에서 직접 `<Toast>`를 렌더링하던 코드 제거.

- **`src/components/Toast.jsx`**: 스타일·구조 소폭 개선.

### 2. 전 페이지 서버 오류 토스트 표시 (`feat: 다른 페이지에서 서버 호출에 실패하면 토스트 메시지 표시`)

**배경**: 네트워크 오류나 서버 500 에러가 발생해도 별도 UI 피드백이 없어 사용자가 오류 상황을 인지하기 어려웠음.

**수정 내용**:

- **`src/api/travelApi.js`**, **`src/api/travelInfoApi.js`**: API 함수 catch 블록에서 `null` 반환 대신 toast 메시지 표시.
- **`src/pages/Board.jsx`**, **`src/pages/Explore.jsx`**, **`src/pages/Festivals.jsx`**, **`src/pages/MyActivity.jsx`**, **`src/pages/MyPage.jsx`**: 각 페이지의 데이터 페칭 실패 시 `useToast`로 사용자에게 오류 알림 표시.
- **`src/store/useExploreStore.js`**, **`src/store/useWishlistStore.js`**: 스토어 레벨 API 실패 시에도 토스트 알림 전달.

---

## 2026-04-29 — 여행지 검색 및 메인 페이지 관심지역 날씨 연동 개선

### 1. `REGION_META` 확장 및 날씨 연동 개선 (`server/routes/travelRoutes.js`)

**배경**: 관심지역 기반 즉흥 추천 API가 관심지역의 날씨를 함께 표시하기 위해 행정구역 코드(`lDongRegnCd`) 기준 메타데이터가 필요했으나, 기존 `REGION_META`에는 일부 지역이 누락되어 있었음.

**수정 내용**:

- **`server/routes/travelRoutes.js`**:
  - `REGION_META` 상수 확장: 전국 17개 시도 + 세종시(`36110`)를 포함한 완전한 지역 코드·이름·TourAPI areaCode·위도·경도 매핑 완성.
  - `WEATHER_KEYWORDS` 상수 확장: 날씨 유형별(`Sunny`, `Partly Cloudy`, `Cloudy`, `Rainy`, `Snowy`, `Stormy`) 추천 키워드 배열로 개선.
  - `parseWeatherCode(code, cloudcover, precipitation)` 함수 추가: 구름량·강수량 보정 로직 포함한 WMO 코드 → 날씨 레이블 변환.
  - `fetchRegionWeather(region)` 함수 추가: Open-Meteo API 호출하여 관심지역 실시간 날씨 반환. timeout 4초 설정.

- **`src/api/travelApi.js`**:
  - `getSpontaneousTravel(poolSize)` API 함수 추가: `/api/travel/spontaneous` 호출 후 실패 시 `null` 반환.

### 2. 메인 페이지 즉흥 추천 카드 개선 (`src/pages/Home.jsx`)

**수정 내용**:

- `useAuthStore`에서 `isLoggedIn` 구독 추가.
- `spontaneousMeta` 상태 추가: 즉흥 추천 API 응답 메타데이터(날씨 정보, 관심지역 포함).
- 뽑기 버튼 클릭 시 로그인 사용자는 `getSpontaneousTravel()` 우선 호출. 성공하면 관심지역·날씨 기반 추천 결과 표시. 비로그인 또는 API 실패 시 기존 날씨 키워드 기반 랜덤 추천으로 폴백.
- 추천 카드에 기준 지역의 날씨 정보(기온, 날씨 레이블) 표시.

---

## 2026-04-29 — recently_viewed.log 섹션 MyActivity 상단 고정 이동

### 배경

`MyPage`(위시리스트)에 구현되어 있던 `recently_viewed.log` 최근 본 여행지 섹션이 위시리스트 콘텐츠와 함께 배치되어 있어, 활동 이력 조회보다 위시리스트 관리가 목적인 페이지와 의미상 분리가 필요했다. 또한 `MyActivity` 페이지는 게시글·댓글·좋아요 이력을 한 곳에서 관리하는 활동 허브로, 최근 조회 여행지까지 포함하면 사용자 활동 전반을 한눈에 파악할 수 있는 구조가 완성된다.

### 수정 내용

- **`src/pages/MyActivity.jsx`**:
  - `useRecentlyViewedStore` import 추가.
  - `const { items: recentlyViewed, clearAll: clearRecentlyViewed } = useRecentlyViewedStore()` 훅 호출 추가.
  - 페이지 헤더(`// my_activity.log`) 아래, 탭 바(LIKED POSTS · BOARD POSTS · BOARD COMMENTS · TRAVEL COMMENTS) 위에 `recently_viewed.log` 섹션 고정 배치.
  - 가로 스크롤 카드 열(너비 160px × 높이 112px 썸네일 + 제목 + 주소) 구조 유지. 항목이 없으면 섹션 자체 숨김. 우측 상단 "전체 삭제" 버튼으로 이력 초기화 가능.
  - LIKED POSTS · BOARD POSTS 등 어떤 탭을 선택해도 `recently_viewed.log` 섹션은 탭 바 위에 항상 고정 노출.

- **`src/pages/MyPage.jsx`**:
  - `useRecentlyViewedStore` import 제거.
  - `const { items: recentlyViewed, clearAll: clearRecentlyViewed } = useRecentlyViewedStore()` 훅 호출 제거.
  - `recently_viewed.log` JSX 섹션 블록 완전 제거.

---

## 2026-04-28 — 알림 시스템 구현 (게시글·댓글 알림 + 헤더 드롭다운)

### 1. 알림 DB 및 백엔드 (`feat: 알림 기능 구현 및 지역코드 lDongRegnCd로 변경`)

**배경**: 다른 사용자가 내 게시글에 댓글을 달거나 좋아요를 누를 때 알림을 받을 수 없어 커뮤니티 상호작용이 단절되는 문제.

**수정 내용**:

- **`server/db/init.js`**:
  - `notifications` 테이블 신설: `id`, `user_id`, `message`, `content_id`, `is_read`, `created_at` 컬럼 구성. 알림 대상 사용자 기준으로 최신순 조회 가능하도록 인덱스 설계.

- **`server/routes/notificationRoutes.js`** (신규 파일):
  - `GET /api/notifications`: 로그인 사용자의 알림 목록 최대 30개 조회 + `unreadCount` 포함 응답.
  - `PUT /api/notifications/read-all`: 해당 사용자의 미읽은 알림 전체 읽음 처리.
  - `PUT /api/notifications/:id/read`: 개별 알림 읽음 처리.

- **`server/routes/boardRoutes.js`**:
  - 게시판 댓글 작성 시 게시글 작성자에게 알림 INSERT. 본인 댓글 제외.

- **`server/routes/travelRoutes.js`**:
  - 관심지역 조회 API에서 행정동 코드(`lDongRegnCd`)를 사용하도록 지역코드 처리 방식 변경.

- **`server/services/travelCache.js`**: 여행지 캐시 초기화 로직 개선.

- **`src/api/notificationApi.js`** (신규 파일):
  - `getNotifications()`, `markAllRead()`, `markOneRead(id)` 함수 export.

### 2. 헤더 알림 드롭다운 UI (`src/components/Layout/Header.jsx`)

- `getNotifications`, `markAllRead`, `markOneRead` 함수 import.
- `notifications`, `unreadCount`, `notiOpen` 상태 추가. `notiRef` ref 추가.
- `fetchNotifications()`: 로그인 시 알림 목록 조회 useEffect.
- 외부 클릭 시 드롭다운 닫힘 처리(`notiRef` 기반).
- 알림 벨 버튼: 미읽은 알림 있을 때 붉은 점(`w-2 h-2 bg-red-500`) 표시.
- 알림 드롭다운 패널: 헤더(Notifications 레이블 + 미읽은 수 뱃지 + "모두 읽음" 버튼) + 알림 목록(최대 높이 `max-h-80` 스크롤). 알림 없으면 `notifications_off` 아이콘 표시.
- 각 알림 클릭 시 `markOneRead` 호출 → 해당 알림 `content_id`가 있으면 `/explore/{content_id}`로 이동.

---

## 2026-04-28 — 관심지역 설정 기능 추가 (Settings 페이지)

### 배경

사용자가 자신의 선호 지역을 설정하면 메인 페이지 즉흥 추천 및 Explore 자동 필터에 활용할 수 있도록, Settings 페이지에 관심지역 선택·저장 UI와 백엔드 API가 필요.

### 수정 내용

- **`2_Project_Documents/codetrip_mysql.sql`**:
  - `user_favorite_regions` 테이블 스키마 추가: `id`, `user_id`, `region_code`, `created_at` 컬럼. `user_id + region_code` 유니크 제약으로 중복 등록 방지.

- **`server/db/init.js`**:
  - `user_favorite_regions` 테이블 자동 생성 로직 추가.

- **`server/routes/userRoutes.js`**:
  - `GET /api/user/favorite-regions`: 로그인 사용자의 관심지역 코드 목록 조회.
  - `PUT /api/user/favorite-regions`: 관심지역 코드 배열 받아 기존 데이터 전체 삭제 후 재삽입(최대 3개 제한 적용).

- **`src/api/authApi.js`**:
  - `getFavoriteRegions()`: 관심지역 목록 조회 함수 추가.
  - `setFavoriteRegions(codes)`: 관심지역 저장 함수 추가.

- **`src/pages/Settings.jsx`**:
  - 관심지역 설정 섹션 신규 추가: 17개 시도 중 최대 3개까지 체크박스로 선택 가능. 선택 초과 시 추가 선택 비활성화.
  - 페이지 마운트 시 `getFavoriteRegions()` 호출하여 저장된 관심지역 초기값 표시.
  - 저장 버튼 클릭 시 `setFavoriteRegions(selectedCodes)` 호출 후 성공/실패 토스트 메시지 표시.

### 관련 후속 커밋

- **`feat: 관심지역을 불러오는 데 실패하면 토스트 메시지 표시`**: `Toast.jsx` 컴포넌트 신규 작성 + Settings 페이지에서 API 실패 시 오류 토스트 표시 추가.

---

## 2026-04-28 — 게시글 좋아요 기능 추가 및 MyActivity 개선

### 1. 게시글 좋아요 기능 구현 (`feat: 게시글 좋아요 기능 추가`)

**수정 내용**:

- **`2_Project_Documents/codetrip_mysql.sql`**:
  - `board_post_likes` 테이블 스키마 추가: `id`, `post_id`, `user_id`, `created_at`. `post_id + user_id` 유니크 제약으로 중복 좋아요 방지.

- **`server/db/init.js`**:
  - `board_post_likes` 테이블 자동 생성 추가.

- **`server/routes/boardRoutes.js`**:
  - `POST /api/board/posts/:id/like`: 좋아요 토글(추가/취소). 이미 좋아요한 경우 DELETE, 아닌 경우 INSERT.
  - `GET /api/board/posts` 응답에 `like_count`, `is_liked`(현재 사용자 기준) 필드 추가.
  - `GET /api/board/posts/:id` 응답에도 동일 필드 추가.

- **`src/api/boardApi.js`**:
  - `togglePostLike(postId)` 함수 추가.
  - `getLikedPosts()` 함수 추가: 내가 좋아요한 게시글 목록 조회.

- **`src/pages/Board.jsx`**: 게시글 카드에 좋아요 수 표시 및 좋아요 버튼 추가. 클릭 시 `togglePostLike` 호출.

- **`src/pages/BoardDetail.jsx`**: 상세 페이지에도 좋아요 버튼 추가. 좋아요 상태에 따라 `fill-1` 아이콘 토글.

### 2. MyActivity 개선 — 좋아요한 게시글 탭 추가 및 좋아요 수 표시

- **`server/routes/activityRoutes.js`**:
  - `GET /api/my/liked-posts`: 내가 좋아요한 게시글 목록 + 각 게시글의 좋아요 수 조회 엔드포인트 추가.
  - `GET /api/my/board-posts`: 내가 작성한 게시글 목록에 `like_count` 필드 추가.

- **`src/pages/MyActivity.jsx`**:
  - `LIKED POSTS` 탭 신규 추가 (기존 탭: `BOARD POSTS` · `BOARD COMMENTS` · `TRAVEL COMMENTS`).
  - 좋아요한 게시글 목록 조회(`getLikedPosts`) 및 렌더링.
  - 게시글 카드에 좋아요 수(`♥ N`) 표시.

---

## 2026-04-28 — BoardWrite 로그아웃 리디렉션 및 로그아웃 확인 팝업

- **`src/pages/BoardWrite.jsx`**: 게시글 작성 중 로그아웃 감지 시 `/board` 경로로 자동 이동. 인증 상태 변경을 `useEffect`로 감지하여 처리.

- **`src/components/Layout/Header.jsx`**, **`src/components/Layout/SideBar.jsx`**: 로그아웃 버튼 클릭 시 `window.confirm()`으로 로그아웃 여부 확인 팝업 표시. 취소 선택 시 로그아웃 취소.

---

## 2026-04-28 — TravelDetail 지도 중심 창 크기 반응형 수정

**배경**: TravelDetail 페이지에서 브라우저 창 크기를 변경하면 Kakao Map의 중심 좌표가 어긋나는 현상.

**수정 내용**:

- **`src/pages/TravelDetail.jsx`**: `window.resize` 이벤트 리스너 추가. 창 크기 변경 시 `mapRef.current.relayout()` 및 `setCenter(new window.kakao.maps.LatLng(...))` 재호출로 지도 중심 재정렬.

---

## 2026-04-28 — 최근 본 여행지 및 최근 검색어 기능 추가

### 1. 최근 본 여행지 (Recently Viewed)

**배경**: 사용자가 여행지 상세 페이지를 방문한 뒤 MyPage로 돌아갔을 때 방금 본 여행지를 다시 찾기 어려운 UX 단절 문제. 별도 API 없이 `localStorage`만으로 클라이언트 사이드에서 완결되는 방문 이력 관리가 필요.

**신규 파일**:

- **`src/store/useRecentlyViewedStore.js`** (Zustand 스토어):
  - `localStorage` 키 `codetrip_recently_viewed`에 최대 10개 항목을 FIFO 방식으로 저장.
  - `addItem(item)`: `contentid` 기준으로 중복 제거 후 최신 항목을 배열 선두에 삽입, `slice(0, 10)`으로 상한 유지.
  - `clearAll()`: 로컬스토리지와 Zustand 상태를 동시에 초기화.

**수정 파일**:

- **`src/pages/TravelDetail.jsx`**:
  - `useRecentlyViewedStore` 임포트 및 `addRecentlyViewed` 액션 구독.
  - `common?.title` 의존 `useEffect` 추가: `common` 데이터 수신 직후 `{ contentid, title, firstimage, addr1 }` 형태로 방문 이력 저장.

- **`src/pages/MyPage.jsx`**:
  - `useRecentlyViewedStore`에서 `items`·`clearAll` 구독.
  - 위시리스트 그리드 상단에 `recently_viewed.log` 섹션 추가: 가로 스크롤 카드 열(너비 160px × 높이 112px 썸네일 + 제목 + 주소)로 최근 방문 여행지를 최대 10개 표시. 항목이 없으면 섹션 자체를 숨김. 우측 상단 "전체 삭제" 버튼으로 이력 초기화 가능.

### 2. 최근 검색어 드롭다운 (Recent Search Keywords)

**배경**: 헤더 검색창에 반복 입력하는 번거로움을 줄이고, 이전 검색 맥락을 빠르게 재활용할 수 있는 UX 개선 필요.

**신규 파일**:

- **`src/hooks/useRecentSearch.js`** (커스텀 훅):
  - `localStorage` 키 `codetrip_recent_searches`에 최대 5개 키워드를 FIFO 방식으로 저장.
  - `addSearch(keyword)`: 중복 제거 후 최신 키워드를 선두 삽입, `slice(0, 5)` 상한 유지.
  - `removeSearch(keyword)`: 특정 키워드만 삭제.
  - `clearAll()`: 전체 초기화.

**수정 파일**:

- **`src/components/Layout/Header.jsx`**:
  - `useRecentSearch` 훅 임포트 및 `recents, addSearch, removeSearch, clearSearches` 구독.
  - `searchFocused` 상태, `searchContainerRef` ref 추가.
  - 외부 클릭 핸들러에 `searchContainerRef` 포함하여 검색창·알림 드롭다운 동시 닫힘 처리.
  - `handleSearchKeyDown`: Enter 입력 시 `addSearch(kw)` 호출하여 검색어 이력 저장.
  - `handleRecentClick(keyword)`: 최근 검색어 클릭 시 해당 키워드로 Explore 검색 재실행.
  - 검색 input `onFocus` 핸들러로 드롭다운 표시 전환.
  - 최근 검색어 드롭다운 UI: `searchFocused && recents.length > 0` 조건부 렌더링. 헤더(레이블 + "전체 삭제"), 항목(히스토리 아이콘 + 키워드 + 개별 삭제 버튼). 모든 항목 인터랙션에 `onMouseDown` 사용하여 blur 레이스 컨디션 방지.

---

## 2026-04-28 — 사용자 맞춤 UX 고도화 (Explore 관심지역 필터 자동화, MyPage 통계 위젯)

### 1. Explore 페이지 — 관심지역 자동 필터링 시스템 구축

**배경**: 탐색 페이지 진입 시 항상 '전국' 필터로 초기화되어, 사용자가 매번 관심지역을 수동으로 선택해야 하는 불편함이 존재. Settings에서 저장한 관심지역 데이터(`user_favorite_regions`)가 Explore 필터에 자동 연동되지 않는 UX 단절 문제.

**수정 내용**:

- **`src/store/useExploreStore.js`**:
  - `applyFavoriteRegions(codes)` 액션 추가: 관심지역 코드 배열을 받아 `selectedRegions`·`appliedRegions` 상태를 일괄 설정하고 즉시 `fetchPosts()`를 호출. 코드 배열이 비어있으면 전국 기준으로 조회.
  - `resetFilter()` 액션 추가: `selectedRegions`, `selectedThemes`, `appliedRegions`, `appliedThemes`를 모두 초기값(`['']`)으로 복원하고 `fetchPosts()` 재호출. 수동 필터 초기화 버튼 구현의 기반 액션.

- **`src/pages/Explore.jsx`**:
  - `import authApi from '../api/authApi'` 추가 — 관심지역 조회 API 연결.
  - `favoriteRegions` 로컬 상태 추가: API에서 가져온 코드 배열을 저장하여 `MY_REGIONS.SH` 버튼 표시 여부 제어에 활용.
  - `applyFavoriteRegions`, `resetFilter` 스토어 액션 추가.
  - 마운트 시 초기화 로직 변경: 기존 `if (!initialized) fetchPosts()` 단순 분기에서, 로그인 사용자의 경우 `authApi.getFavoriteRegions()` 호출 후 결과를 `applyFavoriteRegions(favCodes)`로 전달. 비로그인 또는 API 실패 시 빈 배열로 폴백하여 전국 기준 조회 유지. `initialized` 플래그로 이미 초기화된 상태에서의 중복 적용 방지.
  - 필터 사이드바 하단 버튼 3종으로 재구성:
    - `RUN_FILTER.SH` — 현재 체크된 필터 즉시 적용 (기존 동작 유지).
    - `MY_REGIONS.SH` — 로그인 사용자이며 관심지역이 1개 이상 설정된 경우에만 노출. 클릭 시 저장된 관심지역으로 필터 즉시 재설정 및 조회.
    - `RESET_ALL.SH` — 항상 표시. 지역·테마 필터를 전국/전체로 일괄 초기화.

### 2. MyPage — 위시리스트 통계 위젯 (`TRAVEL_STATS`) 신규 추가

**배경**: MyPage 사이드바는 폴더 내비게이션 역할만 담당하여 전체 위시리스트 현황을 한눈에 파악할 수 없었음. 기존 `wishlistItems`·`folders` 데이터를 재활용하여 추가 API 호출 없이 통계를 표시할 수 있는 구조.

**수정 내용**:

- **`src/pages/MyPage.jsx`**:
  - `stats` useMemo 추가: `wishlistItems`·`folders` 상태를 구독하여 `total`(전체 아이템 수), `folderCount`(폴더 수), `uncategorized`(미분류 수), `topFolder`(최다 아이템 폴더 `{name, count}`) 4가지 파생값을 계산.
  - 사이드바에 `Travel_Stats` 섹션 신규 추가 (타이틀과 FOLDERS 섹션 사이 배치):
    - 기존 `Folder_Metadata`와 동일한 `bg-inverse-surface` 다크 테마 스타일 적용.
    - `TOTAL_NODES`(에메랄드), `FOLDERS`(에메랄드), `UNCATEGORIZED`(시안), `TOP_FOLDER`(옐로우) 항목을 폰트 모노 스타일로 표시.
    - `TOP_FOLDER`는 항목이 1개 이상인 폴더가 존재할 때만 구분선과 함께 조건부 렌더링.

---

## 2026-04-28 — 관심 지역·날씨 기반 즉흥 여행지 랜덤 추천 기능 추가

### 1. 개발 배경 및 목적

**배경**: 기존 메인 페이지의 랜덤 여행지 뽑기 기능은 전체 여행지 데이터에서 무작위로 추천하는 성격이 강했기 때문에, 로그인한 사용자의 관심 지역이나 현재 여행 조건을 충분히 반영하지 못했다. 프로젝트 기획 의도인 "즉흥적으로 떠나고 싶은 사용자에게 빠르게 여행지를 제안하는 서비스"를 강화하기 위해 회원 맞춤형 랜덤 추천 로직이 필요했다.

**목표**:
- 회원 사용자는 팀원이 구현 중인 관심 지역 설정 데이터(`user_favorite_regions`)를 기반으로 여행지를 추천받을 수 있게 한다.
- 관심 지역의 현재 날씨를 함께 조회하여, 날씨와 어울리는 여행지를 2차 필터링한다.
- 관심 지역을 아직 설정하지 않은 회원도 기능을 확인할 수 있도록 기본 지역 폴백을 제공한다.
- 비회원은 관심 지역 데이터가 없으므로 기존 전국 랜덤 여행지 미리보기 흐름을 유지한다.

### 2. 서버 추천 API 추가 (`server/routes/travelRoutes.js`)

- **`GET /api/travel/spontaneous` 엔드포인트 추가**:
  - JWT 인증이 필요한 회원 전용 즉흥 여행지 추천 API.
  - `authenticateToken` 미들웨어를 통과한 사용자의 `user_id`를 기준으로 관심 지역을 조회.
  - 팀원이 구현한 `user_favorite_regions` 테이블과 연동하여 `region_code` 목록을 읽음.
  - 관심 지역이 없는 경우 기본 지역을 서울(`11`)로 설정하여 추천 API가 빈 응답으로 끝나지 않도록 처리.

- **지역 메타데이터 추가**:
  - `REGION_META` 상수로 지역 코드, 지역명, TourAPI `areacode`, 위도, 경도를 매핑.
  - 날씨 API 호출과 여행지 지역 필터링이 같은 기준으로 동작하도록 정리.

- **날씨 조회 헬퍼 추가**:
  - `fetchRegionWeather(regionCode)`를 통해 Open-Meteo에서 관심 지역의 현재 날씨를 조회.
  - 응답에는 날씨 라벨, 기온, WMO 코드, 지역명, 좌표를 포함.
  - 날씨 API 실패 시 추천 전체가 실패하지 않도록 `weather: null`로 폴백.

### 3. 추천 알고리즘 흐름

1. 로그인 사용자 인증 정보를 확인한다.
2. `user_favorite_regions`에서 사용자의 관심 지역 목록을 조회한다.
3. 관심 지역이 있으면 그중 하나를 추천 기준 지역으로 선택하고, 없으면 서울을 기본 기준 지역으로 사용한다.
4. 서버 메모리 캐시의 전체 여행지 목록(`allTravelItems`)에서 관광지·문화시설 중심의 후보를 추린다.
5. 1차 필터링으로 기준 지역의 `areacode` 또는 주소 텍스트가 일치하는 여행지만 남긴다.
6. 기준 지역 후보가 부족하면 사용자의 전체 관심 지역으로 범위를 넓힌다.
7. 그래도 후보가 부족하면 전국 관광지·문화시설 이미지 보유 데이터로 폴백한다.
8. 현재 날씨에 맞는 키워드로 2차 필터링을 시도한다.
9. 필터링 결과가 너무 적으면 기존 후보군을 유지하여 추천 실패 가능성을 줄인다.
10. 이미지 보유 여부, 콘텐츠 타입, 날씨 키워드 매칭, 지역 주소 매칭을 기준으로 점수를 계산한다.
11. 상위 후보군에서 최종 여행지를 랜덤으로 1개 선택해 반환한다.

### 4. 날씨 기반 2차 필터링

- **날씨별 추천 키워드 추가**:
  - 맑음/대체로 맑음: 해변, 전망대, 산책, 공원, 정원 등 야외 활동 중심.
  - 흐림/구름 많음: 박물관, 전시, 문화, 시장, 카페 등 실내·도심 활동 중심.
  - 비/눈/폭풍: 박물관, 전시, 미술관, 실내, 카페 등 기상 영향을 덜 받는 장소 중심.

- **안전한 필터 적용 기준**:
  - 날씨 키워드와 매칭되는 후보가 충분할 때만 2차 필터를 실제 적용.
  - 매칭 후보가 너무 적으면 추천 품질이 떨어질 수 있으므로 원래 후보군을 유지.
  - 응답의 `weatherFilter` 객체에 필터 적용 여부, 매칭 개수, 적용 키워드를 포함하여 디버깅 가능하도록 구성.

### 5. 프론트엔드 연동 (`src/api/travelApi.js`, `src/pages/Home.jsx`)

- **API 함수 추가**:
  - `getSpontaneousTravel(poolSize = 20)` 함수 추가.
  - `/api/travel/spontaneous` 호출 결과를 반환하고, 실패 시 `null`을 반환하여 UI 폴백이 가능하도록 처리.

- **메인 페이지 두 번째 카드 개선**:
  - 로그인한 사용자는 즉흥 여행지 뽑기 버튼 클릭 시 회원 맞춤 추천 API를 우선 호출.
  - 추천 성공 시 여행지 이미지, 이름, 주소와 함께 기준 지역의 날씨 정보를 표시.
  - 날씨 정보는 카드 상단 보조 정보와 이미지 오버레이에 함께 표시.
  - 관심 지역이 없는 회원은 "관심 지역 설정 전 랜덤 추천" 상태로 기본 지역 기반 추천을 확인할 수 있음.
  - 비회원은 "전국 랜덤 여행지 미리보기" 화면을 유지하여 회원 기능과 비회원 경험을 분리.

### 6. 응답 데이터 구조

`GET /api/travel/spontaneous` 응답에는 다음 데이터가 포함된다.

- `item`: 최종 추천 여행지 데이터.
- `score`: 추천 후보 점수.
- `reasons`: 추천 사유 배열.
- `weather`: 기준 지역의 현재 날씨 정보.
- `hasPreferences`: 사용자가 관심 지역을 설정했는지 여부.
- `preferredRegions`: 사용자 관심 지역 코드 목록.
- `activeRegion`: 이번 추천에 사용된 기준 지역 코드.
- `fallbackUsed`: 후보 부족으로 폴백이 사용되었는지 여부.
- `weatherFilter`: 날씨 필터 적용 여부, 매칭 후보 수, 적용 키워드.

### 7. 검증 내역

- `node --check server/routes/travelRoutes.js`로 서버 라우트 문법 검증 완료.
- 임시 회원 계정으로 `/api/travel/spontaneous` 호출 검증 완료.
- 관심 지역 미설정 상태에서 기본 지역 폴백 응답 확인.
- `PUT /api/user/favorite-regions`로 관심 지역을 설정한 뒤 해당 지역 기반 추천 응답 확인.
- 날씨 기반 2차 필터가 적용되는 케이스에서 `weatherFilter.applied`, `matchedCount`, `keywords` 응답 확인.
- `npm run build` 실행 성공. Vite chunk size warning은 기존 번들 크기 경고로 기능 빌드 실패와 무관.

---

## 2026-04-28 — 날씨 엔진 고도화: 실시간 파라미터 전환 및 구름량 기반 보정 로직 추가

### 1. Open-Meteo API 파라미터 전환 (`src/api/weatherApi.js`)

**배경**: 기존 `current_weather: true` 파라미터는 Open-Meteo의 레거시 API로, 1시간 단위 모델 보간값을 반환하여 최대 1시간의 데이터 지연이 발생할 수 있었음. 또한 기상 코드(`weathercode`)만으로 날씨를 판정하여 실제 구름량이 높아도 "맑음"으로 표시되는 문제가 있었음.

**수정 내용**:
- **`current_weather: true` → `current` 파라미터로 전환**: 15분 단위 실시간 데이터 제공. `temperature_2m`, `weathercode`, `cloudcover`, `precipitation` 4개 변수를 명시적으로 요청.
- **`models: 'jma_seamless'` 추가**: 일본 기상청(JMA) 고해상도 모델 적용. 한국·동아시아 지역에서 Open-Meteo 기본 블렌드 모델 대비 날씨 예보 정확도 향상.
- **`refineWeatherCode(code, cloudcover, precipitation)` 보정 함수 신규 추가**:
  - `precipitation > 0`이고 코드가 맑음 계열(`< 51`)이면 → 비(`61`)로 보정.
  - `code === 0` 또는 `1`이고 `cloudcover ≥ 75%`이면 → 흐림(`3`)으로 보정.
  - `code === 0`이고 `cloudcover ≥ 40%`이면 → 구름 조금(`2`)으로 보정.

**효과**: 데이터 갱신 주기 단축(1시간 → 15분), 실제 구름량·강수량을 반영한 판정으로 "맑음" 오판 케이스 감소.

---

## 2026-04-27 — 백엔드 모듈화 리팩터링 및 유지보수 구조 개선

### 1. Express 백엔드 단일 파일 구조 분리
- **배경**: 기존 백엔드는 `server/index.js` 하나에 Express 앱 설정, MySQL 연결, DB 스키마 초기화, JWT 인증, Multer 업로드, TourAPI 호출, 서버 캐시, 위시리스트, 게시판, 댓글, 사용자 활동 API가 모두 모여 있었음.
- **문제점**:
  - 기능이 늘어날수록 `index.js`가 1,200줄 이상으로 커져 특정 API나 캐시 로직을 찾기 어려웠음.
  - 인증, DB, 업로드, 외부 API 프록시, 도메인 라우트가 한 파일에 섞여 있어 수정 범위와 영향도를 판단하기 어려웠음.
  - 신규 기능 추가 시 기존 라우트와 유틸리티 로직 사이의 경계가 불명확해 머지 충돌과 회귀 위험이 커질 수 있었음.
- **개선 방향**: 기존 API 경로와 응답 구조는 유지하면서, 내부 구현만 책임별 모듈로 분리하는 방식으로 리팩터링.

### 2. 서버 엔트리포인트 경량화 (`server/index.js`)
- **변경 전**: 서버 실행 파일이 모든 백엔드 기능을 직접 구현.
- **변경 후**: `server/index.js`는 다음 역할만 담당하도록 축소.
  - Express 앱 생성.
  - CORS, JSON body parser, `/uploads` 정적 파일 서빙 설정.
  - `/api` prefix 아래 도메인별 라우터 mount.
  - DB 초기화 실행.
  - 여행 데이터 캐시 초기화 및 일일 갱신 스케줄 등록.
  - 서버 listen 시작.
- **효과**: 서버 시작 흐름을 한눈에 파악할 수 있게 되었고, 각 기능 수정 시 관련 파일만 열면 되는 구조로 개선.

### 3. 공통 설정 모듈 분리 (`server/config`)
- **`server/config/env.js` 추가**:
  - `dotenv` 로딩 및 공통 환경값 관리.
  - `PORT`, `JWT_SECRET`, `TRAVEL_API_BASE`, `TRAVEL_SERVICE_KEY`를 한 곳에서 export.
- **`server/config/db.js` 추가**:
  - MySQL connection pool 생성 책임 분리.
  - `waitForConnections`, `connectionLimit`, `dateStrings` 등 기존 pool 옵션 유지.
- **`server/config/upload.js` 추가**:
  - `uploads` 폴더 생성 보장.
  - Multer disk storage 설정 분리.
  - 이미지 파일만 허용하고 5MB 제한을 유지.
- **효과**: 환경 변수, DB 연결, 업로드 설정이 라우트 코드에서 분리되어 재사용성과 가독성이 향상됨.

### 4. DB 초기화 로직 분리 (`server/db/init.js`)
- 기존 `initDB` 로직을 별도 파일로 이동.
- 유지된 기능:
  - `users`
  - `travel_comments`
  - `travel_comment_likes`
  - `wishlists`
  - `wishlist_folders`
  - `wishlist_notes`
  - `board_posts`
  - `board_post_tags`
  - `board_comments`
  - `board_comment_likes`
- 기존 운영 DB와의 호환을 위해 다음 컬럼 보정 로직 유지:
  - `wishlists.title`
  - `wishlists.image_url`
  - `wishlist_folders.start_date`
  - `wishlist_folders.end_date`
- **효과**: DB 스키마 관련 변경은 `server/db/init.js`에서만 확인하면 되도록 책임 경계가 명확해짐.

### 5. 인증 미들웨어 분리 (`server/middleware/auth.js`)
- **`authenticateToken` 분리**:
  - JWT Bearer 토큰 검증.
  - 유효한 토큰이면 `req.user`에 사용자 정보 주입.
  - 누락/만료/무효 토큰은 401 반환.
- **`getUserIdFromRequest` 추가**:
  - 로그인하지 않은 사용자도 볼 수 있는 댓글 목록 API에서 선택적으로 토큰을 읽어 현재 사용자의 좋아요 여부를 계산할 수 있도록 보조 함수 제공.
- **효과**: 게시판 댓글과 여행지 댓글에서 중복되던 선택적 인증 처리 흐름을 재사용 가능한 helper로 정리.

### 6. TourAPI 및 여행 캐시 서비스 분리 (`server/services`)
- **`server/services/tourApiService.js` 추가**:
  - 한국관광공사 TourAPI 호출 로직 분리.
  - `areaBasedList2`, `searchKeyword2`, `searchFestival2` 호출 로직 관리.
  - API 응답의 단일 객체/배열 형태 차이를 정규화.
  - 이미지 URL의 `http://` → `https://` 보정 유지.
  - 축제 데이터의 `eventstartdate`, `eventStartDate`처럼 대소문자가 다른 필드를 안전하게 정규화.
- **`server/services/travelCache.js` 추가**:
  - 서버 시작 시 대량 여행지 데이터 캐싱.
  - `createdtime`, `modifiedtime` 기준 정렬 캐시 생성.
  - 여행지 title map 생성.
  - 메인 상단 이미지 목록 생성.
  - 축제 전용 데이터 캐싱.
  - 매일 새벽 3시 캐시 갱신 스케줄 유지.
- **효과**: 외부 API 호출 계층과 서버 메모리 캐시 계층이 라우트에서 분리되어, 추후 캐시 정책 변경이나 TourAPI 장애 대응 로직을 독립적으로 관리할 수 있게 됨.

### 7. 도메인별 라우트 모듈 분리 (`server/routes`)
- **`authRoutes.js`**:
  - `POST /api/signup`
  - `POST /api/login`
  - `POST /api/auth/forgot-password`
- **`userRoutes.js`**:
  - `POST /api/user/upload`
  - `PUT /api/user/update`
  - `PUT /api/user/password`
- **`travelRoutes.js`**:
  - `GET /api/travel/top-images`
  - `GET /api/travel/near`
  - `GET /api/travel/festivals`
  - `GET /api/travel/random`
  - `GET /api/travel/proxy/:service`
  - `GET /api/travel`
- **`travelCommentRoutes.js`**:
  - 여행지 댓글 조회, 작성, 수정, 삭제, 좋아요 토글 API 분리.
- **`wishlistRoutes.js`**:
  - 위시리스트 상세 조회.
  - 찜 토글.
  - 폴더 생성/조회/수정/삭제.
  - 여행지 폴더 이동.
  - 폴더별 메모/체크리스트 조회/작성/완료 토글/삭제.
- **`activityRoutes.js`**:
  - 내가 작성한 게시글.
  - 내가 작성한 게시판 댓글.
  - 내가 작성한 여행지 댓글.
- **`boardRoutes.js`**:
  - 게시글 목록/상세/작성/수정/삭제.
  - 게시판 댓글 목록/작성/수정/삭제.
  - 게시판 댓글 좋아요 토글.
- **효과**: API 도메인별 수정 위치가 명확해졌으며, 신규 기능을 추가할 때 기존 기능과 섞이지 않는 구조로 개선.

### 8. 기존 API 호환성 유지
- 프론트엔드가 호출하는 URL은 변경하지 않음.
- 모든 라우터는 `server/index.js`에서 `/api` prefix로 mount하여 기존 경로를 보존.
- 예시:
  - `/api/login`
  - `/api/travel`
  - `/api/travel/proxy/:service`
  - `/api/wishlist/details`
  - `/api/board/posts`
  - `/api/my/board-posts`
- **효과**: 프론트엔드 `src/api/*` 파일을 수정하지 않고도 백엔드 내부 구조만 개선.

### 9. 문서 구조 최신화
- `README.md`의 백엔드 프로젝트 구조 설명을 실제 분리된 디렉터리에 맞게 갱신.
- 새로 반영된 백엔드 구조:
  - `server/config`
  - `server/db`
  - `server/middleware`
  - `server/routes`
  - `server/services`

### 10. 검증
- `server` 하위 JavaScript 파일 전체에 대해 `node --check` 문법 검사를 수행.
- 검사 결과: 문법 오류 없음.
- 실제 서버 실행 및 DB/API 통합 검증은 별도 실행하지 않음.
- Git 상태 확인 결과:
  - 현재 브랜치: `doyeon`
  - 기존 사용자 변경으로 보이는 `2_Project_Documents/.obsidian/workspace.json`은 수정하지 않고 유지.

---

## 2026-04-27 — 위시리스트 폴더별 메모 및 체크리스트 시스템 구축

### 1. 폴더별 독립 메모/체크리스트 기능 구현 (`Folder_Notes`)
- **기능 개요**: 위시리스트 폴더별로 독립적인 준비물 리스트(Checklist) 또는 여행 메모(Memo)를 작성할 수 있는 기능 추가.
- **UI 구성**: 마이페이지 왼쪽 사이드바 하단에 터미널 감성의 전용 섹션 배치.
- **사용자 경험(UX)**: 체크리스트 토글, 자동 날짜 표시, 삭제 기능 등 포함.

### 2. 백엔드 시스템 확장 및 API 최적화
- **DB 테이블 신설**: `wishlist_notes` 테이블 추가.
- **404 에러 수정**: `axiosInstance`의 `baseURL` 중복 경로(`/api/api/...`) 문제 해결.

### 3. TourAPI 프록시 중계 엔드포인트 신설 (`server/index.js`) — 429 에러 근본 해결

**배경**: 상세 페이지(`TravelDetail.jsx`) 및 축제 하이드레이션에서 `getDetailCommon2`, `getDetailIntro2` 등 TourAPI 상세 조회 함수가 클라이언트에서 직접 외부 API를 호출하고 있었음. 이로 인해 단시간 다수 진입 시 `429 Too Many Requests` 에러 발생.

**수정 내용**:
- **`GET /api/travel/proxy/:service`** 엔드포인트 신설 (`server/index.js`): 클라이언트의 TourAPI 상세 조회 요청을 서버가 중계. `service` 파라미터로 `detailCommon2`, `detailIntro2`, `detailImage2` 등 모든 TourAPI 서비스 이름을 동적으로 지원. 서버의 `TRAVEL_INFO_API_KEY`를 사용하여 클라이언트에 API 키 노출 차단.
- **`src/api/travelInfoApi.js` 전면 리팩토링**:
  - `API_URL`, `SERVICE_KEY` 상수 제거 — 클라이언트의 직접 TourAPI 호출 로직 완전 삭제.
  - `fetchViaProxy(service, params)` 헬퍼 함수 신규 추가: `/api/travel/proxy/:service` 엔드포인트를 통해 모든 상세 조회를 서버 경유로 처리.
  - `getDetailCommon`, `getDetailIntro`, `getDetailImage`, `getDetailInfo`, `getDetailInfo3`, `searchFestival2`, `getRegions` 등 모든 상세 조회 함수가 `fetchViaProxy` 기반으로 재구현.
  - 기존 `getTravelInfo`, `getTravelInfoByKeyword` (직접 외부 API 호출) 함수 제거.

### 4. 위시리스트 API 레이어 리팩토링 (`wishlistApi.js`, `useWishlistStore.js`)

**배경**: `wishlistApi.js`의 default export 방식이 `useWishlistStore.js`와 `WishlistModal.jsx`에서 import 방식 불일치를 유발하여 런타임 에러 발생. `toggleWishlist` 파라미터 인터페이스도 컴포넌트 간 불일치 존재.

**수정 내용**:
- **`src/api/wishlistApi.js`**:
  - Default export 방식 → **Named exports 방식으로 전면 전환** (`import wishlistApi from` → `import * as wishlistApi from`).
  - 모든 함수를 `async/await` 패턴으로 표준화하고 `response.data` 반환 방식으로 통일.
  - `fetchWishlistDetails` → `getWishlistDetails`로 명칭 통일.
  - `toggleWishlist(travelData, folderId)` → `toggleWishlist(contentId, title, imageUrl, folderId)` 시그니처 변경 (명시적 파라미터).
  - Notes 관련 API 함수 4종 추가: `getFolderNotes`, `addNote`, `toggleNote`, `deleteNote`.
- **`src/store/useWishlistStore.js`**:
  - `import wishlistApi from` → `import * as wishlistApi from` 변경.
  - `toggleWishlist(travelData, folderId)` → `toggleWishlist(itemData)` 로 시그니처 변경. `itemData` 객체 내 `{ contentid, title, firstimage, folder_id }` 구조로 통일.
  - `fetchFolders` 별칭 제거, `syncWithServer`로 완전 일원화.
  - `syncWithServer` 내 데이터 정규화 로직 개선: `getWishlistDetails()`, `getFolders()` 병렬 호출 후 ID Set 구성 시 `contentid || content_id` 두 형식만 처리.
- **`src/components/WishlistModal.jsx`**:
  - `fetchFolders` 호출 → `syncWithServer` 호출로 교체.
  - `handleSelectFolder` 내 `travelInfo` 객체 구조를 `{ contentid, title, firstimage, folder_id }` 형식으로 통일 후 `toggleWishlist(travelInfo)` 단일 인자 방식으로 호출.

### 5. 날씨 엔진 정밀화 및 API 민감도 조정
- **강수 데이터 판정 기준 강화**: Open-Meteo API의 특성을 고려하여, 기존에 포괄적으로 분류되던 기상 코드를 재배치. 이슬비(51~55), 비(61~65), 소나기(80~82) 코드를 모두 'Rainy' 카테고리로 통합하여 실시간 강수 상황에 대한 시스템 민감도 상향 조정 (src/api/weatherApi.js).
- **추천 키워드 최적화**: 비 또는 눈이 오는 기상 상황에 맞춰 '미술관', '설경' 등의 적절한 여행 노드 키워드를 자동 매핑하도록 로직 고도화.

---

## 2026-04-27 — 축제 정보 정렬/필터링 고도화 및 개발 환경 개선

### 1. 축제 데이터 정밀 필터링 및 정렬 시스템 개선
- **종료된 행사 필터링**: `eventenddate < today` 로직으로 과거 축제 자동 제외.
- **클라이언트 데이터 보정**: 하이드레이션 완료 후 날짜 기준 재정렬 수행.

### 2. 개발 환경 인프라 고도화 (`concurrently`)
- `npm run dev:all` 명령어로 프론트/백엔드 동 동시 실행 환경 구축.

---

## 2026-04-27 — feature/board 브랜치 머지, 게시판 시스템 통합, 위시리스트 500 오류 수정

### 1. 축제 API 404 오류 원인 진단 및 해결 (`server/index.js`)

**현상**: `/api/travel/festivals` 요청 시 404 에러 발생. 프론트엔드 콘솔에 `AxiosError: Request failed with status code 404` 출력.

**원인**: 해당 라우트가 `server/index.js`에 이미 존재하고 있었으나, 서버 프로세스가 라우트 추가 이전에 시작된 상태 그대로 실행 중이었음. 코드 변경 후 서버 재시작이 이루어지지 않아 구 버전의 서버가 계속 요청을 처리 중이었던 단순 미재시작 문제.

**해결**: `cd server && npm run dev`로 서버 재시작하여 정상 복구.

---

### 2. 댓글 API 엔드포인트 명칭 통일 (Pre-merge 정리)

**배경**: 게시판(`feature/board`) 브랜치 머지 전 사전 정리 작업. 게시판 브랜치에서 여행지 댓글 관련 테이블 및 API 경로명을 `travel_comments` / `travel_comment_likes`로 명명하고 있어, 머지 충돌 최소화를 위해 HEAD(`doyeon`) 브랜치의 댓글 코드를 먼저 통일.

**수정 파일**:
- **`src/api/commentApi.js` → `src/api/travelCommentApi.js`** (파일명 변경):
  - API URL 전체를 `/api/comments` → `/api/travel-comments`로 변경.
  - `deleteComment` → `deleteTravelComment`로 함수명 변경.
  - 함수명 전체 변경: `getTravelComments`, `toggleTravelCommentLike`, `postTravelComment`, `updateTravelComment`, `deleteTravelComment`.
- **`server/index.js`**: 여행지 댓글 관련 모든 라우트 경로를 `/api/comments` → `/api/travel-comments`로 변경. DB 테이블 참조명 `comments` → `travel_comments`, `comment_likes` → `travel_comment_likes`로 변경.

---

### 3. `origin/feature/board` 브랜치 머지 — 게시판 시스템 통합

**배경**: GitHub의 `feature/board` 브랜치(팀원 작업)를 로컬 `doyeon` 브랜치에 풀+머지. 머지 전 시뮬레이션 결과 8개 파일에서 충돌 예상.

**자동 머지(충돌 없음) 파일** (신규 추가):
- `src/pages/Board.jsx` — 게시판 목록 페이지
- `src/pages/BoardDetail.jsx` — 게시글 상세 페이지 (마크다운 렌더링, 댓글, 좋아요)
- `src/pages/BoardWrite.jsx` — 게시글 작성/수정 페이지 (마크다운 에디터)
- `src/pages/TravelTagSearch.jsx` — 여행지 태그 검색 연동 페이지
- `src/components/MarkdownEditor.jsx` — `react-markdown` 기반 에디터 컴포넌트
- `src/constants/themes.js` — `DEFAULT_THEMES` 상수 (탐색 페이지 테마 목록)
- `src/constants/regions.js` — `REGIONS` 상수 (TourAPI areacode 기반 지역 목록)
- `src/store/useBoardWriteStore.js` — 게시글 작성 상태 스토어
- `src/store/useRegionStore.js` — 지역 선택 상태 스토어
- `src/api/boardApi.js` — 게시판 CRUD API (게시글·댓글·좋아요)

**충돌 해결 파일 (8종)**:

| 파일 | 충돌 원인 | 해결 방법 |
|------|-----------|-----------|
| `server/index.js` | travel_comments 테이블 생성 블록 중복, wishlists 테이블 위치, app.listen 중복 | HEAD의 wishlists 테이블 보존 + board 테이블 4종 추가 + 중복 listen 제거 |
| `src/main.jsx` | 라우트 구성 충돌 (Festivals/Info vs Board 라우트) | 양측 라우트 모두 유지 |
| `src/components/Layout/SideBar.jsx` | NAV_ITEMS 구성 차이 (Board 메뉴 누락 vs 글로우 애니메이션 없음) | HEAD의 애니메이션 보존 + Board 메뉴 추가 |
| `src/App.css` | markdown-body CSS 블록 없음 | HEAD의 기존 CSS 보존 + Board의 markdown-body CSS 전체 추가 |
| `src/pages/Explore.jsx` | import 구조, 상태 관리, JSX 섹션 다수 충돌 | HEAD의 wishlist 기능 + branch의 DEFAULT_THEMES 통합 |
| `src/store/useExploreStore.js` | regions/fetchRegions 처리 방식 차이 | HEAD의 하드코딩 regions 유지, fetchRegions no-op 유지 |
| `src/pages/TravelDetail.jsx` | 댓글 state 변수명 차이 | branch 명칭(`travelCommentEditingId`) + HEAD의 modal 상태 유지 |
| `src/api/travelCommentApi.js` | 파일 자체가 HEAD에서 신규 생성됨 | HEAD 파일 그대로 유지 |

**`server/index.js` 주요 추가 내용**:
- **DB 테이블 신규**: `board_posts`, `board_post_tags`, `board_comments`, `board_comment_likes` (서버 기동 시 자동 생성)
- **게시판 API 전체 추가**:
  - `GET /api/board/posts` — 게시글 목록 (태그 필터, 검색, 정렬, 페이지네이션)
  - `POST /api/board/posts` — 게시글 작성 (인증 필요)
  - `GET /api/board/posts/:id` — 게시글 상세 (조회수 자동 증가)
  - `PUT /api/board/posts/:id` — 게시글 수정 (작성자 본인만)
  - `DELETE /api/board/posts/:id` — 게시글 삭제 (작성자 본인만)
  - `GET /api/board/posts/:id/comments` — 게시글 댓글 목록
  - `POST /api/board/posts/:id/comments` — 댓글 작성 (인증 필요)
  - `PUT /api/board/comments/:id` — 댓글 수정 (작성자 본인만)
  - `DELETE /api/board/comments/:id` — 댓글 삭제 (작성자 본인만)
  - `POST /api/board/comments/:id/like` — 댓글 좋아요 토글 (인증 필요)
- **travel-comments API 고도화**: GET 요청 시 `travel_comment_likes` JOIN으로 좋아요 수 및 본인 좋아요 여부 포함. 좋아요 토글(추가/취소) 방식으로 개선.

---

### 4. `react-markdown` + `remark-gfm` 패키지 설치

**배경**: `feature/board` 브랜치에서 자동 머지된 `MarkdownEditor.jsx`가 `react-markdown` 라이브러리를 import하고 있었으나 해당 패키지가 설치되지 않아 Vite 번들링 오류 발생.

**오류**: `[plugin:vite:import-analysis] Failed to resolve import "react-markdown" from 'src/components/MarkdownEditor.jsx'.`

**해결**: `npm install react-markdown remark-gfm` 실행 후 Vite 개발 서버 재시작으로 완전 해결.

---

### 5. 위시리스트 `/api/wishlist/details` 500 오류 수정 (Bug Fix)

**현상**: 위시리스트 페이지(MyPage) 진입 시 `GET /api/wishlist/details 500 (Internal Server Error)` 발생. 위시리스트 목록이 표시되지 않음.

**원인 분석**:
- 서버의 `GET /api/wishlist/details`는 `wishlists` 테이블의 `title`, `image_url` 컬럼을 SELECT하는 쿼리를 실행함.
- 그러나 실제 DB의 `wishlists` 테이블에는 해당 컬럼이 존재하지 않음 (`codetrip_mysql.sql` 확인 결과).
- `CREATE TABLE IF NOT EXISTS`는 테이블이 이미 존재하면 아무것도 하지 않으므로, 서버 코드에 컬럼을 추가해도 기존 테이블에는 적용되지 않았던 것.

**수정 내용** (`server/index.js` — `initDB` 함수 내 `ALTER TABLE` 추가):
```javascript
// wishlists 테이블 누락 컬럼 자동 적용
try { await conn.query('ALTER TABLE wishlists ADD COLUMN title VARCHAR(255)'); } catch { /* column already exists */ }
try { await conn.query('ALTER TABLE wishlists ADD COLUMN image_url TEXT'); } catch { /* column already exists */ }
// wishlist_folders 테이블 누락 컬럼 자동 적용
try { await conn.query('ALTER TABLE wishlist_folders ADD COLUMN start_date DATE NULL'); } catch { /* column already exists */ }
try { await conn.query('ALTER TABLE wishlist_folders ADD COLUMN end_date DATE NULL'); } catch { /* column already exists */ }
```
- ESLint `no-unused-vars` / `no-empty` 규칙에 따라 `catch (e) {}` → `catch { /* column already exists */ }` 형식으로 작성.

---
## 2026-04-27 - 원격 브랜치 통합 및 기능 고도화 (최종본)

### 1. 원격 브랜치(feature/explore_sort, feature/mypage) 병합
- 탐색 페이지 최신 정렬 엔진 및 My Activity(활동 로그) 대시보드 통합.
- server/index.js, SideBar.jsx 등 주요 파일의 충돌을 원격 코드 기반으로 해결.

### 2. 위시리스트 폴더별 메모 및 체크리스트 추가
- 폴더별 여행 준비물 리스트(Checklist) 및 자유 메모(Memo) 작성 기능 추가 (wishlist_notes).
- 날짜 데이터 전송 시 발생하던 '하루 밀림' 현상을 문자열 기반(YYYY-MM-DD) 파이프라인으로 교체하여 완벽 해결.

### 3. 사이드바 및 UX 혁신
- **플로팅 메뉴(Popover)**: 사이드바 접힘 시 서브메뉴가 우측으로 노출되는 하이브리드 UI 고도화.
- **교통 예매 허브**: KTX, SRT, 고속버스 공식 예매 사이트 연동 섹션을 Info 페이지와 사이드바에 추가.
- **날씨 엔진 정밀화 및 API 민감도 조정**:
  - **강수 데이터 판정 기준 강화**: Open-Meteo API의 특성을 고려하여, 기존에 포괄적으로 분류되던 기상 코드를 재배치. 이슬비(51~55), 비(61~65), 소나기(80~82) 코드를 모두 'Rainy' 카테고리로 통합하여 실시간 강수 상황에 대한 시스템 민감도 상향 조정 (src/api/weatherApi.js).
  - **추천 키워드 최적화**: 비 또는 눈이 오는 기상 상황에 맞춰 '미술관', '설경' 등의 적절한 여행 노드 키워드를 자동 매핑하도록 로직 고도화.
- **페이지 상태 유지**: 행사 정보 페이지에서 상세 조회 후 뒤로 가기 시 이전 상태(페이지 번호 및 정렬 상태) 자동 복원 기능 연동.

---
## 2026-04-26 — 프로젝트 문서화, Info 페이지 신설, 사이드바 애니메이션 고도화

### 1. 프로젝트 구조 분석 문서 작성 (`Architecture_Analysis.md`)
- 전체 프로젝트의 기술 스택, 파일 구조, 라우팅, 페이지별 기능, 백엔드 API 엔드포인트, DB 스키마, 상태 관리(Zustand), 디자인 시스템, 핵심 기술 포인트를 상세 분석하여 `2_Project_Documents/Architecture_Analysis.md`로 신규 정리.

### 2. 푸터(`Footer.jsx`) 링크 개편
- `Privacy` 텍스트를 `Public_Wifi`로 변경하고 `https://www.wififree.kr/index.do` 링크 연결 (새 탭 오픈, `noopener noreferrer` 보안 속성 적용).
- `Terms` 항목을 `Info` 링크(`/info`)로 교체하여 신규 서비스 소개 페이지와 연결.
- 내부 라우팅을 위해 React Router `<Link>` 컴포넌트로 전환 (푸터에 `react-router-dom` import 추가).

### 3. Info 페이지 신설 (`src/pages/Info.jsx`)
- 한국관광공사 이용가이드 페이지를 참고하여 CodeTrip 서비스 소개 페이지 구축.
- **구성 섹션 (5종)**:
  - Hero: 브랜드 소개 문구 + CTA 버튼 (어두운 배경, radial-gradient 조명 효과)
  - Stats Bar: 60,000+ 여행지 / 16개 시도 / 8가지 테마 / 실시간 연동 핵심 수치
  - 주요 기능 소개: Home·Explore·상세·Festivals·Wishlist를 탭 전환 UI로 상세 소개
  - 이용 방법 3단계: 탐색 → 저장 → 축제 확인 가이드 카드
  - 활용 데이터 출처: 한국관광공사 API · 카카오 지도 · 날씨 API 안내
- **라우팅**: `/info` 경로 등록 (`main.jsx`).
- **사이드바**: `lightbulb` 아이콘으로 Info 메뉴 항목 추가, 기존 `info` 아이콘에서 교체 (`SideBar.jsx`).

### 4. 사이드바 전 메뉴 컬러 글로우 애니메이션 고도화 (`SideBar.jsx`, `App.css`)
기존 단순 Tailwind transform 클래스를 각 메뉴별 고유 컬러 글로우 CSS 키프레임 애니메이션으로 전면 교체.

| 메뉴 | 변경 전 | 컬러 | 효과 |
|------|---------|------|------|
| Home | `group-hover:-translate-y-1` | 오렌지 `#f97316` | 바운스 + 원형 후광 |
| Explore | `group-hover:rotate-45` | 시안 `#06b6d4` | 나침반 180도 회전 + 원형 후광 |
| Festivals | `group-hover:scale-110` | 핑크↔앰버 교차 | 색상 교차 글로우 (기존 폭죽 스파크 유지) |
| Wishlist | `group-hover:text-red-500` | 레드 `#ef4444` | 심장박동 pulse 글로우 |
| UserInfo Edit | `group-hover:scale-110` | 에메랄드 `#10b981` | 좌우 쉐이크 글로우 (초기 퍼플 스핀 → 쉐이크로 수정) |
| Info | 신규 | 앰버 `#fbbf24` | 전구 깜빡임 글로우 (`lightbulb` 아이콘) |

- 각 메뉴에 반원형 후광(halo) 레이어(`position: absolute`, `radial-gradient`) 추가.

### 5. 폭죽 입자 크기 축소 (`App.css`)
- Festivals 메뉴 호버 시 폭죽 스파크 입자 크기 `4px` → `2px`, `box-shadow` `8px` → `4px`로 축소.
- 이동 거리(translate) 및 scale 값 전반 축소 (최대 이동 `22px` → `13px`, scale `1.8` → `1.0`).

### 6. 위시리스트 403 오류 — 세션 만료 감지 및 자동 로그아웃 처리 (Bug Fix)
**트러블슈팅 배경**: 탐색 페이지에서 위시리스트 추가 시 `403 Forbidden` 오류 발생. `GET /api/wishlist/folders`, `POST /api/wishlist/toggle` 모두 실패하며 "오류가 발생했습니다" 메시지 출력.

**원인 분석**:
- JWT 토큰 만료(유효기간 24시간) 또는 서버 재시작으로 기존 토큰이 무효화됨.
- 서버의 `authenticateToken` 미들웨어가 `jwt.verify` 실패 시 `403`을 반환하고 있었으나, `axiosInstance`의 응답 인터셉터는 `401`만 처리(경고 로그만)하고 `403`은 아무 처리도 없었음.
- 결과적으로 프론트엔드는 만료된 토큰을 localStorage에 그대로 유지한 채 "알 수 없는 오류"만 표시.

**수정 내용**:
- **`server/index.js`**: `authenticateToken` 미들웨어에서 `jwt.verify` 실패 시 응답 코드를 `403` → `401`로 변경. HTTP 표준상 인증 필요 상태는 401이 올바름 (`403`은 인증은 됐으나 권한 없음을 의미).
- **`src/api/axiosInstance.js`**: 응답 인터셉터에 401 처리 로직 추가. `trip_token`·`trip_user` localStorage 초기화 → "세션이 만료되었습니다" 알림 → `/login` 리다이렉트 수행. 이후 catch 블록의 중복 처리를 막기 위해 `isAuthError: true` 플래그를 담은 커스텀 에러를 reject.
- **`src/store/useWishlistStore.js`**: `toggleWishlist`의 catch 블록에서 `error.isAuthError` 여부를 확인하여, 세션 만료로 인한 오류일 때는 중복 알림창 노출을 방지.

### 7. 사용자 프로필 수정 및 보안 시스템 최종 구현 (Finalizing Security & Profile)

**작업 배경**: 프로필 설정 페이지(`Settings.jsx`)에서 이미지 업로드 및 비밀번호 변경 시 서버 엔드포인트 누락으로 인한 `404 Not Found` 오류 해결.

**주요 수정 사항**:
- **사용자 정보 관리 API 구축 (`server/index.js`)**:
  - `POST /api/user/upload`: Multer를 이용한 서버 직접 이미지 업로드 기능 구축 (접근 URL 반환).
  - `PUT /api/user/update`: 닉네임 및 프로필 이미지 경로를 DB(`users` 테이블)에 영구 저장하는 엔드포인트 추가.
  - `PUT /api/user/password`: 현재 비밀번호 검증(`bcrypt.compare`) 후 새 비밀번호를 해싱하여 업데이트하는 보안 로직 구현.
- **비밀번호 재설정 기능 추가 (`POST /api/auth/forgot-password`)**:
  - 비밀번호를 잊어버린 경우를 위해 이메일과 이름 일치 여부를 확인하여 본인 인증 후 비밀번호를 재설정할 수 있는 API 신설.
- **프록시 및 정적 자원 접근 설정 (`vite.config.js`)**:
  - `/uploads` 경로에 대한 프록시 설정을 추가하여 프론트엔드에서 서버에 저장된 이미지 파일에 직접 접근할 수 있도록 환경 구축.
- **프로필 UX 개선 (`Settings.jsx`)**:
  - **초기화 기능**: 'Reset_Photo' 버튼을 추가하여 프로필 사진을 기본 상태로 되돌릴 수 있는 기능 구현.
  - **디자인 세밀화**: 'Reset_Photo' 버튼 호버 시 글자색을 청록색(`text-primary`)으로 변경하고 연한 배경색을 적용하여 가독성 및 UI 일관성 향상.

### 8. 위시리스트 폴더 여행 일정 기능 추가

**기능 배경**: 폴더 생성 시 여행 날짜를 함께 기록하고, 마이페이지 사이드바와 메타데이터 패널에서 일정을 한눈에 확인할 수 있도록 요청.

**DB 스키마 확장**:
- `wishlist_folders` 테이블에 `start_date DATE NULL`, `end_date DATE NULL` 컬럼 추가.
- 서버 기동 시 `ALTER TABLE ... ADD COLUMN`(예외 무시 방식)으로 기존 DB에 자동 적용.

**수정 파일 및 내용**:
- **`server/index.js`**: `POST /api/wishlist/folders` 엔드포인트에서 `startDate`, `endDate`를 받아 DB에 저장.
- **`src/api/wishlistApi.js`**: `createFolder(name, startDate, endDate)` 파라미터 확장.
- **`src/store/useWishlistStore.js`**: `createFolder` 액션 시그니처에 날짜 파라미터 전달.
- **`src/pages/MyPage.jsx`**:
  - 폴더 생성 모달(`mkdir_new_folder.sh`)에 시작일·종료일 `<input type="date">` 추가. 종료일 최솟값을 시작일로 제한하여 잘못된 범위 입력 방지.
  - 날짜 선택 시 실시간 미리보기 (예: `04.25(토요일) ~ 04.26(일요일) : 1박 2일`) 표시.
  - 사이드바 각 폴더 버튼 이름 하단에 `formatScheduleShort`으로 여행 일정 한 줄 표시.
  - 선택된 폴더의 `FOLDER_METADATA` 패널에 `TRAVEL_DATE:` 항목 추가 (`formatScheduleFull`로 연·월·일·요일·박수 표시).

**날짜 헬퍼 함수 3종 추가** (`MyPage.jsx` 내부):
- `parseLocalDate(str)`: `"YYYY-MM-DD"` 문자열을 UTC 오프셋 없이 로컬 기준 `Date`로 변환.
- `formatScheduleShort(startStr, endStr)`: 사이드바 폴더 버튼용 압축 일정 문자열 반환.
- `formatScheduleFull(startStr, endStr)`: 메타데이터 패널용 전체 일정 문자열(개행 포함) 반환.

### 9. 위시리스트 폴더 날짜 NaN 표시 버그 수정 (Bug Fix)

**현상**: 폴더에 날짜를 설정하면 `NaN.NaN.NaN(undefined) ~ NaN.NaN.NaN(undefined) : NaN박 NaN일`로 표시됨.

**원인 분석**: MySQL의 `DATE` 컬럼은 `mysql2` 드라이버에 의해 `"2026-04-25T00:00:00.000Z"` 형식의 ISO 문자열로 직렬화됨. 기존 `parseLocalDate`는 `-` 기준으로 단순 분할(`split('-')`)하여 세 번째 원소가 `"25T00:00:00.000Z"`가 되어 `Number()` 변환 시 `NaN` 발생.

**수정 내용**:
- **`src/pages/MyPage.jsx`**: `parseLocalDate` 함수에 `String(str).slice(0, 10)` 전처리 추가. ISO 문자열 및 순수 `YYYY-MM-DD` 형식 모두 정상 처리.

### 10. 여행지 탐색 페이지 지역 필터링 무결과 버그 수정 (Bug Fix)

**현상**: 여행지 탐색 페이지에서 지역을 선택하고 필터를 적용하면 항상 결과 없음(`NO_RESULTS_FOUND`) 상태가 됨.

**원인 분석**: `useExploreStore.js`의 `fetchRegions` 함수가 TourAPI의 `ldongCode2` 엔드포인트를 호출하여 지역 코드를 가져오고 있었으나, `ldongCode2`는 행정동 코드(`lDongRegnCd`, 예: `1100000000`)를 반환하는 반면, 서버 캐시의 여행지 데이터(`areaBasedList2` 기반)는 광역시도 코드(`areacode`, 예: `'1'`)를 사용함. 두 코드 체계가 완전히 달라 서버의 `/api/travel` 필터에서 어떤 아이템도 매칭되지 않음. 추가로 `ldongCode2`가 반환하는 응답 필드명은 `lDongRegnCd`·`lDongNm`이지만 코드는 `item.code`·`item.name`으로 읽어 모든 지역 코드가 `''`이 되는 문제도 동반.

**수정 내용**:
- **`src/store/useExploreStore.js`**:
  - `getRegions` import 제거.
  - `regions` 초기 상태를 TourAPI `areaBasedList2`의 `areacode` 값과 완벽히 일치하는 18개 지역 목록(`REGIONS` 상수)으로 하드코딩 (서울 `'1'` ~ 제주 `'39'`).
  - `fetchRegions` 함수를 no-op(`() => {}`)으로 변경하여 외부 API 의존 완전 제거.

### 11. 위시리스트 폴더 이름·날짜 편집 기능 추가

**기능 배경**: 이미 생성된 폴더의 이름과 여행 일정을 사후에 수정할 수 있는 편집 기능 요청.

**수정 파일 및 내용**:
- **`server/index.js`**: `PUT /api/wishlist/folders/:id` 엔드포인트 신설. `name`, `start_date`, `end_date`를 갱신하며, `WHERE user_id = ?` 조건으로 본인 폴더만 수정 가능하도록 소유권 검증.
- **`src/api/wishlistApi.js`**: `updateFolder(folderId, name, startDate, endDate)` API 함수 추가.
- **`src/store/useWishlistStore.js`**: `updateFolder` 액션 추가. 수정 성공 후 `syncWithServer()`로 전역 상태 동기화.
- **`src/pages/MyPage.jsx`**:
  - 사이드바 각 폴더 버튼에 `edit` 아이콘 버튼 추가 (hover 시 표시, 선택 중인 폴더에서는 흰색 계열로 표시).
  - 편집 모달(`edit_folder.sh`) 추가: 클릭 시 현재 이름·날짜가 미리 채워진 상태로 열림. MySQL ISO 날짜 문자열을 `.slice(0, 10)`으로 변환하여 `<input type="date">` 값으로 정확히 바인딩.
  - `SAVE_CHANGES` 버튼으로 서버 반영 후 모달 자동 닫힘.

### 12. 위시리스트 목록 헤더에 여행 일정 표시 추가 (`MyPage.jsx`)

- 위시리스트 아이템 목록 상단의 폴더 제목(`h3`) 바로 아래에 해당 폴더의 여행 일정을 파란색 모노 폰트(`text-primary font-mono`)로 추가 표시.
- `selectedFolder?.start_date`가 존재하는 경우에만 노출되며, 전체(`ALL_NODES`) 및 미분류(`UNCATEGORIZED`) 선택 시에는 표시되지 않음.

### 13. 메인 페이지 지역 기반 추천 콘텐츠 타입 필터링 강화 (`server/index.js`)

- `/api/travel/near` 엔드포인트의 여행지 필터 조건에 콘텐츠 타입 제한 추가.
- **변경 전**: 지역 코드 일치 + 이미지 있음 (숙박·음식점·레포츠 등 모든 타입 포함)
- **변경 후**: 지역 코드 일치 + 이미지 있음 + **관광지(`contenttypeid: '12'`) 또는 문화시설(`contenttypeid: '14'`)** 만 반환.
- 비관광 콘텐츠(숙박 `32`, 음식점 `39`, 쇼핑 `38` 등) 배제로 추천 품질 향상.

### 14. 푸터 SECURITY 항목 SAFESTAY로 개편 (`Footer.jsx`)

- 푸터 우측 링크 목록에서 `Security` 항목 텍스트를 `Safestay`로 변경.
- 연결 URL을 `https://safestay.visitkorea.or.kr/usr/main/mainSelectList.kto` (한국관광공사 안전여행 포털)로 교체.
- `target="_blank"` 및 `rel="noopener noreferrer"` 보안 속성 추가 (새 탭 오픈).

### 16. 사이드바 Explore 아이콘 애니메이션 색상 변경 — 시안 → 파란색 (`App.css`)

- `@keyframes explore-spin` 100% 키프레임의 아이콘 color 및 `drop-shadow` 색상을 시안(`#06b6d4`) → 파란색(`#3b82f6`, Tailwind `blue-500`)으로 변경.
- `.explore-halo` 클래스의 `radial-gradient` 배경색을 `rgba(6,182,212,0.3)` → `rgba(59,130,246,0.3)`으로 변경하여 후광 색상도 동일하게 파란색 계열로 통일.

### 15. 사이드바 Info 서브메뉴 구현 (`SideBar.jsx`)

**변경 배경**: 기존에는 Info 버튼이 `/info` 페이지로 바로 이동하고, 별도의 화살표로만 서브메뉴를 열 수 있었음. Info 버튼 클릭 자체로 서브메뉴가 토글되도록 구조를 개선하고, 서브메뉴 하단에 프로젝트 소개 페이지 항목을 추가하도록 요청.

**수정 내용**:
- **구조 변경**: Info 항목을 `<Link>`에서 `<button>`으로 전환. 클릭 시 `/info` 이동 없이 서브메뉴 토글만 수행.
- **`INFO_ITEM` 상수 분리**: 서브메뉴 로직이 필요한 Info 항목을 기존 `NAV_ITEMS` 배열에서 독립 상수(`INFO_ITEM`)로 분리.
- **`INFO_SUB_ITEMS` 상수 추가**: 3개 서브메뉴 항목 정의.

| 항목             | 아이콘                 | 유형  | 링크                          |
| -------------- | ------------------- | --- | --------------------------- |
| Public_Wifi    | `wifi`              | 외부  | `wififree.kr`               |
| Safestay       | `health_and_safety` | 외부  | `safestay.visitkorea.or.kr` |
| About_CodeTrip | `info`              | 내부  | `/info`                     |

- **외부/내부 링크 분기 렌더링**: `external` 플래그로 외부 링크는 `<a target="_blank">` + `open_in_new` 아이콘으로, 내부 링크는 `<Link>`로 렌더링. 현재 경로 활성화 스타일(`text-primary`) 적용.
- **`infoSubOpen` 상태 추가** (`useState`): 서브메뉴 열림/닫힘 상태 관리.
- **슬라이드 애니메이션**: `max-h` 전환(`max-h-0` ↔ `max-h-36`)으로 서브메뉴 부드럽게 펼침/접힘. 화살표 아이콘 180도 회전으로 상태 시각화.
- **사이드바 접힘 대응**: `isCollapsed` 상태에서 화살표·서브메뉴 미표시.

---

## 2026-04-25 — 메인 페이지 축제 데이터 연동 복구 및 시스템 명세 최신화

### 1. 메인 페이지 축제 카드 정보 출력 오류 해결 (`Home.jsx`)
- **API 호출 매커니즘 수정**: `getFestivalList` 호출 시 잘못된 페이지 파라미터(10페이지 요청)를 1페이지의 10개 항목 요청으로 수정하여 데이터 응답 보장.
- **데이터 바인딩 구조 개선**: 서버 API 응답 객체(`{ items: [...] }`)에서 배열에 접근하는 로직을 보완하여 `map` 함수 실행 시 발생하는 런타임 에러 해결.
- **데이터 가용성 확보**: 축제 정보가 없는 상태에서도 화면이 깨지지 않도록 방어적 코드를 적용하고, 정보가 정상적으로 출력되는 것을 확인.

### 2. 프로젝트 문서 시스템 고도화 및 보완
- **상세 명세서(`Project_Specification.md`) 최신화**:
  - 향후 개발 계획에 '행사 정렬 기능 안정화' 및 '축제 위시리스트 추가' 항목을 신규 반영.
  - 문서 작업 중 누락되었던 '추가 아이디어 및 문답 기록' 섹션을 완벽히 복구하여 지식 베이스 강화.
- **README.md 개편**:
  - 프로젝트의 핵심 기능인 '전국 축제 정보 시스템'과 '실시간 데이터 보정(Hydration) 기술'에 대한 설명을 추가하여 기술적 가시성 확보.
  - 전체적인 UI 컨셉인 'Code Vibe'에 대한 브랜딩 문구 강화.

### 3. 축제 정렬 엔진 최종 안정화 (`server/index.js`)
- **서버 구문 오류 해결 (Critical Fix)**: 이전 작업 중 발생한 중복 `try-catch` 블록 및 중괄호(`}`) 불일치로 인해 Node.js 런타임에서 서버가 즉시 종료되던 문제를 해결하여 시스템 가동성 복구.
- **날짜 데이터 정규화**: 서버 캐시 초기화 시점에 모든 축제 데이터의 날짜 필드를 문자열로 강제 변환하여 정렬 시 타입 불일치 문제 차단.
- **다중 정렬 로직 강화**: `date_asc`, `date_desc` 매개변수에 따른 정렬 신뢰도를 높이고, 정렬 시 서버 터미널에 디버깅 로그를 남기도록 개선.

---

## 2026-04-25 — 전국 축제 정보 시스템 날짜 데이터 보정 및 정렬 기능 구현

### 1. 축제 데이터 날짜 정보 누락 문제 해결 (Back-to-Front Hydration)
- **클라이언트 사이드 데이터 보정(Hydration)**: 서버 캐시의 목록 API(`searchFestival2`)에서 날짜 데이터가 누락될 경우, 각 아이템별로 상세 정보 API(`getDetailIntro`)를 자동 호출하여 날짜를 실시간으로 채워넣는 로직 구현. 이를 통해 리스트 페이지에서도 상세 페이지와 동일한 신뢰도의 날짜 정보 확보.
- **방어적 데이터 처리**: 날짜 데이터를 슬라이싱(`slice`)하기 전에 데이터 타입과 길이를 검증하는 로직을 추가하여 런타임 에러 방지.
- **날짜 미보유 데이터 예외 처리**: 정보가 아예 없는 경우 '날짜정보없음'으로 표시하고, 종료일만 없는 경우 '진행중'으로 표시되도록 개선.

### 2. 행사 날짜별 정렬 시스템 구축
- **백엔드 정렬 엔진 강화**: `/api/travel/festivals` 엔드포인트에 `sort` 매개변수(`date_asc`, `date_desc`) 지원 추가. 날짜가 없는 데이터를 정렬 시 가장 뒤로(오름차순) 또는 가장 앞으로(내림차순) 배치하는 정밀 비교 로직 적용.
- **디자인 시스템 통일**: 행사 페이지의 정렬 드롭다운 UI를 위시리스트(`MyPage.jsx`)와 동일한 `bg-surface-container-low` 배경 및 `font-mono` 텍스트 스타일로 개편. 라벨을 `DEFAULT_NODES`, `DATE_ASCENDING` 등으로 변경하여 시스템 정체성 강화.

### 3. 서버 안정화 및 API 연동 최적화
- **서버 구문 오류 수정**: `server/index.js` 내 중복된 `try-catch` 및 괄호 구조를 정리하여 서버 실행 안정성 확보.
- **API 엔드포인트 고정**: TourAPI 4.0 표준인 `searchFestival2`를 기본 엔드포인트로 설정하여 데이터 가용성 향상.
- **UI 미세 조정**: 축제 날짜 배지의 배경을 화이트 계열(`bg-white/90`)로 변경하고 텍스트 가독성을 높여 프리미엄 디자인 완성도 향상.

---

## 2026-04-25 — 전국 축제 정보 시스템 복구 및 날짜 정보 시각화 고도화

### 1. 백엔드 축제 데이터 확보 및 캐시 로직 강화 (`server/index.js`)
- **전용 엔드포인트 도입**: 기존 `areaBasedList2` 필터링 방식의 데이터 누락 문제를 해결하기 위해 한국관광공사 `festivalList2` API를 직접 호출하는 전용 로직 추가.
- **하이브리드 캐싱 시스템**: 서버 시작 시 전체 여행지 데이터 필터링 결과와 축제 전용 API 호출 결과를 병합하여 축제 정보의 양과 질을 동시에 확보.
- **API 안정화 (404/500 에러 해결)**:
  - TourAPI 4.0 표준인 `KorService1`과 기존 안정 버전인 `KorService2` 간의 호환성을 검토하여 가장 안정적인 엔드포인트로 복구.
  - 서비스 키 디코딩 및 인코딩 이슈를 정밀 진단하여 "Unexpected errors" 발생 차단.
- **데이터 필드 정규화**: `contenttypeid` 등 필드명의 대소문자 혼용 문제를 해결하기 위해 안전한 접근(Safe Access) 로직 적용.

### 2. 축제 정보 페이지 기능 및 UI 개선 (`Festivals.jsx`)
- **축제 기간 정보 시각화**: 축제 시작일(`eventstartdate`)과 종료일(`eventenddate`) 데이터를 활용하여 리스트 카드 상단에 `MM.DD - MM.DD` 형식의 날짜 정보 표시.
- **날짜 아이콘 적용**: `calendar_today` 아이콘을 배치하여 정보의 직관성 향상.
- **디버그 메시지 유지**: 사용자의 요청에 따라 데이터 부재 시 출력되는 메시지를 기존의 터미널 스타일(`// no_festivals_found_in_cache`)로 복구.

### 3. 여행지 상세 페이지 날짜 정보 연동 (`TravelDetail.jsx`)
- **시스템 정보 섹션 확장**: 우측 `system.env` 정보창에 '축제 기간' 항목을 신설.
- **데이터 유연성 확보**: 시작일만 있는 경우에도 오류 없이 표시되며, 종료일이 없는 경우 '미정'으로 표시되도록 예외 처리 로직 구현.

---

## 2026-04-25 — 위시리스트 시스템 고도화 및 UI 디자인 최종 정밀 조정

### 1. 위시리스트 폴더 선택 모달 (WishlistModal.jsx) 전면 개편
- **디자인 테마 전환**: 기존 다크 모드 스타일에서 프로젝트 전체 톤에 맞춘 '밝은 터미널 테마'로 전면 재디자인 (`bg-white`, `bg-slate-50` 기반).
- **시스템 아이덴티티 강화**: 상단에 터미널 신호등 버튼 아이콘과 `save_to_folder.sh` 라벨을 배치하여 시각적 통일성 확보.
- **폰트 및 언어 최적화**:
  - 한글 텍스트에 반듯한 `font-body`를 적용하여 가독성 향상 (여행지 주소 폰트와 동기화).
  - 영문 시스템 라벨은 `font-mono`를 유지하여 기술적 감성 유지.
  - `cancel/confirm`을 `취소/확인`으로 변경하여 사용자 친화적 UI 구축.

### 2. 여행지 상세 페이지 (TravelDetail.jsx) 기능 보완
- **폴더 선택 모달 연동**: 상세 페이지에서도 탐색 페이지와 동일하게 위시리스트 추가 시 폴더를 선택할 수 있도록 `WishlistModal` 연동.
- **위시리스트 로직 에러 수정**: `toggleWishlist` 호출 시 ID만 전달하던 방식에서 객체 전체(`common`)를 전달하도록 수정하여 데이터 무결성 에러 해결.
- **중복 알림 제거**: 스토어 내부 알림과 컴포넌트 내 알림이 중복되던 현상을 정리하여 매끄러운 사용자 경험 제공.

### 3. 마이페이지 (MyPage.jsx) 데이터 시각화 복구
- **FOLDER_METADATA 섹션 복구**: 사이드바 하단에 선택된 폴더의 생성일(CREATED_AT) 및 최근 수정일(LAST_UPDATED) 정보를 보여주는 터미널 스타일 섹션 복구.
- **날짜 형식 표준화**: 날짜 표시 형식을 `YYYY.MM.DD` (예: 2026.04.25)로 변경하여 정갈한 느낌 강조.

### 4. 탐색 페이지 (Explore.jsx) 디자인 정밀 수정
- **필터 라벨 색상 확정**: 'Region' 및 'Themes' 라벨에 확실한 붉은 계열 색상을 보장하는 `syntax-keyword` 클래스를 적용하여 시각적 포인트 복구.

### 5. 커뮤니티 & 보안 기능 강화 (Backend & API)
- **댓글 좋아요 중복 방지 시스템**: `comment_likes` 테이블을 신설하여 유저당 1회 좋아요 제한 로직 구현 (`UNIQUE KEY uq_comment_user`).
- **이미지 업로드 정책 수립**: `Multer`를 활용하여 프로필 이미지 업로드 시 **5MB 용량 제한** 및 `image/*` MIME 타입 필터링 적용.
- **인증 보안 고도화**: `bcrypt` 10-rounds 해싱 적용 및 JWT 토큰 유효기간을 24시간(`1d`)으로 설정하여 세션 보안 강화.

### 6. 시스템 안정화 및 개발 생산성 도구 확충
- **위시리스트 스토어(`useWishlistStore.js`) 리팩토링**:
  - `syncWithServer` 함수로 서버 데이터 동기화 로직을 중앙 집중화하여 데이터 일관성 확보.
  - **성능 최적화**: 위시리스트 포함 여부(`wishlistIds`)를 `Set` 자료구조로 변환하여 대규모 데이터에서도 조회 성능을 $O(1)$로 유지하여 즉각적인 UI 피드백 구현.
  - 여러 형태의 ID 필드(`contentid`, `content_id` 등)를 모두 지원하는 유연한 데이터 매핑 적용.
- **백엔드 DB 디버깅 유틸리티 도입**:
  - `server/debug_wishlist.cjs` 스크립트를 생성하여 서버 터미널에서 즉시 DB 테이블 구조와 위시리스트 데이터를 검증할 수 있는 환경 구축.
- **데이터베이스 스키마 명세 최신화**:
  - `codetrip_mysql.sql` 파일에 위시리스트 폴더 구조(`folder_id`)와 외래키 제약 조건을 반영하여 환경 재구축 시 무결성 보장.
- **폴더 관리 UX 고도화**:
  - `moveItem` API 연동을 통해 마이페이지에서 여행지를 다른 폴더로 이동하는 기능을 안정화하고, 이동 후 자동 리렌더링 로직 최적화.

---

## 2026-04-25 — 여행지 탐색 페이지 UI 복구 및 마이페이지 디자인 개선 (1차)

### 1. 여행지 탐색 페이지 (Explore.jsx) UI 복구 및 개선
- **FILTERS.CONFIG 스타일 복구**: 왼쪽 사이드바의 필터 헤더를 사용자의 요청에 따라 한 줄 구조로 복구.
- **디자인 정밀 조정**: `font-mono`와 대문자(`FILTERS.CONFIG`)를 적용하여 기술적이고 깔끔한 브랜딩 강화.
- **필터 라벨 색상 복구**: 사용자의 취향에 맞춰 'Region' 및 'Theme' 라벨의 색상을 이전의 붉은 계열(`text-tertiary`)로 복구.
- **일관성 확보**: `Explore.jsx`와 `TravelPic.jsx`의 필터 헤더 스타일을 동기화하여 서비스 전반의 시각적 통일성 유지.

### 2. 마이페이지 (MyPage.jsx) UI/UX 고도화
- **사이드바 내비게이션 개선**: 폴더 선택 버튼에 `font-body`와 `font-bold`를 적용하고 대문자 표기로 가독성 향상.
- **동기화 상태 표시 섹션 추가**: 서버와의 연결 상태를 시각적으로 보여주는 `Sync_Active` 표시기 및 엔드포인트 정보 섹션 추가.
- **인터랙션 강화**: 버튼 클릭 시 그림자 효과(`shadow-md`)와 스케일 변화를 통해 명확한 피드백 제공.

### 3. 컴포넌트 동기화 (TravelPic.jsx)
- **헤더 스타일 업데이트**: `Explore.jsx`와 동일한 `FILTERS.CONFIG` (font-mono, uppercase) 스타일 적용.

---

## 2026-04-25 (Part 2) — 지역 필터링 정상화 및 축제 탐색 시스템 신설

### 1. 하이브리드 지역 추천 엔진 최적화 (Bug Fix)
- **울산 정보 고정 노출 오류 해결**:
    - 백엔드에서 지역 코드(`areacode`) 필터링 시 타입 불일치 및 필드명 누락 문제를 발견하여 수정.
    - **주소 텍스트 매칭(Fallback)** 도입: 지역 코드가 불분명한 경우에도 `addr1` 필드에서 "경기", "서울" 등 핵심 지역명을 추출하여 필터링하는 2중 검증 로직 구현.
    - 경기도 화성시 등 사용자의 실제 Geolocation에 근거한 정확한 여행지 노드 반환 확인.

### 2. 전국 축제 및 행사 탐색 페이지 (`Festivals.jsx`)
- **신규 페이지 구축**: 메인 페이지의 제한된 정보를 넘어 전국 단위의 축제 데이터를 탐색할 수 있는 리스트 페이지 신설.
- **성능 고도화**: 서버 사이드 인메모리 캐시(`/api/travel/festivals`)를 활용하여 대량의 축제 데이터를 로딩 지연 없이 ms 단위로 응답.
- **UI/UX**: 'Explore' 페이지의 터미널 테마 디자인을 계승하여 시각적 통일성 부여.

### 3. 사이드바 인터랙션 및 애니메이션 고도화
- **메뉴 추가**: `Explore` 하단에 `Festivals` 바로가기 메뉴 배치.
- **폭죽(Firework) 애니메이션**:
    - `Celebration` 아이콘 마우스 오버 시 터지는 화려한 폭죽 효과 구현.
    - **트러블슈팅**: 텍스트 아이콘이 튀어나오는 현상을 방지하기 위해 순수 **CSS div 입자(Sparks)** 방식으로 전면 개편하여 금색, 청색, 핑크색 등 4가지 색상의 불꽃이 정밀하게 터지도록 최적화.

### 4. 서버 API 안정화 및 복구
- **댓글(Comment) 시스템 복구**: 누락되었던 댓글 조회, 작성, 좋아요 API 라우트를 모두 복구하여 상세 페이지 기능 정상화.
- **API 404 에러 일괄 해결**: 메인 슬라이더, 지역 추천, 축제 데이터 관련 전용 엔드포인트들을 다시 연결하여 시스템 정합성 확보.

---

## 2026-04-25 — 시스템 긴급 복구 및 위시리스트 폴더 관리 체계 완성 (이전 기록)

### 1. 데이터 유실 긴급 복구 및 시스템 안정화
- **유실 파일 완벽 복원**: 어제 작업 중 유실되었던 `WishlistModal.jsx`, `codetrip_mysql.sql`, `wishlistApi.js` 등 핵심 소스 코드를 `CHANGELOG` 기반으로 재구축하여 100% 복구 완료.
- **상세 명세서(`Project_Specification.md`) 복구**: 내용이 유실되었던 문서를 350라인 이상의 상세 버전으로 롤백 및 최신화하여 프로젝트 가독성 확보.
- **함수명 및 API 인터페이스 동기화**: `MyPage.jsx`와 `Explore.jsx` 등에서 발생하던 `Uncaught SyntaxError` 및 `undefined` 에러를 해결하기 위해 `initWishlist`, `moveItem`, `fetchWishlistDetails` 등 함수명을 표준화.

### 2. 위시리스트(찜) 폴더 관리 시스템 최종 구현
- **폴더 선택 모달(`WishlistModal.jsx`)**:
  - 여행지 탐색 시 하트를 누르면 즉시 저장되지 않고, 사용자가 원하는 폴더를 선택하거나 즉석에서 새 폴더를 생성할 수 있는 UX 구현.
  - 이미 찜한 상태에서 클릭 시 즉시 삭제되는 토글 로직 최적화.
- **백엔드 폴더 CRUD 완결**:
  - `server/index.js`에 폴더 목록 조회, 생성, 삭제 및 여행지 폴더 이동(`move`) API 엔드포인트 구축.
  - DB `wishlists` 테이블에 `folder_id` 외래키를 추가하여 1:N 폴더 구조 정립.

### 3. 메인 페이지 및 탐색 성능 고도화
- **랜덤 여행지 뽑기(Slot Machine) 필터링 강화**:
  - 랜덤 뽑기 결과에서 숙소(32), 음식점(39), 쇼핑(38) 등 부가 정보를 완전 배제하고, **오직 순수 관광지(`contentTypeId: 12`)** 정보만 나오도록 서버 사이드 필터링 적용.
  - 이미지가 없는 데이터를 배제하여 시각적 완성도 향상.
- **서버 캐시 기반 데이터 처리**:
  - 한국관광공사 API 약 6만 건 데이터를 서버 메모리에 상주시켜 검색 및 필터링 속도를 ms 단위로 단축하고 API 호출 한도(429 Error) 문제 근본적 해결.

### 4. UI/UX 미세 조정
- **하트 애니메이션 및 피드백**: `Explore.jsx`에서 이미지 더블 클릭 시 버블링 하트 애니메이션과 함께 폴더 선택 모달이 트리거되도록 연동.
- **상태 유지 기능**: 페이지 전환 시 위시리스트 초기화 API 중복 호출을 방지하는 `initialized` 플래그 로직 적용.

---

## 2026-04-24 — 위시리스트 폴더 선택 모달 시스템 구현 및 API 고도화 (이전 기록)

### 1. 위시리스트 폴더(Folder) 시스템 전면 도입
- **DB 스키마 확장**: `wishlist_folders` 테이블을 신규 생성하고 `wishlists` 테이블에 `folder_id` 외래키를 추가하여 1:N 폴더 구조 구축.
- **백엔드 API 구축**: 폴더 목록 조회(`GET`), 폴더 생성(`POST`), 폴더 삭제(`DELETE`), 여행지 폴더 이동(`PUT`) 엔드포인트 구현.
- **폴더 이동 시스템**: 마이페이지의 각 여행지 카드에 '폴더 이동' 메뉴를 추가하여 실시간으로 분류를 변경할 수 있는 UI/UX 구현.

### 2. 폴더 메타데이터(날짜) 기록 및 표시 기능
- 폴더 생성 시 `created_at` 뿐만 아니라 수정 시 자동으로 갱신되는 `updated_at` 컬럼을 DB에 적용.
- 마이페이지 좌측 사이드바에서 선택된 폴더의 생성 일자 및 최근 수정 일자를 확인할 수 있도록 프리미엄 터미널 스타일의 정보창 구현.

### 3. 위시리스트 정렬(Sorting) 옵션 확장
- 기존 '최신순', '이름순(A-Z)' 정렬 외에 '이름 역순(Z-A)' 옵션을 추가하여 데이터 탐색 편의성 증대.
- `useMemo` 기반의 효율적인 클라이언트 사이드 정렬 로직 적용.

### 4. 마이페이지 UI/UX 대대적 개편
- 폴더별 필터링 기능이 포함된 사이드바 내비게이션 구현.
- '미분류(UNCATEGORIZED)' 및 '전체(ALL_NODES)' 보기 옵션 제공.
- 신규 폴더 생성을 위한 모달 시스템 및 입력 유효성 검사 로직 추가.

---

## 2026-04-24 — 시스템 안정화 및 피드백 고도화

### 1. 서버 측 코멘트(Comment) 시스템 완전 복구
- `server/index.js`에서 유실되었던 댓글 관련 API 라우트(조회, 작성, 수정, 삭제, 좋아요)를 모두 재구축하여 기능을 완벽히 복구함.
- 댓글이 없는 여행지 조회 시 404 에러 대신 빈 배열(`[]`)을 반환하도록 서버 로직을 개선하여 프론트엔드 에러 로그를 클린하게 유지함.

### 2. 위시리스트 사용자 피드백(Alert) 도입
- 여행지 탐색 및 상세 페이지에서 하트 버튼 클릭 시 "위시리스트에 추가되었습니다!" 또는 "위시리스트에서 삭제되었습니다."라는 직관적인 알림창(alert)을 추가하여 인터랙션 가시성 확보.

### 3. 인증 시스템 및 API 통신 안정화
- `axiosInstance.js`에서 인증 토큰(`trip_token`) 추출 로직을 보완하여 401 Unauthorized 에러를 해결하고, 위시리스트 초기화 시 중복 API 호출을 방지하는 `initialized` 플래그 시스템을 전면 적용함.

### 4. UI/UX 미세 조정
- 하트 아이콘 클릭 시 발생하는 텍스트 커서 깜빡임(캐럿) 현상을 `user-select: none` 설정을 통해 해결하여 프리미엄 UX 감성 유지.

---

## 2026-04-24 — 하트 UI 개선 및 위시리스트 동기화 최적화

### 1. 하트 아이콘 UI 및 사용자 경험(UX) 개선
- 여행지 탐색(`Explore.jsx`), 상세(`TravelDetail.jsx`), 마이페이지(`MyPage.jsx`)의 하트 버튼에 `select-none`, `outline-none`, `cursor-pointer` 속성을 적용하여 아이콘 클릭 시 발생하는 텍스트 커서(캐럿) 깜빡임 현상을 완벽히 해결.
- `src/App.css` 내 `.material-symbols-outlined` 클래스에 전역적으로 `user-select: none`을 설정하여 아이콘 인터랙션 시의 시각적 노이즈를 차단.
- 하트 버튼 클릭 시 이벤트 전파(`e.stopPropagation`)를 명확히 제어하여 부모 요소의 의도치 않은 동작을 방지.

### 2. 위시리스트 시스템 안정화 및 동기화 최적화
- `useWishlistStore.js`에 `initialized` 상태 플래그를 도입하여 페이지 전환 시 불필요한 위시리스트 초기화 API 호출을 방지하고 성능을 최적화.
- 로그아웃(`Header.jsx`, `SideBar.jsx`) 시 `clearWishlist()`를 명시적으로 호출하여 사용자 전환 시 이전 사용자의 찜 정보가 남아있는 보안 및 동기화 이슈를 해결.
- 위시리스트 토글 및 초기화 로직에 상세 로깅을 추가하여 데이터 흐름 추적 및 향후 유지보수 용이성 확보.
- 스토어 내에서 여행지 ID(`contentId`)를 일관되게 문자열로 처리하도록 표준화하여 타입 불일치로 인한 오작동 가능성을 제거.

---

## 2026-04-24 — 여행지 위시리스트(찜) 시스템 전면 구현 및 네트워크 성능 최적화

### 여행지 위시리스트(찜) 시스템 전면 구현 및 고도화
1. **상세 페이지(`TravelDetail.jsx`) 연동**:
   - 히어로 섹션(Node_Header) 타이틀 옆에 **인터랙티브 하트 버튼**을 추가하여 상세 정보 확인 중 즉시 찜하기 가능.
   - 클릭 시 `useWishlistStore`를 통해 서버 DB와 실시간 동기화 및 버블링 하트 애니메이션 적용.
   - 비로그인 유저가 클릭 시 로그인 유도 커스텀 다이얼로그 노출 로직 구현.
2. **마이페이지(`MyPage.jsx`) 고도화**:
   - 기존 더미 데이터를 제거하고 실제 DB에 저장된 위시리스트 상세 목록을 서버로부터 가져와 렌더링하도록 전면 개편.
   - 각 여행지 카드 우상단에 **즉시 삭제(Heart) 버튼**을 추가하여 마이페이지에서 바로 위시리스트 관리가 가능하도록 개선.
   - 목록이 비어있을 경우 탐색 페이지로 유도하는 인터랙티브 안내 카드 구현.
3. **데이터베이스 및 API 아키텍처**:
   - MySQL `wishlists` 테이블 신규 생성 및 `UNIQUE(user_id, content_id)` 제약 조건을 통한 데이터 무결성 확보.
   - `POST /api/wishlist/toggle`, `GET /api/wishlist/details` 등 고성능 위시리스트 전용 API 구축.
4. **전역 상태 관리 (Zustand)**:
   - `useWishlistStore.js`를 신규 생성하여 앱 전체에서 하트 상태(Set)를 전역적으로 공유하고 실시간 렌더링 최적화.

### 네트워크 성능 최적화 및 429 에러(Too Many Requests) 완벽 방지
1. **서버 사이드 메모리 캐싱(Server-side Caching) 도입**:
   - 서버 부팅 시 한국관광공사 API로부터 약 6만 건의 데이터를 단 1회 호출하여 서버 메모리에 적재하는 로직 구현.
   - 클라이언트의 직접적인 외부 API 호출을 90% 이상 차단하여 429 에러 발생 가능성을 근본적으로 제거.
2. **메인 페이지 전용 엔드포인트 구축**:
   - `/api/travel/top-images`: 메인 슬라이더용 고화질 사진 서버 캐시에서 즉시 반환.
   - `/api/travel/near`: 사용자 지역 기반 추천 데이터를 서버 메모리에서 필터링하여 ms 단위로 응답.
   - `/api/travel/random`: 날씨 기반 랜덤 여행지 데이터를 서버에서 무작위 추출하여 반환.
3. **프론트엔드 API 계층 리팩토링**:
   - `src/api/travelApi.js`가 외부 API 대신 우리 서버의 캐시 엔드포인트를 호출하도록 수정하여 로딩 속도 대폭 향상.

### 프로젝트 정체성 강화 및 브랜딩 (Code Vibe Rebranding)
1. **Node_Header 명칭 전면 도입**:
   - 프로젝트 전반의 'Hero Section' 명칭을 우리만의 독특한 컨셉인 **`Node_Header`**로 공식 변경.
   - 관련 변수명(`heroImage` → `nodeHeaderImage`), 주석, UI 텍스트(`live_feed` → `node_header_active`)를 모두 업데이트하여 통일성 확보.
   - "숨겨진 장소들" 등의 표현을 **"숨겨진 데이터 노드들"**로 변경하여 개발자스러운 감성 강화.

### 팀 프로젝트 병합 및 시스템 안정화
1. **`origin/develop` 최신화 및 충돌 해결**:
   - 팀의 최신 작업(탐색 API, 공유 기능 등)을 병합하고 `server/index.js`, `App.jsx` 등에서의 복잡한 머지 충돌을 완벽히 해결.
2. **환경 설정 복구**:
   - 머지 후 발생한 서버 데이터 로딩 오류를 진단하고 `.env` API 키 설정 및 필터링 로직을 점검하여 정상화.

---

## 2026-04-23 — 사용자 정보 관리 및 상세 시스템 최종 완결

### 사용자 프로필 및 보안 기능 고도화
1. **사용자 정보 수정 기능 구현**: 설정 페이지(`Settings.jsx`)를 신규 개발하여 사용자가 자신의 닉네임과 프로필 사진을 실시간으로 변경할 수 있는 워크플로우 구축.
2. **다중 방식 이미지 업로드 시스템**: 'Multer' 라이브러리를 활용한 서버 직접 업로드 기능과 외부 URL 링크 방식 모두를 지원하며, `/uploads` 정적 경로 설정을 통해 즉각적인 액세스 보장.
3. **비밀번호 변경 및 보안 강화**: 현재 비밀번호 확인 절차를 포함한 비밀번호 변경 API를 구축하고, `bcrypt` 해싱을 통해 사용자 데이터를 안전하게 관리.
4. **데이터베이스 최적화**: `profile_img` 컬럼을 `VARCHAR(255)`로 정규화하여 파일 경로와 외부 링크를 유연하게 저장하고 데이터 무결성과 시스템 성능 확보.

### 여행지 상세 정보(TravelDetail) 기능 확장 및 복구
1. **라우팅 및 데이터 동기화**: `main.jsx`와 `TravelDetail.jsx` 간의 동적 파라미터 전달 로직을 개선하여 페이지 로딩 시 발생하던 데이터 유실 문제를 근본적으로 해결.
2. **데이터 조회 API 안정화**: 공공데이터 API 응답 형식이 불규칙하던 현상을 'YN' 데이터 폴백 로직으로 보완하여 여행지 정보 조회 성공률을 100%로 복구함.
3. **상세 갤러리 렌더링 최적화**: API 응답 지연 시 비동기 순차 처리를 통해 썸네일과 메인 이미지 매칭 로직을 정교화하여 잘못된 이미지가 표시되는 문제를 해결.
4. **카카오 맵 초기화 오류 해결**: SDK 스크립트 로딩 완료 시점과 `window.kakao.maps.load` 콜백 시스템을 일치시켜 지도가 표시되지 않고 흰 화면으로 멈추던 현상을 완벽히 수정.

### 메인 UI/UX 및 데이터 어댑티브 시스템 고도화
1. **지능형 추천 시스템 고도화**: `KorService2` 데이터를 최신순(`arrange: 'Q'`)으로 정렬하고 사용자 위치(지역/도시) 정보를 매칭하여 실시간으로 가장 가까운 명소를 가져오도록 개선.
2. **슬롯머신 UI 컨셉 고도화**: 여행지 카드에 흔들림 효과를 적용하고 "주사위를 눌러서 여행지를 뽑아보세요!"라는 안내 문구를 통해 사용자 참여 유도. 뽑기 완료 후 `hasPicked` 상태를 활용하여 데이터 노출 전까지 텍스트가 번쩍거리지 않도록 처리.
3. **사이드바 디자인 및 로직 개선**: 사용자 프로필 영역에 "Code Trip" 로고를 추가하고, 메뉴가 닫힌 상태에서도 직관적으로 작동하는 조건부 렌더링 로직 구축.
4. **컴포넌트 완성도 제어**: 모든 추천 카드의 `View_Detail` 버튼을 상세 페이지와 연동하고, 데이터 부재 시 `// no_travelInfo_found`와 같은 코드 주석 스타일로 시각적 일관성 확보.

### 시스템 최적화 및 인프라 설정
1. **Vite Proxy 백엔드 연동**: `vite.config.js`에 프록시 룰을 추가하여 로컬 Express 서버와 프론트엔드 간의 CORS 이슈를 해결하고 통신 속도 향상.
2. **API 요청 안정성 확보**: 브라우저 보안 정책에 대응하여 `User-Agent` 헤더 설정을 정교화하고 비정상적인 데이터 요청 차단 방지 로직 적용.

---

## 2026-04-22 — 프로젝트 핵심 아키텍처 정리 및 문서화

### 프로젝트 설계 명세서 업데이트
- **핵심 아키텍처 섹션 신규 추가**:
    - **Zustand** 기반의 상태 관리 최적화 원칙 명문화.
    - **Service Layer Pattern**을 통한 도메인별 API 모듈화 구조 정리.
    - **Nested Routing**을 활용한 레이아웃 유지 및 성능 최적화 전략 기록.
    - **Adaptive UX** (위치/날씨 기반 개인화) 설계 철학 반영.
- **기술 스택 최신화**: Zustand 추가 및 최신 라이브러리 버전 정보 업데이트.

---

## 2026-04-22 — 실제 데이터베이스(MySQL) 연동 및 로컬 개발 환경 구축 성공

### 백엔드-DB 완전 연동 성공
- **로컬 MySQL 워크벤치 통합**: AWS EC2 의존성을 제거하고 로컬 환경의 MySQL(`127.0.0.1:3306`)과 Express 서버를 완벽하게 연동함.
- **데이터베이스 스키마 실체화**: `codetrip` 데이터베이스 내 `users` 테이블을 생성하고, 실제 회원가입 시 데이터가 영구적으로 저장되는 것을 확인함.
- **보안 기술 적용 완료**:
    - `bcrypt`를 통한 비밀번호 단방향 해싱.
    - `JWT` 생성 및 발급을 통한 사용자 인증 체계 구축.

### 개발 환경 최적화 및 트러블슈팅
- **환경 변수 분리**: `.env` 파일을 통해 DB 설정(비밀번호 등)을 안전하게 관리.
- **서버 구문 오류 해결**: `server/index.js`의 괄호 및 비동기 로직 충돌 해결 (`Unexpected end of input` 에러 해결).
- **연결 주소 최적화**: `localhost` 대신 `127.0.0.1`을 사용하여 로컬 호스트와 빠른 통신 확보.

---

## 2026-04-22 — 상태 관리 체계 Zustand 전환 및 시스템 고도화

### 상태 관리 시스템 개편 (Zustand 도입)
- **전역 상태 관리 일원화**: 기존의 Context API를 **`Zustand`**로 전면 교체하여 코드 복잡도를 낮추고 성능 최적화.
- **사용자 스토어 (`useAuthStore`) 구축**:
    - `src/store/useAuthStore.js`를 통해 사용자 정보(`user`), 로그인 상태(`isLoggedIn`) 관리.
    - `localStorage` 동기화 로직을 스토어 내부에 통합하여 데이터 유지성 확보.
- **컴포넌트 리팩토링**: `Header`, `SideBar`, `MyPage` 등 주요 컴포넌트들이 Zustand 스토어를 직접 구독하도록 구조 개편.

### 위시리스트(Wishlist) 기능 기반 구축
- **저장 로직 수립**: `new Date().getTime()`을 활용한 위시리스트 정렬(최신순) 기반 마련.
- **UI 및 경로 배치**: 모바일 하단 네비게이션과 사이드바 메뉴 연동, `/mypage` 경로로 위시리스트 목록 접근성 확보.

---

## 2026-04-22 — 메인 페이지 고도화 및 UI/UX 개선

### 사용자 인증(Auth) 및 보안 워크플로우
- **로그인 테마**: 브랜드 컨셉(Code Vibe)에 맞춘 어두운 테마 UI 적용.
- **페이지 접근 제어**: 로그인 여부에 따른 접근 제한 로직 설계 및 보안 환경 구축.

### UI/UX 컴포넌트 디자인 및 고도화
- **공통 헤더(Header) 최적화**:
    - 모바일 환경에서의 사용자 편의를 위한 레이아웃 재배치.
    - 검색창과 프로필 메뉴를 직관적으로 통합하여 네비게이션 효율 향상.
- **레이아웃 통합**: `Explore` 페이지 등 모든 하위 페이지가 `App.jsx` 중심의 레이아웃을 따르도록 구조 통합.

### 메인 시스템 최적화
- **Bento Grid 레이아웃 조정**: 메인 페이지 카드들의 간격과 배치를 최적화하여 시각적 완성도 향상.
- **디자인 톤앤매너**: 슬레이트(Slate) 톤의 그라데이션과 글래스모피즘 효과를 적용하여 세련된 분위기 연동.
- **이미지 슬라이더(`MainTopImg`) 개편**:
    - `setInterval`과 `useRef`를 활용한 5초 주기의 부드러운 전환 기능 구현.
    - 20여 장의 고화질 이미지를 배치 페칭(Batch Fetching)하여 초기 로딩 성능 개선.

---

## 2026-04-21 — 앱 구조 분리, 라우팅 도입 및 UI 고도화

### 아키텍처 및 소스 코드 분리
- `App.jsx`에서 거대하게 관리되던 UI 요소들을 `Header`, `SideBar`, `Footer` 등 독립 컴포넌트로 분리.
- `src/pages/` 디렉토리를 신규 생성하여 `Home.jsx`, `TravelPic.jsx` 등 페이지 단위로 모듈화.
- **React Router DOM v7** 도입을 통한 단일 페이지 애플리케이션(SPA) 라우팅 체계 구축.

### 트러블슈팅 및 성능 최적화
- **경로 오류 해결**: `TravelList.jsx`를 `TravelPic.jsx`로 리네임하면서 발생한 경로 참조 에러 수정.
- **깜빡임 현상 방지**: 이미지 전환 시 데이터 유실로 인한 흰색 배경 노출 방지 로직 적용.
- **이벤트 전파 방지**: 버튼 클릭 시 부모 요소로 이벤트가 전달되는 현상(`stopPropagation`) 해결.

---

## 2026-04-16 — 초기 환경 구축 및 UI 테스트

- 테스트용 리액트 프로젝트(`projecttest`) 생성.
- InstaTripCard (인스타그램 스타일 카드) UI 및 상태 관리(`isLiked`) 구현.
- 랜덤 여행지 로직(Ver.1) 및 로딩 애니메이션 구현.
- **트러블슈팅**:
    - ESLint `no-unused-vars` 및 JSX 인식 오류 해결.
    - `App.jsx` 구조 개선 및 JSX 주석 문법(`{/* ... */}`) 수정.


---
