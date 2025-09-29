import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500/90 border-green-400';
      case 'info':
        return 'bg-blue-500/90 border-blue-400';
      case 'warning':
        return 'bg-yellow-500/90 border-yellow-400';
      case 'error':
        return 'bg-red-500/90 border-red-400';
      default:
        return 'bg-neutral-800/90 border-neutral-700';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '💬';
    }
  };

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm
        transition-all duration-300 transform
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${getTypeStyles()}
      `}
    >
      <span className="text-lg">{getIcon()}</span>
      <span className="text-white font-medium">{message}</span>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="ml-2 text-white/70 hover:text-white text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}

interface ToastManagerProps {
  toasts: Array<{
    id: string;
    message: string;
    type: 'success' | 'info' | 'warning' | 'error';
  }>;
  removeToast: (id: string) => void;
}

export function ToastManager({ toasts, removeToast }: ToastManagerProps) {
  return (
    <>
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{ top: `${1 + index * 5}rem` }}
          className="fixed right-4 z-50"
        >
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </>
  );
}
