import React, { useState, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Chip,
  Divider,
  Button,
  Stack,
  Dialog,
  IconButton
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import { Document, Page } from 'react-pdf';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import EventIcon from '@mui/icons-material/Event';
import CloseIcon from '@mui/icons-material/Close';

const DemoContractDetail = () => {
  const location = useLocation();
  const { contractInfo, participants, pdfUrl, inputAreas } = location.state || {};
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isDrawingOpen, setIsDrawingOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const [signatures, setSignatures] = useState({});
  const canvasRef = useRef(null);
  const [pdfWidth, setPdfWidth] = useState(0);
  const containerRef = useRef(null);
  const [pdfScale, setPdfScale] = useState(1);

  // 서명 모달 열기
  const handleOpenSignModal = () => {
    setIsSignModalOpen(true);
  };

  // 서명 영역 클릭 처리
  const handleAreaClick = (area) => {
    if (area.type === 'signature') {
      setSelectedArea(area);
      setIsDrawingOpen(true);
    }
  };

  // 서명 저장
  const handleSaveSignature = () => {
    const canvas = canvasRef.current;
    if (canvas && selectedArea) {
      const signature = canvas.toDataURL();
      setSignatures({
        ...signatures,
        [selectedArea.id]: signature
      });
      setIsDrawingOpen(false);
    }
  };

  // 서명 캔버스 초기화
  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // PDF 페이지 로드 성공 시 호출되는 함수 수정
  const handlePageLoadSuccess = (page) => {
    const viewport = page.getViewport({ scale: 1 });
    const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
    const containerPadding = 40;
    const availableWidth = containerWidth - containerPadding;
    
    // PDF 너비를 화면에 맞게 조정
    const newWidth = Math.min(availableWidth, 800); // 최대 너비 제한
    const newScale = newWidth / viewport.width;
    
    setPdfScale(newScale);
    setPdfWidth(newWidth);
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#F8F9FA', minHeight: '100vh' }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, color: '#1A237E', fontWeight: 700 }}>
          {contractInfo?.title || '계약서 제목'}
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DescriptionIcon sx={{ color: '#1A237E' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  계약서 설명
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ color: '#555', pl: 4 }}>
                {contractInfo?.description || '계약서 설명이 없습니다.'}
              </Typography>
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon sx={{ color: '#1A237E' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  참여자 목록
                </Typography>
              </Box>
              <Box sx={{ pl: 4 }}>
                {participants?.map((participant, index) => (
                  <Chip
                    key={index}
                    label={`${participant.name} (${participant.email})`}
                    sx={{ 
                      m: 0.5,
                      bgcolor: '#E8EAF6',
                      color: '#1A237E',
                      '& .MuiChip-label': { px: 2 }
                    }}
                  />
                ))}
              </Box>
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EventIcon sx={{ color: '#1A237E' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  만료일
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ color: '#555', pl: 4 }}>
                {contractInfo?.expirationDate || '만료일이 설정되지 않았습니다.'}
              </Typography>
            </Stack>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                bgcolor: '#E8EAF6',
                border: '1px solid #C5CAE9',
                borderRadius: 2
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 2, color: '#1A237E' }}>
                계약 상태
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <AccessTimeIcon sx={{ color: '#1A237E' }} />
                <Typography variant="body2">
                  서명 대기중
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {/* 서명하기 버튼 추가 */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          onClick={handleOpenSignModal}
          sx={{ 
            bgcolor: '#1A237E',
            '&:hover': { bgcolor: '#283593' },
            width: '200px'
          }}
        >
          서명하기
        </Button>
      </Box>

      {/* 서명 모달 */}
      <Dialog
        fullScreen
        open={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
      >
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100%',
          bgcolor: '#f5f5f5'
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 2 
          }}>
            <Typography variant="h6">서명하기</Typography>
            <IconButton onClick={() => setIsSignModalOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Box 
            ref={containerRef}
            sx={{ 
              flex: 1, 
              position: 'relative',
              overflow: 'auto',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              p: 2
            }}
          >
            <Box sx={{ position: 'relative', maxWidth: '100%' }}>
              <Document file={pdfUrl}>
                <Page 
                  pageNumber={1}
                  width={pdfWidth}
                  onLoadSuccess={handlePageLoadSuccess}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>

              {/* 입력 영역 렌더링 수정 */}
              {inputAreas.map(area => {
                const width = area.type === 'signature' ? pdfWidth * 0.15 :
                             area.type === 'text' ? pdfWidth * 0.2 :
                             pdfWidth * 0.04;
                const height = area.type === 'checkbox' ? pdfWidth * 0.04 : 
                              area.type === 'signature' ? pdfWidth * 0.06 :
                              pdfWidth * 0.05;
                
                return (
                  <Box
                    key={area.id}
                    onClick={() => handleAreaClick(area)}
                    sx={{
                      position: 'absolute',
                      left: area.x * pdfScale,
                      top: area.y * pdfScale,
                      width: width,
                      height: height,
                      border: '2px solid #1A237E',
                      backgroundColor: signatures[area.id] ? 'transparent' : 'rgba(26, 35, 126, 0.1)',
                      cursor: area.type === 'signature' ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      transform: `translate(-50%, -50%)`
                    }}
                  >
                    {signatures[area.id] ? (
                      <img 
                        src={signatures[area.id]} 
                        alt="서명" 
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      area.type === 'signature' ? '서명하기' :
                      area.type === 'text' ? '텍스트 입력' :
                      '☐'
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      </Dialog>

      {/* 서명 그리기 모달 */}
      <Dialog
        open={isDrawingOpen}
        onClose={() => setIsDrawingOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>서명 그리기</Typography>
          <Box sx={{ 
            border: '1px solid #ccc', 
            borderRadius: 1,
            mb: 2 
          }}>
            <canvas
              ref={canvasRef}
              width={500}
              height={200}
              style={{ 
                width: '100%',
                touchAction: 'none'
              }}
            />
          </Box>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button onClick={handleClearCanvas}>
              지우기
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveSignature}
              sx={{ bgcolor: '#1A237E', '&:hover': { bgcolor: '#283593' } }}
            >
              저장
            </Button>
          </Stack>
        </Box>
      </Dialog>
    </Box>
  );
};

export default DemoContractDetail;
