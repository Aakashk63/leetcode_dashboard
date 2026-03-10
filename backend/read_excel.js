import xlsx from 'xlsx';

const filepath = 'f:/Final Leetcode/Leetcode Platfor m/Mentor 1.xlsx';
const workbook = xlsx.readFile(filepath);
const sheetName = workbook.SheetNames[0];
const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

console.log('Headers:', Object.keys(data[0] || {}));

for (const row of data) {
    // Attempt to match Nithish
    const name = row['Name'] || row['name'] || row['Student Name'] || Object.values(row)[0];
    if (name && typeof name === 'string' && name.toLowerCase().includes('krishna s')) {
        console.log('Match found in Excel:', row);
    }
}
