import { request } from "@/lib/api";

const BASE_URL = "https://passport.bilibili.com";

interface GenerateQRCode {
  url: string;
  qrcode_key: string;
}

interface QrCodeStatus {
  code: number;
}

export async function getLoginQrcode(): Promise<GenerateQRCode> {
  return request<GenerateQRCode>(
    BASE_URL,
    "/x/passport-login/web/qrcode/generate",
    {
      headers: {
        Origin: BASE_URL,
      },
    },
  );
}

export async function pollQrCodeStatus(
  qrCodeKey: string,
): Promise<QrCodeStatus> {
  return request<QrCodeStatus>(
    BASE_URL,
    `/x/passport-login/web/qrcode/poll?qrcode_key=${qrCodeKey}`,
    {
      headers: {
        Origin: BASE_URL,
      },
    },
  );
}
