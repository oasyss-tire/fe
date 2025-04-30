import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography } from '@mui/material';

const TextInputModal = ({ open, onClose, onSave, initialValue = '', field }) => {
  const [text, setText] = useState(initialValue);

  useEffect(() => {
    setText(initialValue);
  }, [initialValue]);

  // 입력 형식에 따른 포맷팅 함수
  const formatInputValue = (value, formatCodeId) => {
    if (!formatCodeId || !value) return value;
    
    // 숫자만 추출
    const numbersOnly = value.replace(/\D/g, '');
    
    // 핸드폰 번호 포맷 (010-1234-5678)
    if (formatCodeId === '001004_0001') {
      if (numbersOnly.length <= 3) {
        return numbersOnly;
      } else if (numbersOnly.length <= 7) {
        return `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3)}`;
      } else {
        return `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3, 7)}-${numbersOnly.slice(7, 11)}`;
      }
    }
    
    // 주민등록번호 포맷 (123456-1234567)
    if (formatCodeId === '001004_0002') {
      if (numbersOnly.length <= 6) {
        return numbersOnly;
      } else {
        return `${numbersOnly.slice(0, 6)}-${numbersOnly.slice(6, 13)}`;
      }
    }
    
    // 금액 형식 (1,000,000)
    if (formatCodeId === '001004_0003') {
      // 숫자가 없으면 빈 문자열 반환
      if (numbersOnly.length === 0) return '';
      
      // 1000단위로 콤마 추가
      return Number(numbersOnly).toLocaleString('ko-KR');
    }
    
    // 날짜-년도 형식 (4자리)
    if (formatCodeId === '001004_0004') {
      // 4자리로 제한
      return numbersOnly.slice(0, 4);
    }
    
    // 날짜-월 형식 (2자리)
    if (formatCodeId === '001004_0005') {
      const month = numbersOnly.slice(0, 2);
      // 유효한 월 범위(1~12) 확인
      if (month.length > 0) {
        const monthValue = parseInt(month, 10);
        if (monthValue > 12) {
          return '12';
        } else if (monthValue === 0) {
          return '01';
        }
      }
      return month;
    }
    
    // 날짜-일 형식 (2자리)
    if (formatCodeId === '001004_0006') {
      const day = numbersOnly.slice(0, 2);
      // 유효한 일 범위(1~31) 확인
      if (day.length > 0) {
        const dayValue = parseInt(day, 10);
        if (dayValue > 31) {
          return '31';
        } else if (dayValue === 0) {
          return '01';
        }
      }
      return day;
    }
    
    // 다른 형식 코드에 대한 처리를 여기에 추가할 수 있음
    
    return value;
  };

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    
    // 형식이 지정된 경우 포맷팅 적용
    if (field?.formatCodeId) {
      const formattedValue = formatInputValue(inputValue, field.formatCodeId);
      setText(formattedValue);
    } else {
      setText(inputValue);
    }
  };

  const handleSave = () => {
    onSave(text);
    setText('');
  };

  const handleClose = () => {
    setText('');
    onClose();
  };

  // 입력 제한 설정
  const getMaxLength = () => {
    if (field?.formatCodeId === '001004_0001') return 13; // 010-1234-5678
    if (field?.formatCodeId === '001004_0002') return 14; // 123456-1234567
    if (field?.formatCodeId === '001004_0003') return 20; // 최대 19자리 숫자 + 콤마
    if (field?.formatCodeId === '001004_0004') return 4;  // 년도(YYYY)
    if (field?.formatCodeId === '001004_0005') return 2;  // 월(MM)
    if (field?.formatCodeId === '001004_0006') return 2;  // 일(DD)
    return undefined; // 제한 없음
  };

  // 설명이 있으면 그 값을 사용하고, 없으면 '원하는 값'으로
  const promptText = field?.description 
    ? `${field.description} 값을 입력해주세요` 
    : '원하는 값을 입력해주세요';
  
  // 형식 안내 메시지
  const getFormatGuideText = () => {
    if (field?.formatCodeId === '001004_0001') {
      return '핸드폰 번호 형식 (예: 010-1234-5678)';
    }
    if (field?.formatCodeId === '001004_0002') {
      return '주민등록번호 형식 (예: 123456-1234567)';
    }
    if (field?.formatCodeId === '001004_0003') {
      return '금액 형식 (예: 1,000,000)';
    }
    if (field?.formatCodeId === '001004_0004') {
      return '연도 입력 (예: 2025)';
    }
    if (field?.formatCodeId === '001004_0005') {
      return '월 입력 (01~12)';
    }
    if (field?.formatCodeId === '001004_0006') {
      return '일 입력 (01~31)';
    }
    return null;
  };

  const formatGuideText = getFormatGuideText();

  // 입력 타입 결정 (날짜 관련 필드는 숫자만 입력)
  const getInputType = () => {
    if (field?.formatCodeId === '001004_0004' || 
        field?.formatCodeId === '001004_0005' || 
        field?.formatCodeId === '001004_0006') {
      return 'number';
    }
    return 'text';
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '8px',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: '1px solid #F0F0F0', 
        py: 2, 
        px: 3, 
        fontSize: '1rem', 
        fontWeight: 600 
      }}>
        {field?.description ? `${field.description} 입력` : '텍스트 입력'}
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Typography variant="body2" sx={{ mb: 2, mt: 2, color: '#505050' }}>
          {promptText}
        </Typography>
        
        {formatGuideText && (
          <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#0277bd', fontSize: '0.75rem' }}>
            <span style={{ fontSize: '0.7rem', marginRight: '4px' }}>ℹ️</span>
            {formatGuideText}
          </Typography>
        )}
        
        <TextField
          autoFocus
          fullWidth
          value={text}
          onChange={handleInputChange}
          type={getInputType()}
          inputProps={{
            maxLength: getMaxLength(),
            min: field?.formatCodeId === '001004_0005' ? 1 : field?.formatCodeId === '001004_0006' ? 1 : undefined,
            max: field?.formatCodeId === '001004_0005' ? 12 : field?.formatCodeId === '001004_0006' ? 31 : undefined
          }}
          sx={{ 
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#E0E0E0',
              },
              '&:hover fieldset': {
                borderColor: '#BDBDBD',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#3182F6',
              },
            },
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #F0F0F0', justifyContent: 'flex-end' }}>
        <Button 
          onClick={handleClose}
          sx={{ 
            color: '#666',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
            fontWeight: 500,
            px: 2
          }}
        >
          취소
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          sx={{ 
            bgcolor: '#3182F6', 
            '&:hover': {
              bgcolor: '#1565C0',
            },
            '&.Mui-disabled': {
              bgcolor: 'rgba(49, 130, 246, 0.3)',
            },
            fontWeight: 500,
            boxShadow: 'none',
            px: 2
          }}
        >
          저장
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TextInputModal; 