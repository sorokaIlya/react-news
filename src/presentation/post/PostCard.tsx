import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { circle, colors, radii, shadows, sizes, spacing, typography } from '@/shared/theme';
import type { Post } from '@/transport/api';
import {observer} from "mobx-react-lite";

type PostCardProps = {
  post: Post;
};

export const PostCard = observer(({ post }: PostCardProps)=> {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push(`/post/${post.id}`)}
    >
      <Image source={{ uri: post.coverUrl }} style={styles.cover} />

      <View style={styles.content}>
        <View style={styles.authorRow}>
          <Image source={{ uri: post.author.avatarUrl }} style={styles.avatar} />
          <View style={styles.authorInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.authorName} numberOfLines={1}>
                {post.author.displayName}
              </Text>
              {post.author.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedIcon}>✓</Text>
                </View>
              )}
            </View>
            <Text style={styles.username}>@{post.author.username}</Text>
          </View>
          {post.tier === 'paid' && (
            <View style={styles.paidBadge}>
              <Text style={styles.paidText}>Платный</Text>
            </View>
          )}
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {post.title}
        </Text>
        <Text style={styles.preview} numberOfLines={2}>
          {post.preview}
        </Text>

        <View style={styles.stats}>
          <Text style={styles.stat}>
            {post.isLiked ? '❤️' : '🤍'} {post.likesCount}
          </Text>
          <Text style={styles.stat}>💬 {post.commentsCount}</Text>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.985 }],
  },
  cover: {
    width: '100%',
    height: sizes.cover.feed,
    backgroundColor: colors.surfaceSecondary,
  },
  content: {
    padding: spacing.lg,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: sizes.avatar.md,
    height: sizes.avatar.md,
    borderRadius: circle(sizes.avatar.md),
    backgroundColor: colors.surfaceSecondary,
  },
  authorInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    ...typography.captionMedium,
    color: colors.text,
  },
  verifiedBadge: {
    width: sizes.badge.sm,
    height: sizes.badge.sm,
    borderRadius: circle(sizes.badge.sm),
    backgroundColor: colors.verified,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  verifiedIcon: {
    ...typography.iconSm,
    color: colors.white,
  },
  username: {
    ...typography.small,
    color: colors.textTertiary,
  },
  paidBadge: {
    backgroundColor: colors.paidBadgeBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  paidText: {
    ...typography.smallBold,
    color: colors.paidBadge,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  preview: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  stat: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
