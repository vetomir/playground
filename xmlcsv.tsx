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


import * as xml2js from 'xml2js';

/**
 * Parses XML file to array of objects
 * @param file - XML file to parse
 * @param sheetName - Optional sheet name to select specific sheet
 * @returns Promise with array of objects from specified sheet or all data
 */
export async function parseXMLFile(
    file: File,
    sheetName?: string
): Promise<object[]> {
    const text = await file.text();
    const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });
    const parsed = await parser.parseStringPromise(text);

    // Excel XML with worksheets
    if (parsed.Workbook?.Worksheet) {
        const worksheets = Array.isArray(parsed.Workbook.Worksheet)
            ? parsed.Workbook.Worksheet
            : [parsed.Workbook.Worksheet];

        const sheets = worksheets.map(sheet => {
            const name = sheet['ss:Name'] || sheet.Name || 'Sheet';
            const rows = Array.isArray(sheet.Table?.Row) ? sheet.Table.Row : [sheet.Table?.Row].filter(Boolean);
            const data = rows.map(row => {
                const cells = Array.isArray(row.Cell) ? row.Cell : [row.Cell].filter(Boolean);
                return cells.reduce((obj, cell, i) => {
                    obj[`col${i}`] = cell.Data?._ || cell.Data || '';
                    return obj;
                }, {} as any);
            });

            return { name, data };
        });

        if (sheetName) {
            const sheet = sheets.find(s => s.name === sheetName);
            return sheet?.data || [];
        }

        return sheets.flatMap(s => s.data);
    }

    // Custom format with sheets
    if (parsed.data?.sheet || parsed.sheets?.sheet) {
        const sheetsData = Array.isArray(parsed.data?.sheet || parsed.sheets?.sheet)
            ? (parsed.data?.sheet || parsed.sheets?.sheet)
            : [parsed.data?.sheet || parsed.sheets?.sheet];

        const sheets = sheetsData.map(sheet => {
            const name = sheet.name || sheet.$.name || 'Unnamed';
            const rows = Array.isArray(sheet.row) ? sheet.row : [sheet.row].filter(Boolean);
            return { name, data: rows };
        });

        if (sheetName) {
            const sheet = sheets.find(s => s.name === sheetName);
            return sheet?.data || [];
        }

        return sheets.flatMap(s => s.data);
    }

    // Simple XML without sheets
    const findArray = (obj: any, depth = 0): any[] => {
        if (depth > 5 || !obj) return [];
        if (Array.isArray(obj)) return obj;

        for (const key in obj) {
            if (Array.isArray(obj[key])) return obj[key];
            if (typeof obj[key] === 'object') {
                const result = findArray(obj[key], depth + 1);
                if (result.length > 0) return result;
            }
        }
        return [];
    };

    const data = findArray(parsed);
    return data.length > 0 ? data : [parsed];
}

/**
 * Gets available sheet names from XML file
 * @param file - XML file to parse
 * @returns Promise with array of sheet names
 */
export async function getSheetNames(file: File): Promise<string[]> {
    const text = await file.text();
    const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });
    const parsed = await parser.parseStringPromise(text);

    // Excel XML
    if (parsed.Workbook?.Worksheet) {
        const worksheets = Array.isArray(parsed.Workbook.Worksheet)
            ? parsed.Workbook.Worksheet
            : [parsed.Workbook.Worksheet];
        return worksheets.map(sheet => sheet['ss:Name'] || sheet.Name || 'Sheet');
    }

    // Custom format
    if (parsed.data?.sheet || parsed.sheets?.sheet) {
        const sheetsData = Array.isArray(parsed.data?.sheet || parsed.sheets?.sheet)
            ? (parsed.data?.sheet || parsed.sheets?.sheet)
            : [parsed.data?.sheet || parsed.sheets?.sheet];
        return sheetsData.map(sheet => sheet.name || sheet.$.name || 'Unnamed');
    }

    return ['Data'];
}


// parseXmlFile.ts
import { XMLParser } from 'fast-xml-parser';

// Simple XML (no sheets) and custom-sheet support
export async function parseXMLFile(file: File, sheetName?: string): Promise<object[]> {
    const text = await file.text();
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '',
    });
    const parsed = parser.parse(text);

    // Excel‑like custom format: <data><sheet name="..."><row>...</row></sheet></data>
    const sheetsContainer = parsed.data?.sheet || parsed.sheets?.sheet;
    if (sheetsContainer) {
        const sheets = Array.isArray(sheetsContainer) ? sheetsContainer : [sheetsContainer];

        if (sheetName) {
            const sheet = sheets.find((s: any) => s.name === sheetName || s?.['name'] === sheetName);
            if (!sheet) return [];
            const rows = sheet.row;
            return Array.isArray(rows) ? rows : rows ? [rows] : [];
        }

        // wszystkie sheety złączone
        return sheets.flatMap((s: any) => {
            const rows = s.row;
            return Array.isArray(rows) ? rows : rows ? [rows] : [];
        });
    }

    // Prosty XML – znajdź pierwszą tablicę
    const findArray = (obj: any, depth = 0): any[] => {
        if (!obj || depth > 5) return [];
        if (Array.isArray(obj)) return obj;
        for (const key in obj) {
            const val = obj[key];
            if (Array.isArray(val)) return val;
            if (typeof val === 'object') {
                const res = findArray(val, depth + 1);
                if (res.length) return res;
            }
        }
        return [];
    };

    const arr = findArray(parsed);
    return arr.length ? arr : [parsed];
}
