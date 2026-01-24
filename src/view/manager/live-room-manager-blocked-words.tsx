import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { X, RefreshCw, XCircle } from "@hugeicons/core-free-icons";
import { useEffect, useRef, useState } from "react";
import {
  addBlockedWords,
  deleteBlockedWords,
  getBlockedWords,
} from "@/api/live";
import { toast } from "sonner";
import { LoadingButton } from "@/components/loading-button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";

type Status = "loading" | "error" | "empty" | "success";

export function LiveRoomManagerBlockedWords() {
  const [state, setState] = useState<Status>("loading");
  const hasFetchedRef = useRef(false);
  const [maxLimit, setMaxLimit] = useState(0);
  const [blockedWords, setBlockedWords] = useState<string[]>([]);
  const [blockedWordInput, setBlockedWordInput] = useState("");

  const fetchKeywords = async () => {
    try {
      setState("loading");
      const { keyword_list, max_limit } = await getBlockedWords();
      const words = keyword_list.map((k) => k.keyword);
      setBlockedWords(words);
      setMaxLimit(max_limit);
      if (words.length > 0) {
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
    fetchKeywords();
  }, []);

  const handleAddBlockedWord = async () => {
    const raw = blockedWordInput.trim();
    if (!raw) return;

    const word = raw.toLowerCase();
    if (blockedWords.includes(word)) return;

    try {
      await addBlockedWords(word);

      setBlockedWords((prev) => [...prev, word]);
      setBlockedWordInput("");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleRemoveBlockedWord = async (word: string) => {
    try {
      await deleteBlockedWords(word);
      setBlockedWords(blockedWords.filter((w) => w !== word));
    } catch (err) {
      toast.error((err as Error).message);
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
              onClick={fetchKeywords}>
              <HugeiconsIcon icon={RefreshCw} className="w-4 h-4" />
              刷新
            </Button>
          </div>
        );
      case "empty":
        return (
          <div className="flex items-center justify-center h-30 text-muted-foreground text-sm">
            屏蔽词列表为空
          </div>
        );
      case "success":
        return (
          <div className="flex flex-wrap gap-2">
            {blockedWords.map((word) => (
              <Badge
                key={word}
                variant="secondary"
                className="pl-3 pr-1 py-1.5 gap-1 text-sm">
                {word}
                <button
                  onClick={() => handleRemoveBlockedWord(word)}
                  className="ml-1 hover:bg-muted-foreground/20 rounded p-0.5">
                  <HugeiconsIcon className="w-4 h-4" icon={X} />
                </button>
              </Badge>
            ))}
          </div>
        );
    }
  };
  return (
    <>
      <div className="space-y-3">
        <Label>
          屏蔽词
          <span className="text-xs text-muted-foreground">
            包含屏蔽词的弹幕不会出现在直播中，屏蔽词不得超过15个字符数
          </span>
        </Label>

        <div className="flex gap-2">
          <Input
            placeholder="请输入要屏蔽的内容"
            value={blockedWordInput}
            onChange={(e) => setBlockedWordInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddBlockedWord()}
          />
          <LoadingButton
            onClickAsync={handleAddBlockedWord}
            disabled={!blockedWordInput.trim()}>
            添加
          </LoadingButton>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>屏蔽列表</Label>
          <Badge variant="secondary">
            {blockedWords.length} / {maxLimit}
          </Badge>
        </div>
        <div className="border rounded-md p-4 min-h-37.5">{content()}</div>
      </div>
    </>
  );
}
