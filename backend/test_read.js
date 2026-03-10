import readExcel from './readExcel.js';
import fs from 'fs';

const roster = readExcel('Mentor 1.xlsx');
const nithish = roster.find(s => s.name && s.name.toLowerCase().includes('krishna s'));
fs.writeFileSync('out_node.txt', JSON.stringify(nithish, null, 2), 'utf8');
