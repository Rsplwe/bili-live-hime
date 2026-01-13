import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useConfigStore } from "@/store/config"
import { getUserInfo } from "@/api/user"
import { getAreaList, getRoomId, getRoomToken } from "@/api/live"

interface LoadingScreenProps {
  onValidationComplete: (isValid: boolean) => void
}

export function LoadingScreen({ onValidationComplete }: LoadingScreenProps) {
  const [status, setStatus] = useState("正在检查已保存的凭据...")
  const hasValidatedRef = useRef(false)

  useEffect(() => {
    const validateToken = async () => {
      if (hasValidatedRef.current) return
      hasValidatedRef.current = true

      setStatus("正在验证令牌...");
      const state = useConfigStore.getState();
      const cookieString = state.getCookieString();

      if (cookieString === '' || state.getCookie('bili_jct') === null) {
        onValidationComplete(false)
        return
      }

      try {
        setStatus("已存在令牌，获取用户信息...");

        const userRes = await getUserInfo()
        const uid = userRes.mid
        const imgUrl = userRes.wbi_img.img_url
        const subUrl = userRes.wbi_img.sub_url
        state.updateConfig({
          uid,
          username: userRes.uname,
          avatar: userRes.face,
          img_url: imgUrl.slice(
            imgUrl.lastIndexOf('/') + 1,
            imgUrl.lastIndexOf('.')
          ),
          sub_url: subUrl.slice(
            subUrl.lastIndexOf('/') + 1,
            subUrl.lastIndexOf('.')
          )
        })

        setStatus("获取直播间信息...");
        const roomIdRes = await getRoomId(uid)
        state.updateConfig({ roomId: roomIdRes.room_id })

        setStatus("获取分区信息...");
        const areaRes = await getAreaList()
        state.updateConfig({ areaList: areaRes })


        setStatus("获取消息流...");
        const roomTokenRes = await getRoomToken(roomIdRes.room_id)
        state.updateConfig({ roomToken: roomTokenRes.token })

        setStatus("验证成功！");
        onValidationComplete(true)
      } catch (error) {
        setStatus("初始化错误：" + error)
        await new Promise((resolve) => setTimeout(resolve, 1000))
        state.clearAuth();
        onValidationComplete(false)
      }
    }

    validateToken()
  }, [onValidationComplete])

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-lg">哔哩哔哩直播姬（仮）</CardTitle>
          <CardDescription>初始化应用</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground text-center">{status}</p>
        </CardContent>
      </Card>
    </div>
  )
}
