import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, radii, space } from '@/constants/tokens';
import { useTasks } from '@/store/tasks';
import { IdleText } from '@/components/idle/IdleText';
import { PinkRule } from '@/components/idle/PinkRule';
import { sharpenWhy } from '@/lib/ai';
import { closeModal } from '@/lib/closeModal';

type SharpenStatus = 'idle' | 'loading' | 'shown' | 'noop' | 'gone';

export default function AddTask() {
  const { addTask } = useTasks();
  const [text, setText] = useState('');
  const [why, setWhy] = useState('');
  const [focused, setFocused] = useState<'task' | 'why' | null>(null);

  const [sharpenStatus, setSharpenStatus] = useState<SharpenStatus>('idle');
  const [sharpenSuggestion, setSharpenSuggestion] = useState<string | null>(null);

  const ready = text.trim().length > 0 && why.trim().length > 0;
  const taskOnly = text.trim().length > 0 && why.trim().length === 0;

  // If the user wipes the why field, reset Sharpen so they can try again on the new draft.
  useEffect(() => {
    if (why.trim().length === 0 && sharpenStatus !== 'idle') {
      setSharpenStatus('idle');
      setSharpenSuggestion(null);
    }
  }, [why, sharpenStatus]);

  // After "noop", fade the chip away after a beat.
  useEffect(() => {
    if (sharpenStatus !== 'noop') return;
    const t = setTimeout(() => setSharpenStatus('gone'), 1800);
    return () => clearTimeout(t);
  }, [sharpenStatus]);

  const submit = () => {
    if (!ready) return;
    if (addTask(text, why)) closeModal();
  };

  const onSharpen = async () => {
    if (sharpenStatus !== 'idle') return;
    if (!text.trim() || !why.trim()) return;
    Haptics.selectionAsync();
    setSharpenStatus('loading');
    const out = await sharpenWhy(text, why);
    if (out) {
      setSharpenSuggestion(out);
      setSharpenStatus('shown');
    } else {
      setSharpenStatus('noop');
    }
  };

  const acceptSharpen = () => {
    if (sharpenSuggestion) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setWhy(sharpenSuggestion);
    }
    setSharpenStatus('gone');
  };

  const dismissSharpen = () => {
    Haptics.selectionAsync();
    setSharpenStatus('gone');
  };

  const canShowSharpen =
    text.trim().length > 0 &&
    why.trim().length > 0 &&
    sharpenStatus !== 'gone';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: space.s5,
            paddingTop: space.s4,
            paddingBottom: space.s6,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ alignItems: 'center', marginBottom: space.s5 }}>
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.ink15,
              }}
            />
          </View>

          <IdleText
            variant="mono"
            tone="muted"
            style={{ marginBottom: space.s4 }}
          >
            ADD A TASK
          </IdleText>

          <IdleText
            style={{
              fontFamily: 'BricolageGrotesque_800ExtraBold',
              fontSize: 32,
              letterSpacing: -0.04 * 32,
              lineHeight: 32 * 1.05,
              color: colors.ink,
              marginBottom: space.s7,
            }}
          >
            What is this for?
          </IdleText>

          <Field
            label="THE TASK"
            focused={focused === 'task'}
            filled={text.trim().length > 0}
          >
            <TextInput
              value={text}
              onChangeText={setText}
              onFocus={() => setFocused('task')}
              onBlur={() => setFocused(null)}
              placeholder="One sentence."
              placeholderTextColor={colors.ink30}
              maxLength={70}
              style={inputStyle}
              autoFocus
              returnKeyType="next"
            />
          </Field>

          <Field
            label="THE REASON"
            focused={focused === 'why'}
            filled={why.trim().length > 0}
          >
            <TextInput
              value={why}
              onChangeText={setWhy}
              onFocus={() => setFocused('why')}
              onBlur={() => setFocused(null)}
              placeholder="why is this on the list?"
              placeholderTextColor={colors.ink30}
              maxLength={80}
              style={[inputStyle, { fontStyle: 'italic' }]}
              returnKeyType="done"
              onSubmitEditing={submit}
            />
          </Field>

          {canShowSharpen ? (
            <View style={{ marginTop: -space.s3, marginBottom: space.s4 }}>
              {sharpenStatus === 'idle' ? (
                <Pressable onPress={onSharpen} hitSlop={10} style={chipPressable}>
                  <Dot color={colors.pink} />
                  <IdleText variant="mono" style={{ color: colors.ink70 }}>
                    SHARPEN.
                  </IdleText>
                </Pressable>
              ) : null}

              {sharpenStatus === 'loading' ? (
                <View style={chipRow}>
                  <Dot color={colors.ink30} />
                  <IdleText variant="mono" style={{ color: colors.ink50 }}>
                    SHARPENING.
                  </IdleText>
                </View>
              ) : null}

              {sharpenStatus === 'noop' ? (
                <View style={chipRow}>
                  <Dot color={colors.ink30} />
                  <IdleText variant="mono" style={{ color: colors.ink50 }}>
                    ALREADY TIGHT.
                  </IdleText>
                </View>
              ) : null}

              {sharpenStatus === 'shown' && sharpenSuggestion ? (
                <View
                  style={{
                    backgroundColor: colors.creamSoft,
                    paddingVertical: space.s3,
                    paddingHorizontal: space.s4,
                    borderRadius: radii.sm,
                    borderLeftWidth: 2,
                    borderLeftColor: colors.pink,
                  }}
                >
                  <IdleText
                    style={{
                      fontFamily: 'Manrope_500Medium',
                      fontSize: 15,
                      lineHeight: 15 * 1.4,
                      color: colors.ink,
                      fontStyle: 'italic',
                      marginBottom: space.s3,
                    }}
                  >
                    {sharpenSuggestion}
                  </IdleText>
                  <View style={{ flexDirection: 'row', gap: space.s5 }}>
                    <Pressable onPress={dismissSharpen} hitSlop={8}>
                      <IdleText variant="mono" style={{ color: colors.ink50 }}>
                        ✕  KEEP MINE
                      </IdleText>
                    </Pressable>
                    <Pressable onPress={acceptSharpen} hitSlop={8}>
                      <IdleText variant="mono" style={{ color: colors.pink }}>
                        ✓  USE THIS
                      </IdleText>
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </View>
          ) : null}

          <PinkRule width={30} height={3} style={{ marginVertical: space.s5 }} />

          <View style={{ flexDirection: 'row', gap: space.s3 }}>
            <Pressable
              onPress={() => closeModal()}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: space.s3 + 2,
                borderRadius: radii.sm,
                borderWidth: 1,
                borderColor: colors.ink,
                alignItems: 'center',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <IdleText
                style={{
                  fontFamily: 'BricolageGrotesque_500Medium',
                  fontSize: 15,
                  color: colors.ink,
                }}
              >
                Cancel.
              </IdleText>
            </Pressable>
            <Pressable
              onPress={submit}
              disabled={!ready}
              style={({ pressed }) => ({
                flex: 1.6,
                paddingVertical: space.s3 + 2,
                borderRadius: radii.sm,
                backgroundColor: ready ? colors.pink : colors.creamSoft,
                alignItems: 'center',
                opacity: pressed && ready ? 0.85 : 1,
              })}
            >
              <IdleText
                style={{
                  fontFamily: 'BricolageGrotesque_500Medium',
                  fontSize: 15,
                  color: ready ? colors.ink : colors.ink30,
                }}
              >
                {ready ? 'Add it.' : taskOnly ? 'Need a why.' : 'No reason, no task.'}
              </IdleText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  focused,
  filled,
  children,
}: {
  label: string;
  focused: boolean;
  filled: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: space.s5 }}>
      <IdleText
        variant="mono"
        style={{
          color: focused ? colors.pink : colors.ink50,
          marginBottom: space.s2,
        }}
      >
        {label}
      </IdleText>
      <View
        style={{
          borderBottomWidth: 1,
          borderBottomColor: focused ? colors.pink : filled ? colors.ink : colors.ink30,
        }}
      >
        {children}
      </View>
    </View>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <View
      style={{
        width: 6,
        height: 6,
        borderRadius: 999,
        backgroundColor: color,
      }}
    />
  );
}

const chipRow = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: space.s2,
  paddingVertical: space.s2,
};

const chipPressable = {
  ...chipRow,
  alignSelf: 'flex-start' as const,
};

const inputStyle = {
  fontFamily: 'Manrope_500Medium',
  fontSize: 17,
  color: colors.ink,
  paddingVertical: space.s3,
} as const;
