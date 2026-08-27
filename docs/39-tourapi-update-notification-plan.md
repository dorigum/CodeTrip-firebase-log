# TourAPI 신규 여행지 알림 구현 계획

이 문서는 한국관광공사 TourAPI에 신규 여행지 정보가 추가되었을 때 CodeTrip에서 알림으로 노출하는 기능의 구현 방향과 운영 기준을 정의합니다.

## 1. 목적

CodeTrip은 여행지 탐색, 위시리스트, AI 일정 생성 기능을 중심으로 사용자가 여행 후보를 발견하고 저장하는 흐름을 제공합니다. TourAPI 신규 여행지 알림은 사용자가 직접 검색하지 않아도 새로 추가된 여행지 후보를 확인할 수 있게 하여, 탐색 경험을 확장하는 기능입니다.

## 2. 현재 프로젝트 적용 방식

현재 프로젝트는 Firebase Hosting, Firebase Authentication, Realtime Database, Firebase Functions 구조를 사용합니다. 따라서 AWS/Express 서버에서 처리하던 신규 데이터 감지 로직은 Firebase Scheduled Function으로 이전하는 방식이 적합합니다.

구현 구조는 아래와 같습니다.

1. Firebase Scheduler가 하루 1회 `syncTourApiUpdates` 함수를 실행합니다.
2. 함수가 한국관광공사 `KorService2.areaBasedList2`를 이미지가 있는 등록일 최신순 기준으로 조회합니다.
3. 이미 저장된 `contentId`와 비교해 신규 여행지만 `tourApiUpdates/items/{contentId}`에 저장합니다.
4. Header 알림 UI는 기존 `users/{uid}/notifications`와 공용 `tourApiUpdates/items`를 함께 조회합니다.
5. 사용자의 읽음·숨김 상태는 `users/{uid}/tourApiUpdateReads/{contentId}`에 저장합니다.

## 3. 데이터 모델

### 3.1 공용 신규 여행지 피드

```text
tourApiUpdates/items/{contentId}
  contentId
  contentTypeId
  title
  addr1
  addr2
  areaCode
  sigunguCode
  firstimage
  createdtime
  modifiedtime
  detectedAt
  source
```

이 경로는 로그인 사용자에게 읽기만 허용합니다. 쓰기는 클라이언트에서 수행하지 않고 Firebase Admin SDK를 사용하는 Scheduled Function에서만 수행합니다.

### 3.2 사용자별 읽음·숨김 상태

```text
users/{uid}/tourApiUpdateReads/{contentId}
  is_read
  read_at
  hidden
  hidden_at
```

공용 신규 여행지 피드를 사용자별로 복제하지 않고, 사용자가 읽었거나 숨긴 상태만 개인 경로에 저장합니다. 이 방식은 사용자 수가 늘어나도 대량 fan-out 쓰기를 줄일 수 있습니다.

## 4. 운영 기준

- 조회 주기는 초기 MVP 기준 하루 1회로 설정합니다.
- 신규 판별 기준은 `contentId`입니다.
- 한 번에 확인하는 TourAPI 행 수는 30개로 제한합니다.
- 저장된 신규 여행지 피드는 최근 100개까지만 유지합니다.
- TourAPI 인증키는 `TOUR_API_SERVICE_KEY` Firebase Functions Secret으로 관리합니다.
- 인증키는 저장소, 로그, 문서에 직접 기록하지 않습니다.
- 신규 여행지 알림 동기화 경로는 클라이언트의 `VITE_TRAVEL_INFO_API_KEY`를 사용하지 않고 Functions Secret만 사용합니다.
- 기존 여행지 탐색·상세 조회의 클라이언트 TourAPI 호출은 별도 프록시 이전 작업으로 분리해 관리합니다. 신규 알림 기능의 배포 검증과 키 교체 범위는 `syncTourApiUpdates`에서 사용하는 Secret 경로를 기준으로 합니다.

## 5. 배포 전 준비값

Functions 배포 전에 아래 Secret이 필요합니다.

```bash
firebase functions:secrets:set TOUR_API_SERVICE_KEY
```

Secret에는 한국관광공사 TourAPI 서비스 키를 입력합니다. 신규 여행지 알림 기능에서는 이 Secret만 사용하며, 키 값을 문서나 커밋에 남기지 않습니다. 기존에 브라우저 번들에서 사용되었거나 노출 가능성이 있는 키는 필요한 서비스 영향 범위를 확인한 뒤 교체하거나 폐기합니다.

## 6. 검증 기준

- `npm run lint`가 통과해야 합니다.
- `npm run build`가 통과해야 합니다.
- `npm --prefix functions run lint`가 통과해야 합니다.
- `syncTourApiUpdates`는 TourAPI `resultCode`가 `0000`이고 `response.body.items.item` 구조가 존재할 때만 성공으로 기록해야 합니다.
- `syncTourApiUpdates`는 등록일 최신순 조회를 사용해 첫 페이지에 최근 등록 데이터가 포함되도록 해야 합니다.
- `tourApiUpdates/items`는 로그인 사용자에게 읽히고, 클라이언트 직접 쓰기는 거부되어야 합니다.
- Header 알림 목록에는 기존 사용자 알림과 TourAPI 신규 여행지 알림이 최신순으로 함께 표시되어야 합니다.
- TourAPI 신규 여행지 알림을 클릭하면 `/explore/{contentId}` 상세 화면으로 이동해야 합니다.
- 신규 여행지 알림의 읽음 처리, 개별 숨김 처리, 읽은 알림 삭제가 동작해야 합니다.

## 7. 후속 고도화

초기 구현은 모든 로그인 사용자에게 공용 신규 여행지 피드를 보여주는 방식입니다. 이후에는 사용자의 관심 지역, 위시리스트 폴더, 최근 탐색 지역을 기준으로 개인화 알림을 제공할 수 있습니다.

다만 개인화 알림은 사용자별 쓰기량이 늘어날 수 있으므로, 비용과 Realtime Database 쓰기량을 측정한 뒤 도입하는 것이 좋습니다.
