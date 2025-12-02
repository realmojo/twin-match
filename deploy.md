app.json 에서 버전코드올리기, android/app/bundle.gradle
version="1.0.x"
android.versionCode=x

// 키스토어 생성 (최초 1회만)
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore twinmatch-release.keystore -alias twinmatch-key-alias -keyalg RSA -keysize 2048 -validity 10000

// 입력 정보 예시:
// - 키스토어 비밀번호: (안전한 비밀번호 입력)
// - 키 비밀번호: (키스토어 비밀번호와 동일하게 입력하거나 Enter)
// - 이름: (회사/개인 이름)
// - 조직 단위: (부서명, 선택사항)
// - 조직: (회사명)
// - 도시: (도시명)
// - 시/도: (시/도명)
// - 국가 코드: KR

// 키스토어 정보 확인
keytool -list -v -keystore twinmatch-release.keystore

// 키스토어 파일은 android/app/ 폴더에 생성됨
// ⚠️ 중요: 키스토어 파일과 비밀번호는 안전하게 보관하세요!

// 키스토어 설정 방법 1: android/gradle.properties 파일에 직접 추가 (비추천)
// MYAPP*RELEASE_STORE_FILE=app/twinmatch-release.keystore
// MYAPP_RELEASE_KEY_ALIAS=twinmatch-key-alias
// MYAPP_RELEASE_STORE_PASSWORD=여기에*키스토어*비밀번호
// MYAPP_RELEASE_KEY_PASSWORD=여기에*키\_비밀번호

// 키스토어 설정 방법 2: 별도 파일 사용 (권장)
// 1. android/keystore.properties.example을 keystore.properties로 복사
// 2. 실제 비밀번호 입력
// 3. android/app/build.gradle 파일 상단에 추가:
// def keystorePropertiesFile = rootProject.file("keystore.properties")
// def keystoreProperties = new Properties()
// if (keystorePropertiesFile.exists()) {
// keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
// }
// 4. signingConfigs.release에서 사용:
// storeFile file(keystoreProperties['MYAPP_RELEASE_STORE_FILE'])
// storePassword keystoreProperties['MYAPP_RELEASE_STORE_PASSWORD']
// keyAlias keystoreProperties['MYAPP_RELEASE_KEY_ALIAS']
// keyPassword keystoreProperties['MYAPP_RELEASE_KEY_PASSWORD']

// ⚠️ 보안 주의사항:
// 1. keystore.properties 파일은 .gitignore에 추가되어 있어야 합니다
// 2. 키스토어 파일(\*.keystore)도 .gitignore에 포함되어 있습니다
// 3. 키스토어 파일과 비밀번호는 안전하게 백업하세요 (분실 시 앱 업데이트 불가능!)

android
npx expo prebuild --platform android

ios
npx expo prebuild --platform ios
EXPO_NO_WATCHMAN=1 expo run:ios --device

<!-- eas build --profile production --platform android --local -->

// 플레이스토어 올릴 때
cd android
NODE_ENV=production ./gradlew bundleRelease

// 로컬앱에 프로덕션 모드로 설치하고 싶을 때
NODE_ENV=production ./gradlew assembleRelease
adb install app/build/outputs/apk/release/app-release.apk

// 앱스토어 기기로 실행하기

certificate 먼저 등록하기
https://developer.apple.com/account/resources/identifiers/list

// 앱 등록
https://appstoreconnect.apple.com/apps

xcode 에서 메인폴더 선택 후 Signing & Capabilitites 이거 맞추기
Team: Mojoday
Bundle Identifer: 위에 등록한거

// 앱스토어 올릴 떄
npx expo prebuild --platform ios
cd ios
pod install

Xcode 에서 product -> archive (release 빌드)
Windows -> Organizer
Distribute App -> App Store Connect 전송

<!-- eas build --platform android --local -->

이미지 오류나면 아래 명령어 실행
find android/app/src/main/res/ -name "\*.webp" -delete

로그 캣 초기화
adb logcat -c
adb logcat | grep ReactNativeJS

watchman 오류시 중지했다가 다시 실행
watchman shutdown-server
watchman

❌ error: Sandbox: bash(12201) deny(1) file-write-create /Users/realmojo/Desktop/d/cpnow-app/ios/Pods/resources-to-copy-imageNotification.txt (in target 'imageNotification' from project 'app')

Build Settings -> User Script Sandboxing -> No
