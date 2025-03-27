import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button,
  Checkbox,
  FormControlLabel,
  TextField,
  Alert,
  Grid,
  Divider,
  IconButton
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// PDF.js 워커 설정
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

/**
 * 관리자용 재서명 요청 컴포넌트
 * 서명된 PDF를 확인하고 재서명이 필요한 필드를 체크하여 재서명 요청
 */
const ContractCorrectionRequest = () => {
  const { contractId, participantId } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const fieldsContainerRef = useRef(null);
  
  // 상태 관리
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contract, setContract] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [fields, setFields] = useState([]);
  const [selectedFields, setSelectedFields] = useState([]);
  const [globalComment, setGlobalComment] = useState('');
  const [fieldComments, setFieldComments] = useState({});
  const [pdfs, setPdfs] = useState([]);
  const [currentPdfIndex, setCurrentPdfIndex] = useState(0);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestResult, setRequestResult] = useState(null);
  
  // PDF 뷰어 관련 상태
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfScale, setPdfScale] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);

  // 계약 정보 및 서명된 PDF 조회
  useEffect(() => {
    const fetchContractAndSignedPdfs = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. 계약 정보 조회
        const contractResponse = await fetch(`http://localhost:8080/api/contracts/${contractId}`);
        if (!contractResponse.ok) {
          throw new Error('계약 정보를 불러오는데 실패했습니다.');
        }
        const contractData = await contractResponse.json();
        setContract(contractData);

        // 2. 참여자 정보 조회
        const participantResponse = await fetch(`http://localhost:8080/api/contracts/${contractId}/participants/${participantId}`);
        if (!participantResponse.ok) {
          throw new Error('참여자 정보를 불러오는데 실패했습니다.');
        }
        const participantData = await participantResponse.json();
        setParticipant(participantData);

        // 3. 템플릿 PDF 목록 설정 - SignaturePdfViewer.js 방식과 동일하게
        if (participantData.templatePdfs && participantData.templatePdfs.length > 0) {
          // 템플릿 PDF 목록 설정
          const pdfData = participantData.templatePdfs.map(template => ({
            id: template.pdfId,
            fileName: template.templateName || '계약서'
          }));
          setPdfs(pdfData);
          
          // 첫 번째 PDF 선택
          await fetchPdfUrl(participantData.templatePdfs[0].pdfId);
          await fetchFields(participantData.templatePdfs[0].pdfId);
        } else if (participantData.pdfId) {
          // 이전 버전 호환성을 위한 코드 (단일 PDF인 경우)
          const pdfData = [{
            id: participantData.pdfId,
            fileName: '계약서'
          }];
          setPdfs(pdfData);
          
          await fetchPdfUrl(participantData.pdfId);
          await fetchFields(participantData.pdfId);
        } else {
          // PDF가 없는 경우
          setPdfs([]);
          setError('PDF 템플릿을 찾을 수 없습니다.');
        }
      } catch (err) {
        console.error('데이터 로딩 중 오류:', err);
        setError(err.message || '데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchContractAndSignedPdfs();
  }, [contractId, participantId]);

  // PDF URL 가져오기
  const fetchPdfUrl = async (pdfId) => {
    try {
      // 서명된 PDF 대신 원본 템플릿 PDF 사용 (SignaturePdfViewer.js와 동일하게)
      setPdfUrl(`http://localhost:8080/api/contract-pdf/view/${pdfId}`);
    } catch (err) {
      console.error('PDF URL 로딩 중 오류:', err);
      setError(err.message);
    }
  };

  // 필드 정보 가져오기
  const fetchFields = async (pdfId) => {
    try {
      // 필드 정보 조회 API 수정
      const response = await fetch(`http://localhost:8080/api/contract-pdf/fields/${pdfId}`);
      if (!response.ok) {
        throw new Error('필드 정보를 가져오는데 실패했습니다.');
      }
      const data = await response.json();
      setFields(data);
    } catch (err) {
      console.error('필드 정보 로딩 중 오류:', err);
      setError(err.message);
    }
  };

  // 필드 선택 처리
  const handleFieldSelection = (fieldId) => {
    setSelectedFields(prev => {
      const newSelectedFields = prev.includes(fieldId)
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId];
      
      // 필드가 새롭게 선택된 경우에만 스크롤 처리
      if (!prev.includes(fieldId) && newSelectedFields.includes(fieldId)) {
        // setTimeout을 사용하여 상태 업데이트 후 스크롤이 실행되도록 함
        setTimeout(() => {
          if (fieldsContainerRef.current) {
            const commentElement = document.getElementById(`field-comment-${fieldId}`);
            if (commentElement) {
              // 필드 컨테이너 내에서의 상대적 위치 계산
              const container = fieldsContainerRef.current;
              const containerRect = container.getBoundingClientRect();
              const elemRect = commentElement.getBoundingClientRect();
              
              // 스크롤 위치 조정 (요소가 컨테이너 중앙에 오도록)
              const offsetTop = elemRect.top - containerRect.top + container.scrollTop - (containerRect.height / 2) + (elemRect.height / 2);
              
              // 부드러운 스크롤 적용
              container.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
              });
            }
          }
        }, 100);
      }
      
      return newSelectedFields;
    });
  };

  // 필드별 코멘트 처리
  const handleFieldCommentChange = (fieldId, comment) => {
    setFieldComments(prev => ({
      ...prev,
      [fieldId]: comment
    }));
  };

  // PDF 전환 처리
  const handleChangePdf = async (index) => {
    setCurrentPdfIndex(index);
    setCurrentPage(1);
    if (pdfs[index]) {
      await fetchPdfUrl(pdfs[index].id);
      await fetchFields(pdfs[index].id);
    }
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
    setPdfScale(prevScale => {
      const newScale = zoomIn ? prevScale + 0.2 : prevScale - 0.2;
      return Math.max(0.6, Math.min(2.5, newScale));
    });
  };

  // 컨테이너 크기 변경 감지 및 스케일 계산 - SignaturePdfViewer.js와 동일하게 구현
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

  // PDF 로드 성공 처리
  const handleDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  // 재서명 요청 처리
  const handleRequestCorrections = async () => {
    if (selectedFields.length === 0) {
      alert('재서명을 요청할 필드를 하나 이상 선택해주세요.');
      return;
    }

    if (!globalComment.trim()) {
      alert('전체 재서명 요청 사유를 입력해주세요.');
      return;
    }

    try {
      setRequestLoading(true);
      setRequestResult(null);

      // 필드별 코멘트 데이터 준비
      const fieldCorrections = Object.entries(fieldComments)
        .filter(([fieldId, _]) => selectedFields.includes(parseInt(fieldId)))
        .map(([fieldId, comment]) => ({
          fieldId: parseInt(fieldId),
          comment
        }));

      // 재서명 요청 API 호출
      const response = await fetch(
        `http://localhost:8080/api/contracts/${contractId}/participants/${participantId}/request-corrections`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          },
          body: JSON.stringify({
            fieldIds: selectedFields,
            correctionComment: globalComment,
            fieldCorrections: fieldCorrections.length > 0 ? fieldCorrections : undefined,
            sendEmail: true
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '재서명 요청 처리 중 오류가 발생했습니다.');
      }

      const data = await response.json();
      
      setRequestResult({
        success: true,
        message: '재서명 요청이 성공적으로 전송되었습니다.',
        data
      });

      // 성공 시 알림 후 계약 상세 페이지로 이동
      alert('재서명 요청이 성공적으로 처리되었습니다. 계약 상세 페이지로 이동합니다.');
      navigate(`/contract-detail/${contractId}`);

    } catch (err) {
      console.error('재서명 요청 중 오류:', err);
      setRequestResult({
        success: false,
        message: err.message || '재서명 요청 처리 중 오류가 발생했습니다.'
      });
    } finally {
      setRequestLoading(false);
    }
  };

  // 필드 하이라이트 렌더링
  const renderFieldHighlights = () => {
    // 현재 페이지에 있는 필드만 필터링
    const currentPageFields = fields.filter(field => field.page === currentPage);
    
    return currentPageFields.map((field) => {
      const isSelected = selectedFields.includes(field.id);
      const isSignature = field.fieldName && field.fieldName.startsWith('signature');
      
      return (
        <div
          key={field.id}
          onClick={() => handleFieldSelection(field.id)}
          style={{
            position: 'absolute',
            left: `${field.relativeX * 100}%`,
            top: `${field.relativeY * 100}%`,
            width: `${field.relativeWidth * 100}%`,
            height: `${field.relativeHeight * 100}%`,
            border: isSelected ? '2px solid #3182F6' : '1px solid rgba(0,0,0,0.2)',
            backgroundColor: isSelected ? 'rgba(49, 130, 246, 0.1)' : 'rgba(0,0,0,0.05)',
            cursor: 'pointer',
            boxSizing: 'border-box',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '12px',
            color: isSelected ? '#3182F6' : '#888',
            zIndex: 2
          }}
        >
          {isSignature && field.value ? (
            <img 
              src={field.value} 
              alt="서명" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '100%', 
                objectFit: 'contain' 
              }} 
            />
          ) : (
            field.value ? field.value : "입력값 없음"
          )}
        </div>
      );
    });
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
        <Typography variant="h6">계약 정보를 불러오는 중입니다...</Typography>
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
            variant="outlined"
            onClick={() => navigate('/contract-list')}
          >
            목록으로 돌아가기
          </Button>
        </Paper>
      </Box>
    );
  }

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
                width: 'fit-content',
                scrollMarginTop: '20px' // 스크롤 시 상단 여백 축소
              }}
            >
              <Page
                pageNumber={index + 1}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                scale={pdfScale || 1}
              />
              {/* 필드 오버레이 - 현재 페이지에 해당하는 필드만 표시 */}
              <Box sx={{ position: 'absolute', inset: 0 }}>
                {fields.filter(field => field.page === index + 1).map((field) => {
                  const isSelected = selectedFields.includes(field.id);
                  const isSignature = field.fieldName && field.fieldName.startsWith('signature');
                  
                  return (
                    <div
                      key={field.id}
                      onClick={() => handleFieldSelection(field.id)}
                      style={{
                        position: 'absolute',
                        left: `${field.relativeX * 100}%`,
                        top: `${field.relativeY * 100}%`,
                        width: `${field.relativeWidth * 100}%`,
                        height: `${field.relativeHeight * 100}%`,
                        border: isSelected ? '2px solid #3182F6' : '1px solid rgba(0,0,0,0.2)',
                        backgroundColor: isSelected ? 'rgba(49, 130, 246, 0.1)' : 'rgba(0,0,0,0.05)',
                        cursor: 'pointer',
                        boxSizing: 'border-box',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontSize: '12px',
                        color: isSelected ? '#3182F6' : '#888',
                        zIndex: 2
                      }}
                    >
                      {isSignature && field.value ? (
                        <img 
                          src={field.value} 
                          alt="서명" 
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '100%', 
                            objectFit: 'contain' 
                          }} 
                        />
                      ) : (
                        field.value ? field.value : "입력값 없음"
                      )}
                    </div>
                  );
                })}
              </Box>
            </Box>
          ))}
        </Document>
      </Box>

      {/* 오른쪽 설정 영역 */}
      <Box sx={{ 
        width: 280, 
        height: '100%',
        bgcolor: 'white', 
        borderLeft: 1, 
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* 스크롤 가능한 콘텐츠 영역 */}
        <Box sx={{ 
          flexGrow: 1,
          overflowY: 'auto',
          p: 2,
          pb: 4,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Box>
            <Typography variant="h6">재서명 요청</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              수정이 필요한 필드를 선택하고 재서명을 요청하세요.
            </Typography>
            
            {/* PDF 선택 */}
            {pdfs.length > 1 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>PDF 선택</Typography>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 1 
                }}>
                  {pdfs.map((pdf, index) => (
                    <Button
                      key={pdf.id}
                      variant={currentPdfIndex === index ? "contained" : "outlined"}
                      onClick={() => handleChangePdf(index)}
                      sx={{ 
                        justifyContent: 'flex-start',
                        backgroundColor: currentPdfIndex === index ? '#3182F6' : 'transparent',
                        '&:hover': {
                          backgroundColor: currentPdfIndex === index ? '#1565C0' : 'rgba(0, 0, 0, 0.04)'
                        },
                      }}
                    >
                      {pdf.fileName || `PDF ${index + 1}`}
                    </Button>
                  ))}
                </Box>
              </Box>
            )}
            
            {/* 선택된 필드 카운터 표시 */}
            <Box sx={{ 
              mt: 3, 
              p: 2, 
              bgcolor: selectedFields.length > 0 ? '#EBF5FF' : '#F5F5F5', 
              borderRadius: 1,
              border: '1px solid',
              borderColor: selectedFields.length > 0 ? '#BFE0FF' : '#E0E0E0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Box>
                <Typography variant="subtitle2">
                  선택된 필드
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  재서명이 필요한 필드 {selectedFields.length}개 선택됨
                </Typography>
              </Box>
              <Box sx={{ 
                bgcolor: selectedFields.length > 0 ? '#3182F6' : '#9E9E9E', 
                color: 'white',
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}>
                {selectedFields.length}
              </Box>
            </Box>
            
            {/* 재서명 요청 필드 선택 */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                재서명 요청 필드 
                <Typography component="span" variant="caption" color="error" sx={{ ml: 0.5 }}>
                  (최소 1개 이상 선택 필수)
                </Typography>
              </Typography>
              <Box 
                ref={fieldsContainerRef}
                sx={{ 
                  border: '1px solid #E0E0E0', 
                  borderRadius: 1, 
                  p: 2,
                  maxHeight: '220px',
                  overflowY: 'auto'
                }}
              >
                {fields.length > 0 ? (
                  fields.map((field) => (
                    <Box 
                      key={field.id} 
                      sx={{
                        mb: 2,
                        pb: 2,
                        borderBottom: '1px solid #f0f0f0',
                        '&:last-child': {
                          mb: 0,
                          pb: 0,
                          borderBottom: 'none'
                        }
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedFields.includes(field.id)}
                            onChange={() => handleFieldSelection(field.id)}
                            sx={{ 
                              color: '#3182F6',
                              '&.Mui-checked': {
                                color: '#3182F6',
                              },
                            }}
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {field.fieldName && field.fieldName.startsWith('signature') && field.value ? (
                                <Box sx={{ 
                                  width: '80px',
                                  height: '40px',
                                  display: 'flex',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  border: '1px solid #E0E0E0',
                                  borderRadius: '4px',
                                  p: 0.5,
                                  mr: 1,
                                  bgcolor: '#f9f9f9'
                                }}>
                                  <img 
                                    src={field.value} 
                                    alt="서명" 
                                    style={{ 
                                      maxWidth: '100%', 
                                      maxHeight: '100%', 
                                      objectFit: 'contain' 
                                    }} 
                                  />
                                </Box>
                              ) : (
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {field.value || "입력값 없음"}
                                </Typography>
                              )}
                            </Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5 }}>
                              {field.fieldName && field.fieldName.startsWith('signature') ? '서명 필드' : 
                               field.fieldName && field.fieldName.startsWith('text') ? '텍스트 필드' : 
                               field.fieldName && field.fieldName.startsWith('checkbox') ? '체크박스 필드' : '필드'}
                            </Typography>
                          </Box>
                        }
                      />
                      
                      {/* 선택된 필드에 대한 코멘트 입력 필드 */}
                      {selectedFields.includes(field.id) && (
                        <Box 
                          id={`field-comment-${field.id}`}
                          sx={{ ml: 4, mt: 1 }}
                        >
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                            이 필드에 대한 수정 요청 사유:
                          </Typography>
                          <TextField
                            placeholder="예: 서명이 필요합니다 / 정확한 정보를 입력해주세요"
                            value={fieldComments[field.id] || ''}
                            onChange={(e) => handleFieldCommentChange(field.id, e.target.value)}
                            fullWidth
                            multiline
                            rows={2}
                            size="small"
                            sx={{ 
                              fontSize: '0.85rem',
                              '.MuiInputBase-root': {
                                backgroundColor: '#f5f5f5',
                              }
                            }}
                          />
                        </Box>
                      )}
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    선택 가능한 필드가 없습니다.
                  </Typography>
                )}
              </Box>
            </Box>
            
            {/* 전체 재서명 사유 입력 */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                전체 재서명 요청 사유
                <Typography component="span" variant="caption" color="error" sx={{ ml: 0.5 }}>
                  (필수)
                </Typography>
              </Typography>
              <TextField
                placeholder="전체 재서명 요청 사유를 입력하세요"
                value={globalComment}
                onChange={(e) => setGlobalComment(e.target.value)}
                fullWidth
                multiline
                rows={3}
                size="small"
                required
                error={requestLoading && !globalComment.trim()}
                helperText={requestLoading && !globalComment.trim() ? "전체 재서명 요청 사유를 입력해주세요" : ""}
                sx={{ mb: 2 }}
              />
            </Box>
          </Box>
          
          {/* 요청 결과 메시지 */}
          {requestResult && (
            <Alert 
              severity={requestResult.success ? "success" : "error"}
              sx={{ my: 2 }}
            >
              {requestResult.message}
            </Alert>
          )}
        </Box>
        
        {/* 하단 고정 버튼 영역 */}
        <Box sx={{ 
          p: 2,
          borderTop: '1px solid #EEEEEE',
          bgcolor: 'white'
        }}>
          <Button
            variant="contained"
            onClick={handleRequestCorrections}
            disabled={requestLoading || selectedFields.length === 0}
            fullWidth
            sx={{
              backgroundColor: '#3182F6',
              '&:hover': {
                backgroundColor: '#1565C0',
              },
              py: 1,
              borderRadius: '8px',
              fontWeight: 500,
              mb: 1.5
            }}
          >
            {requestLoading ? (
              <>
                <CircularProgress size={24} sx={{ color: 'white', mr: 1 }} />
                처리 중...
              </>
            ) : (
              '재서명 요청하기'
            )}
          </Button>
          
          <Button
            variant="outlined"
            onClick={() => navigate(`/contract-detail/${contractId}`)}
            fullWidth
            sx={{
              borderColor: '#E0E0E0',
              color: '#666',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                borderColor: '#CCCCCC',
              },
              py: 1,
              borderRadius: '8px'
            }}
          >
            뒤로 가기
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ContractCorrectionRequest; 
