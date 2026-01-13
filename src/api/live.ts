import { request } from "@/lib/api";
import type { ParentArea } from "@/types/config";
import { encWbi } from "@/lib/wbi";
import { useConfigStore } from "@/store/config";
import { appSign } from "@/lib/app-sign";

interface RoomId {
  room_id: number;
}

interface HostList {
  host: string;
  port: number;
  wss_port: number;
  ws_port: number;
}

interface RoomTokenInfo {
  token: string;
  host_list: HostList[];
}

interface LiveVersion {
  curr_version: string;
  build: number;
}

interface StartLiveProtocols {
  protocol: string;
  addr: string;
  code: string;
  new_link: string;
  provider: string;
}

interface StartLive {
  code: number;
  data: {
    qr: string;
    rtmp: {
      addr: string;
      code: string;
    };
    protocols: StartLiveProtocols[];
  };
  message: string;
}

export async function getRoomId(uid: number): Promise<RoomId> {
  return request<RoomId>(`https://api.live.bilibili.com/room/v2/Room/room_id_by_uid?uid=${uid}`, {
    headers: {
      Origin: "https://api.live.bilibili.com",
    },
  });
}

export async function getAreaList(): Promise<ParentArea[]> {
  return request<ParentArea[]>("https://api.live.bilibili.com/room/v1/Area/getList?show_pinyin=1", {
    headers: {
      Origin: "https://api.live.bilibili.com",
    },
  });
}

export async function getRoomToken(roomId: number): Promise<RoomTokenInfo> {
  const config = useConfigStore.getState().config;
  //type=0&web_location=444.8
  const query = encWbi({ id: roomId, type: 0 }, config.img_url, config.sub_url);
  console.log(query);
  return request<RoomTokenInfo>(`https://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo?${query}`, {
    headers: {
      origin: "https://live.bilibili.com",
      referer: "https://live.bilibili.com/",
    },
  });
}

export async function getLiveVersion(): Promise<LiveVersion> {
  const verQueryParams = {
    system_version: String(2),
    ts: String(Date.now()),
  };
  return request<LiveVersion>(
    `https://api.live.bilibili.com/xlive/app-blink/v1/liveVersionInfo/getHomePageLiveVersion?${appSign(verQueryParams)}`,
    {
      headers: {
        origin: "https://api.live.bilibili.com",
      },
    },
  );
}

export async function updateRoomTitle(title: string): Promise<[]> {
  const state = useConfigStore.getState();
  return request<[]>(`https://api.live.bilibili.com/room/v1/Room/update`, {
    method: "POST",
    headers: {
      origin: "https://api.live.bilibili.com",
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
  return request<[]>(`https://api.live.bilibili.com/room/v1/Room/update`, {
    method: "POST",
    headers: {
      origin: "https://api.live.bilibili.com",
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

export async function startLive(version: string, build: string): Promise<StartLive> {
  const state = useConfigStore.getState();
  return request<StartLive>(
    `https://api.live.bilibili.com/room/v1/Room/startLive`,
    {
      method: "POST",
      headers: {
        origin: "https://api.live.bilibili.com",
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
  return request<[]>(`https://api.live.bilibili.com/room/v1/Room/stopLive`, {
    method: "POST",
    headers: {
      origin: "https://api.live.bilibili.com",
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
  const query = encWbi({ web_location: 444.8 }, state.config.img_url, state.config.sub_url);
  console.log(query);
  return request<[]>(`https://api.live.bilibili.com/msg/send?${query}`, {
    method: "POST",
    headers: {
      origin: "https://api.live.bilibili.com",
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
