import React, { useEffect, useState, useRef } from 'react';
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
  
  // 중복 호출 방지를 위한 ref
  const isProcessingRef = useRef(false);
  
  useEffect(() => {
    // 이미 처리 중이면 중복 실행 방지
    if (isProcessingRef.current) {

      return;
    }
    
    // URL 쿼리 파라미터 파싱
    const searchParams = new URLSearchParams(location.search);
    const encData = searchParams.get('enc_data');
    const tokenVersionId = searchParams.get('token_version_id');
    const integrityValue = searchParams.get('integrity_value');
    let requestNo = searchParams.get('request_no');
    
    // URL에 request_no가 없으면 sessionStorage에서 가져오기
    if (!requestNo) {
      requestNo = sessionStorage.getItem('nice_request_no');

    }

    
    const processVerificationResult = async () => {
      // 처리 시작 플래그 설정
      isProcessingRef.current = true;
      
      try {
        // 파라미터 체크
        if (!encData || !tokenVersionId || !integrityValue) {
          throw new Error('필수 인증 파라미터가 누락되었습니다.');
        }

        
        // 백엔드 API 요청 구성 - POST 방식으로 변경
        const token = sessionStorage.getItem('token');
        
        // FormData 방식으로 POST 요청 준비
        const formData = new URLSearchParams();
        formData.append('token_version_id', tokenVersionId);
        formData.append('enc_data', encData);
        formData.append('integrity_value', integrityValue);
        
        // request_no가 있으면 추가, 없으면 빈 문자열로 전달
        formData.append('request_no', requestNo || '');

        
        // POST 요청 사용
        const response = await axios.post(
          'http://localhost:8080/api/nice/certification/callback',
          formData,
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
          }
        );
        

        
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
          
          // 성공 시 sessionStorage 정리
          sessionStorage.removeItem('nice_request_no');
        } else {
          throw new Error(response.data.message || '본인인증 검증에 실패했습니다.');
        }
      } catch (error) {
        console.error('본인인증 결과 처리 오류:', error);
        setSuccess(false);
        setError(error.message || '본인인증 결과 처리 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
        // 처리 완료 후에도 플래그 유지 (재실행 방지)
      }
    };
    
    processVerificationResult();
  }, [location.search]); // location.search로 의존성 변경하여 URL 파라미터 변경 시에만 실행
  
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