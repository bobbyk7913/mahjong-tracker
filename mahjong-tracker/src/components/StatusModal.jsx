// src/components/StatusModal.jsx
import React from 'react';
import { CheckCircle2, XCircle, Loader2, X } from 'lucide-react';

const StatusModal = ({ isOpen, type, title, message, onClose, onConfirm }) => {
  if (!isOpen) return null;

  const config = {
    success: {
      icon: <CheckCircle2 size={48} className="text-green-500 animate-bounce" />,
      btnColor: "bg-green-600 hover:bg-green-700 shadow-green-200",
      bgColor: "bg-green-50"
    },
    error: {
      icon: <XCircle size={48} className="text-red-500 animate-shake" />,
      btnColor: "bg-red-600 hover:bg-red-700 shadow-red-200",
      bgColor: "bg-red-50"
    },
    loading: {
      icon: <Loader2 size={48} className="text-blue-500 animate-spin" />,
      btnColor: "hidden",
      bgColor: "bg-blue-50"
    }
  };

  const current = config[type] || config.success;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* 背景遮罩 - 如果不是 loading 狀態，點擊背景也可以關閉 */}
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={type !== 'loading' ? onClose : undefined} 
      />
      
      {/* Modal 內容 */}
      <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 flex flex-col items-center text-center">
        
        {/* 右上角關閉按鈕 */}
        {type !== 'loading' && (
          <button onClick={onClose} className="absolute right-6 top-6 text-gray-300 hover:text-gray-500 transition-colors">
            <X size={20} />
          </button>
        )}

        <div className={`p-6 rounded-3xl ${current.bgColor} mb-6`}>
          {current.icon}
        </div>

        <h3 className="text-2xl font-black text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-500 font-bold mb-8 leading-relaxed px-4">{message}</p>

        {/* 按鈕區域 */}
        {type !== 'loading' && (
          <div className="w-full">
            {onConfirm ? (
              /* 雙按鈕模式：用於刪除確認等危險操作 */
              <div className="flex gap-3 w-full">
                <button 
                  onClick={onClose}
                  className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-500 font-black text-lg hover:bg-gray-200 transition-all active:scale-95"
                >
                  取消
                </button>
                <button 
                  onClick={() => {
                    onConfirm(); // 👈 執行傳入的刪除邏輯
                  }}
                  className={`flex-1 py-4 rounded-2xl text-white font-black text-lg transition-all active:scale-95 shadow-lg ${current.btnColor}`}
                >
                  確定
                </button>
              </div>
            ) : (
              /* 單按鈕模式：普通的成功或錯誤提示 */
              <button 
                onClick={onClose}
                className={`w-full py-4 rounded-2xl text-white font-black text-lg transition-all active:scale-95 shadow-lg ${current.btnColor}`}
              >
                確定
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusModal;