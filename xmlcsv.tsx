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


export function downloadCSV(data: string[][], filename: string = 'data.csv'): void {
    const csvContent = arrayToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function downloadXML(data: string[][], filename: string = 'data.xml'): void {
    const xmlContent = arrayToXML(data);
    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

type JsonObject = Record<string, any>;

// Konwersja object[] na CSV
function objectArrayToCSV(data: JsonObject[], delimiter: string = ','): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const needsEscape = new RegExp(`[${delimiter}"\n]`);

    const escapeCellValue = (value: any): string => {
        const str = value?.toString() ?? '';
        if (needsEscape.test(str)) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const parts: string[] = [];
    parts.push(headers.map(escapeCellValue).join(delimiter));

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const cells: string[] = [];

        for (let j = 0; j < headers.length; j++) {
            cells.push(escapeCellValue(row[headers[j]]));
        }

        parts.push(cells.join(delimiter));
    }

    return parts.join('\n');
}

// Konwersja object[] na XML
function objectArrayToXML(data: JsonObject[]): string {
    const xmlChars: Record<string, string> = {
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
    };

    const escapeXML = (str: string): string => {
        return str.replace(/[&<>"']/g, char => xmlChars[char]);
    };

    const sanitizeTagName = (str: string): string => {
        return str.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/^[0-9]/, '_$&');
    };

    const parts: string[] = ['<?xml version="1.0" encoding="UTF-8"?>\n<data>\n'];

    for (let i = 0; i < data.length; i++) {
        parts.push('  <item>\n');

        for (const [key, value] of Object.entries(data[i])) {
            const tagName = sanitizeTagName(key);
            const val = value?.toString() ?? '';
            parts.push(`    <${tagName}>${escapeXML(val)}</${tagName}>\n`);
        }

        parts.push('  </item>\n');
    }

    parts.push('</data>');
    return parts.join('');
}

// Główne funkcje do pobierania plików
export function downloadCSVFromObjects(data: JsonObject[], filename: string = 'data.csv'): void {
    const content = objectArrayToCSV(data);
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function downloadXMLFromObjects(data: JsonObject[], filename: string = 'data.xml'): void {
    const content = objectArrayToXML(data);
    const blob = new Blob([content], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
