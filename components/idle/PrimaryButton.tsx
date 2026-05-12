import { Pressable, View, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radii, space } from '@/constants/tokens';
import { IdleText } from './IdleText';

type Variant = 'primary' | 'destructive' | 'cream';

type Props = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: Variant;
  style?: ViewStyle;
};

export function PrimaryButton({
  label,
  onPress,
  disabled,
  variant = 'primary',
  style,
}: Props) {
  const bg =
    disabled
      ? colors.creamSoft
      : variant === 'destructive'
        ? colors.pink
        : variant === 'cream'
          ? colors.cream
          : colors.ink;
  const fg =
    disabled
      ? colors.ink30
      : variant === 'cream'
        ? colors.ink
        : variant === 'destructive'
          ? colors.ink
          : colors.cream;

  return (
    <Pressable
      onPress={() => {
        if (disabled) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      disabled={disabled}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderRadius: radii.sm,
          paddingVertical: space.s3,
          paddingHorizontal: space.s5,
          opacity: pressed && !disabled ? 0.85 : 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2 }}>
        <IdleText
          style={{
            fontFamily: 'BricolageGrotesque_500Medium',
            fontSize: 15,
            lineHeight: 15 * 1.2,
            color: fg,
          }}
        >
          {label}
        </IdleText>
      </View>
    </Pressable>
  );
}
