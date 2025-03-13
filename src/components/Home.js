import React from 'react';
import { Box, Typography, Grid, Link, Paper, Button } from '@mui/material';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';

const Home = () => {
  // 원형 차트 데이터
  const pieData = [
    { name: '서명요청 전', value: 35 },
    { name: '서명 대기', value: 25 },
    { name: '계약 대기', value: 20 },
    { name: '계약 중', value: 15 },
    { name: '계약 만료', value: 5 },
  ];

  // 월별 계약 추이 데이터
  const monthlyData = [
    { month: '1월', 계약건수: 40 },
    { month: '2월', 계약건수: 45 },
    { month: '3월', 계약건수: 55 },
    { month: '4월', 계약건수: 40 },
    { month: '5월', 계약건수: 35 },
    { month: '6월', 계약건수: 45 },
    { month: '7월', 계약건수: 42 },
    { month: '8월', 계약건수: 48 },
    { month: '9월', 계약건수: 50 },
    { month: '10월', 계약건수: 52 },
    { month: '11월', 계약건수: 65 },
    { month: '12월', 계약건수: 58 },
  ];

  const COLORS = ['#1976d2', '#673ab7', '#2196f3', '#03a9f4', '#b3e5fc'];

  // 반응형 차트 크기 계산을 위한 함수 수정
  const [chartSize, setChartSize] = React.useState({ width: 0, height: 340 });
  const chartRef = React.useRef(null);

  // 차트 설정 상태 추가
  const [chartConfig, setChartConfig] = React.useState({
    margin: { top: 10, right: 30, left: 30, bottom: 20 },
    barSize: 50
  });

  // 주요 알림 데이터 (나중에 API 응답으로 대체 가능)
  const notifications = [
    {
      id: 1,
      type: '만료 예정',
      content: '타이어 뱅크 위수탁계약',
      date: '2025-03-06'
    },
    {
      id: 2,
      type: '서명 요청',
      content: '타이어 빌크 유수탁 계약',
      date: '2025-03-05'
    }
  ];

  React.useEffect(() => {
    const updateChartSize = () => {
      if (chartRef.current) {
        const width = chartRef.current.offsetWidth;
        const isMobile = width < 600;
        const isTablet = width >= 600 && width < 960;
        
        // 디바이스별 여백과 막대 크기 조정
        const margins = {
          mobile: { top: 10, right: 15, left: 15, bottom: 20 },
          tablet: { top: 10, right: 20, left: 20, bottom: 20 },
          desktop: { top: 10, right: 30, left: 30, bottom: 20 }
        };

        const barSizes = {
          mobile: 30,
          tablet: 40,
          desktop: 50
        };

        setChartConfig({
          margin: isMobile ? margins.mobile : (isTablet ? margins.tablet : margins.desktop),
          barSize: isMobile ? barSizes.mobile : (isTablet ? barSizes.tablet : barSizes.desktop)
        });

        setChartSize({ 
          width: width - (isMobile ? 40 : (isTablet ? 80 : 140)), // 여백 고려
          height: isMobile ? 280 : (isTablet ? 300 : 340)
        });
      }
    };

    // 초기 크기 설정
    updateChartSize();

    // 윈도우 크기 변경 시 차트 크기 업데이트
    window.addEventListener('resize', updateChartSize);
    return () => window.removeEventListener('resize', updateChartSize);
  }, []);

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        p: 3,
        backgroundColor: '#F8F8FE',
      }}
    >
      {/* 상단 헤더 추가 */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600,
            color: '#3A3A3A'
          }}
        >
          홈
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {/* 첫 번째 열: 주요 알림 + 공지사항 */}
        <Grid container item xs={12} md={4} spacing={2}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2, height: '200px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  주요 알림
                </Typography>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  최근 업데이트: 2025-03-06
                </Typography>
              </Box>
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 1,
                  height: 'calc(100% - 40px)', // 헤더 높이를 제외한 나머지 공간
                  overflowY: 'auto', // 세로 스크롤 추가
                  '&::-webkit-scrollbar': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'transparent',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#E0E0E0',
                    borderRadius: '3px',
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    background: '#BDBDBD',
                  }
                }}
              >
                {notifications.map((notification) => (
                  <Box 
                    key={notification.id}
                    sx={{ 
                      p: 2, 
                      bgcolor: '#F8F9FE', 
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: '#F0F3FA'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#3182F6', 
                          fontWeight: 500 
                        }}
                      >
                        {notification.type}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#666' }}>
                        {notification.date}
                      </Typography>
                    </Box>
                    <Typography variant="body2">
                      {notification.content}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2, height: '200px' }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                공지사항
              </Typography>
              <Box sx={{ p: 2, bgcolor: '#f0f7ff', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 500 }}>
                  [공지사항] 계약
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, color: '#666' }}>
                  등록일 | 2025.03.05
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* 두 번째 열: 유형별 현황 + 문의사항 */}
        <Grid container item xs={12} md={4} spacing={2}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2, height: '200px' }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                유형별 현황
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2, height: '200px' }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                문의사항
              </Typography>
              <Box sx={{ p: 2, bgcolor: '#fff3f0', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ color: '#f44336', fontWeight: 500 }}>
                  [문의사항] 계약
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, color: '#666' }}>
                  등록일 | 2025.03.05
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* 세 번째 열: 계약서 상태 */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '416px' }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              계약서 상태
            </Typography>
          </Paper>
        </Grid>

        {/* 하단 전체 너비 차트 */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '416px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                월별 계약 추이
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">2025</Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Button 
                    size="small" 
                    sx={{ 
                      minWidth: '24px', 
                      p: 0,
                      color: '#666' 
                    }}
                  >
                    {'<'}
                  </Button>
                  <Button 
                    size="small" 
                    sx={{ 
                      minWidth: '24px', 
                      p: 0,
                      color: '#666' 
                    }}
                  >
                    {'>'}
                  </Button>
                </Box>
              </Box>
            </Box>
            <Box 
              ref={chartRef}
              sx={{ 
                width: '100%', 
                height: 'calc(100% - 40px)',
                overflow: 'hidden'
              }}
            >
              <BarChart
                width={chartSize.width}
                height={chartSize.height}
                data={monthlyData}
                margin={chartConfig.margin}
                barSize={chartConfig.barSize}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false}
                  stroke="#EEEEEE"
                />
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ 
                    fill: '#666666',
                    fontSize: chartSize.width < 600 ? 11 : 12 // 모바일에서 폰트 크기 조정
                  }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ 
                    fill: '#666666',
                    fontSize: chartSize.width < 600 ? 11 : 12
                  }}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                />
                <Bar 
                  dataKey="계약건수" 
                  fill="#97C2FF"
                  radius={[4, 4, 0, 0]}
                >
                  {monthlyData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill="#97C2FF"
                      onMouseOver={(e) => {
                        e.target.style.fill = '#3182F6';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.fill = '#97C2FF';
                      }}
                      style={{
                        cursor: 'pointer',
                        transition: 'fill 0.2s ease'
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* 푸터 */}
      <Box
        sx={{
          mt: 4,
          pt: 2,
          borderTop: '1px solid #ddd',
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" sx={{ color: '#666' }}>
          (주) 타이어 뱅크 | 세종 한누리대로 350 8층 | TEL: 1599-7181
        </Typography>
        <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
          사용문의{' '}
          <Link
            href="http://www.keyless.kr"
            underline="hover"
            sx={{ fontWeight: 'bold', color: '#666' }}
            target="_blank"
            rel="noopener"
          >
            www.keyless.kr
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default Home;
