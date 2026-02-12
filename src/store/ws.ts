import { create } from "zustand";
import { type Comment } from "@/types/comment";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { InteractWordV2 } from "@/protos/InteractWordV2";

interface MessageEvent {
  payload: string;
}

interface ConnectionEvent {
  status: string;
}

interface ErrorEvent {
  error: string;
}

function base64ToBytes(base64: string) {
  const binString = atob(base64);
  return Uint8Array.from(binString, (m) => m.codePointAt(0) || 0);
}

interface WsState {
  connected: boolean;
  connecting: boolean;
  regularMessages: Comment[];
  superChats: Comment[];
  watchedUser: number;
  popularity: number;
  onlineCount: number;
  error: string | null;
  messageId: number;

  initListeners: () => Promise<() => void>;

  connect: (uid: number, room: number, token: string) => Promise<void>;
  disconnect: () => Promise<void>;

  setWatchedUser: (v: number) => void;
  setPopularity: (v: number) => void;
  setOnlineCount: (v: number) => void;

  setConnected: (v: boolean) => void;
  addMessage: (msg: Comment) => void;
}

export const useWsStore = create<WsState>((set) => ({
  connected: false,
  connecting: false,
  regularMessages: [],
  superChats: [],
  watchedUser: 0,
  popularity: 0,
  onlineCount: 0,
  error: null,
  messageId: 0,

  setOnlineCount: (v) => set({ onlineCount: v }),

  setWatchedUser: (v) => set({ watchedUser: v }),
  setPopularity: (v) => set({ popularity: v }),

  setConnected: (v) => set({ connected: v }),
  initListeners: async () => {
    const unlistenSuccess = await listen<ConnectionEvent>(
      "connection-success",
      (event) => {
        console.log("Connected:", event.payload);
        set({ connected: true, connecting: false, error: null });
      },
    );

    const unlistenClosed = await listen<ConnectionEvent>(
      "connection-closed",
      (event) => {
        console.log("Disconnected:", event.payload);
        set({ connected: false, connecting: false });
      },
    );

    const unlistenMessage = await listen<MessageEvent>(
      "message-received",
      (event) => {
        const { payload } = event.payload;
        const obj = JSON.parse(payload);
        switch (obj["cmd"]) {
          case "DANMU_MSG":
            set((state) => ({
              messageId: state.messageId++,
              regularMessages: [
                ...state.regularMessages,
                {
                  id: String(state.messageId),
                  username: obj["info"][0][15]["user"]["base"]["name"],
                  message: obj["info"][1],
                  timestamp: new Date(),
                  type: "chat",
                  avatar: obj["info"][0][15]["user"]["base"]["face"],
                },
              ],
            }));
            break;
          case "WATCHED_CHANGE":
            set(() => ({
              watchedUser: obj["data"]["num"],
            }));
            break;
          case "INTERACT_WORD_V2": {
            const pbObj = InteractWordV2.fromBinary(
              base64ToBytes(obj["data"]["pb"]),
            );
            set((state) => ({
              messageId: state.messageId++,
              regularMessages: [
                ...state.regularMessages,
                {
                  id: String(state.messageId),
                  username: pbObj.uname,
                  message: "进入直播间",
                  timestamp: new Date(),
                  type: "enter",
                },
              ],
            }));
            break;
          }
          case "ONLINE_RANK_COUNT": {
            set(() => ({
              onlineCount: obj["data"]["count"],
            }));
            break;
          }
          case "SEND_GIFT":
            set((state) => ({
              messageId: state.messageId++,
              regularMessages: [
                ...state.regularMessages,
                {
                  id: String(state.messageId),
                  username: obj["data"]["uname"],
                  message: "",
                  timestamp: new Date(),
                  type: "gift",
                  giftName: obj["data"]["giftName"],
                  giftCount: obj["data"]["num"],
                },
              ],
            }));
            break;
          case "SUPER_CHAT_MESSAGE":
            set((state) => ({
              messageId: state.messageId++,
              superChats: [
                ...state.superChats,
                {
                  id: String(state.messageId++),
                  username: obj["data"]["user_info"]["uname"],
                  avatar: obj["data"]["user_info"]["face"],
                  message: obj["data"]["message"],
                  timestamp: new Date(),
                  amount: obj["data"]["price"],
                  type: "superchat",
                },
              ],
            }));
            break;
          default:
            console.log("unknown cmd:" + payload);
            break;
        }
      },
    );

    const unlistenError = await listen<ErrorEvent>(
      "connection-error",
      (event) => {
        console.error("Connection error:", event.payload.error);
        set({ error: event.payload.error, connecting: false });
      },
    );

    return () => {
      unlistenSuccess();
      unlistenClosed();
      unlistenMessage();
      unlistenError();
    };
  },
  connect: async (uid: number, room: number, token: string) => {
    console.log("call");
    try {
      await invoke("comment_connect", {
        host: "broadcastlv.chat.bilibili.com",
        port: 2243,
        uid: uid,
        room: room,
        token: token,
      });
    } catch (error) {
      set({ error: error as string, connecting: false });
    }
  },
  disconnect: async () => {
    set({ connecting: true });
    try {
      await invoke("comment_disconnect");
      set({ connecting: false, connected: false });
    } catch (error) {
      set({ error: error as string, connecting: false });
    }
  },
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
