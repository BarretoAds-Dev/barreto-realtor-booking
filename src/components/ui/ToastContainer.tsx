/** @jsxImportSource preact */
import { useEffect, useState } from 'preact/hooks';
import { Toast, type ToastProps } from './Toast';

interface ToastItem extends ToastProps {
  id: string;
}

class ToastManager {
  private toasts: ToastItem[] = [];
  private listeners: Array<() => void> = [];
  private idCounter = 0;

  show(props: Omit<ToastProps, 'onClose'>): string {
    const id = `toast-${++this.idCounter}`;
    const toast: ToastItem = { ...props, id };
    this.toasts.push(toast);
    this.notify();
    return id;
  }

  remove(id: string): void {
    const index = this.toasts.findIndex((t) => t.id === id);
    if (index > -1) {
      this.toasts.splice(index, 1);
      this.notify();
    }
  }

  getAll(): ToastItem[] {
    return [...this.toasts];
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }
}

const toastManager = new ToastManager();

export function showToast(props: Omit<ToastProps, 'onClose'>): string {
  return toastManager.show(props);
}

export function removeToast(id: string): void {
  toastManager.remove(id);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsubscribe = toastManager.subscribe(() => {
      setToasts(toastManager.getAll());
    });
    setToasts(toastManager.getAll());
    return unsubscribe;
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none max-w-md w-full">
      {toasts.map((toast) => (
        <div key={toast.id} class="pointer-events-auto">
          <Toast
            {...toast}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}

