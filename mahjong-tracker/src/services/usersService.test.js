import { describe, expect, it, vi } from 'vitest';
import { approveUser, getUserRef } from './usersService';

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((db, collection, id) => ({ db, collection, id })),
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
  setDoc: vi.fn(),
}));

vi.mock('../firebase', () => ({ db: { name: 'mock-db' } }));

import { doc, setDoc } from 'firebase/firestore';

describe('usersService', () => {
  it('builds the current user document reference', () => {
    const ref = getUserRef('u1');

    expect(doc).toHaveBeenCalledWith({ name: 'mock-db' }, 'users', 'u1');
    expect(ref.id).toBe('u1');
  });

  it('writes approval payload with merge enabled', async () => {
    const user = { uid: 'u1', email: 'a@example.com', displayName: 'Player A' };

    await approveUser(user, 'MJ191919');

    expect(setDoc).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'u1' }),
      expect.objectContaining({
        uid: 'u1',
        email: 'a@example.com',
        displayName: 'Player A',
        status: 'approved',
        inviteCode: 'MJ191919',
        inviteCodeVerifiedAt: 'SERVER_TIMESTAMP',
        createdAt: 'SERVER_TIMESTAMP',
        lastLoginAt: 'SERVER_TIMESTAMP',
      }),
      { merge: true }
    );
  });
});
