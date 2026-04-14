import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, radii, typography, shadows } from '../theme/tokens';
import type { Post } from '../api/types';

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
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
}

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
    height: 200,
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.verified,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  verifiedIcon: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '700',
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
    ...typography.small,
    color: colors.paidBadge,
    fontWeight: '600',
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
