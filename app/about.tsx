import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, space } from '@/constants/tokens';
import { IdleText } from '@/components/idle/IdleText';
import { MonoLabel } from '@/components/idle/MonoLabel';
import { PinkRule } from '@/components/idle/PinkRule';
import { Wordmark } from '@/components/idle/Wordmark';
import { closeModal } from '@/lib/closeModal';

const MANIFESTO: string[] = [
  'The to-do list is a confession of belief.',
  "You believe that if you wrote it down, you'll do it. You believe that more is the answer. You believe that the unfinished work is a debt you owe. You believe that the tool that helps you write it down faster, sort it more cleverly, sync it across more devices, will finally set you free.",
  'It will not. None of them did. None of them will.',
  'Idle is a list that fights you back.',
  'It holds five things. Not fifty. It asks why, before it lets you add one. It deletes everything unfinished on Friday, and shuts itself off at 7 — no override, no premium tier. It treats refusal as a kind of completion. It is on your side, which is why it will not flatter you.',
  'You have not failed to be productive. You have been productive, brilliantly, for years, and it is hollowing you out. The work that matters does not get bigger when you make the list bigger. It gets smaller, and quieter, and harder to hear.',
  'Idle is for the quiet. For the small thing. For the no.',
];

export default function About() {
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
            closeModal();
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
        <View style={{ paddingTop: space.s6, paddingBottom: space.s5 }}>
          <MonoLabel style={{ marginBottom: space.s3 }}>MANIFESTO</MonoLabel>
          <IdleText
            style={{
              fontFamily: 'BricolageGrotesque_800ExtraBold',
              fontSize: 38,
              letterSpacing: -0.04 * 38,
              lineHeight: 38,
              color: colors.ink,
            }}
          >
            Less. Done.
          </IdleText>
          <PinkRule width={36} height={4} style={{ marginTop: space.s4 }} />
        </View>

        {MANIFESTO.map((para, i) => (
          <IdleText
            key={i}
            style={{
              fontFamily: 'BricolageGrotesque_400Regular',
              fontSize: 17,
              lineHeight: 17 * 1.6,
              color: colors.ink,
              marginBottom: space.s4,
            }}
          >
            {para}
          </IdleText>
        ))}

        <View
          style={{
            marginTop: space.s6,
            paddingTop: space.s4,
            borderTopWidth: 0.5,
            borderTopColor: colors.ink15,
          }}
        >
          <IdleText variant="mono" tone="muted" style={{ marginBottom: space.s2 }}>
            IDLE / V1.0
          </IdleText>
          <IdleText variant="bodySm" tone="muted">
            Productivity for people who hate productivity.
          </IdleText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
