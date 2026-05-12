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

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const ready = email.trim().length > 0;

  const submit = async () => {
    if (!ready) return;
    setBusy(true);
    setError(null);
    const result = await resetPassword(email);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <AuthShell
        label="Reset link sent"
        title="Check your inbox."
        subtitle="We sent a reset link to that email. Tap it and pick a new password."
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
      label="Reset password"
      title="Forgot it. It happens."
      subtitle="Type your email. We'll send a link to reset it."
    >
      <AuthField
        label="EMAIL"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        textContentType="emailAddress"
        autoFocus
        returnKeyType="go"
        onSubmitEditing={submit}
      />

      <AuthErrorText message={error} />

      <AuthPrimaryButton
        label="Send reset link."
        onPress={submit}
        busy={busy}
        disabled={!ready}
      />

      <View style={{ marginTop: space.s5 }}>
        <AuthLink
          label="Back to sign in."
          onPress={() => router.replace('/sign-in')}
        />
      </View>
    </AuthShell>
  );
}
