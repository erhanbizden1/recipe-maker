import * as FileSystem from 'expo-file-system/legacy';

export async function uriToBase64(uri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: 'base64' as FileSystem.EncodingType,
  });
  return base64;
}
