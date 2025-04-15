import React, { useState, useEffect } from 'react';
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
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { useAuth } from '../../contexts/AuthContext';

const DRAWER_WIDTH = 240;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [permissions, setPermissions] = useState(null);

  // 사용자 역할 가져오기
  const userRole = user?.role || 'USER';

  // 권한 데이터 가져오기
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        // 실제 API 호출
        // const response = await fetch('https://sign.jebee.net/api/permissions');
        // if (response.ok) {
        //   const data = await response.json();
        //   setPermissions(data);
        // }

        // API가 없으므로 기본 권한 설정 사용
        const defaultPermissions = {
          ADMIN: {
            contract: { all: true, items: { home: true, contract_management: true, contract_template: true, contract_upload: true, contract_create: true } },
            facility: { all: true, items: { facility_list: true, facility_register: true, facility_service: true, facility_history: true, facility_transfer: true } },
            community: { all: true, items: { board: true, notice: true, file: true, chat: true } },
            admin: { all: true, items: { company: true, user: true, settings: true } }
          },
          MANAGER: {
            contract: { all: true, items: { home: true, contract_management: true, contract_template: true, contract_upload: true, contract_create: true } },
            facility: { all: true, items: { facility_list: true, facility_register: true, facility_service: true, facility_history: true, facility_transfer: true } },
            community: { all: true, items: { board: true, notice: true, file: true, chat: true } },
            admin: { all: false, items: { company: false, user: false, settings: false } }
          },
          USER: {
            contract: { all: true, items: { home: true, contract_management: true, contract_template: true, contract_upload: true, contract_create: true } }, 
            facility: { all: true, items: { facility_list: true, facility_register: true, facility_service: true, facility_history: true, facility_transfer: true  } },
            community: { all: true, items: { board: true, notice: true, file: true, chat: true } },
            admin: { all: false, items: { company: false, user: false, settings: false } }
          }
        };
        
        setPermissions(defaultPermissions);
      } catch (error) {
        console.error('권한 정보를 불러오는데 실패했습니다:', error);
      }
    };

    fetchPermissions();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 메뉴 접근 권한 확인
  const checkMenuPermission = (category, item) => {
    if (!permissions || !permissions[userRole]) {
      return true; // 권한 정보가 로드되지 않았으면 기본적으로 표시
    }
    
    return permissions[userRole][category]?.items?.[item] || false;
  };

  const menuItems = [
    { 
      category: '계약',
      categoryId: 'contract',
      items: [
        { text: '홈', icon: <HomeIcon />, path: '/', id: 'home' },
        { text: '계약 관리', icon: <DescriptionIcon />, path: '/contract-list', id: 'contract_management' },
        { text: '계약서 템플릿', icon: <BusinessCenterIcon />, path: '/contract-templates', id: 'contract_template' },
        { text: '계약서 등록', icon: <EditIcon />, path: '/contract-upload', id: 'contract_upload' },
        { text: '계약 생성', icon: <SendIcon />, path: '/contract-send', id: 'contract_create' },
        // { text: '현장 계약', icon: <PeopleAltIcon />, path: '/field-contracts' },
      ]
    },
    {
      category: '시설물',
      categoryId: 'facility',
      items: [
        { text: '시설물 리스트', icon: <ListAltIcon />, path: '/facility-list', id: 'facility_list' },
        { text: '시설물 등록', icon: <EngineeringIcon />, path: '/facility-register', id: 'facility_register' },
        { text: 'A/S 관리', icon: <BuildIcon />, path: '/service-request/list', id: 'facility_service' },
        { text: '시설물 이동/폐기 등록', icon: <SwapHorizIcon />, path: '/facility-transfer', id: 'facility_transfer' },
        { text: '시설물 이력관리', icon: <DashboardIcon />, path: '/facility-history', id: 'facility_history' },
      ]
    },
    {
      category: '커뮤니티',
      categoryId: 'community',
      items: [
        { text: '게시판', icon: <ForumIcon />, path: '/service-preparing', id: 'board' },
        { text: '공지사항', icon: <AnnouncementIcon />, path: '/service-preparing', id: 'notice' },
        { text: '자료실', icon: <FolderOpenIcon />, path: '/service-preparing', id: 'file' },
        { text: '채팅', icon: <ChatIcon />, path: '/service-preparing', id: 'chat' },
      ]
    },
    {
      category: '관리',
      categoryId: 'admin',
      items: [
        { text: '위수탁 업체 관리', icon: <BusinessIcon />, path: '/companies', id: 'company' },
        { text: '사용자 관리', icon: <GroupIcon />, path: '/users', id: 'user' },
        { text: '설정', icon: <SettingsIcon />, path: '/settings', id: 'settings' },
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
          {menuItems.map((category) => {
            // 권한에 따라 카테고리 내 표시할 항목 필터링
            const filteredItems = category.items.filter(item => 
              checkMenuPermission(category.categoryId, item.id)
            );
            
            // 표시할 항목이 없으면 카테고리도 표시하지 않음
            if (filteredItems.length === 0) {
              return null;
            }
            
            return (
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
                  {filteredItems.map((item) => (
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
            );
          })}
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