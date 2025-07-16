import { create } from 'zustand';

import { SupabaseUser } from '@/types/datatypes';

interface Store {
  roomId: string | null;
  user: SupabaseUser | null;
  setRoomId: (roomId: string) => void;
  setUser: (user: SupabaseUser) => void;
  clear: () => void;
}

export const useGlobalStore = create<Store>((set) => ({
  roomId: null,
  user: null,

  setRoomId: (roomId: string) => set({ roomId }),

  setUser: (user: SupabaseUser) => set({ user }),

  clear: () => set({ roomId: null, user: null }),
}));
