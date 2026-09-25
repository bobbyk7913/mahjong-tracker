import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '../constants';

export const getUserRef = (uid) => doc(db, COLLECTIONS.USERS, uid);

// 寫入 approved 狀態。權限最終由 firestore.rules 判斷（inviteCode 要吻合）。
export const approveUser = (user, inviteCode) =>
  setDoc(
    getUserRef(user.uid),
    {
      uid: user.uid,
      email: user.email ?? '',
      displayName: user.displayName ?? '',
      status: 'approved',
      inviteCode,
      inviteCodeVerifiedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    },
    { merge: true }
  );
