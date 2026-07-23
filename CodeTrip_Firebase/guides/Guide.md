# Vibe Board: Claude Code 개발 지침서

이 가이드는 Claude Code가 프로젝트를 효율적으로 수행하기 위한 기술적 지침과 Vibe Coding의 미학적 기준을 정의합니다.

## 1. 기술적 설정 (Tech Stack & Setup)
- **Base**: React 18 (Vite), Axios
- **API Communication**: 
    - `src/api/axiosInstance.js` 파일을 생성하여 `axios.create()`를 통해 관리.
    - 환경 변수(`.env`)를 사용하여 백엔드 URL 관리.
    - 모든 요청/응답은 JSON 형식을 따름.

## 2. 환경 변수 및 Axios 설정 (.env & axios.create)
Claude Code는 다음 설정을 기반으로 통신 모듈을 구축해야 합니다.

### 2.1 .env 파일 설정
프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 작성합니다.
```env
VITE_API_URL=http://your-ec2-ip:8080/api
```

### 2.2 axiosInstance.js 구현 예시
```javascript
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

export default axiosInstance;
```

## 3. Vibe Coding 디자인 가이드 (CSS)
Claude Code는 UI 생성 시 다음 CSS 규칙을 우선 적용해야 합니다.

### 2.1 전역 테마 (CSS Variables)
```css
:root {
  --bg-color: #0a0b10;
  --glass-bg: rgba(255, 255, 255, 0.05);
  --accent-color: hsl(250, 100%, 75%);
  --text-main: #f8f9fa;
  --text-dim: #94a3b8;
  --transition-smooth: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 2.2 스타일 핵심 요소
- **유리 효과**: 모든 카드는 `backdrop-filter: blur(10px)`와 미세한 `border: 1px solid rgba(255, 255, 255, 0.1)`를 가짐.
- **애니메이션**: 목록 로딩 시 아래에서 위로 서서히 나타나는 효과 적용.
```css
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

## 3. 기능 구현 지침
- **전체 검색**: `boardApi.getAll()` 호출 후 `useState`에 저장, `filter` 함수로 실시간 검색 지원.
- **글번호 검색**: 상세 페이지(`BoardDetail`) 진입 시 `id`로 단건 조회.
- **CRUD 에러 핸들링**: Axios 에러 발생 시 사용자에게 프리미엄 스타일의 토스트 알림(Toast Notification) 표시.

## 4. Claude Code 실행 권장 순서
1. `src/api/boardApi.js` 작성 및 Axios 기본 설정.
2. `index.css`에 Vibe Coding 디자인 시스템 구축.
3. `components/Layout` 제작 (Header, Footer).
4. `features/Board` 하위 컴포넌트(List, Detail, Form) 순차 개발.

---
*2026-04-20: 고도화된 지침서 업데이트 (Antigravity)*

