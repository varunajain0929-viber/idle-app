import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View, type TextLayoutLine } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, motion, space } from '@/constants/tokens';
import { useTasks, type Task } from '@/store/tasks';
import { useDevOverride } from '@/lib/devOverride';
import { weekReflection, type ClosedTaskInput } from '@/lib/ai';
import { IdleText } from '../IdleText';
import { PrimaryButton } from '../PrimaryButton';
import { AnimatedStrikeLine } from '../AnimatedStrike';

const EASE = Easing.bezier(motion.easing[0], motion.easing[1], motion.easing[2], motion.easing[3]);
const STRIKE_STAGGER = 220;
const STRIKE_DURATION = 220;
const REFLECTION_KEY_PREFIX = 'idle.reflection.';
const REFLECTION_KEY_VERSION = '.v1';

function clock(d: Date) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function startOfWeek(d: Date = new Date()): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  out.setDate(out.getDate() + diff);
  return out;
}

function weekKey(d: Date = new Date()): string {
  const monday = startOfWeek(d);
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
}

function thisWeeksClosed(history: Task[]): ClosedTaskInput[] {
  const cutoff = startOfWeek().getTime();
  return history
    .filter(
      t =>
        (t.status === 'done' || t.status === 'refused' || t.status === 'burned') &&
        (t.updatedAt ?? t.createdAt) >= cutoff,
    )
    .map(t => ({
      text: t.text,
      why: t.why,
      status: t.status as 'done' | 'refused' | 'burned',
    }));
}

type ReflectionState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; line: string }
  | { kind: 'empty' };

export function BurnScreen() {
  const { openTasks, history, burn } = useTasks();
  const { cycle, set } = useDevOverride();

  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(0.3, { duration: 900, easing: EASE }), -1, true);
  }, [pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  const undone = openTasks;
  const count = undone.length;

  const closed = useMemo(() => thisWeeksClosed(history), [history]);
  const [reflection, setReflection] = useState<ReflectionState>({ kind: 'idle' });

  // Generate (or recall) one honest sentence about the week. Cached per ISO week
  // so reopening the screen never re-bills the AI.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (closed.length === 0) {
        if (!cancelled) setReflection({ kind: 'empty' });
        return;
      }
      const key = `${REFLECTION_KEY_PREFIX}${weekKey()}${REFLECTION_KEY_VERSION}`;
      try {
        const cached = await AsyncStorage.getItem(key);
        if (cached && !cancelled) {
          setReflection({ kind: 'ready', line: cached });
          return;
        }
      } catch {
        /* ignore */
      }
      if (cancelled) return;
      setReflection({ kind: 'loading' });
      const line = await weekReflection(closed);
      if (cancelled) return;
      if (line) {
        AsyncStorage.setItem(key, line).catch(() => {});
        setReflection({ kind: 'ready', line });
      } else {
        setReflection({ kind: 'empty' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [closed]);

  const reflectionLine = reflection.kind === 'ready' ? reflection.line : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.inkDeep }} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: space.s5,
          paddingTop: space.s2,
          paddingBottom: space.s6,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onLongPress={cycle}
          delayLongPress={600}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: space.s7,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2 }}>
            <Animated.View
              style={[
                { width: 7, height: 7, borderRadius: 999, backgroundColor: colors.pink },
                pulseStyle,
              ]}
            />
            <IdleText
              style={{
                fontFamily: 'JetBrainsMono_500Medium',
                fontSize: 10,
                letterSpacing: 0.18 * 10,
                color: colors.cream50,
              }}
            >
              FRIDAY BURN
            </IdleText>
          </View>
          <IdleText
            style={{
              fontFamily: 'JetBrainsMono_500Medium',
              fontSize: 10,
              letterSpacing: 0.18 * 10,
              color: colors.cream50,
            }}
          >
            {clock(new Date())}
          </IdleText>
        </Pressable>

        {__DEV__ ? (
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              set('auto');
            }}
            hitSlop={12}
            style={({ pressed }) => ({
              alignSelf: 'flex-end',
              marginTop: -space.s6,
              marginBottom: space.s4,
              opacity: pressed ? 0.6 : 1,
              paddingHorizontal: space.s2,
              paddingVertical: 2,
              borderWidth: 1,
              borderColor: colors.pink,
              borderRadius: 2,
            })}
          >
            <IdleText
              style={{
                fontFamily: 'JetBrainsMono_500Medium',
                fontSize: 10,
                letterSpacing: 0.18 * 10,
                color: colors.pink,
              }}
            >
              DEV · EXIT
            </IdleText>
          </Pressable>
        ) : null}

        <IdleText
          style={{
            fontFamily: 'BricolageGrotesque_800ExtraBold',
            fontSize: 40,
            letterSpacing: -0.035 * 40,
            lineHeight: 40,
            color: colors.cream,
          }}
        >
          Friday.
        </IdleText>
        <IdleText
          style={{
            fontFamily: 'BricolageGrotesque_800ExtraBold',
            fontSize: 40,
            letterSpacing: -0.035 * 40,
            lineHeight: 40,
            color: colors.pink,
            marginTop: 2,
          }}
        >
          Everything went.
        </IdleText>

        <View style={{ marginTop: space.s7 }}>
          <IdleText
            style={{
              fontFamily: 'BricolageGrotesque_800ExtraBold',
              fontSize: 80,
              letterSpacing: -0.06 * 80,
              lineHeight: 80,
              color: colors.pink,
            }}
          >
            {String(count).padStart(2, '0')}
          </IdleText>
          <IdleText
            style={{
              fontFamily: 'JetBrainsMono_400Regular',
              fontSize: 10,
              letterSpacing: 0.18 * 10,
              color: colors.cream70,
              marginTop: space.s1,
            }}
          >
            {count === 1 ? "THING YOU DIDN'T DO" : "THINGS YOU DIDN'T DO"}
          </IdleText>
        </View>

        {reflectionLine ? (
          <View style={{ marginTop: space.s5 }}>
            <View
              style={{
                borderLeftWidth: 2,
                borderLeftColor: colors.pink,
                paddingLeft: space.s3,
              }}
            >
              <IdleText
                style={{
                  fontFamily: 'BricolageGrotesque_400Regular',
                  fontSize: 19,
                  lineHeight: 19 * 1.45,
                  letterSpacing: -0.01 * 19,
                  color: colors.cream,
                }}
              >
                {reflectionLine}
              </IdleText>
            </View>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                router.push('/week-card');
              }}
              hitSlop={10}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.s2,
                marginTop: space.s3,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  backgroundColor: colors.pink,
                }}
              />
              <IdleText
                style={{
                  fontFamily: 'JetBrainsMono_500Medium',
                  fontSize: 10,
                  letterSpacing: 0.18 * 10,
                  color: colors.cream70,
                }}
              >
                SHARE.
              </IdleText>
            </Pressable>
          </View>
        ) : null}

        <View style={{ marginTop: space.s5 }}>
          {undone.length === 0 ? (
            <IdleText variant="body" style={{ color: colors.cream70 }}>
              Nothing left. Good week.
            </IdleText>
          ) : (
            undone.map((task, i) => (
              <BurningRow key={task.id} task={task} index={i} />
            ))
          )}
        </View>

        <View style={{ marginTop: space.s7 }}>
          <PrimaryButton
            label="Monday is fresh."
            variant="cream"
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              burn();
              set('auto');
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function BurningRow({ task, index }: { task: Task; index: number }) {
  const progress = useSharedValue(0);
  const [textLines, setTextLines] = useState<TextLayoutLine[]>([]);

  useEffect(() => {
    progress.value = withDelay(
      index * STRIKE_STAGGER,
      withTiming(1, { duration: STRIKE_DURATION, easing: EASE }),
    );
  }, [progress, index]);

  const textStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + 0.4 * (1 - progress.value),
  }));

  return (
    <View
      style={{
        paddingVertical: space.s2,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(245, 240, 232, 0.10)',
      }}
    >
      <View style={{ position: 'relative' }}>
        <Animated.Text
          onTextLayout={e => setTextLines(e.nativeEvent.lines)}
          style={[
            {
              fontFamily: 'BricolageGrotesque_500Medium',
              fontSize: 15,
              letterSpacing: -0.01 * 15,
              color: colors.cream,
            },
            textStyle,
          ]}
        >
          {task.text}
        </Animated.Text>
        {textLines.map((line, i) => (
          <AnimatedStrikeLine
            key={i}
            progress={progress}
            line={line}
            color={colors.pink}
          />
        ))}
      </View>
    </View>
  );
}
