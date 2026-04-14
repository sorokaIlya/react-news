import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radii, typography } from '@/shared/theme';

interface LikeButtonProps {
  isLiked: boolean;
  likesCount: number;
  onPress: () => void;
  disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function LikeButton({
  isLiked,
  likesCount,
  onPress,
  disabled,
}: LikeButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(1.3, { damping: 4, stiffness: 400 }),
      withSpring(1, { damping: 6, stiffness: 300 }),
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <AnimatedPressable
      style={[
        styles.container,
        isLiked && styles.containerActive,
        animatedStyle,
      ]}
      onPress={handlePress}
      disabled={disabled}
    >
      <Text style={styles.icon}>{isLiked ? '❤️' : '🤍'}</Text>
      <Text style={[styles.count, isLiked && styles.countActive]}>
        {likesCount}
      </Text>
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
    fontSize: 18,
  },
  count: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  countActive: {
    color: colors.like,
  },
});
