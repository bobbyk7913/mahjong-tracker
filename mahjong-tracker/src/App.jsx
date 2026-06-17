// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

// 引入我哋整好晒嘅組件
import Auth from './components/Auth';
import Layout from './components/Layout';
import AddRecord from './components/AddRecord';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
// import Tools from './components/Tools';

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  // 監聽 Firebase 登入狀態
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      setIsApproved(false);
    });
    return () => unsubscribe();
  }, []);

  // 監聽用戶批准狀態
  useEffect(() => {
    if (!user) {
      setStatusLoading(false);
      setIsApproved(false);
      return undefined;
    }

    setStatusLoading(true);
    const userRef = doc(db, 'users', user.uid);

    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setIsApproved(false);
          setStatusLoading(false);
          return;
        }

        const data = snapshot.data();
        setIsApproved(data?.status === 'approved');
        setStatusLoading(false);
      },
      (error) => {
        console.error('User status error:', error);
        setIsApproved(false);
        setStatusLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // 載入中畫面
  if (authLoading || statusLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
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
          <Layout user={user}>
            <Routes>
              <Route path="/" element={<Dashboard userId={user.uid} />} />
              <Route path="/add" element={<AddRecord userId={user.uid} />} />
              <Route path="/analytics" element={<Analytics userId={user.uid} />} />
              {/* <Route path="/tools" element={<Tools userId={user.uid} />} /> */}
              {/* 如果網址亂打，自動跳返去首頁 */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Layout>
        ) : (
          // 未批准：只顯示邀請碼驗證介面
          <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <Auth user={user} onApproved={() => setIsApproved(true)} />
          </div>
        )
      )}
    </Router>
  );
}

export default App;