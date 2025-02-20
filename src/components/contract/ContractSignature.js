import React, { useState, useRef, useEffect } from 'react';

import {

  Dialog,

  DialogTitle,

  DialogContent,

  DialogActions,

  Button,

  Box,

  Typography,

  IconButton,

  CircularProgress

} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';

import UndoIcon from '@mui/icons-material/Undo';

import { Document, Page } from 'react-pdf';



const ContractSignature = ({ open, onClose, contractId }) => {

  const [numPages, setNumPages] = useState(null);

  const [pageNumber, setPageNumber] = useState(1);

  const [loading, setLoading] = useState(false);

  const [pdfFile, setPdfFile] = useState(null);

  const canvasRef = useRef(null);

  const contextRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);

  const [signatures, setSignatures] = useState([]);

  const pdfContainerRef = useRef(null);

  const [pdfLoaded, setPdfLoaded] = useState(false);

  const [pdfWidth, setPdfWidth] = useState(0);

  const [pdfHeight, setPdfHeight] = useState(0);



  useEffect(() => {

    if (contractId) {

      setPdfFile({

        url: `http://localhost:8080/api/contracts/${contractId}/pdf`,

        httpHeaders: {

          'Authorization': `Bearer ${sessionStorage.getItem('token')}`

        }

      });

    }

  }, [contractId]);



  // PDF 로드 완료 후 캔버스 초기화

  const handleDocumentLoadSuccess = ({ numPages }) => {

    setNumPages(numPages);

    setPdfLoaded(true);

  };



  // PDF와 캔버스 초기화

  useEffect(() => {

    if (open && pdfLoaded && pdfContainerRef.current) {

      const canvas = canvasRef.current;
      
      // 고정된 크기 설정
      canvas.width = 800;
      canvas.height = 1131;
      
      const context = canvas.getContext('2d');
      context.strokeStyle = "black";
      context.lineWidth = 2;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      contextRef.current = context;
    }

  }, [open, pdfLoaded]);



  const startDrawing = (e) => {
    if (!contextRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const container = pdfContainerRef.current;
    
    // viewport 상대적 위치를 실제 캔버스 위치로 변환
    const viewportX = e.clientX - rect.left;
    const viewportY = e.clientY - rect.top;
    
    // 실제 캔버스 크기와 보이는 크기의 비율 계산
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // 스크롤 위치를 고려한 최종 좌표 계산
    const x = viewportX * scaleX;
    const y = (viewportY + container.scrollTop) * scaleY;
    
    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    setIsDrawing(true);
  };



  const draw = (e) => {
    if (!isDrawing || !contextRef.current) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const container = pdfContainerRef.current;
    
    // viewport 상대적 위치를 실제 캔버스 위치로 변환
    const viewportX = e.clientX - rect.left;
    const viewportY = e.clientY - rect.top;
    
    // 실제 캔버스 크기와 보이는 크기의 비율 계산
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // 스크롤 위치를 고려한 최종 좌표 계산
    const x = viewportX * scaleX;
    const y = (viewportY + container.scrollTop) * scaleY;
    
    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
  };



  const stopDrawing = () => {

    if (isDrawing && contextRef.current) {

      contextRef.current.closePath();

      // 현재 서명을 저장

      setSignatures(prev => [...prev, canvasRef.current.toDataURL()]);

    }

    setIsDrawing(false);

  };



  const handleClear = () => {

    if (!contextRef.current) return;

    const canvas = canvasRef.current;

    contextRef.current.clearRect(0, 0, canvas.width, canvas.height);

    setSignatures([]);

  };



  const handleSignatureSubmit = async () => {

    if (signatures.length === 0) {

      alert('최소 한 개 이상의 서명이 필요합니다.');

      return;

    }



    setLoading(true);

    try {

      const response = await fetch(`http://localhost:8080/api/contracts/${contractId}/sign`, {

        method: 'POST',

        headers: {

          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,

          'Content-Type': 'application/json'

        },

        body: JSON.stringify({

          signatureData: canvasRef.current.toDataURL(),

          pageNumber: pageNumber - 1

        })

      });



      if (response.ok) {

        onClose(true);

      } else {

        throw new Error('서명 저장 실패');

      }

    } catch (error) {

      console.error('서명 저장 실패:', error);

      alert('서명 저장에 실패했습니다.');

    } finally {

      setLoading(false);

    }

  };



  return (

    <Dialog 

      open={open} 

      onClose={() => !loading && onClose(false)}

      maxWidth="lg"

      fullWidth

      PaperProps={{

        sx: {

          maxWidth: '900px',

          height: '90vh',

          margin: 2

        }

      }}

    >

      <DialogTitle sx={{ 

        display: 'flex', 

        justifyContent: 'space-between', 

        alignItems: 'center' 

      }}>

        <Typography>서명하기</Typography>

        <Box>

          <IconButton onClick={handleClear} disabled={loading}>

            <UndoIcon />

          </IconButton>

          <IconButton onClick={() => onClose(false)} disabled={loading}>

            <CloseIcon />

          </IconButton>

        </Box>

      </DialogTitle>



      <DialogContent>

        <Box 

          sx={{ 

            position: 'relative',

            width: '800px',

            margin: '0 auto',

            height: 'calc(90vh - 130px)',

            overflow: 'auto',

            backgroundColor: '#fff',

            '& canvas': {  // 캔버스에 대한 스타일 추가

              transformOrigin: 'top left'

            }

          }} 

          ref={pdfContainerRef}

        >

          <Document

            file={pdfFile}

            onLoadSuccess={handleDocumentLoadSuccess}

          >

            <Page 

              pageNumber={pageNumber}

              renderTextLayer={false}

              renderAnnotationLayer={false}

              width={800}

            />

          </Document>

          

          {pdfLoaded && (

            <canvas

              ref={canvasRef}

              style={{

                position: 'absolute',

                top: 0,

                left: 0,

                width: '800px',

                height: '1131px',

                cursor: 'crosshair',

                touchAction: 'none',

                zIndex: 2,

                backgroundColor: 'transparent',

                pointerEvents: 'all'

              }}

              onMouseDown={startDrawing}

              onMouseMove={draw}

              onMouseUp={stopDrawing}

              onMouseLeave={stopDrawing}

            />

          )}

        </Box>

      </DialogContent>



      <DialogActions>

        <Button onClick={() => onClose(false)} disabled={loading}>

          취소

        </Button>

        <Button

          variant="contained"

          onClick={handleSignatureSubmit}

          disabled={loading || signatures.length === 0}

        >

          {loading ? <CircularProgress size={24} /> : '서명 완료'}

        </Button>

      </DialogActions>

    </Dialog>

  );

};



export default ContractSignature; 