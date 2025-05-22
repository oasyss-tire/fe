import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Box, Typography, CircularProgress, Paper, Button } from '@mui/material';
import { styled } from '@mui/material/styles';

/**
 * NICE 본인인증 콜백 처리 컴포넌트
 * NICE 인증 완료 후 리다이렉트되는 페이지입니다.
 * URL 파라미터로 전달된 인증 결과를 처리합니다.
 */
const NiceCallback = () => {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // URL 쿼리 파라미터 파싱
    const searchParams = new URLSearchParams(location.search);
    const encData = searchParams.get('enc_data');
    const tokenVersionId = searchParams.get('token_version_id');
    const integrityValue = searchParams.get('integrity_value');
    const requestNo = searchParams.get('request_no');
    
    // 전체 URL 출력 (디버깅)
    console.log('콜백 URL:', location.pathname + location.search);
    console.log('쿼리 파라미터 전체:', Object.fromEntries([...searchParams.entries()]));
    
    const processVerificationResult = async () => {
      try {
        // 파라미터 체크
        if (!encData || !tokenVersionId || !integrityValue) {
          throw new Error('필수 인증 파라미터가 누락되었습니다.');
        }
        
        console.log('인증 결과 파라미터:', {
          enc_data: encData,
          token_version_id: tokenVersionId,
          integrity_value: integrityValue,
          request_no: requestNo
        });
        
        // 백엔드 API 요청 구성 (백엔드가 GET 방식의 콜백을 지원하고 RequestParam으로 받음)
        const token = sessionStorage.getItem('token');
        let apiUrl = `http://localhost:8080/api/nice/certification/callback?token_version_id=${encodeURIComponent(tokenVersionId)}&enc_data=${encodeURIComponent(encData)}&integrity_value=${encodeURIComponent(integrityValue)}`;
        
        // requestNo가 있으면 추가
        if (requestNo) {
          apiUrl += `&request_no=${encodeURIComponent(requestNo)}`;
        }
        
        console.log('백엔드 API 호출 URL:', apiUrl);
        
        // GET 요청 사용
        const response = await axios.get(apiUrl, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        // 응답 데이터 출력
        console.log('인증 검증 응답 전체:', response.data);
        console.log('응답 객체 필드명:', Object.keys(response.data));
        
        if (response.data.success) {
          setSuccess(true);
          // 백엔드에서 반환하는 사용자 정보 필드명에 맞게 수정
          setUserData({
            name: response.data.name,
            birthdate: response.data.birthDate,
            gender: response.data.gender === "1" ? "남성" : "여성",
            mobileNo: response.data.mobileNo,
            nationalInfo: response.data.nationalInfo,
            mobileCo: response.data.mobileCo,
            di: response.data.di,
            ci: response.data.ci
          });
        } else {
          throw new Error(response.data.message || '본인인증 검증에 실패했습니다.');
        }
      } catch (error) {
        console.error('본인인증 결과 처리 오류:', error);
        setSuccess(false);
        setError(error.message || '본인인증 결과 처리 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    processVerificationResult();
  }, [location]);
  
  const handleGoToMain = () => {
    navigate('/');
  };
  
  const handleRetryVerification = () => {
    navigate('/nice-auth');
  };
  
  if (loading) {
    return (
      <Container>
        <Paper elevation={2} sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
          <Typography variant="h5" component="h1" gutterBottom>
            본인인증 결과 처리 중...
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
          <Typography variant="body1">
            잠시만 기다려주세요. 본인인증 결과를 처리하고 있습니다.
          </Typography>
        </Paper>
      </Container>
    );
  }
  
  if (success) {
    return (
      <Container>
        <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h5" component="h1" gutterBottom align="center" color="primary">
            본인인증 성공
          </Typography>
          
          <Box sx={{ my: 3 }}>
            {userData && (
              <>
                <Typography variant="body1" gutterBottom>
                  <strong>이름:</strong> {userData.name}
                </Typography>
                {userData.birthdate && (
                  <Typography variant="body1" gutterBottom>
                    <strong>생년월일:</strong> {userData.birthdate}
                  </Typography>
                )}
                {userData.gender && (
                  <Typography variant="body1" gutterBottom>
                    <strong>성별:</strong> {userData.gender}
                  </Typography>
                )}
                {userData.mobileNo && (
                  <Typography variant="body1" gutterBottom>
                    <strong>휴대폰번호:</strong> {userData.mobileNo}
                  </Typography>
                )}
                {userData.mobileCo && (
                  <Typography variant="body1" gutterBottom>
                    <strong>통신사:</strong> {userData.mobileCo}
                  </Typography>
                )}
                {userData.nationalInfo && (
                  <Typography variant="body1" gutterBottom>
                    <strong>내외국인:</strong> {userData.nationalInfo === "0" ? "내국인" : "외국인"}
                  </Typography>
                )}
              </>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleGoToMain}
              sx={{ minWidth: 120 }}
            >
              확인
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }
  
  return (
    <Container>
      <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h5" component="h1" gutterBottom align="center" color="error">
          본인인증 실패
        </Typography>
        
        <Typography variant="body1" align="center" sx={{ my: 3 }}>
          {error || '본인인증에 실패했습니다. 다시 시도해주세요.'}
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
          <Button 
            variant="outlined"
            onClick={handleGoToMain}
            sx={{ minWidth: 120 }}
          >
            취소
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleRetryVerification}
            sx={{ minWidth: 120 }}
          >
            다시 시도
          </Button>
        </Box>
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

export default NiceCallback; 