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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>서명하기</DialogTitle>
      <DialogContent>
        <Box sx={{ border: '1px solid #ccc', borderRadius: 1 }}>
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
      <DialogActions>
        <Button onClick={handleClear}>지우기</Button>
        <Button onClick={onClose}>취소</Button>
        <Button onClick={handleSave} variant="contained">저장</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SignatureModal; 