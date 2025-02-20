import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  MobileStepper 
} from '@mui/material';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// 내부 이미지 캐러셀 컴포넌트
const ImageCarousel = ({ images }) => {
  const [activeImage, setActiveImage] = useState(0);
  const maxImages = images?.length || 0;

  // images prop이 변경될 때 activeImage를 초기화
  useEffect(() => {
    setActiveImage(0);
  }, [images]);

  // images 배열이 비어있을 경우 처리
  if (maxImages === 0) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 1,
          boxShadow: 2,
          borderRadius: 2,
          backgroundColor: '#eee',
        }}
      >
        <Typography variant="body2" color="textSecondary">
          이미지가 없습니다.
        </Typography>
      </Box>
    );
  }

  const handleNextImage = () => {
    setActiveImage((prev) => prev + 1);
  };

  const handlePrevImage = () => {
    setActiveImage((prev) => prev - 1);
  };

  // 이미지 로딩 실패 시 대체 이미지 처리
  const handleImageError = (e) => {
    e.target.onerror = null; // 무한 루프 방지
    e.target.src = '/images/placeholder.png';
  };

  return (
    <Box>
      {/* 이미지 컨테이너 */}
      <Box
        sx={{
          width: '100%',
          height: '400px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 1,
          boxShadow: 2,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <Box
          component="img"
          src={images[activeImage]}
          alt={`Slide ${activeImage + 1}`}
          onError={handleImageError}
          sx={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
          }}
        />
        {/* 내부 내비게이션 화살표 (오버레이 형태) */}
        {maxImages > 1 && (
          <>
            <Button 
              onClick={handlePrevImage} 
              disabled={activeImage === 0}
              sx={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(0,0,0,0.4)',
                color: '#fff',
                minWidth: 'auto',
                p: 0.5,
                borderRadius: '50%',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.6)' },
              }}
            >
              <KeyboardArrowLeft fontSize="small" />
            </Button>
            <Button 
              onClick={handleNextImage} 
              disabled={activeImage === maxImages - 1}
              sx={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(0,0,0,0.4)',
                color: '#fff',
                minWidth: 'auto',
                p: 0.5,
                borderRadius: '50%',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.6)' },
              }}
            >
              <KeyboardArrowRight fontSize="small" />
            </Button>
          </>
        )}
      </Box>
      {/* Dot indicators */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
        {images.map((_, index) => (
          <Box
            key={index}
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              mx: 0.5,
              backgroundColor: index === activeImage ? '#1976d2' : 'rgba(0,0,0,0.3)',
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

// 튜토리얼 스텝 데이터 (소방 관련)
// 각 스텝은 label, description, 그리고 이미지 배열(images)을 포함합니다.
const tutorialSteps = [
  {
    label: '점검 들어가기',
    description: '소방 시설 점검 탭을 클릭하여, \n 소방 관련 안전 정보를 확인합니다.',
    images: [
      '/images/fire-1.png',
    ],
  },
  {
    label: '점검 시작하기 (기본정보)',
    description: '기본정보 입력 화면에서 소방 시설의 \n 필수 정보를 정확하게 입력합니다.',
    images: [
      '/images/fire-2.png',
    ],
  },
  {
    label: '점검 시작하기 (점검상태)',
    description: '소방 점검 항목을 클릭한 후, 키패드나 음성 입력 기능을 통해 점검 상태를 기록합니다.\n음성 입력이 종료되면 종료 버튼을 클릭합니다.',
    images: [
      '/images/fire-13.png',
      '/images/fire-3.png',
      '/images/fire-4.png',
    ],
  },
  {
    label: '점검 시작하기 (이미지 첨부)',
    description: '점검 과정에서 촬영한 소방 시설 관련 이미지를 \n 첨부하거나 삭제할 수 있습니다.',
    images: [
      '/images/fire-5.png',
      '/images/fire-6.png',
      '/images/fire-7.png',
      '/images/fire-8.png',
      '/images/fire-9.png',
    ],
  },
  {
    label: '점검 시작하기 (저장)',
    description: '입력된 모든 소방 점검 정보를 확인한 후 저장 버튼을 클릭합니다.\n재확인 후 서명하여 점검 결과를 최종 저장합니다.',
    images: [
      '/images/fire-10.png',
      '/images/fire-11.png',
      '/images/fire-12.png',
    ],
  },
];

const FireInspectionTutorial = () => {
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();
  const maxSteps = tutorialSteps.length;

  const handleNextStep = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBackStep = () => {
    setActiveStep((prev) => prev - 1);
  };

  return (
    <Box sx={{ maxWidth: 600, margin: '0 auto', p: 2 }}>
      {/* 전체 진행 상태 표시 */}
      <Typography
        variant="h6"
        align="center"
        sx={{ mb: 2, fontWeight: 'bold', color: '#2A2A2A' }}
      >
        {`Step ${activeStep + 1} of ${maxSteps}`}
      </Typography>

      {/* 현재 스텝 설명 (Label 및 Description) */}
      <Paper
        square
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 2,
          backgroundColor: '#f5f5f5',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 'bold',
            mb: 1,
            color: '#1976d2',
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          {tutorialSteps[activeStep].label}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: '#424242',
            whiteSpace: 'pre-line',
          }}
        >
          {tutorialSteps[activeStep].description}
        </Typography>
      </Paper>

      {/* 이미지 그룹 캐러셀 (내부) */}
      <ImageCarousel images={tutorialSteps[activeStep].images} />

      {/* 전체 스텝 내비게이션 */}
      <MobileStepper
        variant="dots"
        steps={maxSteps}
        position="static"
        activeStep={activeStep}
        nextButton={
          <Button size="small" onClick={handleNextStep} disabled={activeStep === maxSteps - 1}>
            다음
            <KeyboardArrowRight />
          </Button>
        }
        backButton={
          <Button size="small" onClick={handleBackStep} disabled={activeStep === 0}>
            <KeyboardArrowLeft />
            이전
          </Button>
        }
      />

      {/* 마지막 스텝일 경우 완료 후 이동 버튼 */}
      {activeStep === maxSteps - 1 && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
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

export default FireInspectionTutorial;
