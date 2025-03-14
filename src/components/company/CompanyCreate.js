import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Grid, 
  Divider, 
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardMedia,
  CardContent,
  CardActions
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { ko } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowBack, 
  Search as SearchIcon, 
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const CompanyCreate = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // 파일 입력 참조
  const frontImageRef = useRef(null);
  const backImageRef = useRef(null);
  const leftSideImageRef = useRef(null);
  const rightSideImageRef = useRef(null);
  const fullImageRef = useRef(null);
  
  // 이미지 관련 상태
  const [images, setImages] = useState({
    frontImage: null,
    backImage: null,
    leftSideImage: null,
    rightSideImage: null,
    fullImage: null
  });
  
  // 이미지 미리보기 URL 상태
  const [imagePreviews, setImagePreviews] = useState({
    frontImage: null,
    backImage: null,
    leftSideImage: null,
    rightSideImage: null,
    fullImage: null
  });
  
  // 주소 검색 관련 상태
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [baseAddress, setBaseAddress] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  
  // 회사 정보 상태
  const [companyData, setCompanyData] = useState({
    storeCode: '',
    storeName: '',
    trustee: '',
    trusteeCode: '',
    businessNumber: '',
    companyName: '',
    representativeName: '',
    active: true,
    startDate: null,
    endDate: null,
    managerName: '',
    email: '',
    subBusinessNumber: '',
    phoneNumber: '',
    address: '',
    addressDetail: '',
    businessType: '',
    businessCategory: ''
  });
  
  // 유효성 검사 오류 상태
  const [errors, setErrors] = useState({});
  
  // 카카오 주소 API 스크립트 로드
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);
  
  // 주소 검색 다이얼로그 열기
  const handleOpenAddressDialog = () => {
    setAddressDialogOpen(true);
  };
  
  // 주소 검색 다이얼로그 닫기
  const handleCloseAddressDialog = () => {
    setAddressDialogOpen(false);
  };
  
  // 카카오 주소 검색 실행
  const handleSearchAddress = () => {
    if (window.daum && window.daum.Postcode) {
      new window.daum.Postcode({
        oncomplete: (data) => {
          // 도로명 주소 또는 지번 주소 선택
          const address = data.roadAddress || data.jibunAddress;
          
          // 기본 주소 상태 업데이트
          setBaseAddress(address);
          
          // 상세 주소 입력을 위해 다이얼로그 닫기
          handleCloseAddressDialog();
        }
      }).open();
    } else {
      alert('주소 검색 서비스를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };
  
  // 상세 주소 변경 핸들러
  const handleDetailAddressChange = (e) => {
    const value = e.target.value;
    setDetailAddress(value);
    setCompanyData(prev => ({
      ...prev,
      addressDetail: value
    }));
  };
  
  // 입력값 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 입력 시 해당 필드의 오류 메시지 초기화
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // 활성화 상태 변경 핸들러
  const handleActiveChange = (e) => {
    setCompanyData(prev => ({
      ...prev,
      active: e.target.checked
    }));
  };
  
  // 날짜 변경 핸들러
  const handleDateChange = (name, date) => {
    setCompanyData(prev => ({
      ...prev,
      [name]: date
    }));
  };
  
  // 전화번호 포맷팅 함수
  const formatPhoneNumber = (value) => {
    if (!value) return '';
    
    // 숫자만 추출
    const numbers = value.replace(/[^\d]/g, '');
    
    // 숫자를 형식에 맞게 변환
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  };
  
  // 전화번호 변경 핸들러
  const handlePhoneNumberChange = (e) => {
    const formattedNumber = formatPhoneNumber(e.target.value);
    setCompanyData(prev => ({
      ...prev,
      phoneNumber: formattedNumber
    }));
  };
  
  // 사업자번호 포맷팅 함수
  const formatBusinessNumber = (value) => {
    if (!value) return '';
    
    // 숫자만 추출
    const numbers = value.replace(/[^\d]/g, '');
    
    // 숫자를 형식에 맞게 변환 (000-00-00000)
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 5) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`;
    }
  };
  
  // 사업자번호 변경 핸들러
  const handleBusinessNumberChange = (e) => {
    const formattedNumber = formatBusinessNumber(e.target.value);
    setCompanyData(prev => ({
      ...prev,
      businessNumber: formattedNumber
    }));
  };
  
  // 폼 유효성 검사
  const validateForm = () => {
    const newErrors = {};
    
    // 필수 필드 검사
    if (!companyData.storeCode) {
      newErrors.storeCode = '매장코드를 입력해주세요.';
    } else if (companyData.storeCode.length > 10) {
      newErrors.storeCode = '매장코드는 10자 이내로 입력해주세요.';
    }
    
    if (!companyData.storeName) {
      newErrors.storeName = '매장명을 입력해주세요.';
    } else if (companyData.storeName.length > 100) {
      newErrors.storeName = '매장명은 100자 이내로 입력해주세요.';
    }
    
    // 이메일 형식 검사
    if (companyData.email && !/\S+@\S+\.\S+/.test(companyData.email)) {
      newErrors.email = '유효한 이메일 주소를 입력해주세요.';
    }
    
    // 전화번호 형식 검사
    if (companyData.phoneNumber && !/^\d{3}-\d{3,4}-\d{4}$/.test(companyData.phoneNumber)) {
      newErrors.phoneNumber = '전화번호 형식이 올바르지 않습니다. (예: 010-1234-5678)';
    }
    
    // 사업자번호 형식 검사
    if (companyData.businessNumber && !/^\d{3}-\d{2}-\d{5}$/.test(companyData.businessNumber)) {
      newErrors.businessNumber = '사업자번호 형식이 올바르지 않습니다. (예: 123-45-67890)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // 이미지 선택 핸들러
  const handleImageSelect = (e, imageType) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // 파일 유형 검사
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('이미지 파일만 업로드 가능합니다. (JPEG, PNG, GIF, WEBP)');
      return;
    }
    
    // 파일 크기 검사 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      setError('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }
    
    // 이미지 상태 업데이트
    setImages(prev => ({
      ...prev,
      [imageType]: file
    }));
    
    // 이미지 미리보기 URL 생성
    const previewUrl = URL.createObjectURL(file);
    setImagePreviews(prev => ({
      ...prev,
      [imageType]: previewUrl
    }));
  };
  
  // 이미지 삭제 핸들러
  const handleImageDelete = (imageType) => {
    // 이미지 상태 초기화
    setImages(prev => ({
      ...prev,
      [imageType]: null
    }));
    
    // 이미지 미리보기 URL 초기화
    if (imagePreviews[imageType]) {
      URL.revokeObjectURL(imagePreviews[imageType]);
      setImagePreviews(prev => ({
        ...prev,
        [imageType]: null
      }));
    }
    
    // 파일 입력 초기화
    if (imageType === 'frontImage' && frontImageRef.current) {
      frontImageRef.current.value = '';
    } else if (imageType === 'backImage' && backImageRef.current) {
      backImageRef.current.value = '';
    } else if (imageType === 'leftSideImage' && leftSideImageRef.current) {
      leftSideImageRef.current.value = '';
    } else if (imageType === 'rightSideImage' && rightSideImageRef.current) {
      rightSideImageRef.current.value = '';
    } else if (imageType === 'fullImage' && fullImageRef.current) {
      fullImageRef.current.value = '';
    }
  };
  
  // 이미지 업로드 버튼 클릭 핸들러
  const handleUploadButtonClick = (imageType) => {
    if (imageType === 'frontImage' && frontImageRef.current) {
      frontImageRef.current.click();
    } else if (imageType === 'backImage' && backImageRef.current) {
      backImageRef.current.click();
    } else if (imageType === 'leftSideImage' && leftSideImageRef.current) {
      leftSideImageRef.current.click();
    } else if (imageType === 'rightSideImage' && rightSideImageRef.current) {
      rightSideImageRef.current.click();
    } else if (imageType === 'fullImage' && fullImageRef.current) {
      fullImageRef.current.click();
    }
  };
  
  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 폼 유효성 검사
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const token = sessionStorage.getItem('token');
      
      // 주소와 상세주소 합치기
      const fullAddress = baseAddress + (detailAddress ? ` ${detailAddress}` : '');
      
      // 최종 데이터 준비
      const finalCompanyData = {
        ...companyData,
        address: fullAddress
      };
      
      // 이미지 파일이 있는지 확인
      const hasImages = Object.values(images).some(img => img !== null);
      
      let response;
      let data;
      
      if (hasImages) {
        // FormData 생성 및 회사 데이터 추가
        const formData = new FormData();
        formData.append('company', new Blob([JSON.stringify(finalCompanyData)], { type: 'application/json' }));
        
        // 이미지 파일 추가
        if (images.frontImage) {
          formData.append('frontImage', images.frontImage);
        }
        if (images.backImage) {
          formData.append('backImage', images.backImage);
        }
        if (images.leftSideImage) {
          formData.append('leftSideImage', images.leftSideImage);
        }
        if (images.rightSideImage) {
          formData.append('rightSideImage', images.rightSideImage);
        }
        if (images.fullImage) {
          formData.append('fullImage', images.fullImage);
        }
        
        // 이미지를 포함한 회사 생성 요청
        response = await fetch('http://localhost:8080/api/companies', {
          method: 'POST',
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: formData
        });
      } else {
        // 이미지 없이 회사 데이터만 전송
        response = await fetch('http://localhost:8080/api/companies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify(finalCompanyData)
        });
      }
      
      data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '회사 등록에 실패했습니다.');
      }
      
      setSuccess('회사가 성공적으로 등록되었습니다.');
      
      // 3초 후 회사 목록 페이지로 이동
      setTimeout(() => {
        navigate('/companies');
      }, 3000);
      
    } catch (error) {
      console.error('회사 등록 오류:', error);
      setError(error.message || '회사 등록 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 이미지 카드 컴포넌트
  const ImageCard = ({ title, imageType, preview }) => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 0, pb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
      </CardContent>
      
      {preview ? (
        <CardMedia
          component="img"
          image={preview}
          alt={title}
          sx={{ 
            height: 140, 
            objectFit: 'cover',
            borderTop: '1px solid #eee',
            borderBottom: '1px solid #eee'
          }}
        />
      ) : (
        <Box
          sx={{
            height: 140,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            borderTop: '1px solid #eee',
            borderBottom: '1px solid #eee'
          }}
        >
          <Typography variant="body2" color="text.secondary">
            이미지 없음
          </Typography>
        </Box>
      )}
      
      <CardActions sx={{ justifyContent: 'space-between', pt: 1, pb: 1 }}>
        <input
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          ref={
            imageType === 'frontImage' ? frontImageRef :
            imageType === 'backImage' ? backImageRef :
            imageType === 'leftSideImage' ? leftSideImageRef :
            imageType === 'rightSideImage' ? rightSideImageRef :
            fullImageRef
          }
          onChange={(e) => handleImageSelect(e, imageType)}
        />
        <Button
          size="small"
          startIcon={<CloudUploadIcon />}
          onClick={() => handleUploadButtonClick(imageType)}
        >
          {preview ? '변경' : '업로드'}
        </Button>
        
        {preview && (
          <IconButton 
            size="small" 
            color="error"
            onClick={() => handleImageDelete(imageType)}
          >
            <DeleteIcon />
          </IconButton>
        )}
      </CardActions>
    </Card>
  );

  return (
    <Box sx={{ p: 3, backgroundColor: '#F8F8FE', minHeight: '100vh' }}>
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
            업체 등록
          </Typography>
        </Box>
      </Box>

      {/* 알림 메시지 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* 회사 등록 폼 */}
      <Paper sx={{ 
        p: 3,
        borderRadius: 2,
        boxShadow: 'none',
        border: '1px solid #EEEEEE'
      }}>
        <form onSubmit={handleSubmit}>
          {/* 기본 정보 섹션 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#3A3A3A', mb: 2 }}>
              기본 정보
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="매장코드 *"
                  name="storeCode"
                  value={companyData.storeCode}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  required
                  error={!!errors.storeCode}
                  helperText={errors.storeCode}
                  placeholder="예: S00001"
                />
              </Grid>
              
              <Grid item xs={12} md={8}>
                <TextField
                  label="매장명 *"
                  name="storeName"
                  value={companyData.storeName}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  required
                  error={!!errors.storeName}
                  helperText={errors.storeName}
                  placeholder="예: 세종점"
                />
              </Grid>
              
              {/* 주소 입력 필드 */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    label="주소"
                    name="baseAddress"
                    value={baseAddress}
                    fullWidth
                    size="small"
                    placeholder="주소 검색 버튼을 클릭하세요"
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleOpenAddressDialog}
                    startIcon={<SearchIcon />}
                    sx={{ minWidth: '120px' }}
                  >
                    주소 검색
                  </Button>
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="상세 주소"
                  name="addressDetail"
                  value={detailAddress}
                  onChange={handleDetailAddressChange}
                  fullWidth
                  size="small"
                  placeholder="상세 주소를 입력하세요"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="수탁자"
                  name="trustee"
                  value={companyData.trustee}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  placeholder="예: 타이어 뱅크(본점)"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="수탁코드"
                  name="trusteeCode"
                  value={companyData.trusteeCode}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  placeholder="예: 0001"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="사업자번호"
                  name="businessNumber"
                  value={companyData.businessNumber}
                  onChange={handleBusinessNumberChange}
                  fullWidth
                  size="small"
                  error={!!errors.businessNumber}
                  helperText={errors.businessNumber}
                  placeholder="예: 123-45-67890"
                  inputProps={{
                    maxLength: 12 // 000-00-00000 형식의 최대 길이
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="종사업장번호"
                  name="subBusinessNumber"
                  value={companyData.subBusinessNumber}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  placeholder="예: 0001"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="상호"
                  name="companyName"
                  value={companyData.companyName}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  placeholder="예: 타이어 뱅크(본점)"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="대표자명"
                  name="representativeName"
                  value={companyData.representativeName}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  placeholder="예: 대표자"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
                  <DatePicker
                    label="시작일자"
                    value={companyData.startDate}
                    onChange={(date) => handleDateChange('startDate', date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: "small"
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
                  <DatePicker
                    label="종료일자"
                    value={companyData.endDate}
                    onChange={(date) => handleDateChange('endDate', date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: "small"
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={companyData.active}
                      onChange={handleActiveChange}
                      color={companyData.active ? "success" : "default"}
                    />
                  }
                  label={companyData.active ? "사용" : "미사용"}
                />
              </Grid>
            </Grid>
          </Box>
          
          {/* 연락처 정보 섹션 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#3A3A3A', mb: 2 }}>
              연락처 정보
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="담당자"
                  name="managerName"
                  value={companyData.managerName}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  placeholder="예: 홍길동"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="이메일"
                  name="email"
                  type="email"
                  value={companyData.email}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  error={!!errors.email}
                  helperText={errors.email}
                  placeholder="예: example@example.com"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="전화번호"
                  name="phoneNumber"
                  value={companyData.phoneNumber}
                  onChange={handlePhoneNumberChange}
                  fullWidth
                  size="small"
                  error={!!errors.phoneNumber}
                  helperText={errors.phoneNumber}
                  placeholder="예: 010-1234-5678"
                  inputProps={{
                    maxLength: 13 // 000-0000-0000 형식의 최대 길이
                  }}
                />
              </Grid>
            </Grid>
          </Box>
          
          {/* 사업 정보 섹션 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#3A3A3A', mb: 2 }}>
              사업 정보
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="업태"
                  name="businessType"
                  value={companyData.businessType}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  placeholder="예: 도소매,서비스"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="종목"
                  name="businessCategory"
                  value={companyData.businessCategory}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  placeholder="예: 상품대리,기타도급"
                />
              </Grid>
            </Grid>
          </Box>
          
          {/* 이미지 업로드 섹션 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#3A3A3A', mb: 2 }}>
              이미지 등록
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Box sx={{ 
              backgroundColor: '#F8F9FA',
              borderRadius: 2,
              border: '1px solid #EEEEEE',
              p: 3
            }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4} lg={2.4}>
                  <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
                    정면 사진
                  </Typography>
                  <Box sx={{ 
                    position: 'relative',
                    width: '100%',
                    paddingTop: '100%',
                    backgroundColor: '#F8F9FA',
                    borderRadius: 1,
                    border: '1px dashed #E0E0E0',
                    overflow: 'hidden'
                  }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageSelect(e, 'frontImage')}
                      style={{ display: 'none' }}
                      ref={frontImageRef}
                      id="frontImage-upload"
                    />
                    {imagePreviews.frontImage ? (
                      <>
                        <img 
                          src={imagePreviews.frontImage}
                          alt="정면 사진"
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleImageDelete('frontImage')}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            color: 'white',
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </>
                    ) : (
                      <label htmlFor="frontImage-upload" style={{ cursor: 'pointer' }}>
                        <Box sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1
                        }}>
                          <CloudUploadIcon sx={{ color: '#9E9E9E', fontSize: 32 }} />
                          <Typography variant="caption" sx={{ color: '#9E9E9E' }}>
                            클릭하여 업로드
                          </Typography>
                        </Box>
                      </label>
                    )}
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4} lg={2.4}>
                  <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
                    후면 사진
                  </Typography>
                  <Box sx={{ 
                    position: 'relative',
                    width: '100%',
                    paddingTop: '100%',
                    backgroundColor: '#F8F9FA',
                    borderRadius: 1,
                    border: '1px dashed #E0E0E0',
                    overflow: 'hidden'
                  }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageSelect(e, 'backImage')}
                      style={{ display: 'none' }}
                      ref={backImageRef}
                      id="backImage-upload"
                    />
                    {imagePreviews.backImage ? (
                      <>
                        <img 
                          src={imagePreviews.backImage}
                          alt="후면 사진"
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleImageDelete('backImage')}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            color: 'white',
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </>
                    ) : (
                      <label htmlFor="backImage-upload" style={{ cursor: 'pointer' }}>
                        <Box sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1
                        }}>
                          <CloudUploadIcon sx={{ color: '#9E9E9E', fontSize: 32 }} />
                          <Typography variant="caption" sx={{ color: '#9E9E9E' }}>
                            클릭하여 업로드
                          </Typography>
                        </Box>
                      </label>
                    )}
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4} lg={2.4}>
                  <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
                    좌측면 사진
                  </Typography>
                  <Box sx={{ 
                    position: 'relative',
                    width: '100%',
                    paddingTop: '100%',
                    backgroundColor: '#F8F9FA',
                    borderRadius: 1,
                    border: '1px dashed #E0E0E0',
                    overflow: 'hidden'
                  }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageSelect(e, 'leftSideImage')}
                      style={{ display: 'none' }}
                      ref={leftSideImageRef}
                      id="leftSideImage-upload"
                    />
                    {imagePreviews.leftSideImage ? (
                      <>
                        <img 
                          src={imagePreviews.leftSideImage}
                          alt="좌측면 사진"
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleImageDelete('leftSideImage')}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            color: 'white',
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </>
                    ) : (
                      <label htmlFor="leftSideImage-upload" style={{ cursor: 'pointer' }}>
                        <Box sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1
                        }}>
                          <CloudUploadIcon sx={{ color: '#9E9E9E', fontSize: 32 }} />
                          <Typography variant="caption" sx={{ color: '#9E9E9E' }}>
                            클릭하여 업로드
                          </Typography>
                        </Box>
                      </label>
                    )}
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4} lg={2.4}>
                  <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
                    우측면 사진
                  </Typography>
                  <Box sx={{ 
                    position: 'relative',
                    width: '100%',
                    paddingTop: '100%',
                    backgroundColor: '#F8F9FA',
                    borderRadius: 1,
                    border: '1px dashed #E0E0E0',
                    overflow: 'hidden'
                  }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageSelect(e, 'rightSideImage')}
                      style={{ display: 'none' }}
                      ref={rightSideImageRef}
                      id="rightSideImage-upload"
                    />
                    {imagePreviews.rightSideImage ? (
                      <>
                        <img 
                          src={imagePreviews.rightSideImage}
                          alt="우측면 사진"
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleImageDelete('rightSideImage')}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            color: 'white',
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </>
                    ) : (
                      <label htmlFor="rightSideImage-upload" style={{ cursor: 'pointer' }}>
                        <Box sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1
                        }}>
                          <CloudUploadIcon sx={{ color: '#9E9E9E', fontSize: 32 }} />
                          <Typography variant="caption" sx={{ color: '#9E9E9E' }}>
                            클릭하여 업로드
                          </Typography>
                        </Box>
                      </label>
                    )}
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4} lg={2.4}>
                  <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
                    전체 사진
                  </Typography>
                  <Box sx={{ 
                    position: 'relative',
                    width: '100%',
                    paddingTop: '100%',
                    backgroundColor: '#F8F9FA',
                    borderRadius: 1,
                    border: '1px dashed #E0E0E0',
                    overflow: 'hidden'
                  }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageSelect(e, 'fullImage')}
                      style={{ display: 'none' }}
                      ref={fullImageRef}
                      id="fullImage-upload"
                    />
                    {imagePreviews.fullImage ? (
                      <>
                        <img 
                          src={imagePreviews.fullImage}
                          alt="전체 사진"
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleImageDelete('fullImage')}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            color: 'white',
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </>
                    ) : (
                      <label htmlFor="fullImage-upload" style={{ cursor: 'pointer' }}>
                        <Box sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1
                        }}>
                          <CloudUploadIcon sx={{ color: '#9E9E9E', fontSize: 32 }} />
                          <Typography variant="caption" sx={{ color: '#9E9E9E' }}>
                            클릭하여 업로드
                          </Typography>
                        </Box>
                      </label>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Box>
          
          {/* 버튼 그룹 */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            justifyContent: 'center',
            mt: 4
          }}>
            <Button 
              type="submit"
              variant="contained" 
              disabled={isLoading}
              sx={{ 
                minWidth: '120px',
                bgcolor: '#1976d2',
                '&:hover': { bgcolor: '#1565c0' }
              }}
            >
              {isLoading ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} />
                  저장 중...
                </>
              ) : '저장'}
            </Button>
            
            <Button 
              variant="outlined"
              onClick={() => navigate('/companies')}
              disabled={isLoading}
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
        </form>
      </Paper>
      
      {/* 주소 검색 다이얼로그 */}
      <Dialog open={addressDialogOpen} onClose={handleCloseAddressDialog} maxWidth="sm" fullWidth>
        <DialogTitle>주소 검색</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            아래 버튼을 클릭하여 주소를 검색해주세요.
          </Typography>
          <Button 
            variant="contained" 
            onClick={handleSearchAddress}
            startIcon={<SearchIcon />}
            fullWidth
          >
            주소 검색하기
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddressDialog} color="primary">
            닫기
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CompanyCreate; 