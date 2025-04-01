import React from 'react';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Box, 
  Divider,
  Typography,
  Button
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import DescriptionIcon from '@mui/icons-material/Description';
import BusinessIcon from '@mui/icons-material/Business';
import GroupIcon from '@mui/icons-material/Group';
import SettingsIcon from '@mui/icons-material/Settings';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SendIcon from '@mui/icons-material/Send';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BuildIcon from '@mui/icons-material/Build';
import LogoutIcon from '@mui/icons-material/Logout';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import EditIcon from '@mui/icons-material/Edit';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import EngineeringIcon from '@mui/icons-material/Engineering';
import ForumIcon from '@mui/icons-material/Forum';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ChatIcon from '@mui/icons-material/Chat';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useAuth } from '../../contexts/AuthContext';

const DRAWER_WIDTH = 240;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { 
      category: '계약',
      items: [
        { text: '홈', icon: <HomeIcon />, path: '/' },
        { text: '계약 관리', icon: <DescriptionIcon />, path: '/contract-list' },
        { text: '계약서 템플릿', icon: <BusinessCenterIcon />, path: '/contract-templates' },
        { text: '계약서 등록', icon: <EditIcon />, path: '/contract-upload' },
        { text: '계약 생성', icon: <SendIcon />, path: '/contract-send' },
        // { text: '현장 계약', icon: <PeopleAltIcon />, path: '/field-contracts' },
      ]
    },
    {
      category: '시설물',
      items: [
        { text: '시설물 리스트', icon: <ListAltIcon />, path: '/facility-list' },
        { text: '시설물 등록', icon: <EngineeringIcon />, path: '/facility-register' },
        { text: 'A/S 관리', icon: <BuildIcon />, path: '/facility-service' },
        { text: '시설물 대시보드', icon: <DashboardIcon />, path: '/facility-dashboard' },
      ]
    },
    {
      category: '커뮤니티',
      items: [
        { text: '게시판', icon: <ForumIcon />, path: '/service-preparing' },
        { text: '공지사항', icon: <AnnouncementIcon />, path: '/service-preparing' },
        { text: '자료실', icon: <FolderOpenIcon />, path: '/service-preparing' },
        { text: '채팅', icon: <ChatIcon />, path: '/service-preparing' },
      ]
    },
    {
      category: '관리',
      items: [
        { text: '위수탁 업체 관리', icon: <BusinessIcon />, path: '/companies' },
        { text: '사용자 관리', icon: <GroupIcon />, path: '/users' },
        { text: '설정', icon: <SettingsIcon />, path: '/settings' },
      ]
    }
  ];

  return (
    <Box
      sx={{
        height: '100vh',
        backgroundColor: '#F8F8FE',
        pl: 2,  // 왼쪽 패딩
        pt: 2,  // 위쪽 패딩
        pb: 2,  // 아래쪽 패딩
        pr: 0,  // 오른쪽 패딩 제거
      }}
    >
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            position: 'relative',
            width: DRAWER_WIDTH - 16,
            height: 'calc(100vh - 32px)',
            boxSizing: 'border-box',
            bgcolor: '#FFFFFF',
            borderRadius: '12px',
            boxShadow: '0px 0px 2px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* 로고 영역 */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
          <Box
            component="img"
            src="/images/header_logo.png"
            alt="로고"
            sx={{
              height: '40px', // 로고 크기 약간 축소
              width: 'auto',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/')}
          />
        </Box>
        <Divider sx={{ opacity: 0.5 }} />
        
        {/* 메뉴 리스트 */}
        <Box 
          sx={{ 
            py: 1,
            px: 1,
            overflowY: 'auto',
            flexGrow: 1,
            '&::-webkit-scrollbar': {
              width: '6px',
              backgroundColor: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
            },
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(0, 0, 0, 0.1) transparent',
          }}
        >
          {menuItems.map((category) => (
            <Box key={category.category} sx={{ mb: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  px: 2,
                  py: 0.3,
                  color: '#666',
                  fontWeight: 500,
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                {category.category}
              </Typography>
              <List sx={{ py: 0 }}>
                {category.items.map((item) => (
                  <ListItem 
                    button 
                    key={item.text}
                    onClick={() => navigate(item.path)}
                    selected={location.pathname === item.path}
                    sx={{
                      minHeight: '38px',
                      my: 0.2,
                      mx: 1,
                      borderRadius: '8px',
                      '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.04)',
                      },
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(25, 118, 210, 0.08)',
                        '&:hover': {
                          backgroundColor: 'rgba(25, 118, 210, 0.12)',
                        }
                      }
                    }}
                  >
                    <ListItemIcon 
                      sx={{ 
                        minWidth: '35px',
                        color: location.pathname === item.path ? '#1976d2' : '#666'
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text} 
                      sx={{
                        m: 0,
                        '& .MuiListItemText-primary': {
                          fontSize: '0.8rem',
                          fontWeight: location.pathname === item.path ? 600 : 400,
                          color: location.pathname === item.path ? '#1976d2' : '#333'
                        }
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          ))}
        </Box>
        
        {/* 로그아웃 버튼 */}
        <Box sx={{ p: 2 }}>
          <Divider sx={{ mb: 2, opacity: 0.5 }} />
          <Button
            variant="outlined"
            startIcon={<AccountCircleIcon />}
            onClick={() => navigate('/mypage')}
            fullWidth
            sx={{
              justifyContent: 'flex-start',
              color: '#666',
              borderColor: '#E0E0E0',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                borderColor: '#BDBDBD',
              },
              textTransform: 'none',
              fontSize: '0.8rem',
              mb: 1
            }}
          >
            내 정보
          </Button>
          <Button
            variant="outlined"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            fullWidth
            sx={{
              justifyContent: 'flex-start',
              color: '#666',
              borderColor: '#E0E0E0',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                borderColor: '#BDBDBD',
              },
              textTransform: 'none',
              fontSize: '0.8rem',
            }}
          >
            로그아웃
          </Button>
        </Box>
      </Drawer>
    </Box>
  );
};

export default Sidebar; 