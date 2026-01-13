import { useState, useEffect, useRef } from "react"
import { Gift, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useWsStore } from "@/store/ws"
import { type Comment } from "@/types/comment"
import { startWs, stopWs } from "@/ws/wsClient"
import { Input } from "@/components/ui/input"
import { sendComment } from "@/api/live"
import { toast } from "sonner"
import { LoadingButton } from "@/components/ui/loading-button"

export function LiveComments() {
  const [newMessage, setNewMessage] = useState("")
  const [autoScroll, setAutoScroll] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const messages = useWsStore((s) => s.messages)
  const connected = useWsStore((s) => s.connected)

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [messages.length, autoScroll])

  const handleSendMessage = async () => {
    try {
      await sendComment(newMessage)
      setNewMessage("")
    } catch (e: unknown) {
      toast.error((e as Error).message)
    }
  }

  const renderComment = (comment: Comment) => {
    if (comment.type === "enter") {
      return (
        <div key={comment.id} className="text-xs text-muted-foreground py-1 px-2">
          <span className="text-primary">{comment.username}</span> {comment.message}
        </div>
      )
    }

    if (comment.type === "gift") {
      return (
        <div key={comment.id} className="flex items-center gap-2 py-2 px-3 bg-primary/10 rounded-lg my-1">
          <Gift className="w-4 h-4 text-primary" />
          <span className="text-sm">
            <span className="font-medium text-primary">{comment.username}</span>
            <span className="text-muted-foreground"> 送出 </span>
            <span className="font-medium">
              {comment.giftName} x{comment.giftCount}
            </span>
          </span>
        </div>
      )
    }

    return (
      <div key={comment.id} className="flex items-start gap-2 py-1.5 px-2 hover:bg-muted/30 rounded-md">
        <Avatar className="w-6 h-6 mt-0.5">
          <AvatarImage src={comment.avatar || "/placeholder.svg"} />
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
          </div>
          <p className="text-sm text-foreground break-words">{comment.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">直播弹幕</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{messages.length} 条弹幕</Badge>
          <Button variant={autoScroll ? "default" : "outline"} size="sm" onClick={() => setAutoScroll(!autoScroll)}>
            自动滚动 {autoScroll ? "开" : "关"}
          </Button>
          <LoadingButton variant={connected ? "destructive" : "default"} onClickAsync={
            async () => {
              try {
                if (!connected) {
                  await startWs()
                  console.log("连接成功")
                } else {
                  await stopWs()
                }
              } catch {
                alert("连接失败")
              }
            }
          }>{!connected ? "连接" : "断开"}</LoadingButton>
        </div>
      </div>
      <Card>
        <CardContent className="p-0" ref={scrollRef}>
          <ScrollArea className="h-[calc(100vh-300px)] w-full">
            <div className="p-2">
              {messages.map(renderComment)}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Input
          placeholder="发送弹幕"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          className="flex-1"
        />
        <LoadingButton onClickAsync={handleSendMessage} disabled={!newMessage.trim()}>
          <Send className="w-4 h-4 mr-2" />
          发送
        </LoadingButton>
      </div>
    </div>
  )
}
