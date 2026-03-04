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
        submissionCalendar
      }
    }
    `;

  try {
    const response = await axios.post(leetcodeAPI, {
      query,
      variables: { username }
    });

    const user = response.data.data.matchedUser;
    if (!user) return null;

    const stats = user.submitStats.acSubmissionNum;
    const totalSolved = stats.find(d => d.difficulty === "All")?.count || 0;
    const easySolved = stats.find(d => d.difficulty === "Easy")?.count || 0;
    const mediumSolved = stats.find(d => d.difficulty === "Medium")?.count || 0;
    const hardSolved = stats.find(d => d.difficulty === "Hard")?.count || 0;

    const calendar = JSON.parse(user.submissionCalendar);

    // Today solved (UTC-based day)
    const today = Math.floor(Date.now() / 1000 / 86400) * 86400;
    const todaySolved = calendar[today] || 0;

    return {
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      todaySolved,
      calendar
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
  query userProfile($username: String!) {
    matchedUser(username: $username) {
      submissionCalendar
    }
  }
  `;

  try {
    const response = await axios.post(leetcodeAPI, {
      query,
      variables: { username }
    });

    const user = response.data.data.matchedUser;
    if (!user) return 0;

    const calendar = JSON.parse(user.submissionCalendar);

    // Normalize selectedDate (YYYY-MM-DD) to UTC timestamp at 00:00:00
    const dateObj = new Date(selectedDate);
    const utcTimestamp = Math.floor(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate()) / 1000);

    return calendar[utcTimestamp] || 0;
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
