import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
} from '@mui/material';
import { Construction as ConstructionIcon } from '@mui/icons-material';

const PermissionManagement = () => {
  return (
    <Box sx={{ p: 3, backgroundColor: '#F8F8FE', minHeight: '100vh' }}>
      {/* 상단 헤더 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#3A3A3A' }}>
          권한 관리
        </Typography>
      </Box>

      {/* 준비 중 메시지 */}
      <Paper sx={{ 
        p: 3, 
        borderRadius: 2,
        boxShadow: 'none',
        border: '1px solid #EEEEEE',
        bgcolor: '#fff'
      }}>
        <Stack 
          spacing={2} 
          alignItems="center" 
          justifyContent="center" 
          sx={{ py: 8 }}
        >
          <ConstructionIcon sx={{ fontSize: 60, color: '#1976d2' }} />
          <Typography variant="h6" sx={{ color: '#1976d2' }}>
            서비스 준비 중입니다
          </Typography>
          <Typography variant="body2" sx={{ color: '#666', textAlign: 'center' }}>
            더 나은 서비스를 제공하기 위해 준비 중입니다.<br />
            빠른 시일 내에 선보이도록 하겠습니다.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
};

export default PermissionManagement; 