# Twin Match 🎮

A memory matching puzzle game built with React Native and Expo. Find matching pairs of cards to complete each level!

## 🎯 Features

- **200 Levels**: Progressive difficulty with increasing grid sizes
- **Level System**: Unlock new levels by completing previous ones
- **Hint System**:
  - Magic wand hint (reveal all cards for 10 seconds)
  - 3 free hints per level
  - Watch rewarded ads to get 3 additional hints (up to 3 times)
- **Progress Tracking**: Local storage saves your completed levels
- **Ad Integration**:
  - Bottom banner ads
  - Interstitial ads (shown every 5 minutes when advancing levels)
  - Rewarded ads for hints
- **Dark/Light Mode**: Automatic theme support
- **Smooth Animations**: Card flip animations and completion celebrations

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS) or Android Emulator (for Android)

### Installation

1. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

2. Start the development server:

   ```bash
   npm start
   # or
   yarn start
   ```

3. Run on your preferred platform:

   ```bash
   # iOS
   npm run ios
   # or
   yarn ios

   # Android
   npm run android
   # or
   yarn android

   # Web
   npm run web
   # or
   yarn web
   ```

## 📱 Platform Support

- ✅ iOS
- ✅ Android
- ✅ Web (with limited ad support)

## 🎮 How to Play

1. **Select a Level**: Choose from 200 available levels on the home screen
2. **Match Cards**: Tap cards to flip them and find matching pairs
3. **Complete the Level**: Match all pairs to advance to the next level
4. **Use Hints**: Tap the magic wand icon to reveal all cards for 10 seconds
5. **Get More Hints**: Watch rewarded ads when you run out of hints

## 🏗️ Project Structure

```
twin-match/
├── app/                    # Expo Router pages
│   ├── index.tsx          # Home screen (level selection)
│   ├── game/
│   │   └── [level].tsx    # Game screen
│   └── _layout.tsx        # Root layout
├── components/             # Reusable components
├── utils/                 # Utility functions
│   ├── ads.ts            # Ad management utilities
│   └── levelStorage.ts   # Level progress storage
├── constants/             # App constants
└── assets/               # Images and assets
```

## 🛠️ Technologies Used

- **React Native**: Cross-platform mobile framework
- **Expo**: Development platform and tooling
- **Expo Router**: File-based routing
- **TypeScript**: Type-safe development
- **React Native Google Mobile Ads**: Ad integration
- **AsyncStorage**: Local data persistence
- **React Native Safe Area Context**: Safe area handling

## 📦 Key Dependencies

- `expo`: ~54.0.25
- `expo-router`: ~6.0.15
- `react-native-google-mobile-ads`: ^16.0.0
- `@react-native-async-storage/async-storage`: ^2.2.0
- `react-native-safe-area-context`: ~5.6.0

## 🎨 Features in Detail

### Level System

- Levels 1-5: 2x3 grid (6 cards)
- Levels 6-10: 3x4 grid (12 cards)
- Levels 11-15: 4x4 grid (16 cards)
- Levels 16-20: 4x5 grid (20 cards)
- Levels 21-25: 4x6 grid (24 cards)
- Levels 26-200: 5x6 grid (30 cards)

### Hint System

- **Free Hints**: 3 hints per level
- **Rewarded Ads**: Watch ads to get 3 additional hints (max 3 times)
- **Hint Duration**: 10 seconds of card visibility
- **Countdown Timer**: Shows remaining time during hint

### Ad System

- **Banner Ads**: Displayed at the bottom of screens
- **Interstitial Ads**: Shown when advancing levels (5-minute cooldown)
- **Rewarded Ads**: Watch to receive 3 hints

## 🔧 Development

### Building for Production

```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

### Environment Setup

This project uses Expo's managed workflow. For native modules (like ads), you'll need to create a development build:

```bash
npx expo prebuild
npx expo run:ios
# or
npx expo run:android
```

## 📝 License

Private project - All rights reserved

## 👨‍💻 Development Notes

- The app uses Expo Router for navigation
- Ad integration requires a development build (not available in Expo Go)
- Level progress is stored locally using AsyncStorage
- All game logic is implemented in the game screen component
