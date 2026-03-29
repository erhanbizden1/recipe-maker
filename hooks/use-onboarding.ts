import { getDeviceId } from "@/lib/device-id";
import { db } from "@/lib/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import Constants from "expo-constants";
import { doc, setDoc } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

const ONBOARDING_KEY = "onboarding_complete_v2";
export const SURVEY_PREFS_KEY = "survey_prefs";

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

  const completeOnboarding = useCallback(
    async (survey?: {
      mood?: string | string[];
      diet?: string | string[];
      equipment?: string | string[];
      source?: string | string[];
    }) => {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
      setIsComplete(true);

      if (survey) {
        await AsyncStorage.setItem(
          SURVEY_PREFS_KEY,
          JSON.stringify({
            diet: survey.diet,
            equipment: survey.equipment,
          }),
        );
      }

      try {
        const deviceId = await getDeviceId();
        console.log("[Onboarding] Device ID:", deviceId);
        const deviceInfo = await collectDeviceInfo(deviceId);
        await setDoc(
          doc(db, "users", deviceId),
          {
            ...deviceInfo,
            ...(survey && { survey }),
          },
          { merge: true },
        );
      } catch (err) {
        console.error("[Onboarding] Firebase write failed:", err);
      }
    },
    [],
  );

  return { isComplete, completeOnboarding };
}
