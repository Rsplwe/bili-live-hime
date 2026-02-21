import { useState, useEffect } from "react";
import { Plug, AlertCircle } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { useConfigStore } from "@/store/config";
import {
  connectToOBS,
  disconnectOBS,
  isOBSConnected,
} from "@/lib/obs-manager";

export function OBSSettings() {
  const [obsConnected, setObsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const { config, updateConfig } = useConfigStore();
  const obsConfig = config.obsConfig;

  useEffect(() => {
    // 检查 OBS 连接状态
    setObsConnected(isOBSConnected());
  }, []);

  const handleConnectOBS = async () => {
    setIsConnecting(true);
    try {
      await connectToOBS({
        address: obsConfig.address,
        password: obsConfig.password || undefined,
      });
      setObsConnected(true);
      toast.success("OBS 连接成功");
    } catch (error) {
      setObsConnected(false);
      toast.error((error as Error).message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectOBS = async () => {
    try {
      await disconnectOBS();
      setObsConnected(false);
      toast.success("OBS 已断开连接");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const updateObsConfig = (updates: Partial<typeof obsConfig>) => {
    updateConfig({
      obsConfig: { ...obsConfig, ...updates },
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={Plug} className="w-5 h-5" />
            OBS 设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
            <span
              className={`w-2 h-2 rounded-full ${
                obsConnected
                  ? "bg-green-500 animate-pulse"
                  : "bg-gray-400"
              }`}
            />
            <span className="text-sm text-muted-foreground">
              {obsConnected ? "OBS 已连接" : "OBS 未连接"}
            </span>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="obs-address" className="text-xs text-muted-foreground">
                OBS WebSocket 地址
              </Label>
              <Input
                id="obs-address"
                value={obsConfig.address}
                onChange={(e) => updateObsConfig({ address: e.target.value })}
                placeholder="ws://localhost:4455"
                disabled={obsConnected}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="obs-password" className="text-xs text-muted-foreground">
                OBS WebSocket 密码（可选）
              </Label>
              <Input
                id="obs-password"
                type="password"
                value={obsConfig.password || ""}
                onChange={(e) =>
                  updateObsConfig({ password: e.target.value })
                }
                placeholder="如果设置了密码请填写"
                disabled={obsConnected}
                className="font-mono text-xs"
              />
            </div>

            <div className="flex gap-2">
              {!obsConnected ? (
                <Button
                  variant="outline"
                  onClick={handleConnectOBS}
                  disabled={isConnecting}
                  className="w-full">
                  <HugeiconsIcon icon={Plug} className="mr-2 w-4 h-4" />
                  {isConnecting ? "连接中..." : "连接 OBS"}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleDisconnectOBS}
                  className="w-full">
                  断开连接
                </Button>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">启动时自动连接 OBS</Label>
                <p className="text-xs text-muted-foreground">
                  打开软件时自动连接到 OBS
                </p>
              </div>
              <Switch
                checked={obsConfig.autoConnect}
                onCheckedChange={(checked) =>
                  updateObsConfig({ autoConnect: checked })
                }
                disabled={obsConnected}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">自动更新推流设置</Label>
                <p className="text-xs text-muted-foreground">
                  开播时自动将推流配置同步到 OBS
                </p>
              </div>
              <Switch
                checked={obsConfig.autoUpdateSettings}
                onCheckedChange={(checked) =>
                  updateObsConfig({ autoUpdateSettings: checked })
                }
                disabled={obsConnected}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">自动开始/停止推流</Label>
                <p className="text-xs text-muted-foreground">
                  开播/停播时自动控制 OBS 推流状态
                </p>
              </div>
              <Switch
                checked={obsConfig.autoStartStopStreaming}
                onCheckedChange={(checked) =>
                  updateObsConfig({ autoStartStopStreaming: checked })
                }
                disabled={obsConnected}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <HugeiconsIcon icon={AlertCircle} className="w-4 h-4" />
            注意事项
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• OBS 需要安装并启用 WebSocket 插件</p>
          <p>• 默认端口为 4455，可在 OBS 工具菜单中配置</p>
          <p>• 连接 OBS 后停止直播不会断开 OBS 连接</p>
          <p>• 配置会自动保存到本地</p>
        </CardContent>
      </Card>
    </div>
  );
}
