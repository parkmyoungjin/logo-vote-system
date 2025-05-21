import React, { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import CountUp from 'react-countup';

// API 호출을 위한 fetcher 함수
const fetcher = (url: string) => fetch(url).then((res) => res.json());

const VoteDashboard = () => {
  // 데이터 새로고침을 위한 상태 추가
  const [refreshKey, setRefreshKey] = useState(0);
  // 애니메이션 상태 관리
  const [animate, setAnimate] = useState(false);

  // SWR로 데이터 가져오기 (60초마다 자동 갱신)
  const { data, error, isLoading, mutate } = useSWR('/api/votes', fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: false,
    dedupingInterval: 5000,
    key: `/api/votes?refresh=${refreshKey}`,
  });

  // 새로고침 버튼 클릭 핸들러
  const handleRefresh = async () => {
    setAnimate(true); // 애니메이션 활성화
    await mutate(); // 데이터 새로고침
    setRefreshKey(prev => prev + 1); // 새로고침 키 업데이트
  };

  // 데이터가 변경될 때마다 애니메이션 활성화
  useEffect(() => {
    if (data && !isLoading) {
      setAnimate(true);
      
      // 10초 후 애니메이션 비활성화 (다음 업데이트를 위해)
      const timer = setTimeout(() => {
        setAnimate(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [data, isLoading]);

  if (isLoading) return <div className="text-center p-10">데이터를 불러오는 중...</div>;
  if (error) return <div className="text-center p-10 text-red-500">데이터를 불러오는데 실패했습니다.</div>;

  const votes = data?.votes || {};

  // 총 투표수 계산
  const totalVotes = Object.values(votes).reduce((sum: number, count: number | unknown) => sum + (Number(count) || 0), 0);

  // 로고 카드 컴포넌트
  const LogoCard = ({ number, votes }: { number: number; votes: number }) => {
    // 백분율 계산 (소수점 1자리까지)
    const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : '0.0';
    const percentageValue = parseFloat(percentage);
    
    // 이미지 경로 (실제 이미지가 없을 경우 플레이스홀더 사용)
    const imagePath = `/images/logos/logo-${number}.png`;
    
    // 이미지 로딩 에러 처리
    const [imageError, setImageError] = React.useState(false);
    
    // 게이지 바 컴포넌트를 위한 ref
    const progressBarRef = useRef<HTMLDivElement>(null);
    
    // 애니메이션이 바뀔 때마다 게이지 바 업데이트
    useEffect(() => {
      if (progressBarRef.current) {
        if (animate) {
          // 초기 상태는 0%
          progressBarRef.current.style.width = '0%';
          
          // 약간의 지연 후 애니메이션 시작 (DOM 업데이트 보장)
          setTimeout(() => {
            if (progressBarRef.current) {
              progressBarRef.current.style.transition = 'width 2.5s ease-out';
              progressBarRef.current.style.width = `${percentageValue}%`;
            }
          }, 50);
        } else {
          // 애니메이션이 아닐 때는 바로 값을 설정
          progressBarRef.current.style.transition = 'none';
          progressBarRef.current.style.width = `${percentageValue}%`;
        }
      }
    }, [animate, percentageValue]);
    
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
        
        <div className="text-3xl font-bold text-blue-600">
          {animate ? (
            <CountUp
              start={0}
              end={votes || 0}
              duration={2.5}
              useEasing={true}
            />
          ) : (
            votes || 0
          )}
        </div>
        <div className="text-sm text-gray-500">
          <span className="font-semibold">
            {animate ? (
              <CountUp
                start={0}
                end={percentageValue}
                duration={2.5}
                decimals={1}
                useEasing={true}
                suffix="%"
              />
            ) : (
              `${percentage}%`
            )}
          </span>
        </div>
        
        {/* 진행 상태 막대 */}
        <div className="w-full mt-2 bg-gray-200 rounded-full h-2">
          <div 
            ref={progressBarRef}
            className="bg-blue-600 h-2 rounded-full"
            style={{
              width: animate ? '0%' : `${percentageValue}%`,
            }}
          ></div>
        </div>

        {/* CountUp으로 진행 상태 애니메이션 시각화 (시각적으로 표시되지 않음) */}
        {animate && (
          <CountUp
            start={0}
            end={percentageValue}
            duration={2.5}
            decimals={1}
            useEasing={true}
            onUpdate={(value) => {
              // CountUp 애니메이션이 업데이트될 때마다 게이지 표시
              if (progressBarRef.current && !progressBarRef.current.style.transition) {
                progressBarRef.current.style.width = `${value}%`;
              }
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 min-h-screen relative">
      {/* 새로고침 버튼 */}
      <button
        onClick={handleRefresh}
        className="absolute top-4 right-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full flex items-center shadow-md transition-all duration-300 hover:shadow-lg active:scale-95"
        title="데이터 새로고침"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        새로고침
      </button>

      <h1 className="text-2xl font-bold text-center mb-2">지역완결형 글로벌 허브 메디컬센터</h1>
      <h2 className="text-lg text-center mb-4">사업로고 선호도 실시간 집계</h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 11 }, (_, i) => i + 1).map((number) => (
          <LogoCard key={`${number}-${refreshKey}`} number={number} votes={votes[number] || 0} />
        ))}
      </div>

      <div className="mt-6 text-center">
        <div className="text-lg font-semibold">
          총 투표수: <span className="text-blue-600">
            {animate ? (
              <CountUp
                start={0}
                end={totalVotes}
                duration={2}
                useEasing={true}
              />
            ) : (
              totalVotes
            )}
          </span>
        </div>
        <div className="text-sm text-gray-500 mt-1">
          마지막 업데이트: {new Date().toLocaleString('ko-KR')}
        </div>
      </div>
    </div>
  );
};

export default VoteDashboard; 