import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  MobileStepper 
} from '@mui/material';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom'; // useNavigate 추가

const tutorialSteps = [
  {
    label: '점검 문의',
    imgPath: '/images/intro-2.png', 
    description: '현장에서 발생하는 문제나 궁금증을 게시판 형태로 쉽게 등록하여, 전문가의 신속한 답변을 받아보실 수 있습니다.',
  },
  {
    label: '안전 점검 실시',
    imgPath: '/images/intro-1.png',
    description: '안전 점검을 현장에서 직접 실시하고, 간편하고 직관적인 화면을 통해 음성, 텍스트로 점검 결과를 기록합니다.',
  },
  {
    label: '리포트 작성 및 결과 전송',
    imgPath: '/images/intro-3.png',
    description: '점검 결과를 리포트 형식 pdf로 변환, 카카오톡 오픈톡 기능을 통해 신속하게 결과를 공유할 수 있습니다.',
  },
];

const SiteIntroTutorial = () => {
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate(); // navigate 함수 초기화
  const maxSteps = tutorialSteps.length;

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  return (
    <Box sx={{ maxWidth: 600, margin: '0 auto', p: 2 }}>
      {/* 현재 진행 상태 표시 */}
      <Typography 
        variant="h6" 
        align="center" 
        sx={{ mb: 2, fontWeight: 'bold', color: '#2A2A2A' }}
      >
        {`Step ${activeStep + 1} of ${maxSteps}`}
      </Typography>

      {/* 현재 단계 설명 - label과 description 꾸미기 */}
      <Paper 
        square 
        elevation={0} 
        sx={{ 
          p: 1, 
          pb: 2,
          borderRadius: 2 
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 'bold', 
            mb: 1, 
            color: '#1976d2', 
            textTransform: 'uppercase',
            letterSpacing: 1
          }}
        >
          {tutorialSteps[activeStep].label}
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            color: '#424242', 
            lineHeight: 1.6 
          }}
        >
          {tutorialSteps[activeStep].description}
        </Typography>
      </Paper>

      {/* 이미지 자료 - 이미지 컨테이너를 만들어 원본 비율 유지 */}
      <Box
        sx={{
          width: '100%',
          height: '400px', // 고정된 컨테이너 높이
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
          boxShadow: 2,
          borderRadius: 2,
          overflow: 'hidden',  // 컨테이너 영역을 벗어나는 이미지는 잘림
        }}
      >
        <Box
          component="img"
          src={tutorialSteps[activeStep].imgPath}
          alt={tutorialSteps[activeStep].label}
          sx={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
          }}
        />
      </Box>

      {/* 단계별 네비게이션 */}
      <MobileStepper
        variant="dots"
        steps={maxSteps}
        position="static"
        activeStep={activeStep}
        nextButton={
          <Button 
            size="small" 
            onClick={handleNext} 
            disabled={activeStep === maxSteps - 1}
          >
            다음
            <KeyboardArrowRight />
          </Button>
        }
        backButton={
          <Button 
            size="small" 
            onClick={handleBack} 
            disabled={activeStep === 0}
          >
            <KeyboardArrowLeft />
            이전
          </Button>
        }
      />

      {/* 마지막 단계에 완료 버튼 */}
      {activeStep === maxSteps - 1 && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => {
              // 완료 후 이동할 페이지로 라우팅 처리
              navigate('/tutorial-onboarding');
            }}
          >
            목록으로
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default SiteIntroTutorial;
