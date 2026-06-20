import { writable, derived } from 'svelte/store';
import type { User, UserRole } from '$types';

function createUserStore() {
  const { subscribe, set, update } = writable<User | null>(null);

  return {
    subscribe,
    setUser: (user: User | null) => set(user),
    clearUser: () => set(null),
    updateUser: (updates: Partial<User>) =>
      update((current) => (current ? { ...current, ...updates } : current)),
  };
}

export const currentUser = createUserStore();

export const hasRole = (role: UserRole) =>
  derived(currentUser, ($user) => $user?.role === role);

export const isLibrarian = derived(currentUser, ($user) => $user?.role === 'librarian');
export const isRestorer = derived(currentUser, ($user) => $user?.role === 'restorer');
export const isExpert = derived(currentUser, ($user) => $user?.role === 'expert');
export const isAdmin = derived(currentUser, ($user) => $user?.role === 'admin');
