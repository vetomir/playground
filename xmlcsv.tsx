// Zoptymalizowane CSV - dla dużych danych
export function arrayToCSV(data: string[][], delimiter: string = ','): string {
    const parts: string[] = [];
    const needsEscape = new RegExp(`[${delimiter}"\\n]`);

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const cells: string[] = [];

        for (let j = 0; j < row.length; j++) {
            const cell = row[j];
            if (needsEscape.test(cell)) {
                cells.push(`"${cell.replace(/"/g, '""')}"`);
            } else {
                cells.push(cell);
            }
        }
        parts.push(cells.join(delimiter));
    }

    return parts.join('\n');
}

// Zoptymalizowane XML - array builder zamiast konkatenacji
export function arrayToXML(
    data: string[][],
    options: {
        rootElement?: string;
        rowElement?: string;
        cellElement?: string;
        headerRow?: boolean;
    } = {}
): string {
    const {
        rootElement = 'data',
        rowElement = 'row',
        cellElement = 'cell',
        headerRow = false
    } = options;

    const xmlChars: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;'
    };

    const escapeXML = (str: string): string => {
        return str.replace(/[&<>"']/g, char => xmlChars[char]);
    };

    const parts: string[] = [`<?xml version="1.0" encoding="UTF-8"?>\n<${rootElement}>\n`];

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const isHeader = headerRow && i === 0;

        parts.push(`  <${rowElement}${isHeader ? ' type="header"' : ''}>\n`);

        for (let j = 0; j < row.length; j++) {
            parts.push(`    <${cellElement} index="${j}">${escapeXML(row[j])}</${cellElement}>\n`);
        }

        parts.push(`  </${rowElement}>\n`);
    }

    parts.push(`</${rootElement}>`);

    return parts.join('');
}
