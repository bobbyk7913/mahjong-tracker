import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { onSnapshot } from 'firebase/firestore';
import { auth } from '../firebase';
import { getUserRef } from '../services/usersService';

const INITIAL_APPROVAL = { uid: null, status: 'unknown', error: null };

// 集中管理 Firebase Auth 狀態同 users/{uid} 批准狀態。
// App.jsx 以呢個 hook 作為唯一 access gate；Auth.jsx 唔再持有 approval 狀態。
// approval 快照會記住所屬 uid，loading/approved/error 全部由佢推導，
// 避免喺 effect body 入面同步 setState（react-hooks v7 規範）。
export function useAuthState() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [approval, setApproval] = useState(INITIAL_APPROVAL);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (!currentUser) setApproval(INITIAL_APPROVAL);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return undefined;

    const unsubscribe = onSnapshot(
      getUserRef(user.uid),
      (snapshot) => {
        setApproval({
          uid: user.uid,
          status: snapshot.exists() && snapshot.data()?.status === 'approved' ? 'approved' : 'unapproved',
          error: null,
        });
      },
      (error) => {
        // 聽批准狀態失敗唔應該默默當成「未批准」；交返俾 App 決定點顯示。
        console.error('User approval listener error:', error);
        setApproval({ uid: user.uid, status: 'error', error });
      }
    );

    return () => unsubscribe();
  }, [user]);

  // 只承認屬於當前 user 嘅 approval 快照；新 user 第一份快照未到之前視為 loading。
  const approvalLoading = Boolean(user) && approval.uid !== user.uid;
  const isApproved = approval.uid === user?.uid && approval.status === 'approved';
  const approvalError = approval.uid === user?.uid ? approval.error : null;

  return { user, authLoading, approvalLoading, isApproved, approvalError };
}
