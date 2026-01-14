import { useState } from "react";
import { AlertCircle } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useConfigStore } from "@/store/config";
import { Spinner } from "@/components/ui/spinner";
import { HugeiconsIcon } from "@hugeicons/react";

interface CookieLoginProps {
  onLoginSuccess: () => void;
}

export function CookieLogin({ onLoginSuccess }: CookieLoginProps) {
  const [cookie, setCookie] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseCookie = (cookie: string): Record<string, string> => {
    const result: Record<string, string> = {};

    cookie
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((pair) => {
        const eqIndex = pair.indexOf("=");
        if (eqIndex === -1) return;

        const key = pair.slice(0, eqIndex).trim();
        const value = pair.slice(eqIndex + 1).trim();

        if (key && value) {
          result[key] = value;
        }
      });

    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cookie.trim()) {
      setError("请输入您的小饼干~");
      return;
    }

    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      const parsed = parseCookie(cookie);

      const missing: string[] = [];

      for (const key of ["SESSDATA", "bili_jct"]) {
        if (!parsed[key] || parsed[key].length === 0) {
          missing.push(key);
        }
      }

      if (missing.length > 0) {
        setError("Cookie 无效。请检查并重试。");
        setIsLoading(false);
        return;
      }
      const state = useConfigStore.getState();
      state.setCookies(Object.entries(parsed).map(([name, value]) => ({ name, value })));
      onLoginSuccess();
      setIsLoading(true);
    }, 1500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cookie">Session Cookie</Label>
        <div className="relative">
          <Textarea
            id="cookie"
            value={cookie}
            onChange={(e) => {
              setCookie(e.target.value);
              setError(null);
            }}
            placeholder="将您的 Cookie 粘贴到此处……"
            rows={4}
            className="resize-none pr-10 font-mono text-xs"
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <HugeiconsIcon icon={AlertCircle} />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={isLoading || !cookie.trim()} className="w-full">
        {isLoading ? (
          <>
            <Spinner />
            正在验证……
          </>
        ) : (
          "通过Cookie登入"
        )}
      </Button>

      <div className="p-3 bg-muted rounded-lg">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">如何获得 Cookie：</strong>
          <br />
          1. 在浏览器中登入哔哩哔哩网站
          <br />
          2. 打开 Developer Tools (F12)
          <br />
          3. 找到网络请求
          <br />
          4. 复制以 "api.bilibili.com" 域请求的 Cookie 字段内容
        </p>
      </div>
    </form>
  );
}
