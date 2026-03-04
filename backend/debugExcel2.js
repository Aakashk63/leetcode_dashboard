import xlsx from 'xlsx';
import path from 'path';

const files = [
    '../Mentor 1.xlsx',
    '../mentor4.xlsx'
];

files.forEach(file => {
    try {
        const workbook = xlsx.readFile(file);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);
        console.log(`FILE: ${file}`);
        if (data.length > 0) {
            console.log('KEYS:', Object.keys(data[0]));
            // Show first 2 rows
            data.slice(0, 2).forEach((row, i) => {
                console.log(`ROW ${i}:`, JSON.stringify(row));
            });
        } else {
            console.log('NO DATA FOUND');
        }
    } catch (e) {
        console.log(`ERROR ${file}: ${e.message}`);
    }
});
