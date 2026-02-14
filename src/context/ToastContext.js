import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import ToastHost from '../components/ToastHost';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const hideTimerRef = useRef(null);
  const [toast, setToast] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: ''
  });

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const showToast = useCallback((payload) => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    const next = {
      visible: true,
      type: payload?.type || 'info',
      title: payload?.title || '',
      message: payload?.message || ''
    };
    setToast(next);
    const duration = typeof payload?.duration === 'number' ? payload.duration : 3000;
    hideTimerRef.current = setTimeout(() => {
      hideToast();
    }, duration);
  }, [hideToast]);

  const value = useMemo(() => ({ showToast, hideToast }), [showToast, hideToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastHost toast={toast} onHide={hideToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
};
