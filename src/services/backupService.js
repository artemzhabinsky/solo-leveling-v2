/**
 * Backup & Restore Manager Service
 * Allows exporting and importing 100% of player progress, tasks, stats, shop, and analytics.
 */

export function exportBackupData() {
  const backup = {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    playerStore: localStorage.getItem('SOLO_LEVELING_PLAYER_STORE_V2'),
    tasksStore: localStorage.getItem('SOLO_LEVELING_TASKS_STORE_V2'),
    shopStore: localStorage.getItem('SOLO_LEVELING_SHOP_STORE_V2'),
    dailyQuestsStore: localStorage.getItem('SOLO_LEVELING_DAILY_QUESTS_STORE')
  };

  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().split('T')[0];
  const link = document.createElement('a');
  link.href = url;
  link.download = `solo_leveling_backup_${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function importBackupData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const backup = JSON.parse(event.target.result);

        if (!backup || !backup.version) {
          throw new Error('Некорректный формат файла бэкапа.');
        }

        if (backup.playerStore) localStorage.setItem('SOLO_LEVELING_PLAYER_STORE_V2', backup.playerStore);
        if (backup.tasksStore) localStorage.setItem('SOLO_LEVELING_TASKS_STORE_V2', backup.tasksStore);
        if (backup.shopStore) localStorage.setItem('SOLO_LEVELING_SHOP_STORE_V2', backup.shopStore);
        if (backup.dailyQuestsStore) localStorage.setItem('SOLO_LEVELING_DAILY_QUESTS_STORE', backup.dailyQuestsStore);

        resolve(true);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Ошибка чтения файла.'));
    reader.readAsText(file);
  });
}
