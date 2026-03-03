import xlsx from 'xlsx';

try {
    const workbook = xlsx.readFile('d:\\Leetcode Platfor m\\Leetcode Platform .xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);
    console.log('Columns:', Object.keys(data[0] || {}));
    console.log('First 3 rows:', data.slice(0, 3));
} catch (error) {
    console.error('Error reading Excel:', error);
}
