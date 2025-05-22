import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

// 임시 데이터 - 실제로는 구글 API를 통해 가져옵니다
const mockData = {
  votes: {
    1: 5,
    2: 8,
    3: 12,
    4: 3,
    5: 7,
    6: 10,
    7: 6,
    8: 9,
    9: 4,
    10: 11,
    11: 15
  },
  totalParticipants: 20  // 목업 데이터에 투표 인원수 추가
};

// Vercel 환경에서 JSON 문자열을 처리하기 위한 함수
const getCredentials = () => {
  // 로컬 환경: 파일에서 읽기
  const keyFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  if (keyFilePath && fs.existsSync(keyFilePath)) {
    return { keyFile: keyFilePath };
  }
  
  // Vercel 환경: 환경 변수가 JSON 문자열인 경우
  const credentialsJson = process.env.GOOGLE_CREDENTIALS;
  if (credentialsJson) {
    try {
      // 임시 파일 생성
      const tmpFilePath = path.join('/tmp', 'google-credentials.json');
      fs.writeFileSync(tmpFilePath, credentialsJson);
      return { keyFile: tmpFilePath };
    } catch (error) {
      console.error('Error creating credentials file:', error);
      throw error;
    }
  }
  
  throw new Error('Google API credentials not found');
};

export async function GET() {
  try {
    // 개발 환경인지 확인
    const isDev = process.env.NODE_ENV === 'development';
    console.log(`Environment: ${process.env.NODE_ENV}`);
    
    // 개발 환경에서 인증 정보가 없으면 Mock 데이터 사용
    if (isDev && (!process.env.GOOGLE_APPLICATION_CREDENTIALS || !process.env.SPREADSHEET_ID)) {
      console.log('Using mock data in development environment');
      return NextResponse.json(mockData);
    }
    
    // 구글 API 연동 코드 사용
    const authConfig = getCredentials();
    const auth = new google.auth.GoogleAuth({
      ...authConfig,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    const spreadsheetId = process.env.SPREADSHEET_ID;
    if (!spreadsheetId) {
      throw new Error('Spreadsheet ID not provided');
    }
    
    // 스프레드시트 정보 가져오기
    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId,
    });
    
    // 첫 번째 시트 이름 가져오기
    const firstSheetName = spreadsheetInfo.data.sheets?.[0]?.properties?.title || '설문지 응답 시트1';
    console.log(`First sheet name: ${firstSheetName}`);
    
    // 가능한 시트 이름 목록
    const possibleSheetNames = [
      firstSheetName,
      '설문지 응답 시트1',
      '설문지 응답',
      'Form Responses 1',
      'Sheet1'
    ];
    
    // 각 시트 이름으로 시도
    let rows: any[] = [];
    let usedSheetName = '';
    
    for (const sheetName of possibleSheetNames) {
      try {
        console.log(`Trying sheet name: ${sheetName}`);
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${sheetName}!A:M`,
        });
        
        if (response.data.values && response.data.values.length > 0) {
          rows = response.data.values;
          usedSheetName = sheetName;
          console.log(`Successfully fetched data from sheet: ${sheetName}`);
          break;
        }
      } catch (error) {
        console.log(`Error fetching from sheet ${sheetName}: ${error}`);
        continue;
      }
    }
    
    console.log(`Fetched rows: ${rows.length} from sheet: ${usedSheetName}`);
    
    if (rows.length === 0) {
      console.log('No data found in any sheet. Using mock data.');
      return NextResponse.json({
        ...mockData,
        _debug: {
          error: 'No data found in any sheet',
          triedSheets: possibleSheetNames
        }
      });
    }
    
    // 데이터 처리 로직
    // 각 로고별 투표수 계산 (중복 선택 가능)
    const votes: Record<string, number> = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0
    };
    
    // 첫 번째 행은 헤더이므로 건너뛰기
    let totalParticipants = 0;
    if (rows.length > 1) {
      // 헤더 제외한 행 수 = 총 투표 인원수 (A열 타임스탬프 카운트)
      totalParticipants = rows.length - 1;
      console.log(`Total participants calculated: ${totalParticipants}`);
      
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        
        // B열부터 M열까지 (시안 #1/11부터 시안 #11/11까지)
        for (let j = 1; j <= 11; j++) {
          if (row[j] && row[j].includes('선택')) {
            votes[j] = votes[j] + 1;
          }
        }
      }
    } else {
      console.log(`Warning: No data rows found (only header or empty)`);
    }
    
    // 응답에 디버깅 정보 추가
    const responseData = {
      votes,
      totalParticipants,
      _debug: {
        rowCount: rows.length,
        hasHeader: rows.length > 0,
        environment: process.env.NODE_ENV,
        sheetName: usedSheetName,
        triedSheets: possibleSheetNames
      }
    };
    
    console.log(`API Response: ${JSON.stringify(responseData)}`);
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching form responses:', error);
    return NextResponse.json(
      { 
        error: '데이터를 가져오는 중 오류가 발생했습니다.', 
        errorDetails: String(error),
        votes: mockData.votes,
        totalParticipants: mockData.totalParticipants
      },
      { status: 500 }
    );
  }
} 