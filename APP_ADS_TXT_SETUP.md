# app-ads.txt 설정 가이드

## 문제 상황
AdMob 대시보드에서 "아직 app-ads.txt가 포함된 광고 요청 없음" 메시지가 표시되고 있습니다. 이는 광고 수익에 영향을 줄 수 있습니다.

## app-ads.txt란?
`app-ads.txt`는 앱의 광고 인벤토리를 승인된 판매자에게만 판매하도록 보장하는 파일입니다. Google AdMob을 사용하는 경우 필수입니다.

## 설정 방법

### 방법 1: AdMob 대시보드에서 직접 설정 (권장)

1. **AdMob 대시보드 접속**
   - https://apps.admob.com 접속
   - 계정 로그인

2. **앱 선택**
   - 앱 목록에서 "TwinMatch" 선택
   - 또는 App ID: `ca-app-pub-9130836798889522~7784230055`

3. **app-ads.txt 설정**
   - 앱 설정 페이지로 이동
   - "app-ads.txt 설정 방법" 버튼 클릭 (이미지에 표시된 파란색 버튼)
   - 안내에 따라 설정 완료

4. **필요한 정보**
   - Publisher ID: `ca-app-pub-9130836798889522`
   - Relationship: `DIRECT`
   - Account ID: AdMob 계정 ID

### 방법 2: 웹사이트에 파일 호스팅 (웹사이트가 있는 경우)

1. **app-ads.txt 파일 생성**
   ```
   google.com, pub-9130836798889522, DIRECT, f08c47fec0942fa0
   ```

2. **파일 업로드**
   - 웹사이트 루트 도메인에 업로드
   - 예: `https://yourdomain.com/app-ads.txt`
   - 파일은 반드시 루트 경로에 있어야 합니다

3. **AdMob에 URL 등록**
   - AdMob 대시보드에서 웹사이트 URL 등록
   - Google이 자동으로 크롤링하여 확인합니다

## 확인 방법

1. **AdMob 대시보드 확인**
   - 설정 후 24-48시간 내에 상태 업데이트
   - "app-ads.txt가 포함된 광고 요청" 메시지가 사라지면 정상

2. **수동 확인 (웹사이트 호스팅인 경우)**
   - 브라우저에서 `https://yourdomain.com/app-ads.txt` 접속
   - 파일 내용이 정상적으로 표시되는지 확인

## 중요 사항

- ⚠️ 설정 후 최대 7일까지 광고 요청이 제한되었다면 상태가 표시되지 않을 수 있습니다
- ⚠️ app-ads.txt가 없으면 광고 수익이 제한될 수 있습니다
- ⚠️ 파일 형식이 정확해야 합니다 (공백, 쉼표 등 주의)

## 현재 앱 정보

- **App ID**: `ca-app-pub-9130836798889522~7784230055`
- **Publisher ID**: `ca-app-pub-9130836798889522`
- **Bundle ID (iOS)**: `com.mojoday.twinmatch`
- **Package Name (Android)**: `com.mojoday.twinmatch`

## 참고 링크

- [Google AdMob app-ads.txt 가이드](https://support.google.com/admob/answer/9363764)
- [IAB app-ads.txt 사양](https://iabtechlab.com/ads-txt/)

