import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

export type StrikeLine = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Props = {
  progress: SharedValue<number>;
  line: StrikeLine;
  color: string;
};

// One animated strike-through bar, positioned over a single line of text.
// Render one of these per line returned by Text's onTextLayout so multi-line
// tasks get a strike that actually crosses each line — not a single bar that
// lands in the gap between them.
export function AnimatedStrikeLine({ progress, line, color }: Props) {
  const style = useAnimatedStyle(() => ({
    width: progress.value * line.width,
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: line.x,
          top: line.y + line.height / 2 - 1,
          height: 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}
