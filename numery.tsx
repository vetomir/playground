import React, { useRef, useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import './style.css';

interface OptimizedTableProps {
    data: Record<string, any>[];
    headers: string[];
    estimatedRowHeight?: number;
    estimatedColumnWidth?: number;
    rowOverscan?: number;
    columnOverscan?: number;
}

export const OptimizedTable: React.FC<OptimizedTableProps> = ({
                                                                  data,
                                                                  headers,
                                                                  estimatedRowHeight = 35,
                                                                  estimatedColumnWidth = 150,
                                                                  rowOverscan,
                                                                  columnOverscan,
                                                              }) => {
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

    // Oblicz dynamiczny overscan jeśli nie podano w props
    const calculatedRowOverscan = rowOverscan ?? Math.ceil(containerSize.height / estimatedRowHeight) || 5;
    const calculatedColumnOverscan = columnOverscan ?? Math.ceil(containerSize.width / estimatedColumnWidth) || 3;

    // Wirtualizacja wierszy
    const rowVirtualizer = useVirtualizer({
        count: data.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => estimatedRowHeight,
        overscan: calculatedRowOverscan,
    });

    // Wirtualizacja kolumn
    const columnVirtualizer = useVirtualizer({
        horizontal: true,
        count: headers.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => estimatedColumnWidth,
        overscan: calculatedColumnOverscan,
    });

    const virtualRows = rowVirtualizer.getVirtualItems();
    const virtualColumns = columnVirtualizer.getVirtualItems();

    // Automatyczne dopasowanie szerokości kolumn do kontenera
    const columnWidth = containerSize.width > 0
        ? Math.max(estimatedColumnWidth, containerSize.width / Math.min(headers.length, 8))
        : estimatedColumnWidth;

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
                                        width: `${columnWidth}px`,
                                        minWidth: `${columnWidth}px`,
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
                                                width: `${columnWidth}px`,
                                                minWidth: `${columnWidth}px`,
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


// Domyślne wartości (35px wysokość, 150px szerokość)
<OptimizedTable data={data} headers={headers} />

// Większe wiersze (np. dla danych z długim tekstem)
<OptimizedTable
    data={data}
    headers={headers}
    estimatedRowHeight={50}
/>

// Szersze kolumny
<OptimizedTable
    data={data}
    headers={headers}
    estimatedColumnWidth={200}
/>

// Pełna konfiguracja
<OptimizedTable
    data={data}
    headers={headers}
    estimatedRowHeight={40}
    estimatedColumnWidth={180}
    rowOverscan={10}
    columnOverscan={5}
/>

// Kompaktowa tabela
<OptimizedTable
    data={data}
    headers={headers}
    estimatedRowHeight={28}
    estimatedColumnWidth={120}
/>
