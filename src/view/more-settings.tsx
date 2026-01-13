import { Sun, Moon, ExternalLink, Bug, FolderGit2Icon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useConfigStore } from "@/store/config";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Button } from "@/components/ui/button";

export function MoreSettings() {
  const theme = useConfigStore.getState().config.theme;
  const updateConfig = useConfigStore((state) => state.updateConfig);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex items-center justify-between py-1">
          <div className="flex items-center gap-3">
            {theme === "dark" ? (
              <Moon className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Sun className="w-5 h-5 text-muted-foreground" />
            )}
            <div>
              <Label htmlFor="notifications" className="cursor-pointer">
                深色模式
              </Label>
              <p className="text-xs text-muted-foreground">顾名思义（</p>
            </div>
          </div>
          <Switch
            id="notifications"
            checked={theme === "dark"}
            onCheckedChange={(checked) => updateConfig({ theme: checked ? "dark" : "light" })}
          />
        </CardContent>
      </Card>
      <div className="space-y-1">
        <Button
          variant="ghost"
          className="w-full justify-between h-auto py-3"
          onClick={() => {
            openUrl("https://github.com/Rsplwe/bili-live-hime/issues");
          }}>
          <div className="flex items-center gap-3">
            <Bug className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm">报告错误</span>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground" />
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-between h-auto py-3"
          onClick={() => {
            openUrl("https://github.com/Rsplwe/bili-live-hime");
          }}>
          <div className="flex items-center gap-3">
            <FolderGit2Icon className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm">项目主页</span>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground" />
        </Button>
      </div>

      <Separator />
      <div className="text-center space-y-1">
        <p className="text-xs text-muted-foreground pb-2">
          本项目为<b>非官方实现</b>，与哔哩哔哩官方无任何关联
        </p>
        <p className="text-xs text-muted-foreground">哔哩哔哩直播姬（仮）</p>
        <p className="text-xs text-muted-foreground">Created by Rsplwe</p>
      </div>
    </div>
  );
}
