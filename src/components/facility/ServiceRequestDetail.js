import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress,
  Snackbar,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ImageList,
  ImageListItem,
  IconButton,
  Grid,
  Chip,
  Paper,
  Divider
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

// 커스텀 다이얼로그 컴포넌트 추가
import ApproveRequestDialog from './ApproveRequestDialog';
import CompleteRequestDialog from './CompleteRequestDialog';

// API 기본 URL 설정
const API_BASE_URL = 'http://localhost:8080';

// AS 상태 칩 색상 매핑
const statusColorMap = {
  '002010_0001': 'default', // 접수중
  '002010_0002': 'warning', // AS 접수완료
  '002010_0003': 'success'  // AS 수리완료
};

// 시설물 상태 칩 색상 매핑
const facilityStatusColorMap = {
  '002003_0001': 'default', // 사용중
  '002003_0002': 'default', // 수리중
  '002003_0003': 'default', // 폐기
  '002003_0004': 'default', // 임대중
  '002003_0005': 'default', // 폐기
  '002003_0006': 'default'  // 수리 완료
};

// 우선순위 칩 색상 매핑
const priorityColorMap = {
  '002007_0001': 'default', // 높음
  '002007_0002': 'default', // 중간
  '002007_0003': 'default'  // 낮음
};

const ServiceRequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const isUserRole = authUser?.role === 'USER';
  
  const [loading, setLoading] = useState(true);
  const [serviceRequest, setServiceRequest] = useState(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  
  // 이미지 분류
  const [requestImages, setRequestImages] = useState([]);
  const [completionImages, setCompletionImages] = useState([]);
  
  // 알림 스낵바
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // 다이얼로그 상태 추가
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  
  // 초기 데이터 로드
  useEffect(() => {
    fetchServiceRequestDetail();
  }, [id]);
  
  // AS 접수 상세 조회
  const fetchServiceRequestDetail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/service-requests/${id}/all`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('AS 접수 상세 정보를 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      setServiceRequest(data);
      
      // 이미지 분류
      if (data.images && data.images.length > 0) {
        const requestImgs = data.images.filter(img => img.imageTypeCode === '002005_0008');
        const completionImgs = data.images.filter(img => img.imageTypeCode === '002005_0009');
        
        setRequestImages(requestImgs);
        setCompletionImages(completionImgs);
      }
    } catch (error) {
      console.error('AS 접수 상세 조회 실패:', error);
      showSnackbar('AS 접수 상세 정보를 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
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
  
  // 날짜시간 포맷 함수
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'yy-MM-dd HH:mm');
    } catch (error) {
      return dateString;
    }
  };
  
  // 가격 포맷 함수
  const formatCost = (cost) => {
    if (cost === null || cost === undefined) return '-';
    return cost.toLocaleString('ko-KR') + '원';
  };
  
  // 이미지 클릭
  const handleImageClick = (image) => {
    setSelectedImage(image);
    setImageViewerOpen(true);
  };
  
  // 이미지 뷰어 닫기
  const handleCloseImageViewer = () => {
    setImageViewerOpen(false);
  };
  
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };
  
  // 목록으로 돌아가기
  const handleBack = () => {
    navigate('/service-request/list');
  };
  
  // AS 요청 승인 제출
  const submitApproval = async (formattedDateTime) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/service-requests/${id}/receive`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          expectedCompletionDate: formattedDateTime
        })
      });
      
      if (!response.ok) {
        throw new Error('AS 요청 승인 처리에 실패했습니다.');
      }
      
      showSnackbar('AS 요청이 성공적으로 승인되었습니다.', 'success');
      setApproveDialogOpen(false);
      fetchServiceRequestDetail(); // 상세 정보 새로고침
    } catch (error) {
      console.error('AS 요청 승인 실패:', error);
      showSnackbar('AS 요청 승인 처리에 실패했습니다.', 'error');
    }
  };
  
  // AS 요청 완료 제출
  const submitCompletion = async (completionData) => {
    try {
      let response;
      
      console.log('완료 처리 데이터:', completionData); // 데이터 로깅
      
      // 이미지가 있는 경우와 없는 경우에 따라 다른 API 호출
      if (completionData.images && completionData.images.length > 0) {
        // FormData 객체 생성
        const formDataObj = new FormData();
        
        // JSON 데이터를 문자열로 변환하여 추가
        const requestData = {
          cost: completionData.cost,
          repairComment: completionData.repairComment
        };
        
        console.log('이미지 포함 요청 데이터:', requestData); // 요청 데이터 로깅
        
        formDataObj.append('request', JSON.stringify(requestData));
        
        // 이미지 파일 추가
        completionData.images.forEach((file) => {
          formDataObj.append('images', file);
        });
        
        // 이미지를 포함한 API 호출
        console.log('API 호출 URL:', `${API_BASE_URL}/api/service-requests/${id}/complete-with-images`); // URL 로깅
        
        response = await fetch(`${API_BASE_URL}/api/service-requests/${id}/complete-with-images`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            // Content-Type은 FormData를 사용할 때 자동으로 설정됨
          },
          body: formDataObj
        });
      } else {
        // 이미지가 없는 경우 기존 API 호출
        const requestData = {
          cost: completionData.cost,
          repairComment: completionData.repairComment
        };
        
        console.log('이미지 없는 요청 데이터:', requestData); // 요청 데이터 로깅
        console.log('API 호출 URL:', `${API_BASE_URL}/api/service-requests/${id}/complete`); // URL 로깅
        
        response = await fetch(`${API_BASE_URL}/api/service-requests/${id}/complete`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        });
      }
      
      console.log('API 응답 상태:', response.status); // 응답 상태 로깅
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 오류 응답:', errorText); // 오류 응답 로깅
        throw new Error('AS 요청 완료 처리에 실패했습니다.');
      }
      
      const responseData = await response.json();
      console.log('API 응답 데이터:', responseData); // 응답 데이터 로깅
      
      showSnackbar('AS 요청이 성공적으로 완료 처리되었습니다.', 'success');
      setCompleteDialogOpen(false);
      fetchServiceRequestDetail(); // 상세 정보 새로고침
    } catch (error) {
      console.error('AS 요청 완료 처리 실패:', error);
      showSnackbar('AS 요청 완료 처리에 실패했습니다.', 'error');
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ backgroundColor: '#F8F8FE', minHeight: '100vh', p: 3 }}>
      {/* 상단 헤더 */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton color="primary" onClick={handleBack} sx={{ p: 0.5 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#3A3A3A', fontSize: '1.3rem' }}>
            A/S 상세정보
          </Typography>
        </Box>
        
        {serviceRequest && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.9rem' }}>
              접수번호: {serviceRequest.requestNumber}
            </Typography>
            <Chip 
              label={serviceRequest.serviceStatusName || '상태 정보 없음'} 
              variant="outlined"
              size="small"
              sx={{ height: '22px', fontSize: '0.75rem' }}
            />
          </Box>
        )}
      </Box>
      
      {/* 메인 컨텐츠 영역 */}
      <Box sx={{ 
        backgroundColor: 'white',
        borderRadius: 2,
        border: '1px solid #EEEEEE',
        p: 3,
        mb: 3
      }}>
        {serviceRequest && (
          <Box>
            {/* 섹션 1: 시설물 정보 */}
            <Paper elevation={0} sx={{ mb: 2, overflow: 'hidden', border: '1px solid #eee', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                px: 2.5,
                py: 1.5,
                borderBottom: '1px solid #eee',
                bgcolor: '#fafafa',
                borderTopLeftRadius: '12px',
                borderTopRightRadius: '12px'
              }}>
                <Typography sx={{ fontSize: '1.05rem', fontWeight: 500, color: '#555' }}>
                  시설물 기본 정보
                </Typography>
              </Box>
              
              <Box sx={{ p: 2.5 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.85rem' }}>관리 번호</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.95rem' }}>{serviceRequest.facilityTypeName}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.85rem' }}>시설물 유형</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.95rem' }}>{serviceRequest.brandName || '-'}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.85rem' }}>품목</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.95rem' }}>{serviceRequest.companyName}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.85rem' }}>상태</Typography>
                      <Box>
                        <Chip 
                          label={serviceRequest.statusName} 
                          size="small"
                          variant="outlined"
                          sx={{ height: '24px', fontSize: '0.85rem' }}
                        />
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.85rem' }}>사용연한</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.95rem' }}>{serviceRequest.usefulLifeMonths || '-'}개월</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.85rem' }}>최초 설치일</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.95rem' }}>{formatDate(serviceRequest.installationDate)}</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
            
            {/* 섹션 2: AS 접수 정보 */}
            <Paper elevation={0} sx={{ mb: 2, overflow: 'hidden', border: '1px solid #eee', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                px: 2.5,
                py: 1.5,
                borderBottom: '1px solid #eee',
                bgcolor: '#fafafa',
                borderTopLeftRadius: '12px',
                borderTopRightRadius: '12px'
              }}>
                <Typography sx={{ fontSize: '1.05rem', fontWeight: 500, color: '#555' }}>
                  AS 접수 정보
                </Typography>
              </Box>
              
              <Box sx={{ p: 2.5 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.85rem' }}>AS 유형</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.95rem' }}>{serviceRequest.serviceTypeName || '-'}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.85rem' }}>우선순위</Typography>
                      <Box>
                        <Chip 
                          label={serviceRequest.priorityName || '-'} 
                          size="small" 
                          variant="outlined"
                          sx={{ height: '22px', fontSize: '0.75rem' }}
                        />
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.85rem' }}>접수일자</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.95rem' }}>{formatDateTime(serviceRequest.requestDate)}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.85rem' }}>요청자</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.95rem' }}>{serviceRequest.requesterName || '-'}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.85rem' }}>부서</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.95rem' }}>{serviceRequest.departmentTypeName || '-'}</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
            
            {/* 섹션 3: AS 요청 내용 및 이미지 */}
            <Paper elevation={0} sx={{ mb: 2, overflow: 'hidden', border: '1px solid #eee', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                px: 2.5,
                py: 1.5,
                borderBottom: '1px solid #eee',
                bgcolor: '#fafafa',
                borderTopLeftRadius: '12px',
                borderTopRightRadius: '12px'
              }}>
                <Typography sx={{ fontSize: '1.05rem', fontWeight: 500, color: '#555' }}>
                  AS 요청 내용
                </Typography>
              </Box>
              
              <Box sx={{ p: 2.5 }}>
                {/* AS 요청 내용 */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.85rem', display: 'block', mb: 0.5 }}>
                    요청 내용
                  </Typography>
                  <Box sx={{ p: 2, backgroundColor: '#fafafa', borderRadius: 4 }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>
                      {serviceRequest.requestContent || '요청 내용이 없습니다.'}
                    </Typography>
                  </Box>
                </Box>
                
                {/* 비고 */}
                {serviceRequest.notes && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.85rem', display: 'block', mb: 0.5 }}>
                      비고
                    </Typography>
                    <Box sx={{ p: 2, backgroundColor: '#fafafa', borderRadius: 4 }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>
                        {serviceRequest.notes}
                      </Typography>
                    </Box>
                  </Box>
                )}
                
                {/* AS 접수 이미지 */}
                {requestImages.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.85rem', display: 'block', mb: 1 }}>
                      AS 접수 이미지 ({requestImages.length})
                    </Typography>
                    
                    <ImageList sx={{ width: '100%', height: 'auto' }} cols={4} gap={8}>
                      {requestImages.map((image) => (
                        <ImageListItem 
                          key={image.imageId}
                          onClick={() => handleImageClick(image)}
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': { 
                              opacity: 0.9
                            },
                            borderRadius: 1,
                            overflow: 'hidden'
                          }}
                        >
                          <Box sx={{ position: 'relative', paddingTop: '100%' }}>
                            <img
                              src={`${API_BASE_URL}${image.imageUrl}`}
                              alt="AS 접수 이미지"
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                              loading="lazy"
                            />
                          </Box>
                          <Box sx={{ 
                            position: 'absolute', 
                            bottom: 0, 
                            left: 0, 
                            right: 0, 
                            bgcolor: 'rgba(0,0,0,0.5)', 
                            color: 'white',
                            p: 0.5,
                            fontSize: '0.8rem'
                          }}>
                            {formatDate(image.createdAt)}
                          </Box>
                        </ImageListItem>
                      ))}
                    </ImageList>
                  </Box>
                )}
              </Box>
            </Paper>
            
            {/* 섹션 4: AS 처리 정보 및 완료 이미지 */}
            <Paper elevation={0} sx={{ mb: 2, overflow: 'hidden', border: '1px solid #eee', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                px: 2.5,
                py: 1.5,
                borderBottom: '1px solid #eee',
                bgcolor: '#fafafa',
                borderTopLeftRadius: '12px',
                borderTopRightRadius: '12px'
              }}>
                <Typography sx={{ fontSize: '1.05rem', fontWeight: 500, color: '#555' }}>
                  AS 처리 정보
                </Typography>
              </Box>
              
              <Box sx={{ p: 2.5 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.85rem' }}>담당자</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.95rem' }}>
                        {serviceRequest.managerName || '아직 배정되지 않음'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.85rem' }}>접수 상태</Typography>
                      <Box>
                        <Chip 
                          label={
                            serviceRequest.serviceStatusCode === '002010_0001' ? 'AS 접수중' : 
                            serviceRequest.serviceStatusCode === '002010_0002' ? 'AS 접수완료' : 
                            serviceRequest.serviceStatusCode === '002010_0003' ? 'AS 수리완료' : 
                            '상태 정보 없음'
                          } 
                          size="small" 
                          variant="outlined"
                          sx={{ height: '22px', fontSize: '0.75rem' }}
                        />
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.85rem' }}>예상 방문일</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.95rem' }}>
                        {formatDateTime(serviceRequest.expectedCompletionDate) || '-'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.85rem' }}>완료일</Typography>
                      <Typography variant="body2" sx={{ 
                        color: serviceRequest.completionDate ? 'success.main' : 'text.secondary',
                        fontSize: '0.95rem'
                      }}>
                        {formatDateTime(serviceRequest.completionDate) || '완료되지 않음'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.85rem' }}>수리 비용</Typography>
                      <Typography variant="body2" sx={{ 
                        color: serviceRequest.cost ? 'primary.main' : 'text.secondary',
                        fontSize: '0.95rem'
                      }}>
                        {formatCost(serviceRequest.cost)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                {/* 수리 코멘트 */}
                {serviceRequest.repairComment && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.85rem', display: 'block', mb: 0.5 }}>
                      수리 코멘트
                    </Typography>
                    <Box sx={{ p: 2, backgroundColor: '#fafafa', borderRadius: 4 }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>
                        {serviceRequest.repairComment}
                      </Typography>
                    </Box>
                  </Box>
                )}
                
                {/* AS 완료 이미지 */}
                {completionImages.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.85rem', display: 'block', mb: 1 }}>
                      AS 완료 이미지 ({completionImages.length})
                    </Typography>
                    
                    <ImageList sx={{ width: '100%', height: 'auto' }} cols={4} gap={8}>
                      {completionImages.map((image) => (
                        <ImageListItem 
                          key={image.imageId}
                          onClick={() => handleImageClick(image)}
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': { 
                              opacity: 0.9
                            },
                            borderRadius: 1,
                            overflow: 'hidden'
                          }}
                        >
                          <Box sx={{ position: 'relative', paddingTop: '100%' }}>
                            <img
                              src={`${API_BASE_URL}${image.imageUrl}`}
                              alt="AS 완료 이미지"
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                              loading="lazy"
                            />
                          </Box>
                          <Box sx={{ 
                            position: 'absolute', 
                            bottom: 0, 
                            left: 0, 
                            right: 0, 
                            bgcolor: 'rgba(0,0,0,0.5)', 
                            color: 'white',
                            p: 0.5,
                            fontSize: '0.8rem'
                          }}>
                            {formatDate(image.createdAt)}
                          </Box>
                        </ImageListItem>
                      ))}
                    </ImageList>
                  </Box>
                )}
              </Box>
            </Paper>
            
            
            {/* 작업 버튼 영역 */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4, mb: 2 }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleBack}
                startIcon={<ArrowBackIcon />}
                size="small"
                sx={{ px: 3, fontSize: '0.9rem' }}
              >
                목록으로 돌아가기
              </Button>
              
              {/* USER 권한이 아닌 경우에만 접수 처리하기 버튼 표시 */}
              {!isUserRole && serviceRequest.serviceStatusCode === '002010_0001' && !serviceRequest.isReceived && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setApproveDialogOpen(true)}
                  size="small"
                  sx={{ px: 3, fontSize: '0.9rem' }}
                >
                  접수 처리하기
                </Button>
              )}
              
              {/* USER 권한이 아닌 경우에만 완료 처리하기 버튼 표시 */}
              {!isUserRole && serviceRequest.serviceStatusCode === '002010_0002' && !serviceRequest.isCompleted && (
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => setCompleteDialogOpen(true)}
                  size="small"
                  sx={{ px: 3, fontSize: '0.9rem' }}
                >
                  완료 처리하기
                </Button>
              )}
            </Box>
          </Box>
        )}
      </Box>
      
      {/* 알림 스낵바 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      {/* 이미지 뷰어 다이얼로그 */}
      <Dialog
        open={imageViewerOpen}
        onClose={handleCloseImageViewer}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
          <Typography variant="subtitle1">
            {selectedImage?.imageTypeName || '이미지 상세 보기'}
          </Typography>
          <IconButton onClick={handleCloseImageViewer} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedImage && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
              <img
                src={`${API_BASE_URL}${selectedImage.imageUrl}`}
                alt={selectedImage.imageTypeName}
                style={{ maxWidth: '100%', maxHeight: '70vh' }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
                {formatDateTime(selectedImage.createdAt)} 업로드 • {selectedImage.uploadByName}
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
      
      {/* AS 요청 승인 다이얼로그 컴포넌트 */}
      <ApproveRequestDialog 
        open={approveDialogOpen}
        onClose={() => setApproveDialogOpen(false)}
        currentRequest={serviceRequest}
        onApprove={submitApproval}
        showSnackbar={showSnackbar}
      />
      
      {/* AS 완료 처리 다이얼로그 컴포넌트 */}
      <CompleteRequestDialog
        open={completeDialogOpen}
        onClose={() => setCompleteDialogOpen(false)}
        currentRequest={serviceRequest}
        onComplete={submitCompletion}
        showSnackbar={showSnackbar}
      />
    </Box>
  );
};

export default ServiceRequestDetail; 