import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

import {
  useFonts,
  BricolageGrotesque_400Regular,
  BricolageGrotesque_500Medium,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
} from '@expo-google-fonts/manrope';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';

import { colors } from '@/constants/tokens';
import { TasksProvider } from '@/store/tasks';
import { SettingsProvider } from '@/store/settings';
import { AuthProvider } from '@/store/auth';
import { DevOverrideProvider } from '@/lib/devOverride';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BricolageGrotesque_400Regular,
    BricolageGrotesque_500Medium,
    BricolageGrotesque_800ExtraBold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.cream,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 60,
            height: 8,
            backgroundColor: colors.pink,
          }}
        />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <DevOverrideProvider>
        <AuthProvider>
          <SettingsProvider>
            <TasksProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.cream },
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
                <Stack.Screen name="sign-in" options={{ animation: 'fade' }} />
                <Stack.Screen name="sign-up" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="forgot-password" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen
                  name="add-task"
                  options={{
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                  }}
                />
                <Stack.Screen
                  name="about"
                  options={{
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                  }}
                />
                <Stack.Screen
                  name="dev"
                  options={{
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                  }}
                />
                <Stack.Screen
                  name="week-card"
                  options={{
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                  }}
                />
              </Stack>
              <StatusBar style="dark" />
            </TasksProvider>
          </SettingsProvider>
        </AuthProvider>
      </DevOverrideProvider>
    </SafeAreaProvider>
  );
}
