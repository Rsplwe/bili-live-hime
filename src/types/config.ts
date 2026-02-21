export interface AppCookie {
  name: string;
  value: string;
}

export interface ParentArea {
  id: string;
  name: string;
  list: Area[];
}

export interface Area {
  id: string;
  parent_id: string;
  old_area_id: string;
  name: string;
  act_id: string;
  pk_status: string;
  hot_status: string;
  lock_status: string;
  pic: string;
  complex_area_name: string;
  pinyin: string;
  parent_name: string;
  area_type: string;
}

export interface Stream {
  type: string;
  address: string;
  key: string;
}

export interface OBSConfig {
  address: string;
  password?: string;
  autoConnect: boolean;
  autoUpdateSettings: boolean;
  autoStartStopStreaming: boolean;
}

export interface AppConfig {
  cookies: AppCookie[];
  areaList: ParentArea[];
  theme: "light" | "dark";
  uid: number;
  avatar: string | null;
  username: string | null;
  roomId: number;
  csrf: string | null;
  roomTitle: string;
  categoryId: string;
  areaId: string;
  img_url: string;
  sub_url: string;
  roomToken: string;
  isOpenLive: boolean;
  streams: Stream[];
  obsConfig: OBSConfig;
}

export const DEFAULT_CONFIG: AppConfig = {
  cookies: [],
  areaList: [],
  theme: "light",
  uid: 0,
  avatar: null,
  username: null,
  roomId: 0,
  csrf: null,
  roomTitle: "",
  categoryId: "",
  areaId: "",
  img_url: "",
  sub_url: "",
  roomToken: "",
  isOpenLive: false,
  streams: [],
  obsConfig: {
    address: "ws://localhost:4455",
    password: "",
    autoConnect: false,
    autoUpdateSettings: false,
    autoStartStopStreaming: false,
  },
};
