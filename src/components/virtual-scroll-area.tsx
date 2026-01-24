import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef } from "react";

type VirtualScrollAreaProps<T> = {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  autoScroll?: boolean;
};

export function VirtualScrollArea<T>({
  items,
  renderItem,
  autoScroll = true,
}: VirtualScrollAreaProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 6,
  });

  useEffect(() => {
    if (autoScroll && items.length > 0) {
      virtualizer.scrollToIndex(items.length - 1, {
        align: "end",
      });
    }
  }, [items.length, autoScroll, virtualizer]);

  return (
    <div
      ref={parentRef}
      className="h-full w-full py-2 overflow-auto rounded-md border bg-background">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            data-index={virtualItem.index}
            ref={virtualizer.measureElement}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${virtualItem.start}px)`,
            }}
            className="px-1">
            {renderItem(items[virtualItem.index])}
          </div>
        ))}
      </div>
    </div>
  );
}
