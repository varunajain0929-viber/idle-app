import { Text, type TextProps, type TextStyle } from 'react-native';
import { colors, type } from '@/constants/tokens';

type Variant = keyof typeof type;
type Tone = 'ink' | 'cream' | 'pink' | 'muted';

type Props = TextProps & {
  variant?: Variant;
  tone?: Tone;
  style?: TextStyle | TextStyle[];
};

const toneToColor: Record<Tone, string> = {
  ink: colors.ink,
  cream: colors.cream,
  pink: colors.pink,
  muted: colors.muted,
};

export function IdleText({ variant = 'body', tone = 'ink', style, ...rest }: Props) {
  return (
    <Text
      {...rest}
      style={[type[variant], { color: toneToColor[tone] }, style as TextStyle]}
    />
  );
}
