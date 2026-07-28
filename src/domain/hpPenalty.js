/**
 * HP Penalty Calculation & Daily Quest Checking Logic
 */

export function checkHpPenalties({ currentHp, lastCheckDate, todayDate, completedDailyDates }) {
  if (!lastCheckDate || lastCheckDate === todayDate) {
    return { hp: currentHp, lastCheckDate: todayDate, penaltyTriggered: false };
  }

  let hp = currentHp;
  let checkDate = new Date(lastCheckDate);
  const today = new Date(todayDate);
  let penaltyTriggered = false;

  // Move day by day from lastCheckDate + 1 to yesterday
  while (checkDate < today) {
    checkDate.setDate(checkDate.getDate() + 1);
    const dateStr = checkDate.toISOString().split('T')[0];

    if (dateStr === todayDate) break;

    const hadCompletion = completedDailyDates.includes(dateStr);
    if (!hadCompletion) {
      hp = Math.max(0, hp - 1);
      if (hp === 0) {
        penaltyTriggered = true;
        break;
      }
    }
  }

  return {
    hp,
    lastCheckDate: todayDate,
    penaltyTriggered
  };
}
