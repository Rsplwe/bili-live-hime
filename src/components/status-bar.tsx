import { Flame, Users, Wifi, WifiOff } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useWsStore } from "@/store/ws";
import { HugeiconsIcon } from "@hugeicons/react";

export function StatusBar() {
  const { onlineCount, watchedUser, connected } = useWsStore((s) => s);

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
          <HugeiconsIcon icon={Flame} className="h-3.5 w-3.5 text-orange-500" />
          <span>已观看人次:</span>
          <span className="font-medium text-foreground">
            {formatNumber(watchedUser)}
          </span>
        </div>
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-1.5">
          <HugeiconsIcon icon={Users} className="h-4 w-4" />
          <span>在线观众:</span>
          <span className="font-medium text-foreground">
            {formatNumber(onlineCount || 0)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className={
            connected
              ? "text-green-600 border-green-600/30 bg-green-500/10"
              : "text-destructive border-destructive/30 bg-destructive/10"
          }>
          {connected ? (
            <>
              <HugeiconsIcon icon={Wifi} />
              已连接
            </>
          ) : (
            <>
              <HugeiconsIcon icon={WifiOff} />
              未连接
            </>
          )}
        </Badge>
      </div>
    </div>
  );
}
