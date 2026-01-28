// Usage in React component with sheet selection
import { useState } from 'react';
import { parseXMLFile, getSheetByName, type ParseXMLResult } from './parseXMLFile';

const FileUploader = () => {
    const [result, setResult] = useState<ParseXMLResult | null>(null);
    const [selectedSheet, setSelectedSheet] = useState<string>('');
    const [data, setData] = useState<object[]>([]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const parsed = await parseXMLFile(file);
        setResult(parsed);
        setSelectedSheet(parsed.sheets[0]?.name || '');
        setData(parsed.sheets[0]?.data || []);
    };

    const handleSheetChange = (sheetName: string) => {
        if (!result) return;
        setSelectedSheet(sheetName);
        setData(getSheetByName(result, sheetName));
    };

    return (
        <div>
            <input type="file" accept=".xml" onChange={handleFileUpload} />

            {result && result.sheets.length > 1 && (
                <select value={selectedSheet} onChange={(e) => handleSheetChange(e.target.value)}>
                    {result.sheets.map(sheet => (
                        <option key={sheet.name} value={sheet.name}>
                            {sheet.name} ({sheet.data.length} rows)
                        </option>
                    ))}
                </select>
            )}

            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    );
};

// Usage in Storybook
import { fn } from '@storybook/test';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof FileUploader> = {
    component: FileUploader,
    args: {
        onSheetSelected: fn(),
        onDataParsed: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof FileUploader>;

export const Default: Story = {
    render: (args) => <FileUploader {...args} />,
};

export const WithPreselectedSheet: Story = {
    render: (args) => {
        const handleFile = async (file: File) => {
            const result = await parseXMLFile(file);
            args.onDataParsed(result.allData);

            // Get specific sheet
            const sheetData = getSheetByName(result, 'Users');
            args.onSheetSelected(sheetData);
        };

        return <FileUploader onFile={handleFile} />;
    },
};
