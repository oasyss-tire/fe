import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Button 
} from '@mui/material';

const SaveTemplateModal = ({ open, onClose, onSave }) => {
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');

  const handleSave = () => {
    onSave({ templateName, description });
    setTemplateName('');
    setDescription('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>템플릿 저장</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="템플릿 이름"
          fullWidth
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
        />
        <TextField
          margin="dense"
          label="설명"
          fullWidth
          multiline
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button onClick={handleSave} variant="contained">저장</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaveTemplateModal;
