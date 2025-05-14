import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tooltip,
  Modal,
  TextField,
  FormHelperText
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  Print as PrintIcon,
  InfoOutlined as InfoIcon,
  Download as DownloadIcon,
  ZoomIn as ZoomInIcon,
  Update as UpdateIcon
} from '@mui/icons-material';
import { format, differenceInMonths } from 'date-fns';

const FacilitiesDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [facility, setFacility] = useState(null);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [facilityImages, setFacilityImages] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null
  });
  const [imageModal, setImageModal] = useState({
    open: false,
    imageUrl: '',
    title: ''
  });
  // 사용연한 관리를 위한 상태 변수
  const [usefulLifeDialog, setUsefulLifeDialog] = useState(false);
  const [usefulLifeMonths, setUsefulLifeMonths] = useState(0);
  const [usefulLifeUpdateReason, setUsefulLifeUpdateReason] = useState('');
  const [updatingUsefulLife, setUpdatingUsefulLife] = useState(false);
  const [usefulLifeError, setUsefulLifeError] = useState('');

  // 스낵바 메시지 표시
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // 스낵바 닫기
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // 다이얼로그 닫기
  const handleCloseDialog = () => {
    setConfirmDialog({
      ...confirmDialog,
      open: false
    });
  };

  // 이미지 모달 열기
  const handleOpenImageModal = (imageUrl, title) => {
    setImageModal({
      open: true,
      imageUrl,
      title
    });
  };

  // 이미지 모달 닫기
  const handleCloseImageModal = () => {
    setImageModal({
      ...imageModal,
      open: false
    });
  };

  // 사용연한 수정 모달 열기
  const handleOpenUsefulLifeDialog = () => {
    if (facility) {
      console.log('시설물 정보:', facility);
      console.log('시설물 ID:', facility.id, 'facilityId:', facility.facilityId);
      setUsefulLifeMonths(facility.usefulLifeMonths);
      setUsefulLifeUpdateReason('');
      setUsefulLifeError('');
      setUsefulLifeDialog(true);
    }
  };

  // 사용연한 수정 모달 닫기
  const handleCloseUsefulLifeDialog = () => {
    setUsefulLifeDialog(false);
  };

  // 사용연한 업데이트 처리
  const handleUpdateUsefulLife = async () => {
    // 입력 유효성 검사
    if (!usefulLifeMonths || usefulLifeMonths < 1) {
      setUsefulLifeError('사용연한은 1개월 이상이어야 합니다');
      return;
    }
    
    if (!usefulLifeUpdateReason.trim()) {
      setUsefulLifeError('수정 사유를 입력해주세요');
      return;
    }

    // ID 유효성 검사
    if (!facility || !facility.facilityId) {
      console.error('시설물 ID가 유효하지 않습니다:', facility);
      setUsefulLifeError('시설물 ID를 찾을 수 없습니다. 페이지를 새로고침하고 다시 시도해주세요.');
      return;
    }

    setUpdatingUsefulLife(true);
    
    try {
      // 요청 데이터 구성
      const requestData = {
        id: Number(facility.facilityId),
        usefulLifeMonths: usefulLifeMonths,
        usefulLifeUpdateReason: usefulLifeUpdateReason
      };
      
      console.log('사용연한 업데이트 요청 데이터:', requestData);
      
      // API 호출
      const response = await fetch('http://localhost:8080/api/facilities/useful-life', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('서버 응답:', response.status, errorData);
        throw new Error('사용연한 업데이트 실패');
      }

      const updatedFacility = await response.json();
      setFacility(updatedFacility);
      showSnackbar('사용연한이 성공적으로 업데이트 되었습니다', 'success');
      
      // 두 다이얼로그 모두 닫기
      handleCloseDialog(); // 확인 다이얼로그 닫기
      handleCloseUsefulLifeDialog(); // 사용연한 재평가 다이얼로그 닫기
    } catch (error) {
      console.error('사용연한 업데이트 오류:', error);
      showSnackbar('사용연한 업데이트 중 오류가 발생했습니다', 'error');
      handleCloseDialog(); // 오류 발생 시에도 확인 다이얼로그는 닫기
    } finally {
      setUpdatingUsefulLife(false);
    }
  };

  // 남은 사용기간 계산 함수 (개월)
  const calculateRemainingLifeMonths = () => {
    if (!facility || !facility.installationDate || !facility.usefulLifeMonths) {
      return null;
    }

    const installDate = new Date(facility.installationDate);
    const today = new Date();
    const totalLifeMonths = facility.usefulLifeMonths;
    const usedMonths = differenceInMonths(today, installDate);
    const remainingMonths = totalLifeMonths - usedMonths;
    
    return remainingMonths > 0 ? remainingMonths : 0;
  };

  // 남은 사용기간 형식화 함수
  const formatRemainingLife = () => {
    const remainingMonths = calculateRemainingLifeMonths();
    if (remainingMonths === null) return '';
    
    if (remainingMonths <= 0) {
      return '(사용기간 만료)';
    }
    
    const years = Math.floor(remainingMonths / 12);
    const months = remainingMonths % 12;
    
    if (years > 0 && months > 0) {
      return `(남은 기간: ${years}년 ${months}개월)`;
    } else if (years > 0) {
      return `(남은 기간: ${years}년)`;
    } else {
      return `(남은 기간: ${months}개월)`;
    }
  };

  useEffect(() => {
    const fetchFacility = async () => {
      setLoading(true);
      try {
        // 실제 API 호출
        const response = await fetch(`http://localhost:8080/api/facilities/${id}`, {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('시설물 정보를 불러오는데 실패했습니다.');
        }
        
        const facilityData = await response.json();
        setFacility(facilityData);
        
        // 수리 이력 데이터 로드
        fetchServiceRequests();
        
        // 이미지 데이터 로드
        fetchFacilityImages();
        
        setLoading(false);
      } catch (error) {
        console.error('시설물 정보 로드 실패:', error);
        setLoading(false);
        // 에러 발생 시 시설물 정보를 null로 설정
        setFacility(null);
        setServiceRequests([]);
        setFacilityImages([]);
      }
    };

    fetchFacility();
  }, [id]);

  // 수리 이력 API 호출
  const fetchServiceRequests = async () => {
    try {
      // 시설물에 대한 수리 이력 목록 가져오기
      const serviceResponse = await fetch(`http://localhost:8080/api/service-requests/facility/${id}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (serviceResponse.ok) {
        const serviceData = await serviceResponse.json();
        // 서버에서 바로 목록을 반환하므로 그대로 설정
        setServiceRequests(serviceData || []);
      } else {
        // 수리 이력 API 호출 실패 시 빈 배열로 설정
        setServiceRequests([]);
      }
    } catch (error) {
      console.error('수리 이력 로드 실패:', error);
      setServiceRequests([]);
    }
  };

  // 이미지 로드 함수
  const fetchFacilityImages = async () => {
    try {
      const imageResponse = await fetch(`http://localhost:8080/api/facility-images/facility/${id}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        setFacilityImages(imageData || []);
      } else {
        setFacilityImages([]);
      }
    } catch (error) {
      console.error('시설물 이미지 로드 실패:', error);
      setFacilityImages([]);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleEdit = () => {
    navigate(`/facility-edit/${id}`);
  };

  const handleRepairRequest = () => {
    navigate(`/service-request/create/${id}`);
  };
  
  const handleViewServiceDetail = (serviceRequestId) => {
    navigate(`/service-request/${serviceRequestId}`);
  };
  
  // 날짜 포맷 함수
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'yy-MM-dd');
    } catch (error) {
      return dateString;
    }
  };
  
  // 금액 포맷 함수
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  // 특정 타입의 이미지를 찾는 함수
  const getImageByType = (typeCode) => {
    const image = facilityImages.find(img => img.imageTypeCode === typeCode);
    return image ? image.imageUrl : null;
  };

  // QR 코드 다운로드 처리
  const handleDownloadQRCode = () => {
    const qrCodeImageUrl = getImageByType('002005_0005');
    if (!qrCodeImageUrl) {
      showSnackbar('다운로드할 QR 코드 이미지가 없습니다.', 'error');
      return;
    }

    // 파일명 추출
    const fileName = qrCodeImageUrl.split('/').pop();
    
    // 다운로드 요청
    fetch(`http://localhost:8080/api/facility-images/download/${fileName}`, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('QR 코드 다운로드에 실패했습니다.');
      }
      return response.blob();
    })
    .then(blob => {
      // 다운로드 링크 생성
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${facility.serialNumber || 'facility'}_qrcode.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showSnackbar('QR 코드가 성공적으로 다운로드되었습니다.', 'success');
    })
    .catch(error => {
      console.error('QR 코드 다운로드 오류:', error);
      showSnackbar('QR 코드 다운로드 중 오류가 발생했습니다.', 'error');
    });
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography color="textSecondary">시설물 데이터를 불러오고 있습니다...</Typography>
      </Box>
    );
  }

  if (!facility) {
    return (
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', backgroundColor: '#F8F8FE' }}>
        <Box sx={{ 
          backgroundColor: 'white', 
          p: 4, 
          borderRadius: 2, 
          boxShadow: '0px 3px 10px rgba(0, 0, 0, 0.1)', 
          textAlign: 'center', 
          maxWidth: 500 
        }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#f44336' }}>
            시설물 정보를 찾을 수 없습니다
          </Typography>
          <Typography color="textSecondary" sx={{ mb: 3 }}>
            요청하신 시설물 정보를 불러오는데 실패했습니다. 다시 시도하거나 관리자에게 문의하세요.
          </Typography>
          <Button 
            variant="contained" 
            onClick={handleBack}
            sx={{ 
              minWidth: 120,
              backgroundColor: '#40a9ff',
              '&:hover': {
                backgroundColor: '#1890ff',
              },
            }}
          >
            목록으로 돌아가기
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#F8F8FE', minHeight: '100vh' }}>
      {/* 상단 헤더 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handleBack} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#3A3A3A' }}>
            시설물 상세정보
          </Typography>
        </Box>
      </Box>

      {/* 기본 정보 */}
      <Paper sx={{ mb: 3, p: 3, borderRadius: 2 }}>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            fontWeight: 600, 
            color: '#3A3A3A',
            mb: 2 
          }}
        >
          시설물 기본 정보
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', borderBottom: '1px solid #EEEEEE', py: 1.5 }}>
              <Typography 
                sx={{ 
                  width: '140px',
                  color: '#666',
                  fontWeight: 500
                }}
              >
                관리 번호
              </Typography>
              <Typography>{facility.managementNumber}</Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', borderBottom: '1px solid #EEEEEE', py: 1.5 }}>
              <Typography 
                sx={{ 
                  width: '140px',
                  color: '#666',
                  fontWeight: 500
                }}
              >
                시리얼 번호
              </Typography>
              <Typography>{facility.serialNumber}</Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', borderBottom: '1px solid #EEEEEE', py: 1.5 }}>
              <Typography 
                sx={{ 
                  width: '140px',
                  color: '#666',
                  fontWeight: 500
                }}
              >
                시설물 유형
              </Typography>
              <Typography>{facility.facilityTypeName}</Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', borderBottom: '1px solid #EEEEEE', py: 1.5 }}>
              <Typography 
                sx={{ 
                  width: '140px',
                  color: '#666',
                  fontWeight: 500
                }}
              >
                품목
              </Typography>
              <Typography>{facility.brandName}</Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', borderBottom: '1px solid #EEEEEE', py: 1.5 }}>
              <Typography 
                sx={{ 
                  width: '140px',
                  color: '#666',
                  fontWeight: 500
                }}
              >
                상태
              </Typography>
              <Chip 
                label={facility.statusName} 
                size="small" 
                color={
                  facility.statusCode === '002003_0001' ? 'success' : 
                  facility.statusCode === '002003_0002' ? 'error' :
                  facility.statusCode === '002003_0003' ? 'warning' : 'default'
                } 
                sx={{ height: 22, fontSize: '0.75rem' }}
              />
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', borderBottom: '1px solid #EEEEEE', py: 1.5 }}>
              <Typography 
                sx={{ 
                  width: '140px',
                  color: '#666',
                  fontWeight: 500
                }}
              >
                설치 유형
              </Typography>
              <Typography>{facility.installationTypeName}</Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', borderBottom: '1px solid #EEEEEE', py: 1.5 }}>
              <Typography 
                sx={{ 
                  width: '140px',
                  color: '#666',
                  fontWeight: 500
                }}
              >
                사용 연한
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ mr: 1 }}>{facility.usefulLifeMonths}개월 ({Math.floor(facility.usefulLifeMonths/12)}년)</Typography>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  size="small" 
                  startIcon={<UpdateIcon />}
                  onClick={handleOpenUsefulLifeDialog}
                  sx={{ ml: 1, fontSize: '0.7rem', height: 24 }}
                >
                  재평가
                </Button>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', borderBottom: '1px solid #EEEEEE', py: 1.5 }}>
              <Typography 
                sx={{ 
                  width: '140px',
                  color: '#666',
                  fontWeight: 500
                }}
              >
                설치일
              </Typography>
              <Typography>{formatDate(facility.installationDate)}</Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', borderBottom: '1px solid #EEEEEE', py: 1.5 }}>
              <Typography 
                sx={{ 
                  width: '140px',
                  color: '#666',
                  fontWeight: 500
                }}
              >
                보증 만료일
              </Typography>
              <Typography>
                {formatDate(facility.warrantyEndDate)} <Typography component="span" color="text.secondary">{formatRemainingLife()}</Typography>
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', borderBottom: '1px solid #EEEEEE', py: 1.5 }}>
              <Typography 
                sx={{ 
                  width: '140px',
                  color: '#666',
                  fontWeight: 500
                }}
              >
                취득가액
              </Typography>
              <Typography>{formatCurrency(facility.acquisitionCost)}</Typography>
            </Box>
          </Grid>

        </Grid>
      </Paper>

      {/* 설치 정보 */}
      <Paper sx={{ mb: 3, p: 3, borderRadius: 2 }}>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            fontWeight: 600, 
            color: '#3A3A3A',
            mb: 2 
          }}
        >
          설치 정보
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', borderBottom: '1px solid #EEEEEE', py: 1.5 }}>
              <Typography 
                sx={{ 
                  width: '140px',
                  color: '#666',
                  fontWeight: 500
                }}
              >
                현재 위치
              </Typography>
              <Typography>{facility.locationStoreName} ({facility.locationStoreNumber})</Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', borderBottom: '1px solid #EEEEEE', py: 1.5 }}>
              <Typography 
                sx={{ 
                  width: '140px',
                  color: '#666',
                  fontWeight: 500
                }}
              >
                등록자
              </Typography>
              <Typography>{facility.createdBy || '-'}</Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', borderBottom: '1px solid #EEEEEE', py: 1.5 }}>
              <Typography 
                sx={{ 
                  width: '140px',
                  color: '#666',
                  fontWeight: 500
                }}
              >
                최초 설치일
              </Typography>
              <Typography>{formatDate(facility.createdAt)}</Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', borderBottom: '1px solid #EEEEEE', py: 1.5 }}>
              <Typography 
                sx={{ 
                  width: '140px',
                  color: '#666',
                  fontWeight: 500
                }}
              >
                수리요청
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                size="small"
                onClick={handleRepairRequest}
                sx={{ fontSize: '0.75rem', height: 24 }}
              >
                수리 요청
              </Button>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', borderBottom: '1px solid #EEEEEE', py: 1.5 }}>
              <Typography 
                sx={{ 
                  width: '140px',
                  color: '#666',
                  fontWeight: 500
                }}
              >
                설치 주소
              </Typography>
              <Typography>{facility.locationAddress}</Typography>
            </Box>
          </Grid>

        </Grid>
      </Paper>

      {/* 시설물 QR코드 */}
      <Paper sx={{ mb: 3, p: 3, borderRadius: 2 }}>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            fontWeight: 600, 
            color: '#3A3A3A',
            mb: 2 
          }}
        >
          시설물 QR코드
        </Typography>

        <Grid container alignItems="center" spacing={2}>
          <Grid item xs={12} sm={4} md={2}>
            <Box
              sx={{
                width: '100%',
                paddingTop: '100%',
                position: 'relative',
                backgroundColor: '#F8F9FA',
                borderRadius: 1,
                overflow: 'hidden',
                maxWidth: '150px',
                mx: 'auto',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: '0px 0px 10px rgba(0,0,0,0.2)'
                }
              }}
              onClick={() => handleOpenImageModal(getImageByType('002005_0005'), '시설물 QR코드')}
            >
              {getImageByType('002005_0005') ? (
                <>
                  <img 
                    src={getImageByType('002005_0005')} 
                    alt="시설물 QR코드"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.3s',
                      '&:hover': {
                        opacity: 1
                      }
                    }}
                  >
                    <ZoomInIcon sx={{ color: 'white', fontSize: '2rem' }} />
                  </Box>
                </>
              ) : (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#EEEEEE'
                  }}
                >
                  <Typography sx={{ color: '#888', fontSize: '0.75rem', textAlign: 'center', px: 1 }}>
                    QR코드 이미지 없음
                  </Typography>
                </Box>
              )}
              <Typography
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  p: 0.5,
                  fontSize: '0.75rem'
                }}
              >
                시설물 QR코드
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={8} md={10}>
            <Box sx={{ pl: { sm: 2 }, pt: { xs: 2, sm: 0 } }}>
              <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
                이 QR코드는 시설물 고유 식별을 위한 코드입니다. 스캔하여 시설물 정보를 확인하거나 관련 서비스를 이용할 수 있습니다.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadQRCode}
                disabled={!getImageByType('002005_0005')}
                sx={{
                  mt: 2,
                  borderColor: '#1976d2',
                  color: '#1976d2',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.04)',
                    borderColor: '#1976d2',
                  },
                }}
              >
                QR코드 다운로드
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* 시설물 이미지 */}
      <Paper sx={{ mb: 3, p: 3, borderRadius: 2 }}>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            fontWeight: 600, 
            color: '#3A3A3A',
            mb: 2 
          }}
        >
          시설물 이미지
        </Typography>

        <Grid container spacing={2}>
          {/* 정면 이미지 */}
          <Grid item xs={12} sm={6} md={3}>
            <Box
              sx={{
                width: '100%',
                paddingTop: '100%',
                position: 'relative',
                backgroundColor: '#F8F9FA',
                borderRadius: 1,
                overflow: 'hidden',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: '0px 0px 10px rgba(0,0,0,0.2)'
                }
              }}
              onClick={() => handleOpenImageModal(getImageByType('002005_0001'), '정면 이미지')}
            >
              {getImageByType('002005_0001') ? (
                <>
                  <img 
                    src={getImageByType('002005_0001')} 
                    alt="시설물 정면 이미지"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.3s',
                      '&:hover': {
                        opacity: 1
                      }
                    }}
                  >
                    <ZoomInIcon sx={{ color: 'white', fontSize: '2rem' }} />
                  </Box>
                </>
              ) : (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#EEEEEE'
                  }}
                >
                  <Typography sx={{ color: '#888', fontSize: '0.875rem' }}>
                    이미지없음
                  </Typography>
                </Box>
              )}
              <Typography
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  p: 0.5,
                  fontSize: '0.75rem'
                }}
              >
                정면
              </Typography>
            </Box>
          </Grid>
          
          {/* 후면 이미지 */}
          <Grid item xs={12} sm={6} md={3}>
            <Box
              sx={{
                width: '100%',
                paddingTop: '100%',
                position: 'relative',
                backgroundColor: '#F8F9FA',
                borderRadius: 1,
                overflow: 'hidden',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: '0px 0px 10px rgba(0,0,0,0.2)'
                }
              }}
              onClick={() => handleOpenImageModal(getImageByType('002005_0002'), '후면 이미지')}
            >
              {getImageByType('002005_0002') ? (
                <>
                  <img 
                    src={getImageByType('002005_0002')} 
                    alt="시설물 후면 이미지"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.3s',
                      '&:hover': {
                        opacity: 1
                      }
                    }}
                  >
                    <ZoomInIcon sx={{ color: 'white', fontSize: '2rem' }} />
                  </Box>
                </>
              ) : (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#EEEEEE'
                  }}
                >
                  <Typography sx={{ color: '#888', fontSize: '0.875rem' }}>
                    이미지없음
                  </Typography>
                </Box>
              )}
              <Typography
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  p: 0.5,
                  fontSize: '0.75rem'
                }}
              >
                후면
              </Typography>
            </Box>
          </Grid>
          
          {/* 좌측면 이미지 */}
          <Grid item xs={12} sm={6} md={3}>
            <Box
              sx={{
                width: '100%',
                paddingTop: '100%',
                position: 'relative',
                backgroundColor: '#F8F9FA',
                borderRadius: 1,
                overflow: 'hidden',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: '0px 0px 10px rgba(0,0,0,0.2)'
                }
              }}
              onClick={() => handleOpenImageModal(getImageByType('002005_0003'), '좌측면 이미지')}
            >
              {getImageByType('002005_0003') ? (
                <>
                  <img 
                    src={getImageByType('002005_0003')} 
                    alt="시설물 좌측면 이미지"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.3s',
                      '&:hover': {
                        opacity: 1
                      }
                    }}
                  >
                    <ZoomInIcon sx={{ color: 'white', fontSize: '2rem' }} />
                  </Box>
                </>
              ) : (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#EEEEEE'
                  }}
                >
                  <Typography sx={{ color: '#888', fontSize: '0.875rem' }}>
                    이미지없음
                  </Typography>
                </Box>
              )}
              <Typography
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  p: 0.5,
                  fontSize: '0.75rem'
                }}
              >
                좌측면
              </Typography>
            </Box>
          </Grid>
          
          {/* 우측면 이미지 */}
          <Grid item xs={12} sm={6} md={3}>
            <Box
              sx={{
                width: '100%',
                paddingTop: '100%',
                position: 'relative',
                backgroundColor: '#F8F9FA',
                borderRadius: 1,
                overflow: 'hidden',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: '0px 0px 10px rgba(0,0,0,0.2)'
                }
              }}
              onClick={() => handleOpenImageModal(getImageByType('002005_0004'), '우측면 이미지')}
            >
              {getImageByType('002005_0004') ? (
                <>
                  <img 
                    src={getImageByType('002005_0004')} 
                    alt="시설물 우측면 이미지"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.3s',
                      '&:hover': {
                        opacity: 1
                      }
                    }}
                  >
                    <ZoomInIcon sx={{ color: 'white', fontSize: '2rem' }} />
                  </Box>
                </>
              ) : (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#EEEEEE'
                  }}
                >
                  <Typography sx={{ color: '#888', fontSize: '0.875rem' }}>
                    이미지없음
                  </Typography>
                </Box>
              )}
              <Typography
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  p: 0.5,
                  fontSize: '0.75rem'
                }}
              >
                우측면
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* 이미지 확대 모달 */}
      <Modal
        open={imageModal.open}
        onClose={handleCloseImageModal}
        aria-labelledby="modal-image-title"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: '80%', md: '70%', lg: '60%' },
          maxHeight: '90vh',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <Typography id="modal-image-title" variant="h6" component="h2" sx={{ mb: 2 }}>
            {imageModal.title}
          </Typography>
          <Box sx={{ 
            width: '100%', 
            height: 'calc(90vh - 160px)', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            overflow: 'hidden'
          }}>
            {imageModal.imageUrl ? (
              <img 
                src={imageModal.imageUrl} 
                alt={imageModal.title}
                style={{
                  maxWidth: imageModal.title === '시설물 QR코드' ? '400px' : '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  width: imageModal.title === '시설물 QR코드' ? '400px' : 'auto'
                }}
              />
            ) : (
              <Typography variant="body1" color="text.secondary">
                이미지를 불러올 수 없습니다.
              </Typography>
            )}
          </Box>
          <Button 
            onClick={handleCloseImageModal} 
            sx={{ mt: 2 }}
            variant="contained"
          >
            닫기
          </Button>
        </Box>
      </Modal>

      {/* 수리 이력 */}
      <Paper sx={{ mb: 3, p: 3, borderRadius: 2 }}>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            fontWeight: 600, 
            color: '#3A3A3A',
            mb: 2 
          }}
        >
          수리 이력
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#F8F9FA' }}>
                <TableCell align="center">번호</TableCell>
                <TableCell align="center">접수번호</TableCell>
                <TableCell align="center">수리유형</TableCell>
                <TableCell align="center">수리내용</TableCell>
                <TableCell align="center">신청일</TableCell>
                <TableCell align="center">완료일</TableCell>
                <TableCell align="center">처리자</TableCell>
                <TableCell align="center">비용</TableCell>
                <TableCell align="center">상태</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {serviceRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                    <Typography color="textSecondary">
                      수리 이력이 없습니다.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                serviceRequests.map((request, index) => (
                  <TableRow 
                    key={request.serviceRequestId}
                    hover
                    onClick={() => handleViewServiceDetail(request.serviceRequestId)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell align="center">{index + 1}</TableCell>
                    <TableCell align="center">{request.requestNumber}</TableCell>
                    <TableCell align="center">{request.serviceTypeName}</TableCell>
                    <TableCell>{request.requestContent}</TableCell>
                    <TableCell align="center">{formatDate(request.requestDate)}</TableCell>
                    <TableCell align="center">{formatDate(request.completionDate) || '-'}</TableCell>
                    <TableCell align="center">{request.managerName || '-'}</TableCell>
                    <TableCell align="right">{formatCurrency(request.cost)}</TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={request.serviceStatusName} 
                        size="small" 
                        color={
                          request.serviceStatusCode === '002010_0001' ? 'default' : 
                          request.serviceStatusCode === '002010_0002' ? 'warning' : 
                          request.serviceStatusCode === '002010_0003' ? 'success' : 'default'
                        } 
                        sx={{ height: 22, fontSize: '0.75rem' }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 하단 버튼 */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Button 
          variant="contained" 
          onClick={handleBack}
          sx={{ 
            minWidth: 120,
            backgroundColor: '#40a9ff',
            '&:hover': {
              backgroundColor: '#1890ff',
            },
          }}
        >
          목록으로
        </Button>
      </Box>

      {/* 스낵바 */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* 확인 다이얼로그 */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCloseDialog}
        PaperProps={{
          sx: { borderRadius: 1 }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1.5, 
          pt: 2,
          fontSize: '1.1rem', 
          fontWeight: 600 
        }}>
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <DialogContentText>
            {confirmDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button 
            onClick={handleCloseDialog} 
            color="inherit"
            size="small"
            sx={{ fontWeight: 500 }}
          >
            취소
          </Button>
          <Button 
            onClick={confirmDialog.onConfirm} 
            color="primary" 
            variant="contained"
            size="small"
            autoFocus
            sx={{ fontWeight: 500 }}
          >
            확인
          </Button>
        </DialogActions>
      </Dialog>

      {/* 사용연한 재평가 다이얼로그 */}
      <Dialog 
        open={usefulLifeDialog} 
        onClose={handleCloseUsefulLifeDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 1,
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid #f0f0f0', 
          pb: 1.5, 
          pt: 2,
          display: 'flex',
          alignItems: 'center'
        }}>
          <UpdateIcon sx={{ mr: 1, color: '#1976d2', fontSize: '1.2rem' }} />
          <Typography variant="subtitle1" component="div" sx={{ fontWeight: 600 }}>
            사용연한 재평가
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 1 }}>
          <Box sx={{ 
            backgroundColor: '#f0f7ff', 
            p: 1.5, 
            borderRadius: 1,
            mb: 2,
            mt: 1,
            border: '1px solid #bae0ff'
          }}>
            <Typography variant="subtitle2" sx={{ color: '#1976d2', fontWeight: 600, mb: 0.5, fontSize: '0.8rem' }}>
              안내사항
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.8rem' }}>
              • 재평가하는 개월수는 <strong>총 사용연한</strong>을 입력해야 합니다.
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
              • 변경 시 <strong>보증 만료일이 자동으로 재계산</strong>됩니다.
            </Typography>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: '#666' }}>
              현재 설정된 사용연한
            </Typography>
            <Typography sx={{ color: '#1976d2', fontWeight: 500, fontSize: '0.9rem' }}>
              {facility.usefulLifeMonths}개월 ({Math.floor(facility.usefulLifeMonths/12)}년 {facility.usefulLifeMonths % 12}개월)
            </Typography>
          </Box>
          
          <TextField
            autoFocus
            margin="dense"
            id="usefulLifeMonths"
            label="새 사용연한 (개월)"
            type="number"
            fullWidth
            variant="outlined"
            value={usefulLifeMonths}
            onChange={(e) => setUsefulLifeMonths(parseInt(e.target.value) || 0)}
            InputProps={{
              inputProps: { min: 1 },
              startAdornment: (
                <Typography sx={{ mr: 0.5, color: '#666', fontSize: '0.8rem' }}>총</Typography>
              )
            }}
            size="small"
            sx={{ mb: 1 }}
          />
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            backgroundColor: usefulLifeMonths > 0 ? '#f5f5f5' : 'transparent',
            p: 0.8,
            borderRadius: 1,
            mb: 1.5
          }}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
              연환산: 
            </Typography>
            <Typography sx={{ ml: 1, fontSize: '0.8rem', color: '#1976d2', fontWeight: 500 }}>
              {Math.floor(usefulLifeMonths / 12)}년 {usefulLifeMonths % 12}개월
            </Typography>
          </Box>
          
          <TextField
            margin="dense"
            id="usefulLifeUpdateReason"
            label="수정 사유 (필수)"
            placeholder="사용연한 변경 사유를 입력해주세요"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={2}
            value={usefulLifeUpdateReason}
            onChange={(e) => setUsefulLifeUpdateReason(e.target.value)}
            size="small"
            sx={{ mt: 0.5, mb: 0.5 }}
          />
          
          {usefulLifeError && (
            <Box sx={{ 
              backgroundColor: '#fff0f0', 
              p: 1, 
              borderRadius: 1, 
              mt: 1.5,
              border: '1px solid #ffccc7'
            }}>
              <Typography color="error" variant="body2" sx={{ fontSize: '0.8rem' }}>
                {usefulLifeError}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: '1px solid #f0f0f0' }}>
          <Button 
            onClick={handleCloseUsefulLifeDialog} 
            color="inherit"
            size="small"
            sx={{ fontWeight: 500 }}
          >
            취소
          </Button>
          <Button 
            onClick={() => {
              // 사용연한 변경 전 한번 더 확인
              setConfirmDialog({
                open: true,
                title: '사용연한 변경 확인',
                message: (
                  <Box sx={{ mt: 1 }}>
                    <Typography>사용연한을 {facility.usefulLifeMonths}개월에서 {usefulLifeMonths}개월로 변경하시겠습니까?</Typography>
                    <Typography sx={{ mt: 1 }}>이 작업은 시설물의 보증 만료일에 영향을 미칩니다.</Typography>
                  </Box>
                ),
                onConfirm: handleUpdateUsefulLife,
              });
            }} 
            variant="contained"
            color="primary" 
            size="small"
            disabled={updatingUsefulLife || !usefulLifeMonths || !usefulLifeUpdateReason.trim()}
            sx={{ fontWeight: 500 }}
          >
            {updatingUsefulLife ? <CircularProgress size={20} /> : '변경 적용'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FacilitiesDetail;
