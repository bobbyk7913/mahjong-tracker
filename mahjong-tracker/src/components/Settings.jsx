// src/components/Settings.jsx
import React, { useState } from 'react';
import { auth } from '../firebase';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { ShieldCheck, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
// 導入 StatusModal
import StatusModal from './StatusModal';

const Settings = ({ user }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [loading, setLoading] = useState(false);

  // Modal 狀態控制
  const [modal, setModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    // 基本驗證
    if (newPassword !== confirmPassword) {
      setModal({
        isOpen: true,
        type: 'error',
        title: '驗證失敗',
        message: '新密碼與確認密碼不符，請重新輸入。'
      });
      return;
    }

    if (newPassword.length < 6) {
      setModal({
        isOpen: true,
        type: 'error',
        title: '密碼太短',
        message: '為了安全，新密碼長度至少需要 6 位。'
      });
      return;
    }

    setLoading(true);
    // 顯示「處理中」Modal
    setModal({
      isOpen: true,
      type: 'loading',
      title: '正在驗證',
      message: '正在驗證您的身分並更新密碼...'
    });

    try {
      // 1. 重新驗證身分 (Re-authentication)
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // 2. 更新密碼
      await updatePassword(auth.currentUser, newPassword);
      
      // 顯示成功 Modal
      setModal({
        isOpen: true,
        type: 'success',
        title: '更新成功！',
        message: '您的登入密碼已成功變更，下次請使用新密碼登入。'
      });

      // 清空輸入框
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
    } catch (error) {
      console.error(error);
      let errorMsg = '更新失敗，請稍後再試。';
      
      if (error.code === 'auth/wrong-password') {
        errorMsg = '當前密碼不正確，請重新檢查。';
      } else if (error.code === 'auth/too-many-requests') {
        errorMsg = '嘗試次數過多，帳號已被暫時鎖定，請稍後再試。';
      }

      // 顯示錯誤 Modal
      setModal({
        isOpen: true,
        type: 'error',
        title: '更新失敗',
        message: errorMsg
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-gray-900 p-2 rounded-xl text-white shadow-lg shadow-gray-200">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">帳號安全</h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Settings & Security</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-gray-100">
        <form onSubmit={handleUpdatePassword} className="space-y-6">
          {/* 當前密碼區塊 */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">當前密碼 (Current Password)</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Lock size={18} /></div>
              <input 
                type={showCurrentPw ? "text" : "password"}
                placeholder="請輸入您目前的密碼"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-gray-900 transition-all font-medium border border-transparent focus:bg-white"
                required
              />
              <button 
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showCurrentPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="h-px bg-gray-100 my-2" />

          {/* 新密碼區塊 */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">新密碼 (New Password)</label>
            <input 
              type="password"
              placeholder="輸入新密碼 (至少 6 位)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-green-500 transition-all font-medium border border-transparent focus:bg-white"
              required
            />
          </div>

          {/* 確認新密碼區塊 */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">確認新密碼 (Confirm)</label>
            <input 
              type="password"
              placeholder="請再次輸入新密碼"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-green-500 transition-all font-medium border border-transparent focus:bg-white"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-lg hover:bg-black transition-all transform active:scale-95 shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" /> : '更新密碼'}
          </button>
        </form>
      </div>

      {/* 渲染 StatusModal */}
      <StatusModal 
        {...modal} 
        onClose={() => setModal({ ...modal, isOpen: false })} 
      />
    </div>
  );
};

export default Settings;