import { useMemo, useState } from "react"
import { Play, Square, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useConfigStore } from "@/store/config"
import type { Area } from "@/types/config"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog"
import { QRCodeSVG } from "qrcode.react"
import { toast } from "sonner"
import { LoadingButton } from "../components/ui/loading-button"
import { getLiveVersion, startLive, stopLive, updateRoomTitle } from "@/api/live"

export function LiveStreamSettings() {

  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
  const [isQrDialogOpen, setIsQrDialogOpen] = useState<boolean>(false)

  const {
    areaList,
    parentAreaId,
    areaId,
    roomTitle,
    rtmpAddress,
    streamKey,
    isOpenLive
  } = useConfigStore((s) => s.config)

  const updateConfig = useConfigStore((s) => s.updateConfig)

  const selectedParent = useMemo(() => areaList.find((p) => p.id === parentAreaId), [areaList, parentAreaId])
  const childAreas: Area[] = useMemo(() => selectedParent?.list ?? [], [selectedParent])

  const isAreaValid = useMemo(() => {
    if (!parentAreaId || !areaId) return false;
    return childAreas.some(a => a.id === areaId);
  }, [parentAreaId, areaId, childAreas]);

  const canStartStream = useMemo(() => {
    const isBaseValid = !isOpenLive && !!roomTitle?.trim();
    return isBaseValid && isAreaValid;
  }, [isOpenLive, roomTitle, isAreaValid]);

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const setIsStreaming = (status: boolean) => {
    useConfigStore.getState().updateConfig({ isOpenLive: status })
  }

  const handleStartStream = async () => {
    if (!canStartStream) return
    try {

      const version = await getLiveVersion()
      const currentVer = version.curr_version
      const currentBuild = String(version.build)

      // set title
      await handleUpdateTitle();

      // 开始直播请求
      const startRes = await startLive(currentVer, currentBuild)
      switch (startRes.code) {
        case 60024:
          // 需要二维码验证
          setQrCodeUrl(startRes.data.qr)
          setIsQrDialogOpen(true)
          setIsStreaming(false)
          return
        case 0:
          // 成功
          useConfigStore.getState().updateConfig({ rtmpAddress: startRes.data.rtmp.addr })
          useConfigStore.getState().updateConfig({ streamKey: startRes.data.rtmp.code })
          break
        default:
          throw new Error("开始直播失败：" + startRes.message)
      }
      setIsStreaming(true)
    } catch (error) {
      console.error("Start Live:", error)
      toast.error((error as Error).message)
    }
  }

  const handleEndStream = async () => {
    setIsStreaming(false)
    await stopLive()
  }

  const handleUpdateTitle = async () => {
    // 设置直播间标题

    try {
      await updateRoomTitle(roomTitle)
      toast.success("直播间标题更新成功")
    } catch (error) {
      toast.error((error as Error).message)
      setIsStreaming(false)
    }
  }

  return (
    <div className="space-y-6">

      <Card>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <div className="space-y-2">
              <Label htmlFor="stream-title">直播间标题</Label>
              <div className="flex gap-2">
                <Input
                  id="stream-title"
                  value={roomTitle}
                  onChange={(e) => updateConfig({ roomTitle: e.target.value })}
                  placeholder="请输入您的直播标题……"
                  className="flex-1"
                />
                <LoadingButton disabled={roomTitle.trim() === ""} onClickAsync={handleUpdateTitle}>
                  更新
                </LoadingButton>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-xs text-muted-foreground">
                  分类
                </Label>
                <Select value={parentAreaId || ""}
                  onValueChange={(value) => {
                    updateConfig({ parentAreaId: value })
                    updateConfig({ areaId: null })
                  }}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {areaList.map((parent) => (
                      <SelectItem key={parent.id} value={parent.id}>
                        {parent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="area" className="text-xs text-muted-foreground">
                  子分区
                </Label>
                <Select value={areaId || ""}
                  onValueChange={(value) => {
                    updateConfig({ areaId: value })
                  }}
                  disabled={!selectedParent}>
                  <SelectTrigger id="area">
                    <SelectValue placeholder="选择分区" />
                  </SelectTrigger>
                  <SelectContent>
                    {childAreas.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <LoadingButton onClickAsync={handleStartStream} disabled={!canStartStream} className="flex-1">
              <Play className="w-4 h-4 mr-2" />
              开始直播
            </LoadingButton>
            <LoadingButton variant="destructive" onClickAsync={handleEndStream} disabled={!isOpenLive} className="flex-1">
              <Square className="w-4 h-4 mr-2" />
              停止直播
            </LoadingButton>
          </div>
        </CardContent>
      </Card>
      <Dialog modal open={isQrDialogOpen} onOpenChange={(e) => setIsQrDialogOpen(e)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>验证</DialogTitle>
            <DialogDescription>
              本次开播需要身份验证，请使用哔哩哔哩 App 扫码完成验证。扫码完成后，请手动关闭此对话框。
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <div className="grid flex-1 gap-2">
              <QRCodeSVG value={qrCodeUrl} size={240} />
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* Start/End Stream Buttons */}
      <div className="space-y-2">
        {isOpenLive && (
          <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs text-foreground">直播中</span>
          </div>
        )}
      </div>

      {/* Stream Credentials - shown when streaming */}
      {
        isOpenLive && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">流媒体凭证 (RTMP)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">RTMP 地址</Label>
                <div className="flex items-center gap-2">
                  <Input value={rtmpAddress} readOnly className="font-mono text-sm" />
                  <Button variant="secondary" size="icon" onClick={() => handleCopy(rtmpAddress, "rtmp")}>
                    {copiedField === "rtmp" ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">流密钥</Label>
                <div className="flex items-center gap-2">
                  <Input value={streamKey} readOnly className="font-mono text-sm" />
                  <Button variant="secondary" size="icon" onClick={() => handleCopy(streamKey, "key")}>
                    {copiedField === "key" ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      }
    </div >
  )
}
