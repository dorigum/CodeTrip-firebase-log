# 제출 산출물 manifest

이 문서는 공모전 제출용 PPTX/PDF 바이너리를 Git에 포함하지 않더라도 생성 이력과 무결성을 추적하기 위한 비바이너리 manifest입니다. 실제 제출 파일은 로컬 또는 외부 저장 위치에서 관리하고, 이 문서에는 파일명, 생성일, 양식 버전, checksum, 전달 위치, 검증 기록만 남깁니다.

## 산출물 기준

| 항목 | 내용 |
|---|---|
| 산출물 목적 | 2026 관광데이터 활용 공모전 웹·앱 개발 부문 기능설명서 초안 |
| 양식 원본 | `2026 관광데이터 활용 공모전 웹앱 개발 부문 기능설명서 양식(작성용).pptx` |
| 양식 버전 | 2026 공모전 제공 작성용 PPTX |
| 생성일 | 2026-08-11, 2026-08-12 |
| 생성 위치 | `output/contest/` |
| Git 포함 여부 | 제외 |
| 외부 전달 위치 | 미정 |

## 파일 manifest

| 파일명 | 형식 | 크기(bytes) | SHA-256 | 상태 |
|---|---|---:|---|---|
| `CodeTrip_2026_관광데이터_공모전_기능설명서_초안.pptx` | PPTX | 509253 | `85FC93EB35E71475E48A9BFF74D26E05B99A314BE213B699DA804C9CF7BAD5FE` | 초안 |
| `CodeTrip_2026_관광데이터_공모전_기능설명서_초안.pdf` | PDF | 289387 | `D6C0401961995F33C4E60F15A4DA3C5B6F4CEBBD30756E803B1F2F738BACE86B` | 초안 |
| `CodeTrip_2026_관광데이터_공모전_기능설명서_5페이지_초안.pptx` | PPTX | 540150 | `5AE7685479C55905C503F48FA08B87C29AD27FCF2040847DD31BC2AFA916608D` | 5페이지 압축 초안 |
| `CodeTrip_2026_관광데이터_공모전_기능설명서_5페이지_초안.pdf` | PDF | 198252 | `B8EA93ED55AFA9094B39FE7A6F12B3A320C0B9EF0E0F82BF9071FCAAC3AD9515` | 5페이지 압축 초안 |
| `CodeTrip_2026_관광데이터_공모전_기능설명서_5페이지_화면캡처_초안.pptx` | PPTX | 1067644 | `535F45377437FC57457A44E28CDA284CEDC96FD0BDB43C4B7266718E0E7E94BC` | 화면 캡처 삽입 초안 |
| `CodeTrip_2026_관광데이터_공모전_기능설명서_5페이지_화면캡처_초안.pdf` | PDF | 374454 | `1F8AEDC88AF559182F38940778330E2D20BF3950CCFB9EBD918768EBE0823F6E` | 화면 캡처 삽입 초안 |
| `CodeTrip_2026_관광데이터_공모전_기능설명서_5페이지_제출항목정리_초안.pptx` | PPTX | 1062933 | `08E464887C7E399671CB4FCB783905818807ED08F5637BF00EC86EB60718503A` | 제출 항목 정리 초안, 12pt 이상 확인 |
| `CodeTrip_2026_관광데이터_공모전_기능설명서_5페이지_제출항목정리_초안.pdf` | PDF | 394311 | `D671E4AB1FCEFB4D5126E09B974342A952513C0320436EB2679CF5D689593CFB` | 제출 항목 정리 초안, 12pt 이상 확인 |

## 화면 캡처 manifest

| 파일명 | 캡처 대상 | 크기(bytes) | 상태 |
|---|---|---:|---|
| `screenshots/01-home.png` | 배포 URL 홈 화면 | 811972 | 대표 이미지 후보 |
| `screenshots/02-explore.png` | 여행지 탐색 화면 | 671935 | 상세 이미지 후보 |
| `screenshots/03-festivals.png` | 축제·행사 화면 | 764274 | 상세 이미지 후보 |
| `screenshots/06-login.png` | 로그인 화면 | 59502 | 상세 이미지 후보 |
| `screenshots/04-ai-planner-login-gate.png` | AI Planner 접근 제한 화면 | 79729 | 보조 상세 이미지 후보 |

## 최종 기능설명서 산출물 기록 템플릿

최종 PPTX/PDF는 사용자가 기능설명서 양식에 화면 캡처와 실제 제출 값을 반영한 뒤 생성합니다. 저장소에는 바이너리를 포함하지 않고, 아래 표에 파일명·생성일·양식 버전·파일 크기·SHA-256·외부 전달 위치만 기록합니다.

| 구분 | 최종 파일명 | 상태 | 생성일 | 양식 버전 | 크기(bytes) | SHA-256 | 외부 전달 위치 | 비고 |
|---|---|---|---|---|---:|---|---|---|
| PPTX | `CodeTrip_2026_관광데이터_공모전_기능설명서_최종.pptx` | 작성 예정 | 미정 | 2026 관광데이터 활용 공모전 웹·앱 개발 부문 제공 양식 | 미측정 | 미측정 | 한국관광 콘텐츠랩 제출 페이지 또는 로컬 보관 위치 | `output/contest/` 보관, Git 제외 |
| PDF | `CodeTrip_2026_관광데이터_공모전_기능설명서_최종.pdf` | 작성 예정 | 미정 | PPTX 최종본 PDF 변환 | 미측정 | 미측정 | 한국관광 콘텐츠랩 제출 페이지 | 5페이지 이하, 12pt 이상, 10MB 미만, 정상 열람 확인 필요 |

## 최종 화면 캡처 후보 매핑

기능설명서에 첨부할 화면은 아래 후보를 우선 사용합니다. 실제 파일을 정리할 때는 원본 캡처명을 보존하거나 `screenshots/final/` 하위의 권장 파일명으로 복사한 뒤 이 manifest에 반영합니다.

| 기능설명서 역할 | 권장 파일명 | 원본 캡처 | 화면 | 상태 | 비고 |
|---|---|---|---|---|---|
| 대표 이미지 | `screenshots/final/01-home-dashboard.png` | `스크린샷 2026-08-16 215104.png` | 홈 대시보드 | 후보 확정 | 저장 여행지, 폴더, 다가오는 일정이 함께 보이는 화면입니다. |
| 상세 이미지 1 | `screenshots/final/02-ai-planner-result.png` | `스크린샷 2026-08-16 213508.png` | AI Planner 생성 결과 | 후보 확정 | Gemini Functions 전환 후 생성 결과와 저장 버튼이 보이는 화면입니다. |
| 상세 이미지 2 | `screenshots/final/03-explore-filtered.png` | `스크린샷 2026-08-16 214611.png` | 여행지 탐색 | 후보 확정 | 지역·테마 필터와 TourAPI 기반 여행지 카드가 함께 보이는 화면입니다. |
| 상세 이미지 3 | `screenshots/final/04-travel-detail-map.png` | `스크린샷 2026-08-16 214228.png` | 여행지 상세·카카오 지도 | 후보 확정 | Kakao JavaScript SDK 도메인 설정 후 지도 렌더링이 정상 확인된 화면입니다. |
| 상세 이미지 4 | `screenshots/final/05-mypage-ai-course.png` | `스크린샷 2026-08-16 213738.png` | 마이페이지·위시리스트·AI 코스 | 후보 확정 | 개인 폴더와 저장된 AI 일정의 연결 흐름을 보여줍니다. |
| 상세 이미지 5 | `screenshots/final/06-community-post-detail.png` | `스크린샷 2026-08-16 214047.png` | 커뮤니티 게시글 상세 | 후보 확정 | 게시글 상세, 댓글, 작성자 액션이 보이는 화면입니다. |

## 최종 산출물 검증 기록 템플릿

최종 PPTX/PDF를 생성한 뒤에는 아래 항목을 채워 제출 재현성을 남깁니다. 특히 PDF 열람 검증은 수행자, 환경, 확인 흐름, 결과 또는 실패 지점을 함께 기록합니다.

| 날짜 | 수행자 | 대상 파일 | 환경 | 확인 흐름 | 결과 | 실패 지점 | 증빙 |
|---|---|---|---|---|---|---|---|
| 미정 | 미정 | `CodeTrip_2026_관광데이터_공모전_기능설명서_최종.pptx` | 미정 | 제공 양식 기반 작성 → 모든 필수 항목 작성 확인 → 12pt 이상 육안 확인 | 미확인 | 미확인 | 미정 |
| 미정 | 미정 | `CodeTrip_2026_관광데이터_공모전_기능설명서_최종.pdf` | 미정 | PDF 변환 → 5페이지 이하 확인 → 10MB 미만 확인 → 정상 열람 확인 → SHA-256 기록 | 미확인 | 미확인 | 미정 |

## 최종본 checksum 기록 방법

PowerShell에서 최종 파일을 생성한 뒤 아래 명령으로 파일 크기와 SHA-256을 확인합니다. 확인한 값은 이 문서의 `최종 기능설명서 산출물 기록 템플릿`에 옮겨 적습니다.

```powershell
Get-Item "output\contest\CodeTrip_2026_관광데이터_공모전_기능설명서_최종.pdf"
Get-FileHash "output\contest\CodeTrip_2026_관광데이터_공모전_기능설명서_최종.pdf" -Algorithm SHA256
```

## 열람 검증 기록

| 날짜 | 수행자 | 환경 | 확인 흐름 | 결과 | 실패 지점 |
|---|---|---|---|---|---|
| 2026-08-11 | Codex | Windows PowerPoint COM export, `pypdf` text extraction | PPTX 초안 생성 → PowerPoint PDF 변환 → PDF 9페이지 확인 → 슬라이드별 텍스트 추출 확인 | 초안 열람 가능, 이미지 삽입 전 상태 | 실제 화면 캡처 미삽입, 최종 제출용 5페이지 이하 조건은 추가 편집 필요 |
| 2026-08-12 | Codex | Windows PowerPoint COM edit/export, `pypdf` page/text extraction, SHA-256 hash check | 제공 PPTX 양식 복사 → 5장 구성으로 압축 → PowerPoint PDF 변환 → PDF 5페이지·198252 bytes 확인 → 텍스트 추출 가능 여부 확인 → PPTX/PDF checksum 기록 | 5페이지 이하·10MB 미만 조건을 만족하는 압축 초안 생성 확인 | 실제 서비스 화면 캡처 미삽입, 양식 수정 없음·모든 항목 작성·12포인트 이상 조건은 최종본에서 추가 육안 검증 필요 |
| 2026-08-12 | Codex | Chrome headless screenshot, Windows PowerPoint COM edit/export, slide PNG export, `pypdf` page/text extraction, SHA-256 hash check | 배포 URL 화면 캡처 생성 → 5페이지 PPTX 3번 슬라이드에 대표·상세 이미지 후보 삽입 → PDF 변환 → PDF 5페이지·374454 bytes 확인 → 3번 슬라이드 PNG 렌더 육안 확인 → PPTX/PDF checksum 기록 | 화면 캡처가 삽입된 5페이지 이하·10MB 미만 초안 생성 확인 | 로그인 후 AI·마이페이지·커뮤니티 내부 화면은 테스트 계정 생성 후 교체 필요 |
| 2026-08-12 | Codex | Windows PowerPoint COM rebuild/export, 전체 슬라이드 PNG export, `pypdf` page/text extraction, SHA-256 hash check | 기존 화면 캡처 초안 전체 QA → 원본 가이드 문구 잔존 확인 → 5페이지 제출 항목 정리본 재작성 → PDF 변환 → PDF 5페이지·394335 bytes 확인 → 1~5번 슬라이드 PNG 렌더 육안 확인 → PPTX/PDF checksum 기록 | 원본 가이드 문구가 제거된 읽기 가능한 5페이지 제출 항목 정리 초안 생성 확인 | 접수 팀명 입력 필요, 로그인 후 AI·마이페이지·커뮤니티 내부 화면 교체 필요, 최종 제출 전 12포인트 이상·양식 수정 없음 조건 육안 검증 필요 |
| 2026-08-12 | Codex | Windows PowerPoint COM font inspection, PowerPoint PDF export, `pypdf` page/text extraction, SHA-256 hash check | 제출 항목 정리본 텍스트 객체 54개 검사 → 12pt 미만 5개 배지 텍스트 수정 → 재검사 → PDF 재변환 → PDF 5페이지·394311 bytes 확인 → PPTX/PDF checksum 갱신 | 최소 글자 크기 12pt 이상, 5페이지 이하, 10MB 미만 조건 확인 | 접수 팀명 입력 필요, 로그인 후 AI·마이페이지·커뮤니티 내부 화면 교체 필요, 양식 수정 없음 조건은 최종본 육안 검증 필요 |

## 다음 작업

- 기능설명서에 사용할 최종 화면 캡처를 사용자가 직접 삽입한 뒤, 실제 파일명과 산출물 checksum을 이 문서에 기록합니다.
- 접수 페이지 기준 팀명을 1번 슬라이드의 `[접수 팀명 입력]` 위치에 반영합니다.
- 5페이지 압축 초안의 문구와 배치가 제공 양식 수정 금지 조건에 어긋나지 않는지 육안 검토합니다.
- 최종본 생성 후 파일 용량 10MB 미만, 정상 열람 여부, 12포인트 이상 조건을 다시 확인합니다.
- 외부 제출 또는 공유 위치가 확정되면 이 문서의 `외부 전달 위치`를 갱신합니다.
