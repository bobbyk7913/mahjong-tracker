import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export const signOutUser = () => signOut(auth);

// 邀請碼驗證成功後強制刷新 token，確保之後嘅 Firestore 請求帶上最新授權狀態。
export const refreshCurrentUserToken = () => {
  if (!auth.currentUser) return Promise.resolve(null);
  return auth.currentUser.getIdToken(true);
};
