import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

/** True on iPad and Android tablets (shorter side ≥ 600 dp) */
export const IS_TABLET =
  Platform.isPad || (Platform.OS === 'android' && Math.min(width, height) >= 600);

/** Maximum content width — content stays centered and doesn't stretch on wide screens */
export const CONTENT_MAX_W = IS_TABLET ? Math.min(width * 0.82, 700) : width;

/** Onboarding slide image size — capped on tablet so it doesn't dominate the screen */
export const ONBOARDING_IMG_SIZE = IS_TABLET
  ? Math.min(width * 0.45, 400)
  : Math.min(width * 0.98, height * 0.6);

export { width as SCREEN_W, height as SCREEN_H };
