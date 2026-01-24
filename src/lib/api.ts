import { useConfigStore } from "@/store/config";
import type { AppCookie } from "@/types/config";
import { fetch } from "@tauri-apps/plugin-http";
import { appSign } from "@/lib/app-sign";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0";

const COMMON_HEADERS = {
  accept: "*/*",
  "user-agent": USER_AGENT,
  "sec-ch-ua": `"Microsoft Edge";v="143", "Chromium";v="143", "Not A(Brand";v="24"`,
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": `"Windows"`,
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-site",
};

export async function request<T>(
  url: string,
  options: RequestInit & {
    data?: Record<string, string>;
  } = {},
  requireSign: boolean = false,
  raw: boolean = false,
): Promise<T> {
  const state = useConfigStore.getState();
  const method = options.method?.toUpperCase() || "GET";
  console.log(`Url (${method}): ${url}`);

  const headers: HeadersInit = {
    ...COMMON_HEADERS,
    ...options.headers,
    cookie: state.getCookieString(),
  };

  const fetchOptions: RequestInit = {
    ...options,
    method,
    headers,
  };

  if (options.data && method !== "GET") {
    (headers as Record<string, string>)["Content-Type"] =
      "application/x-www-form-urlencoded; charset=UTF-8";
    if (requireSign) {
      fetchOptions.body = appSign(options.data);
    } else {
      const urlSP = new URLSearchParams(options.data);
      fetchOptions.body = urlSP.toString();
    }
    console.log(fetchOptions.body);
  }
  const response = await fetch(url, fetchOptions);
  const cookieHeader = response.headers.get("set-cookie");
  if (cookieHeader) {
    const cookies: AppCookie[] = [];
    cookieHeader.split(",").forEach((cookie: string) => {
      const [name, value] = cookie.split(";")[0].split("=");
      if (name && value) {
        cookies.push({ name: name.trim(), value: value.trim() } as AppCookie);
      }
    });

    const sessdata = cookies.find((c) => c.name === "SESSDATA");
    const biliJct = cookies.find((c) => c.name === "bili_jct");

    if (sessdata && biliJct) {
      state.setCookies(cookies);
    }
  }

  const data = await response.json();
  console.log(data);

  if (raw) {
    return data;
  }
  if (data.code !== 0 || data.data === null) {
    throw new Error(
      `API Request Error: ${data.message || "Unknown Error"} (${data.code})`,
    );
  }
  return data.data;
}
