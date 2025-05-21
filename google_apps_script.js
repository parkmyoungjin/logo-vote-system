// 구글 앱스 스크립트 코드
// 이 코드를 구글 스크립트 편집기에 복사하여 사용하세요

// 웹 앱으로 POST 요청을 처리하는 함수
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // 폼에서 전송된 데이터 가져오기
  var data = e.parameter;
  
  // 타임스탬프 생성
  var timestamp = new Date();
  
  // 시트에 데이터 추가
  sheet.appendRow([
    timestamp,
    data.name,
    data.department,
    data.email,
    data.logoIds,
    data.logoNames,
    data.comment
  ]);
  
  // CORS 헤더 설정
  var headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  
  // 성공 응답 반환
  return ContentService
    .createTextOutput(JSON.stringify({ 'result': 'success' }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(headers);
}

// 웹 앱에서 GET 요청을 처리하는 함수 (테스트용)
function doGet(e) {
  // CORS 헤더 설정
  var headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  
  return ContentService
    .createTextOutput(JSON.stringify({ 'result': 'get request received' }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(headers);
}

// OPTIONS 요청 처리 함수 (CORS 프리플라이트 요청)
function doOptions(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  var headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
  
  return ContentService
    .createTextOutput(JSON.stringify({}))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(headers);
}
