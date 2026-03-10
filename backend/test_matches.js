import readExcel from './readExcel.js';
import fs from 'fs';

const roster = readExcel('Mentor 1.xlsx');
// find any student matching Nithish, nithish, progress
const matches = roster.filter(s =>
    (s.name && s.name.toLowerCase().includes('nithish')) ||
    (s.leetcodeUsername && s.leetcodeUsername.toLowerCase().includes('progress')) ||
    (s.leetcodeUsername && s.leetcodeUsername.toLowerCase().includes('nithish'))
);

console.log(matches);
