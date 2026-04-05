import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL  = 'https://gpxkhqlbmwpgpwfpxjdm.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdweGtocWxibXdwZ3B3ZnB4amRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NjM1ODcsImV4cCI6MjA5MDUzOTU4N30.qN_CaLoeqkakaRvSVH1xXEomxwU-UgIJd7LZgIK0jMw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage:     AsyncStorage,
    autoRefreshToken:  true,
    persistSession:    true,
    detectSessionInUrl: false,
  },
});

export const STORAGE_BUCKET = 'documents';
