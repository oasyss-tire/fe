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
import { usePdf } from '../../contexts/PdfContext';
import PdfToolbar from './PdfToolbar';
import { TextField, SignatureField, CheckboxField, ConfirmTextField } from '../common/fields/PdfField';
import SaveTemplateModal from '../common/modals/SaveTemplateModal';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import ConfirmTextInputModal from '../common/fields/ConfirmTextInputModal';
import TextDescriptionModal from '../common/fields/TextDescriptionModal';

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
  const [confirmTextFields, setConfirmTextFields] = useState([]);
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
  const [activeConfirmFieldId, setActiveConfirmFieldId] = useState(null);
  const [confirmTextModalOpen, setConfirmTextModalOpen] = useState(false);
  const [textDescriptionModalOpen, setTextDescriptionModalOpen] = useState(false);
  const [activeTextFieldId, setActiveTextFieldId] = useState(null);
  
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
      setConfirmTextFields(convertedFields.filter(f => f.type === 'confirmText'));
    }
  };

  const handleToolChange = (event, newTool) => {
    if (selectedTool === newTool) {
      setSelectedTool(null);
      return;
    }

    setSelectedTool(newTool);
    if (newTool === 'text' || newTool === 'signature' || newTool === 'checkbox' || newTool === 'confirmText') {
      setIsPlacing(true);
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
    
    // 필드 타입에 따라 다른 크기 설정
    const width = selectedTool === 'checkbox' ? 20 * scale :
                 selectedTool === 'signature' ? 100 * scale :
                 selectedTool === 'confirmText' ? 250 * scale : 150 * scale;
                 
    const height = selectedTool === 'checkbox' ? 20 * scale :
                  selectedTool === 'signature' ? 60 * scale :
                  selectedTool === 'confirmText' ? 50 * scale : 30 * scale;
    
    setMousePosition({
      x: e.clientX,
      y: e.clientY,
      width,
      height,
      previewX: relativeX,
      previewY: relativeY
    });
  };

  // PDF 영역 클릭 시 필드 추가
  const handlePdfClick = (e) => {
    if (!isPlacing || !selectedTool) return;

    const pageElement = e.target.closest('.react-pdf__Page');
    if (!pageElement) return;

    const pageContainer = pageElement.closest('[id^="page-"]');
    if (!pageContainer) return;
    
    const pageNumber = parseInt(pageContainer.id.split('-')[1]);
    const pageRect = pageElement.getBoundingClientRect();
    
    const scale = pdfScale || 1;
    const relativeX = (e.clientX - pageRect.left) / scale;
    const relativeY = (e.clientY - pageRect.top) / scale;

    const newField = {
      id: `${selectedTool}-${Date.now()}`,
      x: relativeX,
      y: relativeY,
      width: selectedTool === 'checkbox' ? 20 / scale : 
             selectedTool === 'signature' ? 100 / scale :
             selectedTool === 'confirmText' ? 250 / scale : 150 / scale,
      height: selectedTool === 'checkbox' ? 20 / scale : 
              selectedTool === 'signature' ? 60 / scale : 
              selectedTool === 'confirmText' ? 50 / scale : 30 / scale,
      value: '',
      page: pageNumber,
      type: selectedTool
    };

    if (selectedTool === 'text') {
      setTextFields(prev => [...prev, newField]);
      setActiveTextFieldId(newField.id);
      setTextDescriptionModalOpen(true);
    } else if (selectedTool === 'signature') {
      setSignatureFields(prev => [...prev, newField]);
    } else if (selectedTool === 'checkbox') {
      setCheckboxFields(prev => [...prev, newField]);
    } else if (selectedTool === 'confirmText') {
      // confirmText 필드는 즉시 추가하고 빈 값으로 시작
      const confirmField = {
        ...newField,
        confirmText: '', // 관리자가 입력할 빈 값
        isEditMode: true // 관리자 모드 표시
      };
      
      // 그냥 바로 필드 추가
      setConfirmTextFields(prev => [...prev, confirmField]);
    }

    setIsPlacing(false);
    setSelectedTool(null);
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

    setConfirmTextFields(prev => prev.map(field => {
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
    
    // 텍스트 필드와 서명 필드, confirmText 필드 검색
    const field = textFields.find(f => f.id === fieldId) || 
                  signatureFields.find(f => f.id === fieldId) ||
                  confirmTextFields.find(f => f.id === fieldId);
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

    // 텍스트 필드 리사이즈
    setTextFields(prev => prev.map(field => {
      if (field.id === resizeTarget) {
        return {
          ...field,
          width: Math.max(30, resizeStartPos.current.width + dx),
          height: Math.max(10, resizeStartPos.current.height + dy)
        };
      }
      return field;
    }));

    // 서명 필드 리사이즈
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

    // 확인 텍스트 필드 리사이즈
    setConfirmTextFields(prev => prev.map(field => {
      if (field.id === resizeTarget) {
        return {
          ...field,
          width: Math.max(100, resizeStartPos.current.width + dx),
          height: Math.max(30, resizeStartPos.current.height + dy)
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

  // 필드 삭제
  const handleDeleteField = (e, fieldId) => {
    e.stopPropagation();
    setTextFields(prev => prev.filter(field => field.id !== fieldId));
    setSignatureFields(prev => prev.filter(field => field.id !== fieldId));
    setCheckboxFields(prev => prev.filter(field => field.id !== fieldId));
    setConfirmTextFields(prev => prev.filter(field => field.id !== fieldId));
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
      
      // 저장 전 빈 confirmText 필드 필터링 (관리자가 텍스트를 입력하지 않은 필드는 저장 안 함)
      const filteredConfirmTextFields = confirmTextFields.filter(field => field.confirmText?.trim() !== '');
      
      const allFields = [
        ...textFields,
        ...signatureFields,
        ...checkboxFields,
        ...filteredConfirmTextFields
      ].map(field => ({
        id: field.id,
        type: field.type,
        fieldName: `${field.type}${field.id.split('-')[1]}`,
        relativeX: field.x / pageWidth,
        relativeY: field.y / pageHeight,
        relativeWidth: (field.width * scale) / pageWidth,
        relativeHeight: (field.height * scale) / pageHeight,
        page: field.page || 1,
        value: field.value || '',
        // confirmText 필드 타입인 경우 confirmText 속성 추가
        ...(field.type === 'confirmText' ? { confirmText: field.confirmText } : {}),
        // description 속성이 있으면 추가
        ...(field.description ? { description: field.description } : {}),
        // formatCodeId 속성이 있으면 추가
        ...(field.formatCodeId ? { formatCodeId: field.formatCodeId } : {})
      }));

      // 디버깅용 로그
      console.log('저장할 필드 목록:', allFields);

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

  // 따라쓰기 모달 열기 함수
  const handleOpenConfirmTextModal = (fieldId) => {
    console.log('handleOpenConfirmTextModal 호출됨:', fieldId);
    
    // activeConfirmFieldId가 이미 설정되어 있더라도 새로운 필드 ID로 업데이트
    setActiveConfirmFieldId(fieldId);
    
    // 해당 필드 찾기
    const field = confirmTextFields.find(f => f.id === fieldId);
    console.log('열려는 필드:', field);
    
    // 모달 열기
    setConfirmTextModalOpen(true);
  };

  const handleCloseConfirmTextModal = () => {
    console.log('모달 닫기');
    setConfirmTextModalOpen(false);
    setActiveConfirmFieldId(null);
    
    // 모달이 닫힐 때 빈 confirmText가 있는 필드는 삭제
    setConfirmTextFields(prev => {
      const filtered = prev.filter(field => field.confirmText?.trim() !== '');
      console.log('필터링 후 남은 필드:', filtered.length);
      return filtered;
    });
  };

  // 따라쓰기 텍스트 업데이트 함수 수정
  const handleConfirmTextInput = (fieldId, inputText) => {
    console.log('텍스트 업데이트:', fieldId, inputText);
    
    // 관리자 모드에서는 confirmText를 업데이트, 사용자 모드에서는 value를 업데이트
    setConfirmTextFields(prev => 
      prev.map(field => {
        if (field.id === fieldId) {
          if (field.isEditMode) {
            // 관리자 모드: confirmText 업데이트
            console.log('관리자 모드로 업데이트:', inputText);
            return { ...field, confirmText: inputText };
          } else {
            // 사용자 모드: value 업데이트
            console.log('사용자 모드로 업데이트:', inputText);
            return { ...field, value: inputText };
          }
        }
        return field;
      })
    );
  };

  // 텍스트 필드 클릭 처리 함수 추가
  const handleTextFieldClick = (fieldId) => {
    console.log('텍스트 필드 클릭됨:', fieldId);
    setActiveTextFieldId(fieldId);
    setTextDescriptionModalOpen(true);
  };

  // 텍스트 필드 설명 저장 함수 수정
  const handleTextDescriptionSave = (description, formatCodeId) => {
    console.log('텍스트 필드 설명 저장:', activeTextFieldId, description, formatCodeId);
    
    // 형식 이름을 가져오기 위한 API 호출
    const fetchFormatName = async (codeId) => {
      if (!codeId) return null;
      
      try {
        // 이미 선택한 형식 옵션 목록에서 해당 코드ID의 이름을 찾기
        const response = await fetch('http://localhost:8080/api/codes/field-formats');
        if (!response.ok) return null;
        
        const formats = await response.json();
        const format = formats.find(f => f.codeId === codeId);
        return format ? format.codeName : null;
      } catch (error) {
        console.error('형식 이름 조회 중 오류:', error);
        return null;
      }
    };
    
    // 텍스트 필드 업데이트
    const updateTextField = async () => {
      // 형식 ID가 있는 경우 형식 이름 조회
      let formatName = null;
      if (formatCodeId) {
        formatName = await fetchFormatName(formatCodeId);
      }
      
      setTextFields(prev => 
        prev.map(field => {
          if (field.id === activeTextFieldId) {
            return { 
              ...field, 
              description,
              formatCodeId,
              formatName
            };
          }
          return field;
        })
      );
    };
    
    updateTextField();
    setTextDescriptionModalOpen(false);
    setActiveTextFieldId(null);
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
          cursor: isPlacing ? 
            (selectedTool === 'text' ? 'text' : 
             selectedTool === 'signature' ? 'cell' : 
             selectedTool === 'checkbox' ? 'pointer' : 
             selectedTool === 'confirmText' ? 'text' : 'default') 
            : 'default'
        }}
      >
        {/* 마우스 따라다니는 필드 프리뷰 */}
        {isPlacing && mousePosition && (
          <Box
            sx={{
              position: 'fixed',
              left: mousePosition.x,
              top: mousePosition.y,
              width: selectedTool === 'checkbox' ? '20px' : 
                     selectedTool === 'signature' ? '100px' : 
                     selectedTool === 'confirmText' ? '250px' : '150px',
              height: selectedTool === 'checkbox' ? '20px' : 
                      selectedTool === 'signature' ? '60px' : 
                      selectedTool === 'confirmText' ? '50px' : '30px',
              border: '1px dashed',
              borderColor: selectedTool === 'signature' ? '#f44336' :
                          selectedTool === 'confirmText' ? '#f57c00' : '#1976d2',
              backgroundColor: selectedTool === 'signature' ? 'rgba(244, 67, 54, 0.1)' :
                              selectedTool === 'confirmText' ? 'rgba(245, 124, 0, 0.1)' : 'rgba(25, 118, 210, 0.1)',
              pointerEvents: 'none',
              zIndex: 1000,
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {selectedTool === 'checkbox' && (
              <CheckBoxOutlineBlankIcon sx={{ fontSize: '16px', color: 'rgba(25, 118, 210, 0.6)' }} />
            )}
            {selectedTool === 'confirmText' && (
              <Typography variant="caption" sx={{ fontSize: '8px', color: 'rgba(245, 124, 0, 0.8)', p: 1 }}>
                서명문구 필드
              </Typography>
            )}
          </Box>
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
                    onDragStart={(e) => handleDragStart(e, field.id)}
                    onResizeStart={(e) => handleResizeStart(e, field.id)}
                    onDelete={(e) => handleDeleteField(e, field.id)}
                    onFieldClick={handleTextFieldClick}
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
                    onDragStart={(e) => handleDragStart(e, field.id)}
                    onResizeStart={(e) => handleResizeStart(e, field.id)}
                    onDelete={(e) => handleDeleteField(e, field.id)}
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
                    onDragStart={(e) => handleDragStart(e, field.id)}
                    onDelete={(e) => handleDeleteField(e, field.id)}
                  />
                ))}

              {/* 확인 텍스트 필드 렌더링 */}
              {confirmTextFields
                .filter(field => field.page === index + 1)
                .map(field => (
                  <ConfirmTextField
                    key={field.id}
                    field={field}
                    scale={pdfScale}
                    isDragging={isDragging}
                    dragTarget={dragTarget}
                    onDragStart={(e) => handleDragStart(e, field.id)}
                    onResizeStart={(e) => handleResizeStart(e, field.id)}
                    onDelete={(e) => handleDeleteField(e, field.id)}
                    onInputSave={(inputText) => handleConfirmTextInput(field.id, inputText)}
                    onFieldClick={() => {
                      console.log('onFieldClick 호출됨:', field.id);
                      handleOpenConfirmTextModal(field.id);
                    }}
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
      
      {/* 따라쓰기 입력 모달 */}
      <ConfirmTextInputModal
        open={confirmTextModalOpen}
        onClose={handleCloseConfirmTextModal}
        onSave={(inputText) => {
          console.log('onSave 호출됨:', inputText);
          if (activeConfirmFieldId) {
            handleConfirmTextInput(activeConfirmFieldId, inputText);
          }
        }}
        onUpdate={(originalText) => {
          console.log('onUpdate 호출됨:', originalText);
          if (activeConfirmFieldId) {
            handleConfirmTextInput(activeConfirmFieldId, originalText);
          }
        }}
        field={confirmTextFields.find(field => field.id === activeConfirmFieldId)}
      />
      
      {/* 텍스트 필드 설명 입력 모달 */}
      <TextDescriptionModal
        open={textDescriptionModalOpen}
        onClose={() => {
          setTextDescriptionModalOpen(false);
          setActiveTextFieldId(null);
        }}
        onSave={handleTextDescriptionSave}
        field={textFields.find(field => field.id === activeTextFieldId)}
      />
    </Box>
  );
};

export default PdfViewerPage;
