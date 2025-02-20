import React from 'react';
import { Box, Grid, Paper, Typography } from '@mui/material';

const Dashboard = () => {
  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: '#FFFFFF',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 헤더 */}
      <Box sx={{ 
        p: 2, 
        position: 'sticky',
        top: 0,
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #EEEEEE',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600, 
            color: '#2A2A2A',
            textAlign: 'center'
          }}
        >
          대시보드
        </Typography>
      </Box>

      {/* 컨텐츠 */}
      <Box sx={{ 
        flex: 1, 
        p: 2,
        overflow: 'auto'
      }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2">전체 점검</Typography>
              <Typography variant="h4">123</Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2">이번 달</Typography>
              <Typography variant="h4">45</Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1">월별 점검 현황</Typography>
              <Typography variant="body2" color="text.secondary">
                차트 컴포넌트 준비 중...
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard; 