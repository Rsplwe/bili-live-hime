import { LogOut, Copy, Check } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useConfigStore } from "@/store/config";
import { HugeiconsIcon } from "@hugeicons/react";

interface UserProfileProps {
  onLogout: () => void;
}

export function UserProfile({ onLogout }: UserProfileProps) {
  const [copied, setCopied] = useState(false);
  const [copied2, setCopied2] = useState(false);
  const avatar = useConfigStore((state) => state.config.avatar);
  const username = useConfigStore((state) => state.config.username);
  const uid = useConfigStore((state) => state.config.uid);
  const roomId = useConfigStore((state) => state.config.roomId);
  // const avatar = "/akarin.webp"
  // const username = "あかり"
  // const uid = "0"
  // const roomId = "0"

  const handleCopyUid = async () => {
    await navigator.clipboard.writeText(String(uid));
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  const handleCopyRoomId = async () => {
    await navigator.clipboard.writeText(String(roomId));
    setCopied2(true);
    setTimeout(() => setCopied2(false), 1000);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 pt-6">
          <Avatar className="w-20 h-20 border">
            <AvatarImage src={avatar || "/akarin.webp"} alt={username ? username : "user"} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
              {(username ? username : "user").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground">{username ? username : "user"}</h3>
            <p className="text-sm text-muted-foreground">已登入</p>
          </div>
        </CardContent>
      </Card>

      <div className="p-3 bg-muted rounded-lg">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">User ID</span>
          <Button variant="link" size="sm" onClick={handleCopyUid} className="h-auto p-0 text-xs">
            {copied ? (
              <>
                <HugeiconsIcon icon={Check} className="mr-1" />
                已复制
              </>
            ) : (
              <>
                <HugeiconsIcon icon={Copy} className="mr-1" />
                复制
              </>
            )}
          </Button>
        </div>
        <p className="font-mono text-sm text-foreground">{uid}</p>
      </div>

      <div className="p-3 bg-muted rounded-lg">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">直播间 ID</span>
          <Button variant="link" size="sm" onClick={handleCopyRoomId} className="h-auto p-0 text-xs">
            {copied2 ? (
              <>
                <HugeiconsIcon icon={Check} className="mr-1" />
                已复制
              </>
            ) : (
              <>
                <HugeiconsIcon icon={Copy} className="mr-1" />
                复制
              </>
            )}
          </Button>
        </div>
        <p className="font-mono text-sm text-foreground">{roomId}</p>
      </div>

      <Button variant="destructive" onClick={onLogout} className="w-full">
        <HugeiconsIcon icon={LogOut} className="mr-1" />
        登出
      </Button>
    </div>
  );
}
