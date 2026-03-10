import { fetchLeetCodeStats } from './services/leetcodeService.js';

async function test() {
    const stats = await fetchLeetCodeStats('nithishkrishna60');
    console.log(stats);
}

test();
