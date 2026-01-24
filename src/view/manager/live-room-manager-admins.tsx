import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { addRoomAdmin, deleteRoomAdmin, getRoomAdmins } from "@/api/live";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { RefreshCw, XCircle, Clock } from "@hugeicons/core-free-icons";

interface Admin {
  uid: number;
  uname: string;
  face: string;
  ctime: string;
}

type Status = "loading" | "error" | "empty" | "success";

export function LiveRoomManagerAdmins() {
  const [state, setState] = useState<Status>("loading");
  //const [totalCount, setTotalCount] = useState(0);
  const [maxCount, setMaxCount] = useState(0);
  const hasFetchedRef = useRef(false);

  const [admins, setAdmins] = useState<Admin[]>([]);
  const [adminInput, setAdminInput] = useState("");

  const [confirmAdminDialog, setConfirmAdminDialog] = useState(false);
  const [revokeAdminDialog, setRevokeAdminDialog] = useState(false);

  const [pendingAddAdmin, setPendingAddAdmin] = useState<string>("");
  const [pendingRevokeAdmin, setPendingRevokeAdmin] = useState<Admin | null>(
    null,
  );

  const fetchAllAdmins = async () => {
    try {
      setState("loading");
      const firstPage = await getRoomAdmins(1);
      //setTotalCount(firstPage.page.total_count);
      setMaxCount(firstPage.max_room_anchors_number);
      const pagePromises = [];
      for (let page = 2; page <= firstPage.page.total_page; page++) {
        pagePromises.push(getRoomAdmins(page));
      }
      const remainingPages = await Promise.all(pagePromises);
      const combinedData = [
        ...(firstPage.data ?? []),
        ...remainingPages.flatMap((p) => p.data ?? []),
      ];
      setAdmins(combinedData);
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
    fetchAllAdmins();
  }, []);

  const handleAppointAdmin = () => {
    if (!adminInput.trim()) return;
    setPendingAddAdmin(adminInput.trim());
    setConfirmAdminDialog(true);
  };

  const confirmAppointAdmin = async () => {
    if (pendingAddAdmin) {
      try {
        await addRoomAdmin(pendingAddAdmin);
        setAdminInput("");
        setPendingAddAdmin("");
      } catch (e) {
        toast.error((e as Error).message);
      }
      await fetchAllAdmins();
    }
    setConfirmAdminDialog(false);
  };

  const handleRevokeAdmin = (admin: Admin) => {
    setPendingRevokeAdmin(admin);
    setRevokeAdminDialog(true);
  };

  const confirmRevokeAdmin = async () => {
    if (revokeAdminDialog && pendingRevokeAdmin) {
      try {
        await deleteRoomAdmin(`${pendingRevokeAdmin.uid}`);
        setPendingRevokeAdmin(null);
      } catch (e) {
        toast.error((e as Error).message);
      }
      await fetchAllAdmins();
    }
    setRevokeAdminDialog(false);
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
            <HugeiconsIcon
              icon={XCircle}
              className="w-6 h-6 text-destructive"
            />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">加载失败</p>
              <p className="text-xs text-muted-foreground">
                网络异常或服务器错误
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={fetchAllAdmins}>
              <HugeiconsIcon icon={RefreshCw} className="w-4 h-4" />
              刷新
            </Button>
          </div>
        );
      case "empty":
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-8">
            <div className="space-y-3">尚未任命房管</div>
          </div>
        );
      case "success":
        return (
          <div className="divide-y">
            {admins.map((admin) => (
              <div
                key={admin.uid}
                className="flex items-center justify-between hover:bg-muted/30 p-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={admin.face || "/akarin.webp"} />
                      <AvatarFallback className="text-xs">
                        {admin.uname.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {admin.uname}{" "}
                      <span className="text-muted-foreground">
                        (UID: {admin.uid})
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <HugeiconsIcon
                        icon={Clock}
                        className="w-3 h-3 inline mr-1"
                      />
                      任命时间：{admin.ctime}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleRevokeAdmin(admin)}>
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
        <Label>任命房管</Label>
        <div className="flex gap-2">
          <Input
            placeholder="输入 UID 或用户名"
            value={adminInput}
            onChange={(e) => setAdminInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAppointAdmin()}
          />
          <Button onClick={handleAppointAdmin} disabled={!adminInput.trim()}>
            任命
          </Button>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>当前房管</Label>
          <Badge variant="secondary">
            当前房管数：{admins.length}/{maxCount}
          </Badge>
        </div>
        <ScrollArea className="h-[calc(100vh-360px)] border rounded-md">
          {content()}
        </ScrollArea>
      </div>
      <AlertDialog
        open={confirmAdminDialog}
        onOpenChange={setConfirmAdminDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>任命房管</AlertDialogTitle>
            <AlertDialogDescription>
              确定任命 <strong>{pendingAddAdmin}</strong>{" "}
              为你的房管吗？房管可禁言用户，设置直播间屏蔽词
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              variant="outline"
              onClick={() => setConfirmAdminDialog(false)}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmAppointAdmin}>
              确定
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={revokeAdminDialog} onOpenChange={setRevokeAdminDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>撤销</AlertDialogTitle>
            <AlertDialogDescription>
              确定撤销{" "}
              <strong>
                {pendingRevokeAdmin?.uname} ({pendingRevokeAdmin?.uid})
              </strong>{" "}
              ？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              variant="outline"
              onClick={() => setRevokeAdminDialog(false)}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmRevokeAdmin}>
              撤销
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
