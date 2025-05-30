import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box
} from '@mui/material';

const SaveTemplateModal = ({ open, onClose, onSave, initialTemplateName = '', initialDescription = '', isEditing = false }) => {
  const [templateName, setTemplateName] = useState(initialTemplateName);
  const [description, setDescription] = useState(initialDescription);

  // 초기값이 변경될 때 상태 업데이트
  useEffect(() => {
    setTemplateName(initialTemplateName);
    setDescription(initialDescription);
  }, [initialTemplateName, initialDescription, open]);

  const handleSave = () => {
    if (!templateName.trim()) {
      alert('템플릿 이름을 입력해주세요.');
      return;
    }
    onSave({ templateName, description });
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
        fontWeight: 600 
      }}>
        {isEditing ? '템플릿 수정' : '템플릿 저장'}
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 ,mt: 2}}>
          <TextField
            label="템플릿 이름"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            fullWidth
            required
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
          <TextField
            label="템플릿 설명"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
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
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #F0F0F0', justifyContent: 'flex-end' }}>
        <Button 
          onClick={onClose}
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
            fontWeight: 500,
            boxShadow: 'none',
            px: 2
          }}
        >
          {isEditing ? '수정' : '저장'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaveTemplateModal;
