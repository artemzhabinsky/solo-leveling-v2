-- Supabase SQL Table Setup & Full Access Permissions for Solo Leveling v2

CREATE TABLE IF NOT EXISTS public.solo_leveling_progress (
  id TEXT PRIMARY KEY,
  player_store TEXT,
  tasks_store TEXT,
  shop_store TEXT,
  daily_quests_store TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant Table Permissions to Anon & Authenticated Roles
GRANT ALL ON public.solo_leveling_progress TO anon;
GRANT ALL ON public.solo_leveling_progress TO authenticated;
GRANT ALL ON public.solo_leveling_progress TO service_role;

-- Disable Row Level Security to allow seamless cloud sync
ALTER TABLE public.solo_leveling_progress DISABLE ROW LEVEL SECURITY;
