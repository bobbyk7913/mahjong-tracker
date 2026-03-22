// src/components/Layout.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
// 記得 import埋 Settings icon
import { LayoutDashboard, PlusCircle, LogOut, Menu, X, BarChart3, Settings, Wand2 } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

const Layout = ({ children, user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // 1. 更新呢度，加埋 /settings
  const pageConfigs = {
    '/': { title: '戰績報表', icon: <LayoutDashboard size={22} className="text-blue-500" /> },
    '/add': { title: '新增紀錄', icon: <PlusCircle size={22} className="text-green-500" /> },
    '/analytics': { title: '數據分析', icon: <BarChart3 size={22} className="text-indigo-500" /> },
    '/settings': { title: '個人設定', icon: <Settings size={22} className="text-gray-500" /> },
    //'/tools': { title: '管理工具', icon: <Wand2 size={22} className="text-amber-500" /> },
  };

  const currentConfig = pageConfigs[location.pathname] || { title: '雀神紀錄', icon: null };

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-900 overflow-hidden">
      
      {/* 手機版 Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center px-4 z-50 shadow-sm">
        <button className="p-2 -ml-2 text-gray-600" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="ml-2 flex items-center gap-2">
          {currentConfig.icon}
          <span className="font-black text-lg">{currentConfig.title}</span>
        </div>
      </div>

      {/* 側邊欄 (Sidebar) */}
      <aside className={`
        fixed inset-y-0 left-0 z-[60] w-64 bg-gray-900 text-white transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static
      `}>
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          <div className="bg-green-600 p-1.5 rounded-lg text-white font-black text-xl">🀄</div>
          <span className="text-xl font-black tracking-tighter">雀神紀錄</span>
        </div>
        
        <nav className="p-4 space-y-1">
          {/* 呢度會根據 pageConfigs 自動產生所有選單按鈕 */}
          {Object.entries(pageConfigs).map(([path, cfg]) => (
            <Link 
              key={path} 
              to={path} 
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                location.pathname === path 
                  ? "bg-green-600 text-white shadow-lg shadow-green-900/20" 
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {/* 複製 icon 但改色以配合選單狀態 */}
              {React.cloneElement(cfg.icon, { 
                className: location.pathname === path ? "text-white" : "text-gray-500" 
              })} 
              {cfg.title}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-800">
          <button onClick={() => signOut(auth)} className="flex items-center gap-3 text-gray-400 hover:text-red-400 font-bold w-full px-4 py-3 transition-colors">
            <LogOut size={20} /> 登出帳號
          </button>
        </div>
      </aside>

      {/* 主內容區 */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="hidden lg:flex h-20 items-center px-8 bg-white border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            {currentConfig.icon}
            <h1 className="text-2xl font-black">{currentConfig.title}</h1>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 pt-20 lg:pt-8">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {isOpen && <div className="fixed inset-0 bg-black/50 z-[55] lg:hidden" onClick={() => setIsOpen(false)} />}
    </div>
  );
};

export default Layout;