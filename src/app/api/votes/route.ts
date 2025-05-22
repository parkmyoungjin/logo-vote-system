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
    
    // 전체 시트 데이터 가져오기 (A:M 열까지)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: '설문지 응답 시트1!A:M', // 시트 이름과 범위 수정
    });

    const rows = response.data.values || [];
    
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
      
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        
        // B열부터 M열까지 (시안 #1/11부터 시안 #11/11까지)
        for (let j = 1; j <= 11; j++) {
          if (row[j] && row[j].includes('선택')) {
            votes[j] = votes[j] + 1;
          }
        }
      }
    }
    
    return NextResponse.json({ votes, totalParticipants });
  } catch (error) {
    console.error('Error fetching form responses:', error);
    return NextResponse.json(
      { error: '데이터를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 