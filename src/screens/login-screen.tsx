import { useState } from "react"
import { QrCode, Cookie } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { QRCodeLogin } from "@/view/qr-code-login"
import { CookieLogin } from "@/view/cookie-login"

type LoginMethod = "qr" | "cookie"

interface LoginScreenProps {
  onLoginSuccess: () => void
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("qr")

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">选择登入方式</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={() => setLoginMethod("qr")}
              variant={loginMethod === "qr" ? "default" : "secondary"}
              className="flex-1"
            >
              <QrCode className="w-4 h-4 mr-2" />
              二维码
            </Button>
            <Button
              onClick={() => setLoginMethod("cookie")}
              variant={loginMethod === "cookie" ? "default" : "secondary"}
              className="flex-1"
            >
              <Cookie className="w-4 h-4 mr-2" />
              Cookie
            </Button>
          </div>

          <div className="mt-4">
            {loginMethod === "qr" ? (
              <QRCodeLogin onLoginSuccess={onLoginSuccess} />
            ) : (
              <CookieLogin onLoginSuccess={onLoginSuccess} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
