import React from 'react';
import {
  Box,
  Typography,
  Button,
  Divider,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import DrawIcon from '@mui/icons-material/Draw';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import SaveIcon from '@mui/icons-material/Save';

const PdfToolbar = ({ selectedTool, onToolChange, onSave }) => {
  return (
    <Box
      sx={{
        width: '280px',
        minWidth: '280px',
        borderLeft: '1px solid #ddd',
        bgcolor: '#fff',
        p: 2,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>
        서명 옵션
      </Typography>

      <ToggleButtonGroup
        orientation="vertical"
        value={selectedTool}
        exclusive
        onChange={onToolChange}
        sx={{ mb: 3 }}
      >
        <ToggleButton 
          value="text" 
          aria-label="text"
          sx={{ justifyContent: 'flex-start', py: 1.5, gap: 1 }}
        >
          <TextFieldsIcon />
          <Typography>텍스트 입력</Typography>
        </ToggleButton>
        
        <ToggleButton 
          value="signature" 
          aria-label="signature"
          sx={{ justifyContent: 'flex-start', py: 1.5, gap: 1 }}
        >
          <DrawIcon />
          <Typography>서명/도장</Typography>
        </ToggleButton>
        
        <ToggleButton 
          value="checkbox" 
          aria-label="checkbox"
          sx={{ justifyContent: 'flex-start', py: 1.5, gap: 1 }}
        >
          <CheckBoxOutlineBlankIcon />
          <Typography>체크박스</Typography>
        </ToggleButton>
      </ToggleButtonGroup>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ flex: 1 }}>
        {selectedTool === 'text' && (
          <Typography variant="body2" color="text.secondary">
            텍스트를 입력할 위치를 PDF 문서에서 클릭하세요.
          </Typography>
        )}
        {selectedTool === 'signature' && (
          <Typography variant="body2" color="text.secondary">
            서명/도장을 넣을 위치를 PDF 문서에서 클릭하세요.
          </Typography>
        )}
        {selectedTool === 'checkbox' && (
          <Typography variant="body2" color="text.secondary">
            체크박스를 넣을 위치를 PDF 문서에서 클릭하세요.
          </Typography>
        )}
      </Box>

      <Button 
        variant="contained" 
        onClick={onSave}
        sx={{ mt: 2 }}
      >
        계약서 저장하기
      </Button>
    </Box>
  );
};

export default PdfToolbar; 