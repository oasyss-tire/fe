import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import ConstructionIcon from '@mui/icons-material/Construction';
import { useNavigate } from 'react-router-dom';

const ServicePreparingPage = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 100px)',
        p: 2,
        position: 'relative'
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          textAlign: 'center',
          maxWidth: 400,
          width: '100%'
        }}
      >
        <ConstructionIcon 
          sx={{ 
            fontSize: 60, 
            color: '#1C243A',
            mb: 2 
          }} 
        />
        <Typography variant="h5" gutterBottom sx={{ color: '#1C243A' }}>
          서비스 준비 중
        </Typography>
        <Typography color="textSecondary">
          현재 해당 서비스를 준비 중입니다.
          <br />
          더 나은 서비스로 찾아뵙겠습니다.
        </Typography>
      </Paper>
      
      <Box
        sx={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      >
        <Button 
          variant="contained" 
          onClick={() => navigate('/inspection')}
          sx={{
            fontWeight: 'bold',
            textTransform: 'none'
          }}
        >
          돌아가기
        </Button>
      </Box>
    </Box>
  );
};

export default ServicePreparingPage;
