# 공모전 OpenAPI 제출용 작성표

이 문서는 CodeTrip의 한국관광공사 OpenAPI 활용 정보를 공모전 제출 페이지와 기능설명서에 옮겨 적을 때 사용할 작성표입니다. 인증키 원문은 이 문서에 기록하지 않습니다.

## 작성 원칙

- 제출 페이지에는 공공데이터포털에서 확인한 인코딩키와 디코딩키를 직접 입력합니다.
- 저장소에는 인증키 원문, 개인 계정 이메일, 신청자 개인정보를 기록하지 않습니다.
- 기능설명서에는 API 인증키가 아니라 활용 API명, endpoint, 서비스 내 활용 목적만 작성합니다.
- 제출 페이지의 OpenAPI 활용 목록, 기능설명서 5페이지, 코드상 endpoint 목록이 일치해야 합니다.
- 최종 제출 전에는 `docs/20-openapi-submission-verification.md` 기준으로 실제 제출 계정 키와 배포 환경변수를 대조합니다.

## 제출 페이지 입력용 요약

아래 내용은 제출 페이지의 “활용한 한국관광공사 OpenAPI” 항목에 적기 위한 요약 기준입니다.

| 구분 | 제출용 명칭 | CodeTrip 활용 요약 | 제출 포함 여부 |
|---|---|---|---|
| 한국관광공사 OpenAPI | 국문 관광정보 서비스 `KorService2` | 여행지 목록, 키워드 검색, 상세 정보, 상세 이미지, 지역·시군구 코드, 축제·행사 정보 조회 | 포함 |
| 한국관광공사 OpenAPI | 관광사진 정보 `PhotoGalleryService1` | 홈 화면 관광 사진 데이터 조회 | 포함 |

## 기능설명서 5페이지 작성용 문구

공간이 부족하면 아래 축약 문구를 사용합니다.

> 한국관광공사 국문 관광정보 서비스 `KorService2`를 활용해 여행지 목록, 키워드 검색, 상세 정보, 이미지, 지역 코드, 축제·행사 정보를 조회합니다. 관광사진 정보 `PhotoGalleryService1`의 `galleryList1`은 홈 화면 관광 이미지 데이터에 활용합니다. AI 일정 생성 결과는 TourAPI 검색·상세 데이터를 함께 활용해 장소 신뢰성을 보완합니다.

더 짧게 써야 하면 아래 문구를 사용합니다.

> `KorService2`로 여행지 목록·검색·상세·이미지·지역코드·축제 정보를 조회하고, `PhotoGalleryService1`로 홈 관광 사진을 제공합니다.

## Endpoint별 제출 보조 설명

| 서비스 | Endpoint | 제출 보조 설명 | 실제 활용 화면·기능 | 코드 근거 |
|---|---|---|---|---|
| `KorService2` | `areaBasedList2` | 지역·테마 기반 여행지 목록 조회 | 여행지 탐색, 추천 목록 | `src/api/travelInfoApi.js` |
| `KorService2` | `searchKeyword2` | 키워드 기반 여행지 검색과 AI 후보 장소 검색 | 탐색 검색, AI 장소 후보 검증 | `src/api/travelInfoApi.js` |
| `KorService2` | `detailCommon2` | 여행지 상세 공통 정보와 AI 장소 contentId 검증 | 여행지 상세, 위시리스트 저장 정보, AI 장소 검증 | `src/api/travelInfoApi.js`, `src/api/wishlistApi.js` |
| `KorService2` | `detailIntro2` | 콘텐츠 유형별 소개 정보 조회 | 여행지 상세 소개 | `src/api/travelInfoApi.js` |
| `KorService2` | `detailInfo2` | 상세 부가 정보 조회 | 여행지 상세 부가 정보 | `src/api/travelInfoApi.js` |
| `KorService2` | `detailImage2` | 여행지 상세 이미지 조회 | 여행지 상세 이미지 | `src/api/travelInfoApi.js` |
| `KorService2` | `ldongCode2` | 지역·시군구 코드 조회 | 지역·시군구 필터 | `src/api/travelInfoApi.js` |
| `KorService2` | `searchFestival2` | 진행·예정 축제 목록 조회 | 축제·행사 화면 | `src/api/travelInfoApi.js` |
| `PhotoGalleryService1` | `galleryList1` | 관광 사진 데이터 조회 | 홈 화면 관광 이미지 | `src/api/travelApi.js` |

## 제출 전 대조 체크

| ID | 대조 항목 | 확인 기준 | 결과 |
|---|---|---|---|
| API-01 | 제출 계정 키 확인 | 공공데이터포털에서 인코딩키·디코딩키를 확인했습니다. 원문은 저장소에 기록하지 않습니다. | 미확인 |
| API-02 | 국문 관광정보 서비스 신청 확인 | 제출 계정에서 `KorService2` 활용 가능한 키인지 확인합니다. | 미확인 |
| API-03 | 관광사진 정보 신청 확인 | 제출 계정에서 `PhotoGalleryService1` 활용 가능한 키인지 확인합니다. | 미확인 |
| API-04 | 배포 환경변수 대조 | 배포 서비스가 사용하는 `VITE_TRAVEL_INFO_API_KEY`, `VITE_GALLERY_API_KEY`가 제출 계정 기준과 일치하는지 확인합니다. | 미확인 |
| API-05 | 기능설명서 5페이지 대조 | 최종 PDF의 OpenAPI 목록이 이 문서의 제출용 명칭과 일치합니다. | 미실행 |
| API-06 | 코드 endpoint 대조 | `src/api/travelInfoApi.js`, `src/api/travelApi.js`의 endpoint가 이 문서와 일치합니다. | 코드 근거 확인 |
| API-07 | 공개 화면 동작 확인 | 홈, 탐색, 축제, 상세 화면에서 관광 데이터가 표시됩니다. | 미실행 |
| API-08 | 인증키 노출 점검 | 기능설명서, 캡처, PR, 문서에 인증키 원문이 없습니다. | 미실행 |

## 제출 페이지에 기록하지 말아야 할 것

| 금지 항목 | 이유 |
|---|---|
| API 인증키 원문을 Git 문서에 기록 | 비밀정보 노출 위험 |
| 개인 공공데이터포털 계정 이메일 | 개인정보 노출 위험 |
| Firebase 환경변수 실제 값 | 배포 설정과 비밀정보 노출 위험 |
| API 호출 URL 전체 원문 | query string에 인증키가 포함될 수 있음 |
| 브라우저 개발자 도구 캡처 | 키, 요청 URL, 토큰이 노출될 수 있음 |

## 제출 후 기록할 수 있는 정보

| 항목 | 기록 가능 여부 | 기록 위치 |
|---|---|---|
| OpenAPI 활용 목록 최종 대조 완료 여부 | 가능 | `docs/13-validation-report.md` |
| 최종 기능설명서에 적은 API명 | 가능 | `docs/17-submission-artifact-manifest.md`, 최종 PDF |
| 인증키 입력 완료 여부 | 가능 | `docs/25-final-input-checklist.md` |
| 인증키 원문 | 금지 | 저장소 기록 금지 |
| 제출 계정 개인정보 | 금지 | 저장소 기록 금지 |

## 현재 상태

현재 코드 근거 기준으로 `KorService2`와 `PhotoGalleryService1` 활용 목록은 정리되어 있습니다. 다만 실제 제출 계정의 인코딩키·디코딩키 확인, 배포 환경변수와 제출 계정 키의 일치 여부, 최종 PDF 5페이지의 API 목록 대조는 아직 제출 직전 확인이 필요합니다.
