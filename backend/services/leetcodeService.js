import { GraphQLClient, gql } from 'graphql-request';

const leetcodeAPI = 'https://leetcode.com/graphql';
const client = new GraphQLClient(leetcodeAPI);

const getUserStatsQuery = gql`
  query getUserProfile($username: String!) {
    matchedUser(username: $username) {
      submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
        }
      }
    }
  }
`;

const recentAcQuery = gql`
  query getRecentAc($username: String!) {
    recentAcSubmissionList(username: $username, limit: 200) {
      id
      title
      timestamp
    }
  }
`;

export const fetchLeetCodeStats = async (username) => {
  try {
    const data = await client.request(getUserStatsQuery, { username });
    if (!data.matchedUser) return null;

    const stats = data.matchedUser.submitStatsGlobal.acSubmissionNum;
    const totals = {
      All: 0,
      Easy: 0,
      Medium: 0,
      Hard: 0
    };

    stats.forEach(stat => {
      totals[stat.difficulty] = stat.count;
    });

    return {
      totalSolved: totals.All,
      easySolved: totals.Easy,
      mediumSolved: totals.Medium,
      hardSolved: totals.Hard
    };
  } catch (error) {
    console.error(`Error fetching stats for ${username}:`, error.message);
    return null;
  }
};

export const fetchRecentAcSubmissions = async (username) => {
  try {
    const data = await client.request(recentAcQuery, { username });
    return data.recentAcSubmissionList || [];
  } catch (error) {
    console.error(`Error fetching recent submissions for ${username}:`, error.message);
    return [];
  }
};

export const extractUsername = (url) => {
  if (!url) return null;
  // Handle formats like https://leetcode.com/u/username/ or https://leetcode.com/username
  const match = url.match(/leetcode\.com\/(?:u\/)?([^\/]+)/);
  return match ? match[1] : null;
};
