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

export interface AppConfig {
    cookies: AppCookie[];
    areaList: ParentArea[];
    theme: 'light' | 'dark';
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
    rtmpAddress: string;
    streamKey: string;
}

export const DEFAULT_CONFIG: AppConfig = {
    cookies: [],
    areaList: [],
    theme: 'light',
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
    rtmpAddress: "",
    streamKey: ""
};