import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserX, CommentBlockIcon, Crown } from "@hugeicons/core-free-icons";
import { LiveRoomManagerAdmins } from "@/view/manager/live-room-manager-admins";
import { LiveRoomManagerMute } from "@/view/manager/live-room-manager-mute";
import { LiveRoomManagerBlockedWords } from "@/view/manager/live-room-manager-blocked-words";
import { HugeiconsIcon } from "@hugeicons/react";

export function LiveRoomManager() {
  const [activeSection, setActiveSection] = useState<
    "admin" | "mute" | "blocked"
  >("admin");

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <Tabs
            value={activeSection}
            onValueChange={(v) => setActiveSection(v as typeof activeSection)}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="admin" className="gap-2">
                <HugeiconsIcon icon={Crown} className="w-4 h-4" />
                房管设置
              </TabsTrigger>
              <TabsTrigger value="mute" className="gap-2">
                <HugeiconsIcon icon={UserX} className="w-4 h-4" />
                禁言设置
              </TabsTrigger>
              <TabsTrigger value="blocked" className="gap-2">
                <HugeiconsIcon icon={CommentBlockIcon} className="w-4 h-4" />
                屏蔽词
              </TabsTrigger>
            </TabsList>
            <TabsContent value="admin" className="space-y-4">
              <LiveRoomManagerAdmins />
            </TabsContent>
            <TabsContent value="mute" className="space-y-4">
              <LiveRoomManagerMute />
            </TabsContent>
            <TabsContent value="blocked" className="space-y-4">
              <LiveRoomManagerBlockedWords />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
