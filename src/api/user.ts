import { request } from "@/lib/api";

const BASE_URL = "https://api.bilibili.com";

interface UserInfo {
  mid: number;
  uname: string;
  face: string;
  wbi_img: {
    img_url: string;
    sub_url: string;
  };
}

export async function getUserInfo(): Promise<UserInfo> {
  return request<UserInfo>(BASE_URL, "/x/web-interface/nav", {
    headers: {
      Origin: BASE_URL,
    },
  });
}
