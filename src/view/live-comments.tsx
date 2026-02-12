import { useState } from "react";
import {
  Gift,
  Send,
  VerticalScrollPointIcon,
  Link,
  Users,
  Sparkles,
  Unlink,
  Message,
  Trophy,
  Medal,
  Award,
  Anchor,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type Comment } from "@/types/comment";
import { Input } from "@/components/ui/input";
import { getContributionRank, sendComment } from "@/api/live";
import { LoadingButton } from "@/components/loading-button";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VirtualScrollArea } from "@/components/virtual-scroll-area";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/spinner";
import { useWsStore } from "@/store/ws";
import { useConfigStore } from "@/store/config";

const intToHexColor = (color: number) =>
  `#${color.toString(16).padStart(6, "0")}`;

export function LiveComments() {
  const [newMessage, setNewMessage] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "superchat" | "audience">(
    "all",
  );
  const {
    data: rank = [],
    // isLoading,
    // isFetching,
    // error,
  } = useQuery({
    queryKey: ["contribution-rank"],
    queryFn: getContributionRank,
    enabled: activeTab === "audience",
    refetchInterval: activeTab === "audience" ? 5000 : false,
    refetchOnWindowFocus: false,
    select: (data) => data.item ?? [],
    staleTime: 0,
  });
  const { connected, connecting, connect, disconnect } = useWsStore((s) => s);
  const superChatComments = useWsStore((s) => s.superChats);
  const regularComments = useWsStore((s) => s.regularMessages);
  const { uid, roomId, roomToken } = useConfigStore((s) => s.config);

  const handleSendMessage = async () => {
    try {
      await sendComment(newMessage);
      setNewMessage("");
    } catch (e: unknown) {
      toast.error((e as Error).message);
    }
  };

  const getAmountBgColor = (amount: number): string => {
    if (amount <= 0) return "";
    if (amount <= 30) return "bg-blue-400";
    if (amount <= 50) return "bg-cyan-700";
    if (amount <= 100) return "bg-yellow-500";
    if (amount <= 500) return "bg-orange-400";
    if (amount <= 1000) return "bg-red-400";
    return "bg-red-600";
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1)
      return (
        <HugeiconsIcon icon={Trophy} className="w-5 h-5 text-yellow-500" />
      );
    if (rank === 2)
      return <HugeiconsIcon icon={Medal} className="w-5 h-5 text-slate-400" />;
    if (rank === 3)
      return <HugeiconsIcon icon={Award} className="w-5 h-5 text-amber-600" />;
    return (
      <span className="w-5 h-5 flex items-center justify-center text-sm text-muted-foreground">
        {rank}
      </span>
    );
  };

  const renderRegularComment = (comment: Comment) => {
    if (comment.type === "enter") {
      return (
        <div
          key={comment.id}
          className="text-xs text-muted-foreground py-1 px-2">
          <span className="text-primary">{comment.username}</span>{" "}
          {comment.message}
        </div>
      );
    }

    if (comment.type === "gift") {
      return (
        <div
          key={comment.id}
          className="flex items-center gap-2 py-2 px-3 bg-primary/10 rounded-lg my-1">
          <HugeiconsIcon icon={Gift} className="text-primary" />
          <span className="text-sm">
            <span className="font-medium text-primary">{comment.username}</span>
            <span className="text-muted-foreground"> 送出 </span>
            <span className="font-medium">
              {comment.giftName} x{comment.giftCount}
            </span>
          </span>
        </div>
      );
    }

    return (
      <div
        key={comment.id}
        className="flex items-start gap-2 py-1.5 px-2 hover:bg-muted/30 rounded-md">
        <Avatar className="w-6 h-6 mt-0.5">
          <AvatarImage src={comment.avatar || "/akarin.webp"} />
          <AvatarFallback className="text-xs">
            {comment.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-primary truncate">
              {comment.username}
            </span>
            {comment.badge && (
              <Badge variant="secondary" className="text-xs py-0 px-1.5 h-4">
                {comment.badge}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              {comment.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <p className="text-sm text-foreground wrap-break-word">
            {comment.message}
          </p>
        </div>
      </div>
    );
  };

  const renderSuperChatComment = (comment: Comment) => {
    const bgColor = getAmountBgColor(comment.amount || 0);
    return (
      <div
        key={comment.id}
        className={`relative overflow-hidden rounded-lg my-2 bg-linear-to-r ${bgColor} p-0.5`}>
        <div className="bg-background/95 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Avatar className="w-6 h-6">
              <AvatarImage src={comment.avatar || "/akarin.webp"} />
              <AvatarFallback className="text-xs">
                {comment.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-bold text-sm">{comment.username}</span>
            <Badge
              className={`bg-linear-to-r ${bgColor} text-white border-0 text-xs`}>
              ¥{comment.amount || 0}
            </Badge>
            <span className="text-xs text-muted-foreground ml-auto">
              {comment.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <p className="text-sm font-medium">{comment.message}</p>
        </div>
      </div>
    );
  };

  const MedalBadge = ({
    medal,
  }: {
    medal: {
      start_color: number;
      end_color: number;
      border_color: number;
      name: string;
      level: number;
      light: number;
    };
  }) => {
    const bgStart = intToHexColor(medal.start_color);
    const bgEnd = intToHexColor(medal.end_color);
    const border_color = intToHexColor(medal.border_color);
    const isLight = medal.light === 1;

    return (
      <div
        className="flex items-center h-4.5 rounded-[6px] border text-[11px] leading-none select-none"
        style={{
          background: `linear-gradient(90deg, ${bgStart}, ${bgEnd})`,
          borderColor: border_color,
          opacity: isLight ? 1 : 0.35,
        }}>
        <span
          className="px-1.5 font-medium whitespace-nowrap"
          style={{ color: "#fff" }}>
          {medal.name}
        </span>
        <span
          className="px-1.5 tabular-nums"
          style={{
            color: "#fff",
            fontWeight: 500,
          }}>
          {medal.level}
        </span>
      </div>
    );
  };

  const TitleBadge = ({
    title,
    color = "#93a7cd",
  }: {
    title: string;
    color?: string;
  }) => {
    return (
      <div
        className="flex items-center h-4.5 rounded-lg px-1.5 text-[10px] whitespace-nowrap select-none"
        style={{
          backgroundColor: `${color}14`,
          border: `1px solid ${color}33`,
          color,
        }}>
        <HugeiconsIcon icon={Anchor} className="w-3.5 h-3.5 mr-1" />
        {title}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-xl">直播弹幕</Label>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{regularComments.length} 条弹幕</Badge>
          <Button
            variant={autoScroll ? "default" : "outline"}
            onClick={() => setAutoScroll(!autoScroll)}>
            <HugeiconsIcon icon={VerticalScrollPointIcon} />
            自动滚动 {autoScroll ? "开" : "关"}
          </Button>
          <Button
            variant={connected ? "default" : "outline"}
            disabled={connecting}
            onClick={async () => {
              if (!connected) {
                await connect(uid, roomId, roomToken);
              } else {
                await disconnect();
              }
            }}>
            {connecting ? (
              <>
                <Spinner />
                处理中
              </>
            ) : (
              <>
                {!connected ? (
                  <>
                    <HugeiconsIcon icon={Link} />
                    连接
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={Unlink} />
                    断开
                  </>
                )}
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) =>
          setActiveTab(v as "all" | "superchat" | "audience")
        }>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="gap-1 text-xs px-2">
            <HugeiconsIcon icon={Message} className="w-3.5 h-3.5" />
            弹幕
            <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-xs">
              {regularComments.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="superchat" className="gap-1 text-xs px-2">
            <HugeiconsIcon icon={Sparkles} className="w-3.5 h-3.5" />
            醒目留言
            <Badge
              variant="secondary"
              className="ml-0.5 h-4 px-1 text-xs bg-linear-to-r from-yellow-500/20 to-orange-500/20">
              {superChatComments.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="audience" className="gap-1 text-xs px-2">
            <HugeiconsIcon icon={Users} className="w-3.5 h-3.5" />
            在线榜
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <div className="h-[calc(100vh-310px)] w-full">
            <VirtualScrollArea
              autoScroll={autoScroll}
              items={regularComments}
              renderItem={(e) => renderRegularComment(e)}
            />
          </div>
        </TabsContent>

        <TabsContent value="superchat" className="mt-4">
          <ScrollArea className="h-[calc(100vh-310px)] w-full rounded-md border">
            <div className="p-2">
              {superChatComments.map(renderSuperChatComment)}
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="audience" className="mt-4">
          <ScrollArea className="h-[calc(100vh-310px)] w-full overflow-auto rounded-md border bg-background">
            <div className="divide-y">
              {rank
                // .sort((a, b) => b.score - a.score)
                .map((user, index) => (
                  <div
                    key={user.rank}
                    className={`flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors ${
                      index < 3
                        ? "bg-linear-to-r from-primary/5 to-transparent"
                        : ""
                    }`}>
                    <div className="w-6 flex items-center justify-center">
                      {getRankIcon(index + 1)}
                    </div>
                    <Avatar className="w-8 h-8 border-2 border-background">
                      <AvatarImage src={user.face || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs">
                        {user.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium truncate">
                          {user.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {user.wealth_level > 0 && (
                          <TitleBadge title={`${user.wealth_level}`} />
                        )}
                        {user.medal_info && (
                          <MedalBadge
                            medal={{
                              start_color: user.medal_info.medal_color_start,
                              end_color: user.medal_info.medal_color_end,
                              border_color: user.medal_info.medal_color_border,
                              name: user.medal_info.medal_name,
                              level: user.medal_info.level,
                              light: user.medal_info.is_light,
                            }}
                          />
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-primary">
                        {user.score}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        贡献值
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <div className="flex gap-2">
        <Input
          placeholder="发送弹幕"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          className="flex-1"
        />
        <LoadingButton
          onClickAsync={handleSendMessage}
          disabled={!newMessage.trim()}>
          <HugeiconsIcon icon={Send} className="mr-2" />
          发送
        </LoadingButton>
      </div>
    </div>
  );
}
