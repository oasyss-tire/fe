import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import Carousel from 'react-material-ui-carousel';

const carouselItems = [
  {
    subtitle: "타이어뱅크 이벤트 #1",
    title: "타이어뱅크 카카오채널 친구 추가 ON!",
    period: "이벤트 기간 : 2024-02-16 ~ 2025-02-28",
    image: "/images/tb.png",
    hashtags: ["#카카오 채널 ", "#친구추가"],
  },
  {
    subtitle: "타이어뱅크 이벤트 #2",
    title: "2025 타이어뱅크 프로모션 안내",
    period: "이벤트 기간 : 2024-03-01 ~ 2024-04-30",
    image: "/images/tb2.png",
    hashtags: ["#빅세일 페스타", "#출산장려 캠페인"],
  },
  {
    subtitle: "타이어뱅크 이벤트 #3",
    title: "다 쓴 타이어 보상받고 3+1로 교체하자",
    period: "이벤트 기간 : 2024-02-16 ~ 2025-02-28",
    image: "/images/tb3.png",
    hashtags: ["#다 쓴 타이어", "#3+1", "#교체하러 가자"],
  },
  {
    subtitle: "타이어뱅크 이벤트 #4",
    title: "타이어뱅크 출산장려 캠페인",
    period: "이벤트 기간 : 2024-03-01 ~ 2024-04-30",
    image: "/images/tb4.png",
    hashtags: ["#아이낳고 나라구하기", "#출산장려캠페인", "#1000억원지원"],
  }
];

const MobileCarousel = () => {
  return (
    <Carousel 
      animation="slide" 
      indicators={true}
      navButtonsAlwaysVisible={false}
      interval={5000}
      sx={{
        mb: 4,
        width: '100%',
        maxWidth: '430px',
        margin: '0 auto',
        '& .MuiPaper-root': { borderRadius: '10px' },
      }}
    >
      {carouselItems.map((item, index) => (
        <Paper
          key={index}
          sx={{
            display: 'flex',
            flexDirection: 'column',  // ✅ 모든 화면에서 모바일 레이아웃 유지
            alignItems: 'center',
            textAlign: 'center',
            p: 2,
            backgroundColor: '#E60012',
            color: 'white',
            borderRadius: '10px',
            overflow: 'hidden'
          }}
        >
          {/* 이미지 섹션 */}
          <Box 
            component="img"
            src={item.image}
            alt="이벤트 이미지"
            sx={{
              width: '100%', // ✅ 항상 화면 크기에 맞춤
              maxWidth: '350px',
              height: 'auto',
              borderRadius: '8px'
            }}
          />
          
          {/* 텍스트 섹션 */}
          <Box 
            sx={{
              flex: 1,
              p: 2
            }}
          >
            {/* Subtitle */}
            <Typography variant="body2" sx={{ color: "#FFFFFF", opacity: 0.9 }}>
              {item.subtitle}
            </Typography>

            {/* Title */}
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: "#FFFFFF", mt: 0.5 }}>
              {item.title}
            </Typography>

            {/* 이벤트 기간 */}
            <Typography variant="caption" sx={{ mt: 1, display: 'block', color: "#FFBABA" }}>
              {item.period}
            </Typography>

            {/* 해시태그 */}
            <Box sx={{ mt: 1 }}>
              {item.hashtags.map((tag, i) => (
                <Typography key={i} variant="caption" sx={{ mr: 1, opacity: 0.8 }}>
                  {tag}
                </Typography>
              ))}
            </Box>

            {/* 버튼 */}
            <Button 
              variant="contained"
              sx={{
                mt: 2,
                backgroundColor: '#E60012',
                borderRadius: '10px',
                border: '2px solid #ffffff',
                color: '#ffffff',
                fontWeight: 'bold',
                '&:hover': { backgroundColor: '#FFEBEB' }
              }}
            >
              자세히 보기
            </Button>
          </Box>
        </Paper>
      ))}
    </Carousel>
  );
};

export default MobileCarousel;
