# 한국관광공사 OpenAPI 제출 정보 검증 절차

이 문서는 공모전 1차 심사 제출 전 CodeTrip이 활용한 한국관광공사 OpenAPI 정보를 제출 페이지 기준으로 확인하기 위한 절차입니다. 실제 인증키, 인코딩키, 디코딩키는 저장소에 기록하지 않습니다. 제출 페이지와 기능설명서에 옮겨 적을 작성 문구는 `docs/34-openapi-submission-copy-sheet.md`를 따릅니다.

## 목적

공모전 제출 항목에는 한국관광공사 OpenAPI 활용 정보와 인증키 정보가 포함됩니다. 제출한 인증키를 기준으로 활용 API별 호출 건수와 서비스 내 API 활용 내역이 확인될 수 있으므로, 코드에서 실제 사용하는 API와 제출 페이지에 입력하는 API 목록이 일치해야 합니다.

## 제출 전 확인 원칙

- 인증키 원문은 Git, 문서, 캡처 이미지, 이슈, PR 본문에 남기지 않습니다.
- 제출 페이지에는 공공데이터포털에서 확인한 인코딩키와 디코딩키를 정확히 입력합니다.
- 기능설명서에는 인증키가 아니라 활용 API명, endpoint, 서비스 내 활용 목적만 작성합니다.
- 실제 배포 서비스에서 사용하는 키와 제출 계정의 키가 다르면 호출 건수 확인이 어긋날 수 있으므로 제출 전 대조합니다.

## CodeTrip 활용 API 목록

| 서비스 | Endpoint | 서비스 내 활용 목적 | 코드 근거 | 제출 상태 |
|---|---|---|---|---|
| 국문 관광정보 서비스 `KorService2` | `areaBasedList2` | 지역·테마 기반 여행지 목록 조회 | `src/api/travelInfoApi.js` | 제출 목록 포함 |
| 국문 관광정보 서비스 `KorService2` | `searchKeyword2` | 키워드 검색, AI 후보 장소 검색 | `src/api/travelInfoApi.js` | 제출 목록 포함 |
| 국문 관광정보 서비스 `KorService2` | `detailCommon2` | 여행지 상세 공통 정보, AI 장소 contentId 검증 | `src/api/travelInfoApi.js`, `src/api/wishlistApi.js` | 제출 목록 포함 |
| 국문 관광정보 서비스 `KorService2` | `detailIntro2` | 콘텐츠 유형별 소개 정보 조회 | `src/api/travelInfoApi.js` | 제출 목록 포함 |
| 국문 관광정보 서비스 `KorService2` | `detailInfo2` | 상세 부가 정보 조회 | `src/api/travelInfoApi.js` | 제출 목록 포함 |
| 국문 관광정보 서비스 `KorService2` | `detailImage2` | 여행지 상세 이미지 조회 | `src/api/travelInfoApi.js` | 제출 목록 포함 |
| 국문 관광정보 서비스 `KorService2` | `ldongCode2` | 지역·시군구 코드 조회 | `src/api/travelInfoApi.js` | 제출 목록 포함 |
| 국문 관광정보 서비스 `KorService2` | `searchFestival2` | 진행·예정 축제 목록 조회 | `src/api/travelInfoApi.js` | 제출 목록 포함 |
| 관광사진 정보 `PhotoGalleryService1` | `galleryList1` | 홈 화면 관광 사진 데이터 조회 | `src/api/travelApi.js` | 제출 목록 포함 |

## 환경변수 대조 기준

| 환경변수 | 의미 | 제출 전 확인 |
|---|---|---|
| `VITE_API_BASE_URL` | TourAPI 기본 URL | 배포 빌드 기준 값 확인 |
| `VITE_TRAVEL_INFO_API_URL` | TourAPI 서비스 경로. 기본값은 `KorService2` | `KorService2` 사용 여부 확인 |
| `VITE_TRAVEL_INFO_API_KEY` | 국문 관광정보 서비스 인증키 | 제출 페이지 입력 키와 동일 계정인지 확인 |
| `VITE_GALLERY_API_KEY` | 관광사진 정보 인증키 | 제출 페이지 입력 키와 동일 계정인지 확인 |

`README.md`에는 예시 환경변수가 정리되어 있으나, 실제 값은 로컬 또는 배포 환경에서만 관리합니다.

## 검증 절차

1. 공공데이터포털에서 공모전 제출에 사용할 한국관광공사 OpenAPI 신청자 계정으로 로그인합니다.
2. 사용 중인 국문 관광정보 서비스와 관광사진 정보 서비스의 인코딩키·디코딩키를 확인합니다.
3. 로컬 또는 배포 환경변수의 `VITE_TRAVEL_INFO_API_KEY`, `VITE_GALLERY_API_KEY`가 제출 계정의 키와 일치하는지 확인합니다.
4. `src/api/travelInfoApi.js`에서 `KorService2` endpoint 사용 목록을 확인합니다.
5. `src/api/travelApi.js`에서 `PhotoGalleryService1`의 `galleryList1` 사용 여부를 확인합니다.
6. 배포 URL에서 홈, 탐색, 축제 화면을 열어 관광 데이터가 실제 표시되는지 확인합니다.
7. 기능설명서 5페이지의 OpenAPI 활용 목록과 이 문서의 활용 API 목록이 일치하는지 확인합니다.
8. 제출 페이지에는 인증키 원문을 입력하고, 저장소에는 검증 여부와 증빙 위치만 남깁니다.

## 기능설명서 작성 문구

기능설명서에는 아래 수준으로 작성합니다.

> CodeTrip은 한국관광공사 국문 관광정보 서비스 `KorService2`를 활용해 여행지 목록, 키워드 검색, 상세 정보, 상세 이미지, 지역 코드, 축제·행사 정보를 조회합니다. 또한 관광사진 정보 `PhotoGalleryService1`의 `galleryList1`을 활용해 홈 화면 관광 이미지 데이터를 제공합니다. AI 일정 생성 결과의 장소 신뢰성 관리를 위해 TourAPI 검색·상세 데이터를 검증 근거로 함께 활용합니다.

## 제출 전 판정

| 판정 | 조건 |
|---|---|
| 통과 | 제출 계정의 인증키, 실제 환경변수, 기능설명서 API 목록, 코드상 endpoint 목록이 일치합니다. |
| 부분 통과 | 코드상 API 목록은 정리되었으나 제출 계정 키 또는 호출 건수 확인이 미완료입니다. |
| 실패 | 기능설명서에 작성한 API와 코드상 실제 활용 API가 다르거나, 제출 키로 서비스 호출 확인이 불가능합니다. |

## 문서 갱신 규칙

- 인증키 원문은 어떤 문서에도 기록하지 않습니다.
- 최종 확인 결과는 `docs/13-validation-report.md`에 날짜, 기준 환경, 확인 흐름, 실패 지점으로 기록합니다.
- 체크리스트의 CS-05, CS-06 상태는 제출 페이지 기준 확인이 끝난 뒤 갱신합니다.
- 제출 페이지와 기능설명서에 적을 API 명칭과 축약 문구는 `docs/34-openapi-submission-copy-sheet.md`를 기준으로 맞춥니다.
