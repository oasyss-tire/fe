import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box
} from '@mui/material';

const SaveTemplateModal = ({ open, onClose, onSave }) => {
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');

  const handleSave = () => {
    if (!templateName.trim()) {
      alert('템플릿 이름을 입력해주세요.');
      return;
    }
    onSave({ templateName, description });
    setTemplateName('');
    setDescription('');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>템플릿 저장</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="템플릿 이름"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="템플릿 설명"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button onClick={handleSave} variant="contained">저장</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaveTemplateModal;
