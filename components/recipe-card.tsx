import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ColorScheme } from '@/constants/colors';
import { useLanguage } from '@/contexts/language';
import { useTheme } from '@/contexts/theme';
import { Recipe } from '@/lib/claude';
import { IS_TABLET } from '@/lib/responsive';

export default function RecipeCard({
  recipe,
  expanded,
  onToggle,
}: {
  recipe: Recipe;
  expanded: boolean;
  onToggle: () => void;
}) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const heightAnim = useRef(new Animated.Value(0)).current;
  const { colors: C } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(C), [C]);

  const diffColor =
    recipe.difficulty === 'Easy' ? C.green :
    recipe.difficulty === 'Hard' ? C.red :
    C.yellow;

  useEffect(() => {
    const toValue = expanded ? 1 : 0;
    if (expanded) {
      Animated.parallel([
        Animated.spring(rotateAnim, { toValue, useNativeDriver: true, speed: 20, bounciness: 4 }),
        Animated.timing(heightAnim, { toValue, duration: 300, useNativeDriver: false }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(rotateAnim, { toValue, useNativeDriver: true, speed: 20, bounciness: 4 }),
        Animated.timing(heightAnim, { toValue, duration: 0, useNativeDriver: false }),
      ]).start();
    }
  }, [expanded]);

  function toggle() {
    onToggle();
  }

  const maxHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 2000],
  });

  const rotation = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] });

  return (
    <View style={styles.cardShadow}>
      <View style={styles.card}>
      <TouchableOpacity onPress={toggle} activeOpacity={0.75} style={styles.header}>
        <View style={styles.headerMid}>
          <Text style={styles.name} numberOfLines={2}>{recipe.name}</Text>
          <View style={styles.meta}>
            <View style={styles.metaChip}>
              <Text style={styles.metaIcon}>⏱</Text>
              <Text style={styles.metaText}>{recipe.duration}</Text>
            </View>
            {recipe.nutrition && (
              <View style={styles.metaChip}>
                <Text style={styles.metaIcon}>🔥</Text>
                <Text style={styles.metaText}>{recipe.nutrition.calories} {t.recipeCard.kcal}</Text>
              </View>
            )}
            <View style={[styles.metaChip, { backgroundColor: diffColor + '18' }]}>
              <View style={[styles.dot, { backgroundColor: diffColor }]} />
              <Text style={[styles.metaText, { color: diffColor }]}>
                {recipe.difficulty === 'Easy' ? t.recipeCard.easy : recipe.difficulty === 'Hard' ? t.recipeCard.hard : t.recipeCard.medium}
              </Text>
            </View>
          </View>
        </View>

        <Animated.Text style={[styles.chevron, { transform: [{ rotate: rotation }] }]}>›</Animated.Text>
      </TouchableOpacity>

      <Animated.View style={{ maxHeight, overflow: 'hidden' }}>
        <View style={styles.body}>
          <View style={styles.divider} />

          {/* Nutrition */}
          {recipe.nutrition && (
            <>
              <Text style={styles.sectionLabel}>
                {t.recipeCard.nutrition} · {t.recipeCard.perServing}
              </Text>
              <View style={styles.nutritionGrid}>
                {[
                  { emoji: '🔥', value: String(recipe.nutrition.calories), label: t.recipeCard.kcal },
                  { emoji: '💪', value: recipe.nutrition.protein, label: t.recipeCard.protein },
                  { emoji: '🌾', value: recipe.nutrition.carbs, label: t.recipeCard.carbs },
                  { emoji: '🫙', value: recipe.nutrition.fat, label: t.recipeCard.fat },
                ].map((item, idx) => (
                  <View key={item.label} style={[styles.nutritionItem, idx === 0 && { backgroundColor: C.accentLight }]}>
                    <Text style={styles.nutritionEmoji}>{item.emoji}</Text>
                    <Text style={[styles.nutritionValue, idx === 0 && { color: C.accent }]}>{item.value}</Text>
                    <Text style={styles.nutritionLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Ingredients */}
          <Text style={[styles.sectionLabel, recipe.nutrition ? { marginTop: 20 } : undefined]}>{t.recipeCard.ingredients}</Text>
          <View style={styles.ingredientGrid}>
            {recipe.ingredients.map((ing, i) => (
              <View key={i} style={styles.ingChip}>
                <Text style={styles.ingText}>{ing}</Text>
              </View>
            ))}
          </View>

          {/* Steps */}
          <Text style={[styles.sectionLabel, { marginTop: 20 }]}>{t.recipeCard.instructions}</Text>
          <View style={styles.stepsContainer}>
            {recipe.steps.map((step, i) => (
              <View key={i} style={styles.step}>
                <View style={styles.stepLeft}>
                  <View style={[styles.stepNum, { backgroundColor: C.accent }]}>
                    <Text style={styles.stepNumText}>{i + 1}</Text>
                  </View>
                  {i < recipe.steps.length - 1 && (
                    <View style={[styles.stepLine, { backgroundColor: C.border }]} />
                  )}
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>
      </View>
    </View>
  );
}

function createStyles(C: ColorScheme) {
  return StyleSheet.create({
    cardShadow: {
      borderRadius: 20,
      marginHorizontal: IS_TABLET ? 24 : 16,
      marginBottom: 14,
      backgroundColor: C.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.10,
      shadowRadius: 12,
      elevation: 4,
    },
    card: {
      backgroundColor: C.surface,
      borderRadius: 20,
      overflow: 'hidden',
    },
    diffStrip: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: IS_TABLET ? 20 : 16,
      paddingVertical: IS_TABLET ? 28 : 22,
      gap: IS_TABLET ? 16 : 12,
    },
    headerMid: {
      flex: 1,
      gap: 8,
    },
    name: {
      fontSize: IS_TABLET ? 20 : 16,
      fontWeight: '700',
      color: C.text,
      lineHeight: IS_TABLET ? 27 : 22,
      letterSpacing: -0.2,
    },
    meta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    metaChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: C.surface2,
      paddingHorizontal: IS_TABLET ? 12 : 9,
      paddingVertical: IS_TABLET ? 5 : 3,
      borderRadius: 20,
    },
    metaIcon: {
      fontSize: IS_TABLET ? 12 : 10,
    },
    metaText: {
      fontSize: IS_TABLET ? 13 : 11,
      fontWeight: '600',
      color: C.text2,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    chevron: {
      fontSize: IS_TABLET ? 30 : 24,
      color: C.text3,
      fontWeight: '300',
      lineHeight: IS_TABLET ? 36 : 28,
    },
    body: {
      paddingLeft: IS_TABLET ? 26 : 20,
      paddingRight: IS_TABLET ? 20 : 16,
      paddingBottom: 20,
    },
    divider: {
      height: 1,
      backgroundColor: C.border,
      marginBottom: 18,
    },
    sectionLabel: {
      fontSize: IS_TABLET ? 11 : 10,
      fontWeight: '700',
      color: C.accent,
      letterSpacing: 1.1,
      textTransform: 'uppercase',
      marginBottom: 10,
    },
    ingredientGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    ingChip: {
      backgroundColor: C.surface2,
      paddingHorizontal: IS_TABLET ? 14 : 11,
      paddingVertical: IS_TABLET ? 7 : 6,
      borderRadius: 10,
    },
    ingText: {
      fontSize: IS_TABLET ? 14 : 12,
      color: C.text,
      fontWeight: '500',
    },
    nutritionGrid: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 4,
    },
    nutritionItem: {
      flex: 1,
      backgroundColor: C.surface2,
      borderRadius: 14,
      alignItems: 'center',
      paddingVertical: IS_TABLET ? 13 : 10,
      paddingHorizontal: 4,
      gap: 3,
    },
    nutritionEmoji: {
      fontSize: IS_TABLET ? 16 : 14,
    },
    nutritionValue: {
      fontSize: IS_TABLET ? 15 : 13,
      fontWeight: '700',
      color: C.text,
    },
    nutritionLabel: {
      fontSize: IS_TABLET ? 11 : 9,
      color: C.text3,
      fontWeight: '500',
    },
    stepsContainer: {
      gap: 0,
    },
    step: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'flex-start',
    },
    stepLeft: {
      alignItems: 'center',
      width: IS_TABLET ? 32 : 26,
    },
    stepNum: {
      width: IS_TABLET ? 32 : 26,
      height: IS_TABLET ? 32 : 26,
      borderRadius: IS_TABLET ? 16 : 13,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    stepNumText: {
      fontSize: IS_TABLET ? 13 : 11,
      fontWeight: '700',
      color: '#fff',
    },
    stepLine: {
      width: 2,
      flex: 1,
      minHeight: 12,
      borderRadius: 1,
      marginVertical: 4,
    },
    stepText: {
      flex: 1,
      fontSize: IS_TABLET ? 15 : 13,
      color: C.text2,
      lineHeight: IS_TABLET ? 25 : 21,
      paddingTop: 4,
      paddingBottom: 16,
    },
  });
}
