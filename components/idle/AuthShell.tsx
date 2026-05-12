import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii, space } from '@/constants/tokens';
import { IdleText } from './IdleText';
import { Wordmark } from './Wordmark';
import { PinkRule } from './PinkRule';

export function AuthShell({
  label,
  title,
  subtitle,
  children,
}: {
  label: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: space.s5,
            paddingTop: space.s6,
            paddingBottom: space.s7,
            flexGrow: 1,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Wordmark size={28} />
          <View style={{ marginTop: space.s8 }} />
          <IdleText
            variant="mono"
            tone="muted"
            style={{ marginBottom: space.s3 }}
          >
            {label.toUpperCase()}
          </IdleText>
          <IdleText
            style={{
              fontFamily: 'BricolageGrotesque_800ExtraBold',
              fontSize: 36,
              letterSpacing: -0.04 * 36,
              lineHeight: 36 * 1.05,
              color: colors.ink,
            }}
          >
            {title}
          </IdleText>
          {subtitle ? (
            <IdleText
              style={{
                fontFamily: 'BricolageGrotesque_400Regular',
                fontSize: 16,
                color: colors.ink50,
                lineHeight: 16 * 1.55,
                marginTop: space.s3,
                maxWidth: 360,
              }}
            >
              {subtitle}
            </IdleText>
          ) : null}
          <PinkRule width={30} height={3} style={{ marginTop: space.s5, marginBottom: space.s6 }} />
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function AuthField({
  label,
  value,
  onChangeText,
  placeholder,
  secure,
  autoFocus,
  keyboardType,
  returnKeyType,
  onSubmitEditing,
  autoCapitalize,
  textContentType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secure?: boolean;
  autoFocus?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: () => void;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  textContentType?: TextInputProps['textContentType'];
}) {
  const filled = value.length > 0;
  return (
    <View style={{ marginBottom: space.s5 }}>
      <IdleText
        variant="mono"
        style={{ color: filled ? colors.ink : colors.ink50, marginBottom: space.s2 }}
      >
        {label}
      </IdleText>
      <View
        style={{
          borderBottomWidth: 1,
          borderBottomColor: filled ? colors.ink : colors.ink30,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.ink30}
          secureTextEntry={secure}
          autoFocus={autoFocus}
          autoCorrect={false}
          spellCheck={false}
          autoCapitalize={autoCapitalize ?? 'none'}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          textContentType={textContentType}
          style={{
            fontFamily: 'Manrope_500Medium',
            fontSize: 17,
            color: colors.ink,
            paddingVertical: space.s3,
          }}
        />
      </View>
    </View>
  );
}

export function AuthPrimaryButton({
  label,
  onPress,
  busy,
  disabled,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
}) {
  const isDisabled = disabled || busy;
  return (
    <Pressable
      onPress={() => {
        if (isDisabled) return;
        onPress();
      }}
      disabled={isDisabled}
      style={({ pressed }) => ({
        backgroundColor: isDisabled ? colors.creamSoft : colors.ink,
        borderRadius: radii.sm,
        paddingVertical: space.s3 + 4,
        alignItems: 'center',
        opacity: pressed && !isDisabled ? 0.85 : 1,
      })}
    >
      <IdleText
        style={{
          fontFamily: 'BricolageGrotesque_500Medium',
          fontSize: 16,
          color: isDisabled ? colors.ink30 : colors.cream,
        }}
      >
        {busy ? 'Working…' : label}
      </IdleText>
    </Pressable>
  );
}

export function AuthLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: space.s2,
        opacity: pressed ? 0.6 : 1,
      })}
      hitSlop={8}
    >
      <IdleText
        style={{
          fontFamily: 'BricolageGrotesque_400Regular',
          fontSize: 15,
          color: colors.ink70,
        }}
      >
        {label}
      </IdleText>
    </Pressable>
  );
}

export function AuthErrorText({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View style={{ marginBottom: space.s4 }}>
      <IdleText
        style={{
          fontFamily: 'Manrope_500Medium',
          fontSize: 14,
          color: colors.pink,
          lineHeight: 14 * 1.55,
        }}
      >
        {message}
      </IdleText>
    </View>
  );
}
