import React, { useState } from 'react';
import { 
  Grid, 
  TextField, 
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Box,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers';
import koLocale from 'date-fns/locale/ko';

const TrusteeChangeForm = ({ companyId, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    trustee: '',
    trusteeCode: '',
    representativeName: '',
    managerName: '',
    email: '',
    phoneNumber: '',
    businessNumber: '',
    subBusinessNumber: '',
    companyName: '',
    storeTelNumber: '',
    businessType: '',
    businessCategory: '',
    startDate: null,
    endDate: null,
    insuranceStartDate: null,
    insuranceEndDate: null,
    reason: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 입력 필드 변경 핸들러
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
    
    // 에러 메시지 제거
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // 폼 유효성 검사
  const validateForm = () => {
    const errors = {};
    
    // 필수 필드 검사
    if (!formData.trustee) {
      errors.trustee = '수탁자 이름은 필수 입력 항목입니다.';
    }
    
    if (!formData.trusteeCode) {
      errors.trusteeCode = '수탁코드는 필수 입력 항목입니다.';
    }
    
    if (!formData.companyName) {
      errors.companyName = '상호는 필수 입력 항목입니다.';
    }
    
    if (!formData.representativeName) {
      errors.representativeName = '대표자명은 필수 입력 항목입니다.';
    }
    
    if (!formData.businessNumber) {
      errors.businessNumber = '사업자번호는 필수 입력 항목입니다.';
    } else if (!/^\d{3}-\d{2}-\d{5}$/.test(formData.businessNumber)) {
      errors.businessNumber = '사업자번호 형식이 올바르지 않습니다. (예: 123-45-67890)';
    }
    
    if (!formData.subBusinessNumber) {
      errors.subBusinessNumber = '종사업장번호는 필수 입력 항목입니다.';
    }
    
    // 업태와 종목은 필수 검사에서 제외
    
    if (!formData.managerName) {
      errors.managerName = '담당자명은 필수 입력 항목입니다.';
    }
    
    if (!formData.email) {
      errors.email = '이메일은 필수 입력 항목입니다.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = '이메일 형식이 올바르지 않습니다.';
    }
    
    if (!formData.phoneNumber) {
      errors.phoneNumber = '휴대폰번호는 필수 입력 항목입니다.';
    }
    
    if (!formData.storeTelNumber) {
      errors.storeTelNumber = '매장 전화번호는 필수 입력 항목입니다.';
    }
    
    // 시작일 필수 검사
    if (!formData.startDate) {
      errors.startDate = '시작일자는 필수 입력 항목입니다.';
    }
    
    // 종료일 필수 검사
    if (!formData.endDate) {
      errors.endDate = '종료일자는 필수 입력 항목입니다.';
    }
    
    // 보험 시작일 필수 검사
    if (!formData.insuranceStartDate) {
      errors.insuranceStartDate = '보험시작일자는 필수 입력 항목입니다.';
    }
    
    // 보험 종료일 필수 검사
    if (!formData.insuranceEndDate) {
      errors.insuranceEndDate = '보험종료일자는 필수 입력 항목입니다.';
    }
    
    // 날짜 유효성 검사
    if (formData.startDate && formData.endDate && 
        new Date(formData.startDate) > new Date(formData.endDate)) {
      errors.endDate = '종료일자는 시작일자 이후로 설정해주세요.';
    }
    
    if (formData.insuranceStartDate && formData.insuranceEndDate && 
        new Date(formData.insuranceStartDate) > new Date(formData.insuranceEndDate)) {
      errors.insuranceEndDate = '보험종료일자는 보험시작일자 이후로 설정해주세요.';
    }
    
    // 변경 사유 (필수)
    if (!formData.reason) {
      errors.reason = '변경 사유는 필수 입력 항목입니다.';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // 스크롤을 첫 번째 에러 필드로 이동
      const firstErrorField = Object.keys(formErrors)[0];
      const errorElement = document.getElementsByName(firstErrorField)[0];
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // 날짜를 안전하게 포맷팅하는 함수
      const formatDateForServer = (date) => {
        if (!date) return null;
        
        // Date 객체에서 년, 월, 일 추출
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
        const day = String(date.getDate()).padStart(2, '0');
        
        // YYYY-MM-DD 형식으로 반환
        return `${year}-${month}-${day}`;
      };
      
      // 날짜 형식 변환 (YYYY-MM-DD)
      const formattedData = {
        ...formData,
        startDate: formData.startDate ? formatDateForServer(formData.startDate) : null,
        endDate: formData.endDate ? formatDateForServer(formData.endDate) : null,
        insuranceStartDate: formData.insuranceStartDate ? formatDateForServer(formData.insuranceStartDate) : null,
        insuranceEndDate: formData.insuranceEndDate ? formatDateForServer(formData.insuranceEndDate) : null
      };
      
      // 부모 컴포넌트의 onSave 함수 호출 (새로고침은 부모 컴포넌트에서 처리)
      await onSave(formattedData);
      
    } catch (error) {
      setError(error.message || '수탁자 정보 등록 중 오류가 발생했습니다.');
      console.error('수탁자 변경 오류:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={koLocale}>
      <form id="trustee-change-form" onSubmit={handleSubmit}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {/* 수탁자 기본 정보 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#3A3A3A', mb: 1 }}>
            수탁자 기본 정보
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="수탁자"
                name="trustee"
                value={formData.trustee}
                onChange={handleFormChange}
                fullWidth
                size="small"
                required
                error={!!formErrors.trustee}
                helperText={formErrors.trustee}
                placeholder="정재현타이어(창원점)"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="수탁코드"
                name="trusteeCode"
                value={formData.trusteeCode}
                onChange={handleFormChange}
                fullWidth
                size="small"
                placeholder="2600"
                required
                error={!!formErrors.trusteeCode}
                helperText={formErrors.trusteeCode}
              />
            </Grid>
          </Grid>
        </Box>

        {/* 사업자 정보 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#3A3A3A', mb: 1 }}>
            사업자 정보
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="사업자번호"
                name="businessNumber"
                value={formData.businessNumber}
                onChange={handleFormChange}
                fullWidth
                size="small"
                required
                error={!!formErrors.businessNumber}
                helperText={formErrors.businessNumber}
                placeholder="123-45-67890"
                inputProps={{ maxLength: 12 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="종사업장번호"
                name="subBusinessNumber"
                value={formData.subBusinessNumber}
                onChange={handleFormChange}
                fullWidth
                size="small"
                placeholder="0103"
                required
                error={!!formErrors.subBusinessNumber}
                helperText={formErrors.subBusinessNumber}
              />
            </Grid>
            <Grid item xs={12} md={6}>
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
                placeholder="정재현타이어(창원점)"
              />
            </Grid>
            <Grid item xs={12} md={6}>
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
                placeholder="정재현"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="업태"
                name="businessType"
                value={formData.businessType}
                onChange={handleFormChange}
                fullWidth
                size="small"
                placeholder="도소매,서비스"
                error={!!formErrors.businessType}
                helperText={formErrors.businessType}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="종목"
                name="businessCategory"
                value={formData.businessCategory}
                onChange={handleFormChange}
                fullWidth
                size="small"
                placeholder="상품대리,기타도급"
                error={!!formErrors.businessCategory}
                helperText={formErrors.businessCategory}
              />
            </Grid>
          </Grid>
        </Box>
        
        {/* 담당자 정보 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#3A3A3A', mb: 1 }}>
            담당자 정보
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="담당자"
                name="managerName"
                value={formData.managerName}
                onChange={handleFormChange}
                fullWidth
                size="small"
                placeholder="정재현"
                required
                error={!!formErrors.managerName}
                helperText={formErrors.managerName}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="이메일"
                name="email"
                value={formData.email}
                onChange={handleFormChange}
                fullWidth
                size="small"
                required
                error={!!formErrors.email}
                helperText={formErrors.email}
                placeholder="mail@mail.com"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="휴대폰번호"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleFormChange}
                fullWidth
                size="small"
                placeholder="010-0000-0000"
                inputProps={{ maxLength: 13 }}
                required
                error={!!formErrors.phoneNumber}
                helperText={formErrors.phoneNumber}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="매장 전화번호"
                name="storeTelNumber"
                value={formData.storeTelNumber}
                onChange={handleFormChange}
                fullWidth
                size="small"
                placeholder="055-123-4567"
                inputProps={{ maxLength: 13 }}
                required
                error={!!formErrors.storeTelNumber}
                helperText={formErrors.storeTelNumber}
              />
            </Grid>
          </Grid>
        </Box>
        
        {/* 계약 정보 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#3A3A3A', mb: 1 }}>
            계약 정보
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <DatePicker
                label="시작일자 *"
                value={formData.startDate}
                onChange={(date) => handleDateChange('startDate', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    required: true,
                    error: !!formErrors.startDate,
                    helperText: formErrors.startDate
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <DatePicker
                label="종료일자"
                value={formData.endDate}
                onChange={(date) => handleDateChange('endDate', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    error: !!formErrors.endDate,
                    helperText: formErrors.endDate,
                    required: true
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <DatePicker
                label="하자보증증권 보험시작일자"
                value={formData.insuranceStartDate}
                onChange={(date) => handleDateChange('insuranceStartDate', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    error: !!formErrors.insuranceStartDate,
                    helperText: formErrors.insuranceStartDate,
                    required: true
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <DatePicker
                label="하자보증증권 보험종료일자"
                value={formData.insuranceEndDate}
                onChange={(date) => handleDateChange('insuranceEndDate', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    error: !!formErrors.insuranceEndDate,
                    helperText: formErrors.insuranceEndDate,
                    required: true
                  }
                }}
              />
            </Grid>
          </Grid>
        </Box>
        
        {/* 변경 사유 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#3A3A3A', mb: 1 }}>
            변경 사유
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <TextField
            label="변경 사유"
            name="reason"
            value={formData.reason}
            onChange={handleFormChange}
            fullWidth
            multiline
            rows={3}
            placeholder="수탁자 변경 사유를 입력해주세요."
            required
            error={!!formErrors.reason}
            helperText={formErrors.reason}
          />
        </Box>
      </form>
    </LocalizationProvider>
  );
};

export default TrusteeChangeForm; 