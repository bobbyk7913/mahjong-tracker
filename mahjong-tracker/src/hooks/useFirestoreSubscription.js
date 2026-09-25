import { useCallback, useEffect, useState } from 'react';
import { onSnapshot } from 'firebase/firestore';

// 預設只對短暫性錯誤自動重試；permission-denied / 設定錯誤屬永久性，唔會無限重試。
// Dashboard 保留首次登入後 rules 同步 race 嘅恢復行為，會額外傳入 permission-denied 作一次性重試。
const TRANSIENT_ERROR_CODES = [
  'unavailable',
  'deadline-exceeded',
  'resource-exhausted',
  'aborted',
  'internal',
  'cancelled',
];

const DEFAULT_RETRY_CONFIG = {
  maxAttempts: 1,
  initialDelayMs: 700,
  factor: 2,
  retryableCodes: TRANSIENT_ERROR_CODES,
};

const defaultMapSnapshot = (snapshot) =>
  snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

/**
 * 通用 Firestore realtime subscription hook。
 *
 * @param {() => import('firebase/firestore').Query} buildQuery
 *   每次訂閱時先建立 query，避免 consumer 每次 render 產生新 query identity。
 * @param {object} options
 * @param {boolean} options.enabled  未授權時可設 false，hook 唔會訂閱。
 * @param {(snapshot) => any} options.mapSnapshot  自訂 snapshot 轉換。
 * @param {Array} options.deps  額外依賴（例如 userId），變更時會取消舊訂閱再重訂。
 * @param {object} options.retryConfig  覆寫預設重試策略。
 */
export function useFirestoreSubscription(buildQuery, options = {}) {
  const { enabled = true, mapSnapshot = defaultMapSnapshot, deps = [], retryConfig = {} } = options;
  const retry = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  const manualRetry = useCallback(() => {
    setError(null);
    setAttempt((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!enabled || !buildQuery) {
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    let retryTimer = null;

    const unsubscribe = onSnapshot(
      buildQuery(),
      (snapshot) => {
        setData(mapSnapshot(snapshot));
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore subscription error:', err);

        const isRetryable = retry.retryableCodes.includes(err?.code);
        const willAutoRetry = isRetryable && attempt < retry.maxAttempts;

        // 只有「唔會再自動重試」嘅永久性失敗先浮出 error state，
        // 避免短暫失敗（例如首次批准後 rules 同步中）閃出一秒錯誤畫面。
        if (!willAutoRetry) {
          setError(err);
          setLoading(false);
          return;
        }

        // 自動重試期間保持 loading，畫面維持 spinner 而唔係錯誤提示。
        setError(null);
        const delay = retry.initialDelayMs * Math.pow(retry.factor, attempt);
        retryTimer = setTimeout(() => {
          setAttempt((current) => current + 1);
        }, delay);
      }
    );

    return () => {
      unsubscribe();
      if (retryTimer) clearTimeout(retryTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, attempt, ...deps]);

  return { data, loading, error, retry: manualRetry };
}
