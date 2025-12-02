import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const COMPLETED_LEVELS_KEY = "@twin_match:completed_levels";
const UNLOCKED_LEVELS_KEY = "@twin_match:unlocked_levels";
const GLOBAL_HINTS_KEY = "@twin_match:global_hints";
const REWARD_REMAINING_KEY = "@twin_match:reward_remaining";

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
    await safeStorage.removeItem(GLOBAL_HINTS_KEY);
    await safeStorage.removeItem(REWARD_REMAINING_KEY);
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

// Get global hints count (shared across all levels)
export const getGlobalHints = async (): Promise<number> => {
  try {
    const data = await safeStorage.getItem(GLOBAL_HINTS_KEY);
    if (data !== null) {
      return parseInt(data, 10);
    }
    // Initialize with 3 hints if not set
    await setGlobalHints(3);
    return 3;
  } catch (error) {
    console.error("Error getting global hints:", error);
    return 3; // Default to 3 hints
  }
};

// Set global hints count
export const setGlobalHints = async (count: number): Promise<void> => {
  try {
    await safeStorage.setItem(GLOBAL_HINTS_KEY, count.toString());
  } catch (error) {
    console.error("Error setting global hints:", error);
  }
};

// Add hints to global count
export const addGlobalHints = async (count: number): Promise<void> => {
  try {
    const current = await getGlobalHints();
    await setGlobalHints(current + count);
  } catch (error) {
    console.error("Error adding global hints:", error);
  }
};

// Use one hint (decrease by 1)
export const useGlobalHint = async (): Promise<number> => {
  try {
    const current = await getGlobalHints();
    if (current > 0) {
      const newCount = current - 1;
      await setGlobalHints(newCount);
      return newCount;
    }
    return current;
  } catch (error) {
    console.error("Error using global hint:", error);
    return await getGlobalHints();
  }
};

// Get reward remaining count (shared across all levels)
export const getRewardRemaining = async (): Promise<number> => {
  try {
    const data = await safeStorage.getItem(REWARD_REMAINING_KEY);
    if (data !== null) {
      return parseInt(data, 10);
    }
    // Initialize with 3 rewards if not set
    await setRewardRemaining(3);
    return 3;
  } catch (error) {
    console.error("Error getting reward remaining:", error);
    return 3; // Default to 3 rewards
  }
};

// Set reward remaining count
export const setRewardRemaining = async (count: number): Promise<void> => {
  try {
    await safeStorage.setItem(REWARD_REMAINING_KEY, count.toString());
  } catch (error) {
    console.error("Error setting reward remaining:", error);
  }
};

// Use one reward (decrease by 1)
export const useReward = async (): Promise<number> => {
  try {
    const current = await getRewardRemaining();
    if (current > 0) {
      const newCount = current - 1;
      await setRewardRemaining(newCount);
      return newCount;
    }
    return current;
  } catch (error) {
    console.error("Error using reward:", error);
    return await getRewardRemaining();
  }
};
