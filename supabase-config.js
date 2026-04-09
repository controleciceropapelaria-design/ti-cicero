// ============================================
// SUPABASE CONFIG
// ============================================
// Copiar URL e anon key do Supabase Dashboard > Project Settings > API

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://motbranfevxvnjhkyqre.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vdGJyYW5mZXZ4dm5qaGt5cXJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMDQxNDMsImV4cCI6MjA4OTY4MDE0M30.hz1seXwjfcLaD1RUBK-Q6QtRsyNudg_DddrZUy2_uoY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
