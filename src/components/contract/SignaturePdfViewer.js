import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Checkbox, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Paper, Stepper, Step, StepLabel } from '@mui/material';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import SignatureModal from '../common/fields/SignatureModal';
import TextInputModal from '../common/fields/TextInputModal';
import SaveIcon from '@mui/icons-material/Save';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';

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
      본인 인증
    </DialogTitle>
    <DialogContent sx={{ p: 3 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ mb: 2, mt: 2, color: '#666' }}>
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
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: !!authError ? '#FF4D4F' : '#E0E0E0',
              },
              '&:hover fieldset': {
                borderColor: !!authError ? '#FF4D4F' : '#BDBDBD',
              },
              '&.Mui-focused fieldset': {
                borderColor: !!authError ? '#FF4D4F' : '#3182F6',
              },
            },
          }}
        />
      </Box>
    </DialogContent>
    <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #F0F0F0', justifyContent: 'center' }}>
      <Button 
        onClick={onVerify}
        variant="contained"
        fullWidth
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
          py: 1
        }}
      >
        인증하기
      </Button>
    </DialogActions>
  </Dialog>
));

const SignaturePdfViewer = () => {
  // URL 파라미터와 쿼리 파라미터 모두 가져오기
  const { contractId: urlContractId, participantId: urlParticipantId } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');
  
  const navigate = useNavigate();
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
  const [loading, setLoading] = useState(false);
  
  // 실제 사용할 계약ID와 참여자ID 상태 추가
  const [contractId, setContractId] = useState(urlContractId);
  const [participantId, setParticipantId] = useState(urlParticipantId);
  const [tokenVerified, setTokenVerified] = useState(false);
  
  // 다중 템플릿 관련 상태 추가
  const [currentTemplateIndex, setCurrentTemplateIndex] = useState(0);
  const [completedTemplates, setCompletedTemplates] = useState([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // 토큰이 있는 경우 토큰 검증 추가
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) return;
      
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8080/api/signature/verify-token?token=${token}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (!data.isValid) {
            alert('유효하지 않은 토큰입니다. 다시 시도해주세요.');
            return;
          }
          
          // 토큰에서 계약ID와 참여자ID 설정
          setContractId(data.contractId);
          setParticipantId(data.participantId);
          setTokenVerified(true);
          
          // 이미 서명된 경우 바로 인증 상태로 설정
          if (data.isSigned) {
            alert('이미 서명이 완료된 계약서입니다.');
            // 계약 상세 페이지로 이동
            navigate(`/contract-detail/${data.contractId}`);
            return;
          }
        } else {
          alert('토큰 검증에 실패했습니다. 유효하지 않은 링크입니다.');
        }
      } catch (error) {
        console.error('토큰 검증 오류:', error);
        alert('토큰 검증 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    if (token) {
      verifyToken();
    }
  }, [token, navigate]);

  // 계약 정보 및 참여자 정보 조회 수정
  useEffect(() => {
    // 직접 URL의 계약ID, 참여자ID가 있거나 토큰 검증이 완료된 경우에만 실행
    if ((!contractId || !participantId) && !tokenVerified) return;
    
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // 1. 계약 전체 정보 조회
        const contractResponse = await fetch(`http://localhost:8080/api/contracts/${contractId}`);
        if (!contractResponse.ok) throw new Error('계약 정보 조회 실패');
        const contractData = await contractResponse.json();
        
        // 2. 참여자 정보 조회
        const participantResponse = await fetch(
          `http://localhost:8080/api/contracts/${contractId}/participants/${participantId}`
        );
        if (!participantResponse.ok) throw new Error('참여자 정보 조회 실패');
        const participantData = await participantResponse.json();
        
        // 3. 참여자 정보 상태 설정 (중요: fetchTemplateStatus 전에 실행)
        setParticipant(participantData);
        
        // 4. 첫 번째 템플릿의 필드 정보 조회
        if (participantData.templatePdfs && participantData.templatePdfs.length > 0) {
          const firstTemplatePdf = participantData.templatePdfs[0];
          await fetchFields(firstTemplatePdf.pdfId);
        }
        
      } catch (error) {
        console.error('데이터 조회 실패:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [contractId, participantId, tokenVerified]);

  // participant가 변경될 때마다 템플릿 상태 조회
  useEffect(() => {
    // participant가 있는 경우에만 템플릿 상태 조회
    if (participant) {
      fetchTemplateStatus();
    }
  }, [participant]);

  // pdfId에서 원본 ID 추출
  const getOriginalPdfId = (pdfId) => {
    return pdfId.replace('_with_fields.pdf', '.pdf');
  };

  // 필드 정보 가져오기
  const fetchFields = async (pdfId) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8080/api/contract-pdf/fields/${pdfId}`);
      if (!response.ok) throw new Error('Failed to fetch fields');
      const data = await response.json();
      setFields(data);
    } catch (error) {
      console.error('Error fetching fields:', error);
    } finally {
      setLoading(false);
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

  // 텍스트 저장 핸들러
  const handleTextSave = async (text) => {
    try {
      if (!participant?.templatePdfs) return;
      
      const currentTemplate = participant.templatePdfs[currentTemplateIndex];
      const originalPdfId = getOriginalPdfId(currentTemplate.pdfId);
      
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
      await fetchFields(currentTemplate.pdfId);
      setTextModalOpen(false);
      setSelectedField(null);
      
    } catch (error) {
      console.error('Error saving text:', error);
    }
  };

  // 서명 저장 핸들러
  const handleSignatureSave = async (signatureData) => {
    try {
      if (!participant?.templatePdfs) return;
      
      const currentTemplate = participant.templatePdfs[currentTemplateIndex];
      const originalPdfId = getOriginalPdfId(currentTemplate.pdfId);
      
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
      await fetchFields(currentTemplate.pdfId);
      setSignatureModalOpen(false);
      
    } catch (error) {
      console.error('Error saving signature:', error);
    }
  };

  // 체크박스 변경 핸들러
  const handleCheckboxChange = async (field) => {
    try {
      if (!participant?.templatePdfs) return;
      
      const currentTemplate = participant.templatePdfs[currentTemplateIndex];
      const originalPdfId = getOriginalPdfId(currentTemplate.pdfId);
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
      await fetchFields(currentTemplate.pdfId);
      
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

  // 다음 템플릿으로 이동
  const handleNextTemplate = async () => {
    if (!participant?.templatePdfs) return;
    
    if (currentTemplateIndex < participant.templatePdfs.length - 1) {
      // 다음 템플릿으로 이동
      const nextIndex = currentTemplateIndex + 1;
      setCurrentTemplateIndex(nextIndex);
      
      // 다음 템플릿의 필드 정보 가져오기
      await fetchFields(participant.templatePdfs[nextIndex].pdfId);
      setCurrentPage(1); // 페이지 초기화
      
      // 템플릿 상태 업데이트
      await fetchTemplateStatus();
    }
  };

  // 이전 템플릿으로 이동
  const handlePrevTemplate = async () => {
    if (!participant?.templatePdfs) return;
    
    if (currentTemplateIndex > 0) {
      const prevIndex = currentTemplateIndex - 1;
      setCurrentTemplateIndex(prevIndex);
      await fetchFields(participant.templatePdfs[prevIndex].pdfId);
      setCurrentPage(1); // 페이지 초기화
      
      // 템플릿 상태 업데이트
      await fetchTemplateStatus();
    }
  };

  // 템플릿 상태 조회 함수 추가
  const fetchTemplateStatus = async () => {
    try {
      // participant가 null인 경우 함수 실행 중단
      if (!participant || !participant.templatePdfs) {
        return;
      }
      
      const response = await fetch(
        `http://localhost:8080/api/contracts/${contractId}/participants/${participantId}/template-status`
      );
      
      if (!response.ok) throw new Error('템플릿 상태 조회 실패');
      
      const statusList = await response.json();
      
      // 완료된 템플릿 인덱스 업데이트
      const completedIndexes = participant.templatePdfs
        .map((template, index) => {
          const status = statusList.find(s => s.pdfId === template.pdfId);
          return status && status.signed ? index : -1;
        })
        .filter(index => index !== -1);
      
      setCompletedTemplates(completedIndexes);
      
    } catch (error) {
      console.error('템플릿 상태 조회 실패:', error);
    }
  };

  // 서명 완료 확인 다이얼로그 열기
  const handleConfirmComplete = () => {
    setConfirmDialogOpen(true);
  };

  // 서명 완료 확인 다이얼로그 닫기
  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
  };
  
  // 서명 완료 처리 실행
  const handleCompleteAllTemplates = async () => {
    try {
      if (!participant?.templatePdfs) return;
      
      setLoading(true);
      setConfirmDialogOpen(false); // 다이얼로그 닫기
      
      // 모든 미완료 템플릿에 대해 서명 완료 처리
      for (let i = 0; i < participant.templatePdfs.length; i++) {
        if (completedTemplates.includes(i)) {
          continue; // 이미 완료된 템플릿은 건너뜀
        }
        
        const template = participant.templatePdfs[i];
        
        // 서명된 PDF 생성 요청
        const response = await fetch(
          `http://localhost:8080/api/contract-pdf/download-signed/${template.pdfId}`,
          { 
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              participantId: participantId,
              mappingId: template.mappingId
            })
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || `${template.templateName} 서명 저장 실패`);
        }
      }
      
      // 서명 완료 처리 API 호출
      // 토큰이 있는 비회원의 경우와 로그인한 회원의 경우 분기 처리
      let finalizeResponse;
      
      if (token) {
        // 비회원 서명의 경우 - 장기 토큰 발급 API 사용
        finalizeResponse = await fetch(
          `http://localhost:8080/api/contracts/${contractId}/participants/${participantId}/complete-signing`, 
          { method: 'POST' }
        );
      } else {
        // 로그인한 회원의 경우 - 기존 API 사용
        finalizeResponse = await fetch(
          `http://localhost:8080/api/contracts/${contractId}/participants/${participantId}/sign`, 
          { method: 'POST' }
        );
      }
      
      if (finalizeResponse.ok) {
        // 토큰이 있는 비회원의 경우 비회원 결과 페이지로 이동
        if (token) {
          const responseData = await finalizeResponse.json();
          if (responseData.success && responseData.redirectUrl) {
            // 성공 메시지 변경: 알림 발송 정보 추가
            alert(
              '모든 계약서에 대한 서명이 완료되었습니다.\n\n' +
              '계약 완료 알림 및 조회 링크가 이메일/SMS로 발송되었습니다.\n' +
              '발송된 링크를 통해 언제든지 계약 내용을 확인하실 수 있습니다.'
            );
            
            setTimeout(() => {
              window.location.href = responseData.redirectUrl;
            }, 500);
          } else {
            // 실패 시 기본 계약 상세 페이지로 이동
            setTimeout(() => {
              window.location.href = `/contract-detail/${contractId}`;
            }, 500);
          }
        } else {
          // 회원의 경우 계약 상세 페이지로 이동
          alert('모든 계약서에 대한 서명이 완료되었습니다.\n\n' +
            '서명이 완료된 계약서의 PDF 열람 암호가 이메일로 발송되었습니다.'
          );
          setTimeout(() => {
            window.location.href = `/contract-detail/${contractId}`;
          }, 500);
        }
      } else {
        throw new Error('서명 완료 처리 실패');
      }
      
    } catch (error) {
      console.error('템플릿 일괄 완료 처리 실패:', error);
      alert(error.message || '서명 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
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

      // 토큰이 있는 경우와 없는 경우를 구분하여 처리
      let response;
      
      if (token) {
        // 토큰이 있는 경우 새로운 API 사용
        response = await fetch(`http://localhost:8080/api/signature/verify-phone?contractId=${contractId}&participantId=${participantId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneLastDigits: phoneInput
          })
        });
      } else {
        // 기존 방식 유지
        response = await fetch(
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
      }

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
  }, [phoneInput, contractId, participantId, token]);

  // 클릭하여 템플릿 변경 시 필드도 함께 업데이트하는 함수 추가
  const handleTemplateChange = async (index) => {
    if (!participant?.templatePdfs || index === currentTemplateIndex) return;
    
    setLoading(true);
    setCurrentTemplateIndex(index);
    
    try {
      // 선택한 템플릿의 필드 정보 가져오기
      await fetchFields(participant.templatePdfs[index].pdfId);
      setCurrentPage(1); // 페이지 초기화
    } catch (error) {
      console.error('템플릿 변경 중 오류:', error);
    } finally {
      setLoading(false);
    }
  };

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

  // 계약서가 없는 경우
  if (!participant?.templatePdfs || participant.templatePdfs.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f5f5f5' 
      }}>
        <Typography>서명할 계약서가 없습니다.</Typography>
      </Box>
    );
  }

  const currentTemplate = participant.templatePdfs[currentTemplateIndex];

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

      {/* 오른쪽 계약서 진행 상황 및 버튼 영역 */}
      <Box sx={{ 
        width: 280, 
        height: '100%',
        bgcolor: 'white', 
        borderLeft: 1, 
        borderColor: 'divider',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        <Box>
          <Typography variant="h6">계약서 서명</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            모든 계약서의 필수 필드를 작성하고 서명을 완료해주세요.
          </Typography>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>계약서 진행 상황</Typography>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              mt: 2,
              border: '1px solid #E0E0E0',
              borderRadius: 1,
              p: 1.5
            }}>
              {participant.templatePdfs.map((template, index) => (
                <Box 
                  key={template.mappingId} 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    mb: index === participant.templatePdfs.length - 1 ? 0 : 1.5,
                    pb: index === participant.templatePdfs.length - 1 ? 0 : 1.5,
                    borderBottom: index === participant.templatePdfs.length - 1 ? 'none' : '1px solid #EEEEEE',
                    cursor: 'pointer',
                    p: 1,
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: '#f5f5f5'
                    }
                  }}
                  onClick={() => handleTemplateChange(index)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box 
                      sx={{ 
                        width: 20, 
                        height: 20, 
                        borderRadius: '50%', 
                        backgroundColor: index === currentTemplateIndex ? '#1976d2' : 
                                       completedTemplates.includes(index) ? '#4CAF50' : '#E0E0E0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
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
                        fontWeight: index === currentTemplateIndex ? 600 : 400,
                        color: index === currentTemplateIndex ? '#1976d2' : 
                               completedTemplates.includes(index) ? '#4CAF50' : 'text.primary'
                      }}
                    >
                      {template.templateName}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      fontSize: '0.75rem',
                      color: index === currentTemplateIndex ? '#1976d2' : 
                             completedTemplates.includes(index) ? '#4CAF50' : 'text.secondary',
                      backgroundColor: index === currentTemplateIndex ? '#E3F2FD' : 
                                     completedTemplates.includes(index) ? '#E8F5E9' : '#F5F5F5',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      visibility: index === currentTemplateIndex || completedTemplates.includes(index) ? 'visible' : 'hidden'
                    }}
                  >
                    {completedTemplates.includes(index) ? '완료' : 
                     index === currentTemplateIndex ? '작성 중' : ''}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          {/* 계약서 이동 버튼 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<NavigateBeforeIcon />}
              onClick={handlePrevTemplate}
              disabled={currentTemplateIndex === 0}
              sx={{
                py: 0.5,
                px: 1,
                borderColor: '#1976d2',
                color: '#1976d2',
                borderRadius: '8px',
                fontSize: '0.75rem',
                width: '45%',
                minWidth: 'auto'
              }}
            >
              이전 계약서
            </Button>
            
            <Button
              variant="outlined"
              endIcon={<NavigateNextIcon />}
              onClick={handleNextTemplate}
              disabled={currentTemplateIndex === participant.templatePdfs.length - 1}
              sx={{
                py: 0.5,
                px: 1,
                borderColor: '#1976d2',
                color: '#1976d2',
                borderRadius: '8px',
                fontSize: '0.75rem',
                width: '45%',
                minWidth: 'auto'
              }}
            >
              다음 계약서
            </Button>
          </Box>
          
          {/* 서명 완료 버튼 */}
          <Button
            variant="contained"
            onClick={handleConfirmComplete}
            disabled={loading || completedTemplates.length === participant.templatePdfs.length}
            startIcon={<SaveIcon />}
            fullWidth
            sx={{
              px: 4,
              py: 1,
              backgroundColor: '#1976d2',
              '&:hover': {
                backgroundColor: '#1565c0',
              },
              borderRadius: '8px',
              fontSize: '1rem',
              mb: 1.5
            }}
          >
            {completedTemplates.length === participant.templatePdfs.length ? 
              '모든 서명 완료' : 
              loading ? '처리중...' : '모든 계약서 서명 완료'}
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

      {/* 확인 다이얼로그 추가 */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCloseConfirmDialog}
        aria-labelledby="confirm-dialog-title"
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '8px',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle id="confirm-dialog-title" sx={{ 
          borderBottom: '1px solid #F0F0F0', 
          py: 2, 
          px: 3, 
          fontSize: '1rem', 
          fontWeight: 600 
        }}>
          서명 완료 확인
        </DialogTitle>
        <DialogContent sx={{ p: 3 , mt: 2}}>
          <Typography variant="body2" sx={{ color: '#505050' }}>
            모든 계약서에 대한 서명을 완료하시겠습니까?<br/>
            완료 후에는 수정이 불가능합니다.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #F0F0F0', justifyContent: 'flex-end' }}>
          <Button 
            onClick={handleCloseConfirmDialog} 
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
            onClick={handleCompleteAllTemplates}
            variant="contained"
            autoFocus
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
            확인
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SignaturePdfViewer;
