import { Label } from "@/components/ui/label";
import { useEffect, useRef, useState } from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getRoomSilent, setRoomSilent, type RoomSilentType } from "@/api/live";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { LoadingButton } from "@/components/loading-button";
import { Spinner } from "@/components/ui/spinner";
import { HugeiconsIcon } from "@hugeicons/react";
import { RefreshCw, XCircle, Clock } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { useCountdown } from "@/utils/countdown";

interface GlobalMuteSettings {
  type: RoomSilentType;
  wealthLevel: number;
  medalLevel: number;
  duration: "30min" | "60min" | "permanent";
}

type Status = "loading" | "error" | "success";

export function LiveRoomManagerMuteGlobal() {
  const hasFetchedRef = useRef(false);
  const [state, setState] = useState<Status>("loading");
  const [enabled, setEnabled] = useState<boolean>(false);
  const [globalMute, setGlobalMute] = useState<GlobalMuteSettings>({
    type: "off",
    wealthLevel: 1,
    medalLevel: 1,
    duration: "30min",
  });

  const countdown = useCountdown(0, () => {
    setEnabled(true);
  });

  const format = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const fetchRoomSilentConfig = async () => {
    try {
      setState("loading");
      const config = await getRoomSilent();
      setGlobalMute({
        type: config.type === "" ? "off" : config.type,
        wealthLevel: config.type === "wealth" ? config.level : 1,
        medalLevel: config.type === "medal" ? config.level : 1,
        duration: "30min",
      });
      setEnabled(config.type === "");
      if (config.type !== "off") {
        countdown.reset();
        countdown.setTimeLeft(config.second);
        countdown.start();
      }
      setState("success");
    } catch (e) {
      setState("error");
      toast.error((e as Error).message);
    }
  };

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    fetchRoomSilentConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplySilent = async () => {
    try {
      let level = 1;
      let duration = 0;
      if (globalMute.type === "wealth") {
        level = globalMute.wealthLevel;
      } else if (globalMute.type === "medal") {
        level = globalMute.medalLevel;
      }
      if (globalMute.duration === "30min") {
        duration = 30;
      } else if (globalMute.duration === "60min") {
        duration = 60;
      } else if (globalMute.duration === "permanent") {
        duration = 0;
      }
      await setRoomSilent(globalMute.type, level, duration);
      //setRemaining(duration * 60);
      countdown.reset();
      countdown.setTimeLeft(duration * 60);
      countdown.start();
      setEnabled(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleCancelSilent = async () => {
    try {
      await setRoomSilent("off");
      countdown.reset();
      setEnabled(true);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const content = () => {
    switch (state) {
      case "loading":
        return (
          <div className="h-full flex items-center justify-center p-8">
            <Spinner />
            <Label>加载中...</Label>
          </div>
        );
      case "error":
        return (
          <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
            <HugeiconsIcon icon={XCircle} className="w-6 h-6 text-destructive" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">加载失败</p>
              <p className="text-xs text-muted-foreground">网络异常或服务器错误</p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={fetchRoomSilentConfig}>
              <HugeiconsIcon icon={RefreshCw} className="w-4 h-4" />
              刷新
            </Button>
          </div>
        );
      case "success":
        return (
          <div className="space-y-4">
            <Label>全局禁言规则</Label>
            <div className="space-y-3 border rounded-md p-4">
              <div
                className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${globalMute.type === "wealth" ? "bg-primary/10 border border-primary" : "hover:bg-muted"}`}
                onClick={() => setGlobalMute({ ...globalMute, type: "wealth" })}>
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${globalMute.type === "wealth" ? "border-primary" : "border-muted-foreground"}`}>
                  {globalMute.type === "wealth" && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <span className="text-sm">荣耀等级</span>
              </div>
              {globalMute.type === "wealth" && (
                <div className="space-y-2 pl-10 pr-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">阈值</span>
                    <span className="font-medium">{globalMute.wealthLevel} 以下（不包含该等级）</span>
                  </div>
                  <Slider
                    value={[globalMute.wealthLevel]}
                    onValueChange={(v) => setGlobalMute({ ...globalMute, wealthLevel: v[0] })}
                    min={1}
                    max={80}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1</span>
                    <span>40</span>
                    <span>80</span>
                  </div>
                </div>
              )}
              <div
                className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${globalMute.type === "medal" ? "bg-primary/10 border border-primary" : "hover:bg-muted"}`}
                onClick={() => setGlobalMute({ ...globalMute, type: "medal" })}>
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${globalMute.type === "medal" ? "border-primary" : "border-muted-foreground"}`}>
                  {globalMute.type === "medal" && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <span className="text-sm">粉丝勋章</span>
              </div>
              {globalMute.type === "medal" && (
                <div className="space-y-2 pl-10 pr-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">阈值</span>
                    <span className="font-medium">{globalMute.medalLevel} 以下</span>
                  </div>
                  <Slider
                    value={[globalMute.medalLevel]}
                    onValueChange={(v) => setGlobalMute({ ...globalMute, medalLevel: v[0] })}
                    min={1}
                    max={120}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1</span>
                    <span>60</span>
                    <span>120</span>
                  </div>
                </div>
              )}
              <div
                className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${globalMute.type === "member" ? "bg-destructive/10 border border-destructive" : "hover:bg-muted"}`}
                onClick={() => setGlobalMute({ ...globalMute, type: "member" })}>
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${globalMute.type === "member" ? "border-destructive" : "border-muted-foreground"}`}>
                  {globalMute.type === "member" && <div className="w-2 h-2 rounded-full bg-destructive" />}
                </div>
                <span className="text-sm">全员</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>禁言时间</Label>
              <Select
                value={globalMute.duration}
                onValueChange={(v) => setGlobalMute({ ...globalMute, duration: v as typeof globalMute.duration })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="30min">30 分钟</SelectItem>
                    <SelectItem value="60min">60 分钟</SelectItem>
                    <SelectItem value="permanent">永久</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            {!enabled ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-destructive/10 border border-destructive rounded-md">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-destructive">禁言已开启，剩余时长</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={Clock} className="w-4 h-4 text-destructive" />
                    <span className="text-sm font-bold text-destructive">
                      {globalMute.duration === "permanent" ? "永久" : format(countdown.timeLeft)}
                    </span>
                  </div>
                </div>
                <LoadingButton className="w-full" variant="destructive" onClickAsync={handleCancelSilent}>
                  取消禁言
                </LoadingButton>
              </div>
            ) : (
              <LoadingButton className="w-full" disabled={globalMute.type === "off"} onClickAsync={handleApplySilent}>
                开始禁言
              </LoadingButton>
            )}
          </div>
        );
    }
  };
  return content();
}
