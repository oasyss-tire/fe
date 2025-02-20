import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  MobileStepper 
} from '@mui/material';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const tutorialSteps = [
  {
    label: '전화 문의 및 상담',
    imgPath: '/images/signup.png', // 실제 이미지 경로로 교체
    description: '회원가입을 원하시면 먼저 사이트 담당회사에 전화로 문의하세요. 상담을 통해 가입 절차와 필요한 정보를 안내받으실 수 있습니다.',
  },
  {
    label: '계약 체결',
    imgPath: '/images/signup-2.png',
    description: '상담 후, 계약서를 작성하여 정식 회원가입 절차를 진행합니다. 이 과정에서 모든 조건과 절차를 확인하게 됩니다.',
  },
  {
    label: '계정 발급',
    imgPath: '/images/signup-3.png',
    description: '계약 완료 후, 담당자에 의해 회원 계정(ID)이 발급됩니다. 발급받은 계정으로 사이트에 로그인하여 서비스를 이용할 수 있습니다.',
  },
];

const SignupTutorial = () => {
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();
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
              // 완료 후 회원가입 튜토리얼 종료 후 이동할 페이지로 라우팅 처리
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

export default SignupTutorial;
