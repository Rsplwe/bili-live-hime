import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";
import { Upload01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  updatePreLiveCover,
  uploadCoverImage,
  type CoverHistoryItem,
} from "@/api/cover";

// The 4:3 crop ratio and the 720x540 export size follow the official Bilibili.
const COVER_ASPECT_RATIO = 4 / 3;
const COVER_WIDTH = 720;
const COVER_HEIGHT = 540;
// Allowed source image width range for uploading a new cover.
const MIN_COVER_WIDTH = 30;
const MAX_COVER_WIDTH = 3000;

const normalizeCoverUrl = (url: string): string =>
  url.replace(/^http:\/\//, "https://");

interface PendingImage {
  file: File;
  url: string;
}

interface CoverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: CoverHistoryItem[];
  currentCoverUrl: string;
  onApplied: () => Promise<void>;
}

export function CoverDialog({
  open,
  onOpenChange,
  history,
  currentCoverUrl,
  onApplied,
}: CoverDialogProps) {
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(
    null,
  );
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [applying, setApplying] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const cropperRef = useRef<Cropper | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setSelectedHistoryId(null);
      setPendingImage(null);
      setApplying(false);
    }
  }, [open]);

  // Release the object URL of the pending image on replace or unmount.
  useEffect(() => {
    return () => {
      if (pendingImage) URL.revokeObjectURL(pendingImage.url);
    };
  }, [pendingImage]);

  useEffect(() => {
    if (!pendingImage || !imgRef.current) return;
    const img = imgRef.current;
    let cropper: Cropper | null = null;
    const init = () => {
      cropper = new Cropper(img, {
        aspectRatio: COVER_ASPECT_RATIO,
        viewMode: 1,
        dragMode: "move",
        autoCropArea: 1,
        background: false,
      });
      cropperRef.current = cropper;
    };
    if (img.complete) {
      init();
    } else {
      img.addEventListener("load", init, { once: true });
    }
    return () => {
      img.removeEventListener("load", init);
      cropper?.destroy();
      cropperRef.current = null;
    };
  }, [pendingImage]);

  const handlePickCover = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth;
        if (width < MIN_COVER_WIDTH || width > MAX_COVER_WIDTH) {
          URL.revokeObjectURL(url);
          toast.error(
            `图片宽度需在 ${MIN_COVER_WIDTH} ~ ${MAX_COVER_WIDTH}px 之间（当前 ${width}px）`,
          );
          return;
        }
        setSelectedHistoryId(null);
        setPendingImage({ file, url });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        toast.error("无法读取图片，请重新选择");
      };
      img.src = url;
    },
    [],
  );

  const handleConfirm = useCallback(async () => {
    try {
      setApplying(true);
      const cropper = cropperRef.current;
      if (pendingImage && cropper) {
        const canvas = cropper.getCroppedCanvas({
          width: COVER_WIDTH,
          height: COVER_HEIGHT,
        });
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b: Blob | null) =>
              b
                ? resolve(b)
                : reject(new Error("导出封面图片失败，请重新选择图片")),
            "image/jpeg",
            0.95,
          );
        });
        const file = new File([blob], "cover.jpg", { type: "image/jpeg" });
        const { location } = await uploadCoverImage(file);
        await updatePreLiveCover(location);
      } else {
        const item = history.find((h) => h.cover_id === selectedHistoryId);
        if (!item) return;
        await updatePreLiveCover(item.cover_url);
      }
      await onApplied();
      toast.success("封面更新成功");
      onOpenChange(false);
    } catch (error) {
      console.error("Apply Cover:", error);
      toast.error((error as Error).message);
    } finally {
      setApplying(false);
    }
  }, [pendingImage, history, selectedHistoryId, onApplied, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>更换封面</DialogTitle>
        </DialogHeader>
        <div className="flex gap-4">
          <div className="w-1/4 space-y-2">
            <Label className="text-xs text-muted-foreground">历史封面</Label>
            <ScrollArea className="h-72">
              <div className="space-y-2 pr-2">
                {history.length === 0 && (
                  <div className="flex h-24 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
                    暂无历史封面
                  </div>
                )}
                {history.map((item) => {
                  const isCurrent =
                    normalizeCoverUrl(item.cover_url) ===
                    normalizeCoverUrl(currentCoverUrl);
                  const isSelected = item.cover_id === selectedHistoryId;
                  return (
                    <button
                      key={item.cover_id}
                      type="button"
                      disabled={applying}
                      onClick={() => {
                        setSelectedHistoryId(item.cover_id);
                        setPendingImage(null);
                      }}
                      className={cn(
                        "block w-full overflow-hidden rounded-md border text-left transition-colors",
                        isSelected
                          ? "border-primary"
                          : "border-border hover:border-primary/50",
                      )}>
                      <div className="relative">
                        <img
                          src={item.cover_url}
                          alt="历史封面"
                          className="aspect-4/3 w-full object-cover"
                        />
                        {isCurrent && (
                          <span className="absolute right-1 top-1 rounded-sm bg-primary px-1 py-0.5 text-[10px] text-primary-foreground">
                            使用中
                          </span>
                        )}
                      </div>
                      <div className="space-y-0.5 px-2 py-1.5 text-xs">
                        <div className="flex items-center gap-1">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: item.score_color || "#888" }}
                          />
                          <span className="text-muted-foreground">
                            官方评分
                          </span>
                          <span>{item.score}</span>
                        </div>
                        <div className="text-muted-foreground">
                          {item.upload_time
                            ? new Date(item.upload_time * 1000).toLocaleDateString()
                            : ""}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
          <div className="w-3/4 space-y-2">
            <Label className="text-xs text-muted-foreground">上传新封面</Label>
            <div className="overflow-hidden rounded-md border bg-black">
              {pendingImage ? (
                <img
                  ref={imgRef}
                  src={pendingImage.url}
                  alt="待裁切封面"
                  className="aspect-4/3 w-full"
                />
              ) : (
                <button
                  type="button"
                  onClick={handlePickCover}
                  disabled={applying}
                  className="flex aspect-4/3 w-full flex-col items-center justify-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
                  <HugeiconsIcon
                    icon={Upload01Icon}
                    className="h-6 w-6"
                    strokeWidth={2}
                  />
                  点击选择本地图片
                  <span className="text-[10px] opacity-70">
                    建议比例 4:3
                  </span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handlePickCover}
              disabled={applying}>
              {pendingImage ? "重新选择" : "选择图片"}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            disabled={applying}
            onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            disabled={applying || (!pendingImage && !selectedHistoryId)}
            onClick={handleConfirm}>
            {applying && <Spinner />}
            {applying ? "应用中" : "确认"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
