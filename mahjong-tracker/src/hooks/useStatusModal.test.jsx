import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useStatusModal } from './useStatusModal';

describe('useStatusModal', () => {
  it('opens loading, success, and error states', () => {
    const { result } = renderHook(() => useStatusModal());

    act(() => result.current.showLoading('處理中', '請稍候'));
    expect(result.current.state).toMatchObject({ isOpen: true, type: 'loading', title: '處理中', message: '請稍候' });

    act(() => result.current.showSuccess('成功', '完成'));
    expect(result.current.state.type).toBe('success');

    act(() => result.current.showError('失敗', '錯誤'));
    expect(result.current.state.type).toBe('error');
  });

  it('closes the modal', () => {
    const { result } = renderHook(() => useStatusModal());

    act(() => result.current.showSuccess('成功', '完成'));
    act(() => result.current.close());

    expect(result.current.state.isOpen).toBe(false);
  });

  it('confirm runs callback and closes', () => {
    const onConfirm = vi.fn();
    const { result } = renderHook(() => useStatusModal());

    act(() => result.current.confirm('確定？', '確認動作', onConfirm));
    expect(result.current.state.isOpen).toBe(true);

    act(() => result.current.state.onConfirm());

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(result.current.state.isOpen).toBe(false);
  });

  it('provides spreadable StatusModal props with onClose wired', () => {
    const { result } = renderHook(() => useStatusModal());

    act(() => result.current.showError('錯誤', '訊息'));
    expect(result.current.props.isOpen).toBe(true);
    expect(result.current.props.type).toBe('error');

    act(() => result.current.props.onClose());
    expect(result.current.state.isOpen).toBe(false);
  });
});
