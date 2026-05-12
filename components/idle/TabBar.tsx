import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { colors, motion, space } from '@/constants/tokens';
import { IdleText } from './IdleText';

export type TabId = 'today' | 'week' | 'rules';

const TABS: { id: TabId; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'The week' },
  { id: 'rules', label: 'The rules' },
];

const EASE = Easing.bezier(motion.easing[0], motion.easing[1], motion.easing[2], motion.easing[3]);

export function TabBar({ tab, onChange }: { tab: TabId; onChange: (next: TabId) => void }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        borderTopWidth: 0.5,
        borderTopColor: colors.ink15,
        backgroundColor: colors.cream,
        paddingTop: space.s2,
        paddingBottom: space.s2,
        paddingHorizontal: space.s4,
      }}
    >
      {TABS.map(t => (
        <Tab key={t.id} active={tab === t.id} label={t.label} onPress={() => {
          if (tab !== t.id) Haptics.selectionAsync();
          onChange(t.id);
        }} />
      ))}
    </View>
  );
}

function Tab({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  const w = useSharedValue(active ? 20 : 0);
  useEffect(() => {
    w.value = withTiming(active ? 20 : 0, { duration: 160, easing: EASE });
  }, [active, w]);
  const barStyle = useAnimatedStyle(() => ({ width: w.value }));

  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        alignItems: 'center',
        gap: space.s2,
        paddingVertical: space.s2,
      }}
    >
      <IdleText
        style={{
          fontFamily: active
            ? 'BricolageGrotesque_500Medium'
            : 'BricolageGrotesque_400Regular',
          fontSize: 13.5,
          letterSpacing: -0.01 * 13.5,
          color: active ? colors.ink : colors.ink50,
        }}
      >
        {label}
      </IdleText>
      <Animated.View style={[{ height: 2, backgroundColor: colors.pink }, barStyle]} />
    </Pressable>
  );
}
