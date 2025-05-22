import React, { useRef } from 'react';
import axios from 'axios';
import { Box, Button, Typography, CircularProgress, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

/**
 * NICE 본인인증 컴포넌트 (기본 버전)
 */
const NiceAuth = () => {
  const [loading, setLoading] = React.useState(false);
  const formRef = useRef(null);

  // 본인인증 시작
  const handleVerification = async () => {
    try {
      setLoading(true);
      
      // 백엔드 API 호출
      const token = sessionStorage.getItem('token');
      const response = await axios.post('http://localhost:8080/api/nice/certification/window', {
        returnUrl: 'http://localhost:3001/nice-callback',
        methodType: 'GET'
      }, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!response.data.success) {
        throw new Error(response.data.message || '본인인증 준비 실패');
      }

      // 응답에서 필요한 데이터 추출
      const tokenVersionId = response.data.tokenVersionId || '';
      const encData = response.data.encData || '';
      const integrityValue = response.data.integrityValue || '';

      // 폼 데이터 설정
      if (formRef.current) {
        formRef.current.token_version_id.value = tokenVersionId;
        formRef.current.enc_data.value = encData;
        formRef.current.integrity_value.value = integrityValue;
        
        // 새 창 열기
        window.open('', 'niceWindow', 'width=500, height=800, top=100, left=100, fullscreen=no, menubar=no, status=no, toolbar=no, titlebar=yes, location=no, scrollbar=no');
        
        // 폼 제출
        formRef.current.submit();
      }
      
      // 로딩 상태 해제
      setLoading(false);
    } catch (error) {
      console.error('본인인증 오류:', error);
      alert('본인인증 준비 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  return (
    <Container>
      <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          본인인증
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 4 }} align="center">
          서비스 이용을 위해 본인인증이 필요합니다.
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <VerifyButton 
            variant="contained" 
            onClick={handleVerification}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : '본인인증 시작'}
          </VerifyButton>
        </Box>
        
        {/* NICE 표준창 호출을 위한 폼 */}
        <form 
          ref={formRef} 
          name="form" 
          id="form" 
          action="https://nice.checkplus.co.kr/CheckPlusSafeModel/service.cb" 
          method="post" 
          target="niceWindow" 
          style={{ display: 'none' }}
        >
          <input type="hidden" id="m" name="m" value="service" />
          <input type="hidden" id="token_version_id" name="token_version_id" value="" />
          <input type="hidden" id="enc_data" name="enc_data" value="" />
          <input type="hidden" id="integrity_value" name="integrity_value" value="" />
        </form>
      </Paper>
    </Container>
  );
};

// 스타일드 컴포넌트
const Container = styled(Box)(({ theme }) => ({
  maxWidth: 500,
  margin: '40px auto',
  padding: theme.spacing(2)
}));

const VerifyButton = styled(Button)(({ theme }) => ({
  padding: '12px 32px',
  fontSize: '1rem',
  fontWeight: 500
}));

export default NiceAuth; 