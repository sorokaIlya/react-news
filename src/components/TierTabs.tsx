import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, radii, typography } from '../theme/tokens';
import type { TierFilter } from '../api/types';

const TABS: { key: TierFilter; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'free', label: 'Бесплатные' },
  { key: 'paid', label: 'Платные' },
];

interface TierTabsProps {
  selected: TierFilter;
  onSelect: (tier: TierFilter) => void;
}

export function TierTabs({ selected, onSelect }: TierTabsProps) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const active = tab.key === selected;
        return (
          <Pressable
            key={tab.key}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onSelect(tab.key)}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceSecondary,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.captionMedium,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
  },
});
