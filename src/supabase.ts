import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('חסרים משתני סביבה של Supabase');
}

export const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '');
export default supabase;
