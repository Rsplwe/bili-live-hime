import { request } from "@/lib/api";
import type { ParentArea } from "@/types/config";
import { encWbi } from "@/lib/wbi";
import { useConfigStore } from "@/store/config";
import { appSign } from "@/lib/app-sign";

const BASE_URL = "https://api.live.bilibili.com";

interface RoomId {
  room_id: number;
}

interface RoomTokenInfo {
  token: string;
  host_list: {
    host: string;
    port: number;
    wss_port: number;
    ws_port: number;
  }[];
}

interface LiveVersion {
  curr_version: string;
  build: number;
}

interface StartLive {
  code: number;
  data: {
    qr: string;
    rtmp: {
      addr: string;
      code: string;
    };
    protocols: {
      protocol: string;
      addr: string;
      code: string;
      new_link: string;
      provider: string;
    }[];
  };
  message: string;
}

interface RoomAdmins {
  page: {
    total_page: number;
    total_count: number;
  };
  data:
    | {
        uid: number;
        uname: string;
        face: string;
        ctime: string;
      }[]
    | null;
  max_room_anchors_number: number;
}

interface SilentUser {
  data: {
    tuid: number; // 被封禁用户 UID
    tname: string; // 被封禁用户昵称
    uid: number; // 操作者 UID
    name: string; // 操作者昵称
    ctime: string;
    face: string;
    block_end_time: string;
  }[];
  total: number;
  total_page: number;
}

interface SearchUser {
  items: {
    uid: number;
    face: string;
    uname: string;
  }[];
}

export type RoomSilentType = "off" | "wealth" | "medal" | "member";

interface RoomSilent {
  type: RoomSilentType | "";
  level: number;
  second: number;
  expire_time: number;
  minute: number;
}

interface ContributionRank {
  item:
    | {
        uid: number;
        name: string;
        face: string;
        rank: number;
        score: number;
        wealth_level: number;
        medal_info: {
          medal_name: string;
          level: number;
          guard_level: number;
          is_light: number;
          medal_color_start: number;
          medal_color_end: number;
          medal_color_border: number;
        };
      }[]
    | null;
}

export async function getRoomId(uid: number): Promise<RoomId> {
  return request<RoomId>(BASE_URL, `/room/v2/Room/room_id_by_uid?uid=${uid}`, {
    headers: {
      Origin: BASE_URL,
    },
  });
}

export async function getAreaList(): Promise<ParentArea[]> {
  return request<ParentArea[]>(
    BASE_URL,
    "/room/v1/Area/getList?show_pinyin=1",
    {
      headers: {
        Origin: BASE_URL,
      },
    },
  );
}

export async function getRoomToken(roomId: number): Promise<RoomTokenInfo> {
  const config = useConfigStore.getState().config;
  //type=0&web_location=444.8
  const query = encWbi({ id: roomId, type: 0 }, config.img_url, config.sub_url);
  console.log(query);
  return request<RoomTokenInfo>(
    BASE_URL,
    `/xlive/web-room/v1/index/getDanmuInfo?${query}`,
    {
      headers: {
        origin: "https://live.bilibili.com",
        referer: "https://live.bilibili.com/",
      },
    },
  );
}

export async function getLiveVersion(): Promise<LiveVersion> {
  const verQueryParams = {
    system_version: String(2),
    ts: String(Date.now()),
  };
  return request<LiveVersion>(
    BASE_URL,
    `/xlive/app-blink/v1/liveVersionInfo/getHomePageLiveVersion?${appSign(verQueryParams)}`,
    {
      headers: {
        Origin: BASE_URL,
      },
    },
  );
}

export async function updateRoomTitle(title: string): Promise<[]> {
  const state = useConfigStore.getState();
  return request<[]>(BASE_URL, `/room/v1/Room/update`, {
    method: "POST",
    headers: {
      Origin: BASE_URL,
    },
    data: {
      room_id: String(state.config.roomId),
      csrf: state.getCookie("bili_jct") || "",
      csrf_token: state.getCookie("bili_jct") || "",
      title: title,
      platform: "pc_link",
    },
  });
}

export async function updateRoomArea(areaId: string): Promise<[]> {
  const state = useConfigStore.getState();
  return request<[]>(BASE_URL, `/room/v1/Room/update`, {
    method: "POST",
    headers: {
      Origin: BASE_URL,
    },
    data: {
      room_id: String(state.config.roomId),
      csrf: state.getCookie("bili_jct") || "",
      csrf_token: state.getCookie("bili_jct") || "",
      area_id: areaId,
      platform: "pc_link",
    },
  });
}

export async function startLive(
  version: string,
  build: string,
): Promise<StartLive> {
  const state = useConfigStore.getState();
  return request<StartLive>(
    BASE_URL,
    `/room/v1/Room/startLive`,
    {
      method: "POST",
      headers: {
        Origin: BASE_URL,
      },
      data: {
        room_id: String(state.config.roomId),
        platform: "pc_link",
        backup_stream: "0",
        csrf: state.getCookie("bili_jct") || "",
        csrf_token: state.getCookie("bili_jct") || "",
        area_v2: state.config.areaId || "",
        version: version,
        build: build,
        ts: String(Date.now()),
      },
    },
    true,
    true,
  );
}

export async function stopLive(): Promise<[]> {
  const state = useConfigStore.getState();
  return request<[]>(BASE_URL, `/room/v1/Room/stopLive`, {
    method: "POST",
    headers: {
      Origin: BASE_URL,
    },
    data: {
      room_id: String(state.config.roomId),
      csrf: state.getCookie("bili_jct") || "",
      platform: "pc_link",
      csrf_token: state.getCookie("bili_jct") || "",
    },
  });
}

export async function sendComment(comment: string): Promise<[]> {
  const state = useConfigStore.getState();
  const query = encWbi(
    { web_location: 444.8 },
    state.config.img_url,
    state.config.sub_url,
  );
  console.log(query);
  return request<[]>(BASE_URL, `/msg/send?${query}`, {
    method: "POST",
    headers: {
      Origin: BASE_URL,
    },
    data: {
      msg: comment,
      color: String(16777215),
      fontsize: String(25),
      rnd: String(Date.now()),
      roomid: String(state.config.roomId),
      csrf_token: state.getCookie("bili_jct") || "",
      csrf: state.getCookie("bili_jct") || "",
    },
  });
}

export async function getRoomAdmins(page: number): Promise<RoomAdmins> {
  return request<RoomAdmins>(
    BASE_URL,
    `/xlive/app-ucenter/v1/roomAdmin/get_by_anchor?page=${page}`,
    {
      headers: {
        Origin: BASE_URL,
      },
    },
  );
}

export async function addRoomAdmin(id: string): Promise<object> {
  const csrf = useConfigStore.getState().getCookie("bili_jct") || "";
  return request<object>(BASE_URL, `/xlive/web-ucenter/v1/roomAdmin/appoint`, {
    method: "POST",
    headers: {
      origin: "https://live.bilibili.com",
    },
    data: {
      admin: id,
      admin_level: "1",
      csrf_token: csrf,
      csrf: csrf,
      visit_id: "",
    },
  });
}

export async function deleteRoomAdmin(id: string): Promise<object> {
  const csrf = useConfigStore.getState().getCookie("bili_jct") || "";
  return request<object>(BASE_URL, `/xlive/app-ucenter/v1/roomAdmin/dismiss`, {
    method: "POST",
    headers: {
      Origin: BASE_URL,
    },
    data: {
      uid: id,
      csrf_token: csrf,
      csrf: csrf,
      visit_id: "",
    },
  });
}

export async function getSilentUserList(page: number): Promise<SilentUser> {
  const roomId = useConfigStore.getState().config.roomId;
  const csrf = useConfigStore.getState().getCookie("bili_jct") || "";
  return request<SilentUser>(
    BASE_URL,
    `/xlive/web-ucenter/v1/banned/GetSilentUserList`,
    {
      method: "POST",
      headers: {
        Origin: BASE_URL,
      },
      data: {
        room_id: `${roomId}`,
        ps: `${page}`,
        csrf_token: csrf,
        csrf: csrf,
        visit_id: "",
      },
    },
  );
}

export async function searchUsers(search: string): Promise<SearchUser> {
  return request<SearchUser>(
    BASE_URL,
    `/banned_service/v2/Silent/search_user?search=${search}`,
    {
      headers: {
        Origin: BASE_URL,
      },
    },
  );
}

export async function addSilentUser(id: string, time: string): Promise<object> {
  const roomId = useConfigStore.getState().config.roomId;
  const csrf = useConfigStore.getState().getCookie("bili_jct") || "";
  return request<object>(
    BASE_URL,
    `/xlive/web-ucenter/v1/banned/AddSilentUser`,
    {
      method: "POST",
      headers: {
        Origin: BASE_URL,
      },
      data: {
        room_id: `${roomId}`,
        tuid: id,
        mobile_app: "web",
        hour: time,
        csrf_token: csrf,
        csrf: csrf,
        visit_id: "",
      },
    },
  );
}

export async function deleteSilentUser(id: string): Promise<object> {
  const roomId = useConfigStore.getState().config.roomId;
  const csrf = useConfigStore.getState().getCookie("bili_jct") || "";
  return request<object>(
    BASE_URL,
    `/xlive/web-ucenter/v1/banned/DelSilentUser`,
    {
      method: "POST",
      headers: {
        Origin: BASE_URL,
      },
      data: {
        room_id: `${roomId}`,
        tuid: id,
        mobi_app: "web",
        csrf_token: csrf,
        csrf: csrf,
        visit_id: "",
      },
    },
  );
}

export async function getRoomSilent(): Promise<RoomSilent> {
  const roomId = useConfigStore.getState().config.roomId;
  return request<RoomSilent>(
    BASE_URL,
    `/xlive/web-room/v1/banned/GetRoomSilent?room_id=${roomId}`,
    {
      headers: {
        Origin: BASE_URL,
      },
    },
  );
}

export async function setRoomSilent(
  type: RoomSilentType,
  level: number = 1,
  minute: number = 0,
): Promise<object> {
  const roomId = useConfigStore.getState().config.roomId;
  const csrf = useConfigStore.getState().getCookie("bili_jct") || "";
  return request<object>(BASE_URL, `/xlive/web-room/v1/banned/RoomSilent`, {
    method: "POST",
    headers: {
      Origin: BASE_URL,
    },
    data: {
      room_id: `${roomId}`,
      type: type,
      level: String(level),
      minute: String(minute),
      csrf_token: csrf,
      csrf: csrf,
      visit_id: "",
    },
  });
}

interface KeywordList {
  keyword_list: {
    keyword: string;
  }[];
  max_limit: number;
}

export async function getBlockedWords(): Promise<KeywordList> {
  const roomId = useConfigStore.getState().config.roomId;
  const csrf = useConfigStore.getState().getCookie("bili_jct") || "";
  return request<KeywordList>(
    BASE_URL,
    `/xlive/web-ucenter/v1/banned/GetShieldKeywordList`,
    {
      method: "POST",
      headers: {
        Origin: BASE_URL,
      },
      data: {
        room_id: `${roomId}`,
        csrf_token: csrf,
        csrf: csrf,
        visit_id: "",
      },
    },
  );
}

export async function addBlockedWords(keyword: string): Promise<object> {
  const roomId = useConfigStore.getState().config.roomId;
  const csrf = useConfigStore.getState().getCookie("bili_jct") || "";
  return request<object>(
    BASE_URL,
    `/xlive/web-ucenter/v1/banned/AddShieldKeyword`,
    {
      method: "POST",
      headers: {
        Origin: BASE_URL,
      },
      data: {
        room_id: `${roomId}`,
        keyword: keyword,
        csrf_token: csrf,
        csrf: csrf,
        visit_id: "",
      },
    },
  );
}

export async function deleteBlockedWords(keyword: string): Promise<object> {
  const roomId = useConfigStore.getState().config.roomId;
  const csrf = useConfigStore.getState().getCookie("bili_jct") || "";
  return request<object>(
    BASE_URL,
    `/xlive/web-ucenter/v1/banned/DelShieldKeyword`,
    {
      method: "POST",
      headers: {
        Origin: BASE_URL,
      },
      data: {
        room_id: `${roomId}`,
        keyword: keyword,
        csrf_token: csrf,
        csrf: csrf,
        visit_id: "",
      },
    },
  );
}

export async function getContributionRank(): Promise<ContributionRank> {
  const state = useConfigStore.getState();
  const query = encWbi(
    {
      ruid: state.config.uid,
      room_id: state.config.roomId,
      page: 1,
      page_size: 100,
      type: "online_rank",
      switch: "contribution_rank",
      platform: "web",
      web_location: 444.8,
    },
    state.config.img_url,
    state.config.sub_url,
  );
  console.log(query);
  return request<ContributionRank>(
    BASE_URL,
    `/xlive/general-interface/v1/rank/queryContributionRank?${query}`,
    {
      headers: {
        origin: "https://live.bilibili.com",
        referer: "https://live.bilibili.com/",
      },
    },
  );
}
