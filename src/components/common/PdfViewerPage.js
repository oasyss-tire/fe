import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button,
} from '@mui/material';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { usePdf } from '../../context/PdfContext';
import PdfToolbar from './PdfToolbar';
import { TextField, SignatureField, CheckboxField } from './fields/PdfField';
import SaveTemplateModal from './modals/SaveTemplateModal';
import SaveIcon from '@mui/icons-material/Save';

// PDF.js 워커 설정
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PdfViewerPage = () => {
  const location = useLocation();
  const { pdfFile, fileName, pdfId, saveFields, savedFields } = usePdf();
  const [pdfUrl, setPdfUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfScale, setPdfScale] = useState(null);
  const containerRef = useRef(null);
  const [selectedTool, setSelectedTool] = useState(null);
  const [textFields, setTextFields] = useState([]);
  const [signatureFields, setSignatureFields] = useState([]);
  const [checkboxFields, setCheckboxFields] = useState([]);
  const [isPlacing, setIsPlacing] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragTarget, setDragTarget] = useState(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeTarget, setResizeTarget] = useState(null);
  const resizeStartPos = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });
  const [saveTemplateModalOpen, setSaveTemplateModalOpen] = useState(false);
  
  // A4 크기 상수 추가
  const PAGE_WIDTH = 595.28;  // A4 너비 (pt)
  const PAGE_HEIGHT = 841.89; // A4 높이 (pt)

  // PDF URL 생성
  useEffect(() => {
    if (pdfFile) {
      const url = URL.createObjectURL(pdfFile);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [pdfFile]);

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
      const finalScale = Math.min(Math.max(baseScale, 0.8), 1.2);
      setPdfScale(finalScale);
    };

    // 초기 계산
    calculateScale();

    // 리사이즈 이벤트 리스너
    const resizeObserver = new ResizeObserver(calculateScale);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // PDF 문서 로드 성공 시 실행
  const handleDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    
    // PDF 원본 크기 저장
    const page = document.querySelector('.react-pdf__Page');
    if (page) {
      const viewport = page.firstChild;
      setPdfDimensions({
        width: viewport.width / pdfScale,  // scale 제거하여 원본 크기 구함
        height: viewport.height / pdfScale
      });
    }

    if (savedFields.length > 0) {
      // 저장된 필드들을 현재 PDF 크기에 맞게 변환하여 설정
      const convertedFields = savedFields.map(field => ({
        ...field,
        x: field.relativeX * PAGE_WIDTH,
        y: field.relativeY * PAGE_HEIGHT,
        width: field.relativeWidth * PAGE_WIDTH,
        height: field.relativeHeight * PAGE_HEIGHT
      }));

      // 필드 타입별로 분류하여 상태 설정
      setTextFields(convertedFields.filter(f => f.type === 'text'));
      setSignatureFields(convertedFields.filter(f => f.type === 'signature'));
      setCheckboxFields(convertedFields.filter(f => f.type === 'checkbox'));
    }
  };

  const handleToolChange = (event, newTool) => {
    if (selectedTool === newTool) {
      setSelectedTool(null);
      return;
    }

    setSelectedTool(newTool);
    if (newTool === 'text' || newTool === 'signature' || newTool === 'checkbox') {
      const visiblePageElement = findVisiblePage();
      if (!visiblePageElement) return;

      const pageNumber = parseInt(visiblePageElement.id.split('-')[1]);
      const pageRect = visiblePageElement.getBoundingClientRect();
      const scale = pdfScale || 1;
      
      const newField = {
        id: `${newTool}-${Date.now()}`,
        x: (pageRect.width / 2) - (75),
        y: (pageRect.height / 3),
        width: newTool === 'checkbox' ? 20 : newTool === 'signature' ? 100 : 150,
        height: newTool === 'checkbox' ? 20 : newTool === 'signature' ? 60 : 30,
        value: '',
        page: pageNumber,
        type: newTool
      };

      if (newTool === 'text') {
        setTextFields(prev => [...prev, newField]);
      } else if (newTool === 'signature') {
        setSignatureFields(prev => [...prev, newField]);
      } else {
        setCheckboxFields(prev => [...prev, newField]);
      }
      setSelectedTool(null);
    }
  };

  // 현재 화면에 보이는 페이지 찾기
  const findVisiblePage = () => {
    const container = containerRef.current;
    if (!container) return null;

    const containerRect = container.getBoundingClientRect();
    const pages = container.querySelectorAll('[id^="page-"]');
    
    for (const page of pages) {
      const pageRect = page.getBoundingClientRect();
      const isVisible = (
        pageRect.top >= containerRect.top - pageRect.height/2 &&
        pageRect.bottom <= containerRect.bottom + pageRect.height/2
      );
      
      if (isVisible) {
        return page;
      }
    }

    return pages[0]; // 기본값으로 첫 페이지 반환
  };

  // 썸네일 클릭 시 해당 페이지로 스크롤
  const scrollToPage = (pageNumber) => {
    const pageElement = document.getElementById(`page-${pageNumber}`);
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: 'smooth' });
    }
    setCurrentPage(pageNumber);
  };

  // 마우스 이동 추적
  const handleMouseMove = (e) => {
    if (!isPlacing) return;
    
    const pageElement = e.target.closest('.react-pdf__Page');
    if (!pageElement) {
      setMousePosition(null);
      return;
    }

    const pageRect = pageElement.getBoundingClientRect();
    const scale = pdfScale || 1;
    
    // 마우스 위치를 페이지 기준 상대 좌표로 변환
    const relativeX = e.clientX - pageRect.left;
    const relativeY = e.clientY - pageRect.top;
    
    setMousePosition({
      x: e.clientX,
      y: e.clientY,
      width: 150 * scale,
      height: 30 * scale,
      previewX: relativeX, // 미리보기용 상대 좌표 저장
      previewY: relativeY
    });
  };

  // PDF 영역 클릭 시 텍스트 필드 추가
  const handlePdfClick = (e) => {
    if (!isPlacing || selectedTool !== 'text') return;

    const pageElement = e.target.closest('.react-pdf__Page');
    if (!pageElement) return;

    const pageContainer = pageElement.closest('[id^="page-"]');
    if (!pageContainer) return;
    
    const pageNumber = parseInt(pageContainer.id.split('-')[1]);
    const pageRect = pageElement.getBoundingClientRect();
    
    const scale = pdfScale || 1;
    const relativeX = (e.clientX - pageRect.left) / scale;
    const relativeY = (e.clientY - pageRect.top) / scale;

    const newTextField = {
      id: `text-${Date.now()}`,
      x: relativeX,
      y: relativeY,
      width: 150 / scale,     // scale로 나눠서 보정
      height: 30 / scale,     // scale로 나눠서 보정
      value: '',
      page: pageNumber
    };

    setTextFields(prev => [...prev, newTextField]);
    setIsPlacing(false);
  };

  // 드래그 시작
  const handleDragStart = (e, fieldId) => {
    e.preventDefault();
    setIsDragging(true);
    setDragTarget(fieldId);
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY
    };
  };

  // 드래그 중
  const handleDrag = (e) => {
    if (!isDragging || !dragTarget) return;

    const scale = pdfScale || 1;
    const dx = (e.clientX - dragStartPos.current.x) / scale;
    const dy = (e.clientY - dragStartPos.current.y) / scale;

    setTextFields(prev => prev.map(field => {
      if (field.id === dragTarget) {
        return { ...field, x: field.x + dx, y: field.y + dy };
      }
      return field;
    }));

    setSignatureFields(prev => prev.map(field => {
      if (field.id === dragTarget) {
        return { ...field, x: field.x + dx, y: field.y + dy };
      }
      return field;
    }));

    setCheckboxFields(prev => prev.map(field => {
      if (field.id === dragTarget) {
        return { ...field, x: field.x + dx, y: field.y + dy };
      }
      return field;
    }));

    dragStartPos.current = { x: e.clientX, y: e.clientY };
  };

  // 드래그 종료
  const handleDragEnd = () => {
    setIsDragging(false);
    setDragTarget(null);
  };

  // 리사이즈 시작
  const handleResizeStart = (e, fieldId) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 텍스트 필드와 서명 필드 모두 검색
    const field = textFields.find(f => f.id === fieldId) || 
                  signatureFields.find(f => f.id === fieldId);
    if (!field) return;

    setIsResizing(true);
    setResizeTarget(fieldId);
    resizeStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      width: field.width,
      height: field.height
    };
  };

  // 리사이즈 중
  const handleResize = (e) => {
    if (!isResizing || !resizeTarget) return;

    const scale = pdfScale || 1;
    const dx = (e.clientX - resizeStartPos.current.x) / scale;
    const dy = (e.clientY - resizeStartPos.current.y) / scale;

    // 텍스트 필드 리사이즈 - 최소 높이를 10px로 변경
    setTextFields(prev => prev.map(field => {
      if (field.id === resizeTarget) {
        return {
          ...field,
          width: Math.max(30, resizeStartPos.current.width + dx),
          height: Math.max(10, resizeStartPos.current.height + dy) // 최소 높이 10px로 변경
        };
      }
      return field;
    }));

    // 서명 필드 리사이즈 - 정사각형 비율 유지
    setSignatureFields(prev => prev.map(field => {
      if (field.id === resizeTarget) {
        const size = Math.max(50, Math.max(
          resizeStartPos.current.width + dx,
          resizeStartPos.current.height + dy
        ));
        return {
          ...field,
          width: size,
          height: size
        };
      }
      return field;
    }));
  };

  // 리사이즈 종료
  const handleResizeEnd = () => {
    setIsResizing(false);
    setResizeTarget(null);
  };

  // 텍스트 필드 삭제
  const handleDeleteField = (e, fieldId) => {
    e.stopPropagation();
    setTextFields(prev => prev.filter(field => field.id !== fieldId));
    setSignatureFields(prev => prev.filter(field => field.id !== fieldId));
    setCheckboxFields(prev => prev.filter(field => field.id !== fieldId));
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDrag);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging]);

  // 리사이즈 이벤트 리스너
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResize);
      window.addEventListener('mouseup', handleResizeEnd);
      return () => {
        window.removeEventListener('mousemove', handleResize);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing]);

  const handleSaveFields = async () => {
    try {
      const PDF_WIDTH = 595.28;
      const PDF_HEIGHT = 841.89;
      
      const pdfPage = containerRef.current.querySelector('.react-pdf__Page');
      
      if (!pdfPage) {
        throw new Error('PDF 페이지를 찾을 수 없습니다.');
      }

      const { width: pageWidth, height: pageHeight } = pdfPage.getBoundingClientRect();
      const scale = pdfScale || 1;
      
      const allFields = [
        ...textFields,
        ...signatureFields,
        ...checkboxFields
      ].map(field => ({
        id: field.id,
        type: field.type,
        fieldName: `${field.type}${field.id.split('-')[1]}`,
        relativeX: field.x / pageWidth,
        relativeY: field.y / pageHeight,
        relativeWidth: (field.width * scale) / pageWidth,
        relativeHeight: (field.height * scale) / pageHeight,
        page: field.page || 1
      }));

      await saveFields(allFields);
      setSaveTemplateModalOpen(true);

    } catch (error) {
      console.error('PDF 처리 중 오류:', error);
      alert('계약서 저장 중 오류가 발생했습니다.');
    }
  };

  const handleSaveTemplate = async ({ templateName, description }) => {
    try {
      const response = await fetch(`http://localhost:8080/api/contract-pdf/save-template/${pdfId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          templateName,
          description
        })
      });

      if (!response.ok) {
        throw new Error('템플릿 저장 실패');
      }

      alert('템플릿이 성공적으로 저장되었습니다.');
      setSaveTemplateModalOpen(false);
      window.location.href = '/contract-templates';

    } catch (error) {
      console.error('템플릿 저장 중 오류:', error);
      alert('템플릿 저장 중 오류가 발생했습니다.');
    }
  };

  // 저장된 필드 불러올 때
  const renderSavedFields = () => {
    return savedFields.map(field => ({
      ...field,
      // 원본 PDF 기준 상대 좌표를 현재 화면 크기로 변환
      x: field.relativeX * pdfDimensions.width * pdfScale,
      y: field.relativeY * pdfDimensions.height * pdfScale,
      width: field.relativeWidth * pdfDimensions.width * pdfScale,
      height: field.relativeHeight * pdfDimensions.height * pdfScale
    }));
  };

  if (!pdfFile) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>PDF 파일을 찾을 수 없습니다.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', bgcolor: '#f5f5f5' }}>
      {/* 왼쪽 썸네일 영역 - 고정 너비 */}
      <Box 
        sx={{ 
          width: '200px',
          minWidth: '200px',
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
          file={pdfUrl}
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
              onClick={() => scrollToPage(index + 1)}
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

      {/* 가운데 PDF 뷰어 영역 - 남은 공간 모두 사용 */}
      <Box 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onClick={handlePdfClick}
        sx={{ 
          flex: '1 1 auto',
          overflowY: 'auto',
          p: 4,
          bgcolor: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          cursor: isPlacing ? 'crosshair' : 'default'
        }}
      >
        {/* 마우스 따라다니는 텍스트 필드 프리뷰 */}
        {isPlacing && mousePosition && (
          <Box
            sx={{
              position: 'fixed',
              left: mousePosition.x,
              top: mousePosition.y,
              width: mousePosition.width,
              height: mousePosition.height,
              border: '1px dashed #1976d2',
              backgroundColor: 'rgba(25, 118, 210, 0.1)',
              pointerEvents: 'none',
              zIndex: 1000,
              transform: 'translate(0, 0)' // 변환 제거
            }}
          />
        )}

        <Typography variant="h6" sx={{ mb: 3, pl: 2 }}>
          {fileName}
        </Typography>
        <Document
          file={pdfUrl}
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
                width: 'fit-content'
              }}
            >
              <Page
                pageNumber={index + 1}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                scale={pdfScale || 1}
              />
              
              {/* 해당 페이지의 텍스트 필드들 렌더링 */}
              {textFields
                .filter(field => field.page === index + 1)
                .map(field => (
                  <TextField
                    key={field.id}
                    field={field}
                    scale={pdfScale}
                    isDragging={isDragging}
                    dragTarget={dragTarget}
                    onDragStart={handleDragStart}
                    onResizeStart={handleResizeStart}
                    onDelete={handleDeleteField}
                  />
                ))}

              {/* 서명 필드 렌더링 */}
              {signatureFields
                .filter(field => field.page === index + 1)
                .map(field => (
                  <SignatureField
                    key={field.id}
                    field={field}
                    scale={pdfScale}
                    isDragging={isDragging}
                    dragTarget={dragTarget}
                    onDragStart={handleDragStart}
                    onResizeStart={handleResizeStart}
                    onDelete={handleDeleteField}
                  />
                ))}

              {/* 체크박스 필드 렌더링 */}
              {checkboxFields
                .filter(field => field.page === index + 1)
                .map(field => (
                  <CheckboxField
                    key={field.id}
                    field={field}
                    scale={pdfScale}
                    isDragging={isDragging}
                    dragTarget={dragTarget}
                    onDragStart={handleDragStart}
                    onDelete={handleDeleteField}
                  />
                ))}
            </Box>
          ))}
        </Document>
      </Box>

      {/* 오른쪽 도구 선택 영역 */}
      <Box sx={{ 
        width: 280, 
        bgcolor: 'white', 
        borderLeft: 1, 
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}>
        {/* 상단 영역 */}
        <Box sx={{ p: 2, flex: 1 }}>
          <PdfToolbar 
            selectedTool={selectedTool}
            onToolChange={handleToolChange}
          />
        </Box>

        {/* 하단 버튼 영역 */}
        <Box sx={{ 
          p: 2, 
          borderTop: 1, 
          borderColor: 'divider'
        }}>
          <Button 
            variant="contained" 
            onClick={handleSaveFields}
            fullWidth
            sx={{ 
              py: 1.5,
              bgcolor: '#1976d2',
              '&:hover': {
                bgcolor: '#1565c0'
              }
            }}
          >
            계약서 저장
          </Button>
        </Box>
      </Box>

      <SaveTemplateModal
        open={saveTemplateModalOpen}
        onClose={() => setSaveTemplateModalOpen(false)}
        onSave={handleSaveTemplate}
      />
    </Box>
  );
};

export default PdfViewerPage;
