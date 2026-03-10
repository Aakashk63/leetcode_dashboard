import axios from 'axios';

const leetcodeAPI = 'https://leetcode.com/graphql';

export const fetchLeetCodeStats = async (username) => {
  const query = `
    query userProfile($username: String!) {
      matchedUser(username: $username) {
        submitStats {
          acSubmissionNum {
            difficulty
            count
          }
        }
        profile {
          reputation
        }
      }
      recentAcSubmissionList(username: $username, limit: 100) {
        id
        title
        timestamp
      }
    }
  `;

  try {
    const response = await axios.post(leetcodeAPI, {
      query,
      variables: { username }
    });

    const user = response.data.data.matchedUser;
    const recentAc = response.data.data.recentAcSubmissionList || [];
    if (!user) return null;

    const stats = user.submitStats.acSubmissionNum;
    const totalSolved = stats.find(d => d.difficulty === "All")?.count || 0;
    const easySolved = stats.find(d => d.difficulty === "Easy")?.count || 0;
    const mediumSolved = stats.find(d => d.difficulty === "Medium")?.count || 0;
    const hardSolved = stats.find(d => d.difficulty === "Hard")?.count || 0;

    // Today solved based on unique accepted problems in Asian timezone
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const todayUnique = new Set();
    recentAc.forEach(sub => {
      const dstr = new Date(parseInt(sub.timestamp) * 1000).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      if (dstr === todayStr) {
        todayUnique.add(sub.title);
      }
    });

    return {
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      todaySolved: todayUnique.size,
      recentAc
    };
  } catch (error) {
    console.error(`Error fetching stats for ${username}:`, error.message);
    return null;
  }
};

export const fetchRecentAcSubmissions = async (username) => {
  const query = `
    query getRecentAc($username: String!) {
      recentAcSubmissionList(username: $username, limit: 200) {
        id
        title
        timestamp
      }
    }
    `;

  try {
    const response = await axios.post(leetcodeAPI, {
      query,
      variables: { username }
    });
    return response.data.data.recentAcSubmissionList || [];
  } catch (error) {
    console.error(`Error fetching recent submissions for ${username}:`, error.message);
    return [];
  }
};

export const getDailySolved = async (username, selectedDate) => {
  const query = `
    query getRecentAc($username: String!) {
      recentAcSubmissionList(username: $username, limit: 100) {
        id
        title
        timestamp
      }
    }
  `;

  try {
    const response = await axios.post(leetcodeAPI, {
      query,
      variables: { username }
    });

    const recentAc = response.data.data.recentAcSubmissionList;
    if (!recentAc) return 0;

    const uniqueSolved = new Set();
    recentAc.forEach(sub => {
      const dstr = new Date(parseInt(sub.timestamp) * 1000).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      if (dstr === selectedDate) {
        uniqueSolved.add(sub.title);
      }
    });

    return uniqueSolved.size;
  } catch (error) {
    console.error(`Error fetching daily stats for ${username}:`, error.message);
    return 0;
  }
};

export const extractUsername = (url) => {
  if (!url) return null;
  const match = url.match(/leetcode\.com\/(?:u\/)?([^\/]+)/);
  return match ? match[1] : null;
};
