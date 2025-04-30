import React, { useRef, useEffect } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import SignaturePad from 'react-signature-canvas';

const SignatureModal = ({ open, onClose, onSave }) => {
  const sigPadRef = useRef();

  // 컴포넌트가 마운트되거나 다시 열릴 때 서명 패드 설정
  useEffect(() => {
    if (open && sigPadRef.current) {
      // 서명 패드가 열릴 때마다 초기화
      sigPadRef.current.clear();
      
      // 서명 선 스타일 설정
      const canvas = sigPadRef.current.getCanvas();
      const ctx = canvas.getContext('2d');
      ctx.lineWidth = 3; // 선 굵기 설정
      ctx.lineCap = 'round'; // 선 끝 모양을 둥글게
      ctx.lineJoin = 'round'; // 선 연결 부분을 둥글게
    }
  }, [open]);

  const handleSave = () => {
    if (sigPadRef.current.isEmpty()) return;
    const signatureData = sigPadRef.current.toDataURL();
    onSave(signatureData);
    onClose();
  };

  const handleClear = () => {
    sigPadRef.current.clear();
    
    // 지운 후에도 선 스타일 유지
    if (sigPadRef.current) {
      const canvas = sigPadRef.current.getCanvas();
      const ctx = canvas.getContext('2d');
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
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
            dotSize={3} // 점 크기 설정
            minWidth={3} // 최소 선 굵기
            maxWidth={5} // 최대 선 굵기 (펜 압력에 따라 달라질 수 있음)
            velocityFilterWeight={0.5} // 속도에 따른 선 굵기 변화 정도
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