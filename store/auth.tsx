import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';

// The URL Supabase sends people back to after they tap the confirm-email or
// reset-password link. `idle://` is our app's scheme (see app.json), so the OS
// opens Idle directly instead of trying to load a web page.
const REDIRECT_URL = Linking.createURL('/');

type AuthResult = { ok: true } | { ok: false; message: string };
type SignUpResult = { ok: true; needsConfirmation: boolean } | { ok: false; message: string };

type AuthContextValue = {
  hydrated: boolean;
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResult>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// RFC-ish email shape check. We're not trying to validate that the address is
// real (only the confirmation email can do that) — just rejecting obvious
// garbage before it hits the network.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 128;
const MAX_EMAIL = 254;

function isValidEmail(email: string): boolean {
  return email.length > 0 && email.length <= MAX_EMAIL && EMAIL_RE.test(email);
}

function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD) {
    return `Your password needs to be at least ${MIN_PASSWORD} characters.`;
  }
  if (password.length > MAX_PASSWORD) {
    return `Your password is too long. Keep it under ${MAX_PASSWORD} characters.`;
  }
  return null;
}

function friendlyError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? '');
  const lower = raw.toLowerCase();
  if (lower.includes('invalid login credentials')) return "That email and password don't match. Try again.";
  if (lower.includes('user already registered')) return 'An account with this email already exists. Sign in instead.';
  if (lower.includes('email not confirmed')) return 'Check your inbox and tap the confirm link before signing in.';
  if (lower.includes('password should be')) return `Your password needs to be at least ${MIN_PASSWORD} characters.`;
  if (lower.includes('rate limit') || lower.includes('too many')) return 'Too many tries. Wait a minute and try again.';
  if (lower.includes('network')) return "We couldn't reach the server. Check your signal and try again.";
  return raw || 'Something went wrong. Try again.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setHydrated(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next ?? null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Handle the URL the OS hands us when someone taps a confirm-email or
  // password-reset link. Supabase's PKCE flow puts a `code` in the URL; we
  // exchange it for a real session and the auth listener above takes over.
  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url) return;
      const { queryParams } = Linking.parse(url);
      const code = typeof queryParams?.code === 'string' ? queryParams.code : null;
      if (!code) return;
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) console.warn('[auth] exchangeCodeForSession failed', error.message);
    };

    Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener('url', e => handleUrl(e.url));
    return () => sub.remove();
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      return { ok: false, message: "That doesn't look like an email." };
    }
    if (password.length === 0 || password.length > MAX_PASSWORD) {
      return { ok: false, message: 'Type your password.' };
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    if (error) return { ok: false, message: friendlyError(error) };
    return { ok: true };
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<SignUpResult> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      return { ok: false, message: "That doesn't look like an email." };
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      return { ok: false, message: passwordError };
    }
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { emailRedirectTo: REDIRECT_URL },
    });
    if (error) return { ok: false, message: friendlyError(error) };
    // When confirmation is required, Supabase returns user but no session.
    // When confirmation is off, both are set and the listener auto-signs us in.
    const needsConfirmation = !data.session;
    return { ok: true, needsConfirmation };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      return { ok: false, message: "That doesn't look like an email." };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: REDIRECT_URL,
    });
    if (error) return { ok: false, message: friendlyError(error) };
    return { ok: true };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      hydrated,
      session,
      user: session?.user ?? null,
      signIn,
      signUp,
      signOut,
      resetPassword,
    }),
    [hydrated, session, signIn, signUp, signOut, resetPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
