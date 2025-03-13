import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  FormControlLabel,
  Switch,
  Stack,
  Divider
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';

const UserManagement = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState({
    id: '',
    username: '',
    fullName: '',
    role: 'USER',
    email: '',
    phoneNumber: '',
    companyName: '',
    active: true
  });
  const [companies, setCompanies] = useState([]);
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

  // ADMIN 권한 체크
  const isAdmin = sessionStorage.getItem('role')?.toUpperCase() === 'ADMIN';

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };

    const fetchCompanies = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/companies', {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setCompanies(data);
        }
      } catch (error) {
        console.error('Failed to fetch companies:', error);
      }
    };

    if (userId) {
      fetchUserData();
    }

    fetchCompanies();
  }, [userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // 비밀번호 변경이 있는 경우
      if (passwordData.newPassword) {
        // 새 비밀번호 확인 검증
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          setPasswordErrors(prev => ({...prev, confirmPassword: '새 비밀번호가 일치하지 않습니다'}));
          return;
        }

        // 현재 비밀번호 검증
        if (!passwordData.currentPassword) {
          setPasswordErrors(prev => ({...prev, currentPassword: '현재 비밀번호를 입력해주세요'}));
          return;
        }

        // 비밀번호 변경 API 호출
        const passwordResponse = await fetch(`http://localhost:8080/api/users/${userId}/password`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
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
          return;
        }
      }

      // 기존의 사용자 정보 업데이트 로직
      const selectedCompany = companies.find(c => c.companyName === user.companyName);
      
      const updateData = {
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        companyId: selectedCompany ? selectedCompany.companyId : null,
        active: user.active
      };

      const response = await fetch(`http://localhost:8080/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        alert('사용자 정보가 수정되었습니다.');
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
      } else {
        alert('사용자 정보 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('사용자 정보 수정 중 오류가 발생했습니다.');
    }
  };

  // 사용자 삭제 핸들러
  const handleDelete = async () => {
    if (!isAdmin) {
      alert('관리자만 삭제할 수 있습니다.');
      return;
    }

    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        const response = await fetch(`http://localhost:8080/api/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          alert('사용자가 성공적으로 삭제되었습니다.');
          navigate('/users'); // 목록으로 이동
        } else {
          throw new Error('삭제 실패');
        }
      } catch (error) {
        console.error('Failed to delete user:', error);
        alert('사용자 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#F8F8FE', minHeight: '100vh' }}>
      {/* 상단 헤더 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#3A3A3A' }}>
          사용자 상세
        </Typography>
      </Box>

      {/* 전체 컨테이너 */}
      <Paper sx={{ 
        p: 3,
        borderRadius: 2,
        boxShadow: 'none',
        border: '1px solid #EEEEEE'
      }}>
        {/* 기본 정보 섹션 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#3A3A3A', mb: 2 }}>
            기본 정보
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="ID"
              value={user.username}
              fullWidth
              disabled
              size="small"
              InputProps={{
                sx: { bgcolor: '#f5f5f5' }
              }}
            />
            
            <TextField
              label="이름"
              value={user.fullName}
              onChange={(e) => setUser({ ...user, fullName: e.target.value })}
              fullWidth
              size="small"
              required
            />
            
            <FormControl fullWidth size="small">
              <InputLabel>업체</InputLabel>
              <Select
                value={user.companyName || ''}
                onChange={(e) => setUser({ ...user, companyName: e.target.value })}
                label="업체"
              >
                {companies.map((company) => (
                  <MenuItem key={company.companyId} value={company.companyName}>
                    {company.companyName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth size="small">
              <InputLabel>권한</InputLabel>
              <Select
                value={user.role || ''}
                onChange={(e) => setUser({ ...user, role: e.target.value })}
                label="권한"
              >
                <MenuItem value="ADMIN">관리자</MenuItem>
                <MenuItem value="MANAGER">업체담당자</MenuItem>
                <MenuItem value="USER">사용자</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="이메일"
              type="email"
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
              fullWidth
              size="small"
            />
            
            <TextField
              label="연락처"
              value={user.phoneNumber}
              onChange={(e) => setUser({ ...user, phoneNumber: e.target.value })}
              fullWidth
              size="small"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={user.active}
                  onChange={(e) => setUser({ ...user, active: e.target.checked })}
                  color={user.active ? "success" : "default"}
                />
              }
              label={user.active ? "사용" : "미사용"}
            />
          </Stack>
        </Box>

        {/* 비밀번호 변경 섹션 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#3A3A3A', mb: 2 }}>
            비밀번호 변경
          </Typography>
          <Stack spacing={2}>
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
            
            <TextField
              type="password"
              label="새 비밀번호"
              value={passwordData.newPassword}
              onChange={(e) => {
                const value = e.target.value;
                let errorMessage = '';
                if (value.length > 0 && value.length < 4) {
                  errorMessage = '새 비밀번호는 4자 이상이어야 합니다.';
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
          </Stack>
        </Box>

        {/* 버튼 그룹 */}
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          justifyContent: 'center',
          mt: 4
        }}>
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            sx={{ 
              minWidth: '120px',
              bgcolor: '#1976d2',
              '&:hover': { bgcolor: '#1565c0' }
            }}
          >
            저장
          </Button>
          <Button 
            variant="outlined"
            onClick={() => navigate('/users')}
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
            목록
          </Button>
          {isAdmin && (
            <Button 
              variant="outlined"
              onClick={handleDelete}
              sx={{ 
                minWidth: '120px',
                color: 'error.main',
                borderColor: 'error.main',
                '&:hover': {
                  backgroundColor: 'error.light',
                  borderColor: 'error.dark',
                  color: 'white'
                }
              }}
            >
              삭제
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default UserManagement; 