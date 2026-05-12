import { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, space } from '@/constants/tokens';
import { IdleText } from '@/components/idle/IdleText';
import { MonoLabel } from '@/components/idle/MonoLabel';
import { PinkRule } from '@/components/idle/PinkRule';
import { Wordmark } from '@/components/idle/Wordmark';
import { useTasks } from '@/store/tasks';
import { useAuth } from '@/store/auth';

// Legacy device-wide key. Kept for backward compat — if it's set we treat the
// current user as already onboarded on this device.
export const LEGACY_ONBOARDED_KEY = 'idle.onboarded.v3';
export const ONBOARDED_KEY_PREFIX = 'idle.onboarded.v3.';
export function onboardedKeyFor(userId: string) {
  return `${ONBOARDED_KEY_PREFIX}${userId}`;
}

type Card = {
  label: string;
  title: string;
  body: string;
};

const CARDS: Card[] = [
  {
    label: 'WELCOME',
    title: 'Less. Done.',
    body: 'A list that fights you back. Five things. Why? Because more is a lie.',
  },
  {
    label: 'THE CAP',
    title: 'Five.',
    body: 'Five tasks. Not six. Add a sixth and the list will refuse you.',
  },
  {
    label: 'THE WHY',
    title: 'Every task. A reason.',
    body: "If you can't write one sentence on why it matters, it doesn't get added.",
  },
  {
    label: 'FRIDAY',
    title: 'Everything burns.',
    body: 'On Friday at 7pm, the unfinished is deleted. No carry-over. No archive. Monday starts empty.',
  },
  {
    label: '9PM',
    title: 'The app closes.',
    body: 'After 9pm and on weekends, Idle refuses to open. No override. So should you.',
  },
];

const { width: SCREEN_W } = Dimensions.get('window');

export default function Onboarding() {
  const [index, setIndex] = useState(0);
  const scroller = useRef<ScrollView>(null);
  const { finishOnboarding } = useTasks();
  const { user } = useAuth();

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (next !== index) {
      Haptics.selectionAsync();
      setIndex(next);
    }
  };

  const advance = () => {
    if (index < CARDS.length - 1) {
      const nextIndex = index + 1;
      Haptics.selectionAsync();
      setIndex(nextIndex);
      scroller.current?.scrollTo({ x: nextIndex * SCREEN_W, animated: true });
    } else {
      finish();
    }
  };

  const finish = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (user) {
      await AsyncStorage.setItem(onboardedKeyFor(user.id), '1');
    }
    finishOnboarding();
    router.replace('/');
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
        }}
      >
        <Wordmark size={20} />
        <Pressable onPress={finish} hitSlop={12}>
          <IdleText variant="mono" tone="muted">
            SKIP
          </IdleText>
        </Pressable>
      </View>

      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={{ flex: 1 }}
      >
        {CARDS.map((card, i) => (
          <View
            key={i}
            style={{
              width: SCREEN_W,
              paddingHorizontal: space.s5,
              justifyContent: 'center',
            }}
          >
            <MonoLabel style={{ marginBottom: space.s4 }}>{card.label}</MonoLabel>
            <IdleText
              style={{
                fontFamily: 'BricolageGrotesque_800ExtraBold',
                fontSize: 48,
                letterSpacing: -0.045 * 48,
                lineHeight: 48 * 1.02,
                color: colors.ink,
                marginBottom: space.s4,
              }}
            >
              {card.title}
            </IdleText>
            <PinkRule width={36} height={4} style={{ marginBottom: space.s5 }} />
            <IdleText
              style={{
                fontFamily: 'BricolageGrotesque_400Regular',
                fontSize: 19,
                lineHeight: 19 * 1.55,
                color: colors.ink70,
                maxWidth: 320,
              }}
            >
              {card.body}
            </IdleText>
          </View>
        ))}
      </ScrollView>

      <View
        style={{
          paddingHorizontal: space.s5,
          paddingBottom: space.s2,
          paddingTop: space.s3,
        }}
      >
        <View style={{ flexDirection: 'row', gap: space.s2, marginBottom: space.s4 }}>
          {CARDS.map((_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 2,
                backgroundColor: i <= index ? colors.pink : colors.ink15,
              }}
            />
          ))}
        </View>

        <Pressable
          onPress={advance}
          style={({ pressed }) => ({
            backgroundColor: colors.ink,
            paddingVertical: space.s4,
            borderRadius: 4,
            alignItems: 'center',
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <IdleText
            style={{
              fontFamily: 'BricolageGrotesque_500Medium',
              fontSize: 15,
              color: colors.cream,
            }}
          >
            {index === CARDS.length - 1 ? 'Begin.' : 'Next.'}
          </IdleText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
