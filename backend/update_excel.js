import xlsx from 'xlsx';
import fs from 'fs';

const filepath = 'f:/Final Leetcode/Leetcode Platfor m/Mentor 1.xlsx';
const workbook = xlsx.readFile(filepath);
const sheetName = workbook.SheetNames[0];
const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

let updated = false;

for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const nameKey = Object.keys(row).find(k => k.toLowerCase().includes('name'));
    const urlKey = Object.keys(row).find(k => k.toLowerCase().includes('leetcode'));

    if (nameKey && typeof row[nameKey] === 'string' && row[nameKey].toLowerCase().includes('krishna s')) {
        console.log('Found:', row);
        if (urlKey) {
            row[urlKey] = 'https://leetcode.com/u/nithishkrishna60/';
            updated = true;
        }
    }
}

if (updated) {
    const newWs = xlsx.utils.json_to_sheet(data);
    workbook.Sheets[sheetName] = newWs;
    xlsx.writeFile(workbook, filepath);
    console.log('Successfully written updated Excel file!');
} else {
    console.log('No update performed.');
}
