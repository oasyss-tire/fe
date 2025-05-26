import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

/**
 * 본인인증 불일치 페이지 컴포넌트
 * NICE 인증된 이름과 계약 참여자 이름이 다를 때 표시
 */
const AuthMismatchPage = ({ 
  participantName, 
  authName, 
  contractId, 
  participantId,
  pageType = 'signature' // 'signature' or 'correction'
}) => {
  
  const title = pageType === 'correction' ? '재서명' : '서명';
  const description = pageType === 'correction' 
    ? '계약서 서명은 본인만 가능합니다.' 
    : '계약서 서명은 본인만 가능합니다.';

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      backgroundColor: '#F8F8FE',
      p: 3
    }}>
      <Paper 
        elevation={0}
        sx={{ 
          p: 4, 
          borderRadius: 2, 
          textAlign: 'center',
          maxWidth: 500,
          border: '1px solid #FFCDD2',
          backgroundColor: '#FAFAFA'
        }}
      >
        {/* 오류 아이콘 */}
        <ErrorOutlineIcon 
          sx={{ 
            fontSize: 80, 
            color: '#d32f2f', 
            mb: 2 
          }} 
        />
        
        {/* 제목 */}
        <Typography variant="h5" sx={{ mb: 2, color: '#d32f2f', fontWeight: 600 }}>
          본인인증 불일치
        </Typography>
        
        {/* 설명 */}
        <Typography variant="body1" sx={{ mb: 3, color: '#505050' }}>
          계약 참여자와 본인인증 정보가 일치하지 않습니다.
        </Typography>
        
        {/* 상세 정보 박스 */}
        <Box sx={{ 
          bgcolor: '#ffffff', 
          p: 3, 
          borderRadius: 1, 
          border: '1px solid #e0e0e0',
          mb: 3,
          textAlign: 'left'
        }}>
          <Typography variant="body2" sx={{ mb: 2, fontWeight: 500 }}>
            확인된 정보:
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>• 계약서상 참여자:</strong> {participantName}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>• 본인인증한 사람:</strong> {authName}
          </Typography>
          <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem' }}>
            {description}
          </Typography>
        </Box>
        
        {/* 안내 문구 */}
        <Typography variant="body2" sx={{ mb: 3, color: '#666' }}>
          본인 확인이 필요하거나 문의사항이 있으시면<br />
          관리자에게 연락해주세요.
        </Typography>
      </Paper>
    </Box>
  );
};

export default AuthMismatchPage; 