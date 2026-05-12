import { Pressable, View, type ViewStyle } from 'react-native';
import { colors, space } from '@/constants/tokens';
import { IdleText } from './IdleText';

type Props = {
  label: string;
  onPress?: () => void;
  tone?: 'ink' | 'cream';
  style?: ViewStyle;
};

export function GhostButton({ label, onPress, tone = 'ink', style }: Props) {
  const color = tone === 'cream' ? colors.cream : colors.ink;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          paddingVertical: space.s2,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <View style={{ borderBottomWidth: 2, borderBottomColor: color, paddingBottom: 2 }}>
        <IdleText
          style={{
            fontFamily: 'BricolageGrotesque_500Medium',
            fontSize: 15,
            color,
          }}
        >
          {label}
        </IdleText>
      </View>
    </Pressable>
  );
}
