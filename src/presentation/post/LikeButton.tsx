import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { colors, radii, spacing, typography } from '@/shared/theme';

type LikeButtonProps = {
  isLiked: boolean;
  likesCount: number;
  onPress: () => void;
  disabled?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING_UP = { damping: 4, stiffness: 400 };
const SPRING_DOWN = { damping: 6, stiffness: 300 };
const PRESSED_SCALE = 1.3;
const REST_SCALE = 1;

export function LikeButton({ isLiked, likesCount, onPress, disabled }: LikeButtonProps) {
  const scale = useSharedValue(REST_SCALE);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(PRESSED_SCALE, SPRING_UP),
      withSpring(REST_SCALE, SPRING_DOWN),
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <AnimatedPressable
      style={[styles.container, isLiked && styles.containerActive, animatedStyle]}
      onPress={handlePress}
      disabled={disabled}
    >
      <Text style={styles.icon}>{isLiked ? '❤️' : '🤍'}</Text>
      <Text style={[styles.count, isLiked && styles.countActive]}>{likesCount}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceSecondary,
    gap: spacing.xs,
  },
  containerActive: {
    backgroundColor: colors.likeBg,
  },
  icon: {
    ...typography.iconLg,
  },
  count: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  countActive: {
    color: colors.like,
  },
});
