import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { observer } from 'mobx-react-lite';

import { useStores } from '@/composition';
import { CommentInput, CommentItem } from '@/presentation/comment';
import { LikeButton } from '@/presentation/post';
import { useComments } from '@/read-model/comments';
import { usePost } from '@/read-model/posts';
import {
  circle,
  colors,
  radii,
  sizes,
  spacing,
  typography,
} from '@/shared/theme';

export const PostDetailScreen = observer(function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { posts, realtimeStatus } = useStores();

  // Same fallback contract as the feed: read-model polling activates only
  // when the domain layer reports fallback mode.
  const refetchInterval = realtimeStatus.pollingIntervalMs;

  const { data: post, isPending } = usePost(id, { refetchInterval });
  const {
    comments,
    isLoading: commentsLoading,
    isLoadingMore: commentsLoadingMore,
    loadMore: loadMoreComments,
  } = useComments(id, { refetchInterval });

  const isLikePending = id ? posts.isLiking(id) : false;
  const isCommentPending = id ? posts.isSubmittingComment(id) : false;

  const handleLike = useCallback(() => {
    if (!id || isLikePending) return;
    void posts.toggleLike(id);
  }, [id, isLikePending, posts]);

  const handleAddComment = useCallback(
    (text: string) => {
      if (!id || isCommentPending) return;
      void posts.addComment(id, text);
    },
    [id, isCommentPending, posts],
  );

  const handleEndReached = useCallback(() => {
    loadMoreComments();
  }, [loadMoreComments]);

  if (isPending || !post) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: '' }} />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const headerComponent = (
    <View>
      <Image source={{ uri: post.coverUrl }} style={styles.cover} />

      <View style={styles.body}>
        <View style={styles.authorRow}>
          <Image
            source={{ uri: post.author.avatarUrl }}
            style={styles.avatar}
          />
          <View style={styles.authorInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.authorName}>{post.author.displayName}</Text>
              {post.author.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedIcon}>✓</Text>
                </View>
              )}
            </View>
            <Text style={styles.subscribers}>
              {post.author.subscribersCount.toLocaleString()} подписчиков
            </Text>
          </View>
          {post.tier === 'paid' && (
            <View style={styles.paidBadge}>
              <Text style={styles.paidText}>Платный</Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>{post.title}</Text>

        {post.body ? (
          <Text style={styles.bodyText}>{post.body}</Text>
        ) : (
          <View style={styles.lockedContainer}>
            <Text style={styles.lockedIcon}>🔒</Text>
            <Text style={styles.lockedText}>
              Контент доступен только подписчикам
            </Text>
          </View>
        )}

        <View style={styles.actionsRow}>
          <LikeButton
            isLiked={post.isLiked}
            likesCount={post.likesCount}
            onPress={handleLike}
            disabled={isLikePending}
          />
          <View style={styles.commentsBadge}>
            <Text style={styles.commentsCount}>
              💬 {post.commentsCount}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.commentsHeader}>
        <Text style={styles.commentsTitle}>Комментарии</Text>
      </View>

      {commentsLoading && (
        <View style={styles.commentsLoading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: post.author.displayName,
          headerBackTitle: 'Назад',
        }}
      />

      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CommentItem comment={item} />}
        ListHeaderComponent={headerComponent}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          commentsLoadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !commentsLoading ? (
            <View style={styles.emptyComments}>
              <Text style={styles.emptyText}>Пока нет комментариев</Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />

      <CommentInput
        onSubmit={handleAddComment}
        isLoading={isCommentPending}
      />
    </View>
  );
});

export default PostDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  cover: {
    width: '100%',
    height: sizes.cover.detail,
    backgroundColor: colors.surfaceSecondary,
  },
  body: {
    padding: spacing.lg,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: sizes.avatar.lg,
    height: sizes.avatar.lg,
    borderRadius: circle(sizes.avatar.lg),
    backgroundColor: colors.surfaceSecondary,
  },
  authorInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  verifiedBadge: {
    width: sizes.badge.md,
    height: sizes.badge.md,
    borderRadius: circle(sizes.badge.md),
    backgroundColor: colors.verified,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  verifiedIcon: {
    ...typography.iconMd,
    color: colors.white,
  },
  subscribers: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xxs,
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
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.md,
  },
  bodyText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  lockedContainer: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radii.md,
    padding: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  lockedIcon: {
    ...typography.iconXl,
    marginBottom: spacing.sm,
  },
  lockedText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  commentsBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceSecondary,
  },
  commentsCount: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  commentsHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  commentsTitle: {
    ...typography.h3,
    color: colors.text,
  },
  commentsLoading: {
    paddingVertical: spacing.xl,
  },
  footer: {
    paddingVertical: spacing.xl,
  },
  emptyComments: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textTertiary,
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
});
