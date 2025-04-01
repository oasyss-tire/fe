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
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const UserMyPage = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth(); // AuthContext에서 현재 로그인한 사용자 정보 가져오기

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
          내 정보
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

      {/* 전체 컨테이너 */}
      <Paper sx={{ 
        p: 3,
        borderRadius: 2,
        boxShadow: 'none',
        border: '1px solid #EEEEEE'
      }}>
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
      </Paper>
    </Box>
  );
};

export default UserMyPage;
