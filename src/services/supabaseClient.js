/**
 * Supabase Client Integration Service
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jenmywdeyhmssmufuqti.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rkJ9sC9UWKq94nAU15LHXg_Nfeg5RBL';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
