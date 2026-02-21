import * as Linking from 'expo-linking';
import * as StoreReview from 'expo-store-review';
import { doc, setDoc } from 'firebase/firestore';
import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ColorScheme } from '@/constants/colors';
import { useLanguage } from '@/contexts/language';
import { useTheme } from '@/contexts/theme';
import { getDeviceId } from '@/lib/device-id';
import { db } from '@/lib/firebase';

const APP_ICON = require('@/assets/images/icon.png');

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export default function RatingPrompt({ visible, onDismiss }: Props) {
  const { colors: C } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(C), [C]);
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 18,
          stiffness: 220,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.85,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  async function logResponse(response: 'yes' | 'no') {
    try {
      const deviceId = await getDeviceId();
      await setDoc(doc(db, 'rating_events', deviceId), {
        response,
        respondedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[RatingPrompt] Firebase log failed:', err);
    }
  }

  async function handleYes() {
    onDismiss();
    logResponse('yes');
    const isAvailable = await StoreReview.isAvailableAsync();
    if (isAvailable) {
      await StoreReview.requestReview();
    } else {
      const url = StoreReview.storeUrl();
      if (url) Linking.openURL(url);
    }
  }

  function handleNo() {
    onDismiss();
    logResponse('no');
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => {/* back button does nothing */}}>

      {/* Backdrop — non-interactive */}
      <View style={styles.backdrop} />

      {/* Centered card */}
      <View style={styles.centeredWrapper} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.card,
            { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
          ]}>

          {/* App icon */}
          <Image source={APP_ICON} style={styles.appIcon} />

          {/* Text */}
          <Text style={styles.title}>{t.ratingPrompt.title}</Text>
          <Text style={styles.subtitle}>{t.ratingPrompt.subtitle}</Text>

          {/* Buttons */}
          <TouchableOpacity style={styles.yesBtn} onPress={handleYes} activeOpacity={0.85}>
            <Text style={styles.yesBtnText}>{t.ratingPrompt.yes}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.laterBtn} onPress={handleNo} activeOpacity={0.7}>
            <Text style={styles.laterBtnText}>{t.ratingPrompt.later}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

function createStyles(C: ColorScheme) {
  return StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.55)',
    },
    centeredWrapper: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    card: {
      backgroundColor: C.surface,
      borderRadius: 28,
      paddingHorizontal: 24,
      paddingTop: 32,
      paddingBottom: 24,
      alignItems: 'center',
      width: '100%',
      maxWidth: 360,
      borderWidth: 1,
      borderColor: C.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.25,
      shadowRadius: 40,
      elevation: 24,
    },
    appIcon: {
      width: 80,
      height: 80,
      borderRadius: 20,
      marginBottom: 20,
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: C.text,
      textAlign: 'center',
      letterSpacing: -0.4,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: C.text2,
      textAlign: 'center',
      lineHeight: 21,
      marginBottom: 28,
    },
    yesBtn: {
      backgroundColor: C.accent,
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: 'center',
      width: '100%',
      shadowColor: C.accent,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      marginBottom: 10,
    },
    yesBtnText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    laterBtn: {
      paddingVertical: 10,
      alignItems: 'center',
      width: '100%',
    },
    laterBtnText: {
      color: C.text3,
      fontSize: 15,
      fontWeight: '500',
    },
  });
}
