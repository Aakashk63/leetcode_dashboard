import xlsx from 'xlsx';

const filepath = 'f:/Final Leetcode/Leetcode Platfor m/Mentor 4 (3).xlsx';
const workbook = xlsx.readFile(filepath);
const sheetName = workbook.SheetNames[0];
const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

console.log('Headers:', Object.keys(data[0] || {}));
console.log('Sample rows:', data.slice(0, 3));
