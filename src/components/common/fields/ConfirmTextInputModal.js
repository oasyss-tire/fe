import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Button, 
  Box, 
  Typography,
  Alert,
  Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const ConfirmTextInputModal = ({ open, onClose, onSave, onUpdate, field }) => {
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState('');
  const [isMatch, setIsMatch] = useState(false);
  
  // 관리자 모드 여부 확인
  const isAdminMode = field?.isEditMode || !field?.confirmText;
  
  // 모달이 열릴 때마다 입력값 초기화
  useEffect(() => {
    if (open && field) {
      console.log('ConfirmTextInputModal 열림:', { 
        fieldId: field.id, 
        isEditMode: field.isEditMode, 
        confirmText: field.confirmText,
        value: field.value
      });
      
      // 관리자 모드면 confirmText를, 사용자 모드면 value를 초기값으로
      setInputText(isAdminMode ? (field.confirmText || '') : (field.value || ''));
      setError('');
      setIsMatch(isAdminMode ? true : field.value === field.confirmText);
    }
  }, [open, field, isAdminMode]);

  // 텍스트 입력 핸들러
  const handleTextChange = (e) => {
    setInputText(e.target.value);
    
    // 관리자 모드면 항상 true, 사용자 모드면 일치 여부 확인
    if (isAdminMode) {
      setIsMatch(true);
    } else {
      setIsMatch(e.target.value === field?.confirmText);
    }
    
    if (error) setError('');
  };

  // 저장 핸들러
  const handleSave = () => {
    console.log('저장 버튼 클릭:', { 
      isAdminMode, 
      inputText, 
      fieldId: field?.id 
    });
    
    // 관리자 모드 - 원본 텍스트 저장
    if (isAdminMode) {
      if (!inputText.trim()) {
        setError('따라써야 할 텍스트를 입력해주세요.');
        return;
      }
      console.log('관리자 모드로 업데이트 호출');
      if (onUpdate) {
        onUpdate(inputText.trim());
      }
      onClose(); // 모달 닫기
      return;
    }
    
    // 사용자 모드 - 일치 여부 확인 후 저장
    if (!field?.confirmText) {
      setError('확인 텍스트가 없습니다.');
      return;
    }

    if (inputText !== field.confirmText) {
      setError('입력한 텍스트가 원본 텍스트와 일치하지 않습니다.');
      return;
    }

    console.log('사용자 모드로 저장 호출');
    if (onSave) {
      onSave(inputText);
    }
    onClose(); // 모달 닫기
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
        fontWeight: 600,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>{isAdminMode ? '따라써야 할 텍스트 입력' : '따라쓰기 입력'}</span>
        <Button 
          onClick={onClose}
          sx={{ 
            minWidth: 'auto', 
            p: 0.5,
            color: 'text.secondary',
            '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
          }}
        >
          <CloseIcon fontSize="small" />
        </Button>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3, pb: 2 }}>
        {/* 관리자 모드 */}
        {isAdminMode && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              사용자가 따라써야 할 텍스트를 입력해주세요
            </Typography>
            <TextField
              fullWidth
              label="원본 텍스트 입력"
              value={inputText}
              onChange={handleTextChange}
              multiline
              minRows={3}
              maxRows={5}
              error={!!error}
              helperText={error}
              autoFocus
              placeholder="예: 본인은 위와 같은 내용을 정확히 읽고 이해하였습니다."
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '4px',
                }
              }}
            />
          </Box>
        )}
        
        {/* 사용자 모드 */}
        {!isAdminMode && field?.confirmText && (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                아래 텍스트를 그대로 입력해주세요
              </Typography>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  bgcolor: '#F5F5F5', 
                  borderRadius: 1,
                  border: '1px solid #E0E0E0'
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#333' }}>
                  {field.confirmText}
                </Typography>
              </Paper>
            </Box>
            
            <TextField
              fullWidth
              label="텍스트 입력"
              value={inputText}
              onChange={handleTextChange}
              multiline
              minRows={2}
              maxRows={4}
              error={!!error}
              helperText={error}
              autoFocus
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '4px',
                  '& fieldset': {
                    borderColor: isMatch ? '#4CAF50' : '#E0E0E0',
                  },
                  '&:hover fieldset': {
                    borderColor: isMatch ? '#4CAF50' : '#BDBDBD',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: isMatch ? '#4CAF50' : '#3182F6',
                  },
                  ...(isMatch && inputText ? {
                    backgroundColor: 'rgba(76, 175, 80, 0.04)',
                  } : {})
                },
              }}
            />
            
            {isMatch && inputText && (
              <Alert severity="success" sx={{ mt: 2 }}>
                원본 텍스트와 일치합니다!
              </Alert>
            )}
          </>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #F0F0F0' }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          sx={{ 
            color: '#666',
            borderColor: '#E0E0E0',
            '&:hover': {
              borderColor: '#BDBDBD',
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
            fontWeight: 500,
            px: 3
          }}
        >
          취소
        </Button>
        <Button 
          onClick={handleSave}
          variant="contained"
          disabled={!isMatch || !inputText}
          sx={{ 
            bgcolor: isAdminMode ? '#3182F6' : (isMatch ? '#4CAF50' : '#3182F6'), 
            '&:hover': {
              bgcolor: isAdminMode ? '#1565C0' : (isMatch ? '#388E3C' : '#1565C0'),
            },
            '&.Mui-disabled': {
              bgcolor: 'rgba(49, 130, 246, 0.3)',
            },
            fontWeight: 500,
            boxShadow: 'none',
            px: 3
          }}
        >
          확인
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmTextInputModal; 