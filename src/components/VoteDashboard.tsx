import React from 'react';
import useSWR from 'swr';
import Image from 'next/image';

// API 호출을 위한 fetcher 함수
const fetcher = (url: string) => fetch(url).then((res) => res.json());

const VoteDashboard = () => {
  // SWR로 데이터 가져오기 (5초마다 자동 갱신)
  const { data, error, isLoading } = useSWR('/api/votes', fetcher, {
    refreshInterval: 60000,
  });

  if (isLoading) return <div className="text-center p-10">데이터를 불러오는 중...</div>;
  if (error) return <div className="text-center p-10 text-red-500">데이터를 불러오는데 실패했습니다.</div>;

  const votes = data?.votes || {};

  // 총 투표수 계산
  const totalVotes = Object.values(votes).reduce((sum: number, count: any) => sum + (Number(count) || 0), 0);

  // 로고 카드 컴포넌트
  const LogoCard = ({ number, votes }: { number: number; votes: number }) => {
    // 백분율 계산 (소수점 1자리까지)
    const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : '0.0';
    
    // 이미지 경로 (실제 이미지가 없을 경우 플레이스홀더 사용)
    const imagePath = `/images/logos/logo-${number}.png`;
    
    // 이미지 로딩 에러 처리
    const [imageError, setImageError] = React.useState(false);
    
    return (
      <div className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center justify-center transition-all hover:shadow-lg">
        <h2 className="text-lg font-bold mb-2">시안 #{number}</h2>
        
        {/* 로고 이미지 */}
        <div className="relative w-full h-36 mb-3 bg-gray-50 rounded-md overflow-hidden">
          {imageError ? (
            // 이미지 로딩 실패 시 플레이스홀더 표시
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
              <div className="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-1">로고 {number}</p>
              </div>
            </div>
          ) : (
            // 실제 이미지 표시 (오류 시 플레이스홀더로 대체)
            <Image
              src={imagePath}
              alt={`로고 시안 #${number}`}
              fill
              style={{ objectFit: 'contain' }}
              onError={() => setImageError(true)}
            />
          )}
        </div>
        
        <div className="text-3xl font-bold text-blue-600">{votes || 0}</div>
        <div className="text-sm text-gray-500">
          <span className="font-semibold">{percentage}%</span>
        </div>
        
        {/* 진행 상태 막대 */}
        <div className="w-full mt-2 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full" 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 min-h-screen">
      <h1 className="text-2xl font-bold text-center mb-2">지역완결형 글로벌 허브 메디컬센터</h1>
      <h2 className="text-lg text-center mb-4">사업로고 선호도 실시간 집계</h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 11 }, (_, i) => i + 1).map((number) => (
          <LogoCard key={number} number={number} votes={votes[number] || 0} />
        ))}
      </div>

      <div className="mt-6 text-center">
        <div className="text-lg font-semibold">총 투표수: <span className="text-blue-600">{totalVotes}</span></div>
        <div className="text-sm text-gray-500 mt-1">
          마지막 업데이트: {new Date().toLocaleString('ko-KR')}
        </div>
      </div>
    </div>
  );
};

export default VoteDashboard; 