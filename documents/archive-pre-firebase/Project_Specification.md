# 프로젝트 상세 명세서 — CodeTrip

> 현재 구현 상태 기준의 스냅샷 문서입니다.
> 날짜별 변경 이력은 [CHANGELOG.md](CHANGELOG.md)를 참고하세요.

---
## 0. 프로젝트 히스토리 및 개발 개요
본 문서는 프로젝트의 초기 설정부터 현재 `CodeTrip` 시스템으로 발전하기까지의 모든 과정을 기록합니다.

---
## 1. 프로젝트 개요: CodeTrip
- **프로젝트 명**: CodeTrip (Vibe Board + Tour Info)
- **목적**: 프리미엄 디자인이 적용된 현대적인 CRUD 게시판 시스템 및 관광 정보 서비스 구축
- **현상태**:
	- 위시리스트 폴더 관리 시스템 및 전용 모달 인터페이스 구현 완료.
	- 서버 사이드 인메모리 캐싱을 통한 성능 최적화 및 429 에러 해결.
	- 메인 페이지 랜덤 뽑기 필터링 고도화(순수 관광지만 추출).
	- 전국 여행지 탐색 및 상세 페이지 통합 완료.
	- 프로젝트 소개 Info 페이지 신설 및 사이드바 전체 아이콘 hover 애니메이션 고도화 완료.
	- 위시리스트 폴더 여행 일정(시작일·종료일) 설정·표시·편집 기능 완료.
	- 탐색 페이지 지역 필터링 코드 정합성 수정(TourAPI areacode 하드코딩).
	- 메인 페이지 지역 기반 추천 관광지·문화시설 한정 필터링 적용.
	- **[2026-04-27]** `feature/board` 브랜치 머지 완료: 게시판(CRUD), 마크다운 에디터, 여행지 태그 검색 시스템 통합.
	- 댓글 API를 `travel-comments`로 명칭 통일.
	- 위시리스트 500 오류(DB 컬럼 누락) 수정.
	- 위시리스트 폴더별 메모/체크리스트(LIST/MEMO) 기능 구축 완료.
	- **[2026-04-27]** 백엔드 모듈화 리팩터링 완료: `server/config`, `server/db`, `server/middleware`, `server/routes`, `server/services` 디렉터리로 책임별 분리. 기존 프론트엔드 API 호출 경로 완전 유지.
	- **[2026-04-27]** My Activity 대시보드 통합 및 교통 예매 허브(KTX·SRT·고속버스 외부 예매 연동) 완료.
	- **[2026-04-28]** 날씨 엔진 고도화: Open-Meteo `current` 파라미터 전환(15분 단위 실시간), JMA 모델 적용, `cloudcover` 기반 기상 코드 보정 로직 추가.
	- **[2026-04-28]** 회원 관심 지역과 해당 지역의 현재 날씨를 반영한 메인 페이지 즉흥 여행지 랜덤 추천 기능 추가. 관심 지역 미설정 회원은 기본 지역으로 폴백하고, 비회원은 전국 랜덤 미리보기 흐름을 유지.
	- **[2026-04-28]** 최근 본 여행지(`recently_viewed.log`) 가로 스크롤 카드 섹션 및 최근 검색어 드롭다운 UX 추가.
	- **[2026-04-29]** `recently_viewed.log` 섹션을 `MyPage`에서 `MyActivity` 페이지 상단으로 이동. 탭(LIKED POSTS·BOARD POSTS 등) 전환 시에도 항상 고정 표시되도록 탭 바 위에 배치.
	- **[2026-04-28]** 알림 시스템 구현: `notifications` DB 테이블, `notificationRoutes.js`, 헤더 알림 벨 드롭다운(읽음 처리·삭제·게시글 이동) 완료.
	- **[2026-04-28]** 게시글 좋아요 기능(`board_post_likes`), 내 활동 `LIKED POSTS` 탭, 게시글 카드 좋아요 수 표시 완료.
	- **[2026-04-28]** Settings 페이지 관심지역 설정 UI 및 `user_favorite_regions` 저장 API 완료.
	- **[2026-04-28]** Toast 시스템을 React Context(`ToastContext`) 기반 전역 단일 인스턴스로 개편. 전 페이지 서버 오류 시 토스트 알림 표시.
	- **[2026-04-29]** 프로필 사진 업로드 시 클라이언트 사이드 Canvas 압축(1MB 초과 시 JPEG 품질 조정) 적용.
	- **[2026-04-29]** Info 페이지 SRT 링크 URL 수정.

### 1.1 기술 스택 (Technical Stack)
- **Frontend**: React 19, Vite 8, Axios, Tailwind CSS v4, React Router DOM v7, Zustand
- **Backend**: Node.js (Express), MySQL (Local/AWS EC2)
- **Security**: 
    - **JWT**: 유효기간 24시간(`1d`) 설정, Authorization Header 기반 인증.
    - **Bcrypt**: 비밀번호 저장 시 10-rounds 솔팅 해시 적용.
    - **Multer Filter**: 파일 업로드 시 **5MB 용량 제한** 및 이미지 MIME 타입(`image/*`) 검증.
- **Infrastructure**: Nginx (Reverse Proxy), PM2, Vite Proxy, 서버 사이드 캐싱(In-memory Cache)
- **APIs**: 
    - 한국관광공사 KorService2 (TourAPI 4.0) — 상세 이미지, 개요, 소개 정보 등 다각화된 엔드포인트 연동.
    - wishlistApi.js — 폴더 기반 위시리스트 관리 및 아이템 이동 시스템.
    - 카카오 맵 API — 여행지 위치 시각화 및 SDK 동적 로딩.
    - Open-Meteo & Nominatim — 실시간 날씨 및 좌표 기반 지역명 변환.
    - 내부 추천 API(`/api/travel/spontaneous`) — 회원 관심 지역과 현재 날씨를 결합한 즉흥 여행지 랜덤 추천.
- **Dev Tools**: 
    - `debug_wishlist.cjs` — 위시리스트 DB 상태 즉석 검증 및 테이블 구조 확인용 CLI 유틸리티
    - `concurrently` — 프론트엔드(Vite) + 백엔드(Nodemon) 동시 실행 (`npm run dev:all`)

### 1.2 데이터베이스 스키마 (Database Schema)
- **users**: 이메일, 해시된 비밀번호, 이름, 프로필 이미지 경로.
- **user_favorite_regions**: 사용자별 관심 지역 코드 저장. 회원 맞춤 즉흥 여행지 추천에서 1차 지역 필터 기준으로 사용. *(2026-04-28 develop 병합 기능 연동)*
- **wishlist_folders**: 유저별 커스텀 폴더 (이름, 여행 시작일 `start_date DATE NULL`·종료일 `end_date DATE NULL`, 생성/수정일).
- **wishlists**: 여행지 아이템 정보 (`folder_id` 외래키를 통한 분류 관리, `UNIQUE KEY`로 중복 찜 방지, `title VARCHAR(255)`, `image_url TEXT` 포함).
- **wishlist_notes**: 폴더별 메모 및 체크리스트 (`folder_id`, `content`, `is_completed`, `type` ENUM). *(2026-04-27 신규)*
- **travel_comments**: 여행지별 독립 댓글창 (`content_id` 인덱싱). *(구: `comments` — 2026-04-27 명칭 통일)*
- **travel_comment_likes**: 여행지 댓글 좋아요 관리 (**유저당 1회 제한** 로직 적용). *(구: `comment_likes` — 2026-04-27 명칭 통일)*
- **board_posts**: 게시판 게시글 (`user_id`, `title`, `content` TEXT, `tags` JSON, `views`, `created_at`, `updated_at`). *(2026-04-27 신규)*
- **board_post_tags**: 게시글 태그 정규화 테이블 (`post_id`, `tag` VARCHAR). *(2026-04-27 신규)*
- **board_comments**: 게시판 댓글 (`post_id`, `user_id`, `content`, `created_at`). *(2026-04-27 신규)*
- **board_comment_likes**: 게시판 댓글 좋아요 (`comment_id`, `user_id`, `UNIQUE KEY`). *(2026-04-27 신규)*
- **board_post_likes**: 게시글 좋아요 (`post_id`, `user_id`, `UNIQUE KEY`로 중복 방지). *(2026-04-28 신규)*
- **notifications**: 알림 테이블 (`user_id`, `message`, `content_id`, `is_read BOOLEAN`, `created_at`). 게시글·댓글 작성 시 대상 사용자에게 자동 INSERT. *(2026-04-28 신규)*

### 1.3 개발 환경 설정 및 프로젝트 구조
프로젝트 구동을 위해 다음 환경 변수가 설정되어야 하며, 전체 파일 구조는 다음과 같습니다.

```text
2_Code_Trip/
├── server/                       # Express Backend
│   ├── .env                      # 서버 환경 변수 (DB_PASS, JWT_SECRET 등)
│   ├── index.js                  # Express 앱 조립 및 서버 시작 진입점 [2026-04-27 경량화]
│   ├── debug_wishlist.cjs        # DB 디버깅 스크립트
│   ├── config/
│   │   ├── db.js                 # MySQL connection pool [2026-04-27 신규]
│   │   ├── env.js                # 환경 변수 및 공통 상수 [2026-04-27 신규]
│   │   └── upload.js             # Multer 업로드 설정 [2026-04-27 신규]
│   ├── db/
│   │   └── init.js               # DB 테이블 생성 및 컬럼 보정 [2026-04-27 신규]
│   ├── middleware/
│   │   └── auth.js               # JWT 인증 미들웨어 [2026-04-27 신규]
│   ├── routes/
│   │   ├── activityRoutes.js     # 내 활동 API [2026-04-27 신규]
│   │   ├── authRoutes.js         # 회원가입·로그인·비밀번호 재설정 [2026-04-27 신규]
│   │   ├── boardRoutes.js        # 게시판 및 댓글 API [2026-04-27 신규]
│   │   ├── notificationRoutes.js  # 알림 조회·읽음처리·삭제 API [2026-04-28 신규]
│   │   ├── travelCommentRoutes.js # 여행지 댓글 API [2026-04-27 신규]
│   │   ├── travelRoutes.js       # 여행지·축제·TourAPI 프록시·즉흥추천 API [2026-04-27 신규]
│   │   ├── userRoutes.js         # 프로필·이미지 업로드·비밀번호 변경·관심지역 API [2026-04-27 신규]
│   │   └── wishlistRoutes.js     # 위시리스트·폴더·메모·체크리스트 API [2026-04-27 신규]
│   └── services/
│       ├── tourApiService.js     # TourAPI 호출 및 응답 정규화 [2026-04-27 신규]
│       └── travelCache.js        # 서버 메모리 캐시 및 일일 갱신 스케줄 [2026-04-27 신규]
├── src/
│   ├── api/
│   │   ├── authApi.js            # 로그인/회원가입/정보수정/관심지역 API
│   │   ├── axiosInstance.js      # 공통 Axios 설정 (인터셉터, 토큰 처리)
│   │   ├── boardApi.js           # 게시판 CRUD API (게시글·댓글·좋아요·좋아요한 게시글) [2026-04-27 통합]
│   │   ├── notificationApi.js    # 알림 조회·읽음처리·삭제 API [2026-04-28 신규]
│   │   ├── travelCommentApi.js   # 여행지 댓글/좋아요 API [2026-04-27 명칭 통일, 구: commentApi.js]
│   │   ├── travelApi.js          # 관광공사 API 연동 (서버 캐시 활용, 즉흥추천 포함)
│   │   ├── travelInfoApi.js      # 상세 여행지 정보 API
│   │   ├── weatherApi.js         # 실시간 날씨, 역지오코딩 ({ name, state } 반환)
│   │   ├── wishlistApi.js        # 폴더 및 위시리스트 관리 API
│   ├── constants/
│   │   ├── themes.js             # DEFAULT_THEMES 상수 (탐색 테마 목록) [2026-04-27 통합]
│   │   └── regions.js            # REGIONS 상수 (TourAPI areacode 기반) [2026-04-27 통합]
│   ├── context/
│   │   └── ToastContext.jsx           # 전역 단일 Toast 상태 Context Provider [2026-04-29 신규]
│   ├── hooks/
│   │   ├── useRecentSearch.js         # 최근 검색어 이력 커스텀 훅 (localStorage, 최대 5개) [2026-04-28 신규]
│   │   └── useToast.js                # ToastContext re-export (하위 호환 유지) [2026-04-29 개편]
│   ├── store/
│   │   ├── useAuthStore.js            # 사용자 인증 스토어
│   │   ├── useBoardWriteStore.js      # 게시글 작성 상태 스토어 [2026-04-27 통합]
│   │   ├── useExploreStore.js         # 여행 탐색/필터 상태 스토어 (applyFavoriteRegions·resetFilter 포함)
│   │   ├── useRecentlyViewedStore.js  # 최근 본 여행지 이력 (localStorage, 최대 10개) [2026-04-28 신규]
│   │   ├── useRegionStore.js          # 지역 선택 상태 스토어 [2026-04-27 통합]
│   │   └── useWishlistStore.js        # 위시리스트(아이템+폴더) 통합 동기화 스토어 (clearWishlist 포함)
│   ├── pages/
│   │   ├── Home.jsx              # 메인 페이지 (슬라이더, 슬롯머신)
│   │   ├── Explore.jsx           # 여행지 탐색 (필터링, 무한스크롤)
│   │   ├── Festivals.jsx         # 전국 축제 및 행사 탐색 리스트
│   │   ├── Board.jsx             # 게시판 목록 페이지 [2026-04-27 통합]
│   │   ├── BoardDetail.jsx       # 게시글 상세 (마크다운 렌더링, 댓글, 좋아요) [2026-04-27 통합]
│   │   ├── BoardWrite.jsx        # 게시글 작성/수정 (마크다운 에디터) [2026-04-27 통합]
│   │   ├── TravelTagSearch.jsx   # 여행지 태그 검색 연동 [2026-04-27 통합]
│   │   ├── TravelDetail.jsx      # 여행지 상세 (지도, 댓글, 찜)
│   │   ├── MyPage.jsx            # 위시리스트 관리 (폴더 분류, 메모/체크리스트)
│   │   ├── MyActivity.jsx        # 내 활동 대시보드 (게시글·댓글·좋아요·recently_viewed 고정) [2026-04-27 신규, 2026-04-29 recently_viewed 이동]
│   │   ├── Info.jsx              # 서비스 소개 페이지 (기능 탭, 데이터 출처)
│   │   ├── Login.jsx / SignUp.jsx # 인증 페이지
│   │   ├── ForgotPassword.jsx    # 비밀번호 재설정
│   │   └── Settings.jsx          # 프로필 수정 및 보안 설정
│   ├── components/               
│   │   ├── MarkdownEditor.jsx    # react-markdown 기반 마크다운 에디터 [2026-04-27 통합]
│   │   ├── WishlistModal.jsx     # 폴더 선택 및 생성 모달 (터미널 테마)
│   │   └── Layout/               # Header, Footer, SideBar
├── 2_Project_Documents/
│   ├── CHANGELOG.md              # 날짜별 변경 이력
│   ├── Project_Specification.md  # 프로젝트 상세 명세서
│   └── Architecture_Analysis.md  # 전체 아키텍처 분석 문서 (2026-04-26 신설)
```

---
## 2. 주요 기능 및 아키텍처

### 2.0 프로젝트 핵심 설계 철학 (Core Architecture)
본 프로젝트는 유지보수성과 확장성을 극대화하기 위해 다음과 같은 설계 원칙을 따릅니다.

1. **전역 상태 관리의 최적화 (Zustand)**:
   - 복잡한 `Context API` 대신 가볍고 빠른 `Zustand`를 도입하여 보일러플레이트를 최소화함.
   - `useAuthStore`를 통해 로그인 상태, 유저 정보 관리.
   - `useWishlistStore`를 통해 전역의 하트(찜) 상태 실시간 동기화.

2. **도메인 기반 API 레이어 분리 (Service Layer Pattern)**:
   - 모든 API 통신은 `src/api` 내의 도메인별 파일로 분리되어 컴포넌트 로직과 비즈니스 로직을 엄격히 분리함.

3. **중첩 라우팅 기반 레이아웃 구조 (Nested Routing)**:
   - `App.jsx`를 레이아웃 컨트롤러로 사용하고 `react-router-dom`의 `<Outlet />`을 사용하여 페이지 전환 최적화.

### 2.1 위시리스트 통합 관리 시스템 (Integrated Wishlist & Folder)
- **Zustand 기반 중앙 동기화**: `syncWithServer` 단일 엔드포인트를 통해 아이템 목록과 폴더 상태를 한 번에 동기화하여 UI 전역의 정합성 유지.
- **성능 최적화**: 위시리스트 등록 여부 판별 시 `Set` 객체를 활용하여 대량의 데이터에서도 즉각적인 UI 피드백 제공.
- **유연한 데이터 매핑**: 공공데이터와 자체 DB 간의 상이한 필드명(`contentid` vs `content_id`)을 스토어 계층에서 정규화하여 처리.
- **폴더 선택 모달**: 하트 버튼 클릭 시 저장할 폴더를 선택하거나 즉석에서 새 폴더를 생성할 수 있는 원스톱 워크플로우.
- **분류 관리**: '미분류' 기본 저장소와 사용자 정의 폴더 간의 자유로운 아이템 이동(`moveItem`) 지원.

### 2.2 인증 및 보안 (Authentication)
- **JWT 기반 인증**: 로그인 시 서버로부터 발급받은 토큰을 `localStorage`에 저장하여 세션 유지.
- **Remember Me**: 로그인 유지 기능을 통해 브라우저 재시작 시에도 로그인 상태 복구.
- **보안 설정**: 비밀번호 변경 시 현재 비밀번호 확인 절차 필수화, `bcrypt` 단방향 해싱 적용.

### 2.3 여행지 검색 및 필터링 (Explore System)
- **복합 필터**: 지역(Province)과 테마(ContentType)를 조합한 다중 조건 검색 지원.
- **무한 스크롤 & 페이지네이션**: 대용량 데이터를 효율적으로 렌더링하기 위한 스크롤 위치 기억 및 커스텀 페이지네이션.
- **고성능 데이터 캐싱**: 서버 기동 시 관광공사 API 데이터를 메모리에 적재하여 응답 속도 ms 단위 단축.

### 2.4 상세 정보 시각화 (Detail View)
- **Node_Header**: 여행지 상세 페이지 상단의 핵심 시각 정보 영역 (고화질 이미지 + 인터랙티브 찜 기능).
- **카카오 맵 연동**: 위도/경도 기반 실시간 지도 마커 표시 및 카카오맵 길찾기 외부 링크 연결.
- **데이터 예외 처리**: API 응답 누락 시 "no_data_found" 주석 스타일의 UI를 통한 시각적 안정성 확보.

### 2.5 커뮤니티 기능 (Community)
- **댓글(Comment) 시스템**: 각 여행지 노드(`#NODE_`)별 독립적인 댓글창 운영.
- **좋아요 인터랙션**: 댓글 좋아요 및 여행지 찜하기 기능에 마이크로 애니메이션(Bubbling Hearts) 적용.

### 2.6 지능형 어댑티브 UX
- **Geolocation & Nominatim**: 사용자 좌표를 한국어 시/도/구 단위 지역명으로 변환하여 가장 가까운 명소 실시간 추천.
- **Weather-based Random Pick**: 현재 날씨 상태(Sunny, Rainy 등)에 최적화된 키워드를 추출하여 여행지를 추천하는 슬롯머신 UI.

### 2.7 위시리스트 시스템 고도화 및 UI/UX 정밀화 (2026-04-25 추가)
- **디자인 시스템 (Design System) 확립**:
    - **Color Palette**: `syntax-keyword` (코딩창 포인트 컬러), `text-tertiary` (필터 라벨), `bg-slate-50` (프리미엄 배경).
    - **Typography**: 
        - `font-mono`: 시스템 문구, 기술적 라벨, 영어 텍스트에 적용하여 'Code Vibe' 유지.
        - `font-body`: 한글 텍스트 및 상세 주소에 적용하여 가독성과 심미성 동시 확보.
- **프리미엄 터미널 테마 UI 개편**: 
    - `WishlistModal.jsx`를 프로젝트 고유의 '밝은 터미널 테마'로 전면 재설계. 
    - 상단 신호등 아이콘 헤더 및 `save_to_folder.sh` 라벨링 적용.
- **상세 페이지(`TravelDetail.jsx`) 연동 강화**:
    - 상세 페이지에서 위시리스트 추가 시 폴더 선택 모달이 트리거되도록 사용자 경험(UX) 개선.
    - 위시리스트 토글 시 데이터 객체(`common`) 전체를 전달하는 방식으로 데이터 일관성 에러 원천 차단.
- **폴더 메타데이터 시각화**:
    - 마이페이지 사이드바에 선택된 폴더의 생성일(`CREATED_AT`) 및 최근 수정일(`LAST_UPDATED`)을 보여주는 메타데이터 섹션 구축.
    - 날짜 표시 형식을 `YYYY.MM.DD`로 표준화하여 정갈한 시스템 감성 부여.
- **필터 헤더 및 라벨 디자인 확정**:
    - `Explore.jsx`와 `TravelPic.jsx`의 필터 구성을 한 줄의 기술적 디자인으로 통일.
    - 'Region', 'Theme' 등 핵심 라벨에 `syntax-keyword` 색상을 적용하여 시각적 포인트 복원.

### 2.8 전국 축제 및 행사 시스템 고도화 (2026-04-25 추가)
- **전용 리스트 페이지(`Festivals.jsx`)**: 전국 단위의 축제 데이터를 탐색할 수 있는 리스트 UI. 각 카드 상단에 **축제 기간(`MM.DD - MM.DD`) 시각화** 및 달력 아이콘 적용 완료.
- **데이터 보정 매커니즘(Hydration)**: 목록 API에서 날짜 데이터가 누락된 경우, 개별 상세 정보를 실시간으로 조회하여 채워넣는 클라이언트 사이드 보정 로직을 통해 데이터 신뢰도 확보.
- **다중 정렬 시스템**: 사용자의 선택에 따라 'DEFAULT_NODES', 'DATE_ASCENDING', 'DATE_DESCENDING'으로 데이터를 재배열하는 기능 구현.
- **고성능 서버 사이드 캐싱**: `/api/travel/festivals` 엔드포인트를 통해 서버 메모리에 적재된 축제 데이터를 즉시 반환하며, `searchFestival2` API를 활용한 상세 정보를 포함함.
- **상세 페이지(`TravelDetail.jsx`) 연동**: 축제 정보 조회 시 `system.env` 섹션에 축제 시작일과 종료일을 자동 노출하는 어댑티브 UI 구현.
- **인터랙티브 사이드바 연동**: `Explore` 하단에 `Festivals` 메뉴를 신설하고, 마우스 오버 시 터지는 **폭죽(Firework) CSS 입자 애니메이션** 적용.

### 2.9 하이브리드 지역 및 축제 데이터 시스템 (2026-04-25 고도화)

- **이중 검증 매커니즘**: 관광공사 API의 지역 코드(`areacode`) 필터링과 주소(`addr1`) 텍스트 기반 필터링을 결합하여 데이터 누락 시에도 정확한 지역 정보 반환.
- **울산 고정 오류 해결**: 경기도 화성시 등 사용자의 실제 위치와 다른 지역(울산)이 노출되던 고질적인 필터링 오류 완벽 수정.
- **안정적인 API 폴백**: `searchFestival2` 호출 실패 시 `festivalList2`로 자동 전환하여 데이터 가용성을 유지하는 안정화 로직 적용.
- **데이터 필드 정규화**: API별 상이한 필드명(`eventstartdate`, `eventStartDate` 등)을 대소문자 구분 없이 안전하게 매핑하는 헬퍼 계층 구축.

### 2.10 서비스 소개 페이지 및 사이드바 인터랙션 고도화 (2026-04-26 추가)

- **서비스 소개 페이지(`Info.jsx`) 신설**: 한국관광공사 이용가이드 페이지를 참고하여 CodeTrip의 기능 및 데이터 출처를 한눈에 소개하는 전용 페이지 구축. 총 6개 섹션으로 구성.
    - **Hero**: 브랜드 소개 문구 + CTA 버튼 (어두운 배경, radial-gradient 조명 효과)
    - **Stats Bar**: 60,000+ 여행지 / 16개 시도 / 8가지 테마 / 실시간 연동 핵심 수치
    - **주요 기능 소개**: Home·Explore·상세·Festivals·Wishlist를 탭 전환 UI(`activeId` 상태 관리)로 상세 소개
    - **이용 방법 3단계**: 탐색 → 저장 → 축제 확인 가이드 카드
    - **활용 데이터 출처**: 한국관광공사 API · 카카오 지도 · 날씨 API 안내
    - **CTA**: 탐색 시작 및 회원가입 유도 (어두운 배경 대비 섹션)
- **라우팅 등록**: `/info` 경로를 `main.jsx`에 추가하여 내비게이션 연결 완료.
- **사이드바 메뉴별 고유 컬러 글로우 애니메이션 전면 교체** (`SideBar.jsx`, `App.css`): 기존 단순 Tailwind transform 클래스를 각 메뉴 고유의 CSS `@keyframes` 애니메이션과 반원형 후광(halo) 레이어로 전면 교체하여 프리미엄 인터랙션 확립.

| 메뉴            | 클래스명            | 컬러             | 효과                        |
| ------------- | --------------- | -------------- | ------------------------- |
| Home          | `home-glow`     | 오렌지 `#f97316`  | 바운스 + 원형 후광               |
| Explore       | `explore-spin`  | 파란색 `#3b82f6`  | 나침반 180도 회전 + 원형 후광       |
| Festivals     | `fest-glow`     | 핑크↔앰버 교차       | 색상 교차 글로우 (폭죽 스파크 유지)     |
| Wishlist      | `heart-glow`    | 레드 `#ef4444`   | 심장박동 pulse 글로우 (하트 버블 유지) |
| UserInfo Edit | `account-shake` | 에메랄드 `#10b981` | 좌우 쉐이크 + 원형 후광            |
| Info          | `bulb-flicker`  | 앰버 `#fbbf24`   | 전구 깜빡임 + 원형 후광            |

- **폭죽 입자 경량화**: Festivals 호버 시 스파크 입자를 `4px` → `2px`, `box-shadow` `8px` → `4px`로 축소하고 이동 범위를 줄여 더 정밀한 효과로 개선.
- **푸터(`Footer.jsx`) 링크 개편**: `Privacy` → `Public_Wifi`(공공 와이파이 정보 사이트, 새 탭 오픈), `Terms` → `Info`(내부 라우팅, React Router `<Link>`)로 교체.
- **아키텍처 분석 문서(`Architecture_Analysis.md`) 신설**: 전체 기술 스택·파일 구조·라우팅·백엔드 API 엔드포인트·DB 스키마·Zustand 상태 관리·디자인 시스템을 종합 정리한 참조 문서 신규 작성.
- **푸터(`Footer.jsx`) SAFESTAY 링크 개편**: `Security` 항목을 `Safestay`로 변경, 한국관광공사 안전여행 포털(`safestay.visitkorea.or.kr`) 연결, 새 탭 오픈 보안 속성 적용.
- **사이드바 Info 서브메뉴 도입** (`SideBar.jsx`): Info 버튼 클릭 시 서브메뉴 토글. 서브메뉴 항목은 Public_Wifi(외부), Safestay(외부), About_CodeTrip(내부 `/info`) 3종. 외부 링크는 `open_in_new` 아이콘 표시, 내부 링크는 활성 경로 스타일 적용. `max-h` 슬라이드 애니메이션 및 화살표 회전으로 상태 시각화.

### 2.11 위시리스트 폴더 여행 일정 시스템 및 버그 수정 (2026-04-26 추가)

#### 폴더 여행 일정 설정 기능
- **DB 스키마 확장**: `wishlist_folders` 테이블에 `start_date DATE NULL`, `end_date DATE NULL` 컬럼 추가. 서버 기동 시 `ALTER TABLE`(예외 무시)으로 기존 DB에 자동 적용.
- **폴더 생성 모달 (`mkdir_new_folder.sh`)**: 시작일·종료일 날짜 입력(`<input type="date">`) UI 추가. 종료일 최솟값을 시작일로 제한. 날짜 선택 즉시 미리보기 문자열(예: `04.25(토요일) ~ 04.26(일요일) : 1박 2일`) 실시간 렌더링.
- **사이드바 폴더 목록**: 각 폴더 이름 하단에 `formatScheduleShort` 함수로 압축 일정 문자열 표시. 선택 상태에서는 흰색 계열 텍스트로 가독성 유지.
- **FOLDER_METADATA 패널**: `TRAVEL_DATE:` 항목 추가. `formatScheduleFull`로 연·월·일·요일·박수를 개행 포함 형식으로 표시.
- **위시리스트 목록 헤더**: 선택된 폴더의 제목(`h3`) 아래 여행 일정을 파란색 모노 폰트로 추가 표시. 전체·미분류 선택 시 미노출.

#### 날짜 헬퍼 함수 (`MyPage.jsx` 내부)
| 함수 | 역할 |
|------|------|
| `parseLocalDate(str)` | ISO 문자열(`YYYY-MM-DDT...Z`) 또는 `YYYY-MM-DD` → UTC 오프셋 없는 로컬 `Date` |
| `formatScheduleShort(startStr, endStr)` | 사이드바용 압축 일정 문자열 반환 (당일치기 포함) |
| `formatScheduleFull(startStr, endStr)` | 메타데이터 패널용 전체 일정 문자열 (개행 포함) |

#### 폴더 편집 기능
- **`PUT /api/wishlist/folders/:id`** 엔드포인트 신설: `name`, `start_date`, `end_date` 업데이트. `WHERE user_id = ?` 소유권 검증.
- **`wishlistApi.js`**: `updateFolder(folderId, name, startDate, endDate)` 추가.
- **`useWishlistStore.js`**: `updateFolder` 액션 추가, 완료 후 `syncWithServer()`.
- **`MyPage.jsx`**: 사이드바 폴더에 `edit` 아이콘 추가(hover 표시). 편집 모달(`edit_folder.sh`) — 기존 값 미리채움, MySQL ISO 날짜를 `.slice(0, 10)` 변환 후 바인딩, `SAVE_CHANGES`로 반영.

#### 버그 수정

**NaN 날짜 표시 (Bug Fix)**
- **원인**: `mysql2`가 `DATE` 컬럼을 `"2026-04-25T00:00:00.000Z"` ISO 문자열로 직렬화. 기존 `split('-')` 시 세 번째 원소가 `"25T00:00:00.000Z"` → `NaN`.
- **수정**: `parseLocalDate`에 `String(str).slice(0, 10)` 전처리 추가.

**탐색 페이지 지역 필터링 무결과 (Bug Fix)**
- **원인**: `ldongCode2` API는 행정동 코드(`lDongRegnCd`, 10자리)를 반환하지만, 서버 캐시 데이터(`areaBasedList2`)는 광역시도 코드(`areacode`, 1~2자리)를 사용 — 두 체계 불일치로 필터 매칭 실패. 또한 `ldongCode2` 응답 필드명(`lDongRegnCd`)을 `item.code`로 읽어 모든 코드가 `''`이 되는 2차 문제 동반.
- **수정**: `useExploreStore.js`에서 `getRegions` import 제거. `regions` 초기값을 TourAPI `areacode` 기준 18개 지역 목록(`REGIONS` 상수)으로 하드코딩. `fetchRegions`를 no-op으로 변경.

#### 메인 페이지 지역 기반 추천 필터링 강화
- **`/api/travel/near`** 엔드포인트에 콘텐츠 타입 조건 추가: 관광지(`'12'`)·문화시설(`'14'`)만 반환. 숙박·음식점·레포츠 등 비관광 콘텐츠 배제.

### 2.12 게시판(Board) 시스템 통합 (2026-04-27 추가 — feature/board 머지)

#### 시스템 개요
`feature/board` 브랜치와의 머지를 통해 커뮤니티 게시판 기능을 전면 통합. 마크다운 기반 게시글 작성, 태그 시스템, 댓글·좋아요 상호작용을 지원하는 완결된 게시판 시스템 구축.

#### 백엔드 (server/index.js)
- **DB 테이블 신규**: `board_posts`, `board_post_tags`, `board_comments`, `board_comment_likes` — 서버 기동 시 `CREATE TABLE IF NOT EXISTS`로 자동 생성.
- **게시판 API 엔드포인트 전체 추가**:

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/board/posts` | 목록 조회 (태그 필터, 검색어, 정렬, 페이지네이션) | 불필요 |
| POST | `/api/board/posts` | 게시글 작성 | 필요 |
| GET | `/api/board/posts/:id` | 상세 조회 (조회수 자동 증가) | 불필요 |
| PUT | `/api/board/posts/:id` | 게시글 수정 (작성자 본인만) | 필요 |
| DELETE | `/api/board/posts/:id` | 게시글 삭제 (작성자 본인만) | 필요 |
| GET | `/api/board/posts/:id/comments` | 댓글 목록 | 불필요 |
| POST | `/api/board/posts/:id/comments` | 댓글 작성 | 필요 |
| PUT | `/api/board/comments/:id` | 댓글 수정 (작성자 본인만) | 필요 |
| DELETE | `/api/board/comments/:id` | 댓글 삭제 (작성자 본인만) | 필요 |
| POST | `/api/board/comments/:id/like` | 댓글 좋아요 토글 | 필요 |

#### 프론트엔드
- **`src/pages/Board.jsx`**: 게시글 목록 페이지. 태그 필터 + 키워드 검색 + 정렬 + 페이지네이션 지원.
- **`src/pages/BoardDetail.jsx`**: 게시글 상세 페이지. `react-markdown` + `remark-gfm`으로 마크다운 렌더링. 댓글 작성/수정/삭제, 댓글 좋아요 기능 포함.
- **`src/pages/BoardWrite.jsx`**: 게시글 작성/수정 페이지. 마크다운 에디터(`MarkdownEditor.jsx`) 탑재. 제목, 태그, 본문 입력.
- **`src/pages/TravelTagSearch.jsx`**: 여행지 태그 기반 검색 결과를 게시글 작성 화면과 연동하는 페이지.
- **`src/components/MarkdownEditor.jsx`**: `react-markdown` 기반 에디터 컴포넌트. `.markdown-body` CSS 클래스로 렌더링 스타일 적용.
- **`src/api/boardApi.js`**: 위 API 엔드포인트와 1:1 대응하는 클라이언트 API 모듈.
- **`src/store/useBoardWriteStore.js`**: 게시글 작성 폼 상태(제목, 태그, 본문, 여행지 태그)를 Zustand로 관리.

#### 라우팅 (`src/main.jsx`)
```
/board            → Board.jsx
/board/write      → BoardWrite.jsx
/board/tag-search → TravelTagSearch.jsx
/board/:id        → BoardDetail.jsx
```

#### 사이드바 연동 (`src/components/Layout/SideBar.jsx`)
- `article` 아이콘의 `Board` 메뉴 추가. 경로 `/board`, 애니메이션 `group-hover:-translate-y-0.5`.

#### 패키지 추가
- `react-markdown`, `remark-gfm` — 마크다운 렌더링용.

#### 댓글 API 명칭 통일
- 여행지 댓글 API: `commentApi.js` → `travelCommentApi.js`, 경로 `/api/comments` → `/api/travel-comments`.
- DB 테이블: `comments` → `travel_comments`, `comment_likes` → `travel_comment_likes`.

#### 위시리스트 DB 컬럼 누락 수정
- **문제**: 기존 `wishlists` 테이블에 `title`, `image_url` 컬럼 부재로 `GET /api/wishlist/details` 500 오류 발생.
- **해결**: `initDB()` 내 `ALTER TABLE wishlists ADD COLUMN title/image_url` + `ALTER TABLE wishlist_folders ADD COLUMN start_date/end_date` — try/catch로 컬럼 중복 무시.

### 2.13 위시리스트 폴더별 메모 및 체크리스트 시스템 (2026-04-27 추가)

#### 기능 개요
위시리스트 폴더별로 독립적인 여행 준비물 리스트(Checklist) 및 자유 메모(Memo)를 기록할 수 있는 관리 시스템.

#### 주요 구성 요소
- **데이터베이스 (MySQL)**: `wishlist_notes` 테이블 신규 구축. `folder_id`를 통한 1:N 관계 형성 및 `ON DELETE CASCADE` 제약 조건 적용.
- **사이드바 통합 UI**: 마이페이지 좌측 하단에 위치하며, 폴더 선택 시 해당 폴더의 노트를 자동으로 로드 및 필터링.
- **인터랙션 모드**:
    - **LIST**: 체크박스 기반의 할 일 관리. 완료 시 시각적 취소선 적용 및 실시간 서버 저장.
    - **MEMO**: 여행 관련 아이디어, 맛집 리스트 등 자유 텍스트 기록.
- **디자인 시스템**: 'Code Vibe' 테마를 계승한 터미널 스타일 입력창 및 슬라이드 애니메이션 적용.

#### API 엔드포인트
- `GET /api/wishlist/folders/:folderId/notes`
- `POST /api/wishlist/folders/:folderId/notes`
- `PUT /api/wishlist/notes/:id/toggle`
- `DELETE /api/wishlist/notes/:id`

### 2.14 API 레이어 리팩토링 및 TourAPI 프록시 아키텍처 도입 (2026-04-27 추가)

#### TourAPI 서버 프록시 중계 (`/api/travel/proxy/:service`)
기존에 클라이언트(`travelInfoApi.js`)가 TourAPI 상세 엔드포인트를 직접 호출하던 방식을 서버 중계 방식으로 전환하여 429 에러를 완전히 차단.

- **신규 엔드포인트**: `GET /api/travel/proxy/:service` (`server/index.js`).
  - `:service` 파라미터로 `detailCommon2`, `detailIntro2`, `detailImage2` 등 TourAPI 서비스를 동적으로 지정.
  - 서버의 `TRAVEL_INFO_API_KEY` 환경 변수를 사용하여 API 키가 클라이언트에 노출되지 않도록 보안 강화.
- **`src/api/travelInfoApi.js` 전면 리팩토링**:
  - `API_URL`, `SERVICE_KEY` 상수 및 직접 외부 API 호출 로직 완전 제거.
  - `fetchViaProxy(service, params)` 헬퍼 함수 신규 도입 — 모든 상세 조회를 `/api/travel/proxy/:service` 경유로 처리.
  - `getDetailCommon`, `getDetailIntro`, `getDetailImage`, `getDetailInfo`, `searchFestival2` 등 모든 상세 함수가 프록시 기반으로 재구현.

#### 위시리스트 API 레이어 인터페이스 정비
- **`src/api/wishlistApi.js`**: Default export → Named exports 전환. `async/await` + `response.data` 반환 방식으로 표준화. Notes API 4종(`getFolderNotes`, `addNote`, `toggleNote`, `deleteNote`) 추가. `toggleWishlist` 시그니처 변경: `(travelData, folderId)` → `(contentId, title, imageUrl, folderId)`.
- **`src/store/useWishlistStore.js`**: `toggleWishlist` 수신 인터페이스 변경: `(travelData, folderId)` → `(itemData)` (단일 객체, 내부 `{ contentid, title, firstimage, folder_id }`). `fetchFolders` 별칭 제거, `syncWithServer` 단일 경로로 일원화.
- **`src/components/WishlistModal.jsx`**: `fetchFolders` → `syncWithServer` 교체. 폴더 선택 시 `travelInfo` 구조를 `{ contentid, title, firstimage, folder_id }` 형식으로 통일.

---
## 3. 성능 최적화 및 전략 (Performance Optimization)

### 3.1 429 에러(Too Many Requests) 방지 및 캐싱 시스템
공공데이터 API의 호출 제한 정책에 대응하고 사용자 경험을 극대화하기 위해 다음과 같은 단계별 캐싱 전략을 운영 중입니다.

#### [Phase 1] 서버 사이드 메모리 캐싱 (현재 적용 완료)
*   **메커니즘**: 서버 부팅 시 외부 API로부터 대용량 데이터(약 6만 건)를 단 1회 호출하여 서버 메모리에 적재.
*   **장점**: 클라이언트의 직접적인 외부 API 호출을 차단하여 429 에러 발생 가능성을 0%로 낮춤. 응답 속도가 ms 단위로 단축됨.
*   **적용 범위**: 메인 슬라이더 사진, 지역 기반 추천(Near Me), 랜덤 여행지 뽑기, 전국 축제 리스트 등.

#### [Phase 2] 클라이언트 사이드 데이터 보정 (Hydration)
*   **개념**: 목록 데이터에서 부족한 필드(예: 행사 날짜)를 사용자 화면 렌더링 시점에 개별 API를 통해 실시간으로 보충하는 방식.
*   **효과**: 서버 부하를 최소화하면서도 사용자에게는 누락 없는 정보를 제공.

---
## 4. 구현 현황

| 구현 기능 | 상태 |
| --------------- | --- |
| 로그인/회원가입 페이지 구현 | ✅ 완료 |
| 마이페이지(위시리스트) 구현 | ✅ 완료 |
| 지도 API 연동 | ✅ 완료 |
| 상세 페이지 확장 및 댓글 시스템 (API 복구 포함) | ✅ 완료 |
| Zustand 기반 검색 상태 관리 | ✅ 완료 |
| 메인 슬롯머신 상세 연동 수정 | ✅ 완료 |
| 모바일 하단 네비게이션 복구 | ✅ 완료 |
| 사이드바 동적 애니메이션 및 축제 메뉴 추가 | ✅ 완료 |
| 로그인 'Remember Me' 기능 | ✅ 완료 |
| 비밀번호 재설정 시스템 | ✅ 완료 |
| 페이지 접근 권한 보안 설정 | ✅ 완료 |
| 탐색 페이지 하트 인터랙션 및 더블클릭 | ✅ 완료 |
| 실제 DB 기반 위시리스트 CRUD | ✅ 완료 |
| 서버 사이드 메모리 캐싱 도입 | ✅ 완료 |
| 상세 및 마이페이지 하트 연동 | ✅ 완료 |
| Node_Header 브랜드 명칭 변경 | ✅ 완료 |
| 탐색/상세/마이페이지 하트 UI 깜빡임 현상 수정 | ✅ 완료 |
| 위시리스트 로그아웃 동기화 및 초기화 최적화 | ✅ 완료 |
| 서버 댓글(Comment) 시스템 복구 및 에러 핸들링 | ✅ 완료 |
| 위시리스트 추가/삭제 알림(Alert) 시스템 | ✅ 완료 |
| 사용자 맞춤형 위시리스트 폴더(Folder) 관리 기능 | ✅ 완료 |
| 위시리스트 다중 정렬 (최신순, 이름순 A-Z/Z-A) | ✅ 완료 |
| 전국 축제 및 행사 전용 페이지 구축 | ✅ 완료 |
| 축제 데이터 실시간 보정(Hydration) 시스템 | ✅ 완료 |
| 행사 날짜별 다중 정렬 기능 (오름/내림차순) | ✅ 완료 |
| 하이브리드 지역 필터링 (울산 고정 오류 수정) | ✅ 완료 |
| 사이드바 폭죽(Firework) CSS 입자 애니메이션 | ✅ 완료 |
| 댓글 좋아요 중복 방지 로직 및 DB 연동 | ✅ 완료 |
| 이미지 업로드 5MB 용량 제한 및 필터링 | ✅ 완료 |
| Info 서비스 소개 페이지 신설 | ✅ 완료 |
| 사이드바 전 메뉴 고유 컬러 글로우 애니메이션 고도화 | ✅ 완료 |
| 전체 아키텍처 분석 문서(`Architecture_Analysis.md`) 신설 | ✅ 완료 |
| 사용자 정보 수정 및 프로필 이미지 업로드 시스템 | ✅ 완료 |
| 비밀번호 찾기 및 재설정(ForgotPassword) API | ✅ 완료 |
| 위시리스트 폴더 여행 일정(시작일·종료일) 설정 및 표시 | ✅ 완료 |
| 위시리스트 목록 헤더 여행 일정 표시 | ✅ 완료 |
| 위시리스트 폴더 이름·날짜 편집 기능 (`PUT /api/wishlist/folders/:id`) | ✅ 완료 |
| 탐색 페이지 지역 필터링 코드 정합성 수정 (areacode 하드코딩) | ✅ 완료 |
| 메인 페이지 지역 추천 관광지·문화시설 한정 필터링 | ✅ 완료 |
| 푸터 SAFESTAY 링크 연결 (한국관광공사 안전여행 포털) | ✅ 완료 |
| 사이드바 Info 서브메뉴 (Public_Wifi · Safestay · About_CodeTrip) | ✅ 완료 |
| 사이드바 Explore 아이콘 애니메이션 색상 파란색(`#3b82f6`)으로 변경 | ✅ 완료 |
| 댓글 API 명칭 통일 (`travel-comments` / `travel_comment_likes`) | ✅ 완료 |
| `feature/board` 브랜치 머지 — 게시판 시스템(CRUD·댓글·태그·좋아요) 통합 | ✅ 완료 |
| 마크다운 에디터(`MarkdownEditor.jsx`) 및 `react-markdown` 연동 | ✅ 완료 |
| 게시판 DB 테이블 4종 신규 생성 (`board_posts`, `board_post_tags`, `board_comments`, `board_comment_likes`) | ✅ 완료 |
| 위시리스트 `title`/`image_url` 컬럼 누락 자동 복구 (`ALTER TABLE`) | ✅ 완료 |
| 위시리스트 폴더별 메모 및 체크리스트(LIST/MEMO) 기능 | ✅ 완료 |
| TourAPI 서버 프록시 중계 (`/api/travel/proxy/:service`) — 429 에러 완전 차단 | ✅ 완료 |
| `travelInfoApi.js` 프록시 기반 전면 리팩토링 (클라이언트 직접 호출 완전 제거) | ✅ 완료 |
| `wishlistApi.js` Named Exports 전환 및 Notes API 통합 | ✅ 완료 |
| `useWishlistStore.js` `toggleWishlist` 인터페이스 단일 객체 방식으로 정비 | ✅ 완료 |
| 축제 페이지 종료된 행사 자동 필터링 (`eventenddate < today`) | ✅ 완료 |
| 축제 하이드레이션 완료 후 클라이언트 재정렬 (날짜 기준) | ✅ 완료 |
| `concurrently` 기반 프론트·백 동시 실행 환경 (`npm run dev:all`) | ✅ 완료 |
| 백엔드 모듈화 리팩터링 (`server/config·db·middleware·routes·services` 분리) | ✅ 완료 |
| My Activity 대시보드 — 내 게시글·댓글·좋아요 내역 종합 관리 | ✅ 완료 |
| 교통 예매 허브 — KTX·SRT·고속버스 외부 예매 사이트 연동 | ✅ 완료 |
| 날씨 API `current` 파라미터 전환 — 15분 실시간, JMA 모델, cloudcover 보정 (2026-04-28) | ✅ 완료 |
| 최근 본 여행지(`useRecentlyViewedStore`) 및 최근 검색어 드롭다운 UX 추가 (2026-04-28) | ✅ 완료 |
| `recently_viewed.log` 섹션 MyActivity 상단 고정 이동 — 탭 전환 무관 항상 표시 (2026-04-29) | ✅ 완료 |
| 스마트 검색 엔진 고도화 | ⏳ 추진중 |

---
## 9. 향후 개발 계획

### 구현될 기능/수정 사항 메모
1. **여행지 상세 페이지 및 지도 API 연동 (확장)**
	- 기능: 여행지에 대한 상세 설명, 개장 시간, 이용 요금 등을 표시.
	- 지도 연동: 카카오맵 원클릭 길찾기 연동 완료.
	
2. **스마트 검색 엔진 활성화**
	- 헤더의 검색창을 단순한 시각 요소에서 실제 기능으로 업그레이드합니다.
	
3. **나만의 여행 코스 빌더 (Solar Compiler 컨셉)**
	- 위시리스트에 담은 장소들을 조합하여 하나의 "여행 코스"를 만드는 기능입니다.
	
4. **사용자 맞춤형 '환경 설정' 페이지 (Settings) (완료)**
	- 2026.04.26 구현 완료 (프로필 수정, 이미지 업로드, 비밀번호 변경).
	
5. **실제 데이터베이스 기반 위시리스트 CRUD (완료)**
	- 2026.04.24 구현 완료.
	
6. **사용자 프로필을 클릭하면 마이페이지로 이동**
	
7. **웹 페이지 로고 수정하기(크롬 상단 탭에서 보여지는 이미지)**

8. **웹 화면 크기를 줄이었을 때 모바일 환경에 맞는 메뉴 바가 하단에 생성되도록 추가**

9. **메인 페이지 두 번째 카드(슬롯머신) 상세 페이지 연동 이슈 해결**

10. **비밀번호 재설정(Forgot Password) 시스템 구현 (완료)**
	- 2026.04.26 구현 완료 (이메일+이름 본인 인증 기반).

11. **탐색 페이지(Explore) 인터랙티브 하트 및 애니메이션 고도화**
	
12. **마이페이지에서 본인이 작성한 여행 게시글이나 댓글을 조회할 수 있는 기능 (완료)**
	- 2026-04-27 My Activity 대시보드(`/my-activity`) 구현 완료. 게시글·댓글·좋아요 내역 종합 관리.

13. **관리자/사용자로 분리해서 관리자가 특정 글을 직접 삭제할 수 있는 권한 부여**

14. **푸터 오른쪽 하단 메뉴에 Info 페이지 추가하기 (완료)**
	- 2026.04.26 구현 완료.

15. **여행지 정보 페이지에서 상단으로 바로 이동할 수 있는 top 버튼 추가하기**

16. **행사 축제 페이지 정렬 기능 안정화 및 로직 수정 (완료)**
	- 2026.04.26 서버 사이드 정렬 로직 및 날짜 데이터 정규화 완료.

17. **행사 및 축제 노드 위시리스트(찜) 기능 추가 (완료)**
	- 2026-04-27 완료. 축제 데이터(contentTypeId: 15)도 위시리스트 폴더에 저장 가능하도록 `Festivals.jsx` 하트 버튼 연동.

18. **위시리스트에서 체크리스트, 메모, 달력 기능 추가하기 (완료)**
	- 2026-04-27 `wishlist_notes` 테이블 및 API 4개 엔드포인트 구현 완료.

19. **이동 수단(KTX, SRT) 정보 제공 혹은 페이지 이동 기능 (완료)**
	- 2026-04-27 교통 예매 허브(KTX·SRT·고속버스 공식 예매 사이트 외부 연동) Info 페이지 및 사이드바에 추가 완료.

---
**추가 아이디어 제안 및 문답 기록**

현재 CodeTrip 프로젝트는 '개발자스러운 프리미엄 디자인(Code Vibe)'과 '실시간 데이터(날씨/위치) 기반 추천'이라는 매우 선명하고 매력적인 정체성을 가지고 있습니다.

지금의 구조에서 프로젝트의 완성도를 한 단계 더 끌어올릴 수 있는 5가지 확장 기능을 추천드립니다.

1. **Trip_Build: 스마트 경로 최적화 (컴파일러 컨셉)**
   - 사용자가 찜한 3~4개의 장소를 '빌드(Build)'하면, 카카오맵 API를 사용하여 최적의 이동 경로를 생성해주는 기능.
2. **Travel_Log: 마크다운 기반 여행 리뷰 (Dev-Friendly Review)**
   - 마크다운 에디터를 통해 개발자 로그 형식으로 여행 후기를 작성하고 공유하는 시스템.
3. **Live_Signal: 실시간 혼잡도 및 날씨 특화 정보**
   - 현재 여행지의 실시간 기상 데이터와 연동하여 '현재 가기 가장 좋은 곳' 신호를 시각화.
4. **Social_Snippet: 여행지 카드 공유 기능**
   - 여행지 정보를 예쁜 코드 스니펫이나 카드 이미지 형태로 캡처하여 SNS에 공유.
5. **Navigation_Link: 원클릭 길찾기 연동 (완료)**
   - 카카오맵, 네이버지도, T-map 등으로 즉시 연결되는 딥링크 시스템.

---
**질문: 위 5번 기능을 웹 페이지에서 구현할 수 있나요?**
답변: 네, 웹 페이지에서 아주 쉽고 강력하게 구현할 수 있습니다! 주요 지도 서비스들이 제공하는 'URL Scheme'이나 '웹 링크 API'를 사용하면 버튼 클릭 한 번으로 사용자의 스마트폰 지도를 실행하거나 길찾기 화면으로 연결할 수 있습니다.
- 카카오맵: `https://map.kakao.com/link/to/장소이름,위도,경도`

---
**질문: 그럼 혹시 마크다운 에디터도 웹 페이지에서 구현할 수 있나요?**
답변: 네, 마크다운 에디터는 우리 프로젝트의 'Code Vibe' 컨셉에 가장 잘 어울리는 기능 중 하나입니다! `react-simplemde-editor` 같은 라이브러리를 사용하면 1~2시간 내에 완성도 높은 에디터를 구축할 수 있으며, 사용자가 작성한 로그를 코드 주석 스타일로 렌더링하면 우리만의 독특한 여행 리뷰 시스템이 완성됩니다.

```console
   1 // USER_LOG.md
   2 # 제주도 함덕 해수욕장 방문기
   3 - 날짜: 2026.04.23
   4 - 상태: [SUCCESS] 매우 맑음
   5
   6 본문 내용... 여기는 마크다운으로 자유롭게 작성!
```

---
*최종 업데이트: 2026-04-29 (recently_viewed.log MyActivity 상단 고정 이동 / 회원 관심 지역·날씨 기반 즉흥 여행지 랜덤 추천 / 날씨 API `current` 파라미터 전환·JMA 모델·cloudcover 보정 / 백엔드 모듈화 리팩터링 / TourAPI 프록시 아키텍처 / wishlistApi Named Exports 전환 / 위시리스트 메모·체크리스트 / 게시판 시스템 통합 / My Activity 대시보드 / 교통 예매 허브 연동)*


---
## 10. 최신 업데이트 요약 (2026.04.27 최종본)

### 10.1 탐색 및 정렬 시스템 고도화
- **서버 사이드 정렬**: 생성일순, 수정일순, 행사 시작일순 등 다각도 정렬을 서버 캐시 기반으로 즉각 처리.
- **검색 보정**: 시작일이 누락된 축제 데이터를 오늘 날짜 기준으로 자동 보정하여 정렬 깨짐 방지.

### 10.2 하이브리드 사이드바 및 외부 예매 허브
- **가변 레이아웃 엔진**: 사이드바 너비 상태에 따라 '플로팅 메뉴(Popover)'와 '아코디언(Accordion)' 모드 자동 전환.
- **교통 허브 브릿지**: KTX, SRT, 고속버스 예매 플랫폼(TRANSPORT_BOOKING.EXE)으로의 유기적 외부 시스템 연결 및 새 창 열기 구현.

### 10.3 데이터 정합성 및 안정성 설계
- **타임존 보정 파이프라인**: 로컬-서버 간 날짜 밀림 오류를 해결하기 위해 모든 날짜를 문자열(YYYY-MM-DD) 형식으로 통일.
- **Proxy Circuit Breaker**: 공공 API 호출 제한(429 Error) 발생 시 자동 차단 및 캐시 데이터 우선 반환으로 시스템 생존 보장.
- **WMO 정밀 기상 매핑**: Open-Meteo의 날씨 코드를 세밀하게 재분류하여 흐림, 안개 등의 실시간 체감 날씨를 추천 키워드와 함께 제공.

### 10.4 활동 대시보드 및 게시판 통합
- **My Activity 대시보드**: feature/mypage 통합으로 유저별 게시글, 댓글, 좋아요 내역 종합 관리.
- **GFM 지원 게시판**: 마크다운 문법과 코드 하이라이팅을 지원하는 개발자 친화적 여행 기록 커뮤니티 정식 연동.

### 4.6 실시간 기상 데이터 매핑 엔진 최적화 (2026.04.27 추가)
- **강수 감지 알고리즘 고도화**: 글로벌 API(Open-Meteo)의 지연 특성을 보완하기 위해 WMO(세계기상기구) 강수 관련 코드 범위를 공격적으로 확장 매핑. 소나기(Rain showers) 및 이슬비(Drizzle) 데이터를 즉각적인 'Rainy' 상태로 변환하여 사용자 체감 정확도 개선.
- **컨텐츠-기상 동기화**: 정밀해진 기상 등급에 따라 실내/실외 여행지 추천 키워드를 동적으로 할당하는 로직을 엔진 레벨에서 강화.

## 11. 업데이트 기록 (2026.04.27 추가 - Part 4)
1. **날씨 판정 로직 개선**: 이슬비, 소나기 등 미세 강수 상황에 대한 감지 민감도 대폭 향상.
2. **커뮤니티 및 UX 강화**: 오늘 진행된 모든 문서 복구 및 신규 기능 통합 건에 대한 최종 형상 관리 완료.

---

## 12. 백엔드 모듈화 리팩터링 및 유지보수 구조 개선 (2026.04.27 추가)

### 12.1 개요
2026.04.27 기준 백엔드 구조를 유지보수하기 좋은 형태로 재정리하였다. 기존에는 `server/index.js` 단일 파일이 Express 앱 설정, MySQL 연결, DB 스키마 초기화, 인증 미들웨어, Multer 업로드, TourAPI 호출, 서버 캐시, 위시리스트, 게시판, 댓글, 사용자 활동 API까지 모두 담당하고 있었다.

이번 개선은 **기존 프론트엔드 API 호출 경로를 변경하지 않고**, 백엔드 내부 구현만 책임별로 분리하는 리팩터링이다. 따라서 `/api/login`, `/api/travel`, `/api/wishlist/details`, `/api/board/posts` 등 기존 엔드포인트는 그대로 유지된다.

### 12.2 변경 후 백엔드 디렉터리 구조
```text
server/
├── index.js                    # Express 앱 조립 및 서버 시작
├── config/
│   ├── db.js                   # MySQL connection pool
│   ├── env.js                  # 환경 변수 및 공통 상수
│   └── upload.js               # Multer 업로드 설정
├── db/
│   └── init.js                 # DB 테이블 생성 및 컬럼 보정
├── middleware/
│   └── auth.js                 # JWT 인증 미들웨어 및 선택적 인증 helper
├── routes/
│   ├── activityRoutes.js       # 내 활동 API
│   ├── authRoutes.js           # 회원가입, 로그인, 비밀번호 재설정
│   ├── boardRoutes.js          # 게시판 및 게시판 댓글 API
│   ├── travelCommentRoutes.js  # 여행지 댓글 API
│   ├── travelRoutes.js         # 여행지, 축제, TourAPI 프록시 API
│   ├── userRoutes.js           # 프로필, 이미지 업로드, 비밀번호 변경
│   └── wishlistRoutes.js       # 위시리스트, 폴더, 메모, 체크리스트 API
├── services/
│   ├── tourApiService.js       # 한국관광공사 TourAPI 호출 및 응답 정규화
│   └── travelCache.js          # 서버 메모리 캐시 및 일일 갱신 스케줄
└── uploads/                    # 사용자 업로드 이미지 저장소
```

### 12.3 `server/index.js`의 역할 축소
`server/index.js`는 더 이상 모든 기능을 직접 구현하지 않는다. 현재 역할은 다음과 같이 제한된다.

- Express 앱 생성.
- CORS 설정.
- JSON body parser 설정.
- `/uploads` 정적 파일 서빙.
- 도메인별 라우터를 `/api` prefix 아래 mount.
- DB 초기화 실행.
- 여행 데이터 캐시 초기화 실행.
- 매일 새벽 3시 여행 데이터 캐시 갱신 스케줄 등록.
- 서버 listen 시작.

이 구조를 통해 서버 시작 흐름과 기능 구현부가 분리되었으며, 특정 API 수정 시 `index.js`가 아니라 해당 도메인의 route 파일을 확인하면 된다.

### 12.4 설정 계층 (`server/config`)
#### `env.js`
- `dotenv` 초기화.
- `PORT`, `JWT_SECRET`, `TRAVEL_API_BASE`, `TRAVEL_SERVICE_KEY` 관리.
- TourAPI 키는 기존처럼 서버 환경 변수 `TRAVEL_INFO_API_KEY`를 통해 관리한다.

#### `db.js`
- MySQL connection pool 생성 책임을 분리한다.
- 기존 옵션을 유지한다.
  - `waitForConnections: true`
  - `connectionLimit: 10`
  - `queueLimit: 0`
  - `dateStrings: true`

#### `upload.js`
- `server/uploads` 디렉터리 생성 보장.
- Multer disk storage 설정.
- 업로드 파일명에 timestamp와 random suffix를 붙여 충돌을 방지.
- 이미지 MIME 타입만 허용.
- 파일 크기 제한 5MB 유지.

### 12.5 DB 초기화 계층 (`server/db/init.js`)
DB 스키마 초기화와 운영 중 누락될 수 있는 컬럼 보정 로직을 `server/db/init.js`로 분리하였다.

관리 대상 테이블:
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

운영 DB 호환을 위한 컬럼 보정:
- `wishlists.title`
- `wishlists.image_url`
- `wishlist_folders.start_date`
- `wishlist_folders.end_date`

이제 DB 스키마 변경이나 신규 테이블 추가 작업은 `server/db/init.js`에서 관리하는 것을 표준으로 한다.

### 12.6 인증 계층 (`server/middleware/auth.js`)
인증 관련 공통 로직을 미들웨어로 분리하였다.

#### `authenticateToken`
- `Authorization: Bearer <token>` 형식의 JWT를 검증.
- 유효한 경우 `req.user`에 payload를 주입.
- 토큰 누락, 만료, 무효 상태에서는 401 응답을 반환.

#### `getUserIdFromRequest`
- 토큰이 있으면 사용자 id를 반환하고, 없거나 유효하지 않으면 `null`을 반환한다.
- 공개 조회 API에서 “현재 사용자가 좋아요를 눌렀는지”를 계산할 때 사용한다.
- 적용 대상:
  - 여행지 댓글 목록 조회.
  - 게시판 댓글 목록 조회.

### 12.7 서비스 계층 (`server/services`)
#### `tourApiService.js`
한국관광공사 TourAPI 호출과 응답 정규화를 담당한다.

주요 책임:
- `areaBasedList2` / `searchKeyword2` 호출.
- `searchFestival2` 호출.
- API 응답의 단일 객체/배열 형태 정규화.
- `firstimage`, `originimgurl` 이미지 URL의 `http://` → `https://` 보정.
- 축제 데이터 필드명 정규화.
  - `contentid` / `contentId`
  - `eventstartdate` / `eventStartDate`
  - `eventenddate` / `eventEndDate`
  - `areacode` / `areaCode`

#### `travelCache.js`
서버 메모리 캐시를 담당한다.

주요 책임:
- 서버 시작 시 약 6만 건 규모의 여행지 데이터 캐싱.
- `createdtime`, `modifiedtime` 기준 정렬 캐시 생성.
- 여행지 `contentid` → `title` map 생성.
- 메인 상단 이미지 목록 생성.
- 축제 전용 데이터 캐싱.
- 매일 새벽 3시 캐시 갱신 스케줄 실행.

이 계층은 공공 API 호출 제한과 응답 속도 문제를 완화하는 핵심 성능 계층으로 유지된다.

### 12.8 라우트 계층 (`server/routes`)
도메인별 API를 별도 router 파일로 분리하였다.

#### `authRoutes.js`
- `POST /api/signup`
- `POST /api/login`
- `POST /api/auth/forgot-password`

#### `userRoutes.js`
- `POST /api/user/upload`
- `PUT /api/user/update`
- `PUT /api/user/password`
- `GET /api/user/favorite-regions`
- `PUT /api/user/favorite-regions`

#### `travelRoutes.js`
- `GET /api/travel/top-images`
- `GET /api/travel/near`
- `GET /api/travel/festivals`
- `GET /api/travel/random`
- `GET /api/travel/spontaneous`
- `GET /api/travel/proxy/:service`
- `GET /api/travel`

#### `travelCommentRoutes.js`
- `GET /api/travel-comments/:contentId`
- `POST /api/travel-comments/:id/like`
- `POST /api/travel-comments`
- `PUT /api/travel-comments/:id`
- `DELETE /api/travel-comments/:id`

#### `wishlistRoutes.js`
- `GET /api/wishlist/details`
- `POST /api/wishlist/toggle`
- `GET /api/wishlist/folders`
- `POST /api/wishlist/folders`
- `PUT /api/wishlist/folders/:id`
- `DELETE /api/wishlist/folders/:id`
- `PUT /api/wishlist/move`
- `GET /api/wishlist/folders/:folderId/notes`
- `POST /api/wishlist/folders/:folderId/notes`
- `PUT /api/wishlist/notes/:id/toggle`
- `DELETE /api/wishlist/notes/:id`

#### `activityRoutes.js`
- `GET /api/my/board-posts`
- `GET /api/my/board-comments`
- `GET /api/my/travel-comments`

#### `boardRoutes.js`
- `GET /api/board/posts`
- `GET /api/board/posts/:id`
- `POST /api/board/posts`
- `PUT /api/board/posts/:id`
- `DELETE /api/board/posts/:id`
- `GET /api/board/posts/:id/comments`
- `POST /api/board/posts/:id/comments`
- `PUT /api/board/comments/:id`
- `DELETE /api/board/comments/:id`
- `POST /api/board/comments/:id/like`

### 12.9 API 호환성
이번 리팩터링은 내부 파일 구조 변경이며, 프론트엔드 API contract는 유지한다.

유지되는 대표 경로:
- `/api/signup`
- `/api/login`
- `/api/auth/forgot-password`
- `/api/user/upload`
- `/api/travel`
- `/api/travel/spontaneous`
- `/api/travel/proxy/:service`
- `/api/travel-comments/:contentId`
- `/api/wishlist/details`
- `/api/wishlist/folders`
- `/api/board/posts`
- `/api/my/board-posts`

따라서 `src/api/authApi.js`, `src/api/travelApi.js`, `src/api/travelInfoApi.js`, `src/api/wishlistApi.js`, `src/api/boardApi.js`의 호출 경로는 변경하지 않았다.

### 12.10 유지보수 기준
향후 백엔드 기능을 추가할 때는 다음 기준을 따른다.

- 새 API 엔드포인트는 기능 도메인에 맞는 `server/routes/*Routes.js`에 추가한다.
- DB 테이블 생성 또는 컬럼 보정은 `server/db/init.js`에 추가한다.
- 외부 API 호출이나 캐시 로직은 route에 직접 넣지 않고 `server/services`에 둔다.
- 인증이 필요한 API는 `authenticateToken`을 router 단계에서 명시적으로 연결한다.
- 로그인 여부가 선택적인 조회 API는 `getUserIdFromRequest`를 사용한다.
- `server/index.js`에는 앱 조립과 서버 시작 흐름만 유지한다.

### 12.11 검증 내역
- `server` 하위 JavaScript 파일 전체에 대해 `node --check` 문법 검사를 수행하였다.
- 검사 결과 문법 오류는 발견되지 않았다.
- 실제 DB 연결 및 외부 TourAPI 통합 실행 검증은 별도 단계로 남겨둔다.

### 12.12 형상 관리 참고
- 현재 Git 브랜치: `doyeon`.
- 백엔드 분리 작업 외에 기존 사용자 변경으로 보이는 `2_Project_Documents/.obsidian/workspace.json` 변경이 작업 트리에 존재한다.
- 해당 Obsidian workspace 파일은 백엔드 리팩터링과 무관하므로 수정하지 않았다.

## 13. 관심 지역·날씨 기반 즉흥 여행지 랜덤 추천 기능 (2026-04-28 추가)

### 13.1 기능 목표
이 기능은 프로젝트의 핵심 기획 의도인 "갑자기 떠나고 싶은 사용자에게 빠르게 여행지를 제안하는 서비스"를 메인 페이지에서 바로 체감할 수 있도록 만든 회원 맞춤 추천 기능이다.

기존 랜덤 여행지 추천은 전국 여행지 데이터에서 무작위로 결과를 제공하는 방식이었기 때문에 사용자의 선호 지역이나 현재 여행 조건을 반영하지 못했다. 이번 개선에서는 회원이 설정한 관심 지역을 1차 기준으로 삼고, 해당 지역의 현재 날씨를 2차 조건으로 사용하여 즉흥 여행에 더 적합한 추천 결과를 제공한다.

### 13.2 사용자별 동작 기준
- **로그인 회원 + 관심 지역 설정 완료**: `user_favorite_regions`에 저장된 지역 중 하나를 기준으로 여행지 후보를 1차 필터링하고, 기준 지역의 현재 날씨에 맞는 장소를 우선 추천한다.
- **로그인 회원 + 관심 지역 미설정**: 기능 확인이 가능하도록 기본 지역 서울(`11`)을 기준으로 추천한다. 응답에는 `hasPreferences: false`가 포함되어 UI에서 "관심 지역 설정 전 랜덤 추천" 상태를 표시할 수 있다.
- **비회원**: 관심 지역 데이터가 없으므로 회원 맞춤 API를 호출하지 않고 기존 전국 랜덤 여행지 미리보기 흐름을 유지한다.

### 13.3 데이터 의존성
- **사용자 관심 지역**: `user_favorite_regions` 테이블의 `user_id`, `region_code`를 사용한다.
- **여행지 후보 데이터**: 서버 시작 시 적재되는 `travelCache.allTravelItems`를 사용한다.
- **지역 메타데이터**: `server/routes/travelRoutes.js` 내부 `REGION_META` 상수에서 지역명, TourAPI `areacode`, 위도, 경도를 관리한다.
- **날씨 데이터**: Open-Meteo API를 사용하여 기준 지역의 현재 날씨, 기온, WMO weather code를 조회한다.

### 13.4 서버 API 명세
#### `GET /api/travel/spontaneous`
회원 전용 즉흥 여행지 추천 API다. `Authorization: Bearer <token>` 헤더가 필요하며, 쿼리 파라미터로 `poolSize`를 받을 수 있다.

응답 필드:
- `item`: 최종 추천 여행지 객체. TourAPI 캐시 데이터의 여행지 필드를 포함한다.
- `score`: 추천 후보 평가 점수.
- `reasons`: 추천 사유 배열.
- `weather`: 기준 지역의 현재 날씨 정보. `label`, `temperature`, `code`, `regionName`, `latitude`, `longitude` 포함.
- `hasPreferences`: 사용자가 관심 지역을 설정했는지 여부.
- `preferredRegions`: 사용자 관심 지역 코드 배열.
- `activeRegion`: 이번 추천에 실제 사용된 기준 지역 코드.
- `fallbackUsed`: 후보 부족으로 폴백 후보군을 사용했는지 여부.
- `weatherFilter`: 날씨 기반 2차 필터 적용 상태. `applied`, `matchedCount`, `keywords` 포함.

### 13.5 추천 로직 상세
1. JWT 인증으로 현재 회원을 식별한다.
2. `user_favorite_regions`에서 회원의 관심 지역 코드를 조회한다.
3. 관심 지역이 있으면 그중 하나를 기준 지역으로 선택하고, 없으면 서울(`11`)을 기본 기준 지역으로 사용한다.
4. `REGION_META`에서 기준 지역의 TourAPI `areacode`, 지역명, 위도, 경도를 찾는다.
5. Open-Meteo로 기준 지역의 현재 날씨를 조회한다.
6. 서버 캐시의 전체 여행지 목록에서 관광지(`contenttypeid: 12`)와 문화시설(`contenttypeid: 14`) 중심으로 후보를 만든다.
7. 기준 지역의 `areacode` 또는 주소 텍스트가 일치하는 여행지를 우선 후보로 남긴다.
8. 기준 지역 후보가 부족하면 사용자의 전체 관심 지역으로 범위를 확장한다.
9. 그래도 후보가 부족하면 전국 관광지·문화시설 이미지 보유 데이터를 폴백 후보로 사용한다.
10. 날씨 라벨에 따라 추천 키워드를 선택하고, 여행지명·주소·카테고리 텍스트에 키워드가 포함되는지 검사한다.
11. 날씨 매칭 후보가 충분하면 2차 필터를 적용하고, 너무 적으면 원래 후보군을 유지한다.
12. 이미지 보유 여부, 콘텐츠 타입, 날씨 키워드 매칭, 지역 주소 매칭을 점수화한다.
13. 상위 후보군 안에서 무작위로 1개를 선택해 즉흥 추천 결과로 반환한다.

### 13.6 날씨별 추천 기준
- **Sunny / Clear / Partly Cloudy**: 공원, 산책, 전망대, 정원, 해변, 등대, 둘레길 등 야외 이동이나 경관 감상에 적합한 장소를 우선한다.
- **Cloudy**: 박물관, 전시, 문화, 시장, 카페, 거리 등 실내와 도심 활동을 함께 고려한다.
- **Rainy / Snowy / Stormy**: 박물관, 전시, 미술관, 실내, 체험, 카페 등 날씨 영향을 덜 받는 장소를 우선한다.

날씨 필터는 추천 실패를 만들지 않는 보조 필터로 설계했다. 따라서 날씨 키워드와 맞는 후보가 충분하지 않으면 필터를 강제로 적용하지 않고, 지역 기반 후보군에서 추천을 계속 진행한다.

### 13.7 프론트엔드 반영
- `src/api/travelApi.js`에 `getSpontaneousTravel(poolSize)` 함수를 추가하여 `/api/travel/spontaneous`와 연결했다.
- `src/pages/Home.jsx`의 두 번째 랜덤 추천 카드에서 로그인 여부를 확인한다.
- 로그인 회원은 즉흥 추천 API를 우선 호출하고, 실패하거나 추천 결과가 없으면 기존 랜덤 추천 API로 폴백한다.
- 비회원은 회원 관심 지역 API를 호출하지 않고 기존 전국 랜덤 여행지 미리보기 화면을 제공한다.
- 추천 결과 카드에는 여행지 이미지, 제목, 주소와 함께 기준 지역의 현재 날씨 정보를 표시한다.
- 날씨 정보는 카드 상단 보조 정보 영역과 이미지 오버레이에 함께 노출하여 추천 조건을 사용자가 바로 이해할 수 있게 했다.

### 13.8 예외 처리 및 폴백 전략
- 관심 지역 미설정: 서울(`11`) 기준 추천으로 폴백.
- 관심 지역 후보 부족: 사용자의 전체 관심 지역 후보로 확장.
- 지역 후보 부족: 전국 관광지·문화시설 이미지 보유 데이터로 폴백.
- 날씨 API 실패: 날씨 정보 없이 지역 기반 추천 계속 진행.
- 날씨 키워드 매칭 부족: 날씨 필터를 적용하지 않고 기존 후보군 유지.
- 회원 추천 API 실패: 프론트엔드에서 기존 `/api/travel/random` 흐름으로 폴백.

### 13.9 검증 내역
- `node --check server/routes/travelRoutes.js` 문법 검증 완료.
- 임시 회원 계정으로 `/api/travel/spontaneous` 호출 검증 완료.
- 관심 지역 미설정 회원의 기본 지역 폴백 응답 확인.
- 관심 지역 설정 후 해당 지역 기반 추천 응답 확인.
- 날씨 기반 2차 필터 적용 시 `weatherFilter.applied`, `matchedCount`, `keywords` 응답 확인.
- 메인 페이지 두 번째 카드에서 추천 결과와 날씨 정보가 함께 표시되는 흐름 확인.
- `npm run build` 성공. Vite chunk size warning은 기존 번들 크기 경고이며 빌드 실패 항목은 아니다.

---

## 14. 사용자 맞춤 UX 고도화 (2026-04-28 추가)

### 14.1 Explore 관심지역 자동 필터링 시스템

#### 개요
탐색 페이지 진입 시 로그인 사용자의 관심지역(`user_favorite_regions`)을 자동으로 필터에 적용하고, 버튼 UI를 통해 관심지역 재적용 및 전체 초기화를 지원하는 기능.

#### `useExploreStore.js` 추가 액션

| 액션 | 파라미터 | 동작 |
|------|---------|------|
| `applyFavoriteRegions(codes)` | `string[]` | 관심지역 코드 배열로 `selectedRegions`·`appliedRegions` 일괄 설정 후 `fetchPosts()` |
| `resetFilter()` | 없음 | 지역·테마 필터 전체 초기값(`['']`) 복원 후 `fetchPosts()` |

#### `Explore.jsx` 마운트 흐름

```
컴포넌트 마운트
├── isLoggedIn == true
│   ├── authApi.getFavoriteRegions() 호출
│   │   ├── 성공: favCodes 배열 반환
│   │   └── 실패: [] 빈 배열로 폴백
│   └── initialized == false → applyFavoriteRegions(favCodes) 실행
└── isLoggedIn == false
    └── initialized == false → applyFavoriteRegions([]) → fetchPosts() (전국)
```

#### 필터 버튼 구성

| 버튼 | 표시 조건 | 동작 |
|------|----------|------|
| `RUN_FILTER.SH` | 항상 | 현재 체크된 필터 적용 (기존 동작) |
| `MY_REGIONS.SH` ⭐ | 로그인 + 관심지역 1개 이상 | 저장된 관심지역으로 필터 즉시 재적용 |
| `RESET_ALL.SH` | 항상 | 전국/전체 테마로 필터 전체 초기화 |

---

### 14.2 MyPage 위시리스트 통계 위젯 (`TRAVEL_STATS`)

#### 개요
MyPage 사이드바에 위시리스트 현황을 요약하는 `TRAVEL_STATS` 위젯을 추가. 별도 API 없이 `wishlistItems`·`folders` Zustand 상태를 `useMemo`로 파생 계산하여 렌더링.

#### 파생 계산 (`stats` useMemo)

| 파생값 | 계산 방식 |
|--------|---------|
| `total` | `wishlistItems.length` |
| `folderCount` | `folders.length` |
| `uncategorized` | `wishlistItems.filter(i => !i.folder_id).length` |
| `topFolder` | `folders` 중 아이템 수 최대인 폴더 `{ name, count }` (reduce) |

#### 표시 항목

| 항목 | 표시 조건 | 색상 |
|------|---------|------|
| `TOTAL_NODES` | 항상 | 에메랄드 |
| `FOLDERS` | 항상 | 에메랄드 |
| `UNCATEGORIZED` | 항상 | 시안 |
| `TOP_FOLDER` | `topFolder.count > 0` 일 때만 | 옐로우 |

- **위치**: 사이드바 타이틀(`username.wishlist`)과 `FOLDERS` 내비게이션 섹션 사이.
- **스타일**: `bg-inverse-surface` 다크 패널 — 기존 `Folder_Metadata`와 동일한 디자인 언어 적용.

---

## 15. 최근 본 여행지 및 최근 검색어 (2026-04-28 추가)

### 15.1 최근 본 여행지 (`recently_viewed`)

#### 개요
별도 백엔드 API 없이 `localStorage`만으로 클라이언트에서 완결되는 여행지 방문 이력 관리 기능. TravelDetail 방문 시 자동 저장되며 MyPage에서 가로 스크롤 카드로 조회 가능.

#### 스토어 구조 (`src/store/useRecentlyViewedStore.js`)

| 속성/액션 | 타입 | 설명 |
|-----------|------|------|
| `items` | `Array` | localStorage에서 초기 로드된 방문 이력 배열 (최대 10개) |
| `addItem(item)` | Action | `contentid` 기준 중복 제거 후 선두 삽입, `slice(0, 10)` 상한 유지 |
| `clearAll()` | Action | localStorage 삭제 + Zustand 상태 초기화 |

- **저장 키**: `codetrip_recently_viewed`
- **저장 구조**: `{ contentid, title, firstimage, addr1 }` 배열

#### 연동 흐름

| 파일 | 역할 |
|------|------|
| `src/pages/TravelDetail.jsx` | `common?.title` 의존 `useEffect`에서 `addItem()` 호출 |
| `src/pages/MyPage.jsx` | `items` 구독 → 위시리스트 그리드 상단에 가로 스크롤 카드 섹션 렌더링 |

#### MyPage 표시 규격

- **조건**: `recentlyViewed.length > 0`일 때만 섹션 표시
- **레이아웃**: 가로 스크롤(`overflow-x-auto`), 카드 너비 160px, 썸네일 높이 112px
- **카드 내용**: 썸네일 이미지, 제목(truncate), 주소(truncate)
- **클릭 동작**: `/explore/{contentid}` 라우트로 이동
- **전체 삭제**: 섹션 헤더 우측 버튼으로 `clearAll()` 호출

---

### 15.2 최근 검색어 드롭다운 (`recent_searches`)

#### 개요
Header 검색창 포커스 시 최근 검색어 목록을 드롭다운으로 표시하여 반복 입력을 줄이는 UX 개선 기능. `localStorage`로 클라이언트 사이드에서 완결.

#### 훅 구조 (`src/hooks/useRecentSearch.js`)

| 반환값 | 타입 | 설명 |
|--------|------|------|
| `recents` | `string[]` | 저장된 검색어 배열 (최대 5개, 최신 순) |
| `addSearch(keyword)` | Function | 중복 제거 후 선두 삽입, `slice(0, 5)` 상한 유지 |
| `removeSearch(keyword)` | Function | 특정 키워드만 삭제 |
| `clearAll()` | Function | 전체 초기화 |

- **저장 키**: `codetrip_recent_searches`

#### Header.jsx 연동 포인트

| 이벤트 | 동작 |
|--------|------|
| 검색창 `onFocus` | `setSearchFocused(true)` → 드롭다운 표시 |
| 외부 클릭 (`mousedown`) | `setSearchFocused(false)` → 드롭다운 숨김 |
| Enter 키 입력 | `addSearch(kw)` 호출 후 Explore 이동 |
| 항목 클릭 (`onMouseDown`) | `handleRecentClick()` — blur 레이스 컨디션 방지 |
| 개별 X 버튼 (`onMouseDown`) | `e.stopPropagation()` + `removeSearch(kw)` |
| "전체 삭제" (`onMouseDown`) | `clearAll()` |

#### 드롭다운 표시 조건

- `searchFocused === true` AND `recents.length > 0`

---

## 16. 알림 시스템 (2026-04-28 추가)

### 16.1 개요

게시판·여행지 댓글 작성 시 게시글 작성자에게 서버 사이드 알림을 INSERT하고, 헤더 알림 벨 드롭다운에서 조회·읽음처리·삭제할 수 있는 실시간 알림 시스템.

### 16.2 DB 스키마 (`notifications`)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | INT AUTO_INCREMENT | PK |
| `user_id` | INT | 알림 수신 대상 사용자 |
| `message` | TEXT | 알림 메시지 |
| `content_id` | VARCHAR | 관련 게시글/여행지 ID (클릭 시 이동 대상) |
| `is_read` | BOOLEAN DEFAULT FALSE | 읽음 여부 |
| `created_at` | DATETIME | 생성 시각 |

### 16.3 백엔드 API (`server/routes/notificationRoutes.js`)

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/notifications` | GET | 최신 30개 조회 + `unreadCount` |
| `/api/notifications/read-all` | PUT | 전체 읽음 처리 |
| `/api/notifications/:id/read` | PUT | 개별 읽음 처리 |
| `/api/notifications/:id` | DELETE | 개별 삭제 |
| `/api/notifications/read` | DELETE | 읽은 알림 전체 삭제 |

모든 엔드포인트는 `authenticateToken` 미들웨어로 보호. 본인 알림만 조회·수정·삭제 가능.

### 16.4 알림 트리거

| 이벤트 | 트리거 위치 | 조건 |
|--------|-----------|------|
| 게시판 댓글 작성 | `boardRoutes.js` | 댓글 작성자 ≠ 게시글 작성자 |
| 여행지 댓글 작성 | `travelCommentRoutes.js` | 동일 조건 |

### 16.5 프론트엔드 (`src/api/notificationApi.js`, `src/components/Layout/Header.jsx`)

- `getNotifications()`, `markAllRead()`, `markOneRead(id)`, `deleteOneNotification(id)`, `deleteReadNotifications()` 함수.
- 헤더 알림 벨 버튼: 미읽은 알림 수 > 0일 때 붉은 점 표시.
- 드롭다운: 알림 목록 최대 `max-h-80` 스크롤, 개별 삭제 버튼, "읽은 알림 삭제" 버튼.
- 알림 클릭 시 `markOneRead` → `content_id` 있으면 `/explore/{content_id}` 이동.

---

## 17. 게시글 좋아요 기능 (2026-04-28 추가)

### 17.1 개요

게시판 게시글에 좋아요를 토글할 수 있는 기능. 유저당 1회 제한, 취소 가능.

### 17.2 DB 스키마 (`board_post_likes`)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | INT AUTO_INCREMENT | PK |
| `post_id` | INT | 게시글 FK |
| `user_id` | INT | 사용자 FK |
| `created_at` | DATETIME | 생성 시각 |

- `UNIQUE KEY (post_id, user_id)` — 중복 좋아요 DB 레벨 방지.

### 17.3 API

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/board/posts/:id/like` | POST | 좋아요 토글 (추가/취소) |
| `/api/my/liked-posts` | GET | 내가 좋아요한 게시글 목록 |

`GET /api/board/posts` 및 `/api/board/posts/:id` 응답에 `like_count`, `is_liked` 필드 포함.

### 17.4 프론트엔드

- **`src/api/boardApi.js`**: `togglePostLike(postId)`, `getLikedPosts()` 추가.
- **`src/pages/Board.jsx`**: 게시글 카드 좋아요 버튼 + 좋아요 수 표시.
- **`src/pages/BoardDetail.jsx`**: 상세 페이지 좋아요 버튼, `fill-1` 아이콘으로 상태 시각화.
- **`src/pages/MyActivity.jsx`**: `LIKED POSTS` 탭 추가, 좋아요한 게시글 목록 조회·렌더링.

---

## 18. 관심지역 설정 기능 (2026-04-28 추가)

### 18.1 개요

Settings 페이지에서 사용자가 최대 3개의 관심지역을 체크박스로 선택·저장. 저장된 관심지역은 메인 페이지 즉흥 추천(`/api/travel/spontaneous`)과 Explore 자동 필터(`applyFavoriteRegions`)에 활용.

### 18.2 DB 스키마 (`user_favorite_regions`)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | INT AUTO_INCREMENT | PK |
| `user_id` | INT | 사용자 FK |
| `region_code` | VARCHAR | 행정구역 코드 (예: `'11'` = 서울) |
| `created_at` | DATETIME | 생성 시각 |

- `UNIQUE KEY (user_id, region_code)` — 중복 등록 방지.

### 18.3 API

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/user/favorite-regions` | GET | 관심지역 코드 목록 조회 |
| `/api/user/favorite-regions` | PUT | 코드 배열 저장 (최대 3개, 기존 데이터 전체 교체) |

### 18.4 프론트엔드 (`src/pages/Settings.jsx`, `src/api/authApi.js`)

- 마운트 시 `getFavoriteRegions()` 로 초기값 복원.
- 17개 시도 체크박스, 3개 초과 선택 비활성화.
- 저장 시 `setFavoriteRegions(codes)` 후 성공/실패 토스트.

---

## 19. Toast 시스템 Context 기반 전역 개편 (2026-04-29)

### 개요

기존 `useToast` 훅이 컴포넌트마다 독립 상태를 생성하여 복수 Toast가 동시 표시되는 문제를 해결. React Context로 전역 단일 인스턴스화.

### 파일 변경

| 파일 | 변경 내용 |
|------|----------|
| `src/context/ToastContext.jsx` | 신규: `ToastProvider`, `ToastContext` 정의. `showToast` 콜백 전역 제공. |
| `src/hooks/useToast.js` | `ToastContext.useToast` re-export로 대체. 기존 import 경로 유지. |
| `src/App.jsx` | 라우터 외부 최상위에 `<ToastProvider>` 래핑. |
| `src/components/Toast.jsx` | `ToastProvider` 내부에서 단일 렌더링. |

### 적용 범위

`Board.jsx`, `Explore.jsx`, `Festivals.jsx`, `MyActivity.jsx`, `MyPage.jsx`, `useExploreStore.js`, `useWishlistStore.js`, `travelApi.js`, `travelInfoApi.js` 등 전 페이지·스토어에서 서버 오류 시 `useToast()`로 토스트 메시지 표시.

---

## 20. 프로필 사진 클라이언트 사이드 압축 (2026-04-29)

### 개요

1MB를 초과하는 이미지를 업로드하기 전에 브라우저 Canvas API로 압축하여 서버 Multer 5MB 제한 도달 없이 안전하게 업로드.

### 구현 (`src/pages/Settings.jsx` — `compressImage` 함수)

| 파라미터 | 값 |
|---------|---|
| 임계 크기 | 1MB (`MAX_UPLOAD_BYTES`) |
| 최대 해상도 | 1920px (`MAX_DIMENSION`) |
| 초기 JPEG 품질 | 0.85 |
| 품질 감소 단계 | 0.1씩 감소, 최소 0.05 |
| 출력 형식 | `image/jpeg`, 확장자 `.jpg`로 변환 |

- 1MB 이하 파일은 원본 그대로 사용.
- 해상도 비율 유지하며 리사이즈 후 `canvas.toBlob()` 반복 호출.
- 결과 `File` 객체를 FormData에 주입하여 기존 업로드 흐름 유지.

