import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import RouteLoading from './components/RouteLoading.jsx'
import {
  AiPlanner,
  Board,
  BoardDetail,
  BoardWrite,
  Explore,
  Festivals,
  ForgotPassword,
  Home,
  Info,
  Login,
  MyActivity,
  MyPage,
  Settings,
  SignUp,
  TravelDetail,
  TravelTagSearch,
} from './routes/lazyPages.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Suspense fallback={<RouteLoading />}>
        <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Home />} />
          <Route path="explore" element={<Explore />} />
          <Route path="explore/:contentId" element={<TravelDetail />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<SignUp />} />
          <Route path="mypage" element={<ProtectedRoute title="마이페이지 접근 제한"><MyPage /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute title="회원정보 접근 제한"><Settings /></ProtectedRoute>} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="festivals" element={<Festivals />} />
          <Route path="ai-planner" element={<ProtectedRoute title="AI 플래너 접근 제한" description="AI 여행 플래너는 로그인 후 사용할 수 있습니다. 위시리스트와 저장된 코스를 함께 관리하려면 먼저 로그인해주세요."><AiPlanner /></ProtectedRoute>} />
          <Route path="info" element={<Info />} />
          <Route path="board" element={<ProtectedRoute title="게시판 접근 제한" description="여행 게시판은 로그인한 사용자만 이용할 수 있습니다. 로그인 후 게시글과 댓글을 확인하고 여행 경험을 공유해보세요."><Board /></ProtectedRoute>} />
          <Route path="board/write" element={<ProtectedRoute title="게시글 작성 접근 제한"><BoardWrite /></ProtectedRoute>} />
          <Route path="board/tag-search" element={<ProtectedRoute title="게시글 태그 검색 접근 제한"><TravelTagSearch /></ProtectedRoute>} />
          <Route path="board/:id" element={<ProtectedRoute title="게시글 상세 접근 제한"><BoardDetail /></ProtectedRoute>} />
          <Route path="my-activity" element={<ProtectedRoute title="내 활동 접근 제한"><MyActivity /></ProtectedRoute>} />
        </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>,
)
