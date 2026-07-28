/**
 * Task Rank Rewards Matrix (E, D, C, B, A, S)
 */

export const RANK_REWARDS = {
  E: { xp: 100, coins: 20 },
  D: { xp: 200, coins: 40 },
  C: { xp: 500, coins: 100 },
  B: { xp: 1000, coins: 200 },
  A: { xp: 1500, coins: 300 },
  S: { xp: 2500, coins: 500 },
};

export function getRewardForRank(rank) {
  return RANK_REWARDS[rank] || RANK_REWARDS.C;
}
