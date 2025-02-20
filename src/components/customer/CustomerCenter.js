import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import FAQ from './FAQ';
import ChatBot from './ChatBot';

const CustomerCenter = () => {
  const [tabValue, setTabValue] = useState(0);
  
  // 포인트 색상 정의
  const POINT_COLOR = '#4B77D8';  // 밝은 파란색 계열
  
  return (
    <Box sx={{ maxWidth: '430px', margin: '0 auto', minHeight: '100vh' }}>
      {/* 헤더 */}
      <Box sx={{ 
        p: 2, 
        position: 'sticky',
        top: 0,
        bgcolor: '#FFFFFF',
        borderBottom: '1px solid #eee',
        zIndex: 1,
        textAlign: 'center'
      }}>
        <Typography variant="h6">고객센터</Typography>
      </Box>

      {/* 탭 네비게이션 */}
      <Box sx={{ px: 2, mt: 3 }}>
        <Box sx={{ 
          display: 'inline-flex',
          borderBottom: '1px solid #eee',
          gap: 2
        }}>
          <Tab 
            label="자주 묻는 질문" 
            disableRipple
            onClick={() => setTabValue(0)}
            sx={{ 
              minWidth: 'auto',
              minHeight: '36px',
              padding: '8px 0',
              fontSize: '0.875rem',
              color: tabValue === 0 ? '#222222' : '#666',  // 선택된 탭 색상을 더 진한 검정으로
              fontWeight: tabValue === 0 ? 600 : 400,
              textTransform: 'none',
              borderBottom: tabValue === 0 ? `2px solid ${POINT_COLOR}` : 'none',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'transparent',
                color: POINT_COLOR
              }
            }} 
          />
          <Tab 
            label="1:1 챗봇문의" 
            disableRipple
            onClick={() => setTabValue(1)}
            sx={{ 
              minWidth: 'auto',
              minHeight: '36px',
              padding: '8px 0',
              fontSize: '0.875rem',
              color: tabValue === 1 ? '#222222' : '#666',
              fontWeight: tabValue === 1 ? 600 : 400,
              textTransform: 'none',
              borderBottom: tabValue === 1 ? `2px solid ${POINT_COLOR}` : 'none',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'transparent',
                color: POINT_COLOR
              }
            }} 
          />
        </Box>
      </Box>

      {/* 컨텐츠 영역 */}
      <Box sx={{ p: 2 }}>
        {tabValue === 0 && <FAQ />}
        {tabValue === 1 && <ChatBot />}
      </Box>
    </Box>
  );
};

export default CustomerCenter; 