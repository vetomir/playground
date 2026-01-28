import * as xml2js from 'xml2js';

export interface ParsedSheet {
    name: string;
    data: object[];
}

export interface ParseXMLResult {
    sheets: ParsedSheet[];
    allData: object[];
}

/**
 * Parses XML file and returns structured data with sheet information
 * @param file - XML file to parse
 * @returns Promise with sheets array and combined data
 */
export async function parseXMLFile(file: File): Promise<ParseXMLResult> {
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

        return {
            sheets,
            allData: sheets.flatMap(s => s.data),
        };
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

        return {
            sheets,
            allData: sheets.flatMap(s => s.data),
        };
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
    const finalData = data.length > 0 ? data : [parsed];

    return {
        sheets: [{ name: 'Data', data: finalData }],
        allData: finalData,
    };
}

/**
 * Gets data from specific sheet by name
 * @param result - Result from parseXMLFile
 * @param sheetName - Name of the sheet to retrieve
 * @returns Array of objects from specified sheet or empty array
 */
export function getSheetByName(result: ParseXMLResult, sheetName: string): object[] {
    const sheet = result.sheets.find(s => s.name === sheetName);
    return sheet?.data || [];
}

/**
 * Gets data from sheet by index
 * @param result - Result from parseXMLFile
 * @param index - Index of the sheet (0-based)
 * @returns Array of objects from specified sheet or empty array
 */
export function getSheetByIndex(result: ParseXMLResult, index: number): object[] {
    return result.sheets[index]?.data || [];
}
