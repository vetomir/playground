// Konwersja string[][] na CSV
export function arrayToCSV(data: string[][], delimiter: string = ','): string {
    return data
        .map(row =>
            row.map(cell => {
                // Escapowanie komórek zawierających delimiter, cudzysłowy lub nowe linie
                if (cell.includes(delimiter) || cell.includes('"') || cell.includes('\n')) {
                    return `"${cell.replace(/"/g, '""')}"`;
                }
                return cell;
            }).join(delimiter)
        )
        .join('\n');
}

// Konwersja string[][] na XML
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

    const escapeXML = (str: string): string => {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    };

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootElement}>\n`;

    data.forEach((row, rowIndex) => {
        xml += `  <${rowElement}`;

        if (headerRow && rowIndex === 0) {
            xml += ` type="header"`;
        }

        xml += '>\n';

        row.forEach((cell, cellIndex) => {
            xml += `    <${cellElement} index="${cellIndex}">${escapeXML(cell)}</${cellElement}>\n`;
        });

        xml += `  </${rowElement}>\n`;
    });

    xml += `</${rootElement}>`;

    return xml;
}

// XML z nazwanymi kolumnami (pierwszy wiersz = nagłówki)
export function arrayToXMLWithHeaders(
    data: string[][],
    options: {
        rootElement?: string;
        rowElement?: string;
    } = {}
): string {
    if (data.length === 0) {
        return `<?xml version="1.0" encoding="UTF-8"?>\n<${options.rootElement || 'data'}/>`;
    }

    const {
        rootElement = 'data',
        rowElement = 'row'
    } = options;

    const escapeXML = (str: string): string => {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    };

    const sanitizeTagName = (str: string): string => {
        return str
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .replace(/^[0-9]/, '_$&');
    };

    const headers = data[0].map(sanitizeTagName);
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootElement}>\n`;

    for (let i = 1; i < data.length; i++) {
        xml += `  <${rowElement}>\n`;

        data[i].forEach((cell, cellIndex) => {
            const tagName = headers[cellIndex] || `column_${cellIndex}`;
            xml += `    <${tagName}>${escapeXML(cell)}</${tagName}>\n`;
        });

        xml += `  </${rowElement}>\n`;
    }

    xml += `</${rootElement}>`;

    return xml;
}
