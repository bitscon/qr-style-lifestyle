
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://vbenovmrqezlhzyxejdb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiZW5vdm1ycWV6bGh6eXhlamRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4MTAzMjYsImV4cCI6MjA1NTM4NjMyNn0.WSLzdYKnLJ96S9gVE19TWGMdVC96U2F4vcbGIcIFeIg";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
