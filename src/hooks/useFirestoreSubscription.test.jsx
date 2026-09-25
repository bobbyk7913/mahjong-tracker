import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFirestoreSubscription } from './useFirestoreSubscription';

const listeners = [];
const unsubscribes = [];

vi.mock('firebase/firestore', () => ({
  onSnapshot: vi.fn((query, onNext, onError) => {
    const listener = { query, onNext, onError };
    listeners.push(listener);
    const unsubscribe = vi.fn();
    unsubscribes.push(unsubscribe);
    return unsubscribe;
  }),
}));

const snapshot = (docs) => ({
  docs: docs.map((data, index) => ({ id: `doc-${index}`, data: () => data })),
});

describe('useFirestoreSubscription', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    listeners.length = 0;
    unsubscribes.length = 0;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('maps snapshots and stops loading', () => {
    const { result } = renderHook(() => useFirestoreSubscription(() => 'query'));

    act(() => listeners[0].onNext(snapshot([{ name: 'A' }])));

    expect(result.current.data).toEqual([{ id: 'doc-0', name: 'A' }]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('keeps loading while a transient error is scheduled for retry, then recovers', () => {
    const { result } = renderHook(() =>
      useFirestoreSubscription(() => 'query', {
        retryConfig: { maxAttempts: 1, initialDelayMs: 100, retryableCodes: ['unavailable'] },
      })
    );

    act(() => listeners[0].onError({ code: 'unavailable' }));
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();

    act(() => vi.advanceTimersByTime(100));
    expect(listeners).toHaveLength(2);

    act(() => listeners[1].onNext(snapshot([{ recovered: true }])));
    expect(result.current.data[0].recovered).toBe(true);
  });

  it('surfaces permanent errors without retrying', () => {
    const { result } = renderHook(() => useFirestoreSubscription(() => 'query'));

    act(() => listeners[0].onError({ code: 'failed-precondition', message: 'index required' }));

    expect(result.current.error?.code).toBe('failed-precondition');
    expect(result.current.loading).toBe(false);

    act(() => vi.runAllTimers());
    expect(listeners).toHaveLength(1);
  });

  it('manual retry clears error and creates a new listener', () => {
    const { result } = renderHook(() => useFirestoreSubscription(() => 'query'));

    act(() => listeners[0].onError({ code: 'failed-precondition' }));
    act(() => result.current.retry());

    expect(result.current.error).toBeNull();
    expect(listeners).toHaveLength(2);
  });

  it('unsubscribes active listener and clears retry timer on unmount', () => {
    const { unmount } = renderHook(() =>
      useFirestoreSubscription(() => 'query', {
        retryConfig: { maxAttempts: 2, initialDelayMs: 100, retryableCodes: ['unavailable'] },
      })
    );

    act(() => listeners[0].onError({ code: 'unavailable' }));
    unmount();

    expect(unsubscribes[0]).toHaveBeenCalledTimes(1);
    act(() => vi.runAllTimers());
    expect(listeners).toHaveLength(1);
  });

  it('does not subscribe when disabled', () => {
    const { result } = renderHook(() => useFirestoreSubscription(() => 'query', { enabled: false }));

    expect(listeners).toHaveLength(0);
    expect(result.current.loading).toBe(false);
  });
});
