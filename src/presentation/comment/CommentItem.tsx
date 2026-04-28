import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { circle, colors, sizes, spacing, typography } from '@/shared/theme';
import type { Comment } from '@/transport/api';

type CommentItemProps = {
  comment: Comment;
};

const MS_PER_MINUTE = 60_000;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;

function formatTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / MS_PER_MINUTE);
  if (mins < 1) return 'только что';
  if (mins < MINUTES_PER_HOUR) return `${mins} мин`;
  const hours = Math.floor(mins / MINUTES_PER_HOUR);
  if (hours < HOURS_PER_DAY) return `${hours} ч`;
  const days = Math.floor(hours / HOURS_PER_DAY);
  return `${days} д`;
}

export function CommentItem({ comment }: CommentItemProps) {
  return (
    <View style={styles.container}>
      <Image source={{ uri: comment.author.avatarUrl }} style={styles.avatar} />
      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {comment.author.displayName}
          </Text>
          <Text style={styles.time}>{formatTime(comment.createdAt)}</Text>
        </View>
        <Text style={styles.text}>{comment.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  avatar: {
    width: sizes.avatar.sm,
    height: sizes.avatar.sm,
    borderRadius: circle(sizes.avatar.sm),
    backgroundColor: colors.surfaceSecondary,
  },
  body: {
    flex: 1,
    marginLeft: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxs,
  },
  name: {
    ...typography.captionMedium,
    color: colors.text,
    flex: 1,
  },
  time: {
    ...typography.small,
    color: colors.textTertiary,
    marginLeft: spacing.sm,
  },
  text: {
    ...typography.body,
    color: colors.text,
  },
});
