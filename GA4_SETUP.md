# GA4 (Google Analytics 4) 설치 가이드

## 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: "Twin Match")
4. Google Analytics 활성화 (GA4 자동 연결됨)
5. Analytics 계정 선택 또는 새로 생성

## 2. Android 앱 추가

1. Firebase 프로젝트에서 "Android 앱 추가" 클릭
2. Android 패키지 이름 입력: `com.mojoday.twinmatch` (app.json의 android.package와 동일)
3. 앱 닉네임 입력 (선택사항)
4. `google-services.json` 파일 다운로드
5. 파일을 `android/app/` 폴더에 복사

## 3. iOS 앱 추가

1. Firebase 프로젝트에서 "iOS 앱 추가" 클릭
2. iOS 번들 ID 입력: `com.mojoday.twinmatch` (app.json의 ios.bundleIdentifier와 동일)
3. 앱 닉네임 입력 (선택사항)
4. `GoogleService-Info.plist` 파일 다운로드
5. 파일을 `ios/twinmatch/` 폴더에 복사

## 4. app.json 설정

app.json의 plugins 배열에 Firebase 플러그인 추가 (필요시):

```json
"expo-firebase-analytics"
```

**참고**: `expo-firebase-analytics`는 deprecated 되었지만 여전히 작동합니다. 
더 최신 방법을 원한다면 `@react-native-firebase/analytics`를 사용할 수 있지만, 
네이티브 빌드와 추가 설정이 필요합니다.

## 5. 네이티브 빌드

Firebase Analytics는 네이티브 모듈이므로 개발 빌드가 필요합니다:

```bash
# Android
npx expo prebuild --platform android
npx expo run:android

# iOS
npx expo prebuild --platform ios
npx expo run:ios
```

## 6. 사용 방법

`utils/analytics.ts` 파일에 이미 유틸리티 함수들이 준비되어 있습니다:

```typescript
import { logEvent, logLevelStart, logLevelComplete } from '@/utils/analytics';

// 이벤트 로깅
await logEvent('button_click', { button_name: 'play' });

// 레벨 시작
await logLevelStart(1);

// 레벨 완료
await logLevelComplete(1, 10, 30000); // level, moves, time(ms)
```

## 7. 주요 이벤트

게임에서 추적할 주요 이벤트:
- `level_start`: 레벨 시작
- `level_complete`: 레벨 완료
- `hint_used`: 힌트 사용
- `rewarded_ad_watched`: 보상형 광고 시청
- `interstitial_ad_shown`: 전면 광고 표시
- `screen_view`: 화면 조회

## 8. GA4에서 데이터 확인

1. [Google Analytics](https://analytics.google.com/) 접속
2. 생성한 GA4 속성 선택
3. "실시간" 보고서에서 즉시 데이터 확인 가능
4. "이벤트" 메뉴에서 커스텀 이벤트 확인

## 참고사항

- `expo-firebase-analytics`는 deprecated 되었지만 여전히 작동합니다
- 웹에서는 Analytics가 작동하지 않으므로 console.log로 대체됩니다
- 네이티브 빌드가 필요하므로 Expo Go에서는 작동하지 않습니다
- Firebase 프로젝트와 GA4 속성이 자동으로 연결됩니다

