import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
// import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { addSilentUser, deleteSilentUser, getSilentUserList, searchUsers } from "@/api/live";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserSelectDialog, type UserSelectItem } from "@/components/user-select-dialog";
import { LoadingButton } from "@/components/loading-button";
import { Spinner } from "@/components/ui/spinner";
import { HugeiconsIcon } from "@hugeicons/react";
import { RefreshCw, XCircle, Calendar, Clock, UserX } from "@hugeicons/core-free-icons";

interface MutedUser {
  tuid: number; // 被封禁用户 UID
  tname: string; // 被封禁用户昵称
  uid: number; // 操作者 UID
  name: string; // 操作者昵称
  ctime: string;
  face: string;
  block_end_time: string;
}

type Status = "loading" | "error" | "empty" | "success";

// 目前无论传入何种值，结束时长均为永久。
/* export type MuteDurationKey =
  | "CURRENT"
  | "PERMANENT"
  | "HOUR_1"
  | "HOUR_6"
  | "HOUR_12"
  | "HOUR_24"
  | "HOUR_48"
  | "HOUR_72"
  | "HOUR_168";
const MUTE_DURATIONS: Record<MuteDurationKey, { label: string; hours: number }> = {
  CURRENT: { label: "仅本场直播", hours: 0 },
  PERMANENT: { label: "永久", hours: -1 },
  HOUR_1: { label: "1 小时", hours: 1 },
  HOUR_6: { label: "6 小时", hours: 6 },
  HOUR_12: { label: "12 小时", hours: 12 },
  HOUR_24: { label: "24 小时", hours: 24 },
  HOUR_48: { label: "48 小时", hours: 48 },
  HOUR_72: { label: "72 小时", hours: 72 },
  HOUR_168: { label: "168 小时", hours: 168 },
};*/

export function LiveRoomManagerMuteUser() {
  const [state, setState] = useState<Status>("loading");
  const hasFetchedRef = useRef(false);

  const [openUserSelectDialog, setOpenUserSelectDialog] = useState(false);
  const [pendingUserList, setPendingUserList] = useState<UserSelectItem[]>([]);
  const [mutedUsers, setMutedUsers] = useState<MutedUser[]>([]);
  const [muteInput, setMuteInput] = useState("");
  // const [muteDuration, setMuteDuration] = useState<MuteDurationKey>("CURRENT");
  const [pendingMute, setPendingMute] = useState<{ id: string; username: string } | null>(null);
  const [confirmMuteDialog, setConfirmMuteDialog] = useState(false);

  const [revokeMuteUser, setRevokeMuteUser] = useState<MutedUser | null>(null);
  const [revokeMuteUserDialog, setRevokeMuteDialog] = useState(false);

  const fetchAllMutedUsers = async () => {
    try {
      setState("loading");
      const firstPage = await getSilentUserList(1);
      const pagePromises = [];
      for (let page = 2; page <= firstPage.total_page; page++) {
        pagePromises.push(getSilentUserList(page));
      }
      const remainingPages = await Promise.all(pagePromises);
      const combinedData = [...(firstPage.data ?? []), ...remainingPages.flatMap((p) => p.data ?? [])];
      setMutedUsers(combinedData);
      if (combinedData.length > 0) {
        setState("success");
      } else {
        setState("empty");
      }
    } catch (e) {
      setState("error");
      toast.error((e as Error).message);
    }
  };

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAllMutedUsers();
  }, []);

  const confirmMuteUser = async () => {
    if (pendingMute) {
      try {
        // await addSilentUser(pendingMute.id, String(MUTE_DURATIONS[muteDuration].hours));
        await addSilentUser(pendingMute.id, String(-1));
        setMuteInput("");
        setPendingMute(null);
      } catch (e) {
        toast.error((e as Error).message);
      }
      await fetchAllMutedUsers();
    }
    setConfirmMuteDialog(false);
  };

  const handleRevokeMute = (user: MutedUser) => {
    setRevokeMuteUser(user);
    setRevokeMuteDialog(true);
  };

  const confirmRevokeMute = async () => {
    if (revokeMuteUser) {
      try {
        await deleteSilentUser(String(revokeMuteUser.tuid));
        setMuteInput("");
        setPendingMute(null);
      } catch (e) {
        toast.error((e as Error).message);
      }
      await fetchAllMutedUsers();
    }
    setRevokeMuteDialog(false);
  };

  const handleMuteUser = async () => {
    const keyword = muteInput.trim();
    if (!keyword) return;
    try {
      const { items } = await searchUsers(keyword);
      const list: UserSelectItem[] = items.map((user) => ({
        name: user.uname,
        id: String(user.uid),
        avatar: user.face,
      }));
      setPendingUserList(list);
      setOpenUserSelectDialog(true);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const content = () => {
    switch (state) {
      case "loading":
        return (
          <div className="h-full flex items-center justify-center p-8">
            <Spinner />
            <Label>加载中...</Label>
          </div>
        );
      case "error":
        return (
          <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
            <HugeiconsIcon icon={XCircle} className="w-6 h-6 text-destructive" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">加载失败</p>
              <p className="text-xs text-muted-foreground">网络异常或服务器错误</p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={fetchAllMutedUsers}>
              <HugeiconsIcon icon={RefreshCw} className="w-4 h-4" />
              刷新
            </Button>
          </div>
        );
      case "empty":
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-8">
            <div className="space-y-3">尚未有已禁言的用户</div>
          </div>
        );
      case "success":
        return (
          <div className="divide-y">
            {mutedUsers.map((user) => (
              <div key={user.tuid} className="flex items-center justify-between hover:bg-muted/30 p-3 gap-4">
                <div className="flex items-start gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.face || "/akarin.webp"} />
                    <AvatarFallback className="text-xs">{user.tname.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-0.5">
                    <p className="font-medium text-sm">
                      {user.tname} <span className="text-muted-foreground">(UID: {user.tuid})</span>
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <HugeiconsIcon icon={Clock} className="w-3 h-3 mr-1" />
                      禁言至 {user.block_end_time}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <HugeiconsIcon icon={UserX} className="w-3 h-3" />
                      {user.name}
                      <span className="mx-1">·</span>
                      <HugeiconsIcon icon={Calendar} className="w-3 h-3" />
                      {user.ctime}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleRevokeMute(user)}>
                  撤销
                </Button>
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <>
      <div className="space-y-3">
        <Label>禁言用户</Label>
        <div className="flex gap-2">
          <Input
            placeholder="输入 UID 或用户名"
            value={muteInput}
            onChange={(e) => setMuteInput(e.target.value)}
            className="flex-1"
          />
          {/* 保留实现
          <Select value={muteDuration} onValueChange={(v) => setMuteDuration(v as MuteDurationKey)}>
            <SelectTrigger className="w-30">
              <SelectValue placeholder="选择禁言时间" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {Object.entries(MUTE_DURATIONS).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          */}
          <LoadingButton onClickAsync={handleMuteUser} disabled={!muteInput.trim()}>
            禁言
          </LoadingButton>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>已禁言用户</Label>
        </div>
        <ScrollArea className="h-[calc(100vh-420px)] border rounded-md">{content()}</ScrollArea>
      </div>

      <UserSelectDialog
        open={openUserSelectDialog}
        onOpenChange={setOpenUserSelectDialog}
        users={pendingUserList}
        onConfirm={(user) => {
          setPendingMute({
            id: user.id,
            username: user.name,
          });
          setConfirmMuteDialog(true);
        }}
      />
      <AlertDialog open={confirmMuteDialog} onOpenChange={setConfirmMuteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认禁言</AlertDialogTitle>
            <AlertDialogDescription>
              确认要禁言用户{" "}
              <strong>
                {pendingMute?.username} (UID: {pendingMute?.id})
              </strong>{" "}
              吗？
              {/*
              <br />
              禁言时长： <strong>{MUTE_DURATIONS[muteDuration].label}</strong>
              */}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmMuteUser}>确认</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={revokeMuteUserDialog} onOpenChange={setRevokeMuteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>撤销禁言</AlertDialogTitle>
            <AlertDialogDescription>
              是否确认撤销{" "}
              <strong>
                {revokeMuteUser?.tname} (UID: {revokeMuteUser?.tuid})
              </strong>{" "}
              的禁言?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRevokeMute}>确认</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
