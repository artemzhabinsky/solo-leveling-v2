/**
 * Supabase Automatic Cloud Sync & Cloud Recovery Manager
 */
import { supabase } from './supabaseClient.js';

const TABLE_NAME = 'solo_leveling_progress';
const RECORD_ID = 'player_main_progress';

let autoSyncTimer = null;

export async function syncStateToCloud() {
  try {
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
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Supabase Sync Error:', err);
    return { success: false, error: err.message };
  }
}

export async function fetchStateFromCloud() {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', RECORD_ID)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    if (data) {
      if (data.player_store) localStorage.setItem('SOLO_LEVELING_PLAYER_STORE_V2', data.player_store);
      if (data.tasks_store) localStorage.setItem('SOLO_LEVELING_TASKS_STORE_V2', data.tasks_store);
      if (data.shop_store) localStorage.setItem('SOLO_LEVELING_SHOP_STORE_V2', data.shop_store);
      if (data.daily_quests_store) localStorage.setItem('SOLO_LEVELING_DAILY_QUESTS_STORE', data.daily_quests_store);

      return { success: true, updated_at: data.updated_at };
    }

    return { success: false, error: 'Запись не найдена' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function triggerDebouncedCloudSync() {
  if (autoSyncTimer) clearTimeout(autoSyncTimer);
  autoSyncTimer = setTimeout(() => {
    syncStateToCloud();
  }, 1500);
}
