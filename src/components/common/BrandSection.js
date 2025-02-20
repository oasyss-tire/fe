import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const tireBrands = [
  { name: "KUMHO TIRE", logo: "/images/kumho.png" },
  { name: "MICHELIN", logo: "/images/michelin.png" },
  { name: "NEXEN", logo: "/images/nexen.png" },
  { name: "PIRELLI", logo: "/images/pirelli.png" },
  { name: "DUNLOP", logo: "/images/dunlop.png" }
];

const BrandSection = () => {
  return (
    <Box 
      sx={{
        backgroundColor: '#FFD700',
        py: 4,
        px: 2,
        display: 'flex',
        flexDirection: 'column',  // ✅ 모바일 레이아웃을 그대로 유지
        alignItems: 'center',
        textAlign: 'center'
      }}
    >
      {/* 타이어 이미지 */}
      <Box
        component="img"
        src="/images/tire.png"
        alt="타이어 이미지"
        sx={{
          width: '100%',
          maxWidth: '300px',
          mb: 2,
        }}
      />

      {/* 브랜드 소개 텍스트 */}
      <Typography variant="h6" sx={{ fontWeight: 'bold', color: "#222" }}>
        We Have All Brand Of Tire
      </Typography>
      <Typography variant="body1" sx={{ fontSize: '1rem', color: "#333", mt: 1, fontWeight: 'bold' }}>
        국·내외 모든 타이어 브랜드를 취급하는 타이어 전문 유통기업
      </Typography>

      {/* 브랜드 로고 리스트 */}
      <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {tireBrands.map((brand, index) => (
          <Paper 
            key={index}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              boxShadow: 'none',
              mb: 2
            }}
          >
            <Box
              component="img"
              src={brand.logo}
              alt={brand.name}
              sx={{
                width: '200px',
                height: '70px',  // ✅ 로고 높이를 통일
                objectFit: 'contain', // ✅ 이미지 왜곡 없이 균일하게
              }}
            />
          </Paper>
        ))}
      </Box>
    </Box>
  );
};

export default BrandSection;
