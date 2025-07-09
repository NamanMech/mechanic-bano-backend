// src/utils/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://owmdhrvscnbiuvoihozb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93bWRocnZzY25iaXV2b2lob3piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNTc3NzAsImV4cCI6MjA2NzYzMzc3MH0.uff-HrH8DnOC8VGffBSYXzmV_Ur2JQWnHDM0woudSG4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
