import React, { useRef } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import SignaturePad from 'react-signature-canvas';

const SignatureModal = ({ open, onClose, onSave }) => {
  const sigPadRef = useRef();

  const handleSave = () => {
    if (sigPadRef.current.isEmpty()) return;
    const signatureData = sigPadRef.current.toDataURL();
    onSave(signatureData);
    onClose();
  };

  const handleClear = () => {
    sigPadRef.current.clear();
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
        서명하기
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ 
          border: '1px solid #E0E0E0', 
          borderRadius: 1, 
          mt: 1,
          overflow: 'hidden'
        }}>
          <SignaturePad
            ref={sigPadRef}
            canvasProps={{
              width: 500,
              height: 200,
              className: 'signature-canvas'
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #F0F0F0', justifyContent: 'flex-end' }}>
        <Button 
          onClick={handleClear}
          sx={{ 
            color: '#666',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
            fontWeight: 500,
            px: 2
          }}
        >
          지우기
        </Button>
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

export default SignatureModal; 