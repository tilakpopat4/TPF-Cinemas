import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bzfjxdioaehqdiibzsak.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_EXS1lrhdC0Bb1Jf3Xiohxw_c85nBIaH';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
