import { request } from "@/lib/api";

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
  return request<UserInfo>("https://api.bilibili.com/x/web-interface/nav", {
    headers: {
      Origin: "https://api.bilibili.com",
    },
  });
}
