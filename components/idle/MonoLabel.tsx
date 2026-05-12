import { View, type ViewStyle } from 'react-native';
import { colors, space } from '@/constants/tokens';
import { IdleText } from './IdleText';

type Props = {
  children: string;
  tone?: 'ink' | 'cream';
  style?: ViewStyle;
};

export function MonoLabel({ children, tone = 'ink', style }: Props) {
  const dotColor = colors.pink;
  const textTone = tone === 'cream' ? 'cream' : 'ink';
  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'center', gap: space.s2 },
        style,
      ]}
    >
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          backgroundColor: dotColor,
        }}
      />
      <IdleText variant="mono" tone={textTone}>
        {children.toUpperCase()}
      </IdleText>
    </View>
  );
}
