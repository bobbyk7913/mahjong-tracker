import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '../constants';

const gamesCollection = () => collection(db, COLLECTIONS.GAMES);

// Shared games data：按戰役日期排序
export const getGamesQuery = () =>
  query(gamesCollection(), orderBy('date', 'desc'), orderBy('createdAt', 'desc'));

// Tools：全部戰績
export const getAllGamesQuery = () => query(gamesCollection());

export const createGame = (userId, { location, players, date }) =>
  addDoc(gamesCollection(), {
    userId,
    location,
    players,
    date,
    createdAt: serverTimestamp(),
  });

export const deleteGame = (gameId) => deleteDoc(doc(db, COLLECTIONS.GAMES, gameId));

// Tools 嘅全域改名：一次 batch 更新所有受影響嘅 game document。
export const batchRename = async ({ type, oldValue, newValue }) => {
  const snapshot = await getDocs(getAllGamesQuery());
  const batch = writeBatch(db);
  let count = 0;

  snapshot.forEach((gameDoc) => {
    const data = gameDoc.data();
    const gameRef = doc(db, COLLECTIONS.GAMES, gameDoc.id);

    if (type === 'PLAYER') {
      let hasChanged = false;
      const updatedPlayers = (data.players || []).map((p) => {
        if (p.name === oldValue) {
          hasChanged = true;
          return { ...p, name: newValue };
        }
        return p;
      });
      if (hasChanged) {
        batch.update(gameRef, { players: updatedPlayers });
        count += 1;
      }
    } else if (data.location === oldValue) {
      batch.update(gameRef, { location: newValue });
      count += 1;
    }
  });

  if (count > 0) await batch.commit();
  return count;
};
