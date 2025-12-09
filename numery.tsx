import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useState, useEffect } from 'react';
import './VirtualTable.css';

interface VirtualTableProps {
    data: Record<string, any>[];
    headers: string[];
    onRowClick?: (row: Record<string, any>, index: number) => void;
    minColumnWidth?: number;
    rowHeight?: number;
}

export function VirtualTable({
                                 data,
                                 headers,
                                 onRowClick,
                                 minColumnWidth = 150,
                                 rowHeight = 40
                             }: VirtualTableProps) {
    const parentRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const updateDimensions = () => {
            if (parentRef.current) {
                const rect = parentRef.current.getBoundingClientRect();
                setDimensions({
                    width: rect.width,
                    height: rect.height
                });
            }
        };

        updateDimensions();
        const resizeObserver = new ResizeObserver(updateDimensions);
        if (parentRef.current) {
            resizeObserver.observe(parentRef.current);
        }

        return () => resizeObserver.disconnect();
    }, []);

    const getColumnWidth = () => {
        if (dimensions.width === 0) return minColumnWidth;
        const calculatedWidth = dimensions.width / headers.length;
        return Math.max(calculatedWidth, minColumnWidth);
    };

    const columnWidth = getColumnWidth();

    const rowVirtualizer = useVirtualizer({
        count: data.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => rowHeight,
        overscan: 5,
    });

    const columnVirtualizer = useVirtualizer({
        horizontal: true,
        count: headers.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => columnWidth,
        overscan: 3,
    });

    const virtualRows = rowVirtualizer.getVirtualItems();
    const virtualColumns = columnVirtualizer.getVirtualItems();

    const totalTableWidth = columnVirtualizer.getTotalSize();
    const useFullWidth = totalTableWidth < dimensions.width;

    return (
        <div ref={parentRef} className="virtual-table-container">
            {/* Header */}
            <div
                className="virtual-table-header"
                style={{
                    width: useFullWidth ? '100%' : `${totalTableWidth}px`,
                }}
            >
                {virtualColumns.map((virtualColumn) => {
                    const header = headers[virtualColumn.index];
                    return (
                        <div
                            key={virtualColumn.key}
                            className="virtual-table-header-cell"
                            style={{
                                position: useFullWidth ? 'relative' : 'absolute',
                                left: useFullWidth ? 'auto' : 0,
                                transform: useFullWidth ? 'none' : `translateX(${virtualColumn.start}px)`,
                                width: `${virtualColumn.size}px`,
                                height: `${rowHeight}px`,
                            }}
                        >
                            {header}
                        </div>
                    );
                })}
            </div>

            {/* Body */}
            <div
                className="virtual-table-body"
                style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: useFullWidth ? '100%' : `${totalTableWidth}px`,
                }}
            >
                {virtualRows.map((virtualRow) => {
                    const row = data[virtualRow.index];

                    return (
                        <div
                            key={virtualRow.key}
                            className={`virtual-table-row ${onRowClick ? 'clickable' : ''}`}
                            style={{
                                transform: `translateY(${virtualRow.start}px)`,
                                height: `${virtualRow.size}px`,
                            }}
                            onClick={() => onRowClick?.(row, virtualRow.index)}
                        >
                            {virtualColumns.map((virtualColumn) => {
                                const header = headers[virtualColumn.index];
                                const cellValue = row[header];

                                return (
                                    <div
                                        key={virtualColumn.key}
                                        className="virtual-table-cell"
                                        style={{
                                            position: useFullWidth ? 'relative' : 'absolute',
                                            left: useFullWidth ? 'auto' : 0,
                                            transform: useFullWidth ? 'none' : `translateX(${virtualColumn.start}px)`,
                                            width: `${virtualColumn.size}px`,
                                        }}
                                    >
                                        {cellValue}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


.virtual-table-container {
    width: 100%;
    height: 100%;
    overflow: auto;
    position: relative;
    background: #fff;
}

.virtual-table-header {
    display: flex;
    position: sticky;
    top: 0;
    left: 0;
    z-index: 2;
    background: #f5f5f5;
    border-bottom: 2px solid #ddd;
}

.virtual-table-header-cell {
    display: flex;
    align-items: center;
    padding: 0 12px;
    font-weight: 600;
    font-size: 14px;
    border-right: 1px solid #ddd;
    background: #f5f5f5;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.virtual-table-header-cell:last-child {
    border-right: none;
}

.virtual-table-body {
    position: relative;
}

.virtual-table-row {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    display: flex;
    border-bottom: 1px solid #eee;
    transition: background-color 0.15s ease;
}

.virtual-table-row.clickable {
    cursor: pointer;
}

.virtual-table-row.clickable:hover {
    background-color: #f9f9f9;
}

.virtual-table-cell {
    display: flex;
    align-items: center;
    padding: 0 12px;
    height: 100%;
    border-right: 1px solid #eee;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
}

.virtual-table-cell:last-child {
    border-right: none;
}

/* Scrollbar styling (opcjonalne) */
.virtual-table-container::-webkit-scrollbar {
    width: 12px;
    height: 12px;
}

.virtual-table-container::-webkit-scrollbar-track {
    background: #f1f1f1;
}

.virtual-table-container::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 6px;
}

.virtual-table-container::-webkit-scrollbar-thumb:hover {
    background: #555;
}

/* Dark mode support (opcjonalne) */
@media (prefers-color-scheme: dark) {
.virtual-table-container {
        background: #1a1a1a;
    }

.virtual-table-header {
        background: #2a2a2a;
        border-bottom-color: #444;
    }

.virtual-table-header-cell {
        background: #2a2a2a;
        border-right-color: #444;
        color: #fff;
    }

.virtual-table-row {
        border-bottom-color: #333;
    }

.virtual-table-row.clickable:hover {
        background-color: #252525;
    }

.virtual-table-cell {
        border-right-color: #333;
        color: #e0e0e0;
    }

.virtual-table-container::-webkit-scrollbar-track {
        background: #2a2a2a;
    }

.virtual-table-container::-webkit-scrollbar-thumb {
        background: #555;
    }

.virtual-table-container::-webkit-scrollbar-thumb:hover {
        background: #777;
    }
}
