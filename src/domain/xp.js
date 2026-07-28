/**
 * Pure XP & Level Calculation Domain Logic
 */

export function xpRequiredForLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.5));
}

export function applyXp(currentLevel, currentXp, xpGained) {
  let level = currentLevel;
  let xp = currentXp + xpGained;
  const previousLevel = level;

  while (xp >= xpRequiredForLevel(level)) {
    xp -= xpRequiredForLevel(level);
    level += 1;
  }

  return {
    level,
    xp,
    previousLevel,
    leveledUp: level > previousLevel,
    levelsGained: level - previousLevel
  };
}
