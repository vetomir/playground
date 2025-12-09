import React, { useRef, useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import './style.css';

interface OptimizedTableProps {
    data: Record<string, any>[];
    headers: string[];
}

export const OptimizedTable: React.FC<OptimizedTableProps> = ({ data, headers }) => {
    const parentRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    // ResizeObserver do dynamicznego dostosowania rozmiaru
    useEffect(() => {
        if (!parentRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerSize({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height,
                });
            }
        });

        resizeObserver.observe(parentRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // Wirtualizacja wierszy
    const rowVirtualizer = useVirtualizer({
        count: data.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 35,
        overscan: 5,
    });

    // Wirtualizacja kolumn
    const columnVirtualizer = useVirtualizer({
        horizontal: true,
        count: headers.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 150,
        overscan: 3,
    });

    const virtualRows = rowVirtualizer.getVirtualItems();
    const virtualColumns = columnVirtualizer.getVirtualItems();

    // Padding dla wirtualnych elementów
    const [paddingTop, paddingBottom] =
        virtualRows.length > 0
            ? [
                Math.max(0, virtualRows[0].start),
                Math.max(0, rowVirtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end),
            ]
            : [0, 0];

    const [paddingLeft, paddingRight] =
        virtualColumns.length > 0
            ? [
                Math.max(0, virtualColumns[0].start),
                Math.max(0, columnVirtualizer.getTotalSize() - virtualColumns[virtualColumns.length - 1].end),
            ]
            : [0, 0];

    // Fix dla sticky header - CSS variable approach
    useEffect(() => {
        const tableElement = parentRef.current?.querySelector('table');
        const tbodyElement = parentRef.current?.querySelector('tbody');

        if (tableElement && tbodyElement) {
            const totalHeight = rowVirtualizer.getTotalSize();
            const tbodyHeight = tbodyElement.getBoundingClientRect().height;
            const heightDiff = Math.max(0, totalHeight - tbodyHeight);

            document.documentElement.style.setProperty('--table-after-height', `${heightDiff}px`);
        }
    }, [virtualRows, rowVirtualizer]);

    return (
        <div ref={parentRef} className="table-container">
            <div
                className="table-wrapper"
                style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: `${columnVirtualizer.getTotalSize()}px`,
                }}
            >
                <table className="virtualized-table">
                    <thead className="sticky-header">
                    <tr>
                        {paddingLeft > 0 && <th style={{ width: paddingLeft }} />}
                        {virtualColumns.map((virtualColumn) => {
                            const header = headers[virtualColumn.index];
                            return (
                                <th
                                    key={virtualColumn.key}
                                    style={{
                                        width: `${virtualColumn.size}px`,
                                    }}
                                >
                                    {header}
                                </th>
                            );
                        })}
                        {paddingRight > 0 && <th style={{ width: paddingRight }} />}
                    </tr>
                    </thead>
                    <tbody>
                    {paddingTop > 0 && (
                        <tr>
                            <td style={{ height: paddingTop }} />
                        </tr>
                    )}
                    {virtualRows.map((virtualRow) => {
                        const row = data[virtualRow.index];
                        return (
                            <tr
                                key={virtualRow.key}
                                style={{
                                    height: `${virtualRow.size}px`,
                                }}
                            >
                                {paddingLeft > 0 && <td style={{ width: paddingLeft }} />}
                                {virtualColumns.map((virtualColumn) => {
                                    const header = headers[virtualColumn.index];
                                    return (
                                        <td
                                            key={virtualColumn.key}
                                            style={{
                                                width: `${virtualColumn.size}px`,
                                            }}
                                        >
                                            {row[header] ?? ''}
                                        </td>
                                    );
                                })}
                                {paddingRight > 0 && <td style={{ width: paddingRight }} />}
                            </tr>
                        );
                    })}
                    {paddingBottom > 0 && (
                        <tr>
                            <td style={{ height: paddingBottom }} />
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
.table-container {
    width: 100%;
    height: 600px;
    overflow: auto;
    position: relative;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
}

.table-wrapper {
    position: relative;
    min-width: 100%;
}

.virtualized-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
}

/* Fix dla sticky header - pseudo-element */
.virtualized-table::after {
    content: '';
    display: block;
    height: var(--table-after-height, 0);
}

.sticky-header {
    position: sticky;
    top: 0;
    z-index: 10;
    background-color: #f9fafb;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.sticky-header th {
    padding: 12px 16px;
    text-align: left;
    font-weight: 600;
    font-size: 14px;
    color: #374151;
    border-bottom: 2px solid #e5e7eb;
    background-color: #f9fafb;
}

.virtualized-table tbody tr {
    border-bottom: 1px solid #e5e7eb;
}

.virtualized-table tbody tr:hover {
    background-color: #f3f4f6;
}

.virtualized-table td {
    padding: 10px 16px;
    font-size: 14px;
    color: #1f2937;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* Scrollbar styling */
.table-container::-webkit-scrollbar {
    width: 12px;
    height: 12px;
}

.table-container::-webkit-scrollbar-track {
    background: #f1f1f1;
}

.table-container::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 6px;
}

.table-container::-webkit-scrollbar-thumb:hover {
    background: #555;
}
