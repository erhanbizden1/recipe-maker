import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ColorScheme } from '@/constants/colors';
import { InterFont } from '@/constants/theme';
import { useLanguage } from '@/contexts/language';
import { useTheme } from '@/contexts/theme';
import { SURVEY_PREFS_KEY } from '@/hooks/use-onboarding';
import { CONTENT_MAX_W, IS_TABLET } from '@/lib/responsive';

export default function PreferencesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: C } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(C), [C]);
  const o = t.onboarding;

  const DIET_OPTIONS = [
    { id: '1', label: o.moodQ2O1 },
    { id: '2', label: o.moodQ2O2 },
    { id: '3', label: o.moodQ2O3 },
    { id: '4', label: o.moodQ2O4 },
    { id: '5', label: o.moodQ2O5 },
  ];
  const EQUIPMENT_OPTIONS = [
    { id: '1', label: o.moodQ3O1 },
    { id: '2', label: o.moodQ3O2 },
    { id: '3', label: o.moodQ3O3 },
    { id: '4', label: o.moodQ3O4 },
  ];

  const [diet, setDiet] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(SURVEY_PREFS_KEY).then((raw) => {
      if (!raw) return;
      const prefs = JSON.parse(raw);
      if (prefs.diet) setDiet(prefs.diet);
      if (prefs.equipment) setEquipment(Array.isArray(prefs.equipment) ? prefs.equipment : [prefs.equipment]);
    });
  }, []);

  async function savePrefs(newDiet: string | null, newEquipment: string[]) {
    await AsyncStorage.setItem(SURVEY_PREFS_KEY, JSON.stringify({ diet: newDiet, equipment: newEquipment }));
  }

  function toggleDiet(id: string) {
    const next = diet === id ? null : id;
    setDiet(next);
    savePrefs(next, equipment);
  }

  function toggleEquipment(id: string) {
    const next = equipment.includes(id) ? equipment.filter((x) => x !== id) : [...equipment, id];
    setEquipment(next);
    savePrefs(diet, next);
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backCircle}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.settings.preferences}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>

        {/* Diet */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{o.moodQ2}</Text>
          <Text style={styles.sectionDesc}>{o.moodQ2Desc}</Text>
          <View style={styles.chipGroup}>
            {DIET_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[styles.chip, diet === opt.id && styles.chipActive]}
                onPress={() => toggleDiet(opt.id)}
                activeOpacity={0.75}>
                <Text style={[styles.chipText, diet === opt.id && styles.chipTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Equipment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{o.moodQ3}</Text>
          <Text style={styles.sectionDesc}>{o.moodQ3Desc}</Text>
          <View style={styles.chipGroup}>
            {EQUIPMENT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[styles.chip, equipment.includes(opt.id) && styles.chipActive]}
                onPress={() => toggleEquipment(opt.id)}
                activeOpacity={0.75}>
                <Text style={[styles.chipText, equipment.includes(opt.id) && styles.chipTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

function createStyles(C: ColorScheme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: C.bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: IS_TABLET ? 24 : 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
      maxWidth: CONTENT_MAX_W,
      alignSelf: 'center',
      width: '100%',
    },
    backCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: C.surface2,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    backIcon: {
      fontSize: 22,
      color: C.text,
      fontFamily: InterFont.regular,
      lineHeight: 26,
      marginTop: -1,
    },
    headerTitle: {
      fontSize: IS_TABLET ? 22 : 18,
      fontFamily: InterFont.bold,
      color: C.text,
    },
    content: {
      paddingHorizontal: IS_TABLET ? 24 : 16,
      paddingTop: 24,
      paddingBottom: 40,
      maxWidth: CONTENT_MAX_W,
      alignSelf: 'center',
      width: '100%',
    },
    section: {
      marginBottom: 36,
    },
    sectionTitle: {
      fontSize: IS_TABLET ? 22 : 19,
      fontFamily: InterFont.bold,
      color: C.text,
      letterSpacing: -0.3,
      marginBottom: 6,
    },
    sectionDesc: {
      fontSize: IS_TABLET ? 15 : 13,
      fontFamily: InterFont.regular,
      color: C.text3,
      marginBottom: 16,
    },
    chipGroup: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      paddingHorizontal: IS_TABLET ? 18 : 14,
      paddingVertical: IS_TABLET ? 11 : 9,
      borderRadius: 20,
      backgroundColor: C.surface2,
      borderWidth: 1,
      borderColor: C.border,
    },
    chipActive: {
      backgroundColor: C.accent,
      borderColor: C.accent,
    },
    chipText: {
      fontSize: IS_TABLET ? 15 : 13,
      fontFamily: InterFont.semiBold,
      color: C.text2,
    },
    chipTextActive: {
      color: '#fff',
    },
  });
}
