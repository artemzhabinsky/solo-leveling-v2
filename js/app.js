/**
 * Application Entry Point & Global Controllers
 */
import { store } from './state.js';
import { ui } from './ui.js';
import { sound } from './sound.js';
import { taskMgr } from './tasks.js';
import { shopMgr } from './shop.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize UI, Tasks, and Shop
  ui.init();
  taskMgr.init();
  shopMgr.init();

  // Export Data JSON
  const btnExport = document.getElementById('btn-export-json');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(store.exportData());
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `Solo_Leveling_System_Save_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      ui.showToast('ЭКСПОРТ 💾', 'Данные успешно сохранены в JSON файл!');
    });
  }

  // Import Data JSON
  const fileImport = document.getElementById('file-import-json');
  const btnImportTrigger = document.getElementById('btn-import-json');

  if (btnImportTrigger && fileImport) {
    btnImportTrigger.addEventListener('click', () => fileImport.click());
    fileImport.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (store.importData(event.target.result)) {
            ui.renderAll();
            taskMgr.renderView();
            taskMgr.renderDailyQuests();
            shopMgr.renderShop();
            shopMgr.renderInventory();
            ui.showToast('ИМПОРТ 📥', 'Данные успешно загружены!');
          } else {
            ui.showToast('ОШИБКА ⚠️', 'Неверный формат JSON файла!');
          }
        };
        reader.readAsText(file);
      }
    });
  }

  // Reset Progress Button
  const btnReset = document.getElementById('btn-reset-data');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (confirm('Сбросить весь прогресс и вернуть начальные демо-данные?')) {
        store.resetAll();
        ui.renderAll();
        taskMgr.renderView();
        taskMgr.renderDailyQuests();
        shopMgr.renderShop();
        shopMgr.renderInventory();
        ui.showToast('СБРОС 🔄', 'Прогресс сброшен!');
      }
    });
  }

  // Sound Toggle Button
  const btnSound = document.getElementById('btn-toggle-sound');
  let soundOn = true;
  if (btnSound) {
    btnSound.addEventListener('click', () => {
      soundOn = !soundOn;
      sound.toggleSound(soundOn);
      btnSound.textContent = soundOn ? '🔊 ЗВУК: ВКЛ' : '🔇 ЗВУК: ВЫКЛ';
    });
  }
});
