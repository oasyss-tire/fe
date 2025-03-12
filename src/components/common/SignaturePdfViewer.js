import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Checkbox, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert } from '@mui/material';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import SignatureModal from './fields/SignatureModal';
import TextInputModal from './fields/TextInputModal';
import SaveIcon from '@mui/icons-material/Save';

// PDF.js 워커 설정
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// AuthenticationDialog를 메인 컴포넌트 밖으로 분리하고 React.memo로 감싸기
const AuthenticationDialog = React.memo(({ 
  open, 
  phoneInput, 
  authError, 
  onPhoneChange, 
  onVerify 
}) => (
  <Dialog 
    open={open} 
    maxWidth="xs" 
    fullWidth
    disableEscapeKeyDown
  >
    <DialogTitle sx={{ pb: 1 }}>
      본인 인증
    </DialogTitle>
    <DialogContent>
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
          계약서 서명을 위해 본인 인증이 필요합니다.<br />
          등록된 휴대폰 번호의 뒷자리 4자리를 입력해주세요.
        </Typography>
        <TextField
          fullWidth
          label="휴대폰 번호 뒷자리 4자리"
          value={phoneInput}
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9]/g, '');
            if (value.length <= 4) {
              onPhoneChange(value);
            }
          }}
          error={!!authError}
          helperText={authError}
          size="small"
          autoFocus
        />
      </Box>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 3 }}>
      <Button 
        onClick={onVerify}
        variant="contained"
        fullWidth
      >
        인증하기
      </Button>
    </DialogActions>
  </Dialog>
));

const SignaturePdfViewer = () => {
  const { contractId, participantId } = useParams();
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfScale, setPdfScale] = useState(null);
  const [fields, setFields] = useState([]);
  const containerRef = useRef(null);
  const [selectedField, setSelectedField] = useState(null);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [textModalOpen, setTextModalOpen] = useState(false);
  const [participant, setParticipant] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(true);
  const [phoneInput, setPhoneInput] = useState('');
  const [authError, setAuthError] = useState('');

  // 참여자 정보 조회
  useEffect(() => {
    const fetchParticipantInfo = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/contracts/${contractId}/participants/${participantId}`
        );
        if (response.ok) {
          const data = await response.json();
          setParticipant(data);
          
          // 참여자의 PDF 필드 정보 조회
          if (data.pdfId) {
            const fieldsResponse = await fetch(`http://localhost:8080/api/contract-pdf/fields/${data.pdfId}`);
            if (!fieldsResponse.ok) throw new Error('필드 정보 조회 실패');
            const fieldsData = await fieldsResponse.json();
            setFields(fieldsData);
          }
        }
      } catch (error) {
        console.error('참여자 정보 조회 실패:', error);
      }
    };
    
    fetchParticipantInfo();
  }, [contractId, participantId]);

  // pdfId에서 원본 ID 추출
  const getOriginalPdfId = (pdfId) => {
    return pdfId.replace('_with_fields.pdf', '.pdf');
  };

  // 필드 정보 가져오기 - participant.pdfId 사용
  const fetchFields = async (pdfId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/contract-pdf/fields/${pdfId}`);
      if (!response.ok) throw new Error('Failed to fetch fields');
      const data = await response.json();
      setFields(data);
    } catch (error) {
      console.error('Error fetching fields:', error);
    }
  };

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
        setSelectedField(field);
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
      const originalPdfId = getOriginalPdfId(participant.pdfId);
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
      await fetchFields(participant.pdfId);
    } catch (error) {
      console.error('Error saving signature:', error);
    }
  };

  // 텍스트 저장 핸들러
  const handleTextSave = async (text) => {
    try {
      const originalPdfId = getOriginalPdfId(participant.pdfId);
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
      await fetchFields(participant.pdfId); // 필드 목록 새로고침
    } catch (error) {
      console.error('Error saving text:', error);
    }
  };

  // 체크박스 변경 핸들러
  const handleCheckboxChange = async (field) => {
    try {
      const originalPdfId = getOriginalPdfId(participant.pdfId);
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
      await fetchFields(participant.pdfId);
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
      if (!participant?.pdfId) throw new Error('PDF 정보가 없습니다.');

      // 1. 서명된 PDF 생성
      const response = await fetch(
        `http://localhost:8080/api/contract-pdf/download-signed/${participant.pdfId}`,
        { method: 'POST' }
      );

      if (!response.ok) throw new Error('서명 저장 실패');

      // 2. 서명 완료 상태 업데이트
      await fetch(`http://localhost:8080/api/contracts/${contractId}/participants/${participantId}/sign`, {
        method: 'POST'
      });

      alert('서명이 완료되었습니다.');
      window.location.href = `/contract-detail/${contractId}`;
      
    } catch (error) {
      console.error('Error saving signature:', error);
      alert('서명 저장 중 오류가 발생했습니다.');
    }
  };

  // 전화번호 입력 핸들러를 useCallback으로 감싸기
  const handlePhoneInputChange = React.useCallback((value) => {
    setPhoneInput(value);
  }, []);

  // 인증 핸들러를 useCallback으로 감싸기
  const handlePhoneVerification = React.useCallback(async () => {
    try {
      if (phoneInput.length !== 4) {
        setAuthError('휴대폰 번호 뒷자리 4자리를 입력해주세요.');
        return;
      }

      const response = await fetch(
        `http://localhost:8080/api/contracts/${contractId}/participants/${participantId}/verify`, 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneLastDigits: phoneInput
          })
        }
      );

      if (response.ok) {
        setIsAuthenticated(true);
        setShowAuthDialog(false);
        setAuthError('');
      } else {
        const errorData = await response.json();
        setAuthError(errorData.message || '인증에 실패했습니다.');
      }
    } catch (error) {
      console.error('인증 처리 중 오류:', error);
      setAuthError('인증 처리 중 오류가 발생했습니다.');
    }
  }, [phoneInput, contractId, participantId]);

  // 인증되지 않은 경우의 렌더링
  if (!isAuthenticated) {
    return (
      <Box sx={{ p: 3 }}>
        <AuthenticationDialog 
          open={showAuthDialog}
          phoneInput={phoneInput}
          authError={authError}
          onPhoneChange={handlePhoneInputChange}
          onVerify={handlePhoneVerification}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh',  // 전체 높이로 변경
      bgcolor: '#f5f5f5',
      position: 'fixed', // 전체 화면 고정
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1200 // 사이드바 위에 표시
    }}>
      {/* 왼쪽 썸네일 영역 */}
      <Box 
        sx={{ 
          width: '200px',
          minWidth: '200px',
          height: '100%', // 전체 높이
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
          file={participant?.pdfId ? 
            `http://localhost:8080/api/contract-pdf/view/${participant.pdfId}` : 
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
          height: '100%', // 전체 높이
          overflowY: 'auto',
          p: 4,
          bgcolor: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <Document
          file={participant?.pdfId ? 
            `http://localhost:8080/api/contract-pdf/view/${participant.pdfId}` : 
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
        height: '100%',
        bgcolor: 'white', 
        borderLeft: 1, 
        borderColor: 'divider',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'  // 상단과 하단 사이 공간 분배
      }}>
        <Typography variant="h6">서명하기</Typography>
        
        {/* 버튼을 하단에 배치하기 위한 컨테이너 */}
        <Box sx={{ mb: 2 }}>  {/* 하단 여백 추가 */}
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSavePdf}
            fullWidth
            sx={{
              px: 4,
              py: 1,  // 높이 줄임 (1.5 -> 1)
              backgroundColor: '#1976d2',
              '&:hover': {
                backgroundColor: '#1565c0',
              },
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          >
            서명 완료
          </Button>
        </Box>
      </Box>

      {/* 모달 유지 */}
      <SignatureModal
        open={signatureModalOpen}
        onClose={() => setSignatureModalOpen(false)}
        onSave={handleSignatureSave}
      />
      
      <TextInputModal
        open={textModalOpen}
        onClose={() => {
          setTextModalOpen(false);
          setSelectedField(null);
        }}
        onSave={(text) => {
          handleTextSave(text);
          setTextModalOpen(false);
          setSelectedField(null);
        }}
        initialValue={selectedField?.value || ''}
      />
    </Box>
  );
};

export default SignaturePdfViewer;
