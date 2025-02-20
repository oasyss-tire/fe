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

  // 만약 images 배열이 비어있으면 null 반환
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

  // onError 핸들러를 통해 이미지 로딩 실패 시 대체 이미지로 변경
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
          height: '400px', // 고정된 컨테이너 높이
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
      {/* Dot indicators (내부 캐러셀 전용) */}
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

// 튜토리얼 스텝 데이터 (7스텝)
const tutorialSteps = [
  {
    label: '점검 들어가기 & 안전교육 확인',
    description: '전기 설비 점검 탭을 클릭 후 \n 안전교육 및 필수 정보를 확인합니다.',
    images: [
      '/images/electrical-1.png',
      '/images/electrical-2.png',
    ],
  },
  {
    label: '점검 시작하기 (기본정보)',
    description: '기본정보 입력 화면에서 \n 점검 대상의 필요한 필수 기본 정보를 입력합니다.',
    images: [
      '/images/electrical-3.png',
    ],
  },
  {
    label: '점검 시작하기 (기본사항)',
    description: '해당 점검 항목을 클릭하고 \n 키패드로 직접 입력 또는 마이크 버튼 클릭 후 \n 음성 입력 방식으로 입력합니다. \n 음성 입력이 끝난 후에는 종료버튼을 클릭 합니다.',
    images: [
      '/images/electrical-4.png',
      '/images/electrical-19.png',
      '/images/electrical-5.png',
      '/images/electrical-6.png',
    ],
  },
  {
    label: '점검 시작하기 (고압 & 저압 설비)',
    description: '고압 및 저압 설비의 상태를 점검 후에 \n 적합 / 부적합 / 해당없음 중 선택합니다.',
    images: [
      '/images/electrical-7.png',
      '/images/electrical-8.png',
    ],
  },
  {
    label: '점검 시작하기 (측정개소)',
    description: '측정개소 측정 후 입력 합니다. \n 필요시에 추가 / 삭제 버튼을 통해 추가 입력을 \n 진행 할 수 있습니다.',
    images: [
      '/images/electrical-9.png',
      '/images/electrical-10.png',
    ],
  },
  {
    label: '점검 시작하기 (특이사항 & 이미지)',
    description: '특이사항 입력 및 관련 이미지 첨부 / 삭제 과정을 진행 할 수 있습니다.',
    images: [
      '/images/electrical-11.png',
      '/images/electrical-12.png',
      '/images/electrical-13.png',
      '/images/electrical-14.png',
      '/images/electrical-15.png',
    ],
  },
  {
    label: '점검 시작하기 (저장)',
    description: '모든 사항 입력 확인후 저장 버튼을 클릭 합니다. \n  재확인 후 서명 하여 저장을 진행합니다.',
    images: [
      '/images/electrical-16.png',
      '/images/electrical-17.png',
      '/images/electrical-18.png',
    ],
  },
];

const ElectricalInspectionTutorial = () => {
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
            whiteSpace: 'pre-line'
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

export default ElectricalInspectionTutorial;
