import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CameraOverlay from '@/components/camera-overlay';
import PhotoStrip from '@/components/photo-strip';
import { ColorScheme } from '@/constants/colors';
import { useLanguage } from '@/contexts/language';
import { useTheme } from '@/contexts/theme';
import { CONTENT_MAX_W, IS_TABLET } from '@/lib/responsive';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photos, setPhotos] = useState<string[]>([]);
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: C } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(C), [C]);

  async function handleCapture() {
    if (!cameraRef.current || capturing || photos.length >= 8) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.72 });
      if (photo?.uri) setPhotos((prev) => [...prev, photo.uri]);
    } catch {
      // ignore
    } finally {
      setCapturing(false);
    }
  }

  async function handlePickFromGallery() {
    if (photos.length >= 8) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.72,
      selectionLimit: 8 - photos.length,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setPhotos((prev) => [...prev, ...uris].slice(0, 8));
    }
  }

  function handleSubmit() {
    router.replace({
      pathname: '/recipe-result',
      params: {
        photos: JSON.stringify(photos),
        text: '',
        thumbnail: photos[0] ?? '',
      },
    });
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={C.accent} size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <View style={styles.permIcon}>
          <Ionicons name="camera" size={40} color="#FF6B2B" />
        </View>
        <Text style={styles.permTitle}>{t.camera.permissionTitle}</Text>
        <Text style={styles.permSub}>{t.camera.permissionSub}</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission} activeOpacity={0.85}>
          <Text style={styles.permBtnText}>{t.camera.enableCamera}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {photos.length > 0 ? (
        <Image source={{ uri: photos[0] }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
      )}
      <CameraOverlay />

      {/* Close button */}
      <TouchableOpacity
        style={[styles.closeBtn, { top: insets.top + 12 }]}
        onPress={() => router.back()}
        activeOpacity={0.85}>
        <Text style={styles.closeIcon}>✕</Text>
      </TouchableOpacity>

      {/* Photo count badge */}
      {photos.length > 0 && (
        <View style={[styles.countBadge, { top: insets.top + 12 }]}>
          <Text style={styles.countText}>{t.camera.photoCount(photos.length)}</Text>
        </View>
      )}
      {photos.length === 0 && (
        <View style={[styles.hintWrap, { top: insets.top + 12 }]}>
          <Text style={styles.hintText}>{t.camera.frameHint}</Text>
        </View>
      )}

      {/* Bottom controls */}
      <View style={[styles.bottomGlass, { paddingBottom: insets.bottom + 20 }]}>
        <PhotoStrip photos={photos} onRemove={(uri) => setPhotos((p) => p.filter((x) => x !== uri))} />

        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.leftSlot}
            onPress={handlePickFromGallery}
            disabled={photos.length >= 8}
            activeOpacity={0.75}>
            {photos.length > 0 ? (
              <View style={styles.galleryThumb}>
                <Image source={{ uri: photos[0] }} style={styles.thumbImg} />
                <View style={styles.thumbBadge}>
                  <Text style={styles.thumbBadgeText}>{photos.length}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.galleryBtn}>
                <Text style={styles.galleryIcon}>⊞</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Shutter */}
          <TouchableOpacity
            style={styles.shutter}
            onPress={handleCapture}
            disabled={capturing || photos.length >= 8}
            activeOpacity={0.85}>
            <View style={[styles.shutterInner, capturing && styles.shutterFiring]} />
          </TouchableOpacity>

          {/* Submit → */}
          <TouchableOpacity
            style={[styles.submitBtn, photos.length === 0 && styles.submitBtnOff]}
            onPress={handleSubmit}
            disabled={photos.length === 0}
            activeOpacity={0.85}>
            <Text style={styles.submitIcon}>›</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function createStyles(C: ColorScheme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: '#000',
    },
    center: {
      flex: 1,
      backgroundColor: C.bg,
      alignItems: 'center',
      justifyContent: 'center',
      padding: IS_TABLET ? 80 : 40,
    },
    permIcon: {
      width: 88,
      height: 88,
      borderRadius: 28,
      backgroundColor: 'rgba(255,107,43,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
      borderWidth: 1.5,
      borderColor: '#FF6B2B',
    },
    permTitle: {
      fontSize: IS_TABLET ? 32 : 26,
      fontWeight: '700',
      color: C.text,
      marginBottom: 10,
      textAlign: 'center',
      maxWidth: 480,
    },
    permSub: {
      fontSize: IS_TABLET ? 17 : 15,
      color: C.text2,
      textAlign: 'center',
      lineHeight: IS_TABLET ? 26 : 23,
      marginBottom: 32,
      maxWidth: 480,
    },
    permBtn: {
      backgroundColor: C.accent,
      paddingHorizontal: 36,
      paddingVertical: 15,
      borderRadius: 30,
      shadowColor: C.accent,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
    },
    permBtnText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 16,
    },
    closeBtn: {
      position: 'absolute',
      left: 16,
      zIndex: 20,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(0,0,0,0.55)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeIcon: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    countBadge: {
      position: 'absolute',
      alignSelf: 'center',
      backgroundColor: C.accent,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 20,
      zIndex: 10,
    },
    countText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '700',
    },
    hintWrap: {
      position: 'absolute',
      alignSelf: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 20,
      zIndex: 10,
    },
    hintText: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: 13,
      fontWeight: '500',
    },
    bottomGlass: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(13,13,13,0.82)',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: 'rgba(255,255,255,0.08)',
    },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: IS_TABLET ? 60 : 40,
      paddingTop: 6,
      paddingBottom: 14,
      maxWidth: IS_TABLET ? Math.min(CONTENT_MAX_W, 560) : undefined,
      alignSelf: 'center',
      width: '100%',
    },
    leftSlot: {
      width: 56,
      alignItems: 'center',
    },
    counter: { alignItems: 'center' },
    counterBig: {
      fontSize: 30,
      fontWeight: '800',
      color: '#fff',
      lineHeight: 34,
    },
    counterSub: {
      fontSize: 10,
      color: 'rgba(255,255,255,0.5)',
      fontWeight: '600',
      letterSpacing: 0.3,
    },
    counterEmpty: { width: 40, height: 40 },
    galleryBtn: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    galleryIcon: {
      fontSize: 22,
      color: '#fff',
    },
    galleryThumb: {
      width: 48,
      height: 48,
      borderRadius: 12,
      overflow: 'hidden',
    },
    thumbImg: {
      width: 48,
      height: 48,
    },
    thumbBadge: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      backgroundColor: 'rgba(0,0,0,0.65)',
      borderRadius: 6,
      paddingHorizontal: 4,
      paddingVertical: 1,
    },
    thumbBadgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '700',
    },
    shutter: {
      width: 82,
      height: 82,
      borderRadius: 41,
      borderWidth: 4,
      borderColor: 'rgba(255,255,255,0.28)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    shutterInner: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: '#fff',
    },
    shutterFiring: {
      backgroundColor: 'rgba(255,255,255,0.5)',
      transform: [{ scale: 0.86 }],
    },
    submitBtn: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: C.accent,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: C.accent,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
    },
    submitBtnOff: {
      backgroundColor: 'rgba(255,255,255,0.1)',
      shadowOpacity: 0,
    },
    submitIcon: {
      color: '#fff',
      fontSize: 28,
      fontWeight: '300',
      lineHeight: 32,
      marginLeft: 2,
    },
  });
}
