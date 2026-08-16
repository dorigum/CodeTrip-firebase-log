# API 캐시 측정표

이 문서는 CodeTrip의 API 캐시 효과를 개발·시연 세션 단위로 기록하기 위한 측정표입니다. 현재 `ApiCacheStatus` 패널과 `codetrip:api-cache-status` 이벤트는 개발 모드의 디버깅 증빙이므로, 운영 KPI로 주장하지 않고 릴리스별 수동 측정 근거로만 사용합니다.

## 1. 측정 원칙

- 측정 단위는 `릴리스 후보 커밋 + 브라우저 세션 + 주요 화면 흐름`으로 잡습니다.
- fresh cache hit은 `memory`, `local`, `remote`만 포함합니다.
- `stale`은 원천 API 실패 후 만료 캐시를 반환한 fallback이므로 cache hit에 포함하지 않고 안정성 지표로 따로 기록합니다.
- 원시 사용자 로그를 장기 저장하지 않습니다.
- 측정값이 없으면 `미측정`으로 기록하고 성과로 주장하지 않습니다.
- 민감한 query string, API key, 사용자 uid, 위치 원문은 기록하지 않습니다.

## 2. 이벤트 분류

| 이벤트 | 의미 | KPI 분류 | 비고 |
|---|---|---|---|
| `memory` | 같은 세션의 메모리 캐시에서 응답 | fresh cache hit | 가장 빠른 캐시 |
| `local` | 브라우저 localStorage 캐시에서 응답 | fresh cache hit | 같은 브라우저 재방문 효과 |
| `remote` | Realtime Database 읽기 전용 공유 캐시에서 응답 | fresh cache hit | 로그인 사용자만 사용 |
| `network` | 원천 API를 새로 호출 | cache miss | 성공 시 memory/local cache에 저장 |
| `stale` | 원천 API 실패 후 만료 캐시 반환 | stale fallback | fresh hit으로 계산하지 않음 |

## 3. 계산식

```text
fresh_cache_hit_count = memory + local + remote
total_cache_event_count = memory + local + remote + network + stale
cache_hit_rate = fresh_cache_hit_count / total_cache_event_count

stale_fallback_rate = stale / total_cache_event_count
network_rate = network / total_cache_event_count
```

`total_cache_event_count`가 0이면 비율은 `N/A`로 기록합니다.

## 4. 측정 절차

1. 로컬 또는 배포 URL을 엽니다.
2. 개발 모드 측정이면 `ApiCacheStatus` 패널과 브라우저 콘솔 이벤트를 확인합니다.
3. 브라우저 DevTools Console에서 필요한 경우 아래 임시 수집 코드를 실행합니다.
4. 동일 흐름을 1회차 cold-ish 세션, 2회차 warm 세션으로 나눠 기록합니다.
5. `memory`, `local`, `remote`, `network`, `stale` 개수를 세션별 측정표에 옮깁니다.
6. 캐시 적중률과 stale fallback 비율을 계산합니다.
7. 측정 환경, 브라우저, 로그인 여부, 커밋, URL을 함께 기록합니다.

## 5. 개발 모드 임시 이벤트 수집 코드

아래 코드는 브라우저 콘솔에서 수동 측정할 때만 사용합니다. 저장소 코드에 상시 반영하지 않습니다.

```js
window.__codetripCacheMetrics = {
  memory: 0,
  local: 0,
  remote: 0,
  network: 0,
  stale: 0,
  events: [],
};

window.addEventListener('codetrip:api-cache-status', (event) => {
  const source = event.detail?.source || 'unknown';
  if (source in window.__codetripCacheMetrics) {
    window.__codetripCacheMetrics[source] += 1;
  }
  window.__codetripCacheMetrics.events.push({
    source,
    scope: event.detail?.scope,
    service: event.detail?.service,
    stale: Boolean(event.detail?.stale),
    checkedAt: event.detail?.checkedAt,
  });
});
```

측정 후 아래 코드로 요약을 확인합니다.

```js
(() => {
  const metric = window.__codetripCacheMetrics;
  const fresh = metric.memory + metric.local + metric.remote;
  const total = fresh + metric.network + metric.stale;
  return {
    ...metric,
    fresh,
    total,
    cacheHitRate: total ? `${((fresh / total) * 100).toFixed(1)}%` : 'N/A',
    staleFallbackRate: total ? `${((metric.stale / total) * 100).toFixed(1)}%` : 'N/A',
    networkRate: total ? `${((metric.network / total) * 100).toFixed(1)}%` : 'N/A',
  };
})();
```

## 6. 세션별 측정표

| 날짜 | 기준 커밋 | 환경 | 로그인 | 측정 흐름 | memory | local | remote | network | stale | cache hit rate | stale fallback rate | 증빙 | 비고 |
|---|---|---|---|---|---:|---:|---:|---:|---:|---|---|---|---|
| YYYY-MM-DD | `commit` | 로컬/배포, 브라우저 | 예/아니오 | Home 진입 | 0 | 0 | 0 | 0 | 0 | N/A | N/A | DevTools 캡처 또는 수동 기록 | 미측정 |
| YYYY-MM-DD | `commit` | 로컬/배포, 브라우저 | 예/아니오 | Explore 목록 → 필터 변경 | 0 | 0 | 0 | 0 | 0 | N/A | N/A | DevTools 캡처 또는 수동 기록 | 미측정 |
| YYYY-MM-DD | `commit` | 로컬/배포, 브라우저 | 예/아니오 | Festivals 목록 → 페이지 이동 | 0 | 0 | 0 | 0 | 0 | N/A | N/A | DevTools 캡처 또는 수동 기록 | 미측정 |
| YYYY-MM-DD | `commit` | 로컬/배포, 브라우저 | 예/아니오 | TravelDetail 상세 진입 | 0 | 0 | 0 | 0 | 0 | N/A | N/A | DevTools 캡처 또는 수동 기록 | 미측정 |
| YYYY-MM-DD | `commit` | 로컬/배포, 브라우저 | 예/아니오 | Home 슬롯 추천 실행 | 0 | 0 | 0 | 0 | 0 | N/A | N/A | DevTools 캡처 또는 수동 기록 | 미측정 |

## 7. 화면별 기대 관찰 포인트

| 화면 | 주요 캐시 대상 | 기대 상태 | 주의 사항 |
|---|---|---|---|
| Home | 사진 API, 지역 기반 장소, 축제 미리보기, 날씨, 위치명 | 재방문 또는 같은 세션에서 `memory`/`local` 증가 | 슬롯 추천 실행 전에는 추천 후보 검색이 사전 호출되지 않아야 함 |
| Explore | TourAPI 목록·검색 | 동일 필터 재방문 시 fresh hit 증가 | 필터 변경은 새 cache key이므로 network가 정상일 수 있음 |
| Festivals | 축제 API pool | 같은 페이지·필터 재방문 시 fresh hit 증가 | `stale`은 hit이 아니라 fallback으로 별도 기록 |
| TravelDetail | 상세 공통·소개·반복정보·이미지 | 같은 상세 재방문 시 fresh hit 증가 | 댓글 조회는 Firebase 데이터이며 이 캐시 측정표의 분모에 포함하지 않음 |
| AI Planner | 후보 TourAPI, Gemini Callable | TourAPI 후보 조회만 캐시 대상 | Gemini 생성은 캐시 KPI가 아니라 AI 성공률 KPI로 분리 |

## 8. 현재 상태

- 캐시 이벤트 측정 계약: 정의됨
- 누적 측정값: 미측정
- 운영 자동 집계: 미구현
- 개발·시연 세션 수동 측정: 이 문서 기준으로 수행 가능

## 9. 다음 개선 후보

- `codetrip:api-cache-status` 이벤트를 개발 모드에서 누적 표시하는 간단한 debug table 추가
- 릴리스 검증 시 `docs/13-validation-report.md`의 성능 측정 기록 템플릿에 측정 요약 연결
- 운영 자동 집계가 필요할 경우 사용자 원문 로그가 아닌 익명 집계 이벤트만 저장하는 방식 검토
