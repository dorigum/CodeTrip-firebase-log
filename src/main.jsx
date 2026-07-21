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
          <Route path="mypage" element={<MyPage />} />
          <Route path="settings" element={<Settings />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="festivals" element={<Festivals />} />
          <Route path="ai-planner" element={<AiPlanner />} />
          <Route path="info" element={<Info />} />
          <Route path="board" element={<Board />} />
          <Route path="board/write" element={<BoardWrite />} />
          <Route path="board/tag-search" element={<TravelTagSearch />} />
          <Route path="board/:id" element={<BoardDetail />} />
          <Route path="my-activity" element={<MyActivity />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
