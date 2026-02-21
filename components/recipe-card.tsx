import React, { useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ColorScheme } from '@/constants/colors';
import { useLanguage } from '@/contexts/language';
import { useTheme } from '@/contexts/theme';
import { Recipe } from '@/lib/claude';

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  const [expanded, setExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const { colors: C } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(C), [C]);

  const diffColor =
    recipe.difficulty === 'Easy' ? C.green :
    recipe.difficulty === 'Hard' ? C.red :
    C.yellow;

  function toggle() {
    const toValue = expanded ? 0 : 1;
    setExpanded(!expanded);
    Animated.spring(rotateAnim, { toValue, useNativeDriver: true, speed: 20, bounciness: 4 }).start();
  }

  const rotation = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] });

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={toggle} activeOpacity={0.75} style={styles.header}>
        {/* Emoji container */}
        <View style={[styles.emojiBox, { backgroundColor: diffColor + '18', borderColor: diffColor + '40' }]}>
          <Text style={styles.emoji}>{recipe.emoji}</Text>
        </View>

        {/* Name + meta */}
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
            <View style={[styles.metaChip, { backgroundColor: diffColor + '18', borderColor: diffColor + '40' }]}>
              <View style={[styles.dot, { backgroundColor: diffColor }]} />
              <Text style={[styles.metaText, { color: diffColor }]}>
                {recipe.difficulty === 'Easy' ? t.recipeCard.easy : recipe.difficulty === 'Hard' ? t.recipeCard.hard : t.recipeCard.medium}
              </Text>
            </View>
          </View>
        </View>

        {/* Chevron */}
        <Animated.Text style={[styles.chevron, { transform: [{ rotate: rotation }] }]}>›</Animated.Text>
      </TouchableOpacity>

      {expanded && (
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
                ].map((item) => (
                  <View key={item.label} style={styles.nutritionItem}>
                    <Text style={styles.nutritionEmoji}>{item.emoji}</Text>
                    <Text style={styles.nutritionValue}>{item.value}</Text>
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
                {/* Number + line */}
                <View style={styles.stepLeft}>
                  <View style={[styles.stepNum, { backgroundColor: diffColor + '18', borderColor: diffColor + '50' }]}>
                    <Text style={[styles.stepNumText, { color: diffColor }]}>{i + 1}</Text>
                  </View>
                  {i < recipe.steps.length - 1 && (
                    <View style={[styles.stepLine, { backgroundColor: diffColor + '30' }]} />
                  )}
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function createStyles(C: ColorScheme) {
  return StyleSheet.create({
    card: {
      backgroundColor: C.surface,
      borderRadius: 22,
      marginHorizontal: 16,
      marginBottom: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: C.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      gap: 14,
    },
    emojiBox: {
      width: 58,
      height: 58,
      borderRadius: 16,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    emoji: {
      fontSize: 30,
    },
    headerMid: {
      flex: 1,
      gap: 8,
    },
    name: {
      fontSize: 16,
      fontWeight: '700',
      color: C.text,
      lineHeight: 21,
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
      borderWidth: 1,
      borderColor: C.border,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
    },
    metaIcon: {
      fontSize: 11,
    },
    metaText: {
      fontSize: 12,
      fontWeight: '600',
      color: C.text2,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    chevron: {
      fontSize: 26,
      color: C.text3,
      fontWeight: '300',
      lineHeight: 30,
    },
    body: {
      paddingHorizontal: 16,
      paddingBottom: 20,
    },
    divider: {
      height: 1,
      backgroundColor: C.border,
      marginBottom: 18,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: C.text3,
      letterSpacing: 1.2,
      marginBottom: 10,
    },
    ingredientGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    ingChip: {
      backgroundColor: C.surface2,
      paddingHorizontal: 13,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: C.border,
    },
    ingText: {
      fontSize: 13,
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
      borderWidth: 1,
      borderColor: C.border,
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 4,
      gap: 3,
    },
    nutritionEmoji: {
      fontSize: 15,
    },
    nutritionValue: {
      fontSize: 13,
      fontWeight: '700',
      color: C.text,
    },
    nutritionLabel: {
      fontSize: 10,
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
      width: 28,
    },
    stepNum: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    stepNumText: {
      fontSize: 12,
      fontWeight: '700',
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
      fontSize: 14,
      color: C.text2,
      lineHeight: 22,
      paddingTop: 4,
      paddingBottom: 16,
    },
  });
}
