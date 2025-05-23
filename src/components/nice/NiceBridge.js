import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

/**
 * NICE 인증 브릿지 페이지 (모달창 전용)
 * 인증 완료 후 localStorage를 통해 부모창에 결과를 전달
 */
const NiceBridge = () => {
  const location = useLocation();

  useEffect(() => {
    // URL 파라미터 추출
    const searchParams = new URLSearchParams(location.search);
    const encData = searchParams.get('enc_data');
    const tokenVersionId = searchParams.get('token_version_id');
    const integrityValue = searchParams.get('integrity_value');



    if (encData && tokenVersionId && integrityValue) {
      // localStorage에는 완료 플래그만 저장 (개인정보 없음)
      const authResult = {
        type: 'NICE_AUTH_COMPLETE',
        timestamp: Date.now(),
        // URL 파라미터는 부모창으로 직접 전달
        callbackUrl: `/nice-callback?enc_data=${encodeURIComponent(encData)}&token_version_id=${encodeURIComponent(tokenVersionId)}&integrity_value=${encodeURIComponent(integrityValue)}`
      };

      localStorage.setItem('nice_auth_result', JSON.stringify(authResult));
      
      // 성공 메시지 표시 후 창 닫기
      setTimeout(() => {
        if (window.opener) {
          window.close();
        } else {
          // opener가 없으면 직접 콜백으로 이동
          window.location.href = `/nice-callback${location.search}`;
        }
      }, 2000);
    } else {
      console.error('필수 파라미터가 누락되었습니다.');
      // 에러 시 직접 콜백 페이지로 이동
      setTimeout(() => {
        window.location.href = `/nice-callback${location.search}`;
      }, 1000);
    }
  }, [location]);

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        width: '100vw',
        backgroundColor: '#f8f9fa',
        gap: 3,
        padding: 2
      }}
    >
      <CheckCircleIcon 
        sx={{ 
          fontSize: 80, 
          color: '#4caf50',
          animation: 'fadeIn 0.5s ease-in'
        }} 
      />
      
      <Typography 
        variant="h4" 
        sx={{ 
          color: '#2e7d32',
          fontWeight: 600,
          textAlign: 'center'
        }}
      >
        인증완료
      </Typography>
      
      <Typography 
        variant="body1" 
        sx={{ 
          color: '#666',
          textAlign: 'center',
          fontSize: '1.1rem'
        }}
      >
        본인인증이 성공적으로 완료되었습니다
      </Typography>
      
      <Typography 
        variant="body2" 
        sx={{ 
          color: '#999',
          textAlign: 'center',
          fontSize: '0.9rem'
        }}
      >
        잠시 후 창이 자동으로 닫힙니다...
      </Typography>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.8); }
            to { opacity: 1; transform: scale(1); }
          }
        `}
      </style>
    </Box>
  );
};

export default NiceBridge; 