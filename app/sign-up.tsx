import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { space } from '@/constants/tokens';
import { useAuth } from '@/store/auth';
import {
  AuthShell,
  AuthField,
  AuthPrimaryButton,
  AuthLink,
  AuthErrorText,
} from '@/components/idle/AuthShell';

export default function SignUp() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const ready = email.trim().length > 0 && password.length >= 6;

  const submit = async () => {
    if (!ready) return;
    setBusy(true);
    setError(null);
    const result = await signUp(email, password);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    if (result.needsConfirmation) {
      setSent(true);
      return;
    }
    // Confirmation is off — Supabase auto-signed us in. Head to the home gate.
    router.replace('/');
  };

  if (sent) {
    return (
      <AuthShell
        label="Almost there"
        title="Check your inbox."
        subtitle="We sent a confirmation link to your email. Tap it, then come back here to sign in."
      >
        <AuthPrimaryButton
          label="Back to sign in."
          onPress={() => router.replace('/sign-in')}
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      label="Create account"
      title="Make a home for your tasks."
      subtitle="One person, one list, on every phone you sign in to."
    >
      <AuthField
        label="EMAIL"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        textContentType="emailAddress"
        autoFocus
        returnKeyType="next"
      />
      <AuthField
        label="PASSWORD"
        value={password}
        onChangeText={setPassword}
        placeholder="At least six characters."
        secure
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={submit}
      />

      <AuthErrorText message={error} />

      <AuthPrimaryButton
        label="Create account."
        onPress={submit}
        busy={busy}
        disabled={!ready}
      />

      <View style={{ marginTop: space.s5 }}>
        <AuthLink
          label="Already have an account? Sign in."
          onPress={() => router.replace('/sign-in')}
        />
      </View>
    </AuthShell>
  );
}
