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
