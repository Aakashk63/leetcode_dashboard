import axios from 'axios';

async function testLeaderboard() {
    console.time('leaderboard');
    try {
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'mentor1@admin.com',
            password: 'password123'
        });

        const token = loginRes.data.token;
        const res = await axios.get('http://localhost:5000/api/students/leaderboard', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.timeEnd('leaderboard');
        console.log(`Fetched ${res.data.length} students instantly!`);
    } catch (e) {
        console.timeEnd('leaderboard');
        console.error('Error:', e.response ? e.response.data : e.message);
    }
}

testLeaderboard();
