import xlsx from 'xlsx';
import path from 'path';

const files = [
    '../Mentor 1.xlsx',
    '../Mentor 2.xlsx',
    '../Leetcode Platform .xlsx',
    '../mentor4.xlsx'
];

files.forEach(file => {
    try {
        const workbook = xlsx.readFile(file);
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        console.log(`--- File: ${file} ---`);
        console.log('Columns:', Object.keys(data[0] || {}));
        console.log('Sample Row:', data[0]);
    } catch (e) {
        console.log(`Failed to read ${file}: ${e.message}`);
    }
});
