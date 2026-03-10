import axios from 'axios';

async function testLeaderboard() {
    try {
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'mentor1@admin.com',
            password: 'password123'
        });

        const token = loginRes.data.token;
        const res = await axios.get('http://localhost:5000/api/students/leaderboard', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const nithish = res.data.find(s => s.name && s.name.toLowerCase().includes('krishna s'));
        console.log('Nithish in API response:', nithish);
    } catch (e) {
        console.error('Error:', e.response ? e.response.data : e.message);
    }
}

testLeaderboard();
