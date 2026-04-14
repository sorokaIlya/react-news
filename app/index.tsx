import React, { useCallback } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  Text,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Stack } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { useStore } from '../src/context/StoreContext';
import { PostCard } from '../src/components/PostCard';
import { TierTabs } from '../src/components/TierTabs';
import { colors, spacing, typography } from '../src/theme/tokens';
import type { TierFilter } from '../src/api/types';

const FeedScreen = observer(function FeedScreen() {
  const { feed } = useStore();

  const handleTierChange = useCallback(
    (tier: TierFilter) => feed.setTier(tier),
    [feed],
  );

  const handleEndReached = useCallback(() => {
    feed.loadMore();
  }, [feed]);

  const handleRefresh = useCallback(() => {
    feed.refresh();
  }, [feed]);

  const renderFooter = () => {
    if (!feed.isLoadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Mecenate' }} />

      <TierTabs selected={feed.tier} onSelect={handleTierChange} />

      {feed.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : feed.error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{feed.error}</Text>
        </View>
      ) : (
        <FlatList
          data={feed.posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PostCard post={item} />}
          contentContainerStyle={styles.list}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={feed.isRefreshing}
              onRefresh={handleRefresh}
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
