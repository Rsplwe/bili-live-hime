import { useEffect } from "react";
import { Users, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useWsStore } from "@/store/ws";

export function StatusBar() {
  const {
    //popularity,
    watchedUser,
    connected,
  } = useWsStore((s) => s);

  useEffect(() => {}, []);

  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + "w";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k";
    }
    return num.toString();
  };

  return (
    <div className="h-7 border-t border-border bg-muted/50 px-4 flex items-center justify-between text-xs text-muted-foreground">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          <span>已观看人次:</span>
          <span className="font-medium text-foreground">{formatNumber(watchedUser)}</span>
        </div>
        <Separator orientation="vertical" className="h-3.5" />
        {/* 
        <div className="flex items-center gap-1.5">
          <Flame className="h-3.5 w-3.5 text-orange-500" />
          <span>人气值:</span>
          <span className="font-medium text-foreground">{formatNumber(popularity)}</span>
        </div>*/}
      </div>
      <div className="flex items-center gap-2">
        {connected ? (
          <Badge
            variant="outline"
            className="h-5 gap-1 text-xs font-normal text-green-600 border-green-600/30 bg-green-500/10">
            <Wifi className="h-3 w-3" />
            已连接
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="h-5 gap-1 text-xs font-normal text-destructive border-destructive/30 bg-destructive/10">
            <WifiOff className="h-3 w-3" />
            未连接
          </Badge>
        )}
      </div>
    </div>
  );
}
