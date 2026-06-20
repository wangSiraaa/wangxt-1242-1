import { writable } from 'svelte/store';
import type { UserRole } from '$types';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

function createNotificationStore() {
  const { subscribe, update } = writable<Notification[]>([]);

  function add(notification: Omit<Notification, 'id'>) {
    const id = crypto.randomUUID();
    const newNotification = { ...notification, id };
    
    update((notifications) => [...notifications, newNotification]);

    setTimeout(() => {
      remove(id);
    }, notification.duration || 3000);

    return id;
  }

  function remove(id: string) {
    update((notifications) => notifications.filter((n) => n.id !== id));
  }

  function success(message: string, duration?: number) {
    return add({ type: 'success', message, duration });
  }

  function error(message: string, duration?: number) {
    return add({ type: 'error', message, duration });
  }

  function warning(message: string, duration?: number) {
    return add({ type: 'warning', message, duration });
  }

  function info(message: string, duration?: number) {
    return add({ type: 'info', message, duration });
  }

  return {
    subscribe,
    add,
    remove,
    success,
    error,
    warning,
    info,
  };
}

export const notifications = createNotificationStore();
