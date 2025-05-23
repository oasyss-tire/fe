import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Box, Button, Typography, CircularProgress, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

/**
 * NICE 본인인증 컴포넌트 (localStorage polling 방식)
 */
const NiceAuth = () => {
  const [loading, setLoading] = React.useState(false);
  const [waitingForAuth, setWaitingForAuth] = React.useState(false);
  const formRef = useRef(null);
  const navigate = useNavigate();
  const pollingIntervalRef = useRef(null);

  // localStorage polling으로 인증 결과 확인
  useEffect(() => {
    if (waitingForAuth) {
      pollingIntervalRef.current = setInterval(() => {
        const authResult = localStorage.getItem('nice_auth_result');
        if (authResult) {
          try {
            const result = JSON.parse(authResult);
            
            // localStorage 정리
            localStorage.removeItem('nice_auth_result');
            
            // 폴링 중단
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            
            setWaitingForAuth(false);
            
            // 콜백 페이지로 이동 (URL은 브릿지에서 생성된 것 사용)
            if (result.callbackUrl) {
              navigate(result.callbackUrl);
            } else {
              // fallback: 직접 콜백 페이지로 이동
              navigate('/nice-callback');
            }
            
          } catch (error) {
            console.error('인증 결과 파싱 오류:', error);
            localStorage.removeItem('nice_auth_result');
          }
        }
      }, 1000); // 1초마다 체크
    }

    // 컴포넌트 언마운트 시 폴링 정리
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [waitingForAuth, navigate]);

  // 본인인증 시작
  const handleVerification = async () => {
    try {
      setLoading(true);
      
      // 이전 인증 결과 정리
      localStorage.removeItem('nice_auth_result');
      
      // 백엔드 API 호출
      const token = sessionStorage.getItem('token');
      const response = await axios.post('http://localhost:8080/api/nice/certification/window', {
        returnUrl: 'http://localhost:3001/nice-bridge', // 브릿지 페이지로 변경
        methodType: 'GET'
      }, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!response.data.success) {
        throw new Error(response.data.message || '본인인증 준비 실패');
      }

      // 응답에서 필요한 데이터 추출
      const requestNo = response.data.requestNo || '';
      const tokenVersionId = response.data.tokenVersionId || '';
      const encData = response.data.encData || '';
      const integrityValue = response.data.integrityValue || '';


      // requestNo를 sessionStorage에 저장 (콜백에서 사용)
      sessionStorage.setItem('nice_request_no', requestNo);

      // 폼 데이터 설정
      if (formRef.current) {
        formRef.current.token_version_id.value = tokenVersionId;
        formRef.current.enc_data.value = encData;
        formRef.current.integrity_value.value = integrityValue;
        
        // 새 창 열기
        window.open('', 'niceWindow', 'width=500, height=800, top=100, left=100, fullscreen=no, menubar=no, status=no, toolbar=no, titlebar=yes, location=no, scrollbar=no');
        
        // 폼 제출
        formRef.current.submit();
        
        // 인증 대기 상태로 변경
        setLoading(false);
        setWaitingForAuth(true);
      }
      
    } catch (error) {
      console.error('본인인증 오류:', error);
      alert('본인인증 준비 중 오류가 발생했습니다.');
      setLoading(false);
      setWaitingForAuth(false);
    }
  };

  // 인증 취소
  const handleCancel = () => {
    setWaitingForAuth(false);
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    localStorage.removeItem('nice_auth_result');
  };

  return (
    <Container>
      <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          본인인증
        </Typography>
        
        {!waitingForAuth ? (
          <>
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
          </>
        ) : (
          <>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mb: 3 }}>
              <CircularProgress />
              <Typography variant="h6" color="primary">
                본인인증 진행 중...
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                팝업창에서 본인인증을 완료해주세요.<br/>
                인증 완료 후 자동으로 결과 페이지로 이동합니다.
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button 
                variant="outlined" 
                onClick={handleCancel}
                color="error"
              >
                인증 취소
              </Button>
            </Box>
          </>
        )}
        
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