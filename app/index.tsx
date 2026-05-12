import { useEffect, useState } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { colors } from '@/constants/tokens';
import { getAppState } from '@/lib/timeGate';
import { applyOverride, useDevOverride } from '@/lib/devOverride';
import { TodayScreen } from '@/components/idle/screens/TodayScreen';
import { WeekScreen } from '@/components/idle/screens/WeekScreen';
import { RulesScreen } from '@/components/idle/screens/RulesScreen';
import { LockedScreen } from '@/components/idle/screens/LockedScreen';
import { BurnScreen } from '@/components/idle/screens/BurnScreen';
import { TabBar, type TabId } from '@/components/idle/TabBar';
import { BrandBar } from '@/components/idle/BrandBar';
import { ONBOARDED_KEY } from './onboarding';

export default function Index() {
  const [now, setNow] = useState(() => new Date());
  const [tab, setTab] = useState<TabId>('today');
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const { override } = useDevOverride();

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDED_KEY).then(v => {
      setNeedsOnboarding(!v);
      setOnboardingReady(true);
    });
  }, []);

  useEffect(() => {
    if (onboardingReady && needsOnboarding) {
      router.replace('/onboarding');
    }
  }, [onboardingReady, needsOnboarding]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!onboardingReady || needsOnboarding) {
    return <View style={{ flex: 1, backgroundColor: colors.cream }} />;
  }

  const actual = getAppState(now);
  const state = applyOverride(actual, override);

  if (state === 'locked') return <LockedScreen />;
  if (state === 'burn') return <BurnScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <BrandBar />
      <View style={{ flex: 1 }}>
        {tab === 'today' && <TodayScreen />}
        {tab === 'week' && <WeekScreen />}
        {tab === 'rules' && <RulesScreen />}
      </View>
      <TabBar tab={tab} onChange={setTab} />
    </View>
  );
}
