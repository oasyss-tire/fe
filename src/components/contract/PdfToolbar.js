import React from 'react';
import {
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import DrawIcon from '@mui/icons-material/Draw';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';

const PdfToolbar = ({ selectedTool, onToolChange }) => {
  const [tabValue, setTabValue] = React.useState(0); // 0: 관리자, 1: 서명자

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
        서명 옵션
      </Typography>

      {/* 서명 주체 선택 탭 */}
      <Paper 
        elevation={0} 
        sx={{ 
          mb: 2,
          '.MuiTabs-indicator': {
            backgroundColor: '#1976d2',
          }
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            minHeight: '40px',
            '& .MuiTab-root': {
              minHeight: '40px',
              fontSize: '14px',
              fontWeight: 500,
              textTransform: 'none',
              color: '#666',
              '&.Mui-selected': {
                color: '#1976d2',
              }
            }
          }}
        >
          <Tab label="관리자" />
          <Tab label="서명자" />
        </Tabs>
      </Paper>

      <Box sx={{ mb: 2 }}>
        <ToggleButtonGroup
          orientation="vertical"
          value={selectedTool}
          exclusive
          onChange={onToolChange}
          sx={{ 
            width: '100%',
            '& .MuiToggleButton-root': {
              justifyContent: 'flex-start',
              py: 1.5,
              px: 2,
              gap: 1,
              border: 'none',
              borderRadius: '8px !important',
              '&.Mui-selected': {
                bgcolor: '#F0F7FF',
                color: '#1976d2',
                '&:hover': {
                  bgcolor: '#E3F2FD',
                }
              }
            }
          }}
        >
          <ToggleButton value="text" aria-label="text">
            <TextFieldsIcon />
            <Typography>텍스트 입력</Typography>
          </ToggleButton>
          
          <ToggleButton value="signature" aria-label="signature">
            <DrawIcon />
            <Typography>서명/도장</Typography>
          </ToggleButton>
          
          <ToggleButton value="checkbox" aria-label="checkbox">
            <CheckBoxOutlineBlankIcon />
            <Typography>체크박스</Typography>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ flex: 1 }}>
        {selectedTool && (
          <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
            {selectedTool === 'text' && '텍스트를 입력할 위치를 PDF 문서에서 클릭하세요.'}
            {selectedTool === 'signature' && '서명/도장을 넣을 위치를 PDF 문서에서 클릭하세요.'}
            {selectedTool === 'checkbox' && '체크박스를 넣을 위치를 PDF 문서에서 클릭하세요.'}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default PdfToolbar; 