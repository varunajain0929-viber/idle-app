import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, motion, radii, space } from '@/constants/tokens';
import { useTasks, TASKS_MAX_OPEN, daysSince } from '@/store/tasks';
import { MILESTONES, milestoneLine } from '@/lib/variants';
import { IdleText } from '../IdleText';
import { MonoLabel } from '../MonoLabel';
import { PinkRule } from '../PinkRule';
import { TaskRow } from '../TaskRow';

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const EASE = Easing.bezier(motion.easing[0], motion.easing[1], motion.easing[2], motion.easing[3]);
const MILESTONE_VISIBLE_MS = 6000;
const RHYTHM_VISIBLE_MS = 4500;

export function TodayScreen() {
  const {
    tasks,
    openCount,
    doneCount,
    refusedCount,
    isAtCap,
    complete,
    refuse,
    reopen,
    setEstimate,
    carry,
    dismissCarry,
    refuseCarry,
    challengeState,
    onboardedAt,
    milestonesShown,
    markMilestoneShown,
    setChallengeState,
    hydrated,
  } = useTasks();
  const today = DAYS[new Date().getDay()];
  const spotsLeft = TASKS_MAX_OPEN - openCount;
  const reducedMotion = useReducedMotion();

  const [currentMilestone, setCurrentMilestone] = useState<number | null>(null);
  const [rhythmVisible, setRhythmVisible] = useState(false);

  // Detect milestone crossings and mark them shown in the store immediately.
  useEffect(() => {
    if (!hydrated) return;
    const totalClosed = doneCount + refusedCount;
    const unseen = MILESTONES.find(m => totalClosed >= m && !milestonesShown.includes(m));
    if (unseen != null) {
      setCurrentMilestone(unseen);
      markMilestoneShown(unseen);
    }
  }, [doneCount, refusedCount, milestonesShown, markMilestoneShown, hydrated]);

  // Auto-hide the milestone after a few seconds.
  useEffect(() => {
    if (currentMilestone == null) return;
    const t = setTimeout(() => setCurrentMilestone(null), MILESTONE_VISIBLE_MS);
    return () => clearTimeout(t);
  }, [currentMilestone]);

  // Trigger the rhythm message + final state transition (fires once).
  const rhythmTriggered = useRef(false);
  const daysSinceOnboarded = daysSince(onboardedAt);
  const shouldShowRhythm = challengeState === 'day3' && daysSinceOnboarded >= 3;

  useEffect(() => {
    if (!shouldShowRhythm || rhythmTriggered.current) return;
    rhythmTriggered.current = true;
    setRhythmVisible(true);
    setChallengeState('done');
    const t = setTimeout(() => setRhythmVisible(false), RHYTHM_VISIBLE_MS);
    return () => clearTimeout(t);
  }, [shouldShowRhythm, setChallengeState]);

  const challengeLine =
    challengeState === 'day1'
      ? 'DAY 1 — ADD ONE THING.'
      : challengeState === 'day2'
        ? 'DAY 2 — KEEP IT OR REFUSE IT.'
        : challengeState === 'day3' && !shouldShowRhythm
          ? 'DAY 3 — A WHOLE DAY.'
          : null;

  const showCarry = carry != null;
  const showChallenge = !showCarry && challengeLine != null;
  const showRhythm = !showCarry && rhythmVisible;

  const visible = tasks.filter(
    t => t.status === 'open' || t.status === 'done' || t.status === 'refused',
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <View
        style={{
          paddingHorizontal: space.s5,
          paddingTop: space.s4,
          paddingBottom: space.s4,
        }}
      >
        <MonoLabel style={{ marginBottom: space.s3 }}>{`TODAY · ${today}`}</MonoLabel>

        {showCarry && (
          <Animated.View
            entering={reducedMotion ? undefined : FadeIn.duration(motion.layout)}
            exiting={reducedMotion ? undefined : FadeOut.duration(motion.hover)}
            style={{
              paddingVertical: space.s3,
              paddingHorizontal: space.s3,
              marginBottom: space.s3,
              borderWidth: 0.5,
              borderColor: colors.ink15,
              backgroundColor: colors.creamSoft,
              borderRadius: radii.sm,
            }}
          >
            <IdleText
              style={{
                fontFamily: 'BricolageGrotesque_500Medium',
                fontSize: 14.5,
                lineHeight: 14.5 * 1.45,
                color: colors.ink,
              }}
            >
              {`Yesterday you left ${carry.count} ${carry.count === 1 ? 'thing' : 'things'}.`}
            </IdleText>
            <View style={{ flexDirection: 'row', gap: space.s4, marginTop: space.s2 }}>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  dismissCarry();
                }}
                hitSlop={6}
              >
                <IdleText
                  style={{
                    fontFamily: 'JetBrainsMono_500Medium',
                    fontSize: 10.5,
                    letterSpacing: 0.16 * 10.5,
                    color: colors.ink,
                  }}
                >
                  KEEP THEM.
                </IdleText>
              </Pressable>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  refuseCarry();
                }}
                hitSlop={6}
              >
                <IdleText
                  style={{
                    fontFamily: 'JetBrainsMono_500Medium',
                    fontSize: 10.5,
                    letterSpacing: 0.16 * 10.5,
                    color: colors.pink,
                  }}
                >
                  REFUSE THEM.
                </IdleText>
              </Pressable>
            </View>
          </Animated.View>
        )}

        {showChallenge && (
          <Animated.View
            key={challengeLine}
            entering={reducedMotion ? undefined : FadeIn.duration(motion.layout)}
            style={{ marginBottom: space.s2 }}
          >
            <IdleText
              style={{
                fontFamily: 'JetBrainsMono_500Medium',
                fontSize: 10.5,
                letterSpacing: 0.16 * 10.5,
                color: colors.ink50,
              }}
            >
              {challengeLine}
            </IdleText>
          </Animated.View>
        )}

        {showRhythm && (
          <Animated.View
            entering={reducedMotion ? undefined : FadeIn.duration(motion.layout)}
            exiting={reducedMotion ? undefined : FadeOut.duration(motion.ceremony).easing(EASE)}
            style={{ marginBottom: space.s2 }}
          >
            <IdleText
              style={{
                fontFamily: 'JetBrainsMono_500Medium',
                fontSize: 10.5,
                letterSpacing: 0.16 * 10.5,
                color: colors.pink,
              }}
            >
              YOU FOUND THE RHYTHM.
            </IdleText>
          </Animated.View>
        )}

        <IdleText
          style={{
            fontFamily: 'BricolageGrotesque_800ExtraBold',
            fontSize: 38,
            letterSpacing: -0.04 * 38,
            lineHeight: 38,
            color: colors.ink,
          }}
        >
          Five things.
        </IdleText>

        {currentMilestone != null && (
          <Animated.View
            entering={reducedMotion ? undefined : FadeIn.duration(motion.layout)}
            exiting={reducedMotion ? undefined : FadeOut.duration(motion.ceremony)}
            style={{ marginTop: space.s2 }}
          >
            <IdleText
              style={{
                fontFamily: 'JetBrainsMono_500Medium',
                fontSize: 10.5,
                letterSpacing: 0.16 * 10.5,
                color: colors.pink,
              }}
            >
              {milestoneLine(currentMilestone)}
            </IdleText>
          </Animated.View>
        )}

        <View style={{ flexDirection: 'row', gap: space.s4, marginTop: space.s3 }}>
          <Counter label="OPEN" value={openCount} tone={isAtCap ? 'pink' : 'ink'} />
          <Counter label="DONE" value={doneCount} tone="ink" />
          <Counter label="REFUSED" value={refusedCount} tone={refusedCount > 0 ? 'pink' : 'muted'} />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: space.s5, paddingBottom: space.s5 }}
        showsVerticalScrollIndicator={false}
      >
        {visible.length === 0 ? (
          <View style={{ paddingVertical: space.s9, alignItems: 'center' }}>
            <IdleText
              style={{
                fontFamily: 'BricolageGrotesque_500Medium',
                fontSize: 22,
                letterSpacing: -0.02 * 22,
                color: colors.ink,
                marginBottom: space.s2,
              }}
            >
              Nothing on the list.
            </IdleText>
            <IdleText variant="body" tone="muted">
              That&apos;s the work.
            </IdleText>
            <PinkRule width={28} height={4} style={{ marginTop: space.s3 }} />
          </View>
        ) : (
          visible.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={() => complete(task.id)}
              onRefuse={() => refuse(task.id)}
              onReopen={() => reopen(task.id)}
              onSetEstimate={setEstimate}
            />
          ))
        )}

        <View style={{ borderTopWidth: 0.5, borderTopColor: colors.ink15 }} />

        {spotsLeft > 0 && (
          <IdleText
            variant="mono"
            style={{
              paddingTop: space.s5,
              paddingBottom: space.s3,
              color: colors.ink30,
            }}
          >
            {`${spotsLeft} ${spotsLeft === 1 ? 'SPOT' : 'SPOTS'} REMAINING · NOT REQUIRED TO FILL`}
          </IdleText>
        )}
      </ScrollView>

      <View
        style={{
          paddingHorizontal: space.s5,
          paddingTop: space.s3,
          paddingBottom: space.s2,
          borderTopWidth: 0.5,
          borderTopColor: colors.ink15,
          backgroundColor: colors.cream,
        }}
      >
        <Pressable
          onPress={() => {
            if (isAtCap) return;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/add-task');
          }}
          disabled={isAtCap}
          style={({ pressed }) => ({
            backgroundColor: isAtCap ? colors.creamSoft : colors.ink,
            borderRadius: radii.sm,
            borderWidth: 1,
            borderColor: isAtCap ? colors.ink15 : colors.ink,
            paddingVertical: space.s4,
            paddingHorizontal: space.s4,
            alignItems: 'center',
            opacity: pressed && !isAtCap ? 0.85 : 1,
          })}
        >
          <IdleText
            style={{
              fontFamily: 'BricolageGrotesque_500Medium',
              fontSize: 15,
              color: isAtCap ? colors.ink30 : colors.cream,
            }}
          >
            {isAtCap ? 'Five is the maximum.' : 'Add a task.'}
          </IdleText>
        </Pressable>
      </View>
    </View>
  );
}

function Counter({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'ink' | 'pink' | 'muted';
}) {
  const numColor = tone === 'pink' ? colors.pink : tone === 'muted' ? colors.ink30 : colors.ink;
  const lblColor = tone === 'pink' ? colors.pink : colors.ink50;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
      <IdleText
        style={{
          fontFamily: 'JetBrainsMono_500Medium',
          fontSize: 11,
          letterSpacing: 0.16 * 11,
          color: numColor,
        }}
      >
        {String(value).padStart(2, '0')}
      </IdleText>
      <IdleText
        style={{
          fontFamily: 'JetBrainsMono_400Regular',
          fontSize: 10,
          letterSpacing: 0.16 * 10,
          color: lblColor,
        }}
      >
        {label}
      </IdleText>
    </View>
  );
}
