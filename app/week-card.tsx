import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, radii, space } from '@/constants/tokens';
import { useTasks, type Task } from '@/store/tasks';
import { IdleText } from '@/components/idle/IdleText';
import { Wordmark } from '@/components/idle/Wordmark';

const MONTHS = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

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

function formatWeekOf(d: Date = new Date()): string {
  const monday = startOfWeek(d);
  return `WEEK OF ${MONTHS[monday.getMonth()]} ${monday.getDate()}.`;
}

function pickFeatured(history: Task[]): Task[] {
  const cutoff = startOfWeek().getTime();
  const closed = history.filter(
    t =>
      (t.status === 'done' || t.status === 'refused' || t.status === 'burned') &&
      (t.updatedAt ?? t.createdAt) >= cutoff,
  );
  // Done first, then burned, then refused. Newest within each group.
  const order: Record<Task['status'], number> = {
    done: 0,
    burned: 1,
    refused: 2,
    open: 3,
  };
  return [...closed]
    .sort((a, b) => {
      const oa = order[a.status];
      const ob = order[b.status];
      if (oa !== ob) return oa - ob;
      return (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt);
    })
    .slice(0, 3);
}

export default function WeekCard() {
  const { history } = useTasks();
  const [reflection, setReflection] = useState<string | null>(null);

  const featured = useMemo(() => pickFeatured(history), [history]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(`idle.reflection.${weekKey()}.v1`);
        if (!cancelled) setReflection(cached);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.s5,
          paddingTop: space.s4,
          paddingBottom: space.s7,
        }}
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
          style={{ marginBottom: space.s5 }}
        >
          THE WEEK CARD.
        </IdleText>

        <View
          style={{
            backgroundColor: colors.cream,
            borderRadius: radii.md,
            paddingVertical: space.s7,
            paddingHorizontal: space.s5,
            borderWidth: 1,
            borderColor: colors.ink15,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: space.s7,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2 }}>
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
                  color: colors.ink70,
                }}
              >
                {formatWeekOf()}
              </IdleText>
            </View>
            <IdleText
              style={{
                fontFamily: 'JetBrainsMono_500Medium',
                fontSize: 10,
                letterSpacing: 0.18 * 10,
                color: colors.ink50,
              }}
            >
              IDLE.
            </IdleText>
          </View>

          <IdleText
            style={{
              fontFamily: 'BricolageGrotesque_500Medium',
              fontSize: 28,
              lineHeight: 28 * 1.18,
              letterSpacing: -0.025 * 28,
              color: colors.ink,
              marginBottom: space.s6,
            }}
          >
            {reflection ?? 'A quiet week.'}
          </IdleText>

          <View
            style={{
              height: 3,
              width: 30,
              backgroundColor: colors.pink,
              marginBottom: space.s5,
            }}
          />

          <View>
            {featured.length === 0 ? (
              <IdleText
                style={{
                  fontFamily: 'Manrope_400Regular',
                  fontSize: 15,
                  color: colors.ink50,
                  fontStyle: 'italic',
                }}
              >
                Nothing closed yet.
              </IdleText>
            ) : (
              featured.map(task => <CardRow key={task.id} task={task} />)
            )}
          </View>

          <View
            style={{
              marginTop: space.s8,
              alignItems: 'center',
            }}
          >
            <Wordmark size={32} tone="ink" />
            <IdleText
              style={{
                fontFamily: 'JetBrainsMono_500Medium',
                fontSize: 10,
                letterSpacing: 0.22 * 10,
                color: colors.ink50,
                marginTop: space.s3,
              }}
            >
              LESS.  DONE.
            </IdleText>
          </View>
        </View>

        <View
          style={{
            marginTop: space.s5,
            alignItems: 'center',
            gap: space.s2,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2 }}>
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
                color: colors.ink70,
              }}
            >
              SCREENSHOT TO SHARE.
            </IdleText>
          </View>
          <IdleText
            style={{
              fontFamily: 'Manrope_400Regular',
              fontSize: 13,
              color: colors.ink50,
              textAlign: 'center',
            }}
          >
            Side button + volume up.
          </IdleText>
        </View>

        <View style={{ marginTop: space.s6 }}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              paddingVertical: space.s3 + 2,
              alignItems: 'center',
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <IdleText
              style={{
                fontFamily: 'BricolageGrotesque_500Medium',
                fontSize: 15,
                color: colors.ink,
              }}
            >
              Done.
            </IdleText>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CardRow({ task }: { task: Task }) {
  const isDone = task.status === 'done';
  const isBurned = task.status === 'burned';
  const glyph = isDone ? '✓' : isBurned ? '×' : '–';
  const glyphColor = isDone ? colors.pink : colors.ink50;
  const textColor = isDone ? colors.ink : colors.ink70;
  const decoration = isBurned ? 'line-through' : 'none';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: space.s3,
        paddingVertical: space.s2,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.creamLine,
      }}
    >
      <IdleText
        style={{
          fontFamily: 'JetBrainsMono_500Medium',
          fontSize: 14,
          color: glyphColor,
          width: 14,
        }}
      >
        {glyph}
      </IdleText>
      <IdleText
        style={{
          flex: 1,
          fontFamily: 'BricolageGrotesque_500Medium',
          fontSize: 16,
          lineHeight: 16 * 1.35,
          letterSpacing: -0.01 * 16,
          color: textColor,
          textDecorationLine: decoration,
        }}
      >
        {task.text}
      </IdleText>
    </View>
  );
}
