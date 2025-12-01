import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const COMPLETED_LEVELS_KEY = "@twin_match:completed_levels";
const UNLOCKED_LEVELS_KEY = "@twin_match:unlocked_levels";

// Safe storage abstraction that works on web and native
const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === "web") {
        return typeof window !== "undefined"
          ? window.localStorage.getItem(key)
          : null;
      }
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.warn("Storage getItem error:", error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, value);
        }
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.warn("Storage setItem error:", error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(key);
        }
        return;
      }
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn("Storage removeItem error:", error);
    }
  },
};

// Get all completed levels
export const getCompletedLevels = async (): Promise<number[]> => {
  try {
    const data = await safeStorage.getItem(COMPLETED_LEVELS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting completed levels:", error);
    return [];
  }
};

// Mark a level as completed
export const completeLevel = async (level: number): Promise<void> => {
  try {
    const completed = await getCompletedLevels();
    if (!completed.includes(level)) {
      completed.push(level);
      await safeStorage.setItem(
        COMPLETED_LEVELS_KEY,
        JSON.stringify(completed)
      );
    }

    // Unlock next level (only if level is within range)
    if (level < 30) {
      await unlockLevel(level + 1);
    }
  } catch (error) {
    console.error("Error completing level:", error);
  }
};

// Get all unlocked levels
export const getUnlockedLevels = async (): Promise<number[]> => {
  try {
    const data = await safeStorage.getItem(UNLOCKED_LEVELS_KEY);
    if (data) {
      const unlocked = JSON.parse(data);
      // Ensure first level is always unlocked
      if (!unlocked.includes(1)) {
        unlocked.push(1);
        unlocked.sort((a: number, b: number) => a - b);
        await safeStorage.setItem(
          UNLOCKED_LEVELS_KEY,
          JSON.stringify(unlocked)
        );
      }
      return unlocked;
    }
    // First level is always unlocked - initialize it
    const initialUnlocked = [1];
    await safeStorage.setItem(
      UNLOCKED_LEVELS_KEY,
      JSON.stringify(initialUnlocked)
    );
    return initialUnlocked;
  } catch (error) {
    console.error("Error getting unlocked levels:", error);
    return [1];
  }
};

// Unlock a level
export const unlockLevel = async (level: number): Promise<void> => {
  try {
    const unlocked = await getUnlockedLevels();
    if (!unlocked.includes(level)) {
      unlocked.push(level);
      await safeStorage.setItem(UNLOCKED_LEVELS_KEY, JSON.stringify(unlocked));
    }
  } catch (error) {
    console.error("Error unlocking level:", error);
  }
};

// Check if a level is completed
export const isLevelCompleted = async (level: number): Promise<boolean> => {
  const completed = await getCompletedLevels();
  return completed.includes(level);
};

// Check if a level is unlocked
export const isLevelUnlocked = async (level: number): Promise<boolean> => {
  const unlocked = await getUnlockedLevels();
  return unlocked.includes(level);
};

// Reset all progress (for testing)
export const resetProgress = async (): Promise<void> => {
  try {
    await safeStorage.removeItem(COMPLETED_LEVELS_KEY);
    await safeStorage.removeItem(UNLOCKED_LEVELS_KEY);
  } catch (error) {
    console.error("Error resetting progress:", error);
  }
};

const LAST_INTERSTITIAL_AD_KEY = "@twin_match:last_interstitial_ad";

// Get last interstitial ad timestamp
export const getLastInterstitialAdTime = async (): Promise<number | null> => {
  try {
    const data = await safeStorage.getItem(LAST_INTERSTITIAL_AD_KEY);
    return data ? parseInt(data, 10) : null;
  } catch (error) {
    console.error("Error getting last interstitial ad time:", error);
    return null;
  }
};

// Save last interstitial ad timestamp
export const saveLastInterstitialAdTime = async (): Promise<void> => {
  try {
    const timestamp = Date.now();
    await safeStorage.setItem(LAST_INTERSTITIAL_AD_KEY, timestamp.toString());
  } catch (error) {
    console.error("Error saving last interstitial ad time:", error);
  }
};

// Check if 5 minutes have passed since last interstitial ad
export const shouldShowInterstitialAd = async (): Promise<boolean> => {
  try {
    const lastTime = await getLastInterstitialAdTime();
    if (!lastTime) {
      return true; // Never shown, show it
    }
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
    return Date.now() - lastTime >= fiveMinutes;
  } catch (error) {
    console.error("Error checking interstitial ad time:", error);
    return false;
  }
};
