import { create } from "zustand";
import { ConfigManager } from "@/utils/config-manager";
import { type AppConfig, DEFAULT_CONFIG, type AppCookie } from "@/types/config";
import { debounce } from "lodash-es";

interface ConfigState {
  config: AppConfig;
  isInitialized: boolean;
  init: () => Promise<void>;
  updateConfig: (patch: Partial<AppConfig>) => void;

  setCookies: (cookies: AppCookie[]) => void;
  addCookie: (cookie: AppCookie) => void;
  clearAuth: () => void;

  getCookieString: () => string;
  getCookie: (name: string) => string | null;
}

const debouncedSave = debounce(async (config: AppConfig) => {
  await ConfigManager.save(config);
}, 1000);

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: DEFAULT_CONFIG,
  isInitialized: false,

  init: async () => {
    const savedConfig = await ConfigManager.load();
    set({ config: savedConfig, isInitialized: true });
  },

  updateConfig: (patch) => {
    const newConfig = { ...get().config, ...patch };
    set({ config: newConfig });
    debouncedSave(newConfig);
  },

  setCookies: (cookies) => {
    get().updateConfig({ cookies });
  },

  addCookie: (newCookie) => {
    const currentCookies = get().config.cookies;
    const index = currentCookies.findIndex((c) => c.name === newCookie.name);

    let newCookies;
    if (index > -1) {
      newCookies = [...currentCookies];
      newCookies[index] = newCookie;
    } else {
      newCookies = [...currentCookies, newCookie];
    }

    get().updateConfig({ cookies: newCookies });
  },

  clearAuth: () => {
    const emptyConfig = {
      ...get().config,
      csrf: null,
      cookies: [],
    };
    set({ config: emptyConfig });
    ConfigManager.save(emptyConfig);
  },

  getCookieString: () => {
    const cookies = get().config.cookies;
    if (!cookies || cookies.length === 0) return "";
    return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  },

  getCookie: (name: string): string | null => {
    const cookies = get().config.cookies;
    const cookie = cookies.find((c) => c.name === name);
    return cookie ? cookie.value : null;
  },
}));
