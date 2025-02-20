import React from 'react';
import { Box, Typography, Button, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const SafetyEducation = () => {
  const navigate = useNavigate();

  const safetyItems = [
    {
      title: "1. 감전사고 예방",
      content: `전기 설비 점검 시 반드시 절연장갑을 착용해야 합니다.
        전원이 차단되었는지 확인 후 작업을 시작하세요.
        젖은 손이나 물기 있는 도구로 작업하지 마세요.
        전기가 흐르는지 항상 검전기로 확인하세요.
        작업 전 접지가 제대로 되어있는지 확인하세요.
        감전 사고 발생 시 즉시 전원을 차단하세요.
        절연 도구만 사용하고 상태를 수시로 점검하세요.
        작업 구역을 명확히 표시하고 통제하세요.
        감전 위험 표지판을 설치하세요.
        비상연락망을 항상 숙지하고 있어야 합니다.`
    },
    {
      title: "2. 작업 전 안전수칙",
      content: `작업 계획서를 작성하고 검토하세요.
        필요한 안전장비를 모두 준비했는지 확인하세요.
        작업구역 주변 위험요소를 제거하세요.
        동료 작업자와 의사소통 계획을 수립하세요.
        비상시 대피로를 확인하세요.
        날씨 조건을 확인하고 적절한 조치를 취하세요.
        작업 도구의 상태를 점검하세요.
        작업 허가서를 확인하세요.
        안전모와 안전화를 착용하세요.
        작업장 조명이 충분한지 확인하세요.`
    },
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: '#FFFFFF',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 헤더 */}
      <Box sx={{ 
        p: 2, 
        position: 'sticky',
        top: 0,
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #EEEEEE',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600, 
            color: '#2A2A2A',
            textAlign: 'center'
          }}
        >
          전기 안전교육
        </Typography>
      </Box>

      {/* 컨텐츠 */}
      <Box sx={{ 
        flex: 1, 
        p: 2,
        overflow: 'auto'
      }}>
        {safetyItems.map((item, index) => (
          <Box key={index} sx={{ mb: 4 }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 600, 
                color: '#1C243A',
                mb: 2 
              }}
            >
              {item.title}
            </Typography>
            {item.content.split('\n').map((line, i) => (
              <Typography 
                key={i} 
                variant="body2" 
                sx={{ 
                  color: '#2A2A2A',
                  mb: 1,
                  lineHeight: 1.6,
                  pl: 2
                }}
              >
                • {line.trim()}
              </Typography>
            ))}
            {index < safetyItems.length - 1 && (
              <Divider sx={{ mt: 3 }} />
            )}
          </Box>
        ))}
      </Box>

      {/* 하단 버튼 */}
      <Box sx={{ 
        p: 2, 
        borderTop: '1px solid #EEEEEE',
        backgroundColor: '#FFFFFF'
      }}>
        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={() => navigate('/inspection/new')}
          sx={{ 
            py: 2,
            borderRadius: '12px',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none'
            }
          }}
        >
          안전교육 확인 완료
        </Button>
      </Box>
    </Box>
  );
};

export default SafetyEducation; 