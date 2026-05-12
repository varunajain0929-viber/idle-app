import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { colors, space } from '@/constants/tokens';
import { formatCountdown, msUntilOpen } from '@/lib/timeGate';
import { useDevOverride } from '@/lib/devOverride';
import { IdleText } from '../IdleText';
import { PinkRule } from '../PinkRule';

function clock(d: Date) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function LockedScreen() {
  const { cycle, set } = useDevOverride();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const remaining = msUntilOpen(now);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.inkDeep }} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View
        style={{
          flex: 1,
          paddingHorizontal: space.s5,
          paddingTop: space.s2,
          paddingBottom: space.s6,
        }}
      >
        <Pressable
          onLongPress={cycle}
          delayLongPress={600}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: space.s8,
          }}
        >
          <IdleText
            style={{
              fontFamily: 'JetBrainsMono_500Medium',
              fontSize: 10,
              letterSpacing: 0.18 * 10,
              color: colors.cream50,
            }}
          >
            LOCKED
          </IdleText>
          <IdleText
            style={{
              fontFamily: 'JetBrainsMono_500Medium',
              fontSize: 10,
              letterSpacing: 0.18 * 10,
              color: colors.cream50,
            }}
          >
            {clock(now)}
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
              marginTop: -space.s7,
              marginBottom: space.s5,
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

        <View style={{ flex: 1, justifyContent: 'center', gap: space.s5 }}>
          <View>
            <IdleText
              style={{
                fontFamily: 'BricolageGrotesque_800ExtraBold',
                fontSize: 44,
                letterSpacing: -0.04 * 44,
                lineHeight: 44,
                color: colors.cream,
              }}
            >
              The app is{'\n'}closed.
            </IdleText>
            <PinkRule width={36} height={4} style={{ marginTop: space.s4 }} />
          </View>

          <View style={{ marginTop: space.s4 }}>
            <Row label="Weekdays" value="9pm — 6am" />
            <Row label="Weekends" value="All day" />
            <Row label="Override" value="None" last />
          </View>

          <View style={{ marginTop: space.s5 }}>
            <IdleText
              style={{
                fontFamily: 'JetBrainsMono_500Medium',
                fontSize: 9.5,
                letterSpacing: 0.18 * 9.5,
                color: colors.cream50,
              }}
            >
              OPENS IN
            </IdleText>
            <IdleText
              style={{
                fontFamily: 'BricolageGrotesque_500Medium',
                fontSize: 28,
                letterSpacing: -0.02 * 28,
                color: colors.cream,
                marginTop: space.s1,
              }}
            >
              {formatCountdown(remaining)}
            </IdleText>
          </View>
        </View>

        <IdleText
          style={{
            fontFamily: 'JetBrainsMono_400Regular',
            fontSize: 10,
            letterSpacing: 0.18 * 10,
            color: colors.cream30,
            fontStyle: 'italic',
          }}
        >
          THIS IS ON PURPOSE. GO HOME.
        </IdleText>
      </View>
    </SafeAreaView>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: space.s3,
        borderBottomWidth: last ? 0 : 0.5,
        borderBottomColor: colors.cream12,
      }}
    >
      <IdleText
        style={{
          fontFamily: 'JetBrainsMono_400Regular',
          fontSize: 11,
          letterSpacing: 0.18 * 11,
          color: colors.cream70,
        }}
      >
        {label.toUpperCase()}
      </IdleText>
      <IdleText
        style={{
          fontFamily: 'JetBrainsMono_500Medium',
          fontSize: 11,
          letterSpacing: 0.18 * 11,
          color: colors.cream,
        }}
      >
        {value.toUpperCase()}
      </IdleText>
    </View>
  );
}
