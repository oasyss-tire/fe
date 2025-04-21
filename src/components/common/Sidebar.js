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
  const [menusByCategory, setMenusByCategory] = useState([]);
  const [loading, setLoading] = useState(true);

  // 사용자 역할 가져오기
  const userRole = user?.role || 'USER';

  // 사용자의 접근 가능한 메뉴 목록 가져오기
  useEffect(() => {
    const fetchUserMenus = async () => {
      setLoading(true);
      try {
        const token = sessionStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch('http://localhost:8080/api/menu-permissions/user-menus', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('사용자 메뉴를 불러오는데 실패했습니다.');
        }

        const menus = await response.json();
        
        // 메뉴를 카테고리별로 그룹화
        const categories = {};
        
        menus.forEach(menu => {
          if (!categories[menu.category]) {
            categories[menu.category] = {
              category: menu.category,
              categoryId: menu.category.toLowerCase().replace(/\s+/g, '_'),
              items: []
            };
          }
          
          categories[menu.category].items.push({
            text: menu.name,
            icon: getMenuIcon(menu.icon),
            path: menu.path,
            id: menu.id
          });
        });
        
        // 카테고리 배열로 변환
        const categoriesArray = Object.values(categories);
        setMenusByCategory(categoriesArray);
        setLoading(false);
      } catch (error) {
        console.error('메뉴 정보를 불러오는데 실패했습니다:', error);
        // 오류 발생 시 기본 메뉴 사용
        setMenusByCategory(menuItems);
        setLoading(false);
      }
    };

    fetchUserMenus();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 메뉴 아이콘 매핑
  const getMenuIcon = (iconName) => {
    const icons = {
      'HomeIcon': <HomeIcon />,
      'DescriptionIcon': <DescriptionIcon />,
      'BusinessCenterIcon': <BusinessCenterIcon />,
      'EditIcon': <EditIcon />,
      'SendIcon': <SendIcon />,
      'ListAltIcon': <ListAltIcon />,
      'EngineeringIcon': <EngineeringIcon />,
      'BuildIcon': <BuildIcon />,
      'SwapHorizIcon': <SwapHorizIcon />,
      'DashboardIcon': <DashboardIcon />,
      'ForumIcon': <ForumIcon />,
      'AnnouncementIcon': <AnnouncementIcon />,
      'FolderOpenIcon': <FolderOpenIcon />,
      'ChatIcon': <ChatIcon />,
      'BusinessIcon': <BusinessIcon />,
      'GroupIcon': <GroupIcon />,
      'SettingsIcon': <SettingsIcon />,
      'PeopleAltIcon': <PeopleAltIcon />
    };
    
    return icons[iconName] || <DescriptionIcon />;
  };

  // 기존 메뉴 정의 (API 호출 실패 시 폴백으로 사용)
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
        { text: '게시판', icon: <ForumIcon />, path: '/service-preparing', id: '008001003_0001' },
        { text: '공지사항', icon: <AnnouncementIcon />, path: '/service-preparing', id: '008001003_0002' },
        { text: '자료실', icon: <FolderOpenIcon />, path: '/service-preparing', id: '008001003_0003' },
        { text: '채팅', icon: <ChatIcon />, path: '/service-preparing', id: '008001003_0004' },
      ]
    },
    {
      category: '관리',
      categoryId: 'admin',
      items: [
        { text: '위수탁 업체 관리', icon: <BusinessIcon />, path: '/companies', id: '008001004_0001' },
        { text: '사용자 관리', icon: <GroupIcon />, path: '/users', id: '008001004_0002' },
        { text: '설정', icon: <SettingsIcon />, path: '/settings', id: '008001004_0003' },
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
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                메뉴 불러오는 중...
              </Typography>
            </Box>
          ) : (
            menusByCategory.map((category) => {
              // 표시할 항목이 없으면 카테고리도 표시하지 않음
              if (category.items.length === 0) {
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
              );
            })
          )}
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