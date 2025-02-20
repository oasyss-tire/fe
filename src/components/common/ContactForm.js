import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Slide,
  IconButton,
  Paper,
  Snackbar,
  Alert,
  InputAdornment
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MessageIcon from '@mui/icons-material/Message';

const ContactForm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    guestName: '',
    phoneNumber: '',
    password: '',
    content: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [errors, setErrors] = useState({});

  // 전화번호 형식 검증
  const validatePhone = (phone) => {
    const phoneRegex = /^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/;
    return phoneRegex.test(phone);
  };

  // 입력값 유효성 검사
  const validateForm = () => {
    const newErrors = {};
    if (!formData.guestName.trim()) {
      newErrors.guestName = '이름을 입력해주세요';
    }
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = '연락처를 입력해주세요';
    } else if (!validatePhone(formData.phoneNumber)) {
      newErrors.phoneNumber = '올바른 연락처 형식이 아닙니다';
    }
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요';
    } else if (formData.password.length < 4) {
      newErrors.password = '비밀번호는 4자 이상이어야 합니다';
    }
    if (!formData.content.trim()) {
      newErrors.content = '문의 내용을 입력해주세요';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 폼 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // 전화번호에서 하이픈 추가
    const formattedPhone = formData.phoneNumber.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');

    try {
      const response = await fetch('https://tirebank.jebee.net/api/guest-inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guestName: formData.guestName,
          phoneNumber: formattedPhone,
          password: formData.password,
          content: formData.content
        })
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: '문의가 등록되었습니다. 답변은 입력하신 연락처로 안내드립니다.',
          severity: 'success'
        });
        // 폼 초기화
        setFormData({
          guestName: '',
          phoneNumber: '',
          password: '',
          content: ''
        });
        setIsOpen(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || '문의 등록에 실패했습니다.');
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: 'error'
      });
    }
  };

  return (
    <>
      <IconButton
        onClick={() => setIsOpen(true)}
        sx={{
          position: 'fixed',
          bottom: { xs: 16, sm: 20 },
          right: { xs: 16, sm: 20 },
          bgcolor: '#343959',
          color: 'white',
          '&:hover': { bgcolor: '#3d63b8' },
          boxShadow: 3,
          zIndex: 1000
        }}
      >
        <MessageIcon />
      </IconButton>

      <Slide direction="up" in={isOpen} mountOnEnter unmountOnExit>
        <Paper
          elevation={4}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            width: '100%',
            maxWidth: '100%',
            height: '60vh',
            overflowY: 'auto',
            borderRadius: '20px 20px 0 0',
            zIndex: 1001,
            boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.1)',
            '@media (min-width: 431px)': {
              left: '50%',
              transform: 'translateX(-50%)',
              width: '430px'
            }
          }}
        >
          <Box sx={{ 
            p: 2.5,
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box 
              sx={{ 
                width: '40px',
                height: '4px',
                bgcolor: '#e0e0e0',
                borderRadius: '2px',
                margin: '-8px auto 16px',
              }} 
            />

            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 2
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  flex: 1, 
                  fontSize: '1.1rem',
                  fontWeight: 500,
                  color: '#1C243A'
                }}
              >
                문의하기
              </Typography>
              <IconButton 
                onClick={() => setIsOpen(false)} 
                size="small"
                sx={{ mr: -1 }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            <Box 
              component="form" 
              onSubmit={handleSubmit} 
              sx={{ 
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}
            >
              <TextField
                fullWidth
                placeholder="이름"
                value={formData.guestName}
                onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                error={!!errors.guestName}
                helperText={errors.guestName}
                size="small"
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#f8f9fa'
                  }
                }}
              />
              
              <TextField
                fullWidth
                placeholder="연락처 (예: 010-1234-5678)"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                error={!!errors.phoneNumber}
                helperText={errors.phoneNumber}
                size="small"
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#f8f9fa'
                  }
                }}
              />

              <TextField
                fullWidth
                placeholder="비밀번호 (4자리 이상)"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={!!errors.password}
                helperText={errors.password}
                size="small"
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#f8f9fa'
                  }
                }}
              />
              
              <TextField
                fullWidth
                placeholder="문의내용을 입력해주세요"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                error={!!errors.content}
                helperText={errors.content}
                multiline
                rows={3}
                required
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#f8f9fa',
                    height: '100%'
                  }
                }}
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                sx={{
                  bgcolor: '#343959',
                  '&:hover': { bgcolor: '#3d63b8' },
                  borderRadius: '10px',
                  py: 1.5,
                  mt: 'auto'
                }}
              >
                문의하기
              </Button>
            </Box>
          </Box>
        </Paper>
      </Slide>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ContactForm; 