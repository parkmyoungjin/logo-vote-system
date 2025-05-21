// Node.js로 실행하세요
// images 폴더의 모든 PNG 파일을 base64로 변환해서 콘솔에 출력합니다.

const fs = require('fs');
const path = require('path');

const imageFolder = path.join(__dirname, 'images');
const imageFiles = fs.readdirSync(imageFolder).filter(f => f.endsWith('.png'));

const logoData = [];

imageFiles.forEach((file, idx) => {
  const filePath = path.join(imageFolder, file);
  const fileData = fs.readFileSync(filePath);
  const base64Data = fileData.toString('base64');
  logoData.push({
    file: file,
    title: `시안 #${idx + 1}`,
    base64: `data:image/png;base64,${base64Data}`
  });
});

console.log(JSON.stringify(logoData, null, 2));