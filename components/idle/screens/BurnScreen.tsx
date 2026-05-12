import { useEffect } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
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
import { IdleText } from '../IdleText';
import { PrimaryButton } from '../PrimaryButton';

const EASE = Easing.bezier(motion.easing[0], motion.easing[1], motion.easing[2], motion.easing[3]);
const STRIKE_STAGGER = 220;
const STRIKE_DURATION = 220;

function clock(d: Date) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function BurnScreen() {
  const { openTasks, burn } = useTasks();
  const { cycle, set } = useDevOverride();

  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(0.3, { duration: 900, easing: EASE }), -1, true);
  }, [pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  const undone = openTasks;
  const count = undone.length;

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

  useEffect(() => {
    progress.value = withDelay(
      index * STRIKE_STAGGER,
      withTiming(1, { duration: STRIKE_DURATION, easing: EASE }),
    );
  }, [progress, index]);

  const strikeStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));
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
      <View style={{ position: 'relative', alignSelf: 'flex-start' }}>
        <Animated.Text
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
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              left: -2,
              top: '50%',
              marginTop: -1,
              height: 2,
              backgroundColor: colors.pink,
            },
            strikeStyle,
          ]}
        />
      </View>
    </View>
  );
}
