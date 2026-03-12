import {
  Radio,
  Minus,
  X,
  Minimize,
  Maximize,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { getVersion } from "@tauri-apps/api/app";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";

export function Navbar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [version, setVersion] = useState("");

  useEffect(() => {
    getVersion().then(setVersion);

    const unlisten = getCurrentWindow().onResized(async () => {
      setIsMaximized(await getCurrentWindow().isMaximized());
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  const handleMaximizeToggle = async () => {
    if (isMaximized) {
      await getCurrentWindow().unmaximize();
    } else {
      await getCurrentWindow().maximize();
    }
    setIsMaximized(!isMaximized);
  };

  return (
    <header
      data-tauri-drag-region
      className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-3">
        <HugeiconsIcon icon={Radio} className="h-5 w-5 text-primary" />
        <h1 className="text-base font-semibold text-foreground">
          哔哩哔哩直播姬{" "}
          <span className="text-xs font-normal text-muted-foreground">
            (仮) v{version}
          </span>
        </h1>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-sm hover:bg-secondary"
          onClick={() => getCurrentWindow().minimize()}>
          <HugeiconsIcon icon={Minus} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-sm hover:bg-secondary"
          onClick={handleMaximizeToggle}>
          {isMaximized ? (
            <HugeiconsIcon icon={Minimize} />
          ) : (
            <HugeiconsIcon icon={Maximize} />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hover:text-destructive-foreground h-8 w-8 rounded-sm hover:bg-destructive"
          onClick={() => getCurrentWindow().close()}>
          <HugeiconsIcon icon={X} />
        </Button>
      </div>
    </header>
  );
}
