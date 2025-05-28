import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

/**
 * NICE 인증 브릿지 페이지 (모달창 전용)
 * 인증 완료 후 window.postMessage를 통해 부모창에 결과를 전달
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
      
      // 인증 결과 객체 생성
      const authResult = {
        type: 'NICE_AUTH_COMPLETE',
        timestamp: Date.now(),
        // 암호화된 데이터 저장 (개인정보 아님, 여전히 암호화됨)
        encryptedData: {
          enc_data: encData,
          token_version_id: tokenVersionId,
          integrity_value: integrityValue
        }
      };

      // 1. localStorage에도 저장 (기존 방식 호환성)
      localStorage.setItem('nice_auth_result', JSON.stringify(authResult));
      
      // 2. 부모 창으로 postMessage 전송 (새로운 방식)
      if (window.opener && !window.opener.closed) {
        
        try {
          // 메시지 전송
          window.opener.postMessage(authResult, '*');
          
          // 성공 메시지 표시 후 창 닫기
          setTimeout(() => {
            window.close();
          }, 2000);
          
        } catch (error) {
          console.error('❌ postMessage 전송 실패:', error);
          // postMessage 실패 시 localStorage 방식으로 폴백
        }
      } else {
        console.warn('⚠️ window.opener를 찾을 수 없음');
        // opener가 없으면 localStorage에만 의존
        setTimeout(() => {
          window.close();
        }, 2000);
      }
    } else {
      console.error('❌ 필수 파라미터가 누락되었습니다.');
      // 에러 시 부모 창에 에러 메시지 전송
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage({
            type: 'NICE_AUTH_ERROR',
            message: '필수 파라미터가 누락되었습니다.'
          }, '*');
        } catch (error) {
          console.error('에러 메시지 전송 실패:', error);
        }
      }
      
      setTimeout(() => {
        window.close();
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