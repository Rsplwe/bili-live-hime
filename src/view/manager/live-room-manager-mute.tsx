import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { LiveRoomManagerMuteUser } from "@/view/manager/live-room-manager-mute-user";
import { LiveRoomManagerMuteGlobal } from "@/view/manager/live-room-manager-mute-global";

export function LiveRoomManagerMute() {
  const [muteTab, setMuteTab] = useState<"list" | "global">("list");
  return (
    <Tabs value={muteTab} onValueChange={(v) => setMuteTab(v as "list" | "global")}>
      <TabsList className="w-full">
        <TabsTrigger value="list" className="flex-1">
          禁言名单管理
        </TabsTrigger>
        <TabsTrigger value="global" className="flex-1">
          全局禁言
        </TabsTrigger>
      </TabsList>
      <TabsContent value="list" className="space-y-4 mt-4">
        <LiveRoomManagerMuteUser />
      </TabsContent>
      <TabsContent value="global" className="space-y-4 mt-4">
        <LiveRoomManagerMuteGlobal />
      </TabsContent>
    </Tabs>
  );
}
