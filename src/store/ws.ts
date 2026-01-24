import { create } from "zustand";
import { type Comment } from "@/types/comment";

interface WsState {
  connected: boolean;
  shouldConnect: boolean;
  regularMessages: Comment[];
  superChats: Comment[];
  watchedUser: number;
  popularity: number;

  setWatchedUser: (v: number) => void;
  setPopularity: (v: number) => void;

  setConnected: (v: boolean) => void;
  connect: () => void;
  disconnect: () => void;
  addMessage: (msg: Comment) => void;
}

export const useWsStore = create<WsState>((set) => ({
  connected: false,
  shouldConnect: false,
  regularMessages: [],
  superChats: [],
  watchedUser: 0,
  popularity: 0,

  setWatchedUser: (v) => set({ watchedUser: v }),
  setPopularity: (v) => set({ popularity: v }),

  setConnected: (v) => set({ connected: v }),

  connect: () => set({ shouldConnect: true }),
  disconnect: () => set({ shouldConnect: false, connected: false }),

  addMessage: (msg) =>
    set((state) => ({
      regularMessages:
        msg.type !== "superchat"
          ? [...state.regularMessages, msg]
          : state.regularMessages,
      superChats:
        msg.type === "superchat"
          ? [...state.superChats, msg]
          : state.superChats,
    })),
}));
