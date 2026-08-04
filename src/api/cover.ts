import { fetch } from "@tauri-apps/plugin-http";
import { request } from "@/lib/api";
import { useConfigStore } from "@/store/config";

/**
 * Live room cover APIs.
 *
 * Credits:
 * - StartLive (https://github.com/Radekyspec/StartLive): upload + UpdatePreLiveInfo payloads
 * - openblive (https://github.com/mozi1924/openblive): cover review state mapping
 * - BilibiliLiveTools (https://github.com/withsalt/BilibiliLiveTools): audit_title_status comments
 * - bilibili-API-collect (https://github.com/SocialSisterYi/bilibili-API-collect): room info fields
 *
 * Known state enums (from the official webview bundle):
 * - cover.auditStatus: 0 = auditing, 1 = approved, -1 = rejected
 * - audit_info.audit_title_status: 0 = none, 1 = auditing, 2 = approved
 */

const BASE_URL = "https://api.live.bilibili.com";
const UPLOAD_URL = "https://api.bilibili.com/x/upload/web/image";

export interface PreLiveCover {
  url: string;
  auditStatus: number;
  auditReason: string;
  selectStatus: number;
}

export interface CoverHistoryItem {
  cover_url: string;
  score: number;
  score_tag: number;
  score_color: string;
  cover_id: number;
  upload_time: number;
  use_status: number;
}

export interface PreLiveInfo {
  title: string;
  cover: PreLiveCover;
  audit_info: {
    audit_title: string;
    audit_title_status: number;
    audit_title_reason: string;
  };
}

interface CoverHistory {
  cover_history: CoverHistoryItem[];
}

interface UploadImageResult {
  location: string;
  etag: string;
}

export interface RoomInfo {
  title: string;
  user_cover: string;
  parent_area_id: number;
  area_id: number;
}

export async function getRoomInfo(roomId: number): Promise<RoomInfo> {
  return request<RoomInfo>(
    BASE_URL,
    `/room/v1/Room/get_info?room_id=${roomId}`,
    {
      headers: {
        Origin: BASE_URL,
      },
    },
  );
}

export async function getPreLiveInfo(): Promise<PreLiveInfo> {
  return request<PreLiveInfo>(
    BASE_URL,
    "/xlive/app-blink/v1/preLive/PreLive?cover=true&platform=pc_link&mobi_app=pc_link&build=1",
    {
      headers: {
        Origin: BASE_URL,
      },
    },
  );
}

export async function getCoverHistory(): Promise<CoverHistory> {
  return request<CoverHistory>(
    BASE_URL,
    "/xlive/app-blink/v1/preLive/GetCoverHistory?platform=pc_link&build=1",
    {
      headers: {
        Origin: BASE_URL,
      },
    },
  );
}

export async function uploadCoverImage(file: File): Promise<UploadImageResult> {
  const state = useConfigStore.getState();
  const csrf = state.getCookie("bili_jct") || "";
  const formData = new FormData();
  formData.append("bucket", "live");
  formData.append("dir", "new_room_cover");
  formData.append("file", file);
  const response = await fetch(`${UPLOAD_URL}?csrf=${csrf}`, {
    method: "POST",
    headers: {
      cookie: state.getCookieString(),
      Origin: "https://live.bilibili.com",
      Referer: "https://live.bilibili.com/",
    },
    body: formData,
  });
  const data = await response.json();
  if (data.code !== 0 || data.data === null) {
    throw new Error(
      `API Request Error: ${data.message || "Unknown Error"} (${data.code})`,
    );
  }
  return data.data;
}

export async function updatePreLiveCover(coverUrl: string): Promise<object> {
  const state = useConfigStore.getState();
  const csrf = state.getCookie("bili_jct") || "";
  return request<object>(
    BASE_URL,
    "/xlive/app-blink/v1/preLive/UpdatePreLiveInfo",
    {
      method: "POST",
      headers: {
        Origin: BASE_URL,
      },
      data: {
        platform: "pc_link",
        mobi_app: "pc_link",
        build: "1",
        cover: coverUrl,
        coverVertical: "",
        liveDirectionType: "1",
        csrf_token: csrf,
        csrf: csrf,
        visit_id: "",
      },
    },
  );
}
