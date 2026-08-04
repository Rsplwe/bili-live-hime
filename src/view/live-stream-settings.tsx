import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Play, Square, Copy, Check, RefreshIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useConfigStore } from "@/store/config";
import type { Area, Stream } from "@/types/config";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { LoadingButton } from "@/components/loading-button";
import {
  getLiveVersion,
  startLive,
  stopLive,
  updateRoomArea,
  updateRoomTitle,
} from "@/api/live";
import {
  getCoverHistory,
  getPreLiveInfo,
  type CoverHistoryItem,
  type PreLiveInfo,
} from "@/api/cover";
import { CoverDialog } from "@/view/cover-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HugeiconsIcon } from "@hugeicons/react";

type AuditChipTone = "success" | "warning" | "danger" | "neutral";

interface AuditChip {
  key: string;
  text: string;
  tone: AuditChipTone;
  reason?: string;
}

const CHIP_TONE_CLASS: Record<AuditChipTone, string> = {
  success: "bg-green-600",
  warning: "bg-yellow-500",
  danger: "bg-red-600",
  neutral: "bg-muted-foreground",
};

// Poll interval for audit status while the cover or the title is auditing.
const AUDIT_POLL_INTERVAL_MS = 15000;

export function LiveStreamSettings() {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isQrDialogOpen, setIsQrDialogOpen] = useState<boolean>(false);
  const [preLiveInfo, setPreLiveInfo] = useState<PreLiveInfo | null>(null);
  const [coverHistory, setCoverHistory] = useState<CoverHistoryItem[]>([]);
  const [isCoverDialogOpen, setIsCoverDialogOpen] = useState<boolean>(false);

  const updateConfig = useConfigStore((s) => s.updateConfig);
  const areaList = useConfigStore((s) => s.config.areaList);
  const uid = useConfigStore((state) => state.config.uid);
  const { roomTitle, categoryId, areaId, isOpenLive, streams } =
    useConfigStore((s) => s.config);

  const selectedParent = useMemo(
    () => areaList.find((p) => p.id === categoryId),
    [areaList, categoryId],
  );
  const childAreas: Area[] = useMemo(
    () => selectedParent?.list ?? [],
    [selectedParent],
  );
  const isTitleValid = roomTitle.trim() !== "";
  const isCategoryValid = categoryId !== "";
  const isAreaValid = areaId !== "";

  const canStartStream =
    !isOpenLive && isTitleValid && isCategoryValid && isAreaValid;

  const coverUrl = preLiveInfo?.cover?.url ?? "";

  const auditChips = useMemo<AuditChip[]>(() => {
    const chips: AuditChip[] = [];
    let coverOk = false;
    let titleOk = false;
    let hasCover = false;
    if (preLiveInfo) {
      const cover = preLiveInfo.cover;
      if (cover && cover.url) {
        hasCover = true;
        switch (cover.auditStatus) {
          case 0:
            chips.push({
              key: "cover-auditing",
              text: "封面审核中",
              tone: "warning",
            });
            break;
          case 1:
            coverOk = true;
            break;
          case -1:
            chips.push({
              key: "cover-rejected",
              text: "封面审核失败",
              tone: "danger",
              reason: cover.auditReason,
            });
            break;
          default:
            chips.push({
              key: "cover-unknown",
              text: "封面审核状态未知",
              tone: "neutral",
            });
        }
      }
      const titleStatus = preLiveInfo.audit_info?.audit_title_status;
      switch (titleStatus) {
        case 0:
          titleOk = true;
          break;
        case 1:
          chips.push({
            key: "title-auditing",
            text: "标题审核中",
            tone: "warning",
          });
          break;
        case 2:
          titleOk = true;
          break;
        default:
          chips.push({
            key: "title-unknown",
            text: "标题审核状态未知",
            tone: "neutral",
            reason: preLiveInfo.audit_info?.audit_title_reason,
          });
      }
    }
    const hasIssue = chips.some(
      (c) =>
        c.tone === "warning" || c.tone === "danger" || c.tone === "neutral",
    );
    if (!hasIssue && titleOk && (!hasCover || coverOk)) {
      chips.unshift({ key: "approved", text: "审核通过", tone: "success" });
    }
    return chips;
  }, [preLiveInfo]);

  const loadPreLiveInfo = useCallback(async () => {
    try {
      const info = await getPreLiveInfo();
      setPreLiveInfo(info);
    } catch (error) {
      console.error("Get PreLive Info:", error);
    }
  }, []);

  const loadCoverHistory = useCallback(async () => {
    try {
      const history = await getCoverHistory();
      setCoverHistory(history.cover_history ?? []);
    } catch (error) {
      console.error("Get Cover History:", error);
    }
  }, []);

  useEffect(() => {
    void loadPreLiveInfo();
    void loadCoverHistory();
  }, [loadPreLiveInfo, loadCoverHistory]);

  // Poll the audit status every 15s while the cover or the title is auditing.
  // Stops when neither is auditing anymore, or when the component unmounts
  // (e.g. the user leaves the live stream settings page).
  const shouldPollAudit = useMemo(() => {
    if (!preLiveInfo) return false;
    return (
      preLiveInfo.cover?.auditStatus === 0 ||
      preLiveInfo.audit_info?.audit_title_status === 1
    );
  }, [preLiveInfo]);

  useEffect(() => {
    if (!shouldPollAudit) return;
    const timer = setInterval(() => {
      void loadPreLiveInfo();
    }, AUDIT_POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [shouldPollAudit, loadPreLiveInfo]);

  const setIsStreaming = useCallback(
    (status: boolean) => {
      updateConfig({ isOpenLive: status });
    },
    [updateConfig],
  );

  const StreamCredentials = memo(({ streams }: { streams: Stream[] }) => {
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const handleCopy = useCallback(async (text: string, field: string) => {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }, []);
    return (
      <Card>
        <CardContent className="space-y-3">
          <div className="text-sm">流媒体凭证</div>
          <Tabs defaultValue="rtmp-1" className="w-full">
            <TabsList className="mb-4 w-full">
              {streams.map((stream) => (
                <TabsTrigger key={stream.type} value={stream.type}>
                  {stream.type.toUpperCase()}
                </TabsTrigger>
              ))}
            </TabsList>
            {streams.map((stream) => (
              <TabsContent
                key={stream.type}
                value={stream.type}
                className="mt-0 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    服务器地址
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={stream.address}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => handleCopy(stream.address, stream.type)}>
                      {copiedField === stream.type ? (
                        <HugeiconsIcon
                          icon={Check}
                          className="h-4 w-4 text-primary"
                        />
                      ) : (
                        <HugeiconsIcon icon={Copy} className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    流密钥
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={stream.key}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() =>
                        handleCopy(stream.key, `${stream.type}-key`)
                      }>
                      {copiedField === `${stream.type}-key` ? (
                        <HugeiconsIcon
                          icon={Check}
                          className="h-4 w-4 text-primary"
                        />
                      ) : (
                        <HugeiconsIcon icon={Copy} className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    );
  });

  const handleStartStream = async () => {
    if (!canStartStream) return;
    try {
      const version = await getLiveVersion();
      const currentVer = version.curr_version;
      const currentBuild = String(version.build);

      // set title
      await handleUpdateTitle();

      // 开始直播请求
      const startRes = await startLive(currentVer, currentBuild);
      switch (startRes.code) {
        case 60024:
          // 需要二维码验证
          setQrCodeUrl(startRes.data.qr);
          setIsQrDialogOpen(true);
          setIsStreaming(false);
          return;
        case 60043:
          setQrCodeUrl(
            `https://www.bilibili.com/blackboard/live/face-auth-middle.html?source_event=400&mid=${uid}`,
          );
          setIsQrDialogOpen(true);
          setIsStreaming(false);
          return;
        case 0: {
          // 成功
          let rtmp = 1;
          let srt = 0;
          const result: Stream[] = [];
          result.push({
            type: "rtmp-1",
            address: startRes.data.rtmp.addr,
            key: startRes.data.rtmp.code,
          });
          startRes.data.protocols.forEach((v) => {
            if (v.protocol === "rtmp" && v.addr && v.code) {
              rtmp++;
              result.push({
                type: `rtmp-${rtmp}`,
                address: v.addr,
                key: v.code,
              });
            }
            if (v.protocol === "srt" && v.addr && v.code) {
              srt++;
              result.push({
                type: `srt-${srt}`,
                address: v.addr,
                key: v.code,
              });
            }
          });
          result.sort((a, b) => a.type.localeCompare(b.type));
          updateConfig({ streams: result });
          break;
        }
        default:
          throw new Error("开始直播失败：" + startRes.message);
      }
      setIsStreaming(true);
    } catch (error) {
      console.error("Start Live:", error);
      toast.error((error as Error).message);
    }
  };

  const handleEndStream = async () => {
    setIsStreaming(false);
    await stopLive();
  };

  const handleUpdateTitle = async () => {
    try {
      await updateRoomTitle(roomTitle);
      toast.success("直播间标题更新成功");
      await loadPreLiveInfo();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleUpdateArea = async () => {
    // 设置直播间分区
    try {
      await updateRoomArea(areaId);
      toast.success("直播间分区更新成功");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleCoverApplied = useCallback(async () => {
    await Promise.all([loadPreLiveInfo(), loadCoverHistory()]);
  }, [loadPreLiveInfo, loadCoverHistory]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card>
          <CardContent className="space-y-4">
            <div className="text-sm">直播间信息</div>
            <div className="flex items-start gap-4">
              <button
                type="button"
                onClick={() => setIsCoverDialogOpen(true)}
                className="group relative aspect-4/3 w-24 shrink-0 overflow-hidden rounded-lg border bg-muted">
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt="直播间封面"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    暂无封面
                  </span>
                )}
                <span className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <HugeiconsIcon icon={RefreshIcon} className="h-3.5 w-3.5" />
                  更换封面
                </span>
              </button>
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex gap-2">
                  <Input
                    id="stream-title"
                    value={roomTitle}
                    onChange={(e) =>
                      updateConfig({ roomTitle: e.target.value })
                    }
                    placeholder="请输入您的直播标题……"
                    className="flex-1"
                  />
                  <LoadingButton
                    variant="outline"
                    onClickAsync={handleUpdateTitle}
                    disabled={!isTitleValid}
                    loadingText="更新中">
                    更新标题
                  </LoadingButton>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {auditChips.map((chip) => (
                    <Badge
                      key={chip.key}
                      className={CHIP_TONE_CLASS[chip.tone]}>
                      {chip.text}
                      {chip.reason && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help underline decoration-dotted">
                              [i]
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{chip.reason}</TooltipContent>
                        </Tooltip>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>分区设置</Label>
              <LoadingButton
                variant="outline"
                size="sm"
                disabled={!isAreaValid}
                onClickAsync={handleUpdateArea}>
                更新分区
              </LoadingButton>
            </div>
            <div className="flex gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="category"
                  className="text-xs text-muted-foreground">
                  分类
                </Label>
                <Select
                  value={categoryId}
                  onValueChange={(value) => {
                    updateConfig({
                      categoryId: value,
                      areaId: "",
                    });
                  }}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {areaList.map((parent) => (
                        <SelectItem key={parent.id} value={parent.id}>
                          {parent.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="area" className="text-xs text-muted-foreground">
                  子分区
                </Label>
                <Select
                  value={areaId}
                  onValueChange={(value) => {
                    updateConfig({
                      areaId: value,
                    });
                  }}
                  disabled={!isCategoryValid}>
                  <SelectTrigger id="area">
                    <SelectValue placeholder="选择分区" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {childAreas.map((area) => (
                        <SelectItem key={area.id} value={area.id}>
                          <img
                            src={area.pic}
                            alt={area.name}
                            className="h-5 w-5 rounded-sm object-cover"
                          />
                          {area.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex gap-3">
            <LoadingButton
              onClickAsync={handleStartStream}
              disabled={!canStartStream}
              className="flex-1">
              <HugeiconsIcon icon={Play} className="mr-1" />
              开始直播
            </LoadingButton>
            <LoadingButton
              variant="destructive"
              onClickAsync={handleEndStream}
              disabled={!isOpenLive}
              className="flex-1">
              <HugeiconsIcon icon={Square} className="mr-1" />
              停止直播
            </LoadingButton>
          </CardContent>
        </Card>
        <Dialog modal open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>验证</DialogTitle>
              <DialogDescription>
                本次开播需要身份验证，请使用哔哩哔哩 App
                扫码完成验证。扫码完成后，请手动关闭此对话框。
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2">
              <div className="grid flex-1 gap-2">
                <QRCodeSVG value={qrCodeUrl} size={240} />
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <div className="space-y-2">
          {isOpenLive && (
            <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <span className="text-xs text-foreground">直播中</span>
            </div>
          )}
        </div>
        {isOpenLive && <StreamCredentials streams={streams} />}
        <CoverDialog
          open={isCoverDialogOpen}
          onOpenChange={setIsCoverDialogOpen}
          history={coverHistory}
          currentCoverUrl={coverUrl}
          onApplied={handleCoverApplied}
        />
      </div>
    </TooltipProvider>
  );
}
