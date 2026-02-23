import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_BASE_HEIGHT } from '@/components/custom-tab-bar';
import { ColorScheme } from '@/constants/colors';
import { useLanguage } from '@/contexts/language';
import { useTheme } from '@/contexts/theme';
import { HistoryEntry, useRecipeHistory } from '@/hooks/use-recipe-history';
import { Translations } from '@/lib/i18n';
import { CONTENT_MAX_W, IS_TABLET } from '@/lib/responsive';

function timeAgo(iso: string, r: Translations['recipes']): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return r.daysAgo(d);
  if (h > 0) return r.hoursAgo(h);
  if (m > 0) return r.minutesAgo(m);
  return r.justNow;
}

export default function RecipesScreen() {
  const { history, removeEntry, refresh } = useRecipeHistory();
  const router = useRouter();

  useFocusEffect(useCallback(() => {
    refresh();
  }, []));
  const { colors: C, isDark } = useTheme();

  useFocusEffect(useCallback(() => {
    setStatusBarStyle(isDark ? 'light' : 'dark');
  }, [isDark]));
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const bottomPad = TAB_BAR_BASE_HEIGHT + Math.max(insets.bottom, 12);

  const handlePress = useCallback(
    (entry: HistoryEntry) => {
      router.push({
        pathname: '/recipe-result',
        params: {
          photos: JSON.stringify([]),
          text: entry.textDescription ?? '',
          thumbnail: entry.thumbnailUri ?? '',
          cachedResult: JSON.stringify(entry.result),
        },
      });
    },
    [router]
  );

  if (history.length === 0) {
    return (
      <SafeAreaView style={[styles.emptyRoot, { paddingBottom: bottomPad }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.emptyIcon}>
          <Text style={{ fontSize: IS_TABLET ? 56 : 44 }}>🍽️</Text>
        </View>
        <Text style={styles.emptyTitle}>{t.recipes.noRecipesTitle}</Text>
        <Text style={styles.emptySub}>{t.recipes.noRecipesSub}</Text>
        <TouchableOpacity
          style={styles.emptyBtn}
          onPress={() => router.replace('/')}
          activeOpacity={0.85}>
          <Text style={styles.emptyBtnText}>{t.recipes.openCamera}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.recipes.myRecipes}</Text>
        <View style={styles.countChip}>
          <Text style={styles.countChipText}>{history.length}</Text>
        </View>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        style={styles.flatList}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad }]}
        onRefresh={refresh}
        refreshing={false}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <HistoryCard item={item} onPress={handlePress} onDelete={removeEntry} />
        )}
      />
    </SafeAreaView>
  );
}

function HistoryCard({
  item,
  onPress,
  onDelete,
}: {
  item: HistoryEntry;
  onPress: (e: HistoryEntry) => void;
  onDelete: (id: string) => void;
}) {
  const { colors: C } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(C), [C]);
  const firstRecipe = item.result.recipes[0];
  const extraCount = item.result.recipes.length - 1;

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item)} activeOpacity={0.8}>
      {/* Thumbnail */}
      {item.thumbnailUri ? (
        <Image source={{ uri: item.thumbnailUri }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Text style={{ fontSize: 30 }}>🥘</Text>
        </View>
      )}

      {/* Content */}
      <View style={styles.cardContent}>
        {/* Recipe name */}
        <Text style={styles.recipeName} numberOfLines={1}>
          {firstRecipe.emoji} {firstRecipe.name}
        </Text>

        {/* Detected ingredients */}
        {item.result.detectedIngredients.length > 0 && (
          <Text style={styles.ingredientsList} numberOfLines={1}>
            {item.result.detectedIngredients.slice(0, 5).join(' · ')}
          </Text>
        )}

        {/* Bottom row */}
        <View style={styles.cardBottom}>
          {extraCount > 0 && (
            <View style={styles.extraChip}>
              <Text style={styles.extraChipText}>{t.recipes.moreRecipes(extraCount)}</Text>
            </View>
          )}
          <View style={styles.cardMeta}>
            <Text style={styles.time}>{timeAgo(item.createdAt, t.recipes)}</Text>
            <TouchableOpacity
              onPress={() => onDelete(item.id)}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              style={styles.deleteBtn}>
              <Text style={styles.deleteIcon}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function createStyles(C: ColorScheme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: C.bg,
    },
    emptyRoot: {
      flex: 1,
      backgroundColor: C.bg,
      alignItems: 'center',
      justifyContent: 'center',
      padding: IS_TABLET ? 80 : 40,
    },
    emptyIcon: {
      width: IS_TABLET ? 120 : 96,
      height: IS_TABLET ? 120 : 96,
      borderRadius: 30,
      backgroundColor: C.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
      borderWidth: 1,
      borderColor: C.border,
    },
    emptyTitle: {
      fontSize: IS_TABLET ? 32 : 26,
      fontWeight: '700',
      color: C.text,
      marginBottom: 10,
      textAlign: 'center',
    },
    emptySub: {
      fontSize: IS_TABLET ? 18 : 15,
      color: C.text2,
      textAlign: 'center',
      lineHeight: IS_TABLET ? 28 : 23,
      marginBottom: 32,
      maxWidth: 420,
    },
    emptyBtn: {
      backgroundColor: C.accent,
      paddingHorizontal: IS_TABLET ? 44 : 32,
      paddingVertical: IS_TABLET ? 19 : 15,
      borderRadius: 30,
      shadowColor: C.accent,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.38,
      shadowRadius: 12,
    },
    emptyBtnText: {
      color: C.white,
      fontWeight: '700',
      fontSize: IS_TABLET ? 19 : 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
      maxWidth: CONTENT_MAX_W,
      alignSelf: 'center',
      width: '100%',
    },
    headerTitle: {
      fontSize: IS_TABLET ? 32 : 28,
      fontWeight: '800',
      color: C.text,
      letterSpacing: -0.5,
      flex: 1,
    },
    flatList: {
      maxWidth: CONTENT_MAX_W,
      alignSelf: 'center',
      width: '100%',
    },
    countChip: {
      backgroundColor: C.surface2,
      borderWidth: 1,
      borderColor: C.border,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 20,
    },
    countChipText: {
      color: C.text2,
      fontSize: 14,
      fontWeight: '600',
    },
    list: {
      paddingHorizontal: IS_TABLET ? 24 : 16,
      paddingTop: 12,
      paddingBottom: 32,
    },
    separator: {
      height: IS_TABLET ? 14 : 10,
    },
    card: {
      flexDirection: 'row',
      backgroundColor: C.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: C.border,
      overflow: 'hidden',
      minHeight: IS_TABLET ? 130 : 100,
    },
    thumb: {
      width: IS_TABLET ? 130 : 92,
      alignSelf: 'stretch',
    },
    thumbPlaceholder: {
      backgroundColor: C.surface2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardContent: {
      flex: 1,
      paddingHorizontal: IS_TABLET ? 18 : 14,
      paddingVertical: IS_TABLET ? 18 : 14,
      justifyContent: 'space-between',
    },
    recipeName: {
      fontSize: IS_TABLET ? 19 : 15,
      fontWeight: '700',
      color: C.text,
      letterSpacing: -0.2,
    },
    ingredientsList: {
      fontSize: IS_TABLET ? 14 : 12,
      color: C.text3,
      lineHeight: IS_TABLET ? 22 : 18,
    },
    cardBottom: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    extraChip: {
      backgroundColor: C.accentLight,
      borderWidth: 1,
      borderColor: C.accent + '44',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    extraChipText: {
      color: C.accent,
      fontSize: 11,
      fontWeight: '700',
    },
    cardMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginLeft: 'auto',
    },
    time: {
      fontSize: IS_TABLET ? 13 : 11,
      color: C.text3,
      fontWeight: '500',
    },
    deleteBtn: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: C.surface2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteIcon: {
      fontSize: 10,
      color: C.text3,
      fontWeight: '800',
    },
  });
}
