import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  TextField,
  Alert,
  Snackbar,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import SignaturePad from 'react-signature-canvas';
import AuthMismatchPage from '../common/AuthMismatchPage';

// URL 상수 정의
const FRONTEND_URL = 'http://localhost:3001';
const BACKEND_URL = 'http://localhost:8080';

// PDF.js 워커 설정
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// NICE 인증 다이얼로그 컴포넌트 추가
const NiceAuthenticationDialog = React.memo(({ 
  open, 
  authError, 
  loading,
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
        <Typography variant="body2" sx={{ mb: 3, mt: 1, color: '#666', textAlign: 'center' }}>
          재서명을 위해 본인 인증이 필요합니다.<br />
          NICE 본인인증 서비스를 통해 인증해주세요.
        </Typography>
        {authError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {authError}
          </Alert>
        )}
      </Box>
    </DialogContent>
    <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #F0F0F0', justifyContent: 'center' }}>
      <Button 
        onClick={onVerify}
        variant="contained"
        fullWidth
        disabled={loading}
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
        {loading ? (
          <>
            <CircularProgress size={20} sx={{ color: 'white', mr: 1 }} />
            인증 준비 중...
          </>
        ) : (
          'NICE 본인인증 시작'
        )}
      </Button>
    </DialogActions>
  </Dialog>
));

/**
 * 재서명 요청 응답 페이지 컴포넌트
 * 이메일 링크를 통해 들어와 재서명이 필요한 필드만 수정할 수 있는 페이지
 */
const ContractCorrectionResponsePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const signatureCanvasRef = useRef(null);
  
  // URL에서 토큰 추출
  const getTokenFromUrl = () => {
    const params = new URLSearchParams(location.search);
    return params.get('token');
  };
  
  // 상태 관리
  const [token, setToken] = useState(getTokenFromUrl());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contract, setContract] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [correctionFields, setCorrectionFields] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [currentPdfIndex, setCurrentPdfIndex] = useState(0);
  const [pdfs, setPdfs] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  const [activeField, setActiveField] = useState(null);
  
  // PDF 뷰어 관련 상태
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfScale, setPdfScale] = useState(1.2);
  const [pageWidth, setPageWidth] = useState(595);  // A4 기본 너비
  const [pdfUrl, setPdfUrl] = useState(null);
  
  // 서명 관련 상태
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureMode, setSignatureMode] = useState(false);
  
  // NICE 인증 관련 상태 추가
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(true);
  const [authError, setAuthError] = useState('');
  const [niceLoading, setNiceLoading] = useState(false);
  const [niceAuthData, setNiceAuthData] = useState(null);
  
  // 인증 불일치 상태 추가
  const [authMismatch, setAuthMismatch] = useState(false);
  const [authMismatchInfo, setAuthMismatchInfo] = useState(null);
  
  // NICE 본인인증 시작 함수
  const handleNiceVerification = async () => {
    try {
      setNiceLoading(true);
      setAuthError('');
      
      // contractId나 participantId가 없는 경우 처리
      if (!contract?.id || !participant?.id) {
        console.error('❌ contractId 또는 participantId가 없습니다.');
        throw new Error('계약 정보를 확인할 수 없습니다. 페이지를 새로고침해주세요.');
      }
      
      // 요청 바디 구성
      const requestBody = {
        returnUrl: `${FRONTEND_URL}/nice-bridge`,
        methodType: 'GET'
      };
      
      // 백엔드 API 호출
      const response = await fetch(`${BACKEND_URL}/api/nice/certification/window`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API 응답 오류:', errorData);
        throw new Error(errorData.message || '본인인증 준비 실패');
      }

      const data = await response.json();
      
      if (!data.success) {
        console.error('❌ API 성공 플래그 false:', data.message);
        throw new Error(data.message || '본인인증 준비 실패');
      }

      // 응답에서 필요한 데이터 추출
      const requestNo = data.requestNo || '';
      const tokenVersionId = data.tokenVersionId || '';
      const encData = data.encData || '';
      const integrityValue = data.integrityValue || '';

      // requestNo를 sessionStorage에 저장 (콜백에서 사용)
      sessionStorage.setItem('nice_request_no', requestNo);

      // 동적으로 폼 생성 및 제출
      const form = document.createElement('form');
      form.name = 'niceForm';
      form.action = 'https://nice.checkplus.co.kr/CheckPlusSafeModel/service.cb';
      form.method = 'post';
      form.target = 'niceWindow';
      form.style.display = 'none';

      // 폼 필드 추가
      const fields = {
        'm': 'service',
        'token_version_id': tokenVersionId,
        'enc_data': encData,
        'integrity_value': integrityValue
      };

      Object.entries(fields).forEach(([name, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);

      // 새 창 열기
      window.open('', 'niceWindow', 'width=500, height=800, top=100, left=100, fullscreen=no, menubar=no, status=no, toolbar=no, titlebar=yes, location=no, scrollbar=no');
      
      // 폼 제출
      form.submit();
      
      // 폼 정리
      document.body.removeChild(form);

      
      // localStorage 폴링 시작
      setNiceLoading(false);
      startPollingForAuthResult();
      
    } catch (error) {
      console.error('💥 NICE 본인인증 오류:', error);
      setAuthError(error.message || '본인인증 준비 중 오류가 발생했습니다.');
      setNiceLoading(false);
    }
  };

  // localStorage 폴링 시작 함수
  const startPollingForAuthResult = () => {
    
    // 이전 인증 결과 정리
    localStorage.removeItem('nice_auth_result');
    
    const pollingInterval = setInterval(async () => {
      const authResult = localStorage.getItem('nice_auth_result');
      if (authResult) {
        try {
          const result = JSON.parse(authResult);
          
          // localStorage 정리
          localStorage.removeItem('nice_auth_result');
          
          // 폴링 중단
          clearInterval(pollingInterval);
          
          // 인증 완료 처리
          if (result.type === 'NICE_AUTH_COMPLETE' && result.encryptedData) {
            
            // 백엔드 API 호출하여 복호화된 데이터 가져오기
            try {
              const formData = new URLSearchParams();
              formData.append('token_version_id', result.encryptedData.token_version_id);
              formData.append('enc_data', result.encryptedData.enc_data);
              formData.append('integrity_value', result.encryptedData.integrity_value);
              
              // request_no는 sessionStorage에서 가져오기
              const requestNo = sessionStorage.getItem('nice_request_no') || '';
              formData.append('request_no', requestNo);
              
              const response = await fetch(`${BACKEND_URL}/api/nice/certification/callback/contract/${contract.id}/participant/${participant.id}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: formData
              });
              
              if (response.ok) {
                const decryptedData = await response.json();
                
                if (decryptedData.success && decryptedData.authSuccess) {

                  
                  // 개인정보는 personalInfo 객체에서 추출
                  const personalInfo = decryptedData.personalInfo || {};

                  
                  // 계약 참여자와 실제 인증한 사람이 일치하는지 확인
                  if (participant && participant.name && personalInfo.name) {
                    if (participant.name !== personalInfo.name) {
                      console.error('❌ 계약 참여자와 인증자 불일치:');
                      console.error('계약참여자:', participant.name);
                      console.error('실제인증자:', personalInfo.name);
                      console.error('전체 participant 객체:', participant);
                      console.error('전체 personalInfo 객체:', personalInfo);
                      
                      // 인증 불일치 상태 설정
                      setAuthMismatch(true);
                      setAuthMismatchInfo({
                        participantName: participant.name,
                        authName: personalInfo.name,
                        contractId: contract.id,
                        participantId: participant.id
                      });
                      
                      // 다른 상태들 정리
                      setAuthError('');
                      setNiceLoading(false);
                      return;
                    } else {
                      console.log('✅ 계약 참여자와 인증자 일치 확인:', participant.name);
                    }
                  }
                  
                  // 인증 데이터 저장 (이름, 생년월일만 필요)
                  setNiceAuthData({
                    name: personalInfo.name,
                    birthDate: personalInfo.birthDate
                  });
                  
                  // sessionStorage 정리
                  sessionStorage.removeItem('nice_request_no');
                } else {
                  console.error('❌ NICE 데이터 복호화 실패:', decryptedData.message);
                }
              } else {
                console.error('❌ NICE 복호화 API 호출 실패');
              }
            } catch (error) {
              console.error('💥 NICE 데이터 복호화 오류:', error);
            }
            
            // 인증 상태 업데이트
            setIsAuthenticated(true);
            setShowAuthDialog(false);
            setAuthError('');
          }
          
        } catch (error) {
          console.error('NICE 인증 결과 파싱 오류:', error);
          localStorage.removeItem('nice_auth_result');
          clearInterval(pollingInterval);
          setAuthError('인증 결과 처리 중 오류가 발생했습니다.');
        }
      }
    }, 1000); // 1초마다 체크
    
    // 30초 후 타임아웃
    setTimeout(() => {
      clearInterval(pollingInterval);

    }, 30000);
  };
  
  // 참가자 정보 및 재서명 필드 조회
  useEffect(() => {
    const fetchCorrectionData = async () => {
      if (!token) {
        setError('재서명 요청 토큰이 없습니다. 올바른 링크로 접속해주세요.');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // 1단계: 토큰으로 기본 정보 조회 (Authorization 헤더 없이 쿼리 파라미터만 사용)
        const response = await fetch(`${BACKEND_URL}/api/contracts/correction-request/info?token=${token}`, {
          method: 'GET'
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || '재서명 정보를 불러오는데 실패했습니다.');
        }
        
        const data = await response.json();
        
        // 기본 정보 설정
        setContract({
          id: data.contractId,
          title: data.contractTitle
        });
        
        setParticipant({
          id: data.participantId,
          name: data.participantName,
          email: data.participantEmail
        });
        
        // 2단계: 재서명 필드 목록 조회는 성공 후 별도 함수에서 처리
        if (data.participantId) {
          await fetchCorrectionFields(data.participantId, data.token || token);
        }
        
      } catch (err) {
        console.error('재서명 정보 로딩 중 오류:', err);
        setError(err.message || '데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCorrectionData();
  }, [token]);
  
  // 2단계: 재서명 필드 목록 조회
  const fetchCorrectionFields = async (participantId, currentToken) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/participants/${participantId}/correction-fields?token=${currentToken}`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '재서명 필드 정보를 불러오는데 실패했습니다.');
      }
      
      const fieldsData = await response.json();

      
      // 필드 데이터 처리 전에 디버깅을 위한 로그 추가
      fieldsData.forEach((field, index) => {

        
        // 페이지 정보가 없으면 기본값 1 설정
        if (!field.page) {
          field.page = 1;
        }
      });
      
      setCorrectionFields(fieldsData);
      
      // 필드 값 초기화
      const initialValues = {};
      fieldsData.forEach(field => {
        // 체크박스 필드는 boolean 값으로 초기화
        if (field.fieldName && field.fieldName.startsWith('checkbox')) {
          initialValues[field.id] = field.value === true || field.value === 'true';
        } else {
          initialValues[field.id] = field.value || '';
        }
      });
      setFieldValues(initialValues);
      
      // PDF 정보 수집 및 중복 제거
      if (fieldsData.length > 0) {
        // 모든 고유한 PDF ID 수집
        const uniquePdfIds = [...new Set(fieldsData
          .filter(field => field.pdfId)
          .map(field => field.pdfId))];
        
        
        if (uniquePdfIds.length > 0) {
          // PDF 정보 설정
          const pdfsInfo = uniquePdfIds.map((pdfId, index) => ({
            id: pdfId,
            fileName: `계약서 ${index + 1}`
          }));
          
          setPdfs(pdfsInfo);
          
          // 첫 번째 PDF 로드
          await fetchPdfUrl(uniquePdfIds[0], currentToken);
        }
      }
    } catch (err) {
      console.error('재서명 필드 로딩 중 오류:', err);
      setError(err.message || '필드 정보를 불러오는데 실패했습니다.');
    }
  };
  
  // PDF URL 가져오기
  const fetchPdfUrl = async (pdfId, currentToken) => {
    try {
      // 토큰을 URL 쿼리 파라미터로 전달
      setPdfUrl(`${BACKEND_URL}/api/contract-pdf/view/${pdfId}?token=${currentToken || token}`);
    } catch (err) {
      console.error('PDF URL 로딩 중 오류:', err);
      setError(err.message);
    }
  };
  
  // PDF 변경 처리
  const handleChangePdf = async (index) => {
    if (pdfs.length > 0 && index >= 0 && index < pdfs.length) {
      setCurrentPdfIndex(index);
      setCurrentPage(1);
      // 토큰과 함께 PDF URL 로드
      await fetchPdfUrl(pdfs[index].id, token);
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
    const newScale = zoomIn ? pdfScale + 0.2 : pdfScale - 0.2;
    const limitedScale = Math.max(0.6, Math.min(2.5, newScale));
    
    setPdfScale(limitedScale);
    
    // 페이지 너비 다시 계산
    setPageWidth(Math.floor(595.28 * limitedScale));
  };
  
  // 컨테이너 크기 변경 감지 및 스케일 계산
  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      const style = window.getComputedStyle(container);
      const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const availableWidth = container.clientWidth - paddingX;
      
      
      // 고정 너비 사용 (렌더링 문제 해결을 위해)
      const fixedWidth = Math.min(595, availableWidth - 40);
      setPageWidth(fixedWidth);
      
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
  
  // PDF 로드 성공 처리
  const handleDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };
  
  // 필드 값 변경 처리 (NICE 인증 데이터 실시간 검증 추가)
  const handleFieldValueChange = (fieldId, value) => {
    const field = correctionFields.find(f => f.id === fieldId);
    const isCheckboxField = field?.fieldName && field.fieldName.startsWith('checkbox');
      
    // 텍스트 필드인 경우 formatCodeId에 따라 포맷팅 적용
    if (!isCheckboxField && field) {
      const formattedValue = formatInputValue(value, field.formatCodeId);
      
      // NICE 인증 데이터가 있는 경우 실시간 검증 (이름, 주민등록번호만)
      if (niceAuthData && field.formatCodeId) {
        
        // 이름 필드 검증 (001004_0009)
        if (field.formatCodeId === '001004_0009' && niceAuthData.name) {
          if (formattedValue && formattedValue !== niceAuthData.name) {
            console.warn('⚠️ 입력된 이름이 인증된 이름과 다릅니다:', {
              입력값: formattedValue,
              인증값: niceAuthData.name
            });
          } else if (formattedValue === niceAuthData.name) {

          }
        }
        
        // 주민등록번호 필드 검증 (001004_0002)
        if (field.formatCodeId === '001004_0002' && niceAuthData.birthDate) {
          // NICE 데이터에서 앞 2자리 제거 (예: 19960726 → 960726)
          const niceBirthShort = niceAuthData.birthDate.slice(2);
          // 입력값에서 '-' 제거하고 앞 6자리만 추출
          const inputBirthShort = formattedValue.replace('-', '').slice(0, 6);
          
          console.log('🔍 주민등록번호 검증:', {
            niceBirthShort,
            inputBirthShort,
            formattedValue
          });
          
          if (inputBirthShort && inputBirthShort !== niceBirthShort) {
            console.warn('⚠️ 입력된 주민등록번호가 인증된 정보와 다릅니다:', {
              입력값: inputBirthShort,
              인증값: niceBirthShort
            });
          } else if (inputBirthShort === niceBirthShort) {
            console.log('✅ 주민등록번호 검증 통과');
          }
        }
      }
      
      setFieldValues(prev => ({
        ...prev,
        [fieldId]: formattedValue
      }));
    } else {
      // 체크박스나 서명 필드는 그대로 값 저장
      setFieldValues(prev => ({
        ...prev,
        [fieldId]: value
      }));
    }
  };
  
  // 입력 형식에 따른 포맷팅 함수 추가
  const formatInputValue = (value, formatCodeId) => {
    if (!formatCodeId || !value) return value;
    
    // 숫자만 추출
    const numbersOnly = value.replace(/\D/g, '');
    
    // 핸드폰 번호 포맷 (010-1234-5678)
    if (formatCodeId === '001004_0001') {
      if (numbersOnly.length <= 3) {
        return numbersOnly;
      } else if (numbersOnly.length <= 7) {
        return `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3)}`;
      } else {
        return `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3, 7)}-${numbersOnly.slice(7, 11)}`;
      }
    }
    
    // 주민등록번호 포맷 (123456-1234567)
    if (formatCodeId === '001004_0002') {
      if (numbersOnly.length <= 6) {
        return numbersOnly;
      } else {
        return `${numbersOnly.slice(0, 6)}-${numbersOnly.slice(6, 13)}`;
      }
    }
    
    // 금액 형식 (1,000,000)
    if (formatCodeId === '001004_0003') {
      // 숫자가 없으면 빈 문자열 반환
      if (numbersOnly.length === 0) return '';
      
      // 1000단위로 콤마 추가
      return Number(numbersOnly).toLocaleString('ko-KR');
    }
    
    // 금액(한글) 형식
    if (formatCodeId === '001004_0004') {
      // 숫자만 제거 (나머지 문자는 허용)
      const noNumbers = value.replace(/[0-9]/g, '');
      return noNumbers;
    }
    
    // 다른 형식 코드에 대한 처리가 없으면 원래 값 반환
    return value;
  };
  
  // 형식에 따른 입력 길이 제한
  const getMaxLength = (formatCodeId) => {
    if (formatCodeId === '001004_0001') return 13; // 010-1234-5678
    if (formatCodeId === '001004_0002') return 14; // 123456-1234567
    if (formatCodeId === '001004_0003') return 20; // 최대 19자리 숫자 + 콤마
    if (formatCodeId === '001004_0004') return 30; // 금액(한글)
    return undefined; // 제한 없음
  };
  
  // 형식 안내 메시지
  const getFormatGuideText = (formatCodeId) => {
    if (formatCodeId === '001004_0001') {
      return '핸드폰 번호 형식 (예: 010-1234-5678)';
    }
    if (formatCodeId === '001004_0002') {
      return '주민등록번호 형식 (예: 123456-1234567)';
    }
    if (formatCodeId === '001004_0003') {
      return '금액 형식 (예: 1,000,000)';
    }
    if (formatCodeId === '001004_0004') {
      return '금액을 한글로 입력해 주세요 (예: 삼백만원, 일억오천만원) - 숫자 입력 불가';
    }
    return null;
  };
  
  // 서명 모드 시작
  const startSignatureMode = (fieldId) => {
    setSignatureMode(true);
    setActiveField(fieldId);
    
    // 캔버스 초기화는 SignaturePad 컴포넌트가 마운트된 후 자동으로 처리됩니다
  };
  
  // 서명 캔버스 초기화 함수 추가
  const clearSignatureCanvas = () => {
    if (signatureCanvasRef.current) {
      signatureCanvasRef.current.clear();
      
      // 서명 스타일 다시 설정
      const canvas = signatureCanvasRef.current.getCanvas();
      const ctx = canvas.getContext('2d');
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };
  
  // 서명 저장
  const saveSignature = () => {
    if (!signatureCanvasRef.current || signatureCanvasRef.current.isEmpty()) {
      return; // 서명이 비어있으면 저장하지 않음
    }
    
    // 서명 데이터 가져오기 (PNG 포맷, 투명 배경)
    const signatureDataUrl = signatureCanvasRef.current.toDataURL('image/png');
    handleFieldValueChange(activeField, signatureDataUrl);
    setSignatureMode(false);
    setActiveField(null);
  };
  
  // 서명 취소
  const cancelSignature = () => {
    setSignatureMode(false);
    setActiveField(null);
  };
  
  // 재서명 제출 - 필드별 업데이트 후 최종 완료 처리
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      // 모든 필드가 값이 있는지 확인 (체크박스 필드는 체크 여부 상관없이 통과)
      let allFieldsFilled = true;
      let emptyFields = [];
      
      correctionFields.forEach(field => {
        const isCheckboxField = field.fieldName && field.fieldName.startsWith('checkbox');
        
        // 체크박스 필드는 값의 존재 여부가 아닌 타입 검사 (boolean이면 통과)
        if (!isCheckboxField && !fieldValues[field.id]) {
          allFieldsFilled = false;
          emptyFields.push(field.fieldName || `필드 #${field.id}`);
        }
      });
      
      if (!allFieldsFilled) {
        setSnackbarMessage(`다음 필드에 값을 입력해주세요: ${emptyFields.join(', ')}`);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setSubmitting(false);
        return;
      }
      
      // NICE 인증 데이터와 입력값 최종 검증
      if (niceAuthData) {
        const validationErrors = [];
        
        correctionFields.forEach(field => {
          const fieldValue = fieldValues[field.id];
          const isCheckboxField = field.fieldName && field.fieldName.startsWith('checkbox');
          
          // 체크박스가 아니고 값이 있는 필드에 대해서만 검증
          if (!isCheckboxField && fieldValue && field.formatCodeId) {
            // 이름 필드 검증 (001004_0009)
            if (field.formatCodeId === '001004_0009' && niceAuthData.name) {
              if (fieldValue !== niceAuthData.name) {
                validationErrors.push(`이름: 입력하신 "${fieldValue}"이 본인인증된 이름 "${niceAuthData.name}"과 다릅니다.`);
              }
            }
            
            // 주민등록번호 필드 검증 (001004_0002)
            if (field.formatCodeId === '001004_0002' && niceAuthData.birthDate) {
              const niceBirthShort = niceAuthData.birthDate.slice(2); // 앞 2자리 제거
              const inputBirthShort = fieldValue.replace('-', '').slice(0, 6); // '-' 제거하고 앞 6자리
              
              if (inputBirthShort && inputBirthShort !== niceBirthShort) {
                validationErrors.push(`주민등록번호: 입력하신 앞자리 "${inputBirthShort}"가 본인인증 정보 "${niceBirthShort}"와 다릅니다.`);
              }
            }
          }
        });
        
        // 검증 실패한 필드가 있으면 제출 중단
        if (validationErrors.length > 0) {
          setSnackbarMessage(
            `본인인증 정보와 일치하지 않는 항목이 있습니다:\n\n${validationErrors.join('\n')}\n\n올바른 정보를 입력해주세요.`
          );
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
          setSubmitting(false);
          return;
        }
      }
      
      // 3, 4단계: 각 필드별로 값 업데이트
      for (const field of correctionFields) {
        await updateFieldValue(field.id, fieldValues[field.id]);
      }
      
      // 5단계: 재서명 완료 처리
      const completeResponse = await fetch(`${BACKEND_URL}/api/participants/${participant.id}/complete-corrections?token=${token}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!completeResponse.ok) {
        const errorData = await completeResponse.json().catch(() => ({}));
        throw new Error(errorData.message || '재서명 완료 처리 중 오류가 발생했습니다.');
      }
      
      setSubmitSuccess(true);
      setSnackbarMessage('재서명이 성공적으로 제출되었습니다.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
    } catch (err) {
      console.error('재서명 제출 중 오류:', err);
      setSnackbarMessage(err.message || '재서명 제출 중 오류가 발생했습니다.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setSubmitting(false);
    }
  };
  
  // 필드 값 업데이트 API 호출
  const updateFieldValue = async (fieldId, value) => {
    try {
      // 현재 필드 정보 조회
      const field = correctionFields.find(f => f.id === fieldId);
      const isCheckboxField = field?.fieldName && field.fieldName.startsWith('checkbox');
      
      // API에 전송할 데이터 준비
      const requestData = {
        id: fieldId,
        value: isCheckboxField ? value : value // 체크박스 필드는 boolean 값 그대로 전송
      };
      
   
      const response = await fetch(`${BACKEND_URL}/api/participants/${participant.id}/correction-fields/${fieldId}?token=${token}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `필드 #${fieldId} 업데이트 중 오류가 발생했습니다.`);
      }
      
      return await response.json();
    } catch (err) {
      console.error(`필드 #${fieldId} 업데이트 중 오류:`, err);
      throw err;
    }
  };
  
  // 스낵바 닫기
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };
  
  // 인증 불일치 체크 (최우선)
  if (authMismatch && authMismatchInfo) {
    return (
      <AuthMismatchPage 
        participantName={authMismatchInfo.participantName}
        authName={authMismatchInfo.authName}
        contractId={authMismatchInfo.contractId}
        participantId={authMismatchInfo.participantId}
        pageType="correction"
      />
    );
  }
  
  // 인증되지 않은 경우의 렌더링
  if (!isAuthenticated) {
    return (
      <Box sx={{ p: 3 }}>
        <NiceAuthenticationDialog 
          open={showAuthDialog}
          authError={authError}
          loading={niceLoading}
          onVerify={handleNiceVerification}
        />
      </Box>
    );
  }
  
  // 필드가 있는 페이지로 이동하는 함수 추가
  const navigateToField = (field) => {
    
    // 현재 PDF와 다른 PDF인 경우 PDF 전환
    if (pdfs.length > 0 && field.pdfId) {
      const pdfIndex = pdfs.findIndex(pdf => pdf.id === field.pdfId);
      if (pdfIndex !== -1 && pdfIndex !== currentPdfIndex) {
        // 비동기 처리를 위해 먼저 PDF 전환 후 페이지 이동
        handleChangePdf(pdfIndex).then(() => {
          // PDF가 로드된 후 페이지 이동
          setTimeout(() => {
            handlePageChange(field.page || 1);
          }, 300);
        });
        return;
      }
    }
    
    // 같은 PDF인 경우 바로 페이지 이동
    handlePageChange(field.page || 1);
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
        <Typography variant="h6">재서명 정보를 불러오는 중입니다...</Typography>
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
        </Paper>
      </Box>
    );
  }
  
  // 제출 성공 표시
  if (submitSuccess) {
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
          <CheckCircleIcon sx={{ fontSize: 60, color: '#4CAF50', mb: 2 }} />
          <Typography variant="h5" sx={{ mb: 2 }}>
            재서명이 완료되었습니다
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            서명이 성공적으로 제출되었습니다. 감사합니다.
          </Typography>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              backgroundColor: '#F8F8FA',
              borderRadius: 1,
              textAlign: 'left'
            }}
          >
            <Typography variant="body2" sx={{ mb: 1, color: '#555' }}>
              <strong>안내 사항 :</strong>
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, color: '#555' }}>
              • 이전에 메일로 전송된 결과 페이지에서 서명된 PDF를 다운로드하실 수 있습니다.
            </Typography>
            <Typography variant="body2" sx={{ color: '#555' }}>
              • 계약 상태는 메일에 포함된 링크를 통해 언제든지 확인하실 수 있습니다.
            </Typography>
          </Paper>
        </Paper>
      </Box>
    );
  }
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100vh',
      bgcolor: '#f5f5f5',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1200
    }}>
      {/* 헤더 */}
      <Box sx={{ 
        bgcolor: '#fff', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
        p: 2,
        zIndex: 10
      }}>
        <Typography variant="h6" component="div">
          재서명 요청 처리
        </Typography>
        {participant && (
          <Typography variant="body2" color="text.secondary">
            {participant.name} 님, 수정이 필요한 항목에 재서명해 주세요.
          </Typography>
        )}
        {contract && (
          <Typography variant="subtitle2" sx={{ mt: 1 }}>
            계약명: {contract.title}
          </Typography>
        )}
      </Box>
      
      {/* 메인 컨텐츠 영역 */}
      <Box sx={{ 
        display: 'flex', 
        flex: 1,
        overflow: 'hidden'
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
                key={`page_${index + 1}`}
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
                  key={`page_${index + 1}`}
                  pageNumber={index + 1}
                  scale={pdfScale}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                >
                  {/* 필드 오버레이 - 현재 페이지에 해당하는 필드만 표시 */}
                  <Box sx={{ position: 'absolute', inset: 0 }}>
                    {correctionFields
                      .filter(field => {
                        // 현재 선택된 PDF에 속한 필드만 표시
                        const isPdfMatch = pdfs.length > 0 && 
                                         currentPdfIndex < pdfs.length && 
                                         field.pdfId === pdfs[currentPdfIndex].id;
                        // 현재 페이지의 필드만 표시 (PDF 페이지 인덱스는 0부터 시작하므로 +1)
                        const isCurrentPage = field.page === index + 1;
                        
                        
                        return isPdfMatch && isCurrentPage;
                      })
                      .map((field) => {
                        const isSignatureField = field.fieldName && field.fieldName.startsWith('signature');
                        const isCheckboxField = field.fieldName && field.fieldName.startsWith('checkbox');
                        const hasValue = !!fieldValues[field.id];
                        
                        return (
                          <div
                            key={field.id}
                            onClick={() => {
                              if (isSignatureField) {
                                startSignatureMode(field.id);
                              } else if (isCheckboxField) {
                                // 체크박스 값 토글 (true/false로 저장)
                                handleFieldValueChange(field.id, !fieldValues[field.id]);
                              }
                            }}
                            style={{
                              position: 'absolute',
                              left: `${field.relativeX * 100}%`,
                              top: `${field.relativeY * 100}%`,
                              width: `${field.relativeWidth * 100}%`,
                              height: `${field.relativeHeight * 100}%`,
                              border: '2px solid #FF5722',
                              backgroundColor: 'rgba(255, 87, 34, 0.1)',
                              cursor: isSignatureField || isCheckboxField ? 'pointer' : 'default',
                              boxSizing: 'border-box',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              fontSize: '12px',
                              color: '#FF5722',
                              zIndex: 2
                            }}
                          >
                            {isSignatureField && hasValue ? (
                              <img 
                                src={fieldValues[field.id]} 
                                alt="서명" 
                                style={{ 
                                  maxWidth: '100%', 
                                  maxHeight: '100%', 
                                  objectFit: 'contain' 
                                }} 
                              />
                            ) : isSignatureField ? (
                              "여기를 클릭하여 서명하세요"
                            ) : isCheckboxField ? (
                              <Box sx={{ 
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                              }}>
                                {fieldValues[field.id] ? (
                                  <CheckCircleIcon sx={{ color: '#4CAF50', fontSize: '24px' }} />
                                ) : (
                                  "클릭하여 체크"
                                )}
                              </Box>
                            ) : (
                              <TextField
                                value={fieldValues[field.id] || ''}
                                onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                                variant="standard"
                                fullWidth
                                InputProps={{
                                  disableUnderline: true,
                                  style: { 
                                    fontSize: '12px',
                                    textAlign: 'center',
                                    height: '100%'
                                  }
                                }}
                                inputProps={{
                                  maxLength: getMaxLength(field.formatCodeId)
                                }}
                                sx={{
                                  height: '100%',
                                  '& input': {
                                    padding: 0,
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                  </Box>
                </Page>
              </Box>
            ))}
          </Document>
          {/* 페이지 네비게이션 */}
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
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <NavigateBeforeIcon />
            </IconButton>
            
            <Typography sx={{ mx: 2 }}>
              페이지 {currentPage} / {numPages}
            </Typography>
            
            <IconButton 
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= numPages}
            >
              <NavigateNextIcon />
            </IconButton>
          </Box>
        </Box>
        
        {/* 오른쪽 필드 정보 영역 */}
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
            flexDirection: 'column',
            gap: 2
          }}>
            <Typography variant="h6">재서명이 필요한 필드</Typography>
            
            {/* 스크롤 가능한 오른쪽 패널 내용 */}
            {correctionFields.length > 0 ? (
              <>
                <Alert severity="info" sx={{ mb: 2 }}>
                  수정 필요 영역 {correctionFields.length}개를 작성해 주세요.
                </Alert>
                
                {/* 계약서 선택 UI */}
                {pdfs.length > 1 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      계약서 선택
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {pdfs.map((pdf, idx) => (
                        <Button
                          key={pdf.id}
                          variant={currentPdfIndex === idx ? "contained" : "outlined"}
                          color="primary"
                          size="small"
                          onClick={() => handleChangePdf(idx)}
                        >
                          {pdf.fileName || `계약서 ${idx + 1}`}
                        </Button>
                      ))}
                    </Box>
                  </Box>
                )}
                
                {/* 현재 선택된 PDF에 대한 필드만 표시 */}
                {correctionFields
                  .filter(field => {
                    // 현재 선택된 PDF에 속한 필드만 표시
                    const isPdfMatch = pdfs.length > 0 && 
                                     currentPdfIndex < pdfs.length && 
                                     field.pdfId === pdfs[currentPdfIndex].id;
                    return isPdfMatch;
                  })
                  .map((field) => {
                    const isSignatureField = field.fieldName && field.fieldName.startsWith('signature');
                    const isCheckboxField = field.fieldName && field.fieldName.startsWith('checkbox');
                    const hasValue = !!fieldValues[field.id];
                    
                    return (
                      <Paper
                        key={field.id}
                        elevation={0}
                        onClick={() => navigateToField(field)}
                        sx={{
                          p: 2,
                          border: '1px solid',
                          borderColor: hasValue ? '#E8F5E9' : '#FFEBEE',
                          borderRadius: 1,
                          position: 'relative',
                          cursor: 'pointer',
                          '&:hover': {
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          }
                        }}
                      >
                        <Typography variant="subtitle2">
                          {isSignatureField ? '서명 필드' : 
                           isCheckboxField ? '체크박스 필드' :
                           field.fieldName && field.fieldName.startsWith('text') ? '텍스트 필드' : '필드'}
                          {field.page && <Typography variant="caption" sx={{ ml: 1 }}>({field.page}페이지)</Typography>}
                        </Typography>
                        
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          {field.correctionComment || '수정이 필요한 필드입니다.'}
                        </Typography>
                        
                        {isSignatureField ? (
                          hasValue ? (
                            <Box sx={{ 
                              width: '100%',
                              height: '80px',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              border: '1px solid #E0E0E0',
                              borderRadius: '4px',
                              p: 0.5,
                              mb: 1,
                              bgcolor: '#f9f9f9'
                            }}>
                              <img 
                                src={fieldValues[field.id]} 
                                alt="서명" 
                                style={{ 
                                  maxWidth: '100%', 
                                  maxHeight: '100%', 
                                  objectFit: 'contain' 
                                }} 
                              />
                            </Box>
                          ) : (
                            <Button
                              variant="outlined"
                              onClick={(e) => {
                                e.stopPropagation();
                                startSignatureMode(field.id);
                              }}
                              fullWidth
                              sx={{ 
                                mb: 1,
                                height: '40px',
                                borderColor: '#FF5722',
                                color: '#FF5722',
                                '&:hover': {
                                  borderColor: '#E64A19',
                                  backgroundColor: 'rgba(255, 87, 34, 0.04)'
                                }
                              }}
                            >
                              서명하기
                            </Button>
                          )
                        ) : isCheckboxField ? (
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            mb: 1
                          }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={!!fieldValues[field.id]}
                                  onChange={(e) => handleFieldValueChange(field.id, e.target.checked)}
                                  sx={{ 
                                    color: '#FF5722',
                                    '&.Mui-checked': {
                                      color: '#4CAF50',
                                    }
                                  }}
                                />
                              }
                              label="체크하기"
                            />
                          </Box>
                        ) : (
                          <>
                            <TextField
                              value={fieldValues[field.id] || ''}
                              onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                              fullWidth
                              size="small"
                              placeholder="값을 입력하세요"
                              inputProps={{
                                maxLength: getMaxLength(field.formatCodeId)
                              }}
                              sx={{ mb: 1 }}
                            />
                            {field.formatCodeId && getFormatGuideText(field.formatCodeId) && (
                              <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#0277bd', fontSize: '0.75rem' }}>
                                <span style={{ fontSize: '0.7rem', marginRight: '4px' }}>ℹ️</span>
                                {getFormatGuideText(field.formatCodeId)}
                              </Typography>
                            )}
                          </>
                        )}
                        
                        {hasValue && (
                          <Button
                            variant="text"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isSignatureField) {
                                startSignatureMode(field.id);
                              } else {
                                handleFieldValueChange(field.id, '');
                              }
                            }}
                            sx={{ 
                              fontSize: '0.75rem',
                              color: 'text.secondary',
                              mt: 1
                            }}
                          >
                            {isSignatureField ? '서명 다시 그리기' : '값 지우기'}
                          </Button>
                        )}
                        
                        {hasValue && (
                          <CheckCircleIcon 
                            sx={{ 
                              position: 'absolute', 
                              top: 10, 
                              right: 10, 
                              color: '#4CAF50',
                              fontSize: 20
                            }} 
                          />
                        )}
                      </Paper>
                    );
                  })}
              </>
            ) : (
              <Alert severity="warning">
                재서명이 필요한 필드가 없습니다.
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
              onClick={handleSubmit}
              disabled={submitting || correctionFields.length === 0}
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
              {submitting ? (
                <>
                  <CircularProgress size={24} sx={{ color: 'white', mr: 1 }} />
                  처리 중...
                </>
              ) : (
                '재서명 제출하기'
              )}
            </Button>
          </Box>
        </Box>
      </Box>
      
      {/* 서명 모달 */}
      {signatureMode && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Paper
            sx={{
              width: '90%',
              maxWidth: '500px',
              p: 3,
              borderRadius: 2
            }}
          >
            <Typography variant="h6" gutterBottom>
              서명 입력
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              아래 영역에 서명을 그려주세요.
            </Typography>
            
            <Box
              sx={{
                border: '1px solid #ddd',
                borderRadius: 1,
                bgcolor: '#fff',
                height: '200px',
                touchAction: 'none',
                mb: 2
              }}
            >
              <SignaturePad
                ref={signatureCanvasRef}
                canvasProps={{
                  width: 500,
                  height: 200,
                  className: 'signature-canvas'
                }}
                dotSize={3} // 점 크기 설정
                minWidth={3} // 최소 선 굵기
                maxWidth={5} // 최대 선 굵기 (펜 압력에 따라 달라질 수 있음)
                velocityFilterWeight={0.5} // 속도에 따른 선 굵기 변화 정도
                backgroundColor="rgba(255, 255, 255, 0)" // 투명 배경
              />
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button 
                variant="outlined" 
                onClick={clearSignatureCanvas}
                sx={{
                  borderColor: '#E0E0E0',
                  color: '#666',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    borderColor: '#CCCCCC',
                  }
                }}
              >
                지우기
              </Button>
              <Button 
                variant="outlined" 
                onClick={cancelSignature}
                sx={{
                  borderColor: '#E0E0E0',
                  color: '#666',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    borderColor: '#CCCCCC',
                  }
                }}
              >
                취소
              </Button>
              <Button 
                variant="contained" 
                onClick={saveSignature}
                sx={{
                  backgroundColor: '#3182F6',
                  '&:hover': {
                    backgroundColor: '#1565C0',
                  }
                }}
              >
                저장
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
      
      {/* 알림 스낵바 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ContractCorrectionResponsePage; 