import React from 'react';
import { Box, Grid, Typography, Card, CardContent, LinearProgress, Chip, Stack } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AssignmentIcon from '@mui/icons-material/Assignment';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// 알림 섹션 컴포넌트
function AlertSection({ alertItems }) {
  return (
    <Card sx={{ mb: 3, borderRadius: 2 }}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
          주요 알림
        </Typography>
        {alertItems.map((item, index) => (
          <Box 
            key={index} 
            sx={{ 
              p: 2, 
              mb: 1, 
              borderRadius: 1,
              backgroundColor: item.priority === 'high' ? '#fff3f0' : '#f0f7ff',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <NotificationsIcon sx={{ mr: 1, color: item.priority === 'high' ? '#ff4d4f' : '#1890ff' }} />
            <Typography variant="body2">{item.message}</Typography>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}

// 계약 현황 요약 컴포넌트
function ContractSummary({ summary }) {
  return (
    <Card sx={{ mb: 3, borderRadius: 2 }}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
          계약 현황 요약
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6">{summary.total}</Typography>
              <Typography variant="body2" color="text.secondary">전체</Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="success.main">{summary.active}</Typography>
              <Typography variant="body2" color="text.secondary">진행중</Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="warning.main">{summary.pending}</Typography>
              <Typography variant="body2" color="text.secondary">대기중</Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="error.main">{summary.expired}</Typography>
              <Typography variant="body2" color="text.secondary">만료</Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

// 최근 활동 컴포넌트
function ActivityTimeline({ activities }) {
  return (
    <Card sx={{ mb: 3, borderRadius: 2 }}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
          최근 계약 활동
        </Typography>
        {activities.map((activity, index) => (
          <Box key={index} sx={{ 
            display: 'flex', 
            mb: 2,
            pb: 2,
            borderBottom: index !== activities.length - 1 ? '1px solid #f0f0f0' : 'none'
          }}>
            <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
            <Box>
              <Typography variant="body2">{activity.title}</Typography>
              <Typography variant="caption" color="text.secondary">
                {activity.date}
              </Typography>
              <Typography 
                variant="body2" 
                color={activity.status === 'completed' ? 'success.main' : 'warning.main'}
              >
                {activity.status === 'completed' ? '완료' : '진행중'}
              </Typography>
            </Box>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}

// 금액 포맷팅 함수 수정
const formatKoreanCurrency = (amount) => {
  return `￦ ${new Intl.NumberFormat('ko-KR').format(amount)}`;
};

// 계약 상태에 따른 진행 상태 텍스트 반환
const getStatusText = (status) => {
  switch (status) {
    case '체결대기':
      return '서명 진행 중';
    case '진행중':
      return '계약 이행 중';
    case '체결완료':
      return '계약 완료';
    default:
      return status;
  }
};

const ContractDashboard = () => {
  // 샘플 데이터
  const monthlyData = [
    { month: '1월', count: 65, amount: 8500 },
    { month: '2월', count: 75, amount: 9200 },
    { month: '3월', count: 85, amount: 9800 },
    { month: '4월', count: 78, amount: 9100 },
    { month: '5월', count: 90, amount: 10200 },
  ];

  const recentContracts = [
    { 
      status: '체결대기',
      title: '타이어뱅크 공급계약',
      date: '2024.03.20',
      step: '서명 대기'
    },
    { 
      status: '진행중',
      title: '정비소 위탁계약',
      date: '2024.03.15',
      step: '계약 이행'
    },
    { 
      status: '체결완료',
      title: '부품 공급계약',
      date: '2024.03.10',
      step: '완료'
    }
  ];

  const alertItems = [
    { type: 'expire', message: '7일 내 만료 예정 계약 3건', priority: 'high' },
    { type: 'sign', message: '서명 대기 중 계약 2건', priority: 'medium' },
    { type: 'review', message: '검토 필요 계약 1건', priority: 'medium' }
  ];

  const contractSummary = {
    total: 120,
    active: 85,
    pending: 20,
    expired: 15
  };

  const recentActivities = [
    { 
      date: '2024-03-15',
      type: 'sign',
      title: '타이어뱅크 공급계약 체결',
      status: 'completed'
    },
    {
      date: '2024-03-14',
      type: 'review',
      title: '정비소 위탁계약 검토중',
      status: 'pending'
    }
  ];

  // 툴팁 커스터마이징 함수 추가
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box sx={{ 
          backgroundColor: 'white', 
          p: 1, 
          border: '1px solid #ccc',
          borderRadius: 1
        }}>
          <Typography variant="body2">{label}</Typography>
          <Typography variant="body2" color="primary">
            {`${payload[0].value}건`}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  // 계약 유형별 현황 데이터 추가
  const contractTypes = {
    consignment: {  // 위수탁 계약
      total: 45,
      active: 35,
      pending: 5,
      expired: 5,
      revenue: 85000000,
      recentContracts: [
        {
          company: '타이어뱅크',
          type: '위수탁',
          amount: 25000000,
          date: '2024-02-15',
          period: '12개월'
        },
        {
          company: '카센터',
          type: '위수탁',
          amount: 18000000,
          date: '2024-02-10',
          period: '6개월'
        }
      ]
    },
    rental: {  // 임대 계약
      total: 30,
      active: 25,
      pending: 3,
      expired: 2,
      revenue: 45000000,
      recentContracts: [
        {
          company: '정비소A',
          type: '임대',
          amount: 15000000,
          date: '2024-02-20',
          period: '24개월'
        }
      ]
    },
    labor: {  // 근로 계약
      total: 25,
      active: 20,
      pending: 3,
      expired: 2,
      revenue: 35000000,
      recentContracts: [
        {
          company: '정비소B',
          type: '근로',
          amount: 12000000,
          date: '2024-02-18',
          period: '12개월'
        }
      ]
    }
  };

  // 지역별 데이터 추가
  const regionData = {
    daejeon: {
      yuseong: {
        name: '유성구',
        contracts: 45,
        revenue: 85000000,
        activeContracts: 38
      },
      dong: {
        name: '동구',
        contracts: 32,
        revenue: 65000000,
        activeContracts: 28
      },
      seo: {
        name: '서구',
        contracts: 38,
        revenue: 72000000,
        activeContracts: 34
      },
      jung: {
        name: '중구',
        contracts: 25,
        revenue: 48000000,
        activeContracts: 22
      }
    },
    sejong: {
      all: {
        name: '세종시',
        contracts: 42,
        revenue: 78000000,
        activeContracts: 36
      }
    }
  };

  // 장비별 데이터 추가
  const equipmentData = {
    lift: {
      name: '리프트',
      total: 85,
      active: 75,
      pending: 8,
      revenue: 95000000
    },
    tireChanger: {
      name: '탈부착기',
      total: 65,
      active: 58,
      pending: 5,
      revenue: 72000000
    },
    balancer: {
      name: '밸런스기',
      total: 70,
      active: 62,
      pending: 6,
      revenue: 78000000
    },
    alignment: {
      name: '얼라이먼트',
      total: 45,
      active: 40,
      pending: 4,
      revenue: 92000000
    },
    tireHotel: {
      name: '타이어호텔',
      total: 25,
      active: 22,
      pending: 2,
      revenue: 45000000
    }
  };

  return (
    <Box 
      sx={{ 
        p: 4,  // 패딩 증가
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
          계약 현황 대시보드
        </Typography>
        <Typography variant="body2" color="text.secondary">
          최근 업데이트: 2024.03.15
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* 첫 번째 카드 - 계약 현황 */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            borderRadius: 2,
            background: 'linear-gradient(135deg, #3f51b5 0%, #2196f3 100%)',
            color: 'white',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssignmentIcon sx={{ mr: 1 }} />
                <Typography variant="h6">계약 현황</Typography>
              </Box>
              <Typography variant="h4" sx={{ mb: 2 }}>85건</Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">신규 계약</Typography>
                  <Typography variant="body2">32건</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">갱신 계약</Typography>
                  <Typography variant="body2">53건</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <TrendingUpIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  <Typography variant="body2">전월 대비 12% ↑</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* 두 번째 카드 - 매출 현황 */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            borderRadius: 2,
            background: 'linear-gradient(135deg, #43a047 0%, #66bb6a 100%)',
            color: 'white',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoneyIcon sx={{ mr: 1 }} />
                <Typography variant="h6">매출 현황</Typography>
              </Box>
              <Typography variant="h4" sx={{ mb: 2 }}>
                {formatKoreanCurrency(9000000)}
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">장비 계약</Typography>
                  <Typography variant="body2">{formatKoreanCurrency(6500000)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">서비스 계약</Typography>
                  <Typography variant="body2">{formatKoreanCurrency(2500000)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <TrendingUpIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  <Typography variant="body2">전월 대비 8% ↑</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* 세 번째 카드 - 계약 만료 예정 */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            borderRadius: 2,
            background: 'linear-gradient(135deg, #ff9800 0%, #ffc107 100%)',
            color: 'white',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccessTimeIcon sx={{ mr: 1 }} />
                <Typography variant="h6">만료 예정</Typography>
              </Box>
              <Typography variant="h4" sx={{ mb: 2 }}>15건</Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">7일 이내</Typography>
                  <Typography variant="body2">5건</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">30일 이내</Typography>
                  <Typography variant="body2">10건</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Typography variant="body2" sx={{ color: '#fff3e0' }}>
                    갱신 예정: 12건
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 2, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>월별 계약 추이</Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3f51b5" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3f51b5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      name="계약 건수"
                      stroke="#3f51b5" 
                      fillOpacity={1} 
                      fill="url(#colorCount)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>계약 유형별 현황</Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 1, 
                    backgroundColor: '#e6f7ff',
                    textAlign: 'center'
                  }}>
                    <Typography variant="h6" color="primary">
                      {contractTypes.consignment.total}
                    </Typography>
                    <Typography variant="body2">위수탁 계약</Typography>
                    <Typography variant="caption" color="text.secondary">
                      활성 {contractTypes.consignment.active}건
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 1, 
                    backgroundColor: '#f6ffed',
                    textAlign: 'center'
                  }}>
                    <Typography variant="h6" color="success.main">
                      {contractTypes.rental.total}
                    </Typography>
                    <Typography variant="body2">임대 계약</Typography>
                    <Typography variant="caption" color="text.secondary">
                      활성 {contractTypes.rental.active}건
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 1, 
                    backgroundColor: '#fff7e6',
                    textAlign: 'center'
                  }}>
                    <Typography variant="h6" color="warning.main">
                      {contractTypes.labor.total}
                    </Typography>
                    <Typography variant="body2">근로 계약</Typography>
                    <Typography variant="caption" color="text.secondary">
                      활성 {contractTypes.labor.active}건
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 지역별/장비별 현황 - 2열 배치 */}
        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              borderRadius: 2, 
              height: '100%',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'  // 그림자 개선
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>지역별 계약 현황</Typography>
              <Grid container spacing={2}>
                {Object.entries({ ...regionData.daejeon, ...regionData.sejong }).map(([key, region]) => (
                  <Grid item xs={6} key={key}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        boxShadow: 1,
                        transition: 'transform 0.2s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 2
                        }
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                        {region.name}
                      </Typography>
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">총 계약</Typography>
                          <Typography variant="body2">{region.contracts}건</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">진행중</Typography>
                          <Typography variant="body2" color="primary">
                            {region.activeContracts}건
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">매출</Typography>
                          <Typography variant="body2" color="success.main">
                            {formatKoreanCurrency(region.revenue)}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              borderRadius: 2, 
              height: '100%',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>장비별 계약 현황</Typography>
              {Object.values(equipmentData).map((equipment) => (
                <Box
                  key={equipment.name}
                  sx={{
                    mb: 2,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    boxShadow: 1
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2">{equipment.name}</Typography>
                    <Chip
                      size="small"
                      label={`${equipment.active}/${equipment.total}대`}
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                  <Box sx={{ mt: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={(equipment.active / equipment.total) * 100}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'rgba(0,0,0,0.1)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4
                        }
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      계약 대기: {equipment.pending}대
                    </Typography>
                    <Typography variant="body2" color="success.main">
                      {formatKoreanCurrency(equipment.revenue)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* 최근 계약 체결 현황 - 전체 너비 */}
        <Grid item xs={12}>
          <Card 
            sx={{ 
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>최근 계약 체결 현황</Typography>
              <Grid container spacing={2}>
                {Object.values(contractTypes).map(type => 
                  type.recentContracts.map((contract, index) => (
                    <Grid item xs={6} key={index}>
                      <Box 
                        sx={{ 
                          mb: 2,
                          p: 2,
                          borderRadius: 1,
                          backgroundColor: '#fff',
                          border: '1px solid #f0f0f0'
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {contract.company}
                          </Typography>
                          <Chip 
                            label={contract.type}
                            size="small"
                            color={
                              contract.type === '위수탁' ? 'primary' :
                              contract.type === '임대' ? 'success' : 'warning'
                            }
                            variant="outlined"
                          />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">
                            계약금액: {formatKoreanCurrency(contract.amount)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {contract.date} ({contract.period})
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ContractDashboard; 