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
  DialogContent,
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
    <Box sx={{ p: 2, maxWidth: '430px', margin: '0 auto' }}>
      {/* 헤더 */}
      <Box sx={{ 
        position: 'sticky',   
        top: 0, 
        bgcolor: '#FFFFFF',
        borderBottom: '1px solid #eee',
        zIndex: 1,
        p: 2,
        textAlign: 'center'
      }}>
        <Typography variant="h6">사용자 상세</Typography>
      </Box>

      <Paper sx={{ p: 2, mt: 6 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {/* ID - 수정 불가능 표시 */}
            <TextField
              label="ID"
              value={user.username}
              fullWidth
              disabled
              InputProps={{
                sx: { bgcolor: '#f5f5f5' }
              }}
            />
            
            {/* 이름 */}
            <TextField
              label="이름"
              value={user.fullName}
              onChange={(e) => setUser({ ...user, fullName: e.target.value })}
              fullWidth
              size="small"
              required
            />
            
            {/* 업체 */}
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
            
            {/* 권한 */}
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
            
            {/* 이메일 */}
            <TextField
              label="이메일"
              type="email"
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
              fullWidth
              size="small"
            />
            
            {/* 연락처 */}
            <TextField
              label="연락처"
              value={user.phoneNumber}
              onChange={(e) => setUser({ ...user, phoneNumber: e.target.value })}
              fullWidth
              size="small"
            />

            {/* 사용여부 */}
            <FormControlLabel
              control={
                <Switch
                  checked={user.active}
                  onChange={(e) => setUser({ ...user, active: e.target.checked })}
                  color={user.active ? "success" : "default"}
                />
              }
              label={user.active ? "사용" : "미사용"}
              sx={{ mt: 1 }}
            />

            {/* 비밀번호 변경 필드 추가 */}
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" sx={{ mb: 1 }}>비밀번호 변경</Typography>
            
            <TextField
              fullWidth
              type="password"
              label="현재 비밀번호"
              value={passwordData.currentPassword}
              onChange={(e) => {
                setPasswordData({...passwordData, currentPassword: e.target.value});
                setPasswordErrors({...passwordErrors, currentPassword: ''});
              }}
              error={Boolean(passwordErrors.currentPassword)}
              helperText={passwordErrors.currentPassword}
              margin="normal"
            />
            
            <TextField
              fullWidth
              type="password"
              label="새 비밀번호"
              value={passwordData.newPassword}
              onChange={(e) => {
                const value = e.target.value;
                let errorMessage = '';

                if (value.length > 0 && value.length < 4) {
                  errorMessage = '새 비밀번호는 4자 이상이어야 합니다.';
                } else if (/\s/.test(value)) {
                  errorMessage = '새 비밀번호에는 공백이 포함될 수 없습니다.';
                }

                setPasswordData({ ...passwordData, newPassword: value });
                setPasswordErrors({ ...passwordErrors, newPassword: errorMessage });
              }}
              error={Boolean(passwordErrors.newPassword)}
              helperText={passwordErrors.newPassword}
              margin="normal"
            />

            <TextField
              fullWidth
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
              margin="normal"
            />


            {/* 버튼 그룹 */}
            <Box sx={{ 
              display: 'flex', 
              gap: 1, 
              justifyContent: 'center',
              mt: 2 
            }}>
              <Button 
                variant="contained" 
                type="submit"
                sx={{ 
                  minWidth: '100px',
                  bgcolor: '#1C243A',
                  '&:hover': { bgcolor: '#3d63b8' }
                }}
              >
                저장
              </Button>
              <Button 
                variant="outlined"
                onClick={() => navigate('/users')}
                sx={{ 
                  minWidth: '100px',
                  color: '#1C243A',
                  borderColor: '#1C243A',
                  '&:hover': {
                    borderColor: '#3d63b8',
                    color: '#3d63b8'
                  }
                }}
              >
                목록
              </Button>
              {/* {isAdmin && (
                <Button 
                  variant="outlined"
                  onClick={handleDelete}
                  sx={{ 
                    minWidth: '100px',
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
              )} */}
            </Box>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
};

export default UserManagement; 