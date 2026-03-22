// src/components/Auth.jsx
import React, { useState } from 'react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { Loader2, Mail, Lock, KeyRound } from 'lucide-react';
import StatusModal from './StatusModal';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  // --- 你可以在這裡修改 Hardcode 的邀請碼 ---
  const MASTER_INVITE_CODE = "MJ191919"; 

  const [modal, setModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    setModal({
      isOpen: true,
      type: 'loading',
      title: isLogin ? '登入中' : '註冊中',
      message: '請稍候，正在驗證您的資訊...'
    });

    try {
      if (isLogin) {
        // --- 登入邏輯 ---
        await signInWithEmailAndPassword(auth, email, password);
        setModal({ isOpen: false, type: 'success', title: '', message: '' });
      } else {
        // --- 註冊邏輯 (Hardcode 驗證) ---
        if (inviteCode !== MASTER_INVITE_CODE) {
          setModal({
            isOpen: true,
            type: 'error',
            title: '邀請碼錯誤',
            message: '暗號不正確，請聯絡管理員獲取正確邀請碼！'
          });
          setLoading(false);
          return;
        }

        await createUserWithEmailAndPassword(auth, email, password);
        setModal({
          isOpen: true,
          type: 'success',
          title: '註冊成功',
          message: '歡迎加入！現在可以登入開始紀錄戰績。'
        });
        // 註冊成功後自動切換回登入模式
        setIsLogin(true);
      }
    } catch (error) {
      console.error(error);
      let errorMsg = "發生錯誤，請稍後再試。";
      if (error.code === 'auth/email-already-in-use') errorMsg = "呢個 Email 已經比人註冊咗喇。";
      else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') errorMsg = "Email 或密碼不正確。";
      
      setModal({
        isOpen: true,
        type: 'error',
        title: isLogin ? '登入失敗' : '註冊失敗',
        message: errorMsg
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-500">
      {/* Header */}
      <div className="bg-green-600 p-10 text-white text-center relative overflow-hidden">
        <div className="relative z-10">
          <div className="text-6xl mb-4 drop-shadow-lg">🀄</div>
          <h2 className="text-3xl font-black tracking-tighter italic uppercase">雀神紀錄系統</h2>
          <p className="text-green-100 mt-2 font-bold opacity-90 text-sm">
            {isLogin ? '今日又要贏幾多？' : '加入我哋，紀錄最強戰績！'}
          </p>
        </div>
        <div className="absolute top-0 right-0 text-9xl opacity-10 font-black -mr-10 -mt-10">MJ</div>
      </div>

      <div className="p-8 md:p-10">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl focus-within:ring-2 ring-green-500 transition-all border border-transparent focus-within:bg-white">
            <Mail className="text-gray-400" size={18} />
            <input 
              type="email" required placeholder="Email 地址" 
              className="w-full bg-transparent outline-none font-medium"
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>

          <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl focus-within:ring-2 ring-green-500 transition-all border border-transparent focus-within:bg-white">
            <Lock className="text-gray-400" size={18} />
            <input 
              type="password" required placeholder="密碼" 
              className="w-full bg-transparent outline-none font-medium"
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>

          {!isLogin && (
            <div className="pt-2 animate-in slide-in-from-top-2 duration-300">
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 ml-1">🔒 內部邀請碼</p>
              <div className="flex items-center gap-3 bg-amber-50 p-4 rounded-2xl focus-within:ring-2 ring-amber-500 transition-all border border-amber-100">
                <KeyRound className="text-amber-500" size={18} />
                <input 
                  type="text" required placeholder="輸入暗號" 
                  className="w-full bg-transparent outline-none font-bold text-amber-700 placeholder:text-amber-300"
                  onChange={(e) => setInviteCode(e.target.value)} 
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-lg hover:bg-black transition-all transform active:scale-95 shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : (isLogin ? '登入系統' : '立即註冊')}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-gray-400 font-bold text-sm">
            {isLogin ? '仲未有帳號？' : '已經有帳號？'}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-green-600 font-black hover:underline"
            >
              {isLogin ? '立即註冊' : '返去登入'}
            </button>
          </p>
        </div>
      </div>

      <StatusModal 
        {...modal} 
        onClose={() => setModal({ ...modal, isOpen: false })} 
      />
    </div>
  );
};

export default Auth;