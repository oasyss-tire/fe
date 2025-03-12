import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography
} from '@mui/material';

const PasswordModal = ({ open, onClose, onSubmit }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!password.trim()) {
      setError('비밀번호를 입력해주세요.');
      return;
    }
    onSubmit(password);
    setPassword('');
    setError('');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>본인 인증</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
            계약서를 열람하기 위해 본인 확인이 필요합니다.
          </Typography>
          <TextField
            label="휴대폰 번호 뒤 4자리"
            value={password}
            onChange={(e) => {
              setError('');
              setPassword(e.target.value);
            }}
            fullWidth
            type="password"
            error={!!error}
            helperText={error}
            autoFocus
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button onClick={handleSubmit} variant="contained">확인</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PasswordModal; 