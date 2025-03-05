import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Checkbox, Button } from '@mui/material';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import SignatureModal from './fields/SignatureModal';
import TextInputModal from './fields/TextInputModal';
import SaveIcon from '@mui/icons-material/Save';

// PDF.js 워커 설정
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const SignaturePdfViewer = () => {
  const { pdfId } = useParams();
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfScale, setPdfScale] = useState(null);
  const [fields, setFields] = useState([]);
  const containerRef = useRef(null);
  const [selectedField, setSelectedField] = useState(null);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [textModalOpen, setTextModalOpen] = useState(false);

  // pdfId에서 원본 ID 추출
  const getOriginalPdfId = (pdfId) => {
    return pdfId.replace('_with_fields.pdf', '.pdf');
  };

  // 필드 정보 가져오기
  const fetchFields = async () => {
    try {
      const originalPdfId = getOriginalPdfId(pdfId);
      const response = await fetch(`http://localhost:8080/api/contract-pdf/fields/${originalPdfId}`);
      if (!response.ok) throw new Error('Failed to fetch fields');
      const data = await response.json();
      setFields(data);
    } catch (error) {
      console.error('Error fetching fields:', error);
    }
  };

  useEffect(() => {
    fetchFields();
  }, [pdfId]);

  // 필드 렌더링 컴포넌트
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
          border: '1px dashed',
          borderColor: field.type === 'signature' ? 'error.main' : 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          backgroundColor: field.value ? 'rgba(254, 217, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
        }}
        onClick={() => handleFieldClick(field)}
      >
        {field.type === 'checkbox' && (
          <Checkbox
            checked={field.value === 'true'}
            onChange={(e) => handleCheckboxChange(field)}
            onClick={(e) => e.stopPropagation()}
            sx={{ p: 0 }}
          />
        )}
        {field.value && field.type === 'signature' && (
          <img src={field.value} alt="서명" style={{ maxWidth: '100%', maxHeight: '100%' }} />
        )}
        {field.value && field.type === 'text' && (
          <Typography variant="body2">{field.value}</Typography>
        )}
      </Box>
    );
  };

  // 필드 클릭 핸들러
  const handleFieldClick = (field) => {
    setSelectedField(field);
    switch (field.type) {
      case 'signature':
        setSignatureModalOpen(true);
        break;
      case 'text':
        setTextModalOpen(true);
        break;
      case 'checkbox':
        handleCheckboxChange(field);
        break;
      default:
        break;
    }
  };

  // 서명 저장 핸들러
  const handleSignatureSave = async (signatureData) => {
    try {
      const originalPdfId = getOriginalPdfId(pdfId);
      const response = await fetch(
        `http://localhost:8080/api/contract-pdf/fields/${originalPdfId}/value?fieldName=${selectedField.fieldName}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'signature',
            value: signatureData
          })
        }
      );
      if (!response.ok) throw new Error('Failed to save signature');
      await fetchFields();
    } catch (error) {
      console.error('Error saving signature:', error);
    }
  };

  // 텍스트 저장 핸들러
  const handleTextSave = async (text) => {
    try {
      const originalPdfId = getOriginalPdfId(pdfId);
      const response = await fetch(
        `http://localhost:8080/api/contract-pdf/fields/${originalPdfId}/value?fieldName=${selectedField.fieldName}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'text',
            value: text
          })
        }
      );
      if (!response.ok) throw new Error('Failed to save text');
      await fetchFields(); // 필드 목록 새로고침
    } catch (error) {
      console.error('Error saving text:', error);
    }
  };

  // 체크박스 변경 핸들러
  const handleCheckboxChange = async (field) => {
    try {
      const originalPdfId = getOriginalPdfId(pdfId);
      const newValue = field.value === 'true' ? 'false' : 'true';
      
      const response = await fetch(
        `http://localhost:8080/api/contract-pdf/fields/${originalPdfId}/value?fieldName=${field.fieldName}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'checkbox',
            value: newValue
          })
        }
      );
      
      if (!response.ok) throw new Error('Failed to save checkbox');
      await fetchFields();
    } catch (error) {
      console.error('Error saving checkbox:', error);
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
      const finalScale = Math.min(Math.max(baseScale, 0.8), 1.2);
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

  // 썸네일 클릭 시 해당 페이지로 스크롤
  const scrollToPage = (pageNumber) => {
    const pageElement = document.getElementById(`page-${pageNumber}`);
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: 'smooth' });
    }
    setCurrentPage(pageNumber);
  };

  // PDF 저장 핸들러
  const handleSavePdf = async () => {
    try {
      const originalPdfId = getOriginalPdfId(pdfId);
      const response = await fetch(`http://localhost:8080/api/contract-pdf/download-signed/${originalPdfId}`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to save PDF');
      }

      // 파일 다운로드 처리
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = originalPdfId.replace('.pdf', '_signed.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      // 성공 메시지 표시
      alert('PDF가 성공적으로 저장되었습니다.');
      
    } catch (error) {
      console.error('Error saving PDF:', error);
      alert('PDF 저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', bgcolor: '#f5f5f5' }}>
        {/* 왼쪽 썸네일 영역 */}
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
            file={`http://localhost:8080/api/contract-pdf/view/${pdfId}`}
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

        {/* 중앙 PDF 뷰어 영역 */}
        <Box 
          ref={containerRef}
          sx={{ 
            flex: '1 1 auto',
            overflowY: 'auto',
            p: 4,
            bgcolor: '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <Document
            file={`http://localhost:8080/api/contract-pdf/view/${pdfId}`}
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
                {/* 필드 오버레이 */}
                <Box sx={{ position: 'absolute', inset: 0 }}>
                  {fields.map(field => renderField(field, index + 1))}
                </Box>
              </Box>
            ))}
          </Document>
        </Box>

        {/* 오른쪽 저장 영역 */}
        <Box sx={{ 
          width: 280, 
          bgcolor: 'white', 
          borderLeft: 1, 
          borderColor: 'divider',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}>
          <Typography variant="h6">문서 저장</Typography>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSavePdf}
            fullWidth
          >
            PDF 저장하기
          </Button>
        </Box>
      </Box>
      
      <SignatureModal
        open={signatureModalOpen}
        onClose={() => setSignatureModalOpen(false)}
        onSave={handleSignatureSave}
      />
      
      <TextInputModal
        open={textModalOpen}
        onClose={() => setTextModalOpen(false)}
        onSave={handleTextSave}
        initialValue={selectedField?.value}
      />
    </>
  );
};

export default SignaturePdfViewer;
