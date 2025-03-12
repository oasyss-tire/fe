import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress
} from '@mui/material';
import {
  Construction as ConstructionIcon,
  Engineering as EngineeringIcon,
  PendingActions as PendingActionsIcon
} from '@mui/icons-material';

const FacilityDashboard = () => {
  return (
    <Box sx={{ p: 3, backgroundColor: '#F8F8FE', minHeight: '100vh' }}>
      {/* 상단 헤더 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#3A3A3A' }}>
          시설물 대시보드
        </Typography>
      </Box>

      {/* 준비 중 메시지 */}
      <Paper sx={{ 
        p: 3, 
        borderRadius: 2,
        boxShadow: 'none',
        border: '1px solid #EEEEEE',
        mb: 3,
        bgcolor: '#fff'
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          py: 2
        }}>
          <ConstructionIcon sx={{ fontSize: 60, color: '#1976d2', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#1976d2', mb: 1 }}>
            서비스 준비 중입니다
          </Typography>
          <Typography variant="body2" sx={{ color: '#666', textAlign: 'center' }}>
            더 나은 서비스를 제공하기 위해 준비 중입니다.<br />
            빠른 시일 내에 선보이도록 하겠습니다.
          </Typography>
        </Box>
      </Paper>

      {/* 임시 대시보드 카드 */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            bgcolor: '#fff',
            boxShadow: 'none',
            border: '1px solid #EEEEEE',
            borderRadius: 2,
            opacity: 0.7
          }}>
            <CardContent sx={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#666', mb: 1 }}>
                  전체 시설물
                </Typography>
                <Typography variant="h4" sx={{ color: '#1976d2' }}>
                  - -
                </Typography>
              </Box>
              <EngineeringIcon sx={{ fontSize: 40, color: '#1976d2' }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ 
            bgcolor: '#fff',
            boxShadow: 'none',
            border: '1px solid #EEEEEE',
            borderRadius: 2,
            opacity: 0.7
          }}>
            <CardContent sx={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#666', mb: 1 }}>
                  점검 예정
                </Typography>
                <Typography variant="h4" sx={{ color: '#1976d2' }}>
                  - -
                </Typography>
              </Box>
              <PendingActionsIcon sx={{ fontSize: 40, color: '#1976d2' }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ 
            bgcolor: '#fff',
            boxShadow: 'none',
            border: '1px solid #EEEEEE',
            borderRadius: 2,
            opacity: 0.7
          }}>
            <CardContent sx={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#666', mb: 1 }}>
                  금월 점검 완료
                </Typography>
                <Typography variant="h4" sx={{ color: '#1976d2' }}>
                  - -
                </Typography>
              </Box>
              <CircularProgress 
                variant="determinate" 
                value={0} 
                size={40}
                sx={{ color: '#1976d2' }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FacilityDashboard; 