import React, { useState } from 'react';
import { Box, Tab, Typography } from '@mui/material';
import { Routes, Route, useNavigate } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BusinessIcon from '@mui/icons-material/Business';
import QAManagement from './QnAManagement';

import Dashboard from './Dashboard';
import Schedule from './Schedule';
import Notifications from './Notifications';
import Reports from './Reports';
import Categories from './Categories';

const Settings = () => {
  const navigate = useNavigate();
  const userRole = sessionStorage.getItem('role')?.toUpperCase();
  const [selectedTab, setSelectedTab] = useState('/settings/dashboard');

  const menuItems = [
    { path: '/settings/dashboard', label: '대시보드' },
    { path: '/settings/reports', label: '보고서' },
    { path: '/settings/categories', label: '분류' },
    ...(userRole === 'ADMIN' ? [
      { path: '/settings/qa-management', label: 'QnA 관리' }
    ] : [])
  ];

  const handleTabChange = (path) => {
    setSelectedTab(path);
    navigate(path);
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
        <Typography variant="h6">설정</Typography>
      </Box>

      {/* 탭 네비게이션 */}
      <Box sx={{ px: 2, mt: 3 }}>
        <Box sx={{ 
          display: 'inline-flex',
          borderBottom: '1px solid #eee',
          gap: 2
        }}>
          {menuItems.map((item) => (
            <Tab 
              key={item.path}
              label={item.label}
              disableRipple
              onClick={() => handleTabChange(item.path)}
              sx={{ 
                minWidth: 'auto',
                minHeight: '36px',
                padding: '8px 0',
                fontSize: '0.875rem',
                color: selectedTab === item.path ? '#222222' : '#666',
                fontWeight: selectedTab === item.path ? 600 : 400,
                textTransform: 'none',
                borderBottom: selectedTab === item.path ? '2px solid #4B77D8' : 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'transparent',
                  color: '#4B77D8'
                }
              }} 
            />
          ))}
        </Box>
      </Box>

      {/* 컨텐츠 영역 */}
      <Box sx={{ p: 2 }}>
        <Routes>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="reports" element={<Reports />} />
          <Route path="categories" element={<Categories />} />
          {userRole === 'ADMIN' && (
            <Route path="qa-management" element={<QAManagement />} />
          )}
        </Routes>
      </Box>
    </Box>
  );
};

export default Settings; 