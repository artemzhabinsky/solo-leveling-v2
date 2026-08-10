/**
 * Supabase Automatic Cloud Sync & Cloud Recovery Manager
 */
import { supabase } from './supabaseClient.js';

const TABLE_NAME = 'solo_leveling_progress';
const RECORD_ID = 'player_main_progress';

let autoSyncTimer = null;
let syncStatusListeners = [];

export function subscribeSyncStatus(listener) {
  syncStatusListeners.push(listener);
  return () => {
    syncStatusListeners = syncStatusListeners.filter(l => l !== listener);
  };
}

function notifySyncStatus(status) {
  syncStatusListeners.forEach(l => l(status));
}

export async function syncStateToCloud() {
  try {
    notifySyncStatus('saving');
    const payload = {
      id: RECORD_ID,
      player_store: localStorage.getItem('SOLO_LEVELING_PLAYER_STORE_V2') || '{}',
      tasks_store: localStorage.getItem('SOLO_LEVELING_TASKS_STORE_V2') || '{}',
      shop_store: localStorage.getItem('SOLO_LEVELING_SHOP_STORE_V2') || '{}',
      daily_quests_store: localStorage.getItem('SOLO_LEVELING_DAILY_QUESTS_STORE') || '{}',
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from(TABLE_NAME)
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase Sync Warning:', error.message);
      notifySyncStatus('error');
      return { success: false, error: error.message };
    }

    notifySyncStatus('synced');
    return { success: true };
  } catch (err) {
    console.error('Supabase Sync Error:', err);
    notifySyncStatus('error');
    return { success: false, error: err.message };
  }
}

export async function fetchStateFromCloud() {
  try {
    notifySyncStatus('loading');
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', RECORD_ID)
      .single();

    if (error) {
      notifySyncStatus('error');
      return { success: false, error: error.message };
    }

    if (data) {
      if (data.player_store) localStorage.setItem('SOLO_LEVELING_PLAYER_STORE_V2', data.player_store);
      if (data.tasks_store) localStorage.setItem('SOLO_LEVELING_TASKS_STORE_V2', data.tasks_store);
      if (data.shop_store) localStorage.setItem('SOLO_LEVELING_SHOP_STORE_V2', data.shop_store);
      if (data.daily_quests_store) localStorage.setItem('SOLO_LEVELING_DAILY_QUESTS_STORE', data.daily_quests_store);

      notifySyncStatus('synced');
      return { success: true, updated_at: data.updated_at };
    }

    notifySyncStatus('error');
    return { success: false, error: 'Запись не найдена' };
  } catch (err) {
    notifySyncStatus('error');
    return { success: false, error: err.message };
  }
}

export function triggerDebouncedCloudSync() {
  notifySyncStatus('pending');
  if (autoSyncTimer) clearTimeout(autoSyncTimer);
  autoSyncTimer = setTimeout(() => {
    syncStateToCloud();
  }, 1000);
}
