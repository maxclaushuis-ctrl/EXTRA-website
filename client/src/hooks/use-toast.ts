import { useState, useEffect, useCallback } from 'react';

export type ToastType = 'info' | 'success' | 'error' | 'warning' | 'loading';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

export interface UseToastProps {
  duration?: number;
}

export interface UseToastReturn {
  toast: (props: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
  toasts: Toast[];
}

let toastCount = 0;

export function useToast({ duration = 5000 }: UseToastProps = {}): UseToastReturn {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setToasts(toasts => 
        toasts.filter(toast => 
          !toast.duration || 
          new Date().getTime() - parseInt(toast.id) < toast.duration
        )
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const toast = useCallback(
    (props: Omit<Toast, 'id'>) => {
      const id = `${new Date().getTime()}-${toastCount++}`;
      const newToast = {
        id,
        ...props,
        duration: props.duration || duration,
      };
      
      setToasts(prev => [...prev, newToast]);
      return id;
    }, 
    [duration]
  );

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return {
    toast,
    dismiss,
    toasts,
  };
}