import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';

const ProtectedRoute = ({ children, roleRequired }) => {
  const token = sessionStorage.getItem('token');
  const userRole = sessionStorage.getItem('role');
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  // 기본 인증 확인
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 경로에 대한 접근 권한 확인
  useEffect(() => {
    const checkPathAccess = async () => {
      setLoading(true);
      
      try {
        // 관리자는 모든 페이지 접근 가능 (백엔드 로직과 일치)
        if (userRole === 'ADMIN') {
          setHasAccess(true);
          setLoading(false);
          return;
        }

        // API를 통해 경로 접근 권한 확인
        const response = await fetch(`http://localhost:8080/api/menu-permissions/check-access?path=${location.pathname}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('접근 권한 확인에 실패했습니다.');
        }

        const data = await response.json();
        setHasAccess(data.hasAccess);
      } catch (error) {
        console.error('접근 권한 확인 중 오류:', error);
        // 오류 발생 시 보수적으로 접근 거부
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkPathAccess();
  }, [location.pathname, userRole]);

  // 로딩 중 표시
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress size={40} />
        <Typography variant="body2" sx={{ mt: 2, color: '#666' }}>
          접근 권한 확인 중...
        </Typography>
      </Box>
    );
  }

  // 접근 권한 없음
  if (!hasAccess) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        bgcolor: '#F8F8FE'
      }}>
        <Box 
          sx={{ 
            p: 4, 
            bgcolor: '#FFFFFF', 
            borderRadius: 2,
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
            textAlign: 'center',
            maxWidth: '500px'
          }}
        >
          <Typography variant="h5" sx={{ mb: 2, color: '#FF4D4D', fontWeight: 600 }}>
            접근 권한이 없습니다
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
            이 페이지에 접근할 수 있는 권한이 없습니다. 관리자에게 문의하세요.
          </Typography>
          <Typography variant="caption" sx={{ color: '#999' }}>
            요청 경로: {location.pathname}
          </Typography>
        </Box>
      </Box>
    );
  }

  // 접근 권한 있음
  return children;
};

export default ProtectedRoute; 