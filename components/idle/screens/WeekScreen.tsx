import { ScrollView, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { colors, radii, space } from '@/constants/tokens';
import { useTasks, type Task } from '@/store/tasks';
import { IdleText } from '../IdleText';
import { MonoLabel } from '../MonoLabel';
import { PinkRule } from '../PinkRule';

function isoWeekNumber(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function startOfWeek(d: Date) {
  const dow = d.getDay();
  const offset = dow === 0 ? 6 : dow - 1;
  const start = new Date(d);
  start.setDate(d.getDate() - offset);
  start.setHours(0, 0, 0, 0);
  return start;
}

function formatDuration(min: number): string {
  if (min <= 0) return '0m';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'] as const;

export function WeekScreen() {
  const { tasks, reclaimedTotalMin } = useTasks();
  const week = isoWeekNumber(new Date());
  const weekStartTs = startOfWeek(new Date()).getTime();

  const thisWeek = tasks.filter(
    t => t.status !== 'open' && (t.updatedAt ?? t.createdAt) >= weekStartTs,
  );
  const done = tasks.filter(t => t.status === 'done');
  const refused = tasks.filter(t => t.status === 'refused');
  const burned = tasks.filter(t => t.status === 'burned');

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <View
        style={{
          paddingHorizontal: space.s5,
          paddingTop: space.s4,
          paddingBottom: space.s4,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.ink15,
        }}
      >
        <MonoLabel style={{ marginBottom: space.s3 }}>{`WEEK · ${week} / 52`}</MonoLabel>
        <IdleText
          style={{
            fontFamily: 'BricolageGrotesque_800ExtraBold',
            fontSize: 38,
            letterSpacing: -0.04 * 38,
            lineHeight: 38,
            color: colors.ink,
          }}
        >
          The week.
        </IdleText>
        <View style={{ flexDirection: 'row', gap: space.s4, marginTop: space.s3 }}>
          <Stat label="DONE" value={done.length} tone="ink" />
          <Stat label="REFUSED" value={refused.length} tone="pink" />
          <Stat label="BURNED" value={burned.length} tone="muted" />
        </View>
        {reclaimedTotalMin > 0 && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              gap: space.s2,
              marginTop: space.s3,
            }}
          >
            <IdleText
              style={{
                fontFamily: 'JetBrainsMono_400Regular',
                fontSize: 9.5,
                letterSpacing: 0.18 * 9.5,
                color: colors.ink50,
              }}
            >
              RECLAIMED
            </IdleText>
            <IdleText
              style={{
                fontFamily: 'JetBrainsMono_500Medium',
                fontSize: 11,
                letterSpacing: 0.16 * 11,
                color: colors.pink,
              }}
            >
              {formatDuration(reclaimedTotalMin)}
            </IdleText>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: space.s5, paddingBottom: space.s7 }}
        showsVerticalScrollIndicator={false}
      >
        <WeekChart items={thisWeek} />

        <Section title="Done" items={done} status="done" />
        <Section title="Refused" items={refused} status="refused" />
        <Section title="Burned" items={burned} status="burned" />

        <View
          style={{
            marginTop: space.s5,
            padding: space.s5,
            backgroundColor: colors.creamSoft,
            borderRadius: radii.md,
            borderWidth: 0.5,
            borderColor: colors.ink15,
          }}
        >
          <MonoLabel style={{ marginBottom: space.s2 }}>NEXT WEEK</MonoLabel>
          <IdleText
            style={{
              fontFamily: 'BricolageGrotesque_500Medium',
              fontSize: 20,
              letterSpacing: -0.02 * 20,
              lineHeight: 20 * 1.25,
              color: colors.ink,
            }}
          >
            Begin from zero.
          </IdleText>
          <IdleText
            variant="bodySm"
            style={{ color: colors.ink50, marginTop: space.s1 }}
          >
            Nothing carries over. The list is empty again on Monday.
          </IdleText>
          <PinkRule width={28} height={4} style={{ marginTop: space.s3 }} />
        </View>
      </ScrollView>
    </View>
  );
}

function WeekChart({ items }: { items: Task[] }) {
  const byDay = WEEKDAYS.map(day => {
    const dayItems = items.filter(t => (t.closedAt ?? t.addedAt) === day);
    return {
      day,
      done: dayItems.filter(t => t.status === 'done').length,
      refused: dayItems.filter(t => t.status === 'refused').length,
      burned: dayItems.filter(t => t.status === 'burned').length,
    };
  });

  const anyActivity = byDay.some(d => d.done + d.refused + d.burned > 0);

  return (
    <View style={{ paddingTop: space.s5 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: space.s3,
        }}
      >
        <IdleText
          style={{
            fontFamily: 'JetBrainsMono_400Regular',
            fontSize: 9.5,
            letterSpacing: 0.18 * 9.5,
            color: colors.ink50,
          }}
        >
          THIS WEEK
        </IdleText>
        <IdleText
          style={{
            fontFamily: 'JetBrainsMono_400Regular',
            fontSize: 9.5,
            letterSpacing: 0.18 * 9.5,
            color: colors.ink30,
          }}
        >
          • DONE  × REFUSED  ○ BURNED
        </IdleText>
      </View>

      {!anyActivity ? (
        <IdleText
          style={{
            fontFamily: 'BricolageGrotesque_400Regular',
            fontSize: 13.5,
            color: colors.ink30,
            paddingVertical: space.s3,
          }}
        >
          Nothing yet this week.
        </IdleText>
      ) : (
        <View style={{ gap: space.s2 }}>
          {byDay.map(row => (
            <DayRow key={row.day} day={row.day} done={row.done} refused={row.refused} burned={row.burned} />
          ))}
        </View>
      )}
    </View>
  );
}

function DayRow({
  day,
  done,
  refused,
  burned,
}: {
  day: string;
  done: number;
  refused: number;
  burned: number;
}) {
  const marks: { kind: 'done' | 'refused' | 'burned' }[] = [
    ...Array.from({ length: done }, () => ({ kind: 'done' as const })),
    ...Array.from({ length: refused }, () => ({ kind: 'refused' as const })),
    ...Array.from({ length: burned }, () => ({ kind: 'burned' as const })),
  ];

  const dim = done + refused + burned === 0;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3, paddingVertical: 4 }}>
      <View style={{ width: 32 }}>
        <IdleText
          style={{
            fontFamily: 'JetBrainsMono_500Medium',
            fontSize: 10,
            letterSpacing: 0.18 * 10,
            color: dim ? colors.ink30 : colors.ink50,
          }}
        >
          {day}
        </IdleText>
      </View>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
        {marks.length === 0 ? (
          <View style={{ width: 14, height: 1, backgroundColor: colors.ink15 }} />
        ) : (
          marks.map((m, i) => <Mark key={i} kind={m.kind} />)
        )}
      </View>
    </View>
  );
}

function Mark({ kind }: { kind: 'done' | 'refused' | 'burned' }) {
  if (kind === 'done') {
    return (
      <Svg width={10} height={10} viewBox="0 0 10 10">
        <Circle cx={5} cy={5} r={3.2} fill={colors.ink} />
      </Svg>
    );
  }
  if (kind === 'refused') {
    return (
      <Svg width={10} height={10} viewBox="0 0 10 10">
        <Line x1={2} y1={2} x2={8} y2={8} stroke={colors.pink} strokeWidth={1.8} strokeLinecap="round" />
        <Line x1={8} y1={2} x2={2} y2={8} stroke={colors.pink} strokeWidth={1.8} strokeLinecap="round" />
      </Svg>
    );
  }
  return (
    <Svg width={10} height={10} viewBox="0 0 10 10">
      <Circle cx={5} cy={5} r={3.2} fill="none" stroke={colors.ink30} strokeWidth={1.2} />
    </Svg>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: 'ink' | 'pink' | 'muted' }) {
  const boldColor = tone === 'pink' ? colors.pink : tone === 'muted' ? colors.ink30 : colors.ink;
  const lblColor = tone === 'pink' ? colors.pink : colors.ink50;
  return (
    <View style={{ flexDirection: 'row', gap: 4, alignItems: 'baseline' }}>
      <IdleText
        style={{
          fontFamily: 'JetBrainsMono_500Medium',
          fontSize: 11,
          letterSpacing: 0.18 * 11,
          color: boldColor,
        }}
      >
        {String(value).padStart(2, '0')}
      </IdleText>
      <IdleText
        style={{
          fontFamily: 'JetBrainsMono_400Regular',
          fontSize: 10,
          letterSpacing: 0.18 * 10,
          color: lblColor,
        }}
      >
        {label}
      </IdleText>
    </View>
  );
}

function Section({
  title,
  items,
  status,
}: {
  title: string;
  items: Task[];
  status: 'done' | 'refused' | 'burned';
}) {
  return (
    <View style={{ paddingTop: space.s5, paddingBottom: space.s2 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: space.s1,
        }}
      >
        <IdleText
          style={{
            fontFamily: 'BricolageGrotesque_800ExtraBold',
            fontSize: 22,
            letterSpacing: -0.03 * 22,
            color: colors.ink,
          }}
        >
          {title}.
        </IdleText>
        <IdleText variant="mono" tone="muted">
          {String(items.length).padStart(2, '0')}
        </IdleText>
      </View>

      {items.length === 0 ? (
        <IdleText
          style={{
            fontFamily: 'BricolageGrotesque_400Regular',
            fontSize: 14,
            color: colors.ink30,
            paddingVertical: space.s2,
          }}
        >
          Nothing this week.
        </IdleText>
      ) : (
        items.map((it, i) => (
          <View
            key={it.id}
            style={{
              flexDirection: 'row',
              gap: space.s3,
              paddingVertical: space.s3,
              borderTopWidth: i === 0 ? 0 : 0.5,
              borderTopColor: colors.ink15,
            }}
          >
            <View style={{ width: 38, paddingTop: 3 }}>
              <IdleText variant="mono" style={{ color: colors.ink30 }}>
                {(it.closedAt ?? it.addedAt).toUpperCase()}
              </IdleText>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ position: 'relative', alignSelf: 'flex-start' }}>
                <IdleText
                  style={{
                    fontFamily: 'BricolageGrotesque_500Medium',
                    fontSize: 15.5,
                    letterSpacing: -0.01 * 15.5,
                    lineHeight: 15.5 * 1.3,
                    color: status === 'burned' ? colors.ink50 : colors.ink,
                  }}
                >
                  {it.text}
                </IdleText>
                {status === 'refused' && (
                  <View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      left: -2,
                      right: -2,
                      top: '50%',
                      marginTop: -1,
                      height: 2,
                      backgroundColor: colors.pink,
                    }}
                  />
                )}
                {status === 'burned' && (
                  <View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      left: -2,
                      right: -2,
                      top: '50%',
                      marginTop: -0.5,
                      height: 1,
                      borderTopWidth: 1,
                      borderTopColor: colors.ink30,
                      borderStyle: 'dashed',
                    }}
                  />
                )}
              </View>
              <IdleText
                style={{
                  fontFamily: 'BricolageGrotesque_400Regular',
                  fontSize: 13,
                  color: colors.ink50,
                  marginTop: 3,
                  lineHeight: 13 * 1.5,
                }}
              >
                {it.why}
              </IdleText>
              {status === 'refused' && it.reclaimedMin && it.reclaimedMin > 0 && (
                <IdleText
                  style={{
                    fontFamily: 'JetBrainsMono_400Regular',
                    fontSize: 9.5,
                    letterSpacing: 0.18 * 9.5,
                    color: colors.pink,
                    marginTop: 4,
                  }}
                >
                  {`RECLAIMED · ${formatDuration(it.reclaimedMin)}`}
                </IdleText>
              )}
            </View>
          </View>
        ))
      )}
    </View>
  );
}
