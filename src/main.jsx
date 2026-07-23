import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import Home from './pages/Home.jsx'
import Explore from './pages/Explore.jsx'
import TravelDetail from './pages/TravelDetail.jsx'
import Login from './pages/Login.jsx'
import SignUp from './pages/SignUp.jsx'
import MyPage from './pages/MyPage.jsx'
import Settings from './pages/Settings.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import Festivals from './pages/Festivals.jsx'
import Info from './pages/Info.jsx'
import AiPlanner from './pages/AiPlanner.jsx'
import Board from './pages/Board.jsx'
import BoardDetail from './pages/BoardDetail.jsx'
import BoardWrite from './pages/BoardWrite.jsx'
import TravelTagSearch from './pages/TravelTagSearch.jsx'
import MyActivity from './pages/MyActivity.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
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
          <Route path="ai-planner" element={<ProtectedRoute title="AI 여행 코스 접근 제한" description="AI 여행 코스는 로그인 후 사용할 수 있습니다. 위시리스트와 저장된 코스를 함께 관리하려면 먼저 로그인해주세요."><AiPlanner /></ProtectedRoute>} />
          <Route path="info" element={<Info />} />
          <Route path="board" element={<ProtectedRoute title="게시판 접근 제한" description="여행 게시판은 로그인한 사용자만 이용할 수 있습니다. 로그인 후 게시글과 댓글을 확인하고 여행 경험을 공유해보세요."><Board /></ProtectedRoute>} />
          <Route path="board/write" element={<ProtectedRoute title="게시글 작성 접근 제한"><BoardWrite /></ProtectedRoute>} />
          <Route path="board/tag-search" element={<ProtectedRoute title="게시글 태그 검색 접근 제한"><TravelTagSearch /></ProtectedRoute>} />
          <Route path="board/:id" element={<ProtectedRoute title="게시글 상세 접근 제한"><BoardDetail /></ProtectedRoute>} />
          <Route path="my-activity" element={<ProtectedRoute title="내 활동 접근 제한"><MyActivity /></ProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
