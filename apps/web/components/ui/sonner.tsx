import React from 'react';
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Simple toast implementation
interface Toast {
  id: string;
  title?: string;
  description?: string;
  type?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToasterContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToasterContext = React.createContext<ToasterContextType | undefined>(undefined);

// Toast hook
export const useToast = () => {
  const context = React.useContext(ToasterContext);
  if (!context) {
    // Return a fallback implementation if no provider is found
    return {
      toasts: [],
      addToast: (toast: Omit<Toast, 'id'>) => {
        console.log('Toast:', toast);
      },
      removeToast: () => {},
      toast: (message: string | { title?: string; description?: string; type?: Toast['type'] }) => {
        if (typeof message === 'string') {
          console.log('Toast:', message);
        } else {
          console.log(`Toast [${message.type || 'default'}]:`, message.description || message.title || '');
        }
      }
    };
  }
  return {
    ...context,
    toast: (message: string | { title?: string; description?: string; type?: Toast['type'] }) => {
      if (typeof message === 'string') {
        context.addToast({ description: message, type: 'default' });
      } else {
        context.addToast(message);
      }
    }
  };
};

// Toast function for external use - this will work outside of React components
let globalToastHandler: ((message: string | { title?: string; description?: string; type?: Toast['type'] }) => void) | null = null;

export const toast = (message: string | { title?: string; description?: string; type?: Toast['type'] }) => {
  if (globalToastHandler) {
    globalToastHandler(message);
  } else {
    // Fallback to console if no handler is set
    if (typeof message === 'string') {
      console.log('Toast:', message);
    } else {
      console.log(`Toast [${message.type || 'default'}]:`, message.description || message.title || '');
    }
  }
};

// Function to set the global toast handler
export const setGlobalToastHandler = (handler: typeof globalToastHandler) => {
  globalToastHandler = handler;
};

// Provider component
export const ToasterProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2);
    const newToast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration
    const duration = toast.duration ?? 5000;
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Set up global toast handler
  React.useEffect(() => {
    const handler = (message: string | { title?: string; description?: string; type?: Toast['type'] }) => {
      if (typeof message === 'string') {
        addToast({ description: message, type: 'default' });
      } else {
        addToast(message);
      }
    };
    setGlobalToastHandler(handler);
    
    return () => setGlobalToastHandler(null);
  }, [addToast]);

  return (
    <ToasterContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToasterContext.Provider>
  );
};

// Toaster component
export const Toaster = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

// Individual toast component
const ToastComponent = ({ toast, onClose }: { toast: Toast; onClose: () => void }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getColorClasses = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-white border-gray-200 text-gray-800';
    }
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 rounded-lg border shadow-lg min-w-80 max-w-96",
        getColorClasses()
      )}
    >
      <div className="flex items-center space-x-3">
        {getIcon()}
        <div>
          {toast.title && (
            <div className="font-semibold text-sm">{toast.title}</div>
          )}
          {toast.description && (
            <div className="text-sm opacity-90">{toast.description}</div>
          )}
        </div>
      </div>
      <button
        onClick={onClose}
        className="ml-4 text-gray-400 hover:text-gray-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};


