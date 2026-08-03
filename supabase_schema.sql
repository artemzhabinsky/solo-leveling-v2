-- Supabase SQL Table Setup for Solo Leveling v2 Cloud Sync

CREATE TABLE IF NOT EXISTS public.solo_leveling_progress (
  id TEXT PRIMARY KEY,
  player_store TEXT,
  tasks_store TEXT,
  shop_store TEXT,
  daily_quests_store TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS & Allow Anonymous Read/Write Access
ALTER TABLE public.solo_leveling_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select" ON public.solo_leveling_progress
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON public.solo_leveling_progress
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON public.solo_leveling_progress
  FOR UPDATE USING (true);
