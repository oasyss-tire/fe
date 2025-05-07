import React from 'react';
import {
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  IconButton
} from '@mui/material';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import DrawIcon from '@mui/icons-material/Draw';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const PdfToolbar = ({ selectedTool, onToolChange }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
        서명 옵션
      </Typography>

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
          
          <ToggleButton 
            value="confirmText" 
            aria-label="confirmText"
            sx={{
              '&.Mui-selected': {
                bgcolor: 'rgba(245, 124, 0, 0.1)',
                color: '#f57c00',
                '&:hover': {
                  bgcolor: 'rgba(245, 124, 0, 0.2)',
                }
              }
            }}  
          >
            <FormatQuoteIcon />
            <Typography>서명문구</Typography>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ flex: 1 }}>
        {selectedTool && (
          <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
            {selectedTool === 'text' && '텍스트를 입력할 위치를 PDF 문서에서 클릭하세요.'}
            {selectedTool === 'signature' && '서명/도장을 넣을 위치를 PDF 문서에서 클릭하세요.'}
            {selectedTool === 'checkbox' && '체크박스를 넣을 위치를 PDF 문서에서 클릭하세요.'}
            {selectedTool === 'confirmText' && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <span>서명문구 필드를 넣을 위치를 PDF 문서에서 클릭하세요.</span>
                </Box>
                <Box sx={{ 
                  mt: 2, 
                  p: 1.5, 
                  bgcolor: '#FFF3E0', 
                  borderRadius: 1,
                  border: '1px solid #FFE0B2'
                }}>
                  <Typography variant="caption" sx={{ color: '#E65100', fontWeight: 500, display: 'block', mb: 1 }}>
                    서명문구 작성 문법 안내
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#E65100', display: 'block', mb: 0.5 }}>
                    • 선택 옵션 문법: {'{옵션1/옵션2/옵션3}'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#E65100', display: 'block', mb: 0.5 }}>
                    • 예시 1: 본인은 {'{A타입/B타입}'} 약관에 동의합니다.
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#E65100', display: 'block' }}>
                    • 예시 2: {'{개인/법인}'} 계약자 서명
                  </Typography>
                </Box>
              </Box>
            )}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default PdfToolbar; 