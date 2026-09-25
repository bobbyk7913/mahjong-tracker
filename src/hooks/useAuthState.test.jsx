import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthState } from './useAuthState';

let authCallback;
let approvalCallback;
let approvalErrorCallback;
const approvalUnsubscribe = vi.fn();

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((auth, callback) => {
    authCallback = callback;
    return vi.fn();
  }),
}));

vi.mock('firebase/firestore', () => ({
  onSnapshot: vi.fn((ref, onNext, onError) => {
    approvalCallback = onNext;
    approvalErrorCallback = onError;
    return approvalUnsubscribe;
  }),
}));

vi.mock('../firebase', () => ({ auth: { name: 'mock-auth' } }));
vi.mock('../services/usersService', () => ({ getUserRef: vi.fn((uid) => `users/${uid}`) }));

const userDoc = (exists, status = 'approved') => ({
  exists: () => exists,
  data: () => ({ status }),
});

describe('useAuthState', () => {
  beforeEach(() => {
    authCallback = undefined;
    approvalCallback = undefined;
    approvalErrorCallback = undefined;
    approvalUnsubscribe.mockClear();
  });

  it('starts signed out and stops auth loading after auth callback', () => {
    const { result } = renderHook(() => useAuthState());

    expect(result.current.authLoading).toBe(true);

    act(() => authCallback(null));

    expect(result.current.authLoading).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.isApproved).toBe(false);
    expect(result.current.approvalLoading).toBe(false);
  });

  it('loads approval state for an approved user', () => {
    const { result } = renderHook(() => useAuthState());

    act(() => authCallback({ uid: 'u1' }));
    expect(result.current.approvalLoading).toBe(true);

    act(() => approvalCallback(userDoc(true, 'approved')));

    expect(result.current.isApproved).toBe(true);
    expect(result.current.approvalLoading).toBe(false);
    expect(result.current.approvalError).toBeNull();
  });

  it('treats missing or unapproved user document as unapproved', () => {
    const { result } = renderHook(() => useAuthState());

    act(() => authCallback({ uid: 'u1' }));
    act(() => approvalCallback(userDoc(false)));

    expect(result.current.isApproved).toBe(false);

    act(() => approvalCallback(userDoc(true, 'pending')));
    expect(result.current.isApproved).toBe(false);
  });

  it('exposes approval listener errors instead of silently marking unapproved', () => {
    const { result } = renderHook(() => useAuthState());
    const error = new Error('permission denied');

    act(() => authCallback({ uid: 'u1' }));
    act(() => approvalErrorCallback(error));

    expect(result.current.approvalError).toBe(error);
    expect(result.current.approvalLoading).toBe(false);
  });

  it('ignores approval state from a previous user when auth user changes', () => {
    const { result } = renderHook(() => useAuthState());

    act(() => authCallback({ uid: 'old-user' }));
    act(() => approvalCallback(userDoc(true, 'approved')));
    expect(result.current.isApproved).toBe(true);

    act(() => authCallback({ uid: 'new-user' }));

    expect(result.current.isApproved).toBe(false);
    expect(result.current.approvalLoading).toBe(true);
  });
});
