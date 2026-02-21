import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import { Platform } from 'react-native';

const FALLBACK_KEY = 'device_id_fallback';

export async function getDeviceId(): Promise<string> {
  if (Platform.OS === 'ios') {
    const idfv = await Application.getIosIdForVendorAsync();
    if (idfv) return idfv;
  } else {
    const androidId = Application.getAndroidId();
    if (androidId) return androidId;
  }

  const existing = await AsyncStorage.getItem(FALLBACK_KEY);
  if (existing) return existing;

  const id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
  await AsyncStorage.setItem(FALLBACK_KEY, id);
  return id;
}
