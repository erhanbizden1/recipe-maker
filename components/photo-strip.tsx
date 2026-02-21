import React, { useMemo } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ColorScheme } from '@/constants/colors';
import { useTheme } from '@/contexts/theme';

interface Props {
  photos: string[];
  onRemove: (uri: string) => void;
}

export default function PhotoStrip({ photos, onRemove }: Props) {
  const { colors: C } = useTheme();
  const styles = useMemo(() => createStyles(C), [C]);

  if (photos.length === 0) return null;

  return (
    <FlatList
      data={photos}
      keyExtractor={(item) => item}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
      style={styles.strip}
      renderItem={({ item, index }) => (
        <View style={styles.item}>
          <Image source={{ uri: item }} style={styles.thumb} />
          {/* Index badge */}
          <View style={styles.indexBadge}>
            <Text style={styles.indexText}>{index + 1}</Text>
          </View>
          {/* Remove */}
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => onRemove(item)}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <View style={styles.removeCircle}>
              <Text style={styles.removeX}>✕</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    />
  );
}

function createStyles(C: ColorScheme) {
  return StyleSheet.create({
    strip: {
      flexGrow: 0,
    },
    list: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      gap: 8,
    },
    item: {
      position: 'relative',
    },
    thumb: {
      width: 68,
      height: 68,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    indexBadge: {
      position: 'absolute',
      bottom: 4,
      left: 4,
      backgroundColor: 'rgba(0,0,0,0.65)',
      borderRadius: 6,
      paddingHorizontal: 5,
      paddingVertical: 1,
    },
    indexText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '700',
    },
    removeBtn: {
      position: 'absolute',
      top: -6,
      right: -6,
    },
    removeCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: C.surface2,
      borderWidth: 1.5,
      borderColor: C.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeX: {
      color: C.text2,
      fontSize: 9,
      fontWeight: '800',
      lineHeight: 11,
    },
  });
}
