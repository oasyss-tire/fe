import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Checkbox, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Paper, Stepper, Step, StepLabel, Menu, MenuItem, Chip, IconButton } from '@mui/material';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import SignatureModal from '../common/fields/SignatureModal';
import TextInputModal from '../common/fields/TextInputModal';
import SaveIcon from '@mui/icons-material/Save';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import FilePresentIcon from '@mui/icons-material/FilePresent';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
// 새로운 ConfirmTextInputModal 컴포넌트 추가 (나중에 구현)
import ConfirmTextInputModal from '../common/fields/ConfirmTextInputModal';

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
  
  // 확인 텍스트 필드를 위한 상태 추가
  const [confirmTextModalOpen, setConfirmTextModalOpen] = useState(false);
  
  // 실제 사용할 계약ID와 참여자ID 상태 추가
  const [contractId, setContractId] = useState(urlContractId);
  const [participantId, setParticipantId] = useState(urlParticipantId);
  const [tokenVerified, setTokenVerified] = useState(false);
  
  // 다중 템플릿 관련 상태 추가
  const [currentTemplateIndex, setCurrentTemplateIndex] = useState(0);
  const [completedTemplates, setCompletedTemplates] = useState([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  // 템플릿별 완료율 상태 추가
  const [templateCompletionRates, setTemplateCompletionRates] = useState({});
  // 템플릿별 완료율 계산 완료 여부
  const [completionRatesCalculated, setCompletionRatesCalculated] = useState(false);

  // 첨부파일 관련 상태 추가
  const [participantDocuments, setParticipantDocuments] = useState([]);
  const [uploadMenuAnchor, setUploadMenuAnchor] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  
  // 파일 업로드를 위한 refs
  const fileInputRef = useRef(null);
  
  // 웹캠 관련 상태
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

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
        
        // 5. 첨부파일 정보 조회
        await fetchParticipantDocuments(participantId);
        
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

  // 필드와 참여자 정보가 변경될 때마다 템플릿별 완료율 계산
  useEffect(() => {
    // 필드 정보와 참여자 정보가 있는 경우에만 계산
    if (fields.length > 0 && participant?.templatePdfs) {
      const rates = {};
      
      // 각 템플릿별 완료율 계산
      participant.templatePdfs.forEach((template, index) => {
        // 해당 템플릿의 PDF ID 가져오기
        const pdfId = template.pdfId;
        
        // 해당 PDF의 필드만 필터링
        const templateFields = fields.filter(field => field.pdfId === pdfId);
        
        // 완료된 필드 수 계산
        const completedFields = templateFields.filter(field => field.value !== null && field.value !== '');
        
        // 완료율 계산 (필드가 없는 경우 100%)
        const rate = templateFields.length > 0 
          ? Math.round((completedFields.length / templateFields.length) * 100) 
          : 100;
        
        // 완료율 저장
        rates[index] = rate;
      });
      
      // 상태 업데이트
      setTemplateCompletionRates(rates);
      setCompletionRatesCalculated(true);
    }
  }, [fields, participant?.templatePdfs]);

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
          borderColor: field.type === 'signature' ? 'error.main' : 
                       field.type === 'confirmText' ? 'warning.main' : 'primary.main',
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
        {field.value && field.type === 'confirmText' && (
          <Typography variant="body2" sx={{ color: 'text.primary', fontStyle: 'italic' }}>
            {field.value}
          </Typography>
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
      case 'confirmText':
        setSelectedField(field);
        setConfirmTextModalOpen(true);
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

  // 확인 텍스트 저장 핸들러
  const handleConfirmTextSave = async (text) => {
    try {
      if (!participant?.templatePdfs || !selectedField) return;
      
      // 입력된 텍스트가 원본 확인 텍스트와 일치하는지 검증
      if (text !== selectedField.confirmText) {
        alert('입력한 텍스트가 원본 텍스트와 일치하지 않습니다. 다시 입력해주세요.');
        return;
      }
      
      const currentTemplate = participant.templatePdfs[currentTemplateIndex];
      const originalPdfId = getOriginalPdfId(currentTemplate.pdfId);
      
      const response = await fetch(
        `http://localhost:8080/api/contract-pdf/fields/${originalPdfId}/value?fieldName=${selectedField.fieldName}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'confirmText',
            value: text
          })
        }
      );
      
      if (!response.ok) throw new Error('Failed to save confirm text');
      await fetchFields(currentTemplate.pdfId);
      setConfirmTextModalOpen(false);
      setSelectedField(null);
      
    } catch (error) {
      console.error('Error saving confirm text:', error);
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

  // 현재 PDF의 모든 필드가 작성되었는지 확인하는 함수 추가
  const areAllFieldsCompleted = (pdfId) => {
    if (!fields || fields.length === 0) {
      console.log(`areAllFieldsCompleted: fields 없음 (${pdfId})`);
      return false;
    }
    
    // 현재 PDF의 필드만 필터링
    const currentFields = fields.filter(field => field.pdfId === pdfId);
    console.log(`areAllFieldsCompleted: pdfId=${pdfId}, 필드 수=${currentFields.length}`);
    
    if (currentFields.length === 0) {
      console.log(`areAllFieldsCompleted: 해당 PDF의 필드 없음 (${pdfId})`);
      return false;
    }
    
    // 모든 필드에 값이 입력되었는지 확인
    const result = currentFields.every(field => field.value !== null && field.value !== '');
    console.log(`areAllFieldsCompleted 결과: ${result} (${pdfId})`);
    return result;
  };
  
  // 현재 PDF의 작성되지 않은 필드 수 반환
  const getEmptyFieldsCount = (pdfId) => {
    if (!fields || fields.length === 0) return 0;
    
    // 현재 PDF의 필드만 필터링
    const currentFields = fields.filter(field => field.pdfId === pdfId);
    
    // 값이 입력되지 않은 필드 개수 반환
    return currentFields.filter(field => field.value === null || field.value === '').length;
  };

  // 다음 템플릿으로 이동
  const handleNextTemplate = async () => {
    if (!participant?.templatePdfs) return;
    
    if (currentTemplateIndex < participant.templatePdfs.length - 1) {
      // 현재 템플릿의 모든 필드가 작성되었는지 확인
      const currentPdfId = participant.templatePdfs[currentTemplateIndex].pdfId;
      const allFieldsCompleted = areAllFieldsCompleted(currentPdfId);
      
      // 모든 필드가 작성되지 않았다면 경고 표시
      if (!allFieldsCompleted) {
        const emptyFieldsCount = getEmptyFieldsCount(currentPdfId);
        alert(`현재 계약서에 작성되지 않은 필드가 ${emptyFieldsCount}개 있습니다.\n모든 필드를 작성한 후 다음 계약서로 이동해주세요.`);
        return;
      }
      
      // 다음 템플릿으로 이동
      const nextIndex = currentTemplateIndex + 1;
      console.log('다음 템플릿으로 이동:', nextIndex);
      console.log('다음 템플릿 정보:', participant.templatePdfs[nextIndex]);
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

  // 필수 첨부파일이 모두 업로드되었는지 확인하는 함수
  const areRequiredDocumentsUploaded = () => {
    // 첨부파일이 없는 경우 조건 충족
    if (!participantDocuments || participantDocuments.length === 0) {
      console.log("첨부파일 없음 - 조건 충족");
      return true;
    }
    
    // 필수 첨부파일 필터링 (문자열이나 숫자 모두 고려)
    const requiredDocuments = participantDocuments.filter(
      doc => doc.required === 1 || doc.required === '1' || doc.required === true
    );
    
    console.log("필수 첨부파일:", requiredDocuments);
    
    // 필수 첨부파일이 없는 경우 조건 충족
    if (requiredDocuments.length === 0) {
      console.log("필수 첨부파일 없음 - 조건 충족");
      return true;
    }
    
    // 모든 필수 문서의 업로드 상태 확인
    const allUploaded = requiredDocuments.every(doc => doc.fileId && doc.fileId.trim() !== '');
    console.log("모든 필수 첨부파일 업로드 완료:", allUploaded);
    
    return allUploaded;
  };

  // 모든 PDF의 모든 필드가 작성되었는지 확인하는 함수 추가
  const areAllPdfsFieldsCompleted = () => {
    if (!participant?.templatePdfs) return false;
    
    // 템플릿 완료율이 계산되지 않은 경우 원래 로직 사용
    if (!completionRatesCalculated) {
      return participant.templatePdfs.every(template => 
        areAllFieldsCompleted(template.pdfId)
      );
    }
    
    // 모든 템플릿의 완료율이 100%인지 확인
    return participant.templatePdfs.every((_, index) => 
      templateCompletionRates[index] === 100
    );
  };
  
  // 서명 완료 확인 다이얼로그 열기
  const handleConfirmComplete = () => {
    // 필수 첨부파일 업로드 확인
    const requiredUploaded = areRequiredDocumentsUploaded();
    console.log("필수 첨부파일 업로드 확인:", requiredUploaded);
    
    // 필수 첨부파일이 업로드되지 않은 경우 경고
    if (!requiredUploaded) {
      alert('모든 필수 첨부파일을 업로드해야 서명을 완료할 수 있습니다.');
      return;
    }
    
    // 모든 PDF의 모든 필드가 작성되었는지 확인
    const allFieldsCompleted = areAllPdfsFieldsCompleted();
    if (!allFieldsCompleted) {
      // 작성되지 않은 PDF 목록 생성
      const incompleteTemplates = participant.templatePdfs
        .filter(template => !areAllFieldsCompleted(template.pdfId))
        .map(template => template.templateName);
      
      alert(`모든 계약서의 필드를 작성해야 서명을 완료할 수 있습니다.`);
      return;
    }
    
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
    
    // 건너뛰기 시도 체크 (2개 이상 이동 시 중간 계약서들 검사)
    if (index > currentTemplateIndex + 1) {
      // 디버깅 위한 로그 추가
      console.log(`handleTemplateChange: 건너뛰기 시도 (${currentTemplateIndex} → ${index})`);
      
      // 먼저 중간 계약서들의 필드 정보 로드
      for (let i = currentTemplateIndex + 1; i < index; i++) {
        const intermediatePdfId = participant.templatePdfs[i].pdfId;
        console.log(`중간 계약서 체크: index=${i}, pdfId=${intermediatePdfId}`);
        
        // 각 중간 계약서의 필드 정보를 가져옴
        try {
          const response = await fetch(`http://localhost:8080/api/contract-pdf/fields/${intermediatePdfId}`);
          if (response.ok) {
            const intermediateFields = await response.json();
            // 필드가 전부 비어있는지 확인
            const emptyFields = intermediateFields.filter(f => f.value === null || f.value === '');
            console.log(`중간 계약서(${i}): 전체 필드=${intermediateFields.length}, 빈 필드=${emptyFields.length}`);
            
            if (emptyFields.length > 0) {
              // 작성되지 않은 필드가 있음
              alert(`계약서는 순서대로 작성해야 합니다.\n${i+1}번째 계약서(${participant.templatePdfs[i].templateName})에 작성되지 않은 필드가 있습니다.`);
              return;
            }
          } else {
            console.error(`중간 계약서(${i}) 필드 조회 실패`);
            alert('계약서 정보를 확인하는 중 오류가 발생했습니다.');
            return;
          }
        } catch (error) {
          console.error(`중간 계약서(${i}) 필드 조회 오류:`, error);
          alert('계약서 정보를 확인하는 중 오류가 발생했습니다.');
          return;
        }
      }
    }
    
    // 다음 계약서로 이동하는 경우(현재 위치보다 더 큰 인덱스로 이동)
    if (index > currentTemplateIndex) {
      // 현재 템플릿의 모든 필드가 작성되었는지 확인
      const currentPdfId = participant.templatePdfs[currentTemplateIndex].pdfId;
      const allFieldsCompleted = areAllFieldsCompleted(currentPdfId);
      
      // 모든 필드가 작성되지 않았다면 경고 표시
      if (!allFieldsCompleted) {
        const emptyFieldsCount = getEmptyFieldsCount(currentPdfId);
        alert(`현재 계약서에 작성되지 않은 필드가 ${emptyFieldsCount}개 있습니다.\n모든 필드를 작성한 후 다음 계약서로 이동해주세요.`);
        return;
      }
    }
    
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

  // 첨부파일 정보 조회 함수
  const fetchParticipantDocuments = async (participantId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/contracts/${contractId}/participants/${participantId}/documents`);
      if (!response.ok) throw new Error('첨부파일 정보 조회 실패');
      const data = await response.json();
      setParticipantDocuments(data);
    } catch (error) {
      console.error('첨부파일 정보 조회 실패:', error);
    }
  };
  
  // 업로드 메뉴 열기
  const handleOpenUploadMenu = (event, doc) => {
    setUploadMenuAnchor(event.currentTarget);
    setSelectedDoc(doc);
  };
  
  // 업로드 메뉴 닫기
  const handleCloseUploadMenu = () => {
    setUploadMenuAnchor(null);
  };
  
  // 파일 선택
  const handleFileUpload = () => {
    handleCloseUploadMenu();
    fileInputRef.current.click();
  };
  
  // 카메라로 촬영
  const handleCameraUpload = () => {
    handleCloseUploadMenu();
    setCameraDialogOpen(true);
    startCameraStream();
  };
  
  // 파일 선택 변경 핸들러
  const handleFileChange = async (e) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedDoc) return;
    
    const file = e.target.files[0];
    await uploadFile(file, selectedDoc);
    
    // 파일 입력 초기화
    e.target.value = '';
  };
  
  // 파일 업로드 처리
  const uploadFile = async (file, doc) => {
    try {
      setUploadLoading(true);
      setUploadError('');
      
      const formData = new FormData();
      formData.append('file', file);
      
      // 백엔드 API 경로에 맞게 수정
      const response = await fetch(
        `http://localhost:8080/api/contracts/${contractId}/participants/${participantId}/documents/${doc.documentCodeId}`,
        {
          method: 'POST',
          body: formData
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '업로드 실패' }));
        throw new Error(errorData.message || '파일 업로드 중 오류가 발생했습니다.');
      }
      
      // 업로드 성공
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
      
      // 첨부파일 목록 갱신
      await fetchParticipantDocuments(participantId);
      
    } catch (error) {
      console.error('파일 업로드 오류:', error);
      setUploadError(error.message || '파일 업로드 중 오류가 발생했습니다.');
      setTimeout(() => setUploadError(''), 3000);
    } finally {
      setUploadLoading(false);
      setSelectedDoc(null);
    }
  };
  
  // 첨부파일 다운로드
  const handleDocumentDownload = async (documentId, filename) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/contracts/${contractId}/participants/${participantId}/documents/${documentId}/download`
      );
      
      if (!response.ok) throw new Error('파일 다운로드 실패');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'document';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('파일 다운로드 오류:', error);
    }
  };
  
  // 웹캠 스트림 시작
  const startCameraStream = async () => {
    try {
      const constraints = { 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user' // 전면 카메라 (PC 웹캠)
        } 
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      // 비디오 요소에 스트림 연결
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('웹캠 접근 오류:', error);
      alert('웹캠에 접근할 수 없습니다. 권한을 확인해주세요.');
      setCameraDialogOpen(false);
    }
  };
  
  // 웹캠 스트림 중지
  const stopCameraStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };
  
  // 카메라 다이얼로그 닫기
  const handleCloseCameraDialog = () => {
    stopCameraStream();
    setCameraDialogOpen(false);
  };
  
  // 사진 촬영
  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current || !selectedDoc) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // 비디오 프레임 크기로 캔버스 설정
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // 캔버스에 현재 비디오 프레임 그리기
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // 캔버스 이미지를 Blob으로 변환
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      
      // Blob을 File 객체로 변환
      const file = new File([blob], `webcam_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      // 파일 업로드
      await uploadFile(file, selectedDoc);
      
      // 다이얼로그 닫기
      handleCloseCameraDialog();
    }, 'image/jpeg', 0.95);
  };

  // 첨부파일 삭제 처리 함수 추가
  const handleDeleteFile = async (documentId) => {
    if (!documentId) return;
    
    try {
      setUploadLoading(true);
      setUploadError('');
      
      const response = await fetch(
        `http://localhost:8080/api/contracts/documents/${documentId}/file`,
        {
          method: 'DELETE'
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '삭제 실패' }));
        throw new Error(errorData.message || '파일 삭제 중 오류가 발생했습니다.');
      }
      
      // 삭제 성공 알림
      setDeleteSuccess(true);
      setTimeout(() => setDeleteSuccess(false), 3000);
      
      // 첨부파일 목록 갱신
      await fetchParticipantDocuments(participantId);
      
    } catch (error) {
      console.error('파일 삭제 오류:', error);
      setUploadError(error.message || '파일 삭제 중 오류가 발생했습니다.');
      setTimeout(() => setUploadError(''), 3000);
    } finally {
      setUploadLoading(false);
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
        overflowY: 'auto'
      }}>
        <Box>
          <Typography variant="h6">계약서 서명</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            모든 계약서의 필수 필드를 작성하고 서명을 완료해주세요.
          </Typography>
          
          {/* 계약서 목록 */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>계약서 목록</Typography>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              mt: 2,
              border: '1px solid #E0E0E0',
              borderRadius: 1,
              p: 1.5
            }}>
              {participant?.templatePdfs?.map((template, index) => (
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
                    {(() => {
                      // 완료된 템플릿인 경우
                      if (completedTemplates.includes(index)) {
                        return '완료';
                      }
                      
                      // 현재 작업 중인 템플릿인 경우
                      if (index === currentTemplateIndex) {
                        // 완료율 계산이 안 된 경우 기본값으로 '작성 중' 표시
                        if (!completionRatesCalculated) {
                          return '작성 중';
                        }
                        
                        // 미리 계산된 완료율 사용
                        const completionRate = templateCompletionRates[index] || 0;
                        
                        // 완료율이 100%면 '완료'로 표시, 아니면 '작성 중'으로 표시
                        return completionRate === 100 
                          ? '완료' 
                          : '작성 중';
                      }
                      
                      return '';
                    })()}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
          
          {/* 입력 필드 현황 섹션 추가 */}
          {participant?.templatePdfs && currentTemplateIndex >= 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                입력 필드 현황
                {participant.templatePdfs[currentTemplateIndex] && (
                  <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                    (현재: {participant.templatePdfs[currentTemplateIndex].templateName})
                  </Typography>
                )}
              </Typography>
              
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                mt: 2,
                border: '1px solid #E0E0E0',
                borderRadius: 1,
                p: 1.5
              }}>
                {/* 필드 통계 정보 */}
                {(() => {
                  // 현재 템플릿의 PDF ID 가져오기
                  const currentPdfId = participant.templatePdfs[currentTemplateIndex]?.pdfId;
                  
                  // 현재 PDF의 필드만 필터링
                  const currentFields = fields.filter(field => field.pdfId === currentPdfId);
                  
                  // 완료된 필드와 미완료 필드 구분
                  const completedFields = currentFields.filter(field => field.value !== null && field.value !== '');
                  const emptyFields = currentFields.filter(field => field.value === null || field.value === '');
                  
                  // 페이지별 미완료 필드 그룹화
                  const emptyFieldsByPage = {};
                  emptyFields.forEach(field => {
                    if (!emptyFieldsByPage[field.page]) {
                      emptyFieldsByPage[field.page] = [];
                    }
                    emptyFieldsByPage[field.page].push(field);
                  });
                  
                  // 필드 유형별 통계
                  const signatureFields = currentFields.filter(field => field.type === 'signature');
                  const textFields = currentFields.filter(field => field.type === 'text');
                  const checkboxFields = currentFields.filter(field => field.type === 'checkbox');
                  const confirmTextFields = currentFields.filter(field => field.type === 'confirmText');
                  
                  // 각 유형별 미완료 필드 수
                  const emptySignatureFields = signatureFields.filter(field => !field.value);
                  const emptyTextFields = textFields.filter(field => !field.value);
                  const emptyCheckboxFields = checkboxFields.filter(field => !field.value);
                  const emptyConfirmTextFields = confirmTextFields.filter(field => !field.value);
                  
                  return (
                    <>
                      {/* 전체 진행상황 */}
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            전체 진행률
                          </Typography>
                          <Typography variant="body2" sx={{ color: emptyFields.length === 0 ? '#4CAF50' : '#FF9800' }}>
                            {completedFields.length}/{currentFields.length} 항목
                          </Typography>
                        </Box>
                        <Box sx={{ width: '100%', height: 6, bgcolor: '#F0F0F0', borderRadius: 3, overflow: 'hidden' }}>
                          <Box 
                            sx={{ 
                              height: '100%', 
                              width: `${currentFields.length > 0 ? (completedFields.length / currentFields.length) * 100 : 0}%`,
                              bgcolor: emptyFields.length === 0 ? '#4CAF50' : '#FF9800',
                              borderRadius: 3
                            }} 
                          />
                        </Box>
                      </Box>
                      
                      {/* 필드 유형별 상태 */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>필드 유형별 상태</Typography>
                        
                        {signatureFields.length > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                              서명 필드
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              color: emptySignatureFields.length === 0 ? '#4CAF50' : '#FF9800'
                            }}>
                              {signatureFields.length - emptySignatureFields.length}/{signatureFields.length}
                            </Typography>
                          </Box>
                        )}
                        
                        {textFields.length > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                              텍스트 필드
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              color: emptyTextFields.length === 0 ? '#4CAF50' : '#FF9800'
                            }}>
                              {textFields.length - emptyTextFields.length}/{textFields.length}
                            </Typography>
                          </Box>
                        )}
                        
                        {checkboxFields.length > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                              체크박스 필드
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              color: emptyCheckboxFields.length === 0 ? '#4CAF50' : '#FF9800'
                            }}>
                              {checkboxFields.length - emptyCheckboxFields.length}/{checkboxFields.length}
                            </Typography>
                          </Box>
                        )}

                        {confirmTextFields.length > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                              서명 문구 필드
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              color: emptyConfirmTextFields.length === 0 ? '#4CAF50' : '#FF9800'
                            }}>
                              {confirmTextFields.length - emptyConfirmTextFields.length}/{confirmTextFields.length}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      
                      {/* 페이지별 미작성 필드 */}
                      {emptyFields.length > 0 && (
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1, color: '#FF9800' }}>
                            작성이 필요한 페이지
                          </Typography>
                          
                          {Object.entries(emptyFieldsByPage).map(([page, fields]) => (
                            <Box 
                              key={page}
                              sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                py: 0.5,
                                pl: 1,
                                pr: 0.5,
                                mb: 0.5,
                                borderRadius: 1,
                                bgcolor: '#FFF3E0',
                                cursor: 'pointer',
                                '&:hover': { bgcolor: '#FFE0B2' }
                              }}
                              onClick={() => {
                                // 해당 페이지로 스크롤
                                const pageElement = document.getElementById(`page-${page}`);
                                if (pageElement) {
                                  pageElement.scrollIntoView({ behavior: 'smooth' });
                                  setCurrentPage(Number(page));
                                }
                              }}
                            >
                              <Typography variant="body2" sx={{ color: '#E65100' }}>
                                {page}페이지
                              </Typography>
                              <Chip 
                                label={`${fields.length}개 필드`} 
                                size="small"
                                sx={{ 
                                  fontSize: '0.7rem',
                                  height: '20px',
                                  bgcolor: '#FFFFFF',
                                  color: '#FF9800'
                                }}
                              />
                            </Box>
                          ))}
                        </Box>
                      )}
                      
                      {/* 모든 필드가 작성된 경우 */}
                      {emptyFields.length === 0 && (
                        <Box sx={{ 
                          p: 1.5, 
                          bgcolor: '#E8F5E9', 
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <Box 
                            sx={{ 
                              width: 20, 
                              height: 20, 
                              borderRadius: '50%', 
                              bgcolor: '#4CAF50',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mr: 1
                            }}
                          >
                            <CheckIcon sx={{ color: 'white', fontSize: '0.8rem' }} />
                          </Box>
                          <Typography variant="body2" sx={{ color: '#2E7D32' }}>
                            모든 필드가 작성 완료되었습니다.
                          </Typography>
                        </Box>
                      )}
                    </>
                  );
                })()}
              </Box>
            </Box>
          )}
          
          {/* 첨부파일 섹션 추가 */}
          {participantDocuments.length > 0 && (
            <Box sx={{ mt: 3, mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>필수 첨부파일</Typography>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                mt: 2,
                border: '1px solid #E0E0E0',
                borderRadius: 1,
                p: 1.5,
                overflow: 'hidden'
              }}>
                {participantDocuments.map((doc, index) => (
                  <Box 
                    key={doc.id} 
                    sx={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      mb: index === participantDocuments.length - 1 ? 0 : 1.5,
                      pb: index === participantDocuments.length - 1 ? 0 : 1.5,
                      borderBottom: index === participantDocuments.length - 1 ? 'none' : '1px solid #EEEEEE',
                    }}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      justifyContent: 'space-between',
                      width: '100%'
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start',
                        minWidth: 0, // 필수! flexbox에서 자식이 넘치지 않도록 함
                        flex: 1
                      }}>
                        <FilePresentIcon sx={{ 
                          color: '#3182F6', 
                          mr: 1, 
                          fontSize: '1rem',
                          mt: 0.2, // 아이콘을 텍스트와 수직 중앙 정렬
                          flexShrink: 0 // 아이콘은 크기 고정
                        }} />
                        <Box sx={{ minWidth: 0, flex: 1 }}> {/* 텍스트 컨테이너 */}
                          <Typography variant="body2" sx={{ 
                            fontWeight: 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: '#333',
                            fontSize: '0.85rem'
                          }}>
                            {doc.documentCodeName}
                            {(doc.required === 1 || doc.required === '1' || doc.required === true) && (
                              <Chip
                                label="필수"
                                size="small"
                                sx={{
                                  ml: 1,
                                  backgroundColor: '#FFFFFF',
                                  color: '#FF9800',
                                  fontSize: '0.65rem',
                                  height: '18px',
                                  '& .MuiChip-label': { 
                                    px: 1 
                                  }
                                }}
                              />
                            )}
                          </Typography>
                          
                          {doc.originalFileName && (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="caption" sx={{ 
                                color: '#666', 
                                display: 'block', 
                                mt: 0.2,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontSize: '0.75rem'
                              }}>
                                {doc.originalFileName}
                              </Typography>
                              {doc.fileId && (
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm('첨부파일을 삭제하시겠습니까?')) {
                                      handleDeleteFile(doc.id);
                                    }
                                  }}
                                  sx={{
                                    p: 0,
                                    ml: 0.5,
                                    '&:hover': {
                                      backgroundColor: 'transparent',
                                      color: '#F44336'
                                    },
                                    color: '#757575',
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  <CloseIcon fontSize="inherit" />
                                </IconButton>
                              )}
                            </Box>
                          )}
                        </Box>
                      </Box>
                      

                    </Box>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'flex-end', 
                      mt: 1,
                      ml: 'auto' // 오른쪽 정렬
                    }}>
                      {doc.fileId ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label="제출완료"
                            size="small"
                            sx={{
                              backgroundColor: '#E8F5E9',
                              color: '#4CAF50',
                              fontSize: '0.7rem',
                              height: '24px',
                            }}
                          />
                          <Button
                            variant="outlined"
                            size="small"
                            aria-haspopup="true"
                            onClick={(e) => handleOpenUploadMenu(e, doc)}
                            startIcon={<UploadIcon fontSize="small" />}
                            disabled={uploadLoading}
                            sx={{
                              borderColor: '#3182F6',
                              color: '#3182F6',
                              fontSize: '0.7rem',
                              height: '26px',
                              '&:hover': {
                                borderColor: '#1565C0',
                                backgroundColor: 'rgba(49, 130, 246, 0.04)'
                              }
                            }}
                          >
                            {uploadLoading && selectedDoc?.id === doc.id ? '업로드 중...' : '재업로드'}
                          </Button>
                        </Box>
                      ) : (
                        <Button
                          variant="outlined"
                          size="small"
                          aria-haspopup="true"
                          onClick={(e) => handleOpenUploadMenu(e, doc)}
                          startIcon={<UploadIcon fontSize="small" />}
                          disabled={uploadLoading}
                          sx={{
                            borderColor: doc.required === 1 ? '#FF9800' : '#3182F6',
                            color: doc.required === 1 ? '#FF9800' : '#3182F6',
                            fontSize: '0.7rem',
                            height: '26px',
                            '&:hover': {
                              borderColor: doc.required === 1 ? '#F57C00' : '#1565C0',
                              backgroundColor: 'rgba(49, 130, 246, 0.04)'
                            }
                          }}
                        >
                          {uploadLoading && selectedDoc?.id === doc.id ? '업로드 중...' : (doc.required === 1 ? '필수 업로드' : '업로드')}
                        </Button>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
        
        <Box sx={{ mt: 'auto', mb: 2 }}>
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
              disabled={currentTemplateIndex === participant?.templatePdfs?.length - 1}
              sx={{
                py: 0.5,
                px: 1,
                borderColor: participant?.templatePdfs && currentTemplateIndex < participant.templatePdfs.length - 1 && 
                              areAllFieldsCompleted(participant.templatePdfs[currentTemplateIndex].pdfId) ? 
                              '#1976d2' : '#bdbdbd',
                color: participant?.templatePdfs && currentTemplateIndex < participant.templatePdfs.length - 1 && 
                       areAllFieldsCompleted(participant.templatePdfs[currentTemplateIndex].pdfId) ? 
                       '#1976d2' : '#9e9e9e',
                borderRadius: '8px',
                fontSize: '0.75rem',
                width: '45%',
                minWidth: 'auto',
                position: 'relative'
              }}
            >
              {participant?.templatePdfs && currentTemplateIndex < participant.templatePdfs.length - 1 && 
               !areAllFieldsCompleted(participant.templatePdfs[currentTemplateIndex].pdfId) ? (
                <Box sx={{
                  position: 'absolute',
                  top: -5,
                  right: -5,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  bgcolor: '#f44336',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  !
                </Box>
              ) : null}
              다음 계약서
            </Button>
          </Box>
          
          {/* 서명 완료 버튼 */}
          <Button
            variant="contained"
            onClick={handleConfirmComplete}
            disabled={
              loading || 
              (participant?.templatePdfs && completedTemplates.length === participant?.templatePdfs?.length)
            }
            startIcon={<SaveIcon />}
            fullWidth
            sx={{
              px: 4,
              py: 1,
              backgroundColor: loading ? '#9e9e9e' : '#1976d2',
              '&:hover': {
                backgroundColor: loading ? '#757575' : '#1565c0',
              },
              borderRadius: '8px',
              fontSize: '1rem',
              mb: 1.5
            }}
          >
            {participant?.templatePdfs && completedTemplates.length === participant?.templatePdfs?.length ? 
              '서명 완료됨' : loading ? '처리중...' : '서명 완료'}
          </Button>
        </Box>
      </Box>

      {/* 업로드 메뉴 */}
      <Menu
        anchorEl={uploadMenuAnchor}
        open={Boolean(uploadMenuAnchor)}
        onClose={handleCloseUploadMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleFileUpload}>
          <UploadIcon fontSize="small" sx={{ mr: 1 }} /> 파일 업로드
        </MenuItem>
        <MenuItem onClick={handleCameraUpload}>
          <PhotoCameraIcon fontSize="small" sx={{ mr: 1 }} /> 사진 촬영하기
        </MenuItem>
      </Menu>
      
      {/* 카메라 다이얼로그 */}
      <Dialog
        open={cameraDialogOpen}
        onClose={handleCloseCameraDialog}
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: '12px',
            overflow: 'hidden',
            maxWidth: '640px'
          }
        }}
      >
        <DialogTitle sx={{ 
          p: 2, 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #eee'
        }}>
          <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
            웹캠으로 사진 촬영
          </Typography>
          <IconButton 
            onClick={handleCloseCameraDialog}
            size="small"
            edge="end"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, bgcolor: '#000', position: 'relative' }}>
          <Box sx={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ 
                width: '100%', 
                maxHeight: '480px',
                objectFit: 'contain',
                display: 'block'
              }}
            />
            <canvas
              ref={canvasRef}
              style={{ display: 'none' }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center', borderTop: '1px solid #eee' }}>
          <Button 
            variant="contained"
            onClick={handleCapture}
            startIcon={<PhotoCameraIcon />}
            sx={{ 
              px: 3,
              py: 1,
              backgroundColor: '#3182F6',
              color: 'white',
              '&:hover': {
                backgroundColor: '#1565C0'
              }
            }}
          >
            촬영하기
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 파일 입력 (숨김) */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: 'none' }}
      />
      
      {/* 알림 메시지 - 업로드 성공 */}
      <Dialog 
        open={uploadSuccess} 
        onClose={() => setUploadSuccess(false)}
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: '12px',
            overflow: 'hidden',
            minWidth: '300px'
          }
        }}
      >
        <Alert 
          severity="success"
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            fontSize: '0.9rem'
          }}
        >
          파일이 성공적으로 업로드되었습니다.
        </Alert>
      </Dialog>
      
      {/* 알림 메시지 - 업로드 오류 */}
      <Dialog 
        open={!!uploadError} 
        onClose={() => setUploadError('')}
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: '12px',
            overflow: 'hidden',
            minWidth: '300px'
          }
        }}
      >
        <Alert 
          severity="error"
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            fontSize: '0.9rem'
          }}
        >
          {uploadError}
        </Alert>
      </Dialog>

      {/* 알림 메시지 - 삭제 성공 추가 */}
      <Dialog 
        open={deleteSuccess} 
        onClose={() => setDeleteSuccess(false)}
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: '12px',
            overflow: 'hidden',
            minWidth: '300px'
          }
        }}
      >
        <Alert 
          severity="success"
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            fontSize: '0.9rem'
          }}
        >
          파일이 성공적으로 삭제되었습니다.
        </Alert>
      </Dialog>

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

      {/* 확인 텍스트 모달 추가 */}
      <ConfirmTextInputModal
        open={confirmTextModalOpen}
        onClose={() => {
          setConfirmTextModalOpen(false);
          setSelectedField(null);
        }}
        onSave={handleConfirmTextSave}
        field={selectedField}
      />

      {/* 확인 다이얼로그 유지 */}
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
