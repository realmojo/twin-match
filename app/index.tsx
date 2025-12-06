import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { logScreenView } from "@/utils/analytics";
import { getCompletedLevels, getUnlockedLevels } from "@/utils/levelStorage";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import {
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from "react-native-google-mobile-ads";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Level {
  id: number;
  unlocked: boolean;
  completed?: boolean;
}

const TOTAL_LEVELS = 200;
const COLUMNS = 4;

// Ad unit ID
const getAdUnitId = () => {
  return __DEV__
    ? TestIds.BANNER
    : Platform.OS === "ios"
    ? "ca-app-pub-9130836798889522/5936647529"
    : "ca-app-pub-9130836798889522/6363337173";
};

const AD_UNIT_ID = getAdUnitId();

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { width } = useWindowDimensions();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Track screen view
  useEffect(() => {
    logScreenView("Home");
  }, []);

  // Get background color for ad container
  const adBackgroundColor =
    colorScheme === "dark" ? Colors.dark.background : Colors.light.background;

  // Debug: Check ads availability
  useEffect(() => {
    console.log("Ads Debug:", {
      platform: Platform.OS,
      hasBannerAd: !!BannerAd,
      hasBannerAdSize: !!BannerAdSize,
      adUnitId: AD_UNIT_ID,
    });
  }, []);

  // Level state management
  const [levels, setLevels] = useState<Level[]>(() =>
    Array.from({ length: TOTAL_LEVELS }, (_, i) => ({
      id: i + 1,
      unlocked: i === 0, // Only first level is unlocked by default
    }))
  );

  // Load unlocked and completed levels from storage
  const loadLevels = useCallback(async () => {
    const unlocked = await getUnlockedLevels();
    const completed = await getCompletedLevels();

    setLevels(
      Array.from({ length: TOTAL_LEVELS }, (_, i) => ({
        id: i + 1,
        unlocked: unlocked.includes(i + 1),
        completed: completed.includes(i + 1),
      }))
    );
  }, []);

  // Load levels on mount
  useEffect(() => {
    loadLevels();
  }, [loadLevels]);

  // Refresh levels when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadLevels();
    }, [loadLevels])
  );

  // Calculate square size for 4-column grid (considering padding and gap)
  const padding = 20;
  const gap = 10;
  const cardSize = (width - padding * 2 - gap * (COLUMNS - 1)) / COLUMNS;

  const handleLevelPress = (level: Level) => {
    if (!level.unlocked) {
      // Locked levels cannot be clicked
      return;
    }
    // Navigate to game screen
    router.push(`/game/${level.id}`);
  };

  const renderLevel = (level: Level) => {
    const isLocked = !level.unlocked;
    const isCompleted = level.completed || false;

    return (
      <TouchableOpacity
        key={level.id}
        style={[
          styles.levelCard,
          {
            width: cardSize,
            height: cardSize,
            backgroundColor: isLocked
              ? colorScheme === "dark"
                ? "#2a2a2a"
                : "#e0e0e0"
              : isCompleted
              ? colorScheme === "dark"
                ? "#1a3a1a"
                : "#e8f5e9"
              : colorScheme === "dark"
              ? "#1a1a1a"
              : "#ffffff",
            borderColor: isLocked
              ? colorScheme === "dark"
                ? "#3a3a3a"
                : "#d0d0d0"
              : isCompleted
              ? "#4CAF50"
              : colors.tint,
            borderWidth: isCompleted ? 3 : 2,
          },
        ]}
        onPress={() => handleLevelPress(level)}
        disabled={isLocked}
        activeOpacity={0.7}
      >
        {isLocked ? (
          <Ionicons
            name="lock-closed"
            size={32}
            color={colorScheme === "dark" ? "#666" : "#999"}
          />
        ) : (
          <View style={styles.levelContent}>
            <ThemedText type="title" style={styles.levelNumber}>
              {level.id}
            </ThemedText>
            {isCompleted && (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color="#4CAF50"
                style={styles.checkmark}
              />
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Twin Match
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Find the matching pairs!
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.levelsGrid}>
          {levels.map((level) => renderLevel(level))}
        </ThemedView>
      </ScrollView>

      {/* 하단 광고 */}
      {Platform.OS !== "web" && (
        <View
          style={[
            styles.adContainer,
            {
              backgroundColor: adBackgroundColor,
              paddingBottom: Platform.OS === "android" ? insets.bottom + 8 : 8,
            },
          ]}
        >
          {BannerAd && BannerAdSize ? (
            <BannerAd
              unitId={AD_UNIT_ID}
              size={BannerAdSize.BANNER}
              requestOptions={{
                requestNonPersonalizedAdsOnly: true,
              }}
              onAdLoaded={() => {
                console.log("Banner ad loaded successfully");
              }}
              onAdFailedToLoad={(error: any) => {
                console.error("Ad failed to load:", error);
              }}
            />
          ) : (
            <View
              style={{
                height: 50,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ThemedText style={{ fontSize: 12, opacity: 0.5 }}>
                Ad not available
              </ThemedText>
            </View>
          )}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120, // Space for banner ad
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    lineHeight: 40,
    fontSize: 38,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  levelsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  levelCard: {
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  levelNumber: {
    fontSize: 28,
    fontWeight: "bold",
  },
  levelContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    position: "absolute",
    top: -18,
    right: -25,
  },
  adContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
  },
});
