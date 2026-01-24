import { request } from "@/lib/api";

interface GenerateQRCode {
  url: string;
  qrcode_key: string;
}

interface QrCodeStatus {
  code: number;
}

export async function getLoginQrcode(): Promise<GenerateQRCode> {
  return request<GenerateQRCode>(
    "https://passport.bilibili.com/x/passport-login/web/qrcode/generate",
    {
      headers: {
        Origin: "https://passport.bilibili.com",
      },
    },
  );
}

export async function pollQrCodeStatus(
  qrCodeKey: string,
): Promise<QrCodeStatus> {
  return request<QrCodeStatus>(
    `https://passport.bilibili.com/x/passport-login/web/qrcode/poll?qrcode_key=${qrCodeKey}`,
    {
      headers: {
        Origin: "https://passport.bilibili.com",
      },
    },
  );
}
