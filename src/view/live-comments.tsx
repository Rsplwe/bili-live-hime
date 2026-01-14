import { useState, useEffect, useRef } from "react";
import { Gift, Send, VerticalScrollPointIcon, Link, Unlink } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWsStore } from "@/store/ws";
import { type Comment } from "@/types/comment";
import { startWs, stopWs } from "@/ws/ws-client";
import { Input } from "@/components/ui/input";
import { sendComment } from "@/api/live";
import { LoadingButton } from "@/components/ui/loading-button";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function LiveComments() {
  const [newMessage, setNewMessage] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "superchat">("all");

  const regularScrollRef = useRef<HTMLDivElement>(null);
  const connected = useWsStore((s) => s.connected);
  const superChatComments = useWsStore((s) => s.superChats);
  const regularComments = useWsStore((s) => s.regularMessages);

  useEffect(() => {
    if (autoScroll && regularScrollRef.current) {
      const viewport = regularScrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (viewport) {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: "smooth",
        });
      }
    }
  }, [regularComments.length, autoScroll]);

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

  const renderRegularComment = (comment: Comment) => {
    if (comment.type === "enter") {
      return (
        <div key={comment.id} className="text-xs text-muted-foreground py-1 px-2">
          <span className="text-primary">{comment.username}</span> {comment.message}
        </div>
      );
    }

    if (comment.type === "gift") {
      return (
        <div key={comment.id} className="flex items-center gap-2 py-2 px-3 bg-primary/10 rounded-lg my-1">
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
      <div key={comment.id} className="flex items-start gap-2 py-1.5 px-2 hover:bg-muted/30 rounded-md">
        <Avatar className="w-6 h-6 mt-0.5">
          <AvatarImage src={comment.avatar || "/akarin.webp"} />
          <AvatarFallback className="text-xs">{comment.username.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-primary truncate">{comment.username}</span>
            {comment.badge && (
              <Badge variant="secondary" className="text-xs py-0 px-1.5 h-4">
                {comment.badge}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              {comment.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <p className="text-sm text-foreground wrap-break-word">{comment.message}</p>
        </div>
      </div>
    );
  };

  const renderSuperChatComment = (comment: Comment) => {
    const bgColor = getAmountBgColor(comment.amount || 0);
    return (
      <div key={comment.id} className={`relative overflow-hidden rounded-lg my-2 bg-linear-to-r ${bgColor} p-0.5`}>
        <div className="bg-background/95 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Avatar className="w-6 h-6">
              <AvatarImage src={comment.avatar || "/akarin.webp"} />
              <AvatarFallback className="text-xs">{comment.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="font-bold text-sm">{comment.username}</span>
            <Badge className={`bg-linear-to-r ${bgColor} text-white border-0 text-xs`}>¥{comment.amount || 0}</Badge>
            <span className="text-xs text-muted-foreground ml-auto">
              {comment.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <p className="text-sm font-medium">{comment.message}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-xl">直播弹幕</Label>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{regularComments.length} 条弹幕</Badge>
          <Button variant={autoScroll ? "default" : "outline"} onClick={() => setAutoScroll(!autoScroll)}>
            <HugeiconsIcon icon={VerticalScrollPointIcon} />
            自动滚动 {autoScroll ? "开" : "关"}
          </Button>
          <LoadingButton
            variant={connected ? "default" : "outline"}
            onClickAsync={async () => {
              try {
                if (!connected) {
                  await startWs();
                  console.log("连接成功");
                } else {
                  await stopWs();
                }
              } catch {
                alert("连接失败");
              }
            }}>
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
          </LoadingButton>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "superchat")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all" className="gap-2">
            全部弹幕
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
              {regularComments.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="superchat" className="gap-2">
            醒目留言
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-linear-to-r from-yellow-500/20 to-orange-500/20">
              {superChatComments.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <Card>
            <CardContent className="p-0" ref={regularScrollRef}>
              <ScrollArea className="h-[calc(100vh-360px)] w-full">
                <div className="p-2">{regularComments.map(renderRegularComment)}</div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="superchat" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-360px)]">
                <div className="p-2">{superChatComments.map(renderSuperChatComment)}</div>
              </ScrollArea>
            </CardContent>
          </Card>
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
        <LoadingButton onClickAsync={handleSendMessage} disabled={!newMessage.trim()}>
          <HugeiconsIcon icon={Send} className="mr-2" />
          发送
        </LoadingButton>
      </div>
    </div>
  );
}
