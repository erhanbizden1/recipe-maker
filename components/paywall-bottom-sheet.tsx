import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Keyboard,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as StoreReview from "expo-store-review";
import Purchases, { PurchasesPackage } from "react-native-purchases";
import { useLanguage } from "@/contexts/language";
import { useUI } from "@/contexts/ui";

const BG = require("@/assets/images/paywall.png");
const { width, height } = Dimensions.get("window");
const isTablet = width >= 768;

const ACCENT = "#FF6B2B";
const ACCENT_DARK = "#e55a1f";

const PREMIUM_FEATURES = [
  {
    icon: "infinite-outline",
    key: "unlimited",
    title: "Unlimited Recipe Generation",
  },
  {
    icon: "sparkles-outline",
    key: "ai",
    title: "Advanced AI Ingredient Analysis",
  },
  {
    icon: "bookmarks-outline",
    key: "history",
    title: "Unlimited Recipe History",
  },
  { icon: "nutrition-outline", key: "support", title: "Nutrition & Calorie Analysis" },
];

// ── CloseButton ────────────────────────────────────────────────────────────────
const CloseButton = ({ onPress }: { onPress: () => void }) => (
  <View style={[styles.closeButton, isTablet && styles.closeButtonTablet]}>
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.closeButtonTouchable,
        isTablet && styles.closeButtonTouchableTablet,
      ]}
    >
      <Ionicons
        name="close"
        size={isTablet ? 32 : 24}
        color="rgba(255,255,255,0.7)"
      />
    </TouchableOpacity>
  </View>
);

// ── LoadingOverlay ─────────────────────────────────────────────────────────────
const LoadingOverlay = ({
  visible,
  loadingText,
}: {
  visible: boolean;
  loadingText: string;
}) => {
  if (!visible) return null;
  return (
    <View style={styles.loadingOverlay}>
      <View
        style={[
          styles.loadingContainer,
          isTablet && styles.loadingContainerTablet,
        ]}
      >
        <ActivityIndicator size="large" color={ACCENT} />
        <Text
          style={[styles.loadingText, isTablet && styles.loadingTextTablet]}
        >
          {loadingText}
        </Text>
      </View>
    </View>
  );
};

// ── PaywallContent ─────────────────────────────────────────────────────────────
const PaywallContent = ({
  bottomSheetRef,
  onClosed,
  onPurchaseSuccess,
}: {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  onClosed?: () => void;
  onPurchaseSuccess?: () => void;
}) => {
  const { t } = useLanguage();
  const { setPremium } = useUI();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [selectedPackage, setSelectedPackage] =
    useState<PurchasesPackage | null>(null);
  const [freeTrialEnabled, setFreeTrialEnabled] = useState(false);

  const handleClosePress = () => {
    if (purchasing) {
      Alert.alert(
        t.paywall.alerts.purchaseInProgress,
        t.paywall.alerts.pleaseWait,
        [{ text: t.paywall.alerts.ok }],
      );
      return;
    }
    // onClosed'ı buradan çağırmıyoruz — onChange zaten tetikliyor, çift çağrıyı önler
    Keyboard.dismiss();
    bottomSheetRef.current?.close();
  };

  const getWeeklyPackage = () =>
    packages.find((pkg) => pkg.packageType === "WEEKLY");

  const hasFreeTrial = () => {
    const weekly = getWeeklyPackage();
    return weekly?.product?.introPrice?.price === 0;
  };

  const getPackageTypeText = (packageType: string) => {
    switch (packageType) {
      case "WEEKLY":
        return t.paywall.packages.weekly;
      case "MONTHLY":
        return t.paywall.packages.monthly;
      case "ANNUAL":
        return t.paywall.packages.annual;
      case "LIFETIME":
        return t.paywall.packages.lifetime;
      default:
        return packageType;
    }
  };

  const getPackageDescription = (packageType: string) => {
    switch (packageType) {
      case "WEEKLY":
        return t.paywall.packages.weeklyDesc;
      case "MONTHLY":
        return t.paywall.packages.monthlyDesc;
      case "ANNUAL":
        return t.paywall.packages.annualDesc;
      case "LIFETIME":
        return t.paywall.packages.lifetimeDesc;
      default:
        return "";
    }
  };

  const getCtaButtonText = () => {
    if (purchasing) return t.paywall.cta.processing;
    if (!selectedPackage) return t.paywall.cta.selectPlan;
    if (isPremium)
      return `${t.paywall.cta.switchTo} ${getPackageTypeText(selectedPackage.packageType)}`;
    if (selectedPackage.packageType === "WEEKLY" && hasFreeTrial())
      return t.paywall.cta.tryFree;
    if (selectedPackage.packageType === "WEEKLY") return t.paywall.cta.subscribeNow;
    return t.paywall.cta.unlockNow;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const offerings = await Purchases.getOfferings();
        if (offerings.current?.availablePackages) {
          const corrected = offerings.current.availablePackages.map((pkg) => {
            let correctedType = pkg.packageType;
            const id = pkg.product.identifier.toLowerCase();
            if (
              id.includes("weekly") ||
              id.includes("week") ||
              pkg.product.subscriptionPeriod === "P1W" ||
              pkg.identifier === "$rc_weekly"
            ) {
              correctedType = "WEEKLY" as any;
            } else if (
              id.includes("annual") ||
              id.includes("yearly") ||
              id.includes("year") ||
              pkg.product.subscriptionPeriod === "P1Y" ||
              pkg.identifier === "$rc_annual"
            ) {
              correctedType = "ANNUAL" as any;
            } else if (
              id.includes("monthly") ||
              id.includes("month") ||
              pkg.product.subscriptionPeriod === "P1M"
            ) {
              correctedType = "MONTHLY" as any;
            }
            return Object.assign(pkg, { packageType: correctedType });
          });

          const sorted = corrected.sort((a, b) => {
            const order = { ANNUAL: 1, WEEKLY: 2 };
            return (
              (order[a.packageType as keyof typeof order] || 99) -
              (order[b.packageType as keyof typeof order] || 99)
            );
          });

          setPackages(sorted);
          if (sorted.length > 0) setSelectedPackage(sorted[0]);
        }
      } catch (e) {
        console.error("Package loading error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePurchase = async () => {
    if (!selectedPackage || purchasing) return;
    if (isPremium) {
      Alert.alert(
        t.paywall.alerts.changePlan,
        t.paywall.alerts.switchConfirm(getPackageTypeText(selectedPackage.packageType)),
        [
          { text: t.paywall.alerts.cancel, style: "cancel" },
          { text: t.paywall.alerts.switch, onPress: performPurchase },
        ],
      );
      return;
    }
    await performPurchase();
  };

  const performPurchase = async () => {
    if (!selectedPackage || purchasing) return;
    setPurchasing(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(selectedPackage);
      const entitlementKeys = ["premium", "pro", "unlimited", "full_access"];
      let hasPremium =
        entitlementKeys.some((k) => customerInfo.entitlements.active[k]) ||
        Object.keys(customerInfo.entitlements.active).length > 0;

      const wasPremiumBefore = isPremium;
      setIsPremium(hasPremium);
      setPurchasing(false);
      await new Promise((r) => setTimeout(r, 100));

      const isFreeTrial =
        freeTrialEnabled &&
        selectedPackage.packageType === "WEEKLY" &&
        hasFreeTrial();
      const message = isFreeTrial
        ? t.paywall.alerts.freeTrialMsg
        : t.paywall.alerts.unlimitedMsg;

      if (!wasPremiumBefore && hasPremium) {
        setPremium(true);
        StoreReview.hasAction().then((has) => { if (has) StoreReview.requestReview(); }).catch(() => {});
        Alert.alert(t.paywall.alerts.welcomePro, message, [
          {
            text: t.paywall.alerts.startCooking,
            onPress: () => {
              bottomSheetRef.current?.close();
              onPurchaseSuccess?.();
            },
          },
        ]);
      } else if (wasPremiumBefore && hasPremium) {
        Alert.alert(
          t.paywall.alerts.planChanged,
          t.paywall.alerts.planUpdated,
          [
            {
              text: t.paywall.alerts.ok,
              onPress: () => {
                bottomSheetRef.current?.close();
                onPurchaseSuccess?.();
              },
            },
          ],
        );
      }
    } catch (e: any) {
      setPurchasing(false);
      await new Promise((r) => setTimeout(r, 100));
      const msg = e?.message || t.paywall.alerts.purchaseError;
      if (
        msg.includes("cancelled") ||
        msg.includes("canceled") ||
        msg.includes("iptal")
      )
        return;
      Alert.alert(
        t.paywall.alerts.purchaseFailed,
        `${msg}\n\n${t.paywall.alerts.tryAgain}`,
        [{ text: t.paywall.alerts.ok }],
      );
    }
  };

  const handleLegalLink = (type: "privacy" | "terms") => {
    const urls = {
      privacy:
        "https://www.freeprivacypolicy.com/live/bff0afed-700a-4ff1-90b9-db06bc78b3ac",
      terms:
        "https://www.termsfeed.com/live/ab19bd75-a435-45c7-a651-806570a0c99b",
    };
    Linking.openURL(urls[type]).catch(() =>
      Alert.alert(t.paywall.alerts.error, t.paywall.alerts.linkError),
    );
  };

  const handleRestorePurchases = async () => {
    if (purchasing) return;
    try {
      setPurchasing(true);
      const customerInfo = await Purchases.restorePurchases();
      setPurchasing(false);
      await new Promise((r) => setTimeout(r, 100));
      const entitlementKeys = ["premium", "pro", "unlimited", "full_access"];
      const hasPremium =
        entitlementKeys.some((k) => customerInfo.entitlements.active[k]) ||
        Object.keys(customerInfo.entitlements.active).length > 0;
      setIsPremium(hasPremium);
      if (hasPremium) {
        Alert.alert(
          t.paywall.alerts.restoredTitle,
          t.paywall.alerts.restoredMsg,
          [
            {
              text: t.paywall.alerts.great,
              onPress: () => bottomSheetRef.current?.close(),
            },
          ],
        );
      } else {
        Alert.alert(
          t.paywall.alerts.noRestoreTitle,
          t.paywall.alerts.noRestoreMsg,
          [{ text: t.paywall.alerts.ok }],
        );
      }
    } catch {
      setPurchasing(false);
      await new Promise((r) => setTimeout(r, 100));
      Alert.alert(
        t.paywall.alerts.restoreFailTitle,
        t.paywall.alerts.restoreFailMsg,
        [{ text: t.paywall.alerts.ok }],
      );
    }
  };

  const calculateSavingPercentage = (pkg: PurchasesPackage) => {
    if (pkg.packageType !== "ANNUAL") return 0;
    const weekly = packages.find((p) => p.packageType === "WEEKLY");
    if (weekly) {
      const saving = weekly.product.price * 52 - pkg.product.price;
      return Math.round((saving / (weekly.product.price * 52)) * 100);
    }
    return 60;
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Hero bg */}
      <View
        style={[
          styles.heroImageContainer,
          isTablet && styles.heroImageContainerTablet,
        ]}
      >
        <Image source={BG} style={styles.heroImage} resizeMode="cover" />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.75)", "#000000"]}
          style={styles.heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </View>

      <LoadingOverlay visible={purchasing} loadingText={t.paywall.loadingText} />
      <CloseButton onPress={handleClosePress} />

      <ScrollView
        style={styles.scrollableContent}
        contentContainerStyle={[
          styles.scrollContentContainer,
          isTablet && styles.scrollContentContainerTablet,
        ]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!purchasing}
      >
        {/* Header */}
        <View style={[styles.header, isTablet && styles.headerTablet]}>
          <Text style={[styles.title, isTablet && styles.titleTablet]}>
            {t.paywall.title}
          </Text>
          <Text style={[styles.subtitle, isTablet && styles.subtitleTablet]}>
            {t.paywall.subtitle}
          </Text>
        </View>

        {/* Features */}
        <View
          style={[
            styles.featuresSection,
            isTablet && styles.featuresSectionTablet,
          ]}
        >
          <View style={styles.featuresContainer}>
            {PREMIUM_FEATURES.map((feature, index) => (
              <View
                key={feature.key || index}
                style={[
                  styles.featureItem,
                  isTablet && styles.featureItemTablet,
                ]}
              >
                <View
                  style={[
                    styles.featureIconContainer,
                    isTablet && styles.featureIconContainerTablet,
                  ]}
                >
                  <Ionicons
                    name={feature.icon as any}
                    size={isTablet ? 28 : 18}
                    color={ACCENT}
                  />
                </View>
                <Text
                  style={[
                    styles.featureTitle,
                    isTablet && styles.featureTitleTablet,
                  ]}
                >
                  {t.paywall.features[feature.key as keyof typeof t.paywall.features]}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Packages */}
        <View
          style={[
            styles.packagesSection,
            isTablet && styles.packagesSectionTablet,
          ]}
        >
          {loading ? (
            <ActivityIndicator
              size="large"
              color={ACCENT}
              style={{ marginVertical: 40 }}
            />
          ) : (
            packages.map((pkg, index) => {
              const isSelected = selectedPackage?.identifier === pkg.identifier;
              const savingPercentage = calculateSavingPercentage(pkg);
              return (
                <TouchableOpacity
                  key={pkg.identifier || `package-${pkg.packageType}-${index}`}
                  style={[
                    styles.packageCard,
                    isSelected && styles.selectedPackage,
                    isTablet && styles.packageCardTablet,
                  ]}
                  onPress={() => {
                    if (purchasing) return;
                    setSelectedPackage(pkg);
                    if (pkg.packageType !== "WEEKLY") {
                      setFreeTrialEnabled(false);
                    } else if (hasFreeTrial()) {
                      setFreeTrialEnabled(true);
                    }
                  }}
                  activeOpacity={0.8}
                  disabled={purchasing}
                >
                  <View style={styles.packageContent}>
                    <View style={styles.packageLeft}>
                      <Text
                        style={[
                          styles.packageTitle,
                          isTablet && styles.packageTitleTablet,
                        ]}
                      >
                        {getPackageTypeText(pkg.packageType)}
                      </Text>
                      <View style={styles.packageDescriptionRow}>
                        {pkg.packageType === "ANNUAL" ? (
                          <>
                            <Text
                              style={[
                                styles.packagePriceInline,
                                isTablet && styles.packagePriceInlineTablet,
                              ]}
                            >
                              {pkg.product.priceString}
                            </Text>
                            <Text
                              style={[
                                styles.packageDescriptionTop,
                                isTablet && styles.packageDescriptionTablet,
                              ]}
                              numberOfLines={1}
                            >
                              {getPackageDescription(pkg.packageType)}
                            </Text>
                          </>
                        ) : (
                          <Text
                            style={[
                              styles.packageDescription,
                              isTablet && styles.packageDescriptionTablet,
                            ]}
                            numberOfLines={1}
                          >
                            {pkg.packageType === "WEEKLY" ? (
                              <>
                                {t.paywall.packages.thenPrice + " "}
                                <Text
                                  style={[
                                    styles.priceText,
                                    isTablet && styles.priceTextTablet,
                                  ]}
                                >
                                  {pkg.product.priceString}
                                </Text>
                                {" " + t.paywall.packages.perWeek}
                              </>
                            ) : (
                              getPackageDescription(pkg.packageType)
                            )}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.packageRight}>
                      {pkg.packageType === "ANNUAL" && (
                        <View
                          style={[
                            styles.savingBadgeInline,
                            isTablet && styles.savingBadgeInlineTablet,
                          ]}
                        >
                          <Text
                            style={[
                              styles.savingTextInline,
                              isTablet && styles.savingTextInlineTablet,
                            ]}
                          >
                            {savingPercentage}% {t.paywall.packages.off}
                          </Text>
                        </View>
                      )}
                      <View
                        style={[
                          styles.checkmarkButton,
                          isSelected && styles.checkmarkButtonSelected,
                          isTablet && styles.checkmarkButtonTablet,
                        ]}
                      >
                        {isSelected && (
                          <Ionicons
                            name="checkmark"
                            size={isTablet ? 28 : 20}
                            color="#ffffff"
                          />
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={[styles.ctaSection, isTablet && styles.ctaSectionTablet]}>
        <TouchableOpacity
          onPress={handlePurchase}
          disabled={purchasing || !selectedPackage}
          activeOpacity={0.85}
          style={[
            styles.ctaButtonWrapper,
            isTablet && styles.ctaButtonWrapperTablet,
            (!selectedPackage || purchasing) && styles.ctaButtonDisabled,
          ]}
        >
          <LinearGradient
            colors={[ACCENT, ACCENT_DARK]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.ctaButton, isTablet && styles.ctaButtonTablet]}
          >
            <Text
              style={[
                styles.ctaButtonText,
                isTablet && styles.ctaButtonTextTablet,
              ]}
            >
              {getCtaButtonText()}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.legalLinksContainer}>
          <TouchableOpacity
            onPress={() => handleLegalLink("privacy")}
            disabled={purchasing}
          >
            <Text
              style={[
                styles.legalLinkText,
                isTablet && styles.legalLinkTextTablet,
              ]}
            >
              {t.paywall.legal.privacy}
            </Text>
          </TouchableOpacity>
          <View
            style={[
              styles.linkSeparator,
              isTablet && styles.linkSeparatorTablet,
            ]}
          />
          <TouchableOpacity
            onPress={() => handleLegalLink("terms")}
            disabled={purchasing}
          >
            <Text
              style={[
                styles.legalLinkText,
                isTablet && styles.legalLinkTextTablet,
              ]}
            >
              {t.paywall.legal.terms}
            </Text>
          </TouchableOpacity>
          <View
            style={[
              styles.linkSeparator,
              isTablet && styles.linkSeparatorTablet,
            ]}
          />
          <TouchableOpacity
            onPress={handleRestorePurchases}
            disabled={purchasing}
          >
            <Text
              style={[
                styles.legalLinkText,
                isTablet && styles.legalLinkTextTablet,
                purchasing && styles.disabledLinkText,
              ]}
            >
              {t.paywall.legal.restore}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ── PaywallBottomSheet ─────────────────────────────────────────────────────────
export type PaywallBottomSheetRef = {
  expand: () => void;
  close: () => void;
  snapToIndex: (index: number) => void;
};

interface PaywallBottomSheetProps {
  onClosed?: () => void;
  onClose?: () => void;
  onPurchaseSuccess?: () => void;
}

const PaywallBottomSheet = forwardRef<
  PaywallBottomSheetRef,
  PaywallBottomSheetProps
>(({ onClosed, onClose, onPurchaseSuccess }, ref) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["100%"], []);

  useImperativeHandle(
    ref,
    () => ({
      expand: () => {
        try {
          bottomSheetRef.current?.expand();
        } catch (e) {
          console.error(e);
        }
      },
      close: () => {
        // onClosed sadece onChange üzerinden çağrılır, burada çift tetikleme olmaz
        try {
          Keyboard.dismiss();
          bottomSheetRef.current?.close();
        } catch (e) {
          console.error(e);
        }
      },
      snapToIndex: (index: number) => {
        try {
          bottomSheetRef.current?.snapToIndex(index);
        } catch (e) {
          console.error(e);
        }
      },
    }),
    [onClosed, onClose],
  );

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.8}
        enableTouchThrough={false}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      enableOverDrag={false}
      backdropComponent={renderBackdrop}
      topInset={-20}
      backgroundStyle={{ backgroundColor: "transparent" }}
      handleIndicatorStyle={{ display: "none" }}
      enableHandlePanningGesture={false}
      onChange={(index) => {
        if (index === -1) {
          onClosed?.();
          onClose?.();
        }
      }}
    >
      <BottomSheetView style={{ flex: 1 }}>
        <PaywallContent
          bottomSheetRef={bottomSheetRef}
          onClosed={onClosed || onClose}
          onPurchaseSuccess={onPurchaseSuccess}
        />
      </BottomSheetView>
    </BottomSheet>
  );
});

PaywallBottomSheet.displayName = "PaywallBottomSheet";
export default PaywallBottomSheet;

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: height,
    backgroundColor: "#000000",
  },
  heroImageContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: height,
    zIndex: 0,
  },
  heroImageContainerTablet: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: height,
    zIndex: 0,
  },
  heroImage: { width: "100%", height: "100%" },
  heroGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "100%",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,107,43,0.12)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  loadingContainer: {
    backgroundColor: "#1a1a1a",
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    minWidth: 150,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255,107,43,0.2)",
  },
  loadingContainerTablet: { padding: 50, minWidth: 250, borderRadius: 28 },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
  },
  loadingTextTablet: { fontSize: 22, marginTop: 24 },
  closeButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 50,
    right: 20,
    zIndex: 100,
  },
  closeButtonTablet: { top: Platform.OS === "ios" ? 80 : 70, right: 40 },
  closeButtonTouchable: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonTouchableTablet: { width: 56, height: 56 },
  scrollableContent: { flex: 1, zIndex: 10 },
  scrollContentContainer: {
    paddingBottom: Platform.OS === "ios" ? 180 : 170,
    paddingTop: Platform.OS === "ios" ? 100 : 80,
  },
  scrollContentContainerTablet: {
    paddingBottom: Platform.OS === "ios" ? 220 : 210,
    paddingHorizontal: 80,
    paddingTop: Platform.OS === "ios" ? 120 : 100,
  },
  header: { paddingHorizontal: 20, paddingBottom: 20, alignItems: "center" },
  headerTablet: { paddingHorizontal: 60, paddingBottom: 30 },
  title: {
    fontSize: 36,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
    paddingTop: 20,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  titleTablet: { fontSize: 62, marginBottom: 12, paddingTop: 50 },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    fontWeight: "500",
  },
  subtitleTablet: { fontSize: 32, paddingTop: 15 },
  featuresSection: {
    marginBottom: 50,
    marginTop: 20,
    alignItems: "center",
    width: "100%",
  },
  featuresSectionTablet: { marginBottom: 40 },
  featuresContainer: { alignItems: "flex-start" },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  featureItemTablet: { paddingVertical: 12 },
  featureIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,107,43,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  featureIconContainerTablet: {
    width: 40,
    height: 40,
    borderRadius: 28,
    marginRight: 20,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  featureTitleTablet: { fontSize: 26 },
  packagesSection: { paddingHorizontal: 20, marginBottom: 20 },
  packagesSectionTablet: { paddingHorizontal: 0, marginBottom: 30 },
  packageCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 16,
    paddingVertical: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.12)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  packageCardTablet: {
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderWidth: 3,
    shadowRadius: 12,
    elevation: 5,
  },
  selectedPackage: {
    borderColor: ACCENT,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  packageContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  packageLeft: { flex: 1, marginRight: 8 },
  packageTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  packageTitleTablet: { fontSize: 26, marginBottom: 8 },
  packageDescriptionRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  packageDescription: { fontSize: 15, color: "rgba(255,255,255,0.5)" },
  packageDescriptionTop: { fontSize: 14, color: "rgba(255,255,255,0.5)" },
  packageDescriptionTablet: { fontSize: 20 },
  packagePriceInline: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "700",
    marginRight: 6,
  },
  packagePriceInlineTablet: { fontSize: 24, marginRight: 8 },
  packageRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
  },
  savingBadgeInline: {
    backgroundColor: ACCENT,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  savingBadgeInlineTablet: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  savingTextInline: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  savingTextInlineTablet: { fontSize: 18, letterSpacing: 0.5 },
  checkmarkButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  checkmarkButtonTablet: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
  },
  checkmarkButtonSelected: { borderColor: ACCENT, backgroundColor: ACCENT },
  ctaSection: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#000000",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  ctaSectionTablet: {
    paddingHorizontal: 80,
    paddingTop: 24,
    paddingBottom: Platform.OS === "ios" ? 50 : 30,
    borderTopWidth: 2,
    shadowRadius: 12,
    elevation: 12,
  },
  ctaButtonWrapper: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaButtonWrapperTablet: {
    borderRadius: 24,
    marginBottom: 16,
    shadowRadius: 16,
    elevation: 10,
  },
  ctaButtonDisabled: { opacity: 0.5 },
  ctaButton: {
    paddingVertical: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaButtonTablet: { paddingVertical: 28 },
  ctaButtonText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  ctaButtonTextTablet: { fontSize: 28, letterSpacing: 0.8 },
  legalLinksContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  legalLinkText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
    fontWeight: "500",
  },
  legalLinkTextTablet: { fontSize: 16, fontWeight: "600" },
  disabledLinkText: { opacity: 0.4 },
  linkSeparator: {
    width: 1,
    height: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginHorizontal: 10,
  },
  linkSeparatorTablet: { width: 2, height: 14, marginHorizontal: 16 },
  priceText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  priceTextTablet: { fontSize: 20 },
});
