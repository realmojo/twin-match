import { NativeModules, Platform } from "react-native";

// Firebase Analytics 네이티브 모듈 (나중에 구현 예정)
// 현재는 로그만 출력하고, 네이티브에서 Firebase가 자동으로 수집합니다
let FirebaseAnalytics: any = null;

try {
  // 네이티브 모듈이 있으면 사용 (나중에 구현)
  if (Platform.OS !== "web" && NativeModules.FirebaseAnalytics) {
    FirebaseAnalytics = NativeModules.FirebaseAnalytics;
  }
} catch (error) {
  // 네이티브 모듈이 없어도 계속 진행
}

// GA4 이벤트 추적 유틸리티
export const logEvent = async (
  eventName: string,
  params?: Record<string, any>
) => {
  try {
    if (Platform.OS === "web") {
      // 웹에서는 GA4 직접 구현 또는 다른 방법 사용
      console.log("Analytics Event:", eventName, params);
      return;
    }

    // 네이티브 모듈이 있으면 사용
    if (FirebaseAnalytics) {
      await FirebaseAnalytics.logEvent(eventName, params);
    } else {
      // 네이티브 모듈이 없으면 로그만 출력
      // Firebase는 네이티브에서 자동으로 초기화되므로 기본 이벤트는 수집됩니다
      console.log("Analytics Event:", eventName, params);
    }
  } catch (error) {
    console.error("Analytics error:", error);
  }
};

// 화면 조회 추적
export const logScreenView = async (
  screenName: string,
  screenClass?: string
) => {
  await logEvent("screen_view", {
    screen_name: screenName,
    screen_class: screenClass || screenName,
  });
};

// 게임 이벤트
export const logLevelStart = async (level: number) => {
  await logEvent("level_start", { level });
};

export const logLevelComplete = async (
  level: number,
  moves: number,
  time: number
) => {
  await logEvent("level_complete", {
    level,
    moves,
    time_seconds: Math.floor(time / 1000),
  });
};

export const logHintUsed = async (level: number, hintCount: number) => {
  await logEvent("hint_used", {
    level,
    hint_count: hintCount,
  });
};

export const logRewardedAdWatched = async (level: number) => {
  await logEvent("rewarded_ad_watched", {
    level,
    reward_type: "hints",
  });
};

export const logInterstitialAdShown = async (level: number) => {
  await logEvent("interstitial_ad_shown", {
    level,
  });
};

// 사용자 속성 설정
export const setUserProperty = async (name: string, value: string) => {
  try {
    if (Platform.OS === "web") {
      console.log("User Property:", name, value);
      return;
    }

    // 네이티브 모듈이 있으면 사용
    if (FirebaseAnalytics) {
      await FirebaseAnalytics.setUserProperty(name, value);
    } else {
      console.log("User Property:", name, value);
    }
  } catch (error) {
    console.error("Analytics error:", error);
  }
};
