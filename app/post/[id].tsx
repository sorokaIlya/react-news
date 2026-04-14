import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../src/context/StoreContext';
import { LikeButton } from '../../src/components/LikeButton';
import { CommentItem } from '../../src/components/CommentItem';
import { CommentInput } from '../../src/components/CommentInput';
import { colors, spacing, radii, typography } from '../../src/theme/tokens';

const PostDetailScreen = observer(function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const root = useStore();
  const { postDetail, comments } = root;

  useEffect(() => {
    postDetail.load(id);
    comments.load(id);
    return () => {
      postDetail.reset();
      comments.reset();
    };
  }, [id, postDetail, comments]);

  const handleLike = useCallback(async () => {
    const result = await postDetail.toggleLike();
    if (result) {
      root.syncLikeToFeed(result.postId, result.isLiked, result.likesCount);
    }
  }, [postDetail, root]);

  const handleAddComment = useCallback(
    async (text: string) => {
      const ok = await comments.send(text);
      if (ok) {
        postDetail.updateCommentsCount(1);
      }
    },
    [comments, postDetail],
  );

  const handleEndReached = useCallback(() => {
    comments.loadMore();
  }, [comments]);

  const post = postDetail.post;

  if (postDetail.isLoading || !post) {
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
            disabled={postDetail.isLiking}
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

      {comments.isLoading && (
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
        data={comments.comments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CommentItem comment={item} />}
        ListHeaderComponent={headerComponent}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          comments.isLoadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !comments.isLoading ? (
            <View style={styles.emptyComments}>
              <Text style={styles.emptyText}>Пока нет комментариев</Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />

      <CommentInput
        onSubmit={handleAddComment}
        isLoading={comments.isSending}
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
    height: 240,
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
    width: 44,
    height: 44,
    borderRadius: 22,
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
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.verified,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  verifiedIcon: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  subscribers: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
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
    fontSize: 32,
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
