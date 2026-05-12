import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Surface a clear error during development. Production builds will fail
  // earlier in the build pipeline if the env vars are missing.
  console.warn(
    '[supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Add them to idle-app/.env.local and restart Expo with `npx expo start --clear`.',
  );
}

// During Expo Router's static pre-render (Node, no window) AsyncStorage's web
// shim explodes. Short-circuit there so the bundler can build the HTML shell.
const isBrowser = typeof window !== 'undefined';
const ssrSafeStorage = {
  getItem: (key: string) =>
    isBrowser ? AsyncStorage.getItem(key) : Promise.resolve(null),
  setItem: (key: string, value: string) =>
    isBrowser ? AsyncStorage.setItem(key, value) : Promise.resolve(),
  removeItem: (key: string) =>
    isBrowser ? AsyncStorage.removeItem(key) : Promise.resolve(),
};

export const supabase = createClient(SUPABASE_URL ?? '', SUPABASE_ANON_KEY ?? '', {
  auth: {
    storage: ssrSafeStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Native apps can't catch the URL fragment that magic links use, but we're on
    // password auth so this is moot. Web can still detect a session in URL.
    detectSessionInUrl: Platform.OS === 'web',
  },
});

export type DbTaskRow = {
  id: string;
  user_id: string;
  text: string;
  why: string;
  status: 'open' | 'done' | 'refused' | 'burned';
  created_at: number;
  added_at: string;
  closed_at: string | null;
  reclaimed_min: number | null;
  updated_at: string;
};
