import { useCallback, useMemo, useState } from 'react';

const CLOSED = { isOpen: false, type: 'success', title: '', message: '', onConfirm: null };

// 統一 StatusModal 嘅 state 管理，畀 component 用語意化嘅方法控制 modal。
// 用法：
//   const modal = useStatusModal();
//   modal.showLoading('處理中', '正在同步...');
//   modal.showSuccess('成功', '已儲存。');
//   modal.showError('失敗', '網絡異常。');
//   modal.confirm('確定刪除？', '...', () => doDelete());
//   <StatusModal {...modal.props} />
export function useStatusModal() {
  const [state, setState] = useState(CLOSED);

  const close = useCallback(() => setState(CLOSED), []);

  const showLoading = useCallback(
    (title, message) => setState({ isOpen: true, type: 'loading', title, message, onConfirm: null }),
    []
  );

  const showSuccess = useCallback(
    (title, message) => setState({ isOpen: true, type: 'success', title, message, onConfirm: null }),
    []
  );

  const showError = useCallback(
    (title, message) => setState({ isOpen: true, type: 'error', title, message, onConfirm: null }),
    []
  );

  // 雙按鈕確認模式：onConfirm 執行後自動關閉 modal
  const confirm = useCallback(
    (title, message, onConfirm) =>
      setState({
        isOpen: true,
        type: 'error',
        title,
        message,
        onConfirm: () => {
          setState(CLOSED);
          onConfirm?.();
        },
      }),
    []
  );

  // memoize 成個回傳 object，確保 reference 只喺 state 改變時先變，
  // 令 consumer 可以安全咁將 modal 放入 useEffect dependency。
  return useMemo(
    () => ({
      state,
      close,
      showLoading,
      showSuccess,
      showError,
      confirm,
      // 直接 spread 俾 <StatusModal {...modal.props} />
      props: { ...state, onClose: close },
    }),
    [state, close, showLoading, showSuccess, showError, confirm]
  );
}
