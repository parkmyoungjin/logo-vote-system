# 로고 투표 시스템 설정 가이드

이 가이드는 로고 투표 페이지를 구글 시트와 연동하는 방법을 안내합니다.

## 1. 구글 시트 설정하기

1. [Google Drive](https://drive.google.com)에서 새 스프레드시트를 생성합니다.
2. 첫 번째 행에 다음 열 제목을 추가합니다:
   - A열: 타임스탬프
   - B열: 이름
   - C열: 부서
   - D열: 이메일
   - E열: 로고ID
   - F열: 로고명
   - G열: 의견

## 2. 구글 앱스 스크립트 설정하기

1. 스프레드시트에서 `확장 프로그램 > Apps Script`를 클릭합니다.
2. 열린 스크립트 편집기에 제공된 "google_apps_script.js" 파일의 코드를 붙여넣습니다.
3. 파일을 저장합니다(`Ctrl+S` 또는 `⌘+S`).
4. 상단 메뉴에서 `배포 > 새 배포`를 클릭합니다.
5. `웹 앱`을 선택합니다.
6. 다음과 같이 설정합니다:
   - 설명: "로고 투표 시스템"
   - 실행: "자기 계정으로"
   - 액세스 권한: "모든 사용자(인증 필요 없음)"
7. `배포`를 클릭합니다.
8. 권한 요청 창이 뜨면 권한을 허용합니다.
9. 배포가 완료되면 웹 앱 URL이 생성됩니다. 이 URL을 복사해두세요.

## 3. HTML 페이지 연동하기

1. "index.html" 파일에서 다음 부분을 찾습니다:
   ```javascript
   // 구글 스크립트 배포 URL (나중에 실제 URL로 변경해야 함)
   const scriptURL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID_HERE/exec';
   ```

2. `YOUR_SCRIPT_ID_HERE` 부분을 앞서 복사한 웹 앱 URL로 변경합니다.

## 4. 웹 서버에 배포하기

1. 다음 파일 구조로 웹 서버에 업로드합니다:
   ```
   /logo-vote-system/
      index.html
      /images/
         시안#1.png
         시안#2.png
         ...
         시안#11.png
   ```

2. 웹 서버 URL을 직원들에게 공유합니다.

## 문제 해결

- **CORS 에러**: 구글 앱스 스크립트와 통신 시 CORS 오류가 발생하면, [이 가이드](https://developers.google.com/apps-script/guides/web#cors)를 참고하세요.
- **이미지 로드 실패**: 이미지 경로가 올바른지 확인하세요.
- **구글 시트 업데이트 실패**: 구글 앱스 스크립트 배포 URL이 올바르게 설정되었는지 확인하세요.

## 주의사항

- 구글 앱스 스크립트 웹 앱은 하루에 처리할 수 있는 요청 수에 제한이 있습니다.
- 더 많은 기능(로고별 투표 횟수 집계, 결과 시각화 등)이 필요하면 스크립트를 확장할 수 있습니다.

## Google Apps Script 배포 시 이미지 사용 방법

Google Apps Script 웹 앱으로 배포할 때 로컬 이미지를 직접 참조할 수 없습니다. 다음과 같은 방법으로 이미지를 사용할 수 있습니다:

### 1. 이미지를 Base64로 인코딩하여 HTML에 직접 포함

이미지를 Base64로 인코딩하여 HTML 코드에 직접 포함시키는 방법입니다.

1. 온라인 Base64 이미지 인코더 사용 (예: https://www.base64-image.de/)
2. Node.js를 사용하여 변환:

```javascript
const fs = require('fs');
const path = require('path');

// 이미지 폴더 경로
const imageFolder = path.join(__dirname, 'images');

// 이미지 파일 목록 가져오기
const imageFiles = fs.readdirSync(imageFolder);

// 로고 데이터 배열 생성
const logoData = [];

// 각 이미지 파일 처리
imageFiles.forEach((file, index) => {
  const filePath = path.join(imageFolder, file);
  const fileData = fs.readFileSync(filePath);
  const base64Data = fileData.toString('base64');
  
  // 파일 확장자로 MIME 타입 추론
  let mimeType = 'image/png'; // 기본값
  if (file.endsWith('.jpg') || file.endsWith('.jpeg')) {
    mimeType = 'image/jpeg';
  } else if (file.endsWith('.svg')) {
    mimeType = 'image/svg+xml';
  }
  
  // 객체 생성
  logoData.push({
    file: file,
    title: `시안 #${index + 1}`,
    base64: `data:${mimeType};base64,${base64Data}`
  });
});

// 결과 출력
console.log(JSON.stringify(logoData, null, 2));
```

이 코드를 실행한 후 생성된 JSON을 HTML 파일의 `logoData` 배열에 추가하면 됩니다.

### 2. 외부 호스팅 사용

GitHub, Google Drive 또는 다른 이미지 호스팅 서비스를 사용하여 이미지를 호스팅하고 URL로 참조할 수 있습니다.

배포 후 이미지 경로를 수정해야 할 경우 index.html 파일에서 다음 부분을 찾아 경로를 수정하세요:
```javascript
logoImg.src = 'https://raw.githubusercontent.com/peterburwell-infor/logo-vote-system/main/images/' + logoInfo.file;
```

현재 이 예제는 GitHub 저장소 경로를 사용하고 있습니다. 실제로 사용할 경우 올바른 GitHub 저장소 경로나 다른 호스팅 URL로 교체해주세요.
