import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  Stack,
  Divider,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Visibility as VisibilityIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon
} from '@mui/icons-material';

// 탭 패널 컴포넌트
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`mypage-tabpanel-${index}`}
      aria-labelledby={`mypage-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const UserMyPage = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth(); // AuthContext에서 현재 로그인한 사용자 정보 가져오기

  // 탭 상태 추가
  const [tabValue, setTabValue] = useState(0);
  const [viewMode, setViewMode] = useState('table');
  const [contracts, setContracts] = useState([]);
  const [isContractsLoading, setIsContractsLoading] = useState(false);
  const [contractsError, setContractsError] = useState(null);

  const [user, setUser] = useState({
    id: '',
    userId: '',
    userName: '',
    email: '',
    phoneNumber: '',
    role: '',
    companyId: '',
    companyName: '',
    storeCode: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // 탭 변경 핸들러
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    // 계약 탭으로 변경 시 계약 정보 로드
    if (newValue === 1 && contracts.length === 0) {
      fetchContracts();
    }
  };

  // 뷰 모드 변경 핸들러
  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  // 비밀번호 유효성 검사 함수
  const validatePassword = (password) => {
    // 8~20자 사이, 최소 하나의 소문자, 숫자, 특수문자(@#$%^&+=!) 포함
    const passwordRegex = /^(?=.*[a-z])(?=.*\d)(?=.*[@#$%^&+=!])[a-zA-Z\d@#$%^&+=!]{8,20}$/;
    return passwordRegex.test(password);
  };

  // 전화번호 포맷팅 함수
  const formatPhoneNumber = (value) => {
    if (!value) return '';
    
    // 숫자만 추출
    const numbers = value.replace(/[^\d]/g, '');
    
    // 숫자를 형식에 맞게 변환
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  // 전화번호 변경 핸들러
  const handlePhoneNumberChange = (e) => {
    const formattedNumber = formatPhoneNumber(e.target.value);
    setUser({ ...user, phoneNumber: formattedNumber });
  };

  // 사용자 정보 가져오기
  useEffect(() => {
    const fetchUserData = async () => {
      if (!authUser) return;

      setIsLoading(true);
      setError(null);
      
      try {
        // 인증 토큰 가져오기
        const token = sessionStorage.getItem('token');
        
        const response = await fetch(`http://localhost:8080/api/users/${authUser.id}`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        
        if (!response.ok) {
          throw new Error('내 정보를 불러오는데 실패했습니다.');
        }
        
        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.error('사용자 정보 조회 오류:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [authUser]);

  // 내 계약 정보 가져오기
  const fetchContracts = async () => {
    if (!authUser) return;

    setIsContractsLoading(true);
    setContractsError(null);
    
    try {
      // 인증 토큰 가져오기
      const token = sessionStorage.getItem('token');
      
      const response = await fetch('http://localhost:8080/api/mypage/contracts', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      if (!response.ok) {
        throw new Error('계약 정보를 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      setContracts(data);
    } catch (error) {
      console.error('계약 정보 조회 오류:', error);
      setContractsError(error.message);
    } finally {
      setIsContractsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // 인증 토큰 가져오기
      const token = sessionStorage.getItem('token');
      
      // 비밀번호 변경이 있는 경우
      if (passwordData.newPassword) {
        // 새 비밀번호 확인 검증
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          setPasswordErrors(prev => ({...prev, confirmPassword: '새 비밀번호가 일치하지 않습니다'}));
          setIsLoading(false);
          return;
        }

        // 현재 비밀번호 검증
        if (!passwordData.currentPassword) {
          setPasswordErrors(prev => ({...prev, currentPassword: '현재 비밀번호를 입력해주세요'}));
          setIsLoading(false);
          return;
        }

        // 비밀번호 변경 API 호출
        const passwordResponse = await fetch(`http://localhost:8080/api/users/${user.id}/password`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword
          })
        });

        if (!passwordResponse.ok) {
          const errorData = await passwordResponse.json();
          setPasswordErrors(prev => ({
            ...prev,
            currentPassword: errorData.message || '비밀번호 변경에 실패했습니다.'
          }));
          setIsLoading(false);
          return;
        }
      }

      // 사용자 정보 업데이트 로직
      const updateData = {
        userName: user.userName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        active: user.active,
        companyId: user.companyId ? parseInt(user.companyId) : null
      };
      
      const response = await fetch(`http://localhost:8080/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        setSuccess('내 정보가 성공적으로 수정되었습니다.');
        // 성공 시 비밀번호 필드 초기화
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setPasswordErrors({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        // 업데이트된 사용자 정보 다시 불러오기
        const updatedUserResponse = await fetch(`http://localhost:8080/api/users/${user.id}`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        if (updatedUserResponse.ok) {
          const updatedUserData = await updatedUserResponse.json();
          setUser(updatedUserData);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || '내 정보 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('사용자 정보 수정 오류:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 계약 상태에 따른 색상 반환 함수
  const getStatusColor = (status) => {
    const statusMap = {
      '승인대기': 'warning',
      '진행중': 'info',
      '완료': 'success',
      '반려': 'error',
      '만료': 'default'
    };
    
    // statusName에 포함된 문자열로 색상 결정
    for (const key in statusMap) {
      if (status && status.includes(key)) {
        return statusMap[key];
      }
    }
    
    return 'default';
  };

  // 계약 상세 페이지로 이동
  const handleContractClick = (contractId) => {
    navigate(`/contracts/${contractId}`);
  };

  // 서명된 계약 페이지로 이동 (LONG_TERM 토큰 사용)
  const navigateToSignedContract = (contract) => {
    // 참여자와 토큰 확인
    if (contract.participants && contract.participants.length > 0) {
      // 현재 사용자의 참여자 정보 찾기
      const userParticipant = contract.participants.find(
        p => p.userId === authUser?.id || p.userLoginId === authUser?.userId
      );
      
      // 사용자의 참여자 정보가 있고 토큰이 있는 경우
      if (userParticipant && userParticipant.tokens && userParticipant.tokens.length > 0) {
        // LONG_TERM 토큰 찾기
        const longTermToken = userParticipant.tokens.find(token => token.tokenType === 'LONG_TERM' && token.active);
        
        if (longTermToken) {
          // 토큰을 사용하여 서명된 계약 페이지로 이동
          window.open(`/contract-signed?token=${longTermToken.tokenValue}`, '_blank');
          return;
        }
      }
    }
    
    // 토큰이 없는 경우 일반 계약 상세 페이지로 이동
    navigate(`/contracts/${contract.id}`);
  };

  if (isLoading && !user.id) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#F8F8FE', minHeight: '100vh' }}>
      {/* 상단 헤더 */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3 
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#3A3A3A' }}>
          마이페이지
        </Typography>
      </Box>

      {/* 알림 메시지 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* 탭 메뉴 */}
      <Paper sx={{ 
        borderRadius: 2,
        boxShadow: 'none',
        border: '1px solid #EEEEEE'
      }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': {
              fontWeight: 500,
              fontSize: '1rem',
              py: 2
            },
            '& .Mui-selected': {
              color: '#1976d2',
              fontWeight: 600
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#1976d2'
            }
          }}
        >
          <Tab label="내 정보" id="mypage-tab-0" aria-controls="mypage-tabpanel-0" />
          <Tab label="내 계약" id="mypage-tab-1" aria-controls="mypage-tabpanel-1" />
        </Tabs>

        {/* 내 정보 탭 패널 */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            <form onSubmit={handleSubmit}>
              {/* 기본 정보 섹션 */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#3A3A3A', mb: 2 }}>
                  기본 정보
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Stack spacing={3}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <TextField
                      label="아이디"
                      value={user.userId || ''}
                      fullWidth
                      disabled
                      size="small"
                      InputProps={{
                        sx: { bgcolor: '#f5f5f5' }
                      }}
                    />
                    
                    <TextField
                      label="이름"
                      value={user.userName || ''}
                      onChange={(e) => setUser({ ...user, userName: e.target.value })}
                      fullWidth
                      size="small"
                      required
                    />
                  </Box>
                  
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <TextField
                      label="이메일"
                      type="email"
                      value={user.email || ''}
                      onChange={(e) => setUser({ ...user, email: e.target.value })}
                      fullWidth
                      size="small"
                    />
                    
                    <TextField
                      label="전화번호"
                      value={user.phoneNumber || ''}
                      onChange={handlePhoneNumberChange}
                      placeholder="010-0000-0000"
                      fullWidth
                      size="small"
                      inputProps={{
                        maxLength: 13 // 최대 길이 (010-0000-0000)
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <TextField
                      label="회사"
                      value={user.companyName ? `${user.companyName} (${user.storeCode})` : '회사 정보 없음'}
                      fullWidth
                      disabled
                      size="small"
                      InputProps={{
                        sx: { bgcolor: '#f5f5f5' }
                      }}
                    />

                    <TextField
                      label="권한"
                      value={user.role === 'ADMIN' ? '관리자' : 
                             user.role === 'MANAGER' ? '업체담당자' : 
                             user.role === 'USER' ? '사용자' : user.role || ''}
                      fullWidth
                      disabled
                      size="small"
                      InputProps={{
                        sx: { bgcolor: '#f5f5f5' }
                      }}
                    />
                  </Box>
                </Stack>
              </Box>

              {/* 비밀번호 변경 섹션 */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#3A3A3A', mb: 2 }}>
                  비밀번호 변경
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Stack spacing={3}>
                  <TextField
                    type="password"
                    label="현재 비밀번호"
                    value={passwordData.currentPassword}
                    onChange={(e) => {
                      setPasswordData({...passwordData, currentPassword: e.target.value});
                      setPasswordErrors({...passwordErrors, currentPassword: ''});
                    }}
                    error={Boolean(passwordErrors.currentPassword)}
                    helperText={passwordErrors.currentPassword}
                    fullWidth
                    size="small"
                  />
                  
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <TextField
                      type="password"
                      label="새 비밀번호"
                      value={passwordData.newPassword}
                      onChange={(e) => {
                        const value = e.target.value;
                        let errorMessage = '';
                        if (value.length > 0) {
                          if (!validatePassword(value)) {
                            errorMessage = '비밀번호는 8~20자 사이이며, 최소 하나의 소문자, 숫자, 특수문자(@#$%^&+=!)를 포함해야 합니다.';
                          }
                        }
                        setPasswordData({ ...passwordData, newPassword: value });
                        setPasswordErrors({ ...passwordErrors, newPassword: errorMessage });
                      }}
                      error={Boolean(passwordErrors.newPassword)}
                      helperText={passwordErrors.newPassword}
                      fullWidth
                      size="small"
                    />

                    <TextField
                      type="password"
                      label="새 비밀번호 확인"
                      value={passwordData.confirmPassword}
                      onChange={(e) => {
                        const value = e.target.value;
                        let errorMessage = '';
                        if (value !== passwordData.newPassword) {
                          errorMessage = '새 비밀번호가 일치하지 않습니다.';
                        }
                        setPasswordData({ ...passwordData, confirmPassword: value });
                        setPasswordErrors({ ...passwordErrors, confirmPassword: errorMessage });
                      }}
                      error={Boolean(passwordErrors.confirmPassword)}
                      helperText={passwordErrors.confirmPassword}
                      fullWidth
                      size="small"
                    />
                  </Box>
                </Stack>
              </Box>

              {/* 버튼 그룹 */}
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                justifyContent: 'center',
                mt: 4
              }}>
                <Button 
                  type="submit"
                  variant="contained" 
                  disabled={isLoading}
                  sx={{ 
                    minWidth: '120px',
                    bgcolor: '#1976d2',
                    '&:hover': { bgcolor: '#1565c0' }
                  }}
                >
                  {isLoading ? '저장 중...' : '저장'}
                </Button>
                
                <Button 
                  variant="outlined"
                  onClick={() => navigate('/')}
                  disabled={isLoading}
                  sx={{ 
                    minWidth: '120px',
                    color: '#666',
                    borderColor: '#666',
                    '&:hover': {
                      borderColor: '#1976d2',
                      color: '#1976d2'
                    }
                  }}
                >
                  돌아가기
                </Button>
              </Box>
            </form>
          </Box>
        </TabPanel>

        {/* 내 계약 탭 패널 */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3
            }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#3A3A3A' }}>
                내 계약 목록
              </Typography>
              
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                size="small"
                sx={{ 
                  height: 35,
                  '& .MuiToggleButton-root': {
                    px: 1.5,
                    color: '#666',
                    '&.Mui-selected': {
                      color: '#1976d2',
                      backgroundColor: 'rgba(25, 118, 210, 0.08)'
                    }
                  }
                }}
              >
                <ToggleButton value="table" aria-label="list view">
                  <ViewListIcon fontSize="small" />
                </ToggleButton>
                <ToggleButton value="card" aria-label="card view">
                  <ViewModuleIcon fontSize="small" />
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {isContractsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : contractsError ? (
              <Alert severity="error" sx={{ mb: 3 }}>
                {contractsError}
              </Alert>
            ) : (
              <>
                {/* 테이블 뷰 */}
                {viewMode === 'table' && (
                  <TableContainer sx={{ mb: 3 }}>
                    <Table sx={{ minWidth: 650 }} size="medium">
                      <TableHead>
                        <TableRow>
                          <TableCell>계약 번호</TableCell>
                          <TableCell>계약명</TableCell>
                          <TableCell>회사</TableCell>
                          <TableCell>계약일</TableCell>
                          <TableCell>상태</TableCell>
                          <TableCell align="center">진행률</TableCell>
                          <TableCell align="center">상세</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {contracts.length > 0 ? (
                          contracts.map((contract) => (
                            <TableRow key={contract.id} hover>
                              <TableCell>{contract.contractNumber}</TableCell>
                              <TableCell>{contract.title}</TableCell>
                              <TableCell>{contract.companyName}</TableCell>
                              <TableCell>
                                {new Date(contract.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={contract.statusName} 
                                  size="small"
                                  color={getStatusColor(contract.statusName)}
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                  <Box sx={{ width: '100%', mr: 1 }}>
                                    <LinearProgress 
                                      variant="determinate" 
                                      value={contract.progressRate} 
                                      sx={{
                                        height: 8,
                                        borderRadius: 5
                                      }}
                                    />
                                  </Box>
                                  <Box sx={{ minWidth: 35 }}>
                                    <Typography variant="body2" color="text.secondary">
                                      {`${Math.round(contract.progressRate)}%`}
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <Button 
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                  onClick={() => navigateToSignedContract(contract)}
                                  sx={{ 
                                    minWidth: '80px',
                                    fontSize: '0.75rem',
                                    py: 0.5
                                  }}
                                >
                                  상세보기
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                              참여한 계약이 없습니다.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {/* 카드 뷰 */}
                {viewMode === 'card' && (
                  <Grid container spacing={2}>
                    {contracts.length > 0 ? (
                      contracts.map((contract) => (
                        <Grid item xs={12} sm={6} md={4} key={contract.id}>
                          <Card 
                            sx={{ 
                              height: '100%',
                              cursor: 'pointer',
                              transition: 'transform 0.2s, box-shadow 0.2s',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                              }
                            }}
                            onClick={() => navigateToSignedContract(contract)}
                          >
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
                                  {contract.title}
                                </Typography>
                                <Chip 
                                  label={contract.statusName} 
                                  size="small"
                                  color={getStatusColor(contract.statusName)}
                                  variant="outlined"
                                />
                              </Box>
                              
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {contract.contractNumber}
                              </Typography>
                              
                              <Typography variant="body2" sx={{ mb: 2 }}>
                                {contract.companyName} | {new Date(contract.createdAt).toLocaleDateString()}
                              </Typography>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                                <Box sx={{ width: '100%', mr: 1 }}>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={contract.progressRate} 
                                    sx={{
                                      height: 8,
                                      borderRadius: 5
                                    }}
                                  />
                                </Box>
                                <Box sx={{ minWidth: 35 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    {`${Math.round(contract.progressRate)}%`}
                                  </Typography>
                                </Box>
                              </Box>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
                                <Typography variant="caption" color="text.secondary">
                                  문서: {contract.templates ? contract.templates.length : 0}개
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  참여자: {contract.participants ? contract.participants.length : 0}명
                                </Typography>
                              </Box>

                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                <Button 
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                  onClick={(e) => {
                                    e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
                                    navigateToSignedContract(contract);
                                  }}
                                  sx={{ 
                                    minWidth: '80px',
                                    fontSize: '0.75rem',
                                    py: 0.5
                                  }}
                                >
                                  상세보기
                                </Button>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))
                    ) : (
                      <Grid item xs={12}>
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                          <Typography variant="body1" color="text.secondary">
                            참여한 계약이 없습니다.
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                )}
              </>
            )}
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default UserMyPage;
