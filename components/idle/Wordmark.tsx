import { useState } from 'react';
import { View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import { colors } from '@/constants/tokens';
import { IdleText } from './IdleText';

type Props = {
  size?: number;
  tone?: 'ink' | 'cream';
  style?: ViewStyle;
};

export function Wordmark({ size = 28, tone = 'ink', style }: Props) {
  const [wordWidth, setWordWidth] = useState(0);
  const textColor = tone === 'cream' ? colors.cream : colors.ink;

  const onWordLayout = (e: LayoutChangeEvent) => {
    setWordWidth(e.nativeEvent.layout.width);
  };

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'baseline' }, style]}>
      <View style={{ position: 'relative' }}>
        <IdleText
          onLayout={onWordLayout}
          style={{
            fontFamily: 'BricolageGrotesque_800ExtraBold',
            fontSize: size,
            lineHeight: size,
            letterSpacing: -0.04 * size,
            color: textColor,
          }}
        >
          Idle
        </IdleText>
        {wordWidth > 0 && (
          <View
            style={{
              position: 'absolute',
              left: -size * 0.03,
              width: wordWidth + size * 0.06,
              top: size * 0.48,
              height: Math.max(2, size * 0.14),
              backgroundColor: colors.pink,
            }}
          />
        )}
      </View>
      <IdleText
        style={{
          fontFamily: 'BricolageGrotesque_800ExtraBold',
          fontSize: size,
          lineHeight: size,
          letterSpacing: -0.04 * size,
          color: textColor,
        }}
      >
        .
      </IdleText>
    </View>
  );
}
