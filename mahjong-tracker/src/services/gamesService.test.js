import { describe, expect, it, vi } from 'vitest';
import { createGame, deleteGame } from './gamesService';

vi.mock('firebase/firestore', () => ({
  addDoc: vi.fn(),
  collection: vi.fn((db, name) => ({ db, name })),
  deleteDoc: vi.fn(),
  doc: vi.fn((db, collection, id) => ({ db, collection, id })),
  getDocs: vi.fn(),
  orderBy: vi.fn((field, direction) => ({ field, direction })),
  query: vi.fn((collectionRef, ...constraints) => ({ collectionRef, constraints })),
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
  writeBatch: vi.fn(),
}));

vi.mock('../firebase', () => ({ db: { name: 'mock-db' } }));

import { addDoc, deleteDoc } from 'firebase/firestore';

describe('gamesService', () => {
  it('creates a game with user, normalized fields, and server timestamp', async () => {
    await createGame('u1', {
      location: 'Room A',
      players: [{ name: 'A', score: 10 }, { name: 'B', score: -10 }],
      date: '2026-09-25',
    });

    expect(addDoc).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'games' }),
      expect.objectContaining({
        userId: 'u1',
        location: 'Room A',
        players: [{ name: 'A', score: 10 }, { name: 'B', score: -10 }],
        date: '2026-09-25',
        createdAt: 'SERVER_TIMESTAMP',
      })
    );
  });

  it('deletes a game by document id', async () => {
    await deleteGame('game-1');

    expect(deleteDoc).toHaveBeenCalledWith(expect.objectContaining({ id: 'game-1' }));
  });
});
