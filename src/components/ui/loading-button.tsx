import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

type LoadingButtonProps = React.ComponentProps<typeof Button> & {
  onClickAsync?: () => Promise<void>;
  loadingText?: string;
};

export function LoadingButton({
  children,
  onClickAsync,
  loadingText = "处理中",
  className,
  disabled,
  ...props
}: LoadingButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!onClickAsync || loading) return;

    try {
      setLoading(true);
      await onClickAsync();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button {...props} className={cn(className)} disabled={disabled || loading} onClick={handleClick}>
      {loading && <Spinner />}
      {loading ? loadingText : children}
    </Button>
  );
}
