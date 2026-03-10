import readExcel from './readExcel.js';

const res = readExcel('Mentor 4 (3).xlsx');
console.log('Total read:', res.length);
console.log('Sample:', res.slice(0, 5));
