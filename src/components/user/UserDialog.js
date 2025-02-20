import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar
} from '@mui/material';

const UserDialog = ({ open, onClose }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    passwordConfirm: '',
    fullName: '',
    phoneNumber: '',
    email: '',
    companyId: '',
    role: 'MANAGER'
  });
  
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState('');
  const [isIdAvailable, setIsIdAvailable] = useState(true);
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [usernameCheckResult, setUsernameCheckResult] = useState({
    show: false,
    message: '',
    severity: 'success'
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    // 회사 목록 불러오기
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/companies');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error('회사 목록 로딩 실패:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'username') {
      setIsIdAvailable(true);
      setUsernameCheckResult({ ...usernameCheckResult, show: false });
    }

    // 비밀번호 확인 체크
    if (name === 'password' || name === 'passwordConfirm') {
      const otherField = name === 'password' ? formData.passwordConfirm : formData.password;
      setPasswordMatch(value === otherField || value === '');
    }
  };

  const checkUsername = async () => {
    if (!formData.username) {
      setError('아이디를 입력해주세요.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/auth/check-username?username=${formData.username}`);
      const message = await response.text();
      
      if (response.ok) {
        setError('');
        setIsIdAvailable(true);
        setUsernameCheckResult({
          show: true,
          message: '사용 가능한 아이디입니다.',
          severity: 'success'
        });
      } else {
        setIsIdAvailable(false);
        setError(message);
        setUsernameCheckResult({
          show: true,
          message: '이미 사용중인 아이디입니다.',
          severity: 'error'
        });
      }
    } catch (error) {
      setError('서버 오류가 발생했습니다.');
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      passwordConfirm: '',
      fullName: '',
      phoneNumber: '',
      email: '',
      companyId: '',
      role: 'MANAGER'
    });
    setError('');
    setIsIdAvailable(true);
    setPasswordMatch(true);
    setUsernameCheckResult({
      show: false,
      message: '',
      severity: 'success'
    });
  };

  const handleClose = () => {
    resetForm();
    onClose(false);
  };

  const handleSubmit = async () => {
    // 유효성 검사
    if (!formData.username || !formData.password || !formData.fullName) {
      setError('필수 항목을 모두 입력해주세요.');
      return;
    }

    if (!passwordMatch || formData.password !== formData.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (!isIdAvailable) {
      setError('사용할 수 없는 아이디입니다.');
      return;
    }

    // API 호출 전 passwordConfirm 제거
    const submitData = { ...formData };
    delete submitData.passwordConfirm;

    try {
      const response = await fetch('http://localhost:8080/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: '회원가입이 성공적으로 완료되었습니다.',
          severity: 'success'
        });
        resetForm();
        onClose(true);
      } else {
        const errorData = await response.json();
        setError(errorData.message || '사용자 추가에 실패했습니다.');
      }
    } catch (error) {
      setError('서버 오류가 발생했습니다.');
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center' }}>사용자 추가</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Box sx={{ 
              display: 'flex', 
              gap: 1,
              alignItems: 'flex-start',
              mb: usernameCheckResult.show ? 0 : 2
            }}>
              <TextField
                required
                fullWidth
                label="아이디"
                name="username"
                value={formData.username}
                onChange={handleChange}
                error={!isIdAvailable}
              />
              <Button
                variant="outlined"
                size="small"
                sx={{ 
              
                  minWidth: '80px',
                  height: '55px'
                }}
                onClick={checkUsername}
              >
                중복확인
              </Button>
            </Box>
            
            {usernameCheckResult.show && (
              <Box
                sx={{
                  mt: 0.5,
                  mb: 2,
                  pl: 1.5,
                  fontSize: '0.75rem',
                  color: usernameCheckResult.severity === 'success' ? 'success.main' : 'error.main'
                }}
              >
                {usernameCheckResult.message}
              </Box>
            )}

            <TextField
              required
              fullWidth
              label="비밀번호"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={!passwordMatch}
              sx={{ mb: 2 }}
            />
            <TextField
              required
              fullWidth
              label="비밀번호 확인"
              name="passwordConfirm"
              type="password"
              value={formData.passwordConfirm}
              onChange={handleChange}
              error={!passwordMatch}
              helperText={!passwordMatch ? "비밀번호가 일치하지 않습니다" : ""}
              sx={{ mb: 2 }}
            />
            <TextField
              required
              fullWidth
              label="이름"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="전화번호"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="010-0000-0000"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="이메일"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>소속 업체</InputLabel>
              <Select
                name="companyId"
                value={formData.companyId}
                label="소속 업체"
                onChange={handleChange}
              >
                {companies.map((company) => (
                  <MenuItem key={company.companyId} value={company.companyId}>
                    {company.companyName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={handleClose} fullWidth variant="outlined">
            취소
          </Button>
          <Button 
            onClick={handleSubmit} 
            fullWidth 
            variant="contained"
            disabled={!isIdAvailable || !passwordMatch}
            sx={{
              bgcolor: '#1C243A',
              '&:hover': {
                bgcolor: '#3d63b8'
              }
            }}
          >
            추가
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
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
    </>
  );
};

export default UserDialog; 