// src/App.jsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from './hooks/useAuthState';
import { GamesDataProvider } from './contexts/GamesDataContext';

// 引入我哋整好晒嘅組件
import Auth from './components/Auth';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';

// 非首屏頁面按需載入，減少 initial bundle
const AddRecord = lazy(() => import('./components/AddRecord'));
const Analytics = lazy(() => import('./components/Analytics'));
// import Tools from './components/Tools';

function App() {
  // 唯一 access gate：auth 狀態 + users/{uid} 批准狀態都由 useAuthState 管理
  const { user, authLoading, approvalLoading, isApproved, approvalError } = useAuthState();

  // 載入中畫面
  if (authLoading || approvalLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // 批准狀態 listener 出錯：唔當成未批准，顯示可恢復嘅錯誤畫面
  if (approvalError) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 gap-4 p-4">
        <p className="font-black text-red-500">無法讀取用戶授權狀態</p>
        <p className="text-sm text-gray-500 font-bold">請檢查網絡後重新整理頁面。</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-gray-900 text-white rounded-2xl font-black text-sm"
        >
          重新整理
        </button>
      </div>
    );
  }

  return (
    /* ⚠️ 注意：basename 係為咗配合 GitHub Pages 嘅子目錄路徑 */
    /* 例如你的 URL 係 https://xxx.github.io/mahjong-tracker/，basename 就填 /mahjong-tracker */
    <Router basename="/mahjong-tracker"> 
      {!user ? (
        // 未登入：顯示美化咗嘅 Auth 介面
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <Auth />
        </div>
      ) : (
        isApproved ? (
          // 已批准：套用 Layout (Side Menu) 並根據網址顯示不同頁面
          <GamesDataProvider userId={user.uid}>
            <Layout>
              <Suspense fallback={
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
                </div>
              }>
                <Routes>
                  <Route path="/" element={<Dashboard userId={user.uid} />} />
                  <Route path="/add" element={<AddRecord userId={user.uid} />} />
                  <Route path="/analytics" element={<Analytics />} />
                  {/* <Route path="/tools" element={<Tools userId={user.uid} />} /> */}
                  {/* 如果網址亂打，自動跳返去首頁 */}
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </Suspense>
            </Layout>
          </GamesDataProvider>
        ) : (
          // 未批准：只顯示邀請碼驗證介面（approval 由 user document listener 驅動，唔再靠 callback）
          <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <Auth user={user} />
          </div>
        )
      )}
    </Router>
  );
}

export default App;