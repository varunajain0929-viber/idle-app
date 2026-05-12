import { router } from 'expo-router';

// `router.back()` fails silently on web when the back-stack is empty — which
// happens after a Metro hot-reload or if the user lands on a modal route
// directly (refresh, deep link). Always-replace-to-home is safe on both web
// and native: native nav treats it as "go to home tab", web treats it as a
// URL change.
export function closeModal() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
