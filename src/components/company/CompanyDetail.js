import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Grid, 
  Divider, 
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  ArrowBack,
  Save as SaveIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import koLocale from 'date-fns/locale/ko';
import TrusteeChangeForm from './TrusteeChangeForm';
import TrusteeHistoryList from './TrusteeHistoryList';

const CompanyDetail = () => {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [company, setCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [openTrusteeDialog, setOpenTrusteeDialog] = useState(false);
  const [imageFiles, setImageFiles] = useState({
    frontImage: null,
    backImage: null,
    leftSideImage: null,
    rightSideImage: null,
    fullImage: null
  });
  const [imagePreview, setImagePreview] = useState({
    frontImage: null,
    backImage: null,
    leftSideImage: null,
    rightSideImage: null,
    fullImage: null
  });

  // 수탁자 변경 다이얼로그 열기/닫기 핸들러
  const handleOpenTrusteeDialog = () => setOpenTrusteeDialog(true);
  const handleCloseTrusteeDialog = () => setOpenTrusteeDialog(false);

  // 회사 정보 조회 함수
  const fetchCompanyData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/companies/${companyId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      if (!response.ok) {
        throw new Error('회사 정보를 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      setCompany(data);
      
      // 폼 데이터 초기화
      setFormData({
        storeCode: data.storeCode || '',
        storeNumber: data.storeNumber || '',
        storeName: data.storeName || '',
        trustee: data.trustee || '',
        trusteeCode: data.trusteeCode || '',
        businessNumber: data.businessNumber || '',
        subBusinessNumber: data.subBusinessNumber || '',
        companyName: data.companyName || '',
        representativeName: data.representativeName || '',
        active: data.active,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        insuranceStartDate: data.insuranceStartDate || null,
        insuranceEndDate: data.insuranceEndDate || null,
        managerName: data.managerName || '',
        email: data.email || '',
        phoneNumber: data.phoneNumber || '',
        storeTelNumber: data.storeTelNumber || '',
        address: data.address || '',
        businessType: data.businessType || '',
        businessCategory: data.businessCategory || ''
      });
      
    } catch (error) {
      console.error('회사 정보 조회 오류:', error);
      setError(error.message || '회사 정보를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyData();
  }, [companyId]);

  // 폼 입력값 변경 핸들러
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    // 사업자번호 자동 하이픈 추가
    if (name === 'businessNumber') {
      // 숫자만 추출
      const numbers = value.replace(/[^0-9]/g, '');
      
      // 10자리 이하로 제한
      if (numbers.length <= 10) {
        // 하이픈 추가 (3-2-5 형식)
        let formattedValue = '';
        if (numbers.length <= 3) {
          formattedValue = numbers;
        } else if (numbers.length <= 5) {
          formattedValue = `${numbers.substring(0, 3)}-${numbers.substring(3)}`;
        } else {
          formattedValue = `${numbers.substring(0, 3)}-${numbers.substring(3, 5)}-${numbers.substring(5)}`;
        }
        
        setFormData(prev => ({
          ...prev,
          [name]: formattedValue
        }));
      }
      return;
    }
    
    // 전화번호 자동 하이픈 추가
    if (name === 'phoneNumber' || name === 'storeTelNumber') {
      // 숫자만 추출
      const numbers = value.replace(/[^0-9]/g, '');
      
      if (name === 'phoneNumber') {
        // 11자리 이하로 제한
        if (numbers.length <= 11) {
          // 하이픈 추가 (3-4-4 형식)
          let formattedValue = '';
          if (numbers.length <= 3) {
            formattedValue = numbers;
          } else if (numbers.length <= 7) {
            formattedValue = `${numbers.substring(0, 3)}-${numbers.substring(3)}`;
          } else {
            formattedValue = `${numbers.substring(0, 3)}-${numbers.substring(3, 7)}-${numbers.substring(7)}`;
          }
          
          setFormData(prev => ({
            ...prev,
            [name]: formattedValue
          }));
        }
      } else if (name === 'storeTelNumber') {
        // 매장 전화번호 포맷팅 (다양한 지역번호 형식 지원)
        if (numbers.length <= 11) {
          let formattedValue = '';
          
          // 지역번호 형식에 따라 다르게 처리
          if (numbers.length <= 2) {
            formattedValue = numbers;
          } else if (numbers.length === 10) { // 02-XXXX-XXXX (서울)
            if (numbers.startsWith('02')) {
              formattedValue = `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`;
            } else { // XXXX-XXX-XXXX (일반적인 경우)
              formattedValue = `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
            }
          } else if (numbers.length === 11) { // XXX-XXXX-XXXX
            formattedValue = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
          } else if (numbers.length >= 8 && numbers.length <= 9) { // XX-XXX-XXXX 또는 XXX-XXX-XXX
            if (numbers.startsWith('02')) { // 서울 지역번호
              formattedValue = `${numbers.slice(0, 2)}-${numbers.slice(2, 5)}-${numbers.slice(5)}`;
            } else { // 나머지 지역번호
              formattedValue = `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
            }
          } else {
            // 기타 형식은 일정 단위로 끊어서 표시
            if (numbers.length <= 4) {
              formattedValue = numbers;
            } else if (numbers.length <= 8) {
              formattedValue = `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
            } else {
              // 첫 번째 부분을 지역번호로 가정하고 나머지를 적절히 분배
              const areaCodeLength = numbers.startsWith('02') ? 2 : 3;
              const middleLength = Math.min(4, Math.floor((numbers.length - areaCodeLength) / 2));
              
              formattedValue = `${numbers.slice(0, areaCodeLength)}-${numbers.slice(areaCodeLength, areaCodeLength + middleLength)}-${numbers.slice(areaCodeLength + middleLength)}`;
            }
          }

          setFormData(prev => ({
            ...prev,
            [name]: formattedValue
          }));
        }
      }
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 에러 메시지 제거
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // 날짜 변경 핸들러
  const handleDateChange = (name, date) => {
    setFormData(prev => ({
      ...prev,
      [name]: date
    }));
  };

  // 폼 유효성 검사
  const validateForm = () => {
    const errors = {};
    
    if (!formData.storeName) {
      errors.storeName = '매장명은 필수 입력 항목입니다.';
    }
    
    if (!formData.businessNumber) {
      errors.businessNumber = '사업자번호는 필수 입력 항목입니다.';
    } else if (!/^\d{3}-\d{2}-\d{5}$/.test(formData.businessNumber)) {
      errors.businessNumber = '사업자번호 형식이 올바르지 않습니다. (예: 123-45-67890)';
    }
    
    if (!formData.companyName) {
      errors.companyName = '상호는 필수 입력 항목입니다.';
    }
    
    if (!formData.representativeName) {
      errors.representativeName = '대표자명은 필수 입력 항목입니다.';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = '이메일 형식이 올바르지 않습니다.';
    }
    
    // 보험 기간 유효성 검사 - 시작일이 종료일보다 이후인 경우
    if (formData.insuranceStartDate && formData.insuranceEndDate &&
        new Date(formData.insuranceStartDate) > new Date(formData.insuranceEndDate)) {
      errors.insuranceEndDate = '보증증권 종료일은 시작일 이후로 설정해주세요.';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 이미지 파일 선택 핸들러
  const handleImageChange = (e, imageType) => {
    const file = e.target.files[0];
    if (file) {
      // 이미지 파일 저장
      setImageFiles(prev => ({
        ...prev,
        [imageType]: file
      }));
      
      // 이미지 미리보기 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(prev => ({
          ...prev,
          [imageType]: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // 이미지 삭제 핸들러
  const handleImageDelete = async (imageType) => {
    try {
      // 이미지 타입 매핑 (API 요구사항에 맞게 변환)
      const apiImageType = {
        frontImage: 'front',
        backImage: 'back',
        leftSideImage: 'leftside',
        rightSideImage: 'rightside',
        fullImage: 'full'
      }[imageType];
      
      if (!apiImageType) {
        throw new Error('지원하지 않는 이미지 타입입니다.');
      }
      
      // 이미지가 서버에 존재하는 경우에만 API 호출
      if (company?.imageInfo && company.imageInfo[imageType]) {
        setIsLoading(true);
        const token = sessionStorage.getItem('token');
        
        const response = await fetch(`http://localhost:8080/api/companies/${companyId}/images/${apiImageType}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        
        if (!response.ok) {
          throw new Error('이미지 삭제에 실패했습니다.');
        }
        
        const updatedCompany = await response.json();
        setCompany(updatedCompany);
        
        // 폼 데이터도 업데이트
        setFormData(prev => ({
          ...prev
        }));
        
        setSuccessMessage('이미지가 성공적으로 삭제되었습니다.');
        
        // 3초 후 성공 메시지 숨기기
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }
      
      // 로컬 상태 업데이트 (미리보기 및 파일 상태 초기화)
      setImageFiles(prev => ({
        ...prev,
        [imageType]: null
      }));
      setImagePreview(prev => ({
        ...prev,
        [imageType]: null
      }));
      
    } catch (error) {
      console.error('이미지 삭제 오류:', error);
      setError(error.message || '이미지 삭제에 실패했습니다.');
      
      // 3초 후 에러 메시지 숨기기
      setTimeout(() => {
        setError(null);
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // 회사 정보 수정 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const token = sessionStorage.getItem('token');
      
      // 날짜 형식 변환
      const formattedData = {
        ...formData,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString().split('T')[0] : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString().split('T')[0] : null,
        insuranceStartDate: formData.insuranceStartDate ? new Date(formData.insuranceStartDate).toISOString().split('T')[0] : null,
        insuranceEndDate: formData.insuranceEndDate ? new Date(formData.insuranceEndDate).toISOString().split('T')[0] : null
      };
      
      // 이미지 파일이 있는지 확인
      const hasImageFiles = Object.values(imageFiles).some(file => file !== null);
      
      if (hasImageFiles) {
        // FormData 객체 생성
        const formDataObj = new FormData();
        
        // 회사 정보를 JSON 문자열로 변환하여 추가
        formDataObj.append('company', new Blob([JSON.stringify(formattedData)], { type: 'application/json' }));
        
        // 이미지 파일 추가
        if (imageFiles.frontImage) formDataObj.append('frontImage', imageFiles.frontImage);
        if (imageFiles.backImage) formDataObj.append('backImage', imageFiles.backImage);
        if (imageFiles.leftSideImage) formDataObj.append('leftSideImage', imageFiles.leftSideImage);
        if (imageFiles.rightSideImage) formDataObj.append('rightSideImage', imageFiles.rightSideImage);
        if (imageFiles.fullImage) formDataObj.append('fullImage', imageFiles.fullImage);
        
        // 회사 정보와 이미지 함께 수정 API 호출
        const response = await fetch(`http://localhost:8080/api/companies/${companyId}/with-images`, {
          method: 'PUT',
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: formDataObj
        });
        
        if (!response.ok) {
          throw new Error('회사 정보 수정에 실패했습니다.');
        }
        
        const updatedCompany = await response.json();
        setCompany(updatedCompany);
        
      } else {
        // 이미지 없이 회사 정보만 수정 API 호출
        const response = await fetch(`http://localhost:8080/api/companies/${companyId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify(formattedData)
        });
        
        if (!response.ok) {
          throw new Error('회사 정보 수정에 실패했습니다.');
        }
        
        const updatedCompany = await response.json();
        setCompany(updatedCompany);
      }
      
      setSuccessMessage('회사 정보가 성공적으로 수정되었습니다.');
      
      // 이미지 파일 및 미리보기 초기화
      setImageFiles({
        frontImage: null,
        backImage: null,
        leftSideImage: null,
        rightSideImage: null,
        fullImage: null
      });
      setImagePreview({
        frontImage: null,
        backImage: null,
        leftSideImage: null,
        rightSideImage: null,
        fullImage: null
      });
      
      // 3초 후 성공 메시지 숨기기
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
      // 편집 모드 종료
      setIsEditing(false);
      
    } catch (error) {
      console.error('회사 정보 수정 오류:', error);
      setError(error.message || '회사 정보 수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 수탁자 변경 제출 핸들러
  const handleTrusteeChangeSubmit = async (trusteeData) => {
    try {
      setIsSubmitting(true);
      
      const token = sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/companies/${companyId}/trustee`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(trusteeData)
      });
      
      if (!response.ok) {
        throw new Error('수탁자 변경에 실패했습니다.');
      }
      
      const updatedCompany = await response.json();
      setCompany(updatedCompany);
      setSuccessMessage('신규 수탁자 정보가 등록되었습니다. 지정된 시작일에 자동으로 적용됩니다.');
      
      // 다이얼로그 닫기
      handleCloseTrusteeDialog();
      
      // 3초 후 성공 메시지 숨기기
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (error) {
      console.error('수탁자 변경 오류:', error);
      setError(error.message || '수탁자 변경에 실패했습니다.');
      
      // 3초 후 에러 메시지 숨기기
      setTimeout(() => {
        setError(null);
      }, 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 편집 모드 토글
  const toggleEditMode = () => {
    if (isEditing) {
      // 편집 취소 시 원래 데이터로 복원
      setFormData({
        storeCode: company.storeCode || '',
        storeNumber: company.storeNumber || '',
        storeName: company.storeName || '',
        trustee: company.trustee || '',
        trusteeCode: company.trusteeCode || '',
        businessNumber: company.businessNumber || '',
        subBusinessNumber: company.subBusinessNumber || '',
        companyName: company.companyName || '',
        representativeName: company.representativeName || '',
        active: company.active,
        startDate: company.startDate || null,
        endDate: company.endDate || null,
        insuranceStartDate: company.insuranceStartDate || null,
        insuranceEndDate: company.insuranceEndDate || null,
        managerName: company.managerName || '',
        email: company.email || '',
        phoneNumber: company.phoneNumber || '',
        storeTelNumber: company.storeTelNumber || '',
        address: company.address || '',
        businessType: company.businessType || '',
        businessCategory: company.businessCategory || ''
      });
      setFormErrors({});
      
      // 이미지 파일 및 미리보기 초기화
      setImageFiles({
        frontImage: null,
        backImage: null,
        leftSideImage: null,
        rightSideImage: null,
        fullImage: null
      });
      setImagePreview({
        frontImage: null,
        backImage: null,
        leftSideImage: null,
        rightSideImage: null,
        fullImage: null
      });
    }
    setIsEditing(!isEditing);
  };

  if (isLoading && !formData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !formData) {
    return (
      <Box sx={{ p: 3, backgroundColor: '#F8F8FE', minHeight: '100vh' }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/companies')}
          sx={{ mt: 2 }}
        >
          목록으로 돌아가기
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#F8F8FE', minHeight: '100vh' }}>
      {/* 성공 메시지 */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}
      
      {/* 에러 메시지 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* 상단 헤더 */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton 
            onClick={() => navigate('/companies')}
            sx={{ mr: 1 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#3A3A3A' }}>
            위수탁업체 상세 정보
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isEditing ? (
            <>
              <Button
                variant="outlined"
                onClick={toggleEditMode}
                sx={{
                  color: '#666',
                  borderColor: '#666',
                  '&:hover': {
                    borderColor: '#1976d2',
                    color: '#1976d2'
                  }
                }}
              >
                취소
              </Button>
              <Button
                type="submit"
                form="company-form"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={isSubmitting}
                sx={{
                  backgroundColor: '#1976d2',
                  '&:hover': {
                    backgroundColor: '#1565c0',
                  },
                }}
              >
                {isSubmitting ? '저장 중...' : '저장'}
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              onClick={toggleEditMode}
              sx={{
                backgroundColor: '#1976d2',
                '&:hover': {
                  backgroundColor: '#1565c0',
                },
              }}
            >
              수정
            </Button>
          )}
        </Box>
      </Box>

      {formData && (
        <form id="company-form" onSubmit={handleSubmit}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={koLocale}>
            {/* 기본 정보 섹션 - 매장코드, 점번, 매장명만 포함 */}
            <Paper sx={{ 
              p: 3,
              mb: 3,
              borderRadius: 2,
              boxShadow: 'none',
              border: '1px solid #EEEEEE'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#3A3A3A' }}>
                  매장 정보
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  {isEditing ? (
                    <TextField
                      label="매장코드"
                      name="storeCode"
                      value={formData.storeCode}
                      onChange={handleFormChange}
                      fullWidth
                      size="small"
                    />
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary">매장코드</Typography>
                      <Typography variant="body1">{company?.storeCode || '-'}</Typography>
                    </>
                  )}
                </Grid>
                <Grid item xs={12} md={4}>
                  {isEditing ? (
                    <TextField
                      label="점번"
                      name="storeNumber"
                      value={formData.storeNumber}
                      onChange={handleFormChange}
                      fullWidth
                      size="small"
                      disabled
                      InputProps={{
                        readOnly: true,
                      }}
                      helperText="점번은 수정할 수 없습니다"
                    />
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary">점번</Typography>
                      <Typography variant="body1">{company?.storeNumber || '-'}</Typography>
                    </>
                  )}
                </Grid>
                <Grid item xs={12} md={4}>
                  {isEditing ? (
                    <TextField
                      label="매장명"
                      name="storeName"
                      value={formData.storeName}
                      onChange={handleFormChange}
                      fullWidth
                      size="small"
                      required
                      error={!!formErrors.storeName}
                      helperText={formErrors.storeName}
                    />
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary">매장명</Typography>
                      <Typography variant="body1">{company?.storeName || '-'}</Typography>
                    </>
                  )}
                </Grid>
                <Grid item xs={12}>
                  {isEditing ? (
                    <TextField
                      label="주소"
                      name="address"
                      value={formData.address}
                      onChange={handleFormChange}
                      fullWidth
                      size="small"
                    />
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary">주소</Typography>
                      <Typography variant="body1">{company?.address || '-'}</Typography>
                    </>
                  )}
                </Grid>
              </Grid>
            </Paper>

            {/* 수탁자 정보 섹션 */}
            <Paper sx={{ 
              p: 3,
              mb: 3,
              borderRadius: 2,
              boxShadow: 'none',
              border: '1px solid #EEEEEE'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#3A3A3A' }}>
                  수탁자 정보
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={handleOpenTrusteeDialog}
                  sx={{ height: 32 }}
                >
                  수탁자 변경
                </Button>
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  {isEditing ? (
                    <TextField
                      label="수탁자"
                      name="trustee"
                      value={formData.trustee}
                      onChange={handleFormChange}
                      fullWidth
                      size="small"
                    />
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary">수탁자</Typography>
                      <Typography variant="body1">{company?.trustee || '-'}</Typography>
                    </>
                  )}
                </Grid>
                <Grid item xs={12} md={4}>
                  {isEditing ? (
                    <TextField
                      label="수탁코드"
                      name="trusteeCode"
                      value={formData.trusteeCode}
                      onChange={handleFormChange}
                      fullWidth
                      size="small"
                    />
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary">수탁코드</Typography>
                      <Typography variant="body1">{company?.trusteeCode || '-'}</Typography>
                    </>
                  )}
                </Grid>
                <Grid item xs={12} md={4}>
                  {isEditing ? (
                    <TextField
                      label="사업자번호"
                      name="businessNumber"
                      value={formData.businessNumber}
                      onChange={handleFormChange}
                      fullWidth
                      size="small"
                      required
                      error={!!formErrors.businessNumber}
                      placeholder="123-45-67890"
                      inputProps={{
                        maxLength: 12
                      }}
                    />
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary">사업자번호</Typography>
                      <Typography variant="body1">{company?.businessNumber || '-'}</Typography>
                    </>
                  )}
                </Grid>
                <Grid item xs={12} md={4}>
                  {isEditing ? (
                    <TextField
                      label="종사업장번호"
                      name="subBusinessNumber"
                      value={formData.subBusinessNumber}
                      onChange={handleFormChange}
                      fullWidth
                      size="small"
                    />
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary">종사업장번호</Typography>
                      <Typography variant="body1">{company?.subBusinessNumber || '-'}</Typography>
                    </>
                  )}
                </Grid>
                <Grid item xs={12} md={4}>
                  {isEditing ? (
                    <TextField
                      label="상호"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleFormChange}
                      fullWidth
                      size="small"
                      required
                      error={!!formErrors.companyName}
                      helperText={formErrors.companyName}
                    />
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary">상호</Typography>
                      <Typography variant="body1">{company?.companyName || '-'}</Typography>
                    </>
                  )}
                </Grid>
                <Grid item xs={12} md={4}>
                  {isEditing ? (
                    <TextField
                      label="대표자명"
                      name="representativeName"
                      value={formData.representativeName}
                      onChange={handleFormChange}
                      fullWidth
                      size="small"
                      required
                      error={!!formErrors.representativeName}
                      helperText={formErrors.representativeName}
                    />
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary">대표자명</Typography>
                      <Typography variant="body1">{company?.representativeName || '-'}</Typography>
                    </>
                  )}
                </Grid>
                <Grid item xs={12} md={4}>
                  {isEditing ? (
                    <DatePicker
                      label="시작일자"
                      value={formData.startDate ? new Date(formData.startDate) : null}
                      onChange={(date) => handleDateChange('startDate', date)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small"
                        }
                      }}
                    />
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary">시작일자</Typography>
                      <Typography variant="body1">{company?.startDate || '-'}</Typography>
                    </>
                  )}
                </Grid>
                <Grid item xs={12} md={4}>
                  {isEditing ? (
                    <DatePicker
                      label="종료일자"
                      value={formData.endDate ? new Date(formData.endDate) : null}
                      onChange={(date) => handleDateChange('endDate', date)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small"
                        }
                      }}
                    />
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary">종료일자</Typography>
                      <Typography variant="body1">{company?.endDate || '-'}</Typography>
                    </>
                  )}
                </Grid>
                <Grid item xs={12} md={4}>
                  {isEditing ? (
                    <DatePicker
                      label="하자보증증권 보험시작일자"
                      value={formData.insuranceStartDate ? new Date(formData.insuranceStartDate) : null}
                      onChange={(date) => handleDateChange('insuranceStartDate', date)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                          error: !!formErrors.insuranceStartDate,
                          helperText: formErrors.insuranceStartDate
                        }
                      }}
                    />
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary">보험시작일자</Typography>
                      <Typography variant="body1">{company?.insuranceStartDate || '-'}</Typography>
                    </>
                  )}
                </Grid>
                <Grid item xs={12} md={4}>
                  {isEditing ? (
                    <DatePicker
                      label="하자보증증권 보험종료일자"
                      value={formData.insuranceEndDate ? new Date(formData.insuranceEndDate) : null}
                      onChange={(date) => handleDateChange('insuranceEndDate', date)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                          error: !!formErrors.insuranceEndDate,
                          helperText: formErrors.insuranceEndDate
                        }
                      }}
                    />
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary">보험종료일자</Typography>
                      <Typography variant="body1">{company?.insuranceEndDate || '-'}</Typography>
                    </>
                  )}
                </Grid>
                {isEditing && (
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>상태</InputLabel>
                      <Select
                        name="active"
                        value={formData.active}
                        onChange={handleFormChange}
                        label="상태"
                      >
                        <MenuItem value={true}>사용</MenuItem>
                        <MenuItem value={false}>미사용</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                <Grid item xs={12} md={4}>
                  {isEditing ? (
                    <TextField
                      label="담당자"
                      name="managerName"
                      value={formData.managerName}
                      onChange={handleFormChange}
                      fullWidth
                      size="small"
                    />
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary">담당자</Typography>
                      <Typography variant="body1">{company?.managerName || '-'}</Typography>
                    </>
                  )}
                </Grid>
                <Grid item xs={12} md={4}>
                  {isEditing ? (
                    <TextField
                      label="이메일"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      fullWidth
                      size="small"
                      error={!!formErrors.email}
                      helperText={formErrors.email}
                    />
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary">이메일</Typography>
                      <Typography variant="body1">{company?.email || '-'}</Typography>
                    </>
                  )}
                </Grid>
                <Grid item xs={12} md={4}>
                  {isEditing ? (
                    <TextField
                      label="전화번호"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleFormChange}
                      fullWidth
                      size="small"
                      placeholder="010-1234-5678"
                      inputProps={{
                        maxLength: 13
                      }}
                    />
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary">전화번호</Typography>
                      <Typography variant="body1">{company?.phoneNumber || '-'}</Typography>
                    </>
                  )}
                </Grid>
                <Grid item xs={12} md={4}>
                  {isEditing ? (
                    <TextField
                      label="매장 전화번호"
                      name="storeTelNumber"
                      value={formData.storeTelNumber}
                      onChange={handleFormChange}
                      fullWidth
                      size="small"
                      placeholder="02-1234-5678"
                      inputProps={{
                        maxLength: 13
                      }}
                    />
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary">매장 전화번호</Typography>
                      <Typography variant="body1">{company?.storeTelNumber || '-'}</Typography>
                    </>
                  )}
                </Grid>
              </Grid>
            </Paper>

            {/* 사업 정보 */}
            <Paper sx={{ 
              p: 3,
              mb: 3,
              borderRadius: 2,
              boxShadow: 'none',
              border: '1px solid #EEEEEE'
            }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#3A3A3A', mb: 2 }}>
                사업 정보
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  {isEditing ? (
                    <TextField
                      label="업태"
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleFormChange}
                      fullWidth
                      size="small"
                    />
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary">업태</Typography>
                      <Typography variant="body1">{company?.businessType || '-'}</Typography>
                    </>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  {isEditing ? (
                    <TextField
                      label="종목"
                      name="businessCategory"
                      value={formData.businessCategory}
                      onChange={handleFormChange}
                      fullWidth
                      size="small"
                    />
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary">종목</Typography>
                      <Typography variant="body1">{company?.businessCategory || '-'}</Typography>
                    </>
                  )}
                </Grid>
              </Grid>
            </Paper>

            {/* 이미지 정보 */}
            <Paper sx={{ 
              p: 3,
              mb: 3,
              borderRadius: 2,
              boxShadow: 'none',
              border: '1px solid #EEEEEE'
            }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#3A3A3A', mb: 2 }}>
                이미지 정보
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>전면 이미지</Typography>
                  {isEditing ? (
                    <Box sx={{ position: 'relative' }}>
                      {imagePreview.frontImage || company?.imageInfo?.frontImage ? (
                        <Box sx={{ position: 'relative' }}>
                          <Box
                            component="img"
                            src={imagePreview.frontImage || `http://localhost:8080/api/companies/images/${company.imageInfo.frontImage}`}
                            alt="전면 이미지"
                            sx={{
                              width: '100%',
                              height: 200,
                              objectFit: 'cover',
                              borderRadius: 1,
                            }}
                          />
                          <IconButton
                            onClick={() => handleImageDelete('frontImage')}
                            sx={{
                              position: 'absolute',
                              padding: 0.5,
                              top: 5,
                              right: 5,
                              backgroundColor: 'rgba(255, 255, 255, 0.7)',
                              '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            height: 200,
                            backgroundColor: '#f5f5f5',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 1,
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: '#e0e0e0',
                            }
                          }}
                          onClick={() => document.getElementById('frontImage-upload').click()}
                        >
                          <UploadIcon sx={{ fontSize: 40, color: '#999' }} />
                          <Typography color="text.secondary" sx={{ mt: 1 }}>이미지 업로드</Typography>
                          <input
                            id="frontImage-upload"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, 'frontImage')}
                            style={{ display: 'none' }}
                          />
                        </Box>
                      )}
                      {(imagePreview.frontImage || company?.imageInfo?.frontImage) && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<UploadIcon />}
                          onClick={() => document.getElementById('frontImage-upload').click()}
                          sx={{ mt: 1, width: '100%' }}
                        >
                          이미지 변경
                          <input
                            id="frontImage-upload"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, 'frontImage')}
                            style={{ display: 'none' }}
                          />
                        </Button>
                      )}
                    </Box>
                  ) : (
                    company?.imageInfo?.frontImage ? (
                      <Box
                        component="img"
                        src={`http://localhost:8080/api/companies/images/${company.imageInfo.frontImage}`}
                        alt="전면 이미지"
                        sx={{
                          width: '100%',
                          height: 200,
                          objectFit: 'cover',
                          borderRadius: 1,
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: '100%',
                          height: 200,
                          backgroundColor: '#f5f5f5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 1,
                        }}
                      >
                        <Typography color="text.secondary">이미지 없음</Typography>
                      </Box>
                    )
                  )}
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>후면 이미지</Typography>
                  {isEditing ? (
                    <Box sx={{ position: 'relative' }}>
                      {imagePreview.backImage || company?.imageInfo?.backImage ? (
                        <Box sx={{ position: 'relative' }}>
                          <Box
                            component="img"
                            src={imagePreview.backImage || `http://localhost:8080/api/companies/images/${company.imageInfo.backImage}`}
                            alt="후면 이미지"
                            sx={{
                              width: '100%',
                              height: 200,
                              objectFit: 'cover',
                              borderRadius: 1,
                            }}
                          />
                          <IconButton
                            onClick={() => handleImageDelete('backImage')}
                            sx={{
                              position: 'absolute',
                              padding: 0.5,
                              top: 5,
                              right: 5,
                              backgroundColor: 'rgba(255, 255, 255, 0.7)',
                              '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            height: 200,
                            backgroundColor: '#f5f5f5',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 1,
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: '#e0e0e0',
                            }
                          }}
                          onClick={() => document.getElementById('backImage-upload').click()}
                        >
                          <UploadIcon sx={{ fontSize: 40, color: '#999' }} />
                          <Typography color="text.secondary" sx={{ mt: 1 }}>이미지 업로드</Typography>
                          <input
                            id="backImage-upload"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, 'backImage')}
                            style={{ display: 'none' }}
                          />
                        </Box>
                      )}
                      {(imagePreview.backImage || company?.imageInfo?.backImage) && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<UploadIcon />}
                          onClick={() => document.getElementById('backImage-upload').click()}
                          sx={{ mt: 1, width: '100%' }}
                        >
                          이미지 변경
                          <input
                            id="backImage-upload"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, 'backImage')}
                            style={{ display: 'none' }}
                          />
                        </Button>
                      )}
                    </Box>
                  ) : (
                    company?.imageInfo?.backImage ? (
                      <Box
                        component="img"
                        src={`http://localhost:8080/api/companies/images/${company.imageInfo.backImage}`}
                        alt="후면 이미지"
                        sx={{
                          width: '100%',
                          height: 200,
                          objectFit: 'cover',
                          borderRadius: 1,
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: '100%',
                          height: 200,
                          backgroundColor: '#f5f5f5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 1,
                        }}
                      >
                        <Typography color="text.secondary">이미지 없음</Typography>
                      </Box>
                    )
                  )}
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>좌측면 이미지</Typography>
                  {isEditing ? (
                    <Box sx={{ position: 'relative' }}>
                      {imagePreview.leftSideImage || company?.imageInfo?.leftSideImage ? (
                        <Box sx={{ position: 'relative' }}>
                          <Box
                            component="img"
                            src={imagePreview.leftSideImage || `http://localhost:8080/api/companies/images/${company.imageInfo.leftSideImage}`}
                            alt="좌측면 이미지"
                            sx={{
                              width: '100%',
                              height: 200,
                              objectFit: 'cover',
                              borderRadius: 1,
                            }}
                          />
                          <IconButton
                            onClick={() => handleImageDelete('leftSideImage')}
                            sx={{
                              position: 'absolute',
                              padding: 0.5,
                              top: 5,
                              right: 5,
                              backgroundColor: 'rgba(255, 255, 255, 0.7)',
                              '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            height: 200,
                            backgroundColor: '#f5f5f5',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 1,
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: '#e0e0e0',
                            }
                          }}
                          onClick={() => document.getElementById('leftSideImage-upload').click()}
                        >
                          <UploadIcon sx={{ fontSize: 40, color: '#999' }} />
                          <Typography color="text.secondary" sx={{ mt: 1 }}>이미지 업로드</Typography>
                          <input
                            id="leftSideImage-upload"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, 'leftSideImage')}
                            style={{ display: 'none' }}
                          />
                        </Box>
                      )}
                      {(imagePreview.leftSideImage || company?.imageInfo?.leftSideImage) && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<UploadIcon />}
                          onClick={() => document.getElementById('leftSideImage-upload').click()}
                          sx={{ mt: 1, width: '100%' }}
                        >
                          이미지 변경
                          <input
                            id="leftSideImage-upload"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, 'leftSideImage')}
                            style={{ display: 'none' }}
                          />
                        </Button>
                      )}
                    </Box>
                  ) : (
                    company?.imageInfo?.leftSideImage ? (
                      <Box
                        component="img"
                        src={`http://localhost:8080/api/companies/images/${company.imageInfo.leftSideImage}`}
                        alt="좌측면 이미지"
                        sx={{
                          width: '100%',
                          height: 200,
                          objectFit: 'cover',
                          borderRadius: 1,
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: '100%',
                          height: 200,
                          backgroundColor: '#f5f5f5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 1,
                        }}
                      >
                        <Typography color="text.secondary">이미지 없음</Typography>
                      </Box>
                    )
                  )}
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>우측면 이미지</Typography>
                  {isEditing ? (
                    <Box sx={{ position: 'relative' }}>
                      {imagePreview.rightSideImage || company?.imageInfo?.rightSideImage ? (
                        <Box sx={{ position: 'relative' }}>
                          <Box
                            component="img"
                            src={imagePreview.rightSideImage || `http://localhost:8080/api/companies/images/${company.imageInfo.rightSideImage}`}
                            alt="우측면 이미지"
                            sx={{
                              width: '100%',
                              height: 200,
                              objectFit: 'cover',
                              borderRadius: 1,
                            }}
                          />
                          <IconButton
                            onClick={() => handleImageDelete('rightSideImage')}
                            sx={{
                              position: 'absolute',
                              padding: 0.5,
                              top: 5,
                              right: 5,
                              backgroundColor: 'rgba(255, 255, 255, 0.7)',
                              '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            height: 200,
                            backgroundColor: '#f5f5f5',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 1,
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: '#e0e0e0',
                            }
                          }}
                          onClick={() => document.getElementById('rightSideImage-upload').click()}
                        >
                          <UploadIcon sx={{ fontSize: 40, color: '#999' }} />
                          <Typography color="text.secondary" sx={{ mt: 1 }}>이미지 업로드</Typography>
                          <input
                            id="rightSideImage-upload"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, 'rightSideImage')}
                            style={{ display: 'none' }}
                          />
                        </Box>
                      )}
                      {(imagePreview.rightSideImage || company?.imageInfo?.rightSideImage) && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<UploadIcon />}
                          onClick={() => document.getElementById('rightSideImage-upload').click()}
                          sx={{ mt: 1, width: '100%' }}
                        >
                          이미지 변경
                          <input
                            id="rightSideImage-upload"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, 'rightSideImage')}
                            style={{ display: 'none' }}
                          />
                        </Button>
                      )}
                    </Box>
                  ) : (
                    company?.imageInfo?.rightSideImage ? (
                      <Box
                        component="img"
                        src={`http://localhost:8080/api/companies/images/${company.imageInfo.rightSideImage}`}
                        alt="우측면 이미지"
                        sx={{
                          width: '100%',
                          height: 200,
                          objectFit: 'cover',
                          borderRadius: 1,
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: '100%',
                          height: 200,
                          backgroundColor: '#f5f5f5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 1,
                        }}
                      >
                        <Typography color="text.secondary">이미지 없음</Typography>
                      </Box>
                    )
                  )}
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>전체 이미지</Typography>
                  {isEditing ? (
                    <Box sx={{ position: 'relative' }}>
                      {imagePreview.fullImage || company?.imageInfo?.fullImage ? (
                        <Box sx={{ position: 'relative' }}>
                          <Box
                            component="img"
                            src={imagePreview.fullImage || `http://localhost:8080/api/companies/images/${company.imageInfo.fullImage}`}
                            alt="전체 이미지"
                            sx={{
                              width: '100%',
                              height: 200,
                              objectFit: 'cover',
                              borderRadius: 1,
                            }}
                          />
                          <IconButton
                            onClick={() => handleImageDelete('fullImage')}
                            sx={{
                              position: 'absolute',
                              padding: 0.5,
                              top: 5,
                              right: 5,
                              backgroundColor: 'rgba(255, 255, 255, 0.7)',
                              '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            height: 200,
                            backgroundColor: '#f5f5f5',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 1,
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: '#e0e0e0',
                            }
                          }}
                          onClick={() => document.getElementById('fullImage-upload').click()}
                        >
                          <UploadIcon sx={{ fontSize: 40, color: '#999' }} />
                          <Typography color="text.secondary" sx={{ mt: 1 }}>이미지 업로드</Typography>
                          <input
                            id="fullImage-upload"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, 'fullImage')}
                            style={{ display: 'none' }}
                          />
                        </Box>
                      )}
                      {(imagePreview.fullImage || company?.imageInfo?.fullImage) && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<UploadIcon />}
                          onClick={() => document.getElementById('fullImage-upload').click()}
                          sx={{ mt: 1, width: '100%' }}
                        >
                          이미지 변경
                          <input
                            id="fullImage-upload"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, 'fullImage')}
                            style={{ display: 'none' }}
                          />
                        </Button>
                      )}
                    </Box>
                  ) : (
                    company?.imageInfo?.fullImage ? (
                      <Box
                        component="img"
                        src={`http://localhost:8080/api/companies/images/${company.imageInfo.fullImage}`}
                        alt="전체 이미지"
                        sx={{
                          width: '100%',
                          height: 200,
                          objectFit: 'cover',
                          borderRadius: 1,
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: '100%',
                          height: 200,
                          backgroundColor: '#f5f5f5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 1,
                        }}
                      >
                        <Typography color="text.secondary">이미지 없음</Typography>
                      </Box>
                    )
                  )}
                </Grid>
              </Grid>
            </Paper>
            
            {/* 수탁자 이력 정보 */}
            <TrusteeHistoryList companyId={companyId} />
            
            {/* 하단 버튼 그룹 (편집 모드일 때만 표시) */}
            {isEditing && (
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                justifyContent: 'center',
                mt: 4
              }}>
                <Button 
                  type="submit"
                  variant="contained" 
                  disabled={isSubmitting}
                  startIcon={<SaveIcon />}
                  sx={{ 
                    minWidth: '120px',
                    bgcolor: '#1976d2',
                    '&:hover': { bgcolor: '#1565c0' }
                  }}
                >
                  {isSubmitting ? '저장 중...' : '저장'}
                </Button>
                
                <Button 
                  variant="outlined"
                  onClick={toggleEditMode}
                  disabled={isSubmitting}
                  sx={{ 
                    minWidth: '120px',
                    color: '#666',
                    borderColor: '#666',
                    '&:hover': {
                      borderColor: '#1976d2',
                      color: '#1976d2'
                    }
                  }}
                >
                  취소
                </Button>
              </Box>
            )}
          </LocalizationProvider>
        </form>
      )}

      {/* 수탁자 변경 다이얼로그 */}
      <Dialog 
        open={openTrusteeDialog} 
        onClose={handleCloseTrusteeDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>신규 수탁자 등록</DialogTitle>
        <DialogContent dividers>
          <TrusteeChangeForm 
            companyId={companyId} 
            onSave={handleTrusteeChangeSubmit}
            onCancel={handleCloseTrusteeDialog}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTrusteeDialog} color="inherit">
            취소
          </Button>
          <Button 
            onClick={() => document.getElementById('trustee-change-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))}
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? '처리 중...' : '저장'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CompanyDetail; 