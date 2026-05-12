import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, space } from '@/constants/tokens';
import { useDevOverride } from '@/lib/devOverride';
import { IdleText } from './IdleText';
import { Wordmark } from './Wordmark';

export function BrandBar() {
  const { cycle } = useDevOverride();
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.cream }}>
      <View
        style={{
          paddingHorizontal: space.s5,
          paddingTop: space.s3,
          paddingBottom: space.s3,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.ink15,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable
          onLongPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            cycle();
          }}
          delayLongPress={600}
          hitSlop={10}
        >
          <Wordmark size={22} />
        </Pressable>
        {__DEV__ ? (
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              router.push('/dev');
            }}
            hitSlop={12}
            style={({ pressed }) => ({
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
              DEV
            </IdleText>
          </Pressable>
        ) : (
          <IdleText
            style={{
              fontFamily: 'JetBrainsMono_500Medium',
              fontSize: 10,
              letterSpacing: 0.18 * 10,
              color: colors.ink30,
            }}
          >
            LESS. DONE.
          </IdleText>
        )}
      </View>
    </SafeAreaView>
  );
}
