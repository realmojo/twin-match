import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  AdEventType,
  BannerAd,
  BannerAdSize,
  InterstitialAd,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from "react-native-google-mobile-ads";

import {
  logHintUsed,
  logInterstitialAdShown,
  logLevelComplete,
  logLevelStart,
  logRewardedAdWatched,
} from "@/utils/analytics";
import {
  addGlobalHints,
  completeLevel,
  getGlobalHints,
  getRewardRemaining,
  saveLastInterstitialAdTime,
  shouldShowInterstitialAd,
  useGlobalHint,
  useReward,
} from "@/utils/levelStorage";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Ad unit IDs
const AD_UNIT_ID = __DEV__
  ? TestIds.BANNER
  : "ca-app-pub-9130836798889522/6363337173";

const REWARDED_AD_UNIT_ID = __DEV__
  ? TestIds.REWARDED
  : "ca-app-pub-9130836798889522/7093964916";

const INTERSTITIAL_AD_UNIT_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : "ca-app-pub-9130836798889522/3290451277";

// Icon names for cards
const ICON_NAMES = [
  "heart",
  "star",
  "diamond",
  "flame",
  "leaf",
  "musical-note",
  "football",
  "basketball",
  "car",
  "airplane",
  "boat",
  "bicycle",
  "pizza",
  "ice-cream",
  "cafe",
  "beer",
  "sunny",
  "moon",
  "cloud",
  "rainy",
  "snow",
  "thunderstorm",
  "rose",
  "bug",
  "fish",
  "paw",
  "trophy",
  "medal",
  "gift",
  "balloon",
];

interface Card {
  id: number;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
}

// Calculate grid size based on level
const getGridSize = (level: number) => {
  if (level <= 5) return { rows: 2, cols: 3 }; // 6 cards
  if (level <= 10) return { rows: 3, cols: 4 }; // 12 cards
  if (level <= 15) return { rows: 4, cols: 4 }; // 16 cards
  if (level <= 20) return { rows: 4, cols: 5 }; // 20 cards
  if (level <= 25) return { rows: 4, cols: 6 }; // 24 cards
  if (level <= 30) return { rows: 5, cols: 6 }; // 30 cards
  if (level <= 35) return { rows: 6, cols: 6 }; // 30 cards
  if (level <= 40) return { rows: 7, cols: 6 }; // 30 cards
  return { rows: 8, cols: 6 }; // 30 cards
};

// Create and shuffle cards
const createCards = (level: number): Card[] => {
  const { rows, cols } = getGridSize(level);
  const totalCards = rows * cols;
  const pairsNeeded = totalCards / 2;

  const selectedIcons = ICON_NAMES.slice(0, pairsNeeded);
  const cards: Card[] = [];

  // Create pairs
  selectedIcons.forEach((icon, index) => {
    cards.push(
      { id: index * 2, icon, isFlipped: false, isMatched: false },
      { id: index * 2 + 1, icon, isFlipped: false, isMatched: false }
    );
  });

  // Shuffle cards
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  return cards;
};

export default function GameScreen() {
  const { level } = useLocalSearchParams<{ level: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Get background color for ad container
  const adBackgroundColor =
    colorScheme === "dark" ? Colors.dark.background : Colors.light.background;

  const levelNumber = parseInt(level || "1", 10);
  const [cards, setCards] = useState<Card[]>(() => createCards(levelNumber));
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isShowingHint, setIsShowingHint] = useState(false);
  const [hintCountdown, setHintCountdown] = useState(0);
  const [hintRemaining, setHintRemaining] = useState(3); // 전역 힌트 수 (로드 후 업데이트됨)
  const [rewardRemaining, setRewardRemaining] = useState(3); // 전역 보상 횟수 (로드 후 업데이트됨)
  const [rewardedAd, setRewardedAd] = useState<RewardedAd | null>(null);
  const [interstitialAd, setInterstitialAd] = useState<InterstitialAd | null>(
    null
  );
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [levelStartTime] = useState(Date.now()); // 레벨 시작 시간 저장

  const { rows, cols } = getGridSize(levelNumber);
  const padding = 20;
  const gap = 8;
  const cardSize = (width - padding * 2 - gap * (cols - 1)) / cols;

  // Track level start
  useEffect(() => {
    logLevelStart(levelNumber);
  }, [levelNumber]);

  // Load global hints and reward remaining on mount and level change
  useEffect(() => {
    const loadGlobalData = async () => {
      const hints = await getGlobalHints();
      const rewards = await getRewardRemaining();
      setHintRemaining(hints);
      setRewardRemaining(rewards);
    };
    loadGlobalData();
  }, [levelNumber]);

  // Load rewarded ad
  useEffect(() => {
    if (Platform.OS === "web") return;

    const ad = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
    });

    const unsubscribeLoaded = ad.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        console.log("Rewarded ad loaded");
      }
    );

    const unsubscribeEarned = ad.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      async (reward) => {
        console.log("User earned reward:", reward);
        // 힌트 3개 추가 (전역 저장)
        await addGlobalHints(3);
        const newHints = await getGlobalHints();
        setHintRemaining(newHints);
        // 보상 횟수 감소 (전역 저장)
        const newRewards = await useReward();
        setRewardRemaining(newRewards);
        Alert.alert("Reward!", "You received 3 hints!");
        // Analytics: 보상형 광고 시청
        logRewardedAdWatched(levelNumber);
      }
    );

    ad.load();

    setRewardedAd(ad);

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
    };
  }, []);

  // Load interstitial ad
  useEffect(() => {
    if (Platform.OS === "web") return;

    const ad = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
    });

    const unsubscribeLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      console.log("Interstitial ad loaded");
    });

    const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      console.log("Interstitial ad closed");
      // 광고가 닫힌 후 새 광고 로드
      ad.load();
    });

    ad.load();

    setInterstitialAd(ad);

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
    };
  }, []);

  const handleHint = useCallback(async () => {
    if (isShowingHint || isGameComplete) {
      return;
    }

    // 힌트가 없고 보상이 남아있으면 보상형 광고 표시
    if (hintRemaining <= 0 && rewardRemaining > 0 && rewardedAd) {
      const isLoaded = rewardedAd.loaded;
      if (isLoaded) {
        rewardedAd.show();
      } else {
        Alert.alert("Ad Not Ready", "Please wait a moment and try again.");
        rewardedAd.load();
      }
      return;
    }

    // 힌트가 없으면 아무것도 하지 않음
    if (hintRemaining <= 0) {
      return;
    }

    setIsShowingHint(true);
    setHintCountdown(10);
    // 힌트 사용 (전역 저장)
    const newHints = await useGlobalHint();
    setHintRemaining(newHints);
    // Analytics: 힌트 사용
    logHintUsed(levelNumber, newHints);

    // Save current card states
    const originalStates = cards.map((card) => ({
      isFlipped: card.isFlipped,
      isMatched: card.isMatched,
    }));

    // Show all cards
    const revealedCards = cards.map((card) => ({
      ...card,
      isFlipped: true,
    }));
    setCards(revealedCards);

    // Hide cards after 10 seconds
    setTimeout(() => {
      const restoredCards = cards.map((card, index) => ({
        ...card,
        isFlipped: originalStates[index].isFlipped,
        isMatched: originalStates[index].isMatched,
      }));
      setCards(restoredCards);
      setIsShowingHint(false);
      setHintCountdown(0);
    }, 10000);
  }, [
    cards,
    isShowingHint,
    isGameComplete,
    hintRemaining,
    rewardRemaining,
    rewardedAd,
    levelNumber,
  ]);

  // Countdown timer for hint
  useEffect(() => {
    if (hintCountdown > 0) {
      const timer = setTimeout(() => {
        setHintCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hintCountdown]);

  const handleCardPress = useCallback(
    (cardId: number) => {
      const card = cards[cardId];

      // Don't allow flipping if:
      // - Card is already flipped or matched
      // - Two cards are already flipped (waiting for match check)
      // - Game is complete
      // - Hint is being shown
      if (
        card.isFlipped ||
        card.isMatched ||
        flippedCards.length >= 2 ||
        isGameComplete ||
        isShowingHint
      ) {
        return;
      }

      // Flip the card
      const newCards = [...cards];
      newCards[cardId].isFlipped = true;
      setCards(newCards);

      const newFlippedCards = [...flippedCards, cardId];
      setFlippedCards(newFlippedCards);

      // If two cards are flipped, check for match
      if (newFlippedCards.length === 2) {
        setMoves((prev) => prev + 1);

        setTimeout(() => {
          const [firstId, secondId] = newFlippedCards;
          const firstCard = newCards[firstId];
          const secondCard = newCards[secondId];

          if (firstCard.icon === secondCard.icon) {
            // Match found!
            newCards[firstId].isMatched = true;
            newCards[secondId].isMatched = true;
            setMatchedPairs((prev) => prev + 1);
          } else {
            // No match, flip back
            newCards[firstId].isFlipped = false;
            newCards[secondId].isFlipped = false;
          }

          setCards(newCards);
          setFlippedCards([]);
        }, 1000);
      }
    },
    [cards, flippedCards, isGameComplete, isShowingHint]
  );

  // Check if game is complete
  useEffect(() => {
    const totalPairs = (rows * cols) / 2;
    if (matchedPairs === totalPairs && totalPairs > 0 && !isGameComplete) {
      setIsGameComplete(true);
      // Save level completion
      completeLevel(levelNumber).catch((error) => {
        console.error("Failed to save level completion:", error);
      });
      // Analytics: 레벨 완료
      const levelTime = Date.now() - levelStartTime;
      logLevelComplete(levelNumber, moves, levelTime);

      setTimeout(() => {
        setShowCompletionModal(true);
        // 애니메이션 시작
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();
      }, 500);
    }
  }, [matchedPairs, rows, cols, levelNumber, moves, router, isGameComplete]);

  const renderCard = (card: Card, index: number) => {
    const isFlipped = card.isFlipped || card.isMatched;
    const isDisabled =
      (flippedCards.length >= 2 && !isFlipped) || isShowingHint;

    return (
      <TouchableOpacity
        key={card.id}
        style={[
          styles.card,
          {
            width: cardSize,
            height: cardSize,
            backgroundColor: isFlipped
              ? colorScheme === "dark"
                ? "#2a2a2a"
                : "#ffffff"
              : colorScheme === "dark"
              ? "#1a1a1a"
              : "#e0e0e0",
            borderColor: card.isMatched
              ? "#4CAF50"
              : isFlipped
              ? colors.tint
              : colorScheme === "dark"
              ? "#3a3a3a"
              : "#d0d0d0",
            opacity: isDisabled ? 0.5 : 1,
          },
        ]}
        onPress={() => handleCardPress(index)}
        disabled={isDisabled || card.isMatched}
        activeOpacity={0.7}
      >
        {isFlipped ? (
          <Ionicons
            name={card.icon as any}
            size={cardSize * 0.4}
            color={card.isMatched ? "#4CAF50" : colors.tint}
          />
        ) : (
          <Ionicons
            name="help-circle-outline"
            size={cardSize * 0.4}
            color={colorScheme === "dark" ? "#666" : "#999"}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <ThemedText type="title" style={styles.levelTitle}>
            Level {levelNumber}
          </ThemedText>
          {hintCountdown > 0 ? (
            <ThemedText style={[styles.hintCountdown, { color: colors.tint }]}>
              {hintCountdown}s
            </ThemedText>
          ) : (
            <ThemedText style={styles.stats}>
              Moves: {moves} | Pairs: {matchedPairs}/{(rows * cols) / 2}
            </ThemedText>
          )}
        </View>
        <View style={styles.hintButtonContainer}>
          <TouchableOpacity
            onPress={handleHint}
            style={styles.hintButton}
            disabled={isShowingHint || isGameComplete}
          >
            <Ionicons
              name="sparkles"
              size={24}
              color={
                isShowingHint || isGameComplete
                  ? colors.icon
                  : hintRemaining <= 0 && rewardRemaining <= 0
                  ? colors.icon
                  : colors.tint
              }
            />
          </TouchableOpacity>
          {hintRemaining > 0 && (
            <View
              style={[
                styles.hintCountBadge,
                {
                  backgroundColor:
                    colorScheme === "dark" ? "#4CAF50" : "#0a7ea4",
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.hintCount,
                  {
                    color: "#ffffff",
                  },
                ]}
              >
                {hintRemaining}
              </ThemedText>
            </View>
          )}
        </View>
      </View>

      <View style={styles.gameArea}>
        <View
          style={[
            styles.grid,
            {
              width: width - padding * 2,
              gap,
            },
          ]}
        >
          {cards.map((card, index) => renderCard(card, index))}
        </View>
      </View>

      {/* 게임 완료 모달 */}
      <Modal
        visible={showCompletionModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowCompletionModal(false)}
      >
        <Animated.View
          style={[
            styles.modalOverlay,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {}}
          />
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ scale: scaleAnim }],
                backgroundColor:
                  colorScheme === "dark"
                    ? Colors.dark.background
                    : Colors.light.background,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Ionicons
                name="trophy"
                size={60}
                color={colors.tint}
                style={styles.trophyIcon}
              />
              <ThemedText type="title" style={styles.modalTitle}>
                Congratulations!
              </ThemedText>
              <ThemedText style={styles.modalSubtitle}>
                Level {levelNumber} Completed
              </ThemedText>
            </View>

            <View style={styles.modalStats}>
              <View style={styles.statItem}>
                <Ionicons name="repeat" size={24} color={colors.tint} />
                <ThemedText style={styles.statValue}>{moves}</ThemedText>
                <ThemedText style={styles.statLabel}>Moves</ThemedText>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                <ThemedText style={styles.statValue}>{matchedPairs}</ThemedText>
                <ThemedText style={styles.statLabel}>Pairs</ThemedText>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.secondaryButton,
                  {
                    borderColor: colors.tint,
                  },
                ]}
                onPress={() => {
                  setShowCompletionModal(false);
                  router.back();
                }}
              >
                <ThemedText
                  style={[
                    styles.modalButtonText,
                    {
                      color: colors.tint,
                    },
                  ]}
                >
                  Home
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.primaryButton,
                  {
                    backgroundColor: colors.tint,
                  },
                ]}
                onPress={async () => {
                  setShowCompletionModal(false);

                  // 5분 이상 지났으면 전면 광고 표시
                  if (levelNumber < 200) {
                    const shouldShow = await shouldShowInterstitialAd();
                    if (shouldShow && interstitialAd && interstitialAd.loaded) {
                      await saveLastInterstitialAdTime();
                      // Analytics: 전면 광고 표시
                      logInterstitialAdShown(levelNumber);
                      interstitialAd.show();
                      // 광고가 닫힌 후 다음 레벨로 이동 (이벤트 리스너에서 처리)
                      const unsubscribe = interstitialAd.addAdEventListener(
                        AdEventType.CLOSED,
                        () => {
                          router.replace(`/game/${levelNumber + 1}`);
                          unsubscribe();
                        }
                      );
                    } else {
                      router.replace(`/game/${levelNumber + 1}`);
                    }
                  } else {
                    router.back();
                  }
                }}
              >
                <ThemedText style={[styles.modalButtonText]}>
                  {levelNumber < 200 ? "Next Level" : "Finish"}
                </ThemedText>
                {levelNumber < 200 && (
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color="#111"
                    style={{ marginLeft: 8 }}
                  />
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* 하단 광고 */}
      {Platform.OS !== "web" && BannerAd && BannerAdSize && (
        <View
          style={[
            styles.adContainer,
            {
              backgroundColor: adBackgroundColor,
              paddingBottom: Platform.OS === "android" ? insets.bottom + 8 : 8,
            },
          ]}
        >
          <BannerAd
            unitId={AD_UNIT_ID}
            size={BannerAdSize.BANNER}
            requestOptions={{
              requestNonPersonalizedAdsOnly: true,
            }}
            onAdFailedToLoad={(error: any) => {
              console.error("Ad failed to load:", error);
            }}
          />
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  levelTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  stats: {
    fontSize: 12,
    opacity: 0.7,
  },
  hintCountdown: {
    fontSize: 18,
    fontWeight: "bold",
  },
  placeholder: {
    width: 40,
  },
  hintButtonContainer: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  hintButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  hintCountBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  hintCount: {
    top: -4,
    fontSize: 10,
    fontWeight: "bold",
    color: "#ffffff",
  },
  gameArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    paddingBottom: 100, // Space for banner ad
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  card: {
    borderRadius: 12,
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
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    width: "85%",
    maxWidth: 400,
    borderRadius: 24,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 30,
  },
  trophyIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: "center",
  },
  modalStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 30,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(128, 128, 128, 0.2)",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  modalButtons: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  primaryButton: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  secondaryButton: {
    borderWidth: 2,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
    textAlign: "center",
    lineHeight: 24,
  },
});
