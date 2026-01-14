import { useState, useEffect, useCallback } from "react";
import { RefreshCw, CheckCircle, XCircle } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { getLoginQrcode, pollQrCodeStatus } from "@/api/passport";
import { Spinner } from "@/components/ui/spinner";
import { HugeiconsIcon } from "@hugeicons/react";

interface QRCodeLoginProps {
  onLoginSuccess: () => void;
}

type QRStatus = "loading" | "pending" | "scanned" | "confirmed" | "expired" | "error";

export function QRCodeLogin({ onLoginSuccess }: QRCodeLoginProps) {
  const [qrStatus, setQrStatus] = useState<QRStatus>("loading");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [qrCodeKey, setQrCodeKey] = useState<string>("");

  const generateQRCode = useCallback(async () => {
    setQrStatus("loading");
    try {
      const qrcode = await getLoginQrcode();
      setQrCodeUrl(qrcode.url);
      setQrCodeKey(qrcode.qrcode_key);
      setQrStatus("pending");
    } catch (error) {
      console.error("Failed to generate QR code:", error);
      setQrStatus("error");
    }
  }, []);
  useEffect(() => {
    generateQRCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (qrStatus !== "pending" && qrStatus !== "scanned") return;

    const pollInterval = setInterval(async () => {
      try {
        const data = await pollQrCodeStatus(qrCodeKey);

        switch (data.code) {
          case 0:
            setQrStatus("confirmed");
            clearInterval(pollInterval);
            onLoginSuccess();
            break;
          case 86038:
            setQrStatus("expired");
            clearInterval(pollInterval);
            break;
          case 86090:
            setQrStatus("scanned");
            break;
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 1000);

    const expireTimeout = setTimeout(() => {
      if (qrStatus === "pending") {
        setQrStatus("expired");
        clearInterval(pollInterval);
      }
    }, 180000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(expireTimeout);
    };
  }, [qrStatus, qrCodeKey, onLoginSuccess]);

  const getStatusMessage = () => {
    switch (qrStatus) {
      case "loading":
        return "生成二维码中…";
      case "pending":
        return "请使用哔哩哔哩 App 扫码";
      case "scanned":
        return "已扫码，请在手机上确认登入";
      case "confirmed":
        return "登入成功！";
      case "expired":
        return "二维码已失效";
      case "error":
        return "发生错误";
    }
  };

  const getStatusIcon = () => {
    switch (qrStatus) {
      case "loading":
        return <Spinner />;
      case "scanned":
        return <Spinner className="text-primary" />;
      case "confirmed":
        return <HugeiconsIcon icon={CheckCircle} className="text-primary" />;
      case "expired":
      case "error":
        return <HugeiconsIcon icon={XCircle} className="text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative aspect-square w-full max-w-50 mx-auto bg-card rounded-xl border border-border overflow-hidden">
        {qrStatus === "loading" ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Spinner className="w-8 h-8 text-muted-foreground" />
          </div>
        ) : qrStatus === "expired" || qrStatus === "error" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-card/95">
            <HugeiconsIcon icon={XCircle} className="w-8 h-8 text-destructive" />
            <Button variant="link" size="sm" onClick={generateQRCode} className="gap-1.5">
              <HugeiconsIcon icon={RefreshCw} className="w-3.5 h-3.5" />
              刷新
            </Button>
          </div>
        ) : (
          <>
            <div className="absolute inset-4 bg-foreground rounded-lg p-2">
              <div className="w-full h-full bg-background rounded gap-0.5 p-2">
                <QRCodeSVG size={135} value={qrCodeUrl} />
              </div>
            </div>
            {qrStatus === "scanned" && (
              <div className="absolute inset-0 flex items-center justify-center bg-card/80">
                <HugeiconsIcon icon={CheckCircle} className="w-12 h-12 text-primary" />
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        {getStatusIcon()}
        <span>{getStatusMessage()}</span>
      </div>

      {(qrStatus === "pending" || qrStatus === "scanned") && (
        <Button variant="secondary" onClick={generateQRCode} className="w-full">
          <HugeiconsIcon icon={RefreshCw} className="w-4 h-4 mr-2" />
          刷新二维码
        </Button>
      )}

      <p className="text-xs text-center text-muted-foreground">打开您的哔哩哔哩 App 并扫描此二维码登入。</p>
    </div>
  );
}
