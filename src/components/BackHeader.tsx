import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { useApp } from '../lib/store';
import { Row } from './ui';

export function BackHeader() {
  const { t, rtl } = useApp();
  return (
    <Row style={{ marginBottom: 12 }}>
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
        style={styles.btn}
        accessibilityRole="button"
        accessibilityLabel={t('back')}
        hitSlop={8}
      >
        <Ionicons name={rtl ? 'chevron-forward' : 'chevron-back'} size={20} color={colors.gold} />
      </Pressable>
    </Row>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
