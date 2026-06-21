// src/components/Auth.jsx
import React, { useState } from 'react';
import { auth, db, googleProvider } from '../firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2, KeyRound, LogOut, ShieldCheck, UserCircle2 } from 'lucide-react';
import StatusModal from './StatusModal';

const MASTER_INVITE_CODE = 'MJ191919';

const Auth = ({ user, onApproved }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });

  const handleGoogleLogin = async () => {
    setLoading(true);
    setModal({ isOpen: true, type: 'loading', title: '驗證中', message: '正在同步 Google 帳號...' });

    try {
      await signInWithPopup(auth, googleProvider);
      setModal({ isOpen: false });
    } catch (error) {
      console.error("Google Auth Error:", error);
      if (error.code !== 'auth/popup-closed-by-user') {
        setModal({
          isOpen: true,
          type: 'error',
          title: '登入失敗',
          message: '無法完成 Google 驗證，請確保網域已授權且網絡正常。'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setModal({
        isOpen: true,
        type: 'error',
        title: '未登入',
        message: '請先用 Google 登入後再輸入邀請碼。'
      });
      return;
    }

    setLoading(true);
    setModal({ isOpen: true, type: 'loading', title: '驗證中', message: '正在檢查邀請碼...' });

    try {
      if (inviteCode.trim() !== MASTER_INVITE_CODE) {
        setModal({
          isOpen: true,
          type: 'error',
          title: '邀請碼錯誤',
          message: '暗號不正確，請重新輸入。'
        });
        return;
      }

      // 💡 在自動跳轉前，埋下一個本地標記，通知 Dashboard 稍後彈窗
      localStorage.setItem('show_approved_welcome', 'true');

      // 1. 先寫入 Firestore 資料庫更新為 approved 狀態
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email ?? '',
        displayName: user.displayName ?? '',
        status: 'approved',
        inviteCode: inviteCode.trim(),
        inviteCodeVerifiedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      }, { merge: true });

      // 2. 強制刷新當前用戶的 Auth Token，確保帶上最新權限
      if (auth.currentUser) {
        await auth.currentUser.getIdToken(true);
      }

      // 清空輸入框
      setInviteCode('');
      setModal({ isOpen: false });
      
    } catch (error) {
      console.error('Invite code approval error:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: '驗證失敗',
        message: '無法完成邀請碼驗證，請稍後再試。'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setInviteCode('');
      setModal({ isOpen: false, type: 'success', title: '', message: '' });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-green-600 p-10 text-white text-center">
        <div className="text-6xl mb-4 drop-shadow-lg">🀄</div>
        <h2 className="text-3xl font-black tracking-tighter italic uppercase">雀神紀錄系統</h2>
        <p className="text-green-100 mt-2 font-bold opacity-90 text-sm">
          {user ? '請輸入邀請碼以解鎖主系統' : '今日又要贏幾多？'}
        </p>
      </div>

      <div className="p-8 md:p-10">
        {!user ? (
          <div className="space-y-4">
            <div className="rounded-[2rem] bg-gray-50 p-5 border border-gray-100 flex items-start gap-4">
              <ShieldCheck className="text-green-600 shrink-0 mt-0.5" size={24} />
              <div>
                <p className="font-black text-gray-800 mb-1">只支援 Google 登入</p>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  登入後系統會檢查你係咪正式用戶。未批准帳號會留喺邀請碼頁面。
                </p>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-4 bg-white border-2 border-gray-50 text-gray-700 rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-gray-50 transition-all active:scale-[0.98] shadow-sm disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />}
              使用 Google 帳號登入
            </button>
          </div>
        ) : (
          <form onSubmit={handleInviteSubmit} className="space-y-5">
            <div className="rounded-[2rem] bg-gray-50 p-5 border border-gray-100 flex items-center gap-4">
              <UserCircle2 className="text-gray-500 shrink-0" size={28} />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">目前登入帳號</p>
                <p className="font-black text-gray-800 truncate">{user.displayName || user.email || 'Google 帳號'}</p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-500 text-xs font-black hover:text-gray-700 hover:bg-gray-50 transition-colors shrink-0"
              >
                <LogOut size={14} />
                登出
              </button>
            </div>

            <div>
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 ml-1">
                🔒 內部授權暗號
              </p>
              <div className="flex items-center gap-3 bg-amber-50 p-4 rounded-2xl focus-within:ring-2 ring-amber-500 border border-amber-100 transition-all">
                <KeyRound className="text-amber-500" size={18} />
                <input
                  type="text"
                  placeholder="輸入邀請碼"
                  className="w-full bg-transparent outline-none font-bold text-amber-700 text-sm placeholder:text-amber-300"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-lg hover:bg-black transition-all active:scale-95 shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : '驗證並解鎖主系統'}
            </button>
          </form>
        )}
      </div>

      <StatusModal {...modal} onClose={() => setModal({ ...modal, isOpen: false })} />
    </div>
  );
};

export default Auth;