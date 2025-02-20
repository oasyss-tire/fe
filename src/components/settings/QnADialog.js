import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Box, Typography, CircularProgress } from '@mui/material';
import { Button } from '@mui/material';

const QnADialog = ({ open, onClose, data, onSave, previewMode, onTogglePreview }) => {
  const [formData, setFormData] = useState({
    question: '',
    answer: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {data ? 'QA 수정' : 'QA 추가'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {!previewMode ? (
            // 편집 모드
            <>
              <TextField
                fullWidth
                label="질문"
                value={formData.question}
                onChange={(e) => setFormData({...formData, question: e.target.value})}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="답변"
                multiline
                rows={4}
                value={formData.answer}
                onChange={(e) => setFormData({...formData, answer: e.target.value})}
              />
            </>
          ) : (
            // 미리보기 모드
            <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Q. {formData.question}
              </Typography>
              <Typography variant="body1">
                A. {formData.answer}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onTogglePreview}>
          {previewMode ? '수정하기' : '미리보기'}
        </Button>
        <Button onClick={onClose}>취소</Button>
        <Button 
          onClick={handleSave}
          variant="contained"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              저장 중...
            </>
          ) : '저장'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QnADialog; 