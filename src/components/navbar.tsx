import { Radio, Minus, X, Square, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getVersion } from "@tauri-apps/api/app";
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useEffect, useState } from "react";

export function Navbar() {

  const [isMaximized, setIsMaximized] = useState(false)

  const [version, setVersion] = useState("");

  useEffect(() => {
    getVersion().then(setVersion);
  }, []);


  const handleMaximizeToggle = async () => {
    if (isMaximized) {
      await getCurrentWindow().unmaximize();
    } else {
      await getCurrentWindow().maximize()
    }
    setIsMaximized(!isMaximized)
  }

  return (
    <header data-tauri-drag-region className="h-12 shrink-0 border-b border-border bg-card flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <Radio className="w-5 h-5 text-primary" />
        <h1 className="text-base font-semibold text-foreground">
          哔哩哔哩直播姬 <span className="text-muted-foreground font-normal text-xs">(仮) v{version}</span>
        </h1>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-sm hover:bg-secondary"
          onClick={() => getCurrentWindow().minimize()}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-sm hover:bg-secondary"
          onClick={handleMaximizeToggle}
        >
          {isMaximized ? <Square className="h-3.5 w-3.5" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-sm hover:bg-destructive hover:text-destructive-foreground"
          onClick={() => getCurrentWindow().close()}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
