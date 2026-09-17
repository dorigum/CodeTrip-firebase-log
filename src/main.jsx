import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import './index.css'

const Home = lazy(() => import('./pages/Home.jsx'))
const Explore = lazy(() => import('./pages/Explore.jsx'))
const TravelDetail = lazy(() => import('./pages/TravelDetail.jsx'))
const Login = lazy(() => import('./pages/Login.jsx'))
const SignUp = lazy(() => import('./pages/SignUp.jsx'))
const MyPage = lazy(() => import('./pages/MyPage.jsx'))
const Settings = lazy(() => import('./pages/Settings.jsx'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'))
const Festivals = lazy(() => import('./pages/Festivals.jsx'))
const Info = lazy(() => import('./pages/Info.jsx'))
const AiPlanner = lazy(() => import('./pages/AiPlanner.jsx'))
const Board = lazy(() => import('./pages/Board.jsx'))
const BoardDetail = lazy(() => import('./pages/BoardDetail.jsx'))
const BoardWrite = lazy(() => import('./pages/BoardWrite.jsx'))
const TravelTagSearch = lazy(() => import('./pages/TravelTagSearch.jsx'))
const MyActivity = lazy(() => import('./pages/MyActivity.jsx'))

const RouteLoading = () => (
  <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-live="polite">
    <div className="flex items-center gap-3 rounded-xl border border-outline-variant/15 bg-white px-4 py-3 text-xs font-bold text-slate-500 shadow-sm">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      페이지를 불러오는 중입니다.
    </div>
  </div>
)

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
