import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  IconButton,
  Paper
} from '@mui/material';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';

// PDF.js 워커 설정
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// PDF 표준 A4 크기 (포인트 단위)
const PDF_A4_WIDTH_POINTS = 595.28;
const PDF_A4_HEIGHT_POINTS = 841.89;

/**
 * PDF 미리보기 컴포넌트
 * 서명 완료된 PDF를 읽기 전용으로 보여주는 컴포넌트
 */
const PreviewPdfViewer = () => {
  const { contractId, participantId, pdfId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  
  // 상태 관리
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contract, setContract] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [fields, setFields] = useState([]);
  
  // PDF 뷰어 관련 상태
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfScale, setPdfScale] = useState(1.2);
  const [currentPdfIndex, setCurrentPdfIndex] = useState(0);
  const [pdfs, setPdfs] = useState([]);
  
  // 초기 데이터 로딩
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!contractId || !participantId) return;
      
      try {
        setLoading(true);
        
        // 1. 계약 정보 조회
        const contractResponse = await fetch(`http://localhost:8080/api/contracts/${contractId}`);
        if (!contractResponse.ok) throw new Error('계약 정보 조회 실패');
        const contractData = await contractResponse.json();
        setContract(contractData);
        
        // 2. 참여자 정보 조회
        const participantResponse = await fetch(
          `http://localhost:8080/api/contracts/${contractId}/participants/${participantId}`
        );
        if (!participantResponse.ok) throw new Error('참여자 정보 조회 실패');
        const participantData = await participantResponse.json();
        setParticipant(participantData);
        
        // 템플릿 PDF 정보 설정
        if (participantData.templatePdfs && participantData.templatePdfs.length > 0) {
          setPdfs(participantData.templatePdfs);
          
          // pdfId가 없으면 첫 번째 템플릿 사용
          const targetPdfId = pdfId || participantData.templatePdfs[0]?.pdfId;
          
          if (targetPdfId) {
            // 필드 정보 로딩 실행 - 원본 pdfId 사용 (필드값이 저장된 PDF)
            const originalPdfId = participantData.templatePdfs[0]?.pdfId;
            await fetchFields(originalPdfId);
          }
        }
        
      } catch (error) {
        console.error('데이터 조회 실패:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [contractId, participantId, pdfId]);
  
  // 필드 정보 가져오기
  const fetchFields = async (pdfId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/contract-pdf/fields/${pdfId}`);
      if (!response.ok) throw new Error('필드 정보 조회 실패');
      
      const fieldsData = await response.json();
      
      // 필드 정보 저장
      setFields(fieldsData);
    } catch (error) {
      console.error('필드 정보 조회 중 오류:', error);
      setError('필드 정보를 불러오는데 실패했습니다.');
    }
  };
  
  // 컨테이너 크기 변경 감지 및 스케일 계산
  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      const style = window.getComputedStyle(container);
      const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const availableWidth = container.clientWidth - paddingX;
      
      // A4 크기 기준 (595.28pt x 841.89pt)
      const targetWidth = availableWidth * 0.9;
      const baseScale = targetWidth / 595.28;
      
      // 스케일 범위 제한
      const finalScale = Math.min(Math.max(baseScale, 0.8), 1.4);
      setPdfScale(finalScale);
      
    };
    
    calculateScale();
    
    const resizeObserver = new ResizeObserver(calculateScale);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, []);
  
  // PDF 문서 로드 성공 시 실행
  const handleDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };
  
  // 페이지 변경 처리
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= numPages) {
      setCurrentPage(newPage);
      
      // 페이지 ID를 이용해 해당 페이지로 스크롤
      const pageElement = document.getElementById(`page-${newPage}`);
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };
  
  // 확대/축소 처리
  const handleZoom = (zoomIn) => {
    const newScale = zoomIn ? pdfScale + 0.2 : pdfScale - 0.2;
    const limitedScale = Math.max(0.6, Math.min(2.5, newScale));
    setPdfScale(limitedScale);
  };
  
  // 템플릿 PDF 변경 처리
  const handleChangePdf = async (index) => {
    if (pdfs.length > 0 && index >= 0 && index < pdfs.length) {
      setCurrentPdfIndex(index);
      setCurrentPage(1); // 페이지 초기화
      
      // 필드 정보 로딩 실행 - 원본 pdfId 사용 (필드값이 저장된 PDF)
      const originalPdfId = pdfs[index].pdfId;
      await fetchFields(originalPdfId);
    }
  };
  
  // 동적 폰트 크기 계산 헬퍼 함수
  const calculateDynamicFontSize = (text, containerWidth, containerHeight) => {
    if (!text || !containerWidth || !containerHeight || containerWidth <= 0 || containerHeight <= 0) return 12; // 유효성 검사 강화
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const maxFontSize = 14;
    const minFontSize = 8;
    const padding = 4; // CSS padding 2px * 2 (양쪽)
    const lineHeight = 1.2;
    const safetyMargin = 2; // 텍스트 잘림 방지를 위한 안전 여백 (픽셀 단위)
    
    for (let fontSize = maxFontSize; fontSize >= minFontSize; fontSize -= 0.5) {
      ctx.font = `${fontSize}px Pretendard, Arial, sans-serif`;
      
      const words = text.split(' ');
      const lines = [];
      let currentLine = '';
      
      const availableTextWidth = containerWidth - padding;
      if (availableTextWidth <= 0) continue; // 사용 가능한 너비가 없으면 다음 폰트 크기로

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = ctx.measureText(testLine).width;
        
        if (testWidth <= availableTextWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) {
            lines.push(currentLine);
          }
          // 현재 단어가 너무 길어서 한 줄에 들어가지 않는 경우 처리
          // (여기서는 일단 다음 줄로 넘기지만, 필요시 단어 강제 줄바꿈 로직 추가 가능)
          currentLine = word;
          // 만약 현재 단어 자체가 availableTextWidth보다 길다면, 한 글자씩 끊어서라도 넣어야 함
          // 이 로직은 현재 백엔드와 유사하게 일단 단어 단위로 유지
          if (ctx.measureText(currentLine).width > availableTextWidth && currentLine.length > 0) {
            // 매우 긴 단어에 대한 처리: 일단 lines에 추가하고, 다음 단어로 넘어감
            // (좀 더 정교하게 하려면, 이 긴 단어를 availableTextWidth에 맞게 쪼개야 함)
            lines.push(currentLine); 
            currentLine = ''; // 다음 단어를 위해 초기화
          }
        }
      }
      
      if (currentLine) {
        lines.push(currentLine);
      }
      
      const totalHeight = lines.length * fontSize * lineHeight;
      const availableTextHeight = containerHeight - padding - safetyMargin;

      if (totalHeight <= availableTextHeight && availableTextHeight > 0) {
        return fontSize;
      }
    }
    
    return minFontSize;
  };
  
  // 동적 텍스트 스타일 생성 함수
  const getDynamicTextStyle = (field, text) => {
    if (!text) return {}; // 텍스트가 없으면 기본 스타일 (또는 빈 객체)
    
    const currentPdfScale = pdfScale || 1; // pdfScale이 아직 설정되지 않았을 수 있으므로 기본값 사용

    // 필드의 실제 렌더링된 픽셀 크기 계산
    const fieldPixelWidth = field.relativeWidth * PDF_A4_WIDTH_POINTS * currentPdfScale;
    const fieldPixelHeight = field.relativeHeight * PDF_A4_HEIGHT_POINTS * currentPdfScale;
    
    const fontSize = calculateDynamicFontSize(text, fieldPixelWidth, fieldPixelHeight);
    
    return {
      fontSize: `${fontSize}px`,
      fontFamily: 'Pretendard, Arial, sans-serif',
      lineHeight: 1.2,
      wordWrap: 'break-word', // CSS가 긴 단어를 줄바꿈하도록 함
      wordBreak: 'keep-all',   // 한국어의 경우 단어 중간 줄바꿈 방지 (공백 기준)
      overflowWrap: 'break-word', // word-wrap의 표준 속성명
      overflow: 'visible',     // 영역을 벗어나는 텍스트도 보이도록 변경
      height: '100%',          // 부모 Box 컴포넌트의 높이를 채움
      width: '100%',           // 부모 Box 컴포넌트의 너비를 채움
      display: 'flex',         // 내부 텍스트 정렬을 위해 flex 사용
      alignItems: 'flex-start', // 텍스트를 상단에 정렬
      justifyContent: 'flex-start',// 텍스트를 좌측에 정렬
      padding: '2px',          // 필드 내부 여백
      color: '#333',
      fontWeight: 400,
      whiteSpace: 'pre-wrap'   // 공백과 명시적 줄바꿈('\n')을 유지
    };
  };
  
  // 필드 렌더링 함수
  const renderField = (field, pageNumber) => {
    if (field.page !== pageNumber) return null;
    
    return (
      <Box
        key={field.id}
        sx={{
          position: 'absolute',
          left: `${field.relativeX * 100}%`,
          top: `${field.relativeY * 100}%`,
          width: `${field.relativeWidth * 100}%`,
          height: `${field.relativeHeight * 100}%`,
          border: '1px solid',
          borderColor: field.type === 'signature' ? '#FF5722' : 
                       field.type === 'checkbox' ? '#4CAF50' : 
                       field.type === 'confirmText' ? '#f57c00' : '#1976d2',
          borderRadius: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: field.type === 'confirmText' ? 'rgba(245, 124, 0, 0.05)' : 'rgba(255, 255, 255, 0.1)',
          pointerEvents: 'none' // 읽기 전용으로 설정
        }}
      >
        {field.value && field.type === 'signature' && (
          <img 
            src={field.value} 
            alt="서명" 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '100%', 
              objectFit: 'contain' 
            }} 
          />
        )}
        {field.value && field.type === 'text' && (
          <Box sx={getDynamicTextStyle(field, field.value)}>
            {field.value}
          </Box>
        )}
        {field.value && field.type === 'checkbox' && field.value === 'true' && (
          <Box sx={{ 
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#4CAF50'
          }}>
            ✓
          </Box>
        )}
        {field.type === 'confirmText' && (
          <Box sx={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
            position: 'relative'
          }}>
            {/* 서명 문구 텍스트 */}
            {field.value ? (
              <Box sx={{
                ...getDynamicTextStyle(field, field.value),
                fontStyle: 'italic',
                color: '#2E5BBA',
                fontWeight: 800
              }}>
                {field.value}
              </Box>
            ) : (
              <>
                {/* 헤더 레이블 */}
                <Typography variant="caption" sx={{ 
                  fontSize: '11px', 
                  color: '#f57c00', 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  textAlign: 'center',
                  fontWeight: 'bold',
                  backgroundColor: 'rgba(255, 255, 255, 0.4)',
                  py: 0.2,
                  height: '18px',
                  lineHeight: '18px',
                  zIndex: 1
                }}>
                  서명문구
                </Typography>
                
                {/* 안내 메시지 */}
                <Typography variant="body2" sx={{ 
                  fontSize: '10px',
                  color: '#999', 
                  fontStyle: 'italic',
                  textAlign: 'center'
                }}>
                  입력되지 않음
                </Typography>
              </>
            )}
            

          </Box>
        )}
      </Box>
    );
  };
  
  // 로딩 중 표시
  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        backgroundColor: '#F8F8FE'
      }}>
        <CircularProgress size={50} sx={{ mb: 3 }} />
        <Typography variant="h6">계약서 정보를 불러오는 중입니다...</Typography>
      </Box>
    );
  }
  
  // 에러 표시
  if (error) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        backgroundColor: '#F8F8FE',
        p: 3
      }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 2,
            textAlign: 'center',
            maxWidth: 500,
            border: '1px solid #EEEEEE'
          }}
        >
          <Typography variant="h5" color="error" gutterBottom>
            오류가 발생했습니다
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {error}
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate(-1)}
            sx={{
              backgroundColor: '#3182F6',
              '&:hover': {
                backgroundColor: '#1565C0',
              }
            }}
          >
            이전 페이지로 돌아가기
          </Button>
        </Paper>
      </Box>
    );
  }
  
  // PDF가 없는 경우
  if (!pdfs || pdfs.length === 0) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        backgroundColor: '#F8F8FE',
        p: 3
      }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 2,
            textAlign: 'center',
            maxWidth: 500,
            border: '1px solid #EEEEEE'
          }}
        >
          <Typography variant="h5" gutterBottom>
            계약서를 찾을 수 없습니다
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            표시할 계약서가 없습니다.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate(-1)}
            sx={{
              backgroundColor: '#3182F6',
              '&:hover': {
                backgroundColor: '#1565C0',
              }
            }}
          >
            이전 페이지로 돌아가기
          </Button>
        </Paper>
      </Box>
    );
  }
  
  const currentTemplate = pdfs[currentPdfIndex];
  
  return (
    <Box sx={{
      display: 'flex',
      height: '100vh',
      bgcolor: '#f5f5f5',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1200
    }}>
      {/* 왼쪽 썸네일 영역 */}
      <Box
        sx={{
          width: '200px',
          minWidth: '200px',
          height: '100%',
          overflowY: 'auto',
          borderRight: '1px solid #ddd',
          bgcolor: '#fff',
          p: 1.5
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 2, pl: 1 }}>
          페이지 목록
        </Typography>
        <Document
          file={currentTemplate?.pdfId ?
            `http://localhost:8080/api/contract-pdf/view/${currentTemplate.pdfId}` :
            null
          }
          onLoadSuccess={handleDocumentLoadSuccess}
          loading={<Typography>로딩중...</Typography>}
        >
          {Array.from(new Array(numPages), (el, index) => (
            <Box
              key={`thumb-${index + 1}`}
              sx={{
                mb: 1.5,
                cursor: 'pointer',
                border: currentPage === index + 1 ? '2px solid #1976d2' : '1px solid #ddd',
                borderRadius: 1,
                overflow: 'hidden'
              }}
              onClick={() => handlePageChange(index + 1)}
            >
              <Page
                pageNumber={index + 1}
                width={140}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Box>
          ))}
        </Document>
      </Box>
      
      {/* 중앙 PDF 뷰어 영역 */}
      <Box
        ref={containerRef}
        sx={{
          flex: '1 1 auto',
          height: '100%',
          overflowY: 'auto',
          p: 4,
          bgcolor: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <Document
          file={currentTemplate?.pdfId ?
            `http://localhost:8080/api/contract-pdf/view/${currentTemplate.pdfId}` :
            null
          }
          onLoadSuccess={handleDocumentLoadSuccess}
          loading={<Typography>PDF 로딩중...</Typography>}
        >
          {Array.from(new Array(numPages), (el, index) => (
            <Box
              key={`page-${index + 1}`}
              id={`page-${index + 1}`}
              sx={{
                position: 'relative',
                mb: 4,
                display: 'flex',
                justifyContent: 'center',
                boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: '#fff',
                width: 'fit-content',
                scrollMarginTop: '20px'
              }}
            >
              <Page
                pageNumber={index + 1}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                scale={pdfScale || 1}
              />
              
              {/* 필드 오버레이 - 추후에 구현 */}
              <Box sx={{ position: 'absolute', inset: 0 }}>
                {fields
                  .filter(field => field.page === index + 1)
                  .map(field => renderField(field, index + 1))}
              </Box>
            </Box>
          ))}
        </Document>
        
        {/* 페이지 네비게이션 및 확대/축소 버튼 */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          mt: 2,
          p: 1,
          bgcolor: 'background.paper',
          borderRadius: 1,
          boxShadow: 1
        }}>
          <IconButton
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <NavigateBeforeIcon />
          </IconButton>
          
          <Typography sx={{ mx: 2 }}>
            페이지 {currentPage} / {numPages}
          </Typography>
          
          <IconButton
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= numPages}
          >
            <NavigateNextIcon />
          </IconButton>
          
          <Box sx={{ mx: 2, borderLeft: '1px solid #ddd', height: '24px' }} />
          
          <IconButton onClick={() => handleZoom(false)} disabled={pdfScale <= 0.6}>
            <ZoomOutIcon />
          </IconButton>
          
          <IconButton onClick={() => handleZoom(true)} disabled={pdfScale >= 2.5}>
            <ZoomInIcon />
          </IconButton>
        </Box>
      </Box>
      
      {/* 오른쪽 계약서 정보 영역 */}
      <Box sx={{
        width: 280,
        height: '100%',
        bgcolor: 'white',
        borderLeft: 1,
        borderColor: 'divider',
        p: 2,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Typography variant="h6">계약서 정보</Typography>
        
        {contract && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>계약 정보</Typography>
            <Paper sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 1, mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>제목:</strong> {contract.title}
              </Typography>
              <Typography variant="body2">
                <strong>생성일:</strong> {new Date(contract.createdAt).toLocaleDateString('ko-KR')}
              </Typography>
            </Paper>
          </Box>
        )}
        
        {participant && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>참여자 정보</Typography>
            <Paper sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>이름:</strong> {participant.name}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>이메일:</strong> {participant.email}
              </Typography>
              <Typography variant="body2">
                <strong>상태:</strong> {participant.statusName || '정보 없음'}
              </Typography>
            </Paper>
          </Box>
        )}
        
        {/* 계약서 목록 - 여러 계약서가 있을 경우 */}
        {pdfs.length > 1 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>계약서 목록</Typography>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 1,
              border: '1px solid #E0E0E0',
              borderRadius: 1,
              p: 1.5
            }}>
              {pdfs.map((template, index) => (
                <Box 
                  key={template.pdfId || index}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    p: 1,
                    borderRadius: 1,
                    bgcolor: index === currentPdfIndex ? '#E3F2FD' : 'transparent',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: index === currentPdfIndex ? '#E3F2FD' : '#f5f5f5'
                    }
                  }}
                  onClick={() => handleChangePdf(index)}
                >
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: index === currentPdfIndex ? '#1976d2' : '#E0E0E0',
                      color: 'white',
                      fontSize: 12,
                      mr: 1.5
                    }}
                  >
                    {index + 1}
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: index === currentPdfIndex ? 600 : 400,
                      color: index === currentPdfIndex ? '#1976d2' : 'text.primary'
                    }}
                  >
                    {template.templateName || `계약서 ${index + 1}`}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
        
        {/* 하단 영역 */}
        <Box sx={{ mt: 'auto', mb: 2 }}>
          <Button
            variant="contained"
            onClick={() => navigate(-1)}
            fullWidth
            sx={{
              backgroundColor: '#3182F6',
              '&:hover': {
                backgroundColor: '#1565C0',
              },
              py: 1,
              borderRadius: '8px',
              fontWeight: 500
            }}
          >
            돌아가기
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default PreviewPdfViewer;
