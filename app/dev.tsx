import { useEffect, useRef, useState } from 'react';
import { DevSettings, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { colors, space } from '@/constants/tokens';
import { IdleText } from '@/components/idle/IdleText';
import { MonoLabel } from '@/components/idle/MonoLabel';
import { Wordmark } from '@/components/idle/Wordmark';
import { useTasks } from '@/store/tasks';
import { useAuth } from '@/store/auth';
import { useDevOverride } from '@/lib/devOverride';
import { buildSampleWeek, buildOpenFillers } from '@/lib/devSeed';

const RESET_ARM_MS = 3000;
// idle.onboarded.v1 gates the three example seed tasks in store/tasks.tsx — pre-setting it
// makes a fresh boot land on an empty list instead of the welcome demo.
const SEED_GATE_KEY = 'idle.onboarded.v1';

type ArmedMode = null | 'full' | 'empty';

export default function Dev() {
  // Hard production gate. Expo Router registers every file in app/ as a route,
  // so without this check the destructive dev actions below (sign-out, wipe
  // every idle.* key, force burn) could be reached in a production build via
  // a crafted `idle://dev` deep link.
  useEffect(() => {
    if (!__DEV__) router.replace('/');
  }, []);
  if (!__DEV__) return null;

  const { devReplaceAll, devClearStorage, burn, tasks, openCount } = useTasks();
  const { signOut } = useAuth();
  const { set: setOverride } = useDevOverride();
  const [armedMode, setArmedMode] = useState<ArmedMode>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const seedWeek = () => {
    Haptics.selectionAsync();
    devReplaceAll(buildSampleWeek());
    router.back();
  };

  const fillCap = () => {
    Haptics.selectionAsync();
    const needed = Math.max(0, 5 - openCount);
    if (needed === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    const fillers = buildOpenFillers(needed);
    devReplaceAll([...tasks, ...fillers]);
    router.back();
  };

  const showLocked = () => {
    Haptics.selectionAsync();
    setOverride('locked');
    router.back();
  };

  const showBurn = () => {
    Haptics.selectionAsync();
    setOverride('burn');
    router.back();
  };

  const backToNormal = () => {
    Haptics.selectionAsync();
    setOverride('auto');
    router.back();
  };

  const burnNow = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    burn();
    router.back();
  };

  const arm = (mode: 'full' | 'empty') => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setArmedMode(mode);
    resetTimer.current = setTimeout(() => setArmedMode(null), RESET_ARM_MS);
  };

  const fire = async (skipSeed: boolean) => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
    await signOut().catch(() => {});
    await devClearStorage();
    if (skipSeed) {
      await AsyncStorage.setItem(SEED_GATE_KEY, '1');
    }
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.location.reload();
    } else {
      DevSettings.reload();
    }
  };

  const handleResetFull = () => {
    if (armedMode === 'full') {
      void fire(false);
      return;
    }
    arm('full');
  };

  const handleResetEmpty = () => {
    if (armedMode === 'empty') {
      void fire(true);
      return;
    }
    arm('empty');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={['top', 'bottom']}>
      <View
        style={{
          paddingHorizontal: space.s5,
          paddingTop: space.s3,
          paddingBottom: space.s3,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottomWidth: 0.5,
          borderBottomColor: colors.ink15,
        }}
      >
        <Wordmark size={20} />
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            router.back();
          }}
          hitSlop={12}
        >
          <IdleText variant="mono" tone="muted">
            CLOSE
          </IdleText>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: space.s5, paddingBottom: space.s8 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingTop: space.s5, paddingBottom: space.s4 }}>
          <MonoLabel style={{ marginBottom: space.s3 }}>DEV TOOLS</MonoLabel>
          <IdleText
            style={{
              fontFamily: 'BricolageGrotesque_800ExtraBold',
              fontSize: 32,
              letterSpacing: -0.04 * 32,
              lineHeight: 32,
              color: colors.ink,
            }}
          >
            Just for testing.
          </IdleText>
          <IdleText
            style={{
              fontFamily: 'BricolageGrotesque_400Regular',
              fontSize: 14,
              color: colors.ink50,
              marginTop: space.s3,
              lineHeight: 14 * 1.5,
              maxWidth: 320,
            }}
          >
            Only visible in development. Never ships to people.
          </IdleText>
        </View>

        <Section label="SAMPLE DATA">
          <Action
            title="Seed sample week."
            body="Replace the list with eight tasks spread across Mon–Fri — open, done, refused, burned. Useful for testing the Week screen."
            onPress={seedWeek}
          />
          <Action
            title="Fill the cap."
            body={`Top up to five open tasks (currently ${openCount}). Useful for testing the burn animation.`}
            onPress={fillCap}
          />
        </Section>

        <Section label="STATE PREVIEW">
          <Action
            title="Show locked screen."
            body="Force the 9pm takeover state. Same as long-press wordmark → locked."
            onPress={showLocked}
          />
          <Action
            title="Show burn screen."
            body="Force the Friday Burn ceremony. Reads your current open tasks."
            onPress={showBurn}
          />
          <Action
            title="Back to normal."
            body="Return to auto — the gate decides what to show based on the real clock."
            onPress={backToNormal}
          />
        </Section>

        <Section label="DESTRUCTIVE">
          <Action
            title="Burn now."
            body="Actually fire the burn function. Every open task becomes burned. The Week screen will reflect it."
            onPress={burnNow}
            tone="pink"
          />
          <Action
            title={armedMode === 'full' ? 'Tap again to confirm reset.' : 'Reset (full first-launch).'}
            body={
              armedMode === 'full'
                ? 'Wipes everything and reloads. The three welcome example tasks will appear after onboarding. Tap once more within 3 seconds.'
                : 'Wipes all idle.* storage and reloads. Matches what a brand-new App Store install sees — onboarding, then three example tasks. Double-tap required.'
            }
            onPress={handleResetFull}
            tone="pink"
            highlight={armedMode === 'full'}
          />
          <Action
            title={armedMode === 'empty' ? 'Tap again to confirm empty reset.' : 'Reset (empty list).'}
            body={
              armedMode === 'empty'
                ? 'Wipes everything but skips the welcome demo. After onboarding you land on an empty list. Tap once more within 3 seconds.'
                : 'Same as Reset, but the three example tasks are skipped. Useful for testing the empty state and the cap. Double-tap required.'
            }
            onPress={handleResetEmpty}
            tone="pink"
            highlight={armedMode === 'empty'}
          />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View
      style={{
        paddingTop: space.s5,
        paddingBottom: space.s2,
        borderTopWidth: 0.5,
        borderTopColor: colors.ink15,
      }}
    >
      <MonoLabel style={{ marginBottom: space.s3 }}>{label}</MonoLabel>
      {children}
    </View>
  );
}

function Action({
  title,
  body,
  onPress,
  tone,
  highlight,
}: {
  title: string;
  body: string;
  onPress: () => void;
  tone?: 'pink';
  highlight?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: space.s4,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.ink15,
        opacity: pressed ? 0.6 : 1,
        backgroundColor: highlight ? 'rgba(255, 61, 110, 0.08)' : 'transparent',
        paddingHorizontal: highlight ? space.s3 : 0,
        marginHorizontal: highlight ? -space.s3 : 0,
      })}
    >
      <IdleText
        style={{
          fontFamily: 'BricolageGrotesque_500Medium',
          fontSize: 17,
          letterSpacing: -0.015 * 17,
          lineHeight: 17 * 1.3,
          color: tone === 'pink' ? colors.pink : colors.ink,
          marginBottom: space.s1,
        }}
      >
        {title}
      </IdleText>
      <IdleText
        style={{
          fontFamily: 'BricolageGrotesque_400Regular',
          fontSize: 14,
          color: colors.ink50,
          lineHeight: 14 * 1.55,
          maxWidth: 380,
        }}
      >
        {body}
      </IdleText>
    </Pressable>
  );
}
