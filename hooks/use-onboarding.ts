import { db } from "@/lib/firebase";
import { getDeviceId } from "@/lib/device-id";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import Constants from "expo-constants";
import { doc, setDoc } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

const ONBOARDING_KEY = "onboarding_complete";

async function collectDeviceInfo(deviceId: string) {
  return {
    deviceId,
    platform: Platform.OS,
    osVersion: String(Platform.Version),
    deviceName: Constants.deviceName ?? null,
    appVersion: Application.nativeApplicationVersion ?? null,
    buildVersion: Application.nativeBuildVersion ?? null,
    appId: Application.applicationId ?? null,
    onboardingCompletedAt: new Date(),
  };
}

export function useOnboarding() {
  const [isComplete, setIsComplete] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      setIsComplete(val === "true");
    });
  }, []);

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    setIsComplete(true);

    try {
      const deviceId = await getDeviceId();
      const deviceInfo = await collectDeviceInfo(deviceId);
      await setDoc(doc(db, "users", deviceId), deviceInfo, { merge: true });
    } catch (err) {
      console.error("[Onboarding] Firebase write failed:", err);
    }
  }, []);

  return { isComplete, completeOnboarding };
}
