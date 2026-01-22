
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wegczzzysvvkvchflble.supabase.co';
const supabaseKey = 'sb_publishable_71hSO3THx8RHWA2qfmfuSw_BhHRwepD';

export const supabase = createClient(supabaseUrl, supabaseKey);
