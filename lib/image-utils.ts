import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

const MAX_DIMENSION = 768;
const JPEG_QUALITY = 0.75;

export async function uriToBase64(uri: string): Promise<string> {
  const resized = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_DIMENSION } }],
    { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
  );

  const base64 = await FileSystem.readAsStringAsync(resized.uri, {
    encoding: 'base64' as FileSystem.EncodingType,
  });
  return base64;
}
