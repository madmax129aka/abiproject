const User = require('../models/User');
const UserSkill = require('../models/UserSkill');
const Match = require('../models/Match');
const Notification = require('../models/Notification');

/**
 * Bipartite Matching Algorithm (Hopcroft-Karp inspired)
 * Finds optimal skill-swap matches between users
 */
const runMatchingForUser = async (userId) => {
  try {
    // Get current user's skills
    const userTeachSkills = await UserSkill.find({ userId, type: 'teach' });
    const userLearnSkills = await UserSkill.find({ userId, type: 'learn' });
    
    const userTeachNames = userTeachSkills.map(s => s.skillName.toLowerCase());
    const userLearnNames = userLearnSkills.map(s => s.skillName.toLowerCase());
    
    if (userTeachNames.length === 0 || userLearnNames.length === 0) {
      return [];
    }

    // Find all other active, non-banned users
    const currentUser = await User.findById(userId);
    const blockedIds = currentUser.blockedUsers || [];
    
    const otherUsers = await User.find({
      _id: { $ne: userId, $nin: blockedIds },
      isActive: true,
      isBanned: false,
      skillSetupComplete: true
    }).select('_id fullName reputationScore location');

    const matches = [];

    for (const otherUser of otherUsers) {
      // Check if current user is blocked by other user
      const otherUserFull = await User.findById(otherUser._id);
      if (otherUserFull.blockedUsers && otherUserFull.blockedUsers.includes(userId)) {
        continue;
      }

      const otherTeachSkills = await UserSkill.find({ userId: otherUser._id, type: 'teach' });
      const otherLearnSkills = await UserSkill.find({ userId: otherUser._id, type: 'learn' });
      
      const otherTeachNames = otherTeachSkills.map(s => s.skillName.toLowerCase());
      const otherLearnNames = otherLearnSkills.map(s => s.skillName.toLowerCase());

      // Bipartite matching: Check mutual benefit
      // User A teaches what User B wants AND User B teaches what User A wants
      const userCanTeachOther = userTeachNames.filter(s => otherLearnNames.includes(s));
      const otherCanTeachUser = otherTeachNames.filter(s => userLearnNames.includes(s));

      if (userCanTeachOther.length > 0 && otherCanTeachUser.length > 0) {
        // Calculate match percentage
        const totalUniqueSkills = new Set([
          ...userTeachNames, ...userLearnNames, 
          ...otherTeachNames, ...otherLearnNames
        ]).size;
        
        const mutualSkillCount = userCanTeachOther.length + otherCanTeachUser.length;
        const matchPercentage = Math.min(Math.round((mutualSkillCount / Math.max(totalUniqueSkills / 2, 1)) * 100), 100);

        // Common interests (both want to learn same things)
        const commonInterests = userLearnNames.filter(s => otherLearnNames.includes(s));

        matches.push({
          otherUserId: otherUser._id,
          otherUserName: otherUser.fullName,
          otherUserReputation: otherUser.reputationScore,
          otherUserLocation: otherUser.location,
          userATeaches: userCanTeachOther,
          userBTeaches: otherCanTeachUser,
          matchPercentage,
          commonInterests
        });
      }
    }

    // Sort by match percentage descending
    matches.sort((a, b) => b.matchPercentage - a.matchPercentage);

    // Upsert match documents
    for (const match of matches) {
      const [smallerId, largerId] = [userId.toString(), match.otherUserId.toString()].sort();
      
      const existingMatch = await Match.findOne({
        $or: [
          { userA: userId, userB: match.otherUserId },
          { userA: match.otherUserId, userB: userId }
        ]
      });

      if (!existingMatch) {
        await Match.create({
          userA: userId,
          userB: match.otherUserId,
          userATeaches: match.userATeaches,
          userBTeaches: match.userBTeaches,
          matchPercentage: match.matchPercentage,
          commonInterests: match.commonInterests,
          status: 'active'
        });

        // Notify both users
        await Notification.create({
          userId: match.otherUserId,
          type: 'match',
          message: `New skill match found! You and ${currentUser.fullName} can exchange skills.`,
          link: '/matches'
        });

        await Notification.create({
          userId: userId,
          type: 'match',
          message: `New skill match found! You and ${match.otherUserName} can exchange skills.`,
          link: '/matches'
        });
      } else {
        // Update existing match
        await Match.findByIdAndUpdate(existingMatch._id, {
          matchPercentage: match.matchPercentage,
          commonInterests: match.commonInterests,
          userATeaches: existingMatch.userA.toString() === userId.toString() ? match.userATeaches : match.userBTeaches,
          userBTeaches: existingMatch.userA.toString() === userId.toString() ? match.userBTeaches : match.userATeaches
        });
      }
    }

    return matches;
  } catch (error) {
    console.error('Matching error:', error);
    throw error;
  }
};

/**
 * Hopcroft-Karp BFS/DFS for maximum bipartite matching
 * Used for global matching optimization
 */
const hopcroftKarp = (graph, leftNodes, rightNodes) => {
  const pairU = {};
  const pairV = {};
  const dist = {};
  
  leftNodes.forEach(u => { pairU[u] = null; });
  rightNodes.forEach(v => { pairV[v] = null; });

  const bfs = () => {
    const queue = [];
    leftNodes.forEach(u => {
      if (pairU[u] === null) {
        dist[u] = 0;
        queue.push(u);
      } else {
        dist[u] = Infinity;
      }
    });

    let found = false;
    let head = 0;

    while (head < queue.length) {
      const u = queue[head++];
      const neighbors = graph[u] || [];
      
      for (const v of neighbors) {
        const pv = pairV[v];
        if (pv === null) {
          found = true;
        } else if (dist[pv] === Infinity) {
          dist[pv] = dist[u] + 1;
          queue.push(pv);
        }
      }
    }

    return found;
  };

  const dfs = (u) => {
    const neighbors = graph[u] || [];
    for (const v of neighbors) {
      const pv = pairV[v];
      if (pv === null || (dist[pv] === dist[u] + 1 && dfs(pv))) {
        pairV[v] = u;
        pairU[u] = v;
        return true;
      }
    }
    dist[u] = Infinity;
    return false;
  };

  let matching = 0;
  while (bfs()) {
    leftNodes.forEach(u => {
      if (pairU[u] === null && dfs(u)) {
        matching++;
      }
    });
  }

  return { matching, pairU, pairV };
};

module.exports = { runMatchingForUser, hopcroftKarp };
