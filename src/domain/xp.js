/**
 * Calibrated 30-Level Smooth XP Progression Domain Logic
 * Level 1 -> Level 2 requires 2500 XP (exact match for 1 S-Rank Task).
 * Higher levels scale smoothly up to Level 30.
 */

export function xpRequiredForLevel(level) {
  const clamped = Math.max(1, Math.min(level, 30));
  // Smooth 18% growth curve per level starting at 2,500 XP
  return Math.round(2500 * Math.pow(1.18, clamped - 1));
}

export function applyXp(currentLevel, currentXp, xpGained) {
  let level = currentLevel;
  let xp = currentXp + xpGained;
  const previousLevel = level;

  while (level < 30 && xp >= xpRequiredForLevel(level)) {
    xp -= xpRequiredForLevel(level);
    level += 1;
  }

  // Max level cap check
  if (level >= 30) {
    level = 30;
  }

  return {
    level,
    xp,
    previousLevel,
    leveledUp: level > previousLevel,
    levelsGained: level - previousLevel
  };
}
