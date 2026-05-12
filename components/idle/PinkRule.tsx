import { View, type ViewStyle } from 'react-native';
import { colors } from '@/constants/tokens';

type Props = {
  width?: number | `${number}%`;
  height?: number;
  style?: ViewStyle;
};

export function PinkRule({ width = 64, height = 6, style }: Props) {
  return (
    <View
      style={[
        { width: width as number, height, backgroundColor: colors.pink },
        style,
      ]}
    />
  );
}
