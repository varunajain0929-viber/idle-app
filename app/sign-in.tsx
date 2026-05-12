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

export default function SignIn() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = email.trim().length > 0 && password.length > 0;

  const submit = async () => {
    if (!ready) return;
    setBusy(true);
    setError(null);
    const result = await signIn(email, password);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.replace('/');
  };

  return (
    <AuthShell label="Sign in" title="Welcome back.">
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
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
      />

      <AuthErrorText message={error} />

      <AuthPrimaryButton
        label="Sign in."
        onPress={submit}
        busy={busy}
        disabled={!ready}
      />

      <View style={{ marginTop: space.s5, gap: space.s2 }}>
        <AuthLink
          label="Forgot password?"
          onPress={() => router.push('/forgot-password')}
        />
        <AuthLink
          label="Need an account? Sign up."
          onPress={() => router.push('/sign-up')}
        />
      </View>
    </AuthShell>
  );
}
