import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Polyline, Line } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
  FadeIn,
  FadeOut,
  useReducedMotion,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, motion, space } from '@/constants/tokens';
import type { Task } from '@/store/tasks';
import { doneWord, refuseWord, doneHaptic } from '@/lib/variants';
import { IdleText } from './IdleText';

const EASE = Easing.bezier(motion.easing[0], motion.easing[1], motion.easing[2], motion.easing[3]);
const STRIKE_MS = motion.layout;
const FILL_MS = motion.hover;

type Props = {
  task: Task;
  onToggle: () => void;
  onRefuse: () => void;
  onReopen: () => void;
  onSetEstimate: (id: string, minutes: number) => void;
};

const ESTIMATE_CHIPS: { label: string; value: number }[] = [
  { label: '15m', value: 15 },
  { label: '30m', value: 30 },
  { label: '1h', value: 60 },
];
const ESTIMATOR_TIMEOUT_MS = 5000;

export function TaskRow({ task, onToggle, onRefuse, onReopen, onSetEstimate }: Props) {
  const isDone = task.status === 'done';
  const isRefused = task.status === 'refused';
  const isOpen = task.status === 'open';
  const struck = isDone || isRefused;

  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(struck ? 1 : 0);
  const prevStatus = useRef(task.status);
  const [estimatorOpen, setEstimatorOpen] = useState(false);
  const estimatorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const was = prevStatus.current;
    const nowStruck = task.status === 'done' || task.status === 'refused';
    const wasStruck = was === 'done' || was === 'refused';

    if (was === 'open' && nowStruck) {
      if (reducedMotion) {
        progress.value = 1;
      } else {
        progress.value = 0;
        progress.value = withTiming(1, { duration: STRIKE_MS, easing: EASE });
      }
    } else if (wasStruck && task.status === 'open') {
      if (reducedMotion) {
        progress.value = 0;
      } else {
        progress.value = withTiming(0, { duration: FILL_MS, easing: EASE });
      }
      // Close estimator on reopen
      setEstimatorOpen(false);
      if (estimatorTimer.current) {
        clearTimeout(estimatorTimer.current);
        estimatorTimer.current = null;
      }
    } else {
      progress.value = nowStruck ? 1 : 0;
    }
    prevStatus.current = task.status;
  }, [task.status, progress, reducedMotion]);

  useEffect(
    () => () => {
      if (estimatorTimer.current) clearTimeout(estimatorTimer.current);
    },
    [],
  );

  const handleRefuse = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 70);
    onRefuse();
    setEstimatorOpen(true);
    if (estimatorTimer.current) clearTimeout(estimatorTimer.current);
    estimatorTimer.current = setTimeout(() => {
      setEstimatorOpen(false);
      estimatorTimer.current = null;
    }, ESTIMATOR_TIMEOUT_MS);
  };

  const handleEstimate = (minutes: number) => {
    Haptics.selectionAsync();
    onSetEstimate(task.id, minutes);
    setEstimatorOpen(false);
    if (estimatorTimer.current) {
      clearTimeout(estimatorTimer.current);
      estimatorTimer.current = null;
    }
  };

  const dismissEstimator = () => {
    setEstimatorOpen(false);
    if (estimatorTimer.current) {
      clearTimeout(estimatorTimer.current);
      estimatorTimer.current = null;
    }
  };

  const circleBorder = isRefused ? colors.pink : colors.ink;
  const circleFillColor = isRefused ? colors.pink : colors.ink;

  const statusLabel = isDone
    ? doneWord(task.id)
    : isRefused
      ? refuseWord(task.id)
      : (task.addedAt ?? 'OPEN');

  const fillStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.5 + 0.5 * progress.value }],
  }));

  const strikeStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const checkOpacityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.55, 1], [0, 0, 1]),
  }));

  return (
    <View
      style={{
        paddingVertical: space.s4,
        borderTopWidth: 0.5,
        borderTopColor: colors.ink15,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          gap: space.s3,
          alignItems: 'flex-start',
        }}
      >
        <Pressable
          onPress={() => {
            if (isOpen) {
              Haptics.impactAsync(doneHaptic(task.id));
              onToggle();
            } else {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onReopen();
            }
          }}
          hitSlop={10}
          style={{
            width: 24,
            height: 24,
            borderRadius: 999,
            borderWidth: 1.5,
            borderColor: struck ? circleBorder : colors.ink,
            backgroundColor: 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 2,
            overflow: 'hidden',
          }}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 999,
                backgroundColor: circleFillColor,
              },
              fillStyle,
            ]}
          />
          {isDone && (
            <Animated.View style={checkOpacityStyle}>
              <Svg width={12} height={12} viewBox="0 0 12 12">
                <Polyline
                  points="2.5,6.5 5,9 9.5,3.5"
                  fill="none"
                  stroke={colors.cream}
                  strokeWidth={2.2}
                  strokeLinecap="round"
                />
              </Svg>
            </Animated.View>
          )}
          {isRefused && (
            <Animated.View style={checkOpacityStyle}>
              <Svg width={11} height={11} viewBox="0 0 11 11">
                <Line x1={2.5} y1={2.5} x2={8.5} y2={8.5} stroke={colors.ink} strokeWidth={2} strokeLinecap="round" />
                <Line x1={8.5} y1={2.5} x2={2.5} y2={8.5} stroke={colors.ink} strokeWidth={2} strokeLinecap="round" />
              </Svg>
            </Animated.View>
          )}
        </Pressable>

        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ position: 'relative', alignSelf: 'flex-start' }}>
            <IdleText
              style={{
                fontFamily: 'BricolageGrotesque_500Medium',
                fontSize: 17,
                lineHeight: 17 * 1.3,
                letterSpacing: -0.01 * 17,
                color: struck ? colors.ink50 : colors.ink,
              }}
            >
              {task.text}
            </IdleText>
            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: 'absolute',
                  left: -2,
                  top: '50%',
                  marginTop: -1,
                  height: 2,
                  backgroundColor: isRefused ? colors.pink : colors.ink50,
                },
                strikeStyle,
              ]}
            />
          </View>
          <IdleText
            style={{
              fontFamily: 'BricolageGrotesque_400Regular',
              fontSize: 13.5,
              color: colors.ink50,
              marginTop: space.s1,
              lineHeight: 13.5 * 1.5,
            }}
          >
            {task.why}
          </IdleText>
        </View>

        <View style={{ alignItems: 'flex-end', gap: space.s2, paddingTop: 2 }}>
          <Animated.Text
            key={statusLabel}
            entering={reducedMotion ? undefined : FadeIn.duration(STRIKE_MS).delay(FILL_MS)}
            style={{
              fontFamily: 'JetBrainsMono_500Medium',
              fontSize: 9.5,
              letterSpacing: 0.18 * 9.5,
              color: isRefused ? colors.pink : colors.ink50,
            }}
          >
            {statusLabel.toUpperCase()}
          </Animated.Text>
          {isOpen && (
            <Pressable onPress={handleRefuse} hitSlop={8}>
              <IdleText
                style={{
                  fontFamily: 'JetBrainsMono_500Medium',
                  fontSize: 9.5,
                  letterSpacing: 0.18 * 9.5,
                  color: colors.ink30,
                }}
              >
                REFUSE
              </IdleText>
            </Pressable>
          )}
        </View>
      </View>

      {estimatorOpen && isRefused && (
        <Animated.View
          entering={reducedMotion ? undefined : FadeIn.duration(motion.hover)}
          exiting={reducedMotion ? undefined : FadeOut.duration(motion.hover)}
          style={{
            marginTop: space.s3,
            paddingLeft: 24 + space.s3,
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.s2,
          }}
        >
          <IdleText
            style={{
              fontFamily: 'JetBrainsMono_400Regular',
              fontSize: 9.5,
              letterSpacing: 0.18 * 9.5,
              color: colors.ink50,
              marginRight: space.s1,
            }}
          >
            RECLAIM
          </IdleText>
          {ESTIMATE_CHIPS.map(chip => (
            <Pressable
              key={chip.value}
              onPress={() => handleEstimate(chip.value)}
              hitSlop={6}
              style={({ pressed }) => ({
                paddingHorizontal: space.s3,
                paddingVertical: 6,
                borderWidth: 0.5,
                borderColor: colors.ink30,
                borderRadius: 999,
                backgroundColor: colors.cream,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <IdleText
                style={{
                  fontFamily: 'JetBrainsMono_500Medium',
                  fontSize: 10.5,
                  letterSpacing: 0.12 * 10.5,
                  color: colors.ink,
                }}
              >
                {chip.label}
              </IdleText>
            </Pressable>
          ))}
          <Pressable onPress={dismissEstimator} hitSlop={6} style={{ marginLeft: space.s1 }}>
            <IdleText
              style={{
                fontFamily: 'JetBrainsMono_400Regular',
                fontSize: 9.5,
                letterSpacing: 0.18 * 9.5,
                color: colors.ink30,
              }}
            >
              SKIP
            </IdleText>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}
