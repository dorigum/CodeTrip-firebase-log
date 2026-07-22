# CodeTrip (코드트립) — Firebase 실시간 날씨 여행 일정 플랫폼

> **사용자 관심 지역 날씨를 반영한 실시간 추천 및 Firebase 기반의 프론트 단독 배포용 일정 플래너 서비스**

<br>

## 📌 프로젝트 소개

**CodeTrip**은 한국관광공사 TourAPI, 오픈 날씨 API(Open-Meteo) 및 **Firebase Realtime Database**를 연동한 실시간 여행 일정 및 커뮤니티 플랫폼입니다. 기존 Express/MySQL 백엔드 구조에서 Firebase Authentication, Realtime Database 및 Hosting 기반의 프론트 단독 서버리스 구조로 전환하여 배포 안정성과 데이터 처리 유연성을 대폭 향상시켰습니다.

---

## 🛠️ 주요 기능 (Key Features)

### 1. Firebase Serverless DB 및 Auth 전환
* **Firebase Authentication**: 이메일/비밀번호 기반 회원가입, 로그인 및 세션 관리 로직 구축.
* **Realtime Database**: 위시리스트, 좋아요, 알림, 댓글 데이터를 Firebase Nodes 구조에 맞게 마이그레이션하여 실시간 싱크 제공.
* **Security Rules**: `.json` 정책 파일을 통해 사용자 개인 데이터 노드에 대한 철저한 소유권 기반 접근 인가 제어.

### 2. 지능형 실시간 여행지 추천 엔진
* **날씨 및 관심사 결합**: **Open-Meteo API**를 활용한 15분 단위 실시간 기상 코드 분석으로 관심 지역에 어울리는 추천 관광지를 메인 화면에 랜덤 추출합니다.
* **최근 검색어 & 조회 로그**: 사용자가 최근에 찾아본 여행지(`recently_viewed.log`) 및 실시간 최근 검색어 내역을 마이 액티비티 탭에 유기적으로 연동합니다.

### 3. 위시리스트 및 동적 플래너 (Wishlist & Planner)
* **폴더별 메모 & 체크리스트**: 위시리스트 폴더 단위로 여행 시작/종료일을 설정하고, 폴더별 일정 메모 및 체크리스트(LIST/MEMO)를 작성해 여행 준비를 돕습니다.
* **인메모리 캐싱**: 한국관광공사 TourAPI 4.0 조회 API에 서버 사이드 인메모리 캐싱 기술을 적용하여 429 에러 방지 및 속도 성능을 최적화했습니다.

### 4. Gemini AI 여행 코스 추천
* 사용자의 일정에 따라 실시간으로 AI 기반의 여행 코스 플래닝 브리핑을 제공합니다. (현재 로컬 연동 검증 중이며, 배포 시 Firebase Functions Secret 환경으로 안전하게 전환될 예정입니다.)

---

## ⚙️ 기술 스택 (Tech Stack)

### Client
* **Framework**: React 19, Vite 8, Zustand (상태 관리)
* **Routing & HTTP**: React Router DOM v7, Axios
* **Styling**: Tailwind CSS v4, ToastContext 기반 전역 토스트 팝업

### Serverless Backend
* **Database & Auth**: Firebase Realtime Database, Firebase Auth
* **Hosting**: Firebase Hosting (Vite SPA rewriting 적용)
* **External APIs**: 한국관광공사 KorService2 (TourAPI 4.0), Kakao Maps API, Open-Meteo & Nominatim (날씨 및 좌표 변환), Gemini AI API

---

## 📂 5. 프로젝트 상세 문서 (상세 내용 확인)

CodeTrip 프로젝트는 모든 설계 및 작업 일지를 도큐멘테이션하여 관리하고 있습니다. 아래 링크에서 상세 내용을 확인하실 수 있습니다.

- 📝 [PROJECT LOG (전체 문서 통합 인덱스)](documents/PROJECT_LOG.md)
- 📋 [DATABASE DESIGN (Firebase Realtime DB 보안 룰)](database.rules.json)
- 🏗️ [PROJECT SPECIFICATION (Firebase 상세 내역서)](documents/info/Firebase_상세%20내역서.md)
- 🏗️ [GEMINI PROMPT DESIGN (Gemini 여행 일정 프롬프트 설계)](documents/info/Gemini_프롬프트_설계.md)
- 🚨 [TROUBLESHOOTING (Firebase 인증 복원 및 API 캐시 에러 색인)](documents/TROUBLESHOOTING.md)
- 🚀 [DEPLOYMENT GUIDE (Firebase Hosting 배포 가이드)](documents/guides/Project_Firebase_배포.md)
- 🎯 [RUN GUIDE (로컬 개발 서버 실행 가이드)](documents/guides/Guide.md)

---
*Updated at_2026.07.23*
