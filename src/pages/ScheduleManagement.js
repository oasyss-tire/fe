import React, { useState } from 'react';
import { Box, Tab, Typography } from '@mui/material';
import Schedule from '../components/settings/Schedule';
import Notifications from '../components/settings/Notifications';

const ScheduleManagement = () => {
  const [selectedTab, setSelectedTab] = useState('schedule');

  const handleTabChange = (tab) => {
    setSelectedTab(tab);
  };

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
        <Typography variant="h6">일정 관리</Typography>
      </Box>

      {/* 탭 네비게이션 */}
      <Box sx={{ px: 2, mt: 3 }}>
        <Box sx={{ 
          display: 'inline-flex',
          borderBottom: '1px solid #eee',
          gap: 2
        }}>
          <Tab 
            label="일정 관리" 
            disableRipple
            onClick={() => handleTabChange('schedule')}
            sx={{ 
              minWidth: 'auto',
              minHeight: '36px',
              padding: '8px 0',
              fontSize: '0.875rem',
              color: selectedTab === 'schedule' ? '#222222' : '#666',
              fontWeight: selectedTab === 'schedule' ? 600 : 400,
              textTransform: 'none',
              borderBottom: selectedTab === 'schedule' ? '2px solid #4B77D8' : 'none',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'transparent',
                color: '#4B77D8'
              }
            }} 
          />
          <Tab 
            label="알림" 
            disableRipple
            onClick={() => handleTabChange('notifications')}
            sx={{ 
              minWidth: 'auto',
              minHeight: '36px',
              padding: '8px 0',
              fontSize: '0.875rem',
              color: selectedTab === 'notifications' ? '#222222' : '#666',
              fontWeight: selectedTab === 'notifications' ? 600 : 400,
              textTransform: 'none',
              borderBottom: selectedTab === 'notifications' ? '2px solid #4B77D8' : 'none',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'transparent',
                color: '#4B77D8'
              }
            }} 
          />
        </Box>
      </Box>

      {/* 컨텐츠 영역 */}
      <Box sx={{ p: 2 }}>
        {selectedTab === 'schedule' && <Schedule />}
        {selectedTab === 'notifications' && <Notifications />}
      </Box>
    </Box>
  );
};

export default ScheduleManagement; 