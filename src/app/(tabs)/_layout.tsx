import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadow } from '../../theme';
import { useApp } from '../../lib/store';
import { haptic } from '../../components/ui';

type IconName = keyof typeof Ionicons.glyphMap;
const ICONS: Record<string, [IconName, IconName]> = {
  index: ['sunny-outline', 'sunny'],
  ask: ['add-circle-outline', 'add-circle'],
  answered: ['sparkles-outline', 'sparkles'],
  me: ['person-circle-outline', 'person-circle'],
};

function TabBar({ state, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { t, rtl } = useApp();
  const labels: Record<string, string> = {
    index: t('tabToday'),
    ask: t('tabAsk'),
    answered: t('tabAnswered'),
    me: t('tabMe'),
  };
  const routes = rtl ? [...state.routes].reverse() : state.routes;

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
      <View style={[styles.bar, shadow]}>
        {routes.map((route) => {
          const focused = state.routes[state.index].key === route.key;
          const [off, on] = ICONS[route.name] ?? ['ellipse-outline', 'ellipse'];
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={labels[route.name]}
              onPress={() => {
                if (!focused) {
                  haptic.select();
                  navigateToTab(route.key);
                }
              }}
              style={styles.item}
            >
              <View style={[styles.iconPill, focused && styles.iconPillActive]}>
                <Ionicons name={focused ? on : off} size={22} color={focused ? colors.bgDeep : colors.textMuted} />
              </View>
              <Text
                style={[
                  styles.label,
                  { fontFamily: rtl ? fonts.arabic : fonts.bodyMedium, fontSize: rtl ? 12 : 10.5 },
                  focused && { color: colors.gold },
                ]}
              >
                {labels[route.name]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(p) => <TabBar {...p} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="ask" />
      <Tabs.Screen name="answered" />
      <Tabs.Screen name="me" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16 },
  bar: {
    flexDirection: 'row',
    backgroundColor: Platform.OS === 'android' ? '#0E1F19' : 'rgba(14,31,25,0.97)',
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineStrong,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  item: { flex: 1, alignItems: 'center', gap: 3 },
  iconPill: { width: 48, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  iconPillActive: { backgroundColor: colors.gold },
  label: { color: colors.textMuted, letterSpacing: 0.3 },
});
