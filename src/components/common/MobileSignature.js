import React, { useRef, useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import UndoIcon from '@mui/icons-material/Undo';
import { Document, Page, pdfjs } from 'react-pdf';
import SignatureCanvas from 'react-signature-canvas';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const MobileSignature = ({ 
  open, 
  onClose, 
  onSave,
  pdfUrl,
  title = "서명하기"
}) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pdfScale, setPdfScale] = useState(1);
  const signatureRef = useRef();
  const containerRef = useRef();

  useEffect(() => {
    if (open && containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      setPdfScale(containerWidth / 600); // PDF 기본 너비 기준으로 스케일 조정
    }
  }, [open]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handleClear = () => {
    signatureRef.current.clear();
  };

  const handleSave = async () => {
    if (signatureRef.current.isEmpty()) {
      alert('서명을 해주세요.');
      return;
    }

    setLoading(true);
    try {
      const signatureData = signatureRef.current.toDataURL();
      await onSave(signatureData);
      handleClear();
      onClose();
    } catch (error) {
      alert('서명 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: { 
          bgcolor: '#f5f5f5',
          height: '100%'
        }
      }}
    >
      <DialogTitle sx={{ 
        m: 0, 
        p: 2, 
        bgcolor: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #eee'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          {title}
        </Typography>
        <Box>
          <IconButton onClick={handleClear} sx={{ mr: 1 }}>
            <UndoIcon />
          </IconButton>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent 
        ref={containerRef}
        sx={{ 
          p: 0, 
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ 
          flex: 1,
          overflow: 'auto',
          bgcolor: '#e0e0e0',
          p: 2
        }}>
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<CircularProgress />}
          >
            <Page 
              pageNumber={pageNumber} 
              scale={pdfScale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        </Box>

        <Box sx={{ 
          height: '200px', 
          bgcolor: 'white',
          borderTop: '1px solid #eee',
          p: 2
        }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: '#666' }}>
            아래 영역에 서명해주세요
          </Typography>
          <SignatureCanvas
            ref={signatureRef}
            canvasProps={{
              className: "signature-canvas",
              style: {
                width: '100%',
                height: '150px',
                border: '1px solid #eee',
                borderRadius: '4px',
                backgroundColor: '#fff'
              }
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        p: 2, 
        bgcolor: 'white',
        borderTop: '1px solid #eee'
      }}>
        <Button 
          onClick={onClose} 
          sx={{ color: '#666' }}
          disabled={loading}
        >
          취소
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading}
          sx={{ 
            bgcolor: '#343959',
            '&:hover': { bgcolor: '#3d63b8' }
          }}
        >
          {loading ? '저장 중...' : '저장'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MobileSignature; 