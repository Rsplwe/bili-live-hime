import { User, Radio, MessageSquare, Settings } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";

type TabType = "account" | "stream" | "comments" | "settings";

const mainTabs = [
  { id: "account" as const, label: "个人信息", icon: User },
  { id: "stream" as const, label: "开播设置", icon: Radio },
  { id: "comments" as const, label: "弹幕", icon: MessageSquare },
];

const bottomTabs = [{ id: "settings" as const, label: "设置", icon: Settings }];

interface AppSidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function AppSidebar({ activeTab, onTabChange }: AppSidebarProps) {
  return (
    <aside className="w-56 h-full shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col">
      <nav className="flex flex-col gap-1 p-2 flex-1">
        {mainTabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "secondary" : "ghost"}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "w-full justify-start gap-3 h-auto py-2.5",
              activeTab === tab.id && "bg-sidebar-accent text-sidebar-accent-foreground",
            )}>
            <HugeiconsIcon icon={tab.icon} />
            {tab.label}
          </Button>
        ))}
      </nav>
      <nav className="flex flex-col gap-1 p-2 border-t border-sidebar-border">
        {bottomTabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "secondary" : "ghost"}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "w-full justify-start gap-3 h-auto py-2.5",
              activeTab === tab.id && "bg-sidebar-accent text-sidebar-accent-foreground",
            )}>
            <HugeiconsIcon icon={tab.icon} />
            {tab.label}
          </Button>
        ))}
      </nav>
    </aside>
  );
}

export type { TabType };
