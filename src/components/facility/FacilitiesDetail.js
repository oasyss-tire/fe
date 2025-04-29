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
  Modal
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  Print as PrintIcon,
  Calculate as CalculateIcon,
  InfoOutlined as InfoIcon,
  Download as DownloadIcon,
  ZoomIn as ZoomInIcon
} from '@mui/icons-material';
import { format, addMonths, isBefore } from 'date-fns';

const FacilitiesDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [facility, setFacility] = useState(null);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [facilityImages, setFacilityImages] = useState([]);
  const [depreciationLoading, setDepreciationLoading] = useState(false);
  const [nextDepreciationDate, setNextDepreciationDate] = useState(null);
  const [isDepreciationAvailable, setIsDepreciationAvailable] = useState(false);
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

  // 다음 감가상각 가능 날짜 계산
  const calculateNextDepreciationDate = (lastValuationDate) => {
    if (!lastValuationDate) {
      // 최초 감가상각의 경우 (이전 평가일이 없음)
      return new Date();
    }
    
    try {
      const lastDate = new Date(lastValuationDate);
      // 마지막 평가일로부터 1개월 후가 다음 감가상각 가능일
      const nextDate = addMonths(lastDate, 1);
      return nextDate;
    } catch (error) {
      console.error('날짜 계산 오류:', error);
      return new Date();
    }
  };

  // 현재 감가상각 가능 여부 확인
  const checkDepreciationAvailability = (nextDate) => {
    if (!nextDate) return false;
    
    const today = new Date();
    // 오늘이 다음 감가상각 가능일 이후인지 확인
    return !isBefore(today, nextDate);
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
        
        // 다음 감가상각 가능 날짜 계산
        const nextDate = calculateNextDepreciationDate(facilityData.lastValuationDate);
        setNextDepreciationDate(nextDate);
        
        // 현재 감가상각 가능 여부 확인
        setIsDepreciationAvailable(checkDepreciationAvailability(nextDate));
        
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

  // 감가상각 처리 함수
  const handleProcessDepreciation = () => {
    // 감가상각 가능 여부 재확인
    if (!isDepreciationAvailable) {
      const formattedDate = nextDepreciationDate ? format(nextDepreciationDate, 'yy-MM-dd') : '알 수 없음';
      showSnackbar(`아직 감가상각을 진행할 수 없습니다. 다음 감가상각 가능일: ${formattedDate}`, 'warning');
      return;
    }
    
    setConfirmDialog({
      open: true,
      title: '감가상각 처리 확인',
      message: '이 시설물에 대한 감가상각을 처리하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      onConfirm: confirmProcessDepreciation
    });
  };

  // 감가상각 처리 확인
  const confirmProcessDepreciation = async () => {
    setDepreciationLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/depreciations/facility/${id}/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '감가상각 처리에 실패했습니다.');
      }

      const result = await response.json();
      
      // 시설물 정보 새로고침 (현재 가치가 업데이트되었을 것임)
      const updatedFacilityResponse = await fetch(`http://localhost:8080/api/facilities/${id}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (updatedFacilityResponse.ok) {
        const updatedFacility = await updatedFacilityResponse.json();
        setFacility(updatedFacility);
        
        // 다음 감가상각 가능 날짜 재계산
        const nextDate = calculateNextDepreciationDate(updatedFacility.lastValuationDate);
        setNextDepreciationDate(nextDate);
        
        // 현재 감가상각 가능 여부 재확인
        setIsDepreciationAvailable(checkDepreciationAvailability(nextDate));
      }
      
      showSnackbar(
        `감가상각이 성공적으로 처리되었습니다. 상각 금액: ${formatCurrency(result.depreciationAmount)}`, 
        'success'
      );
    } catch (error) {
      console.error('감가상각 처리 실패:', error);
      showSnackbar(error.message || '감가상각 처리 중 오류가 발생했습니다.', 'error');
    } finally {
      setDepreciationLoading(false);
      setConfirmDialog({ ...confirmDialog, open: false });
    }
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
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="outlined" 
            startIcon={<EditIcon />}
            onClick={handleEdit}
            sx={{ 
              borderColor: '#E0E0E0',
              color: '#666',
              backgroundColor: 'white',
              '&:hover': {
                backgroundColor: '#F8F9FA',
                borderColor: '#E0E0E0',
              },
            }}
          >
            수정
          </Button>
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
              <Typography>{facility.usefulLifeMonths}개월 ({Math.floor(facility.usefulLifeMonths/12)}년)</Typography>
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
              <Typography>{formatDate(facility.warrantyEndDate)}</Typography>
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

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', borderBottom: '1px solid #EEEEEE', py: 1.5 }}>
              <Typography 
                sx={{ 
                  width: '140px',
                  color: '#666',
                  fontWeight: 500
                }}
              >
                감가상각 방법
              </Typography>
              <Typography>{facility.depreciationMethodName}</Typography>
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
                현재 가치
              </Typography>
              <Typography>{formatCurrency(facility.currentValue)}</Typography>
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
                최근 평가일
              </Typography>
              <Typography>{formatDate(facility.lastValuationDate) || '-'}</Typography>
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
                다음 감가상각일
              </Typography>
              <Typography color={isDepreciationAvailable ? "success.main" : "text.secondary"}>
                {nextDepreciationDate ? format(nextDepreciationDate, 'yy-MM-dd') : '-'}
                {isDepreciationAvailable && 
                  <Chip 
                    label="감가상각 가능" 
                    size="small" 
                    color="success" 
                    sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                  />
                }
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
                감가상각 처리
              </Typography>
              <Tooltip 
                title={!isDepreciationAvailable ? 
                  `다음 감가상각은 ${nextDepreciationDate ? format(nextDepreciationDate, 'yy-MM-dd') : '날짜 정보 없음'} 이후에 가능합니다` : 
                  "감가상각을 진행하면 시설물의 현재 가치가 업데이트됩니다"}
                placement="top"
              >
                <span>
                  <Button 
                    variant="contained" 
                    color="secondary"
                    size="small"
                    startIcon={<CalculateIcon />}
                    onClick={handleProcessDepreciation}
                    disabled={depreciationLoading || !isDepreciationAvailable}
                    sx={{ fontSize: '0.75rem', height: 24 }}
                  >
                    {depreciationLoading ? <CircularProgress size={16} /> : '자동 감가상각 처리'}
                  </Button>
                </span>
              </Tooltip>
              <IconButton 
                size="small" 
                color="primary" 
                sx={{ ml: 1, backgroundColor: 'rgba(0, 0, 0, 0.04)', height: 24, width: 24 }}
                onClick={() => showSnackbar('감가상각은 월 1회만 처리할 수 있으며, 마지막 평가일로부터 한 달 이후에 처리 가능합니다.', 'info')}
              >
                <InfoIcon fontSize="small" />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* 배치 정보 */}
      <Paper sx={{ mb: 3, p: 3, borderRadius: 2 }}>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            fontWeight: 600, 
            color: '#3A3A3A',
            mb: 2 
          }}
        >
          배치 정보
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
                설치 매장
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
                설치 위치
              </Typography>
              <Typography>{facility.locationAddress}</Typography>
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
                소유 매장
              </Typography>
              <Typography>{facility.ownerStoreName} ({facility.ownerStoreNumber})</Typography>
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
                등록일
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
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            취소
          </Button>
          <Button onClick={confirmDialog.onConfirm} color="primary" autoFocus>
            확인
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FacilitiesDetail;
