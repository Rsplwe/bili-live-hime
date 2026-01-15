import { AutoSizer, List, CellMeasurer, CellMeasurerCache, type ListRowRenderer } from "react-virtualized";
import { useEffect, useRef } from "react";
import "react-virtualized/styles.css";

type VirtualScrollAreaProps<T> = {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  autoScroll?: boolean;
};

export function VirtualScrollArea<T>({ items, renderItem, autoScroll = true }: VirtualScrollAreaProps<T>) {
  const listRef = useRef<List>(null);

  const cache = new CellMeasurerCache({
    fixedWidth: true,
    defaultHeight: 48,
  });

  useEffect(() => {
    if (autoScroll) {
      listRef.current?.scrollToRow(items.length - 1);
    }
  }, [items.length, autoScroll]);

  const rowRenderer: ListRowRenderer = ({ index, key, parent, style }) => {
    const item = items[index];

    return (
      <CellMeasurer cache={cache} columnIndex={0} rowIndex={index} parent={parent} key={key}>
        <div style={style} className="px-1">
          {renderItem(item)}
        </div>
      </CellMeasurer>
    );
  };

  return (
    <div className="h-full w-full overflow-hidden rounded-md border bg-background">
      <AutoSizer>
        {({ height, width }) => (
          <List
            className="py-2"
            ref={listRef}
            width={width}
            height={height}
            deferredMeasurementCache={cache}
            rowHeight={cache.rowHeight}
            rowRenderer={rowRenderer}
            rowCount={items.length}
            overscanRowCount={6}
          />
        )}
      </AutoSizer>
    </div>
  );
}
