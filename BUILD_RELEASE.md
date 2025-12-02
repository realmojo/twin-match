# Release 빌드 가이드

## 출시 모드로 서명된 AAB/APK 빌드하기

### 1. 키스토어 확인

키스토어 파일이 올바른 위치에 있는지 확인:
- 키스토어 파일: `android/app/twinmatch-release.keystore`
- 설정 파일: `android/keystore.properties`

### 2. Release AAB 빌드 (Google Play Store용)

```bash
cd android
NODE_ENV=production ./gradlew bundleRelease
```

빌드된 파일 위치:
```
android/app/build/outputs/bundle/release/app-release.aab
```

### 3. Release APK 빌드 (직접 설치용)

```bash
cd android
NODE_ENV=production ./gradlew assembleRelease
```

빌드된 파일 위치:
```
android/app/build/outputs/apk/release/app-release.apk
```

### 4. 서명 확인

빌드된 AAB/APK가 올바르게 서명되었는지 확인:

```bash
# AAB 서명 확인
jarsigner -verify -verbose -certs android/app/build/outputs/bundle/release/app-release.aab

# APK 서명 확인
jarsigner -verify -verbose -certs android/app/build/outputs/apk/release/app-release.apk
```

또는:

```bash
# APK 서명 정보 확인
apksigner verify --print-certs android/app/build/outputs/apk/release/app-release.apk
```

### 5. Google Play Console에 업로드

1. Google Play Console 접속
2. 앱 선택 → "프로덕션" 또는 "내부 테스트" 트랙 선택
3. "새 버전 만들기" 클릭
4. 빌드된 `app-release.aab` 파일 업로드

### 6. 문제 해결

#### 키스토어를 찾을 수 없는 경우

`android/keystore.properties` 파일이 올바른 경로를 가리키는지 확인:
```
MYAPP_RELEASE_STORE_FILE=app/twinmatch-release.keystore
MYAPP_RELEASE_KEY_ALIAS=twinmatch-key-alias
MYAPP_RELEASE_STORE_PASSWORD=your_password
MYAPP_RELEASE_KEY_PASSWORD=your_password
```

#### 빌드가 여전히 debug 서명을 사용하는 경우

1. `android/keystore.properties` 파일이 존재하는지 확인
2. `android/app/build.gradle`의 release 빌드 타입이 올바른지 확인
3. 빌드 캐시 정리 후 재빌드:
   ```bash
   cd android
   ./gradlew clean
   ./gradlew bundleRelease
   ```

### 7. 버전 업데이트

새 버전을 출시할 때:

1. `app.json`에서 버전 업데이트:
   ```json
   "version": "1.0.1"
   ```

2. `android/app/build.gradle`에서 versionCode 증가:
   ```gradle
   versionCode 2
   versionName "1.0.1"
   ```

3. Release 빌드 생성 및 업로드

