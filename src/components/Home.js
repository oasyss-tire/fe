import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper,
  Grid,
  Link,
  AppBar,
  Toolbar,
  Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MobileCarousel from './common/MobileCarousel';
import ContactForm from './common/ContactForm';
import BrandSection from './common/BrandSection';

const Home = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{
      maxWidth: '430px',
      margin: '0 auto',
      minHeight: '100vh',
      background: '#FFFFFF',
      boxShadow: '0px 0px 20px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* ✅ 헤더 유지 */}
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{ 
          background: '#FFFFFF',
          borderBottom: '1px solid rgba(0,0,0,0.05)'
        }}
      >
        <Toolbar sx={{ justifyContent: 'center', minHeight: '60px' }}>
          <Box
            component="img"
            src="/images/tire-logo.png"
            alt="로고"
            sx={{
              height: '50px',
              width: 'auto',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/')}
          />
        </Toolbar>
      </AppBar>

      {/* ✅ 캐러셀을 새로운 MobileCarousel로 변경 */}
      <MobileCarousel />

      <BrandSection />


      {/* ✅ 푸터 유지 */}
      <Box
        sx={{
          backgroundColor: '#fff',
          py: 3,
          px: 2,
          textAlign: 'center',
          borderTop: '1px solid #ddd',
          mt: 4,
        }}
      >
        <Box
          component="img"
          src="/images/tire-logo.png"
          alt="회사 로고"
          sx={{
            height: 40,
            display: 'block',
            margin: '0 auto',
          }}
        />
        
        <Typography
          variant="body2"
          sx={{ fontWeight: 'bold', color: '#333', fontSize: '0.75rem' , mt: 0.5}}
        >
          (주) 타이어 뱅크
        </Typography>
        <Typography variant="body2" sx={{ color: '#666', fontSize: '0.7rem', mt: 0.5 }}>
          세종 한누리대로 350 8층
        </Typography>
        <Typography variant="body2" sx={{ color: '#666', fontSize: '0.7rem', mt: 0.5 }}>
          TEL: 1599-7181
        </Typography>

        <Typography variant="body2" sx={{ color: '#666', fontSize: '0.75rem', mt: 1 }}>
          사용문의{' '}
          <Link
            href="http://www.keyless.kr"
            underline="hover"
            sx={{ fontWeight: 'bold', color: '#666' }}
            target="_blank"
            rel="noopener"
          >
            www.keyless.kr
          </Link>
        </Typography>
      </Box>

      {/* ✅ 문의하기 컴포넌트 유지 */}
      <ContactForm />
    </Box>
  );
};

export default Home;
