import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

const Schedule = () => {
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
          일정 관리
        </Typography>
      </Box>

      {/* 컨텐츠 */}
      <Box sx={{ 
        flex: 1, 
        p: 2,
        overflow: 'auto'
      }}>
        <Paper sx={{ p: 2 }}>
          {/* 캘린더 컴포넌트 추가 예정 */}
          <Typography variant="body2" color="text.secondary">
            캘린더 컴포넌트 준비 중...
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default Schedule; 