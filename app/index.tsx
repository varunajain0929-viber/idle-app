import { useEffect, useState } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { colors } from '@/constants/tokens';
import { getAppState } from '@/lib/timeGate';
import { applyOverride, useDevOverride } from '@/lib/devOverride';
import { useAuth } from '@/store/auth';
import { TodayScreen } from '@/components/idle/screens/TodayScreen';
import { WeekScreen } from '@/components/idle/screens/WeekScreen';
import { RulesScreen } from '@/components/idle/screens/RulesScreen';
import { LockedScreen } from '@/components/idle/screens/LockedScreen';
import { BurnScreen } from '@/components/idle/screens/BurnScreen';
import { TabBar, type TabId } from '@/components/idle/TabBar';
import { BrandBar } from '@/components/idle/BrandBar';
import { LEGACY_ONBOARDED_KEY, onboardedKeyFor } from './onboarding';

export default function Index() {
  const [now, setNow] = useState(() => new Date());
  const [tab, setTab] = useState<TabId>('today');
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const { override } = useDevOverride();
  const { hydrated: authReady, user } = useAuth();

  useEffect(() => {
    if (!user) {
      setOnboardingReady(false);
      return;
    }
    (async () => {
      const perUser = await AsyncStorage.getItem(onboardedKeyFor(user.id));
      if (perUser) {
        setNeedsOnboarding(false);
        setOnboardingReady(true);
        return;
      }
      // First time this user has touched this device. The legacy device-wide
      // flag (if present) only counts for the *first* account that arrives
      // after the auth upgrade — once migrated, we delete it so future accounts
      // see onboarding fresh.
      const legacy = await AsyncStorage.getItem(LEGACY_ONBOARDED_KEY);
      if (legacy) {
        await AsyncStorage.setItem(onboardedKeyFor(user.id), '1');
        await AsyncStorage.removeItem(LEGACY_ONBOARDED_KEY);
        setNeedsOnboarding(false);
      } else {
        setNeedsOnboarding(true);
      }
      setOnboardingReady(true);
    })();
  }, [user]);

  // Auth gate runs first — if signed out, send them to sign-in. Onboarding
  // happens after sign-in (people new to Idle still need the manifesto cards).
  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      router.replace('/sign-in');
      return;
    }
    if (onboardingReady && needsOnboarding) {
      router.replace('/onboarding');
    }
  }, [authReady, user, onboardingReady, needsOnboarding]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!authReady || !user || !onboardingReady || needsOnboarding) {
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
