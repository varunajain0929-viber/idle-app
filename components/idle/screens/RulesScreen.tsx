import { Alert, Platform, Pressable, ScrollView, Switch, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, space } from '@/constants/tokens';
import { useSettings } from '@/store/settings';
import { useAuth } from '@/store/auth';
import { IdleText } from '../IdleText';
import { MonoLabel } from '../MonoLabel';

type Rule = {
  id: string;
  name: string;
  body: string;
  locked: boolean;
};

const RULES: Rule[] = [
  {
    id: 'cap',
    name: 'Five is the cap.',
    body: 'Five active tasks. Not six. The list will not let you exceed it.',
    locked: true,
  },
  {
    id: 'why',
    name: "Every task needs a 'why'.",
    body: "A one-sentence reason. If you can't write one, it doesn't get added.",
    locked: true,
  },
  {
    id: 'burn',
    name: 'Friday burns.',
    body: 'Every Friday at 7pm local time, everything unfinished is deleted. No carry-over. No archive.',
    locked: false,
  },
  {
    id: 'lockout',
    name: '9pm lockout.',
    body: 'Idle refuses to open after 9pm. So should you.',
    locked: false,
  },
  {
    id: 'refuse',
    name: 'Refusal is a form of completion.',
    body: 'A refused task is celebrated equally. The list shrinks either way.',
    locked: true,
  },
  {
    id: 'notif',
    name: 'No notifications by default.',
    body: 'Idle does not push or nudge. The morning bell above is the one exception, and it stays off until you turn it on.',
    locked: true,
  },
  {
    id: 'streaks',
    name: 'No streaks. No scores.',
    body: 'There is nothing to gamify here. You will not be ranked.',
    locked: true,
  },
];

export function RulesScreen() {
  const { morningBellEnabled, setMorningBellEnabled, hydrated } = useSettings();
  const { user, signOut } = useAuth();

  const handleBellToggle = async (next: boolean) => {
    Haptics.selectionAsync();
    const ok = await setMorningBellEnabled(next);
    if (next && !ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const handleSignOut = () => {
    const title = 'Sign out.';
    const message =
      'Your tasks are saved in the cloud. Sign back in any time to bring them back.';
    const doSignOut = () => {
      Haptics.selectionAsync();
      void signOut();
    };
    // React Native's Alert.alert only renders the title on web (the buttons
    // are not real buttons), so the "Sign out" tap never fires. Use the
    // browser's native confirm() there instead.
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`)) {
        doSignOut();
      }
      return;
    }
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: doSignOut },
    ]);
  };

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
        <MonoLabel style={{ marginBottom: space.s3 }}>IDLE / SETTINGS</MonoLabel>
        <IdleText
          style={{
            fontFamily: 'BricolageGrotesque_800ExtraBold',
            fontSize: 38,
            letterSpacing: -0.04 * 38,
            lineHeight: 38,
            color: colors.ink,
          }}
        >
          The rules.
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
          Most of these you cannot change. That is the feature.
        </IdleText>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: space.s5, paddingBottom: space.s7 }}
      >
        <View style={{ paddingTop: space.s5, paddingBottom: space.s3 }}>
          <MonoLabel>YOUR CHOICE</MonoLabel>
        </View>
        <View
          style={{
            paddingVertical: space.s5,
            borderBottomWidth: 0.5,
            borderBottomColor: colors.ink15,
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.s4,
          }}
        >
          <View style={{ flex: 1 }}>
            <IdleText
              style={{
                fontFamily: 'BricolageGrotesque_500Medium',
                fontSize: 17,
                letterSpacing: -0.015 * 17,
                lineHeight: 17 * 1.3,
                color: colors.ink,
                marginBottom: space.s1,
              }}
            >
              Morning bell.
            </IdleText>
            <IdleText
              style={{
                fontFamily: 'BricolageGrotesque_400Regular',
                fontSize: 14,
                color: colors.ink50,
                lineHeight: 14 * 1.55,
                maxWidth: 320,
              }}
            >
              A single ping at 6am: &ldquo;Today is fresh.&rdquo; No count. No shame.
            </IdleText>
          </View>
          <Switch
            value={morningBellEnabled}
            onValueChange={handleBellToggle}
            disabled={!hydrated}
            trackColor={{ false: colors.ink15, true: colors.pink }}
            thumbColor={colors.cream}
            ios_backgroundColor={colors.ink15}
          />
        </View>

        <View style={{ paddingTop: space.s5, paddingBottom: space.s3 }}>
          <MonoLabel>THE RULES</MonoLabel>
        </View>
        {RULES.map((r, i) => (
          <View
            key={r.id}
            style={{
              paddingVertical: space.s5,
              borderBottomWidth: i === RULES.length - 1 ? 0 : 0.5,
              borderBottomColor: colors.ink15,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: space.s3,
                marginBottom: space.s1,
              }}
            >
              <IdleText
                style={{
                  fontFamily: 'BricolageGrotesque_500Medium',
                  fontSize: 17,
                  letterSpacing: -0.015 * 17,
                  lineHeight: 17 * 1.3,
                  color: colors.ink,
                  flex: 1,
                }}
              >
                {r.name}
              </IdleText>
              <IdleText
                style={{
                  fontFamily: 'JetBrainsMono_500Medium',
                  fontSize: 9,
                  letterSpacing: 0.18 * 9,
                  color: r.locked ? colors.ink30 : colors.pink,
                }}
              >
                {r.locked ? 'FIXED' : 'ON'}
              </IdleText>
            </View>
            <IdleText
              style={{
                fontFamily: 'BricolageGrotesque_400Regular',
                fontSize: 14,
                color: colors.ink50,
                lineHeight: 14 * 1.55,
                maxWidth: 360,
              }}
            >
              {r.body}
            </IdleText>
          </View>
        ))}

        <View
          style={{
            paddingTop: space.s6,
            paddingBottom: space.s5,
            borderTopWidth: 0.5,
            borderTopColor: colors.ink15,
          }}
        >
          <MonoLabel style={{ marginBottom: space.s3 }}>ACCOUNT</MonoLabel>
          <View style={{ gap: space.s3 }}>
            <Row label="Email" value={user?.email ?? '—'} />
            <Row label="Plan" value="Free · £0 forever" />
          </View>
          <Pressable
            onPress={handleSignOut}
            style={({ pressed }) => ({
              paddingTop: space.s5,
              paddingBottom: space.s2,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <IdleText
              style={{
                fontFamily: 'BricolageGrotesque_500Medium',
                fontSize: 15,
                color: colors.pink,
              }}
            >
              Sign out.
            </IdleText>
          </Pressable>
        </View>

        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            router.push('/about');
          }}
          style={({ pressed }) => ({
            paddingTop: space.s5,
            paddingBottom: space.s2,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2 }}>
            <IdleText
              style={{
                fontFamily: 'BricolageGrotesque_500Medium',
                fontSize: 15,
                color: colors.ink,
                borderBottomWidth: 2,
                borderBottomColor: colors.ink,
                paddingBottom: 2,
              }}
            >
              Read the manifesto.
            </IdleText>
          </View>
        </Pressable>

        <View style={{ paddingTop: space.s4, paddingBottom: space.s6 }}>
          <IdleText variant="mono" style={{ color: colors.ink30 }}>
            IDLE / V1.0 · LESS. DONE.
          </IdleText>
        </View>
      </ScrollView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: space.s3,
      }}
    >
      <IdleText variant="mono" tone="muted">
        {label.toUpperCase()}
      </IdleText>
      <IdleText
        style={{
          fontFamily: 'BricolageGrotesque_400Regular',
          fontSize: 14,
          color: colors.ink,
        }}
      >
        {value}
      </IdleText>
    </View>
  );
}
