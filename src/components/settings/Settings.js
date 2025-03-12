import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Divider
} from '@mui/material';
import {
  Code as CodeIcon,
  AdminPanelSettings as AdminIcon,
  Storage as StorageIcon,
  Security as SecurityIcon,
  Business as BusinessIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const navigate = useNavigate();

  const settingMenus = [
    {
      id: 'code',
      title: '코드 관리',
      description: '시스템에서 사용되는 각종 코드를 관리합니다.',
      icon: <CodeIcon sx={{ fontSize: 40, color: '#1976d2' }} />,
      path: '/settings/codes',
      status: 'active'
    },
    {
      id: 'permission',
      title: '권한 관리',
      description: '사용자 권한과 접근 제어를 관리합니다.',
      icon: <AdminIcon sx={{ fontSize: 40, color: '#1976d2' }} />,
      path: '/settings/permissions',
      status: 'active'
    },
    {
      id: 'data',
      title: '데이터 관리',
      description: '시스템 데이터를 백업하고 관리합니다.',
      icon: <StorageIcon sx={{ fontSize: 40, color: '#1976d2' }} />,
      path: '/settings/data',
      status: 'preparing'
    },
    {
      id: 'security',
      title: '보안 설정',
      description: '시스템 보안 정책을 설정합니다.',
      icon: <SecurityIcon sx={{ fontSize: 40, color: '#1976d2' }} />,
      path: '/settings/security',
      status: 'preparing'
    },
    {
      id: 'company',
      title: '업체 설정',
      description: '업체 관련 기본 설정을 관리합니다.',
      icon: <BusinessIcon sx={{ fontSize: 40, color: '#1976d2' }} />,
      path: '/settings/company',
      status: 'preparing'
    },
    {
      id: 'notification',
      title: '알림 설정',
      description: '시스템 알림 설정을 관리합니다.',
      icon: <NotificationsIcon sx={{ fontSize: 40, color: '#1976d2' }} />,
      path: '/settings/notifications',
      status: 'preparing'
    }
  ];

  const handleMenuClick = (menu) => {
    if (menu.status === 'active') {
      navigate(menu.path);
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#F8F8FE', minHeight: '100vh' }}>
      {/* 상단 헤더 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#3A3A3A' }}>
          설정
        </Typography>
      </Box>

      {/* 설정 메뉴 그리드 */}
      <Grid container spacing={3}>
        {settingMenus.map((menu) => (
          <Grid item xs={12} sm={6} md={4} key={menu.id}>
            <Card 
              sx={{ 
                height: '100%',
                boxShadow: 'none',
                border: '1px solid #EEEEEE',
                borderRadius: 2,
                transition: 'transform 0.2s',
                '&:hover': menu.status === 'active' ? {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  borderColor: '#1976d2'
                } : {},
                opacity: menu.status === 'preparing' ? 0.6 : 1
              }}
            >
              <CardActionArea 
                onClick={() => handleMenuClick(menu)}
                disabled={menu.status === 'preparing'}
                sx={{ height: '100%' }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ mb: 2 }}>
                    {menu.icon}
                  </Box>
                  <Typography variant="h6" sx={{ mb: 1, color: '#1976d2' }}>
                    {menu.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
                    {menu.description}
                  </Typography>
                  <Divider sx={{ mt: 'auto' }} />
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'block',
                      mt: 1,
                      color: menu.status === 'preparing' ? '#666' : '#1976d2',
                      fontStyle: menu.status === 'preparing' ? 'italic' : 'normal'
                    }}
                  >
                    {menu.status === 'preparing' ? '준비중' : '사용 가능'}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Settings; 