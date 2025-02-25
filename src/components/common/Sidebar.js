import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Box,
  Divider,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Snackbar,
  Alert,
  Link,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import EditIcon from '@mui/icons-material/Edit';
import DescriptionIcon from '@mui/icons-material/Description';



const Sidebar = () => {
  const [open, setOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });
  const [user, setUser] = useState(JSON.parse(sessionStorage.getItem('user')));
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [errorMessage, setErrorMessage] = useState({
    username: '',
    password: ''
  });
  const navigate = useNavigate();
  const [myPageDialog, setMyPageDialog] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUserInfo, setEditedUserInfo] = useState(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [isPasswordMode, setIsPasswordMode] = useState(false);

  // 사용자 권한 확인 (ADMIN, MANAGER, USER)
  const userRole = sessionStorage.getItem('role')?.toUpperCase();
  const isAdminOrManager = userRole === 'ADMIN' || userRole === 'MANAGER';

  // 메뉴 아이템 필터링
  const menuItems = [
    // 메인 메뉴
    {
      category: '메인',
      items: [
        { text: '홈', path: '/' }
      ]
    },
    // 점검 관련 메뉴
    {
      category: '계약서 관리',
      items: [
        { text: '위수탁 계약', path: '/contracts' },
        { text: '임대 계약', path: '/service-preparing' },
        { text: '근로 계약', path: '/service-preparing' },
      ]
    },
    {
      category: '시설물 관리',
      items: [
        { text: '시설물 신규 등록', path: '/facility/create'},
        { text: '시설물 재고 조회', path: '/facility' },
        { text: '시설물 실사', path: '/service-preparing'}
      ]
    },
    // 게시판 메뉴
    {
      category: '게시판',
      items: [
        { text: '공지사항', path: '/notices' },
        { text: 'AS / 문의', path: '/inquiries' },
        { text: '고객센터', path: '/customer' },
        { text: '비회원 문의', path: '/guest-inquiries' },
      ]
    },
    {
      category: '대시보드',
      items: [
        { text: '계약 대시보드', path: '/contract-dashboard' },
        { text: '시설물 대시보드', path: '/facility-dashboard' }
      ]
    },
    // {
    //   category: '데모',
    //   items: [
    //     { text: '계약 목록', path: '/demo/contract-list' },
    //     { text: '계약서 서명', path: '/demo/sign-contract' },
    //     { text: '계약서 업로드', path: '/demo/upload-contract' }
    //   ]
    // },
    // 관리자 메뉴 (ADMIN과 MANAGER만 볼 수 있음)
    ...(isAdminOrManager ? [{
      category: '관리자 메뉴',
      items: [
        // { text: '일정 관리', path: '/schedule-management' },
        { text: '업체 관리', path: '/companies' },
        { text: '사용자 관리', path: '/users' },
        { text: '알림톡 관리', path: '/kakao-alert-list' },
        { text: '비회원 문의관리', path: '/admin/inquiries' }
        // { text: '설정', path: '/settings/dashboard' }
      ]
    }] : []),

  ];

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setOpen(open);
  };

  const handleNavigate = (path) => {
    navigate(path);
    setOpen(false);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: loginData.username,
          password: loginData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('userId', data.user.userId);
        sessionStorage.setItem('role', data.user.role);
        sessionStorage.setItem('username', data.user.username);
        sessionStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setLoginDialogOpen(false);
        setErrorMessage({ username: '', password: '' });

        setSnackbar({
          open: true,
          message: '로그인되었습니다.',
          severity: 'success'
        });
      } else {
        if (data.message === "존재하지 않는 사용자입니다.") {
          setErrorMessage({
            username: data.message,
            password: ''
          });
        } else if (data.message === "비밀번호가 틀렸습니다.") {
          setErrorMessage({
            username: '',
            password: data.message
          });
        }
      }
    } catch (error) {
      console.error('로그인 실패:', error);
      setSnackbar({
        open: true,
        message: '로그인 중 오류가 발생했습니다.',
        severity: 'error'
      });
    }
  };

  const handleLogout = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (token) {
        await fetch('http://localhost:8080/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }


      sessionStorage.clear();  // 세션 스토리지도 함께 정리
      
      // 상태 초기화
      setUser(null);
      
      // 로그인 폼 초기화 추가
      resetLoginForm();
      
      // 로그아웃 성공 메시지
      setSnackbar({
        open: true,
        message: '로그아웃되었습니다.',
        severity: 'success'
      });

      // 홈으로 이동 추가
      navigate('/');
      
    } catch (error) {
      console.error('로그아웃 실패:', error);
      // 에러가 발생해도 로컬 데이터는 정리
      sessionStorage.clear();
      setUser(null);
      navigate('/');
    }
  };

  const handleMenuClick = (item) => {
    // 로그인 필요한 메뉴 체크
    if (item.requireAuth) {
      const token = sessionStorage.getItem('token');
      if (!token) {
        setSnackbar({
          open: true,
          message: '로그인 후 이용해 주세요.',
          severity: 'warning'
        });
        setOpen(false);  // 사이드바 닫기
        return;
      }
    }

    // 기존 로직
    if (item.text === '로그인/로그아웃') {
      if (user) {
        handleLogout();
      } else {
        setLoginDialogOpen(true);
      }
    } else {
      handleNavigate(item.path);
    }
    setOpen(false);
  };

  // 로그인 입력 필드 초기화 함수
  const resetLoginForm = () => {
    setLoginData({
      username: '',
      password: ''
    });
  };

  // 로그인 모달 닫기 핸들러
  const handleCloseLoginDialog = () => {
    setLoginDialogOpen(false);
    resetLoginForm();  // 모달 닫을 때 입력 필드 초기화
  };

  // 테스트용 API 호출 함수 추가
//   const testAuthenticatedRequest = async () => {
//     const token = sessionStorage.getItem('token');
//     try {
//       const response = await fetch('http://localhost:8080/api/users', {
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       });
//       const data = await response.json();
//       console.log('Protected API Response:', data);
//     } catch (error) {
//       console.error('API Request Failed:', error);
//     }
//   };

  // useEffect 추가
  useEffect(() => {
    const handleOpenLoginDialog = () => {
      setLoginDialogOpen(true);
    };

    window.addEventListener('openLoginDialog', handleOpenLoginDialog);

    return () => {
      window.removeEventListener('openLoginDialog', handleOpenLoginDialog);
    };
  }, []);

  // 사용자 정보 조회
  const fetchUserInfo = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUserInfo(data);
      }
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserInfo();
    }
  }, [user]);

  // 마이페이지 다이얼로그 열기
  const handleOpenMyPage = () => {
    setMyPageDialog(true);
    setOpen(false); // 사이드바 닫기
  };

  // 마이페이지 다이얼로그 닫기
  const handleCloseMyPage = () => {
    setMyPageDialog(false);
  };

  // 수정 모드 시작
  const handleEditClick = () => {
    setEditedUserInfo({ ...userInfo });
    setIsEditing(true);
  };

  // 사용자 정보 업데이트
  const handleUpdateUser = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/users/${userInfo.userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // 기존 정보 유지하면서 수정할 필드만 업데이트
          ...userInfo,  // 기존 정보 모두 포함
          fullName: editedUserInfo.fullName,
          email: editedUserInfo.email,
          phoneNumber: editedUserInfo.phoneNumber,
          role: userInfo.role,  // 기존 role 유지
          active: userInfo.active,  // 기존 active 상태 유지
          username: userInfo.username,  // 기존 username 유지
          companyId: userInfo.companyId  // 기존 companyId 유지
        })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUserInfo(updatedUser);
        setIsEditing(false);
        // 로컬 스토리지의 user 정보도 업데이트
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
        setSnackbar({
          open: true,
          message: '정보가 수정되었습니다.',
          severity: 'success'
        });
      } else {
        throw new Error('정보 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('사용자 정보 수정 실패:', error);
      setSnackbar({
        open: true,
        message: '정보 수정에 실패했습니다.',
        severity: 'error'
      });
    }
  };

  // 비밀번호 변경
  const handlePasswordChange = async () => {
    // 비밀번호 유효성 검사 강화
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordErrors({ general: '모든 비밀번호 필드를 입력해주세요.' });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordErrors({ confirmPassword: '새 비밀번호가 일치하지 않습니다.' });
      return;
    }

    if (passwordData.newPassword.length < 4) {  // 최소 길이 제한
      setPasswordErrors({ newPassword: '비밀번호는 최소 4자 이상이어야 합니다.' });
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/users/${userInfo.userId}/password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (response.ok) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setPasswordErrors({});
        setIsPasswordMode(false);  // 비밀번호 변경 모드 종료
        setSnackbar({
          open: true,
          message: '비밀번호가 변경되었습니다.',
          severity: 'success'
        });
      } else {
        const error = await response.text();
        setPasswordErrors({ currentPassword: '현재 비밀번호가 일치하지 않습니다.' });
      }
    } catch (error) {
      console.error('비밀번호 변경 실패:', error);
      setSnackbar({
        open: true,
        message: '비밀번호 변경에 실패했습니다.',
        severity: 'error'
      });
    }
  };

  // 새로운 useEffect 추가
  useEffect(() => {
    // 브라우저 종료 시 로그아웃 처리
    const handleBeforeUnload = () => {
      sessionStorage.clear();
    };

    // 토큰 만료 체크 함수
    const checkTokenExpiration = async () => {
      const token = sessionStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch('http://localhost:8080/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) {
            // 토큰이 만료되었거나 유효하지 않은 경우
            handleLogout();
            setSnackbar({
              open: true,
              message: '로그인이 만료되었습니다. 다시 로그인해주세요.',
              severity: 'warning'
            });
          }
        } catch (error) {
          console.error('Token validation failed:', error);
          handleLogout();
        }
      }
    };


    
    // 토큰 만료 체크 인터벌 설정 (5분마다 체크)
    const tokenCheckInterval = setInterval(checkTokenExpiration, 5 * 60 * 1000);

    // 컴포넌트 언마운트 시 정리
    return () => {

      clearInterval(tokenCheckInterval);
    };
  }, []);

  return (
    <>
      <IconButton
        onClick={toggleDrawer(true)}
        sx={{
          position: 'fixed',
          top: '16px',
          left: '16px',
          zIndex: 1200,
          color: '#1C243A',
          '@media (min-width: 430px)': {
            left: 'calc((100% - 430px) / 2 + 16px)'
          }
        }}
      >
        <MenuIcon />
      </IconButton>

      <Drawer
        anchor="left"
        open={open}
        onClose={toggleDrawer(false)}
        PaperProps={{
          sx: {
            width: '80%',  // 모바일에서는 화면의 80%
            maxWidth: '320px',  // 최대 너비 제한
            '@media (min-width: 430px)': {
              left: 'calc((100% - 430px) / 2)',  // 모바일 컨테이너 내부에 위치
              borderRight: '1px solid rgba(0, 0, 0, 0.12)'
            }
          }
        }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ width: '100%' }} role="presentation">

          {/* 여기 */}
          {user ? (
            <Box
              sx={{
                p: 2,
                mt: 2,
                textAlign: 'center',
                borderBottom: '1px solid #e0e0e0',
              }}
            >
              {/* 사용자 아바타 */}
              <AccountCircleIcon color="action" sx={{ fontSize: 48, mb: 1 }} />
              
              {/* 사용자 이름 */}
              <Typography
                variant="h6"
                sx={{ color: '#2A2A2A', fontWeight: 600, mb: 1 }}
              >
                {user.fullName}
              </Typography>
              
              {/* 버튼 영역: 마이페이지와 로그아웃을 수평으로 배치 */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 1,
                }}
              >
                <Button
                  onClick={handleOpenMyPage}
                  sx={{
                    textTransform: 'none',
                    color: '#2A2A2A',
                    fontWeight: 500,
                    fontSize: '0.9rem',
                  }}
                  startIcon={<AccountCircleIcon color="action" />}
                >
                  마이페이지
                </Button>
                <Button
                  onClick={handleLogout}
                  sx={{
                    textTransform: 'none',
                    color: '#2A2A2A',
                    fontWeight: 500,
                    fontSize: '0.9rem',
                  }}
                  startIcon={<LogoutIcon color="action" />}
                >
                  로그아웃
                </Button>
              </Box>
            </Box>
          ) : (

            <Box
              sx={{
                p: 2,
                mt: 2,
                textAlign: 'center',
                borderBottom: '1px solid #e0e0e0',
              }}
            >
              <Typography variant="subtitle1" sx={{ color: '#2A2A2A', mb: 1 }}>
                사이트 이용을 위해 로그인 해주세요.
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  alignItems: 'center',
                }}
              >
                <TextField
                  label="아이디"
                  variant="outlined"
                  size="small"
                  value={loginData.username}
                  onChange={(e) =>
                    setLoginData({ ...loginData, username: e.target.value })
                  }
                  error={Boolean(errorMessage.username)}
                  helperText={errorMessage.username}
                  sx={{ width: '90%' }}
                />
                <TextField
                  label="비밀번호"
                  variant="outlined"
                  type="password"
                  size="small"
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData({ ...loginData, password: e.target.value })
                  }
                  error={Boolean(errorMessage.password)}
                  helperText={errorMessage.password}
                  sx={{ width: '90%' }}
                />
                <Button
                  variant="contained"
                  onClick={handleLogin}
                  sx={{ textTransform: 'none', mt: 1, width: '90%' }}
                >
                  로그인
                </Button>
              </Box>


              <Typography variant="body2" sx={{ mt: 1 }}>
                <Button
                  onClick={() => {
                    navigate('/tutorial-onboarding');
                    setOpen(false);  // 사이드바 닫기
                  }}
                  sx={{
                    textTransform: 'none',
                    color: '#1976d2',
                    fontSize: '0.875rem',
                    '&:hover': {
                      backgroundColor: 'transparent',
                      textDecoration: 'underline'
                    }
                  }}
                >
                  처음 오셨나요?
                </Button>
              </Typography>
            </Box>
          )}



          
          {menuItems.map((category, index) => (
            <React.Fragment key={index}>
              {/* 카테고리 제목 */}
              <Typography
                sx={{
                  px: 2,
                  py: 1,
                  fontSize: '0.75rem',
                  color: 'text.secondary',
                  bgcolor: 'rgba(0, 0, 0, 0.02)',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
                }}
              >
                {category.category}
              </Typography>
              
              {/* 카테고리 항목들 */}
              <List disablePadding>
                {category.items.map((item) => (
                  <ListItem
                    key={item.text}
                    button
                    onClick={() => handleMenuClick(item)}
                    sx={{
                      pl: 3,  // 들여쓰기
                      py: 1,  // 높이 줄임
                      '&:hover': {
                        bgcolor: 'rgba(75, 119, 216, 0.08)',
                      },
                      ...(item.requireAuth && !sessionStorage.getItem('token') && {
                        opacity: 0.6,
                        '&::after': {
                          content: '"*"',
                          color: 'warning.main',
                          ml: 1
                        }
                      })
                    }}
                  >
                    <ListItemText 
                      primary={item.text} 
                      sx={{ 
                        '& .MuiListItemText-primary': { 
                          fontSize: '0.9rem',
                          color: '#2A2A2A',
                          fontWeight: 500
                        }
                      }}
                    />
                  </ListItem>
                ))}
              </List>
              {index < menuItems.length - 1 && <Divider />}
            </React.Fragment>
          ))}

          
        </Box>
      </Drawer>

      <Dialog 
        open={loginDialogOpen} 
        onClose={handleCloseLoginDialog}
      >
        <DialogTitle>로그인</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="아이디"
            type="text"
            fullWidth
            value={loginData.username}
            onChange={(e) => {
              setLoginData({...loginData, username: e.target.value});
              setErrorMessage({...errorMessage, username: ''});
            }}
            error={Boolean(errorMessage.username)}
            helperText={errorMessage.username}
          />
          <TextField
            margin="dense"
            label="비밀번호"
            type="password"
            fullWidth
            value={loginData.password}
            onChange={(e) => {
              setLoginData({...loginData, password: e.target.value});
              setErrorMessage({...errorMessage, password: ''});
            }}
            error={Boolean(errorMessage.password)}
            helperText={errorMessage.password}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLoginDialog}>취소</Button>
          <Button onClick={handleLogin}>로그인</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ 
            width: '100%',
            boxShadow: 3,
            fontSize: '0.95rem'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* 마이페이지 다이얼로그 */}
      <Dialog 
        open={myPageDialog} 
        onClose={handleCloseMyPage}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            m: 2,  // 모바일에서 여백 추가
            width: 'calc(100% - 32px)',  // 전체 너비에서 여백 제외
            maxWidth: '400px',  // 최대 너비 제한
            borderRadius: 2  // 모서리 둥글게
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            p: 2,  // 패딩 축소
            fontSize: '1.1rem'  // 제목 크기 축소
          }}
        >
          내 정보
          {!isEditing && (
            <IconButton 
              onClick={handleEditClick}
              size="small"  // 아이콘 버튼 크기 축소
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          {userInfo && !isEditing ? (
            // 조회 모드
            <List>
              <ListItem>
                <ListItemText 
                  primary="이름" 
                  secondary={userInfo.fullName} 
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText 
                  primary="아이디" 
                  secondary={userInfo.username} 
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText 
                  primary="이메일" 
                  secondary={userInfo.email || '-'} 
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText 
                  primary="연락처" 
                  secondary={userInfo.phoneNumber || '-'} 
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText 
                  primary="소속" 
                  secondary={userInfo.companyName || '-'} 
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText 
                  primary="권한" 
                  secondary={
                    userInfo.role === 'ADMIN' ? '관리자' :
                    userInfo.role === 'MANAGER' ? '매니저' : '일반사용자'
                  } 
                />
              </ListItem>
            </List>
          ) : (
            // 수정 모드
            <Box sx={{ mt: 2 }}>
              {!isPasswordMode ? (
                // 기본 정보 수정 모드
                <>
                  <TextField
                    fullWidth
                    label="이름"
                    value={editedUserInfo?.fullName || ''}
                    onChange={(e) => setEditedUserInfo({...editedUserInfo, fullName: e.target.value})}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="이메일"
                    value={editedUserInfo?.email || ''}
                    onChange={(e) => setEditedUserInfo({...editedUserInfo, email: e.target.value})}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="연락처"
                    value={editedUserInfo?.phoneNumber || ''}
                    onChange={(e) => setEditedUserInfo({...editedUserInfo, phoneNumber: e.target.value})}
                    margin="normal"
                  />
                </>
              ) : (
                // 비밀번호 변경 모드
                <>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>비밀번호 변경</Typography>
                  <TextField
                    fullWidth
                    type="password"
                    label="현재 비밀번호"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    error={Boolean(passwordErrors.currentPassword)}
                    helperText={passwordErrors.currentPassword}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    type="password"
                    label="새 비밀번호"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    error={Boolean(passwordErrors.newPassword)}
                    helperText={passwordErrors.newPassword}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    type="password"
                    label="새 비밀번호 확인"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    error={Boolean(passwordErrors.confirmPassword)}
                    helperText={passwordErrors.confirmPassword}
                    margin="normal"
                  />
                  {passwordErrors.general && (
                    <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                      {passwordErrors.general}
                    </Typography>
                  )}
                </>
              )}
            </Box>
          )}
        </DialogContent>
        {isEditing && (
          <DialogActions sx={{ p: 1.5, gap: 1 }}>  {/* 버튼 간격 조정 */}
            <Button 
              onClick={() => {
                setIsEditing(false);
                setIsPasswordMode(false);
                setPasswordData({
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: ''
                });
                setPasswordErrors({});
              }}
              size="small"  // 버튼 크기 축소
              sx={{ minWidth: '60px' }}  // 최소 너비 설정
            >
              취소
            </Button>
            {!isPasswordMode ? (
              <>
                <Button 
                  onClick={() => setIsPasswordMode(true)} 
                  color="primary"
                  size="small"
                  sx={{ minWidth: '100px' }}
                >
                  비밀번호 변경
                </Button>
                <Button 
                  onClick={handleUpdateUser} 
                  variant="contained"
                  size="small"
                  sx={{ 
                    minWidth: '80px',
                    bgcolor: '#1C243A',
                    '&:hover': { bgcolor: '#3d63b8' }
                  }}
                >
                  정보 수정
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={() => setIsPasswordMode(false)} 
                  color="primary"
                  size="small"
                  sx={{ minWidth: '60px' }}
                >
                  돌아가기
                </Button>
                <Button 
                  onClick={handlePasswordChange} 
                  variant="contained"
                  size="small"
                  sx={{ 
                    minWidth: '100px',
                    bgcolor: '#1C243A',
                    '&:hover': { bgcolor: '#3d63b8' }
                  }}
                >
                  비밀번호 변경
                </Button>
              </>
            )}
          </DialogActions>
        )}
      </Dialog>
    </>
  );
};

export default Sidebar; 