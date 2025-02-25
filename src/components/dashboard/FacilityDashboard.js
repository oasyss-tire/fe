import React from 'react';
import { Box, Grid, Typography, Card, CardContent, Chip, Stack } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BuildIcon from '@mui/icons-material/Build';
import WarningIcon from '@mui/icons-material/Warning';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

const FacilityDashboard = () => {
  // 납품 지점별 시설물 현황
  const branchStatus = [
    { 
      name: '서울 지점', 
      count: 45, 
      contractStart: '2024-01-01',
      contractEnd: '2025-12-31',
      contract: '계약중'
    },
    { 
      name: '부산 지점', 
      count: 30,
      contractStart: '2024-03-01',
      contractEnd: '2025-02-28',
      contract: '계약중'
    },
    { 
      name: '대구 지점', 
      count: 25,
      contractStart: '2023-03-01',
      contractEnd: '2025-03-15',
      contract: '계약 만료 예정'
    },
    { 
      name: '광주 지점', 
      count: 20,
      contractStart: '2024-01-01',
      contractEnd: '2026-12-31',
      contract: '계약중'
    },
    { 
      name: '대전 지점', 
      count: 15,
      contractStart: '2024-02-01',
      contractEnd: '2025-01-31',
      contract: '계약 만료 임박'
    }
  ];

  // 시설물 상태 현황
  const facilityStatus = {
    total: 150,
    statuses: [
      { name: '사용중', value: 100, color: '#52c41a' },
      { name: '이동중', value: 20, color: '#1890ff' },
      { name: '수리중', value: 15, color: '#faad14' },
      { name: '매각', value: 10, color: '#ff4d4f' },
      { name: '분실', value: 5, color: '#cf1322' }
    ]
  };

  // 월별 매출 및 미수금 데이터
  const financialData = [
    { month: '1월', revenue: 8500, unpaid: 1200 },
    { month: '2월', revenue: 9200, unpaid: 800 },
    { month: '3월', revenue: 9800, unpaid: 1500 },
    { month: '4월', revenue: 9100, unpaid: 2000 },
    { month: '5월', revenue: 10200, unpaid: 1800 }
  ];

  // 시설물 가치 데이터
  const assetValue = {
    totalValue: 1500000000,  // 총 자산 가치
    depreciationThisMonth: 12500000,  // 이번달 감가상각액
    depreciationRate: -2.3,  // 전월 대비 감가상각 증감률
  };

  // 점검 현황 데이터 추가
  const inspectionStatus = {
    completed: 85,
    pending: 15,
    overdue: 5,
    nextInspections: [
      {
        facility: '냉각기 A-1',
        location: '서울 지점',
        dueDate: '2024-03-20',
        type: '정기점검'
      },
      {
        facility: '배전반 B-2',
        location: '부산 지점',
        dueDate: '2024-03-22',
        type: '안전점검'
      }
    ]
  };

  // 긴급 알림 데이터 추가
  const alerts = [
    {
      type: 'warning',
      facility: '냉각기 A-1',
      location: '대전 지점',
      message: '온도 상승 감지',
      time: '10분 전'
    },
    {
      type: 'info',
      facility: '배전반 B-2',
      location: '부산 지점',
      message: '정기 점검 예정',
      time: '1시간 전'
    }
  ];

  // 시설물 수리 이력 데이터 추가
  const repairHistory = [
    {
      date: '2024-02-20',
      facility: '냉각기 A-1',
      issue: '부품 교체',
      cost: 2500000,
      location: '서울 지점'
    },
    {
      date: '2024-02-15',
      facility: '배전반 B-2',
      issue: '정기 유지보수',
      cost: 1500000,
      location: '부산 지점'
    }
  ];

  // 금액 포맷팅 함수
  const formatKoreanCurrency = (amount) => {
    return `￦ ${new Intl.NumberFormat('ko-KR').format(amount)}`;
  };

  // 계약 상태 확인 함수
  const getContractStatus = (endDate) => {
    const today = new Date('2025-02-23');
    const end = new Date(endDate);
    const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: '계약 만료', color: 'error' };
    if (diffDays <= 30) return { status: '계약 만료 임박', color: 'error' };
    if (diffDays <= 90) return { status: '계약 만료 예정', color: 'warning' };
    return { status: '계약중', color: 'success' };
  };

  return (
    <Box 
      sx={{ 
        p: 4,
        backgroundColor: '#f5f5f5',
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        boxSizing: 'border-box'
      }}
    >
      {/* 헤더 */}
      <Box sx={{ mb: 4, textAlign: 'left' }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          시설물 현황 대시보드
        </Typography>
        <Typography variant="body2" color="text.secondary">
          최근 업데이트: 2024.03.15
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* 주요 통계 카드 3열 배치 */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            borderRadius: 2,
            background: 'linear-gradient(135deg, #3f51b5 0%, #2196f3 100%)',
            color: 'white',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoneyIcon sx={{ mr: 1 }} />
                <Typography variant="h6">예상 수익</Typography>
              </Box>
              <Typography variant="h4" sx={{ mb: 2 }}>
                {formatKoreanCurrency(10200000)}
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">장비 임대</Typography>
                  <Typography variant="body2">{formatKoreanCurrency(8500000)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">유지보수</Typography>
                  <Typography variant="body2">{formatKoreanCurrency(1700000)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <TrendingUpIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  <Typography variant="body2">전월 대비 12% ↑</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ 
            borderRadius: 2,
            background: 'linear-gradient(135deg, #ff9800 0%, #ffc107 100%)',
            color: 'white',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BuildIcon sx={{ mr: 1 }} />
                <Typography variant="h6">점검 현황</Typography>
              </Box>
              <Typography variant="h4" sx={{ mb: 2 }}>{inspectionStatus.completed}건</Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">예정</Typography>
                  <Typography variant="body2">{inspectionStatus.pending}건</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">지연</Typography>
                  <Typography variant="body2">{inspectionStatus.overdue}건</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Typography variant="body2" sx={{ color: '#fff3e0' }}>
                    다음 점검: {inspectionStatus.nextInspections[0].dueDate}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ 
            borderRadius: 2,
            background: 'linear-gradient(135deg, #43a047 0%, #66bb6a 100%)',
            color: 'white',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocationOnIcon sx={{ mr: 1 }} />
                <Typography variant="h6">지점 현황</Typography>
              </Box>
              <Typography variant="h4" sx={{ mb: 2 }}>{branchStatus.length}개</Typography>
              <Stack spacing={1}>
                {/* 상위 2개 지점 표시 */}
                {branchStatus.slice(0, 2).map((branch, index) => (
                  <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{branch.name}</Typography>
                    <Typography variant="body2">{branch.count}대</Typography>
                  </Box>
                ))}
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Typography variant="body2" sx={{ color: '#e8f5e9' }}>
                    전체 시설물: {facilityStatus.total}대
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* 매출 및 미수금 트렌드 차트 */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 2, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>매출 및 미수금 추이</Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer>
                  <AreaChart data={financialData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3f51b5" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3f51b5" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorUnpaid" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff4d4f" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ff4d4f" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip formatter={(value) => `${value}만원`} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="매출"
                      stroke="#3f51b5"
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                    <Area
                      type="monotone"
                      dataKey="unpaid"
                      name="미수금"
                      stroke="#ff4d4f"
                      fillOpacity={1}
                      fill="url(#colorUnpaid)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 시설물 상태 현황 */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>시설물 상태 현황</Typography>
              <Box sx={{ height: 200, display: 'flex', justifyContent: 'center' }}>
                <PieChart width={200} height={200}>
                  <Pie
                    data={facilityStatus.statuses}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {facilityStatus.statuses.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value}대`, name]} />
                </PieChart>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1, mt: 2 }}>
                {facilityStatus.statuses.map((status, index) => (
                  <Chip
                    key={index}
                    label={`${status.name} ${status.value}대`}
                    size="small"
                    sx={{ backgroundColor: status.color, color: 'white' }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 지역별 현황 */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>납품 지점별 현황</Typography>
              <Grid container spacing={2}>
                {branchStatus.map((branch, index) => (
                  <Grid item xs={6} key={index}>
                    <Box sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                      boxShadow: 1,
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 2
                      }
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LocationOnIcon sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {branch.name}
                          </Typography>
                        </Box>
                        <Chip 
                          label={getContractStatus(branch.contractEnd).status}
                          size="small"
                          color={getContractStatus(branch.contractEnd).color}
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        보유 시설물: {branch.count}대
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        계약기간: {branch.contractStart} ~ {branch.contractEnd}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 긴급 알림 */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>긴급 알림</Typography>
              {alerts.map((alert, index) => (
                <Box 
                  key={index}
                  sx={{ 
                    mb: 2,
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: alert.type === 'warning' ? '#fff3f0' : '#f0f7ff',
                    border: '1px solid',
                    borderColor: alert.type === 'warning' ? '#ffccc7' : '#91caff'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <WarningIcon 
                        sx={{ 
                          mr: 1, 
                          color: alert.type === 'warning' ? '#ff4d4f' : '#1890ff'
                        }} 
                      />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {alert.facility} ({alert.location})
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {alert.time}
                    </Typography>
                  </Box>
                  <Typography variant="body2">{alert.message}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* 최근 수리 이력 */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>최근 수리 이력</Typography>
              <Grid container spacing={2}>
                {repairHistory.map((repair, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Box sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                      boxShadow: 1
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <BuildIcon sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {repair.facility} ({repair.location})
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {repair.date}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {repair.issue}
                      </Typography>
                      <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                        비용: {formatKoreanCurrency(repair.cost)}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FacilityDashboard; 