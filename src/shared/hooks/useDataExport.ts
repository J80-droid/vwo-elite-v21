// Utility hook for exporting data
export const useDataExport = () => {
    /**
     * Converts an array of objects to a CSV string and triggers a download.
     * @param data Array of objects (e.g. key-value pairs)
     * @param filename Desired filename without extension
     */
    const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
        if (!data || data.length === 0) {
            console.warn("No data to export");
            return;
        }

        const headers = Object.keys(data[0] || {});
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(fieldName => {
                const val = row[fieldName] as string | number | undefined;
                return typeof val === 'string' ? `"${val}"` : String(val ?? '');
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `${filename}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    /**
     * Captures a DOM element as a PNG (mock implementation for robustness demo).
     * real html2canvas integration would be here.
     */
    const exportToPNG = (elementId: string, filename: string) => {
        // In a real implementation: import html2canvas from 'html2canvas'
        console.log(`Exporting ${elementId} to ${filename}.png (Mock)`);
        alert("Snapshot feature requires html2canvas dependency (simulated).");
    };

    return { exportToCSV, exportToPNG };
};
