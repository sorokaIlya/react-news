import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack } from 'expo-router';
import { observer } from 'mobx-react-lite';

import { useStores } from '@/composition';
import { TierTabs } from '@/presentation/feed';
import { PostCard } from '@/presentation/post';
import { usePosts } from '@/read-model/posts';
import { colors, spacing, typography } from '@/shared/theme';
import { getErrorMessage } from '@/shared/lib/getErrorMessage';

/**
 * Feed screen.
 *
 * Tier filter lives in `UiStore` (MobX) — survives unmounts and is shared
 * across the app. The list of posts itself lives in the read-model layer,
 * keyed by the current tier. Selecting a tab is a single MobX action.
 */
export const FeedScreen = observer(function FeedScreen() {
  const { ui, realtimeStatus } = useStores();
  const {
    posts,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    refresh,
    loadMore,
  } = usePosts(ui.tier, {
    // When WS is healthy this is `false` and React Query stays idle. When
    // RealtimeStatusStore flips into `fallback`, the observer re-renders
    // with a numeric interval and RQ starts polling.
    refetchInterval: realtimeStatus.pollingIntervalMs,
  });

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Mecenate' }} />

      <TierTabs selected={ui.tier} onSelect={ui.setTier} />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{getErrorMessage(error)}</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PostCard post={item} />}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Нет публикаций</Text>
            </View>
          }
        />
      )}
    </View>
  );
});

export default FeedScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  list: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
  },
  footer: {
    paddingVertical: spacing.xl,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
