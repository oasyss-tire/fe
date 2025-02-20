import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const OnboardingHome = () => {
  const navigate = useNavigate();

  const tutorialTopics = [
    { id: 'tutorial-site-intro', title: '어떤 기능들이 있는지 알아보기' },
    { id: 'signup', title: '회원가입 진행하기' },
    { id: 'electrical-inspection', title: '전기 점검 등록하기' },
    { id: 'fire-inspection', title: '소방 점검 등록하기' },
    { id: 'inquiry', title: '문의사항 등록하기' },
    { id: 'send-results', title: '점검 결과 전송하기' },
    { id: 'pdf', title: 'PDF 변환하기' },
  ];

  const handleTopicClick = (id) => {
    navigate(`/tutorial/${id}`);
  };

  return (
    <Box 
      sx={{ 
        maxWidth: '600px', 
        margin: '0 auto', 
        minHeight: '100vh', 
        backgroundColor: '#f9f9f9', 
        p: 2 
      }}
    >
      {/* 페이지 제목 */}
      <Typography 
        variant="h5" 
        sx={{ 
          mb: 3, 
          textAlign: 'center', 
          fontWeight: 'bold', 
          color: '#424242' 
        }}
      >
        이용방법 가이드
      </Typography>

      {/* 튜토리얼 항목 리스트 */}
      <List sx={{ width: '100%' }}>
        {tutorialTopics.map((topic, index) => (
          <React.Fragment key={topic.id}>
            <ListItem 
              button 
              onClick={() => handleTopicClick(topic.id)}
              sx={{ 
                py: 2,
                px: 2,
                borderRadius: 2,
                mb: 1,
                backgroundColor: '#ffffff',
                border: '1px solid #e0e0e0',
                '&:hover': { 
                  backgroundColor: '#f5f5f5',
                  borderColor: '#d0d0d0'
                },
              }}
            >
              <ListItemText 
                primary={topic.title} 
                primaryTypographyProps={{
                  variant: 'subtitle1',
                  fontWeight: 500,
                  color: '#424242'
                }}
              />
            </ListItem>
            {index < tutorialTopics.length - 1 && (
              <Divider variant="middle" sx={{ my: 1, borderColor: '#e0e0e0' }} />
            )}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default OnboardingHome;
