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
  CardActions,
  Snackbar
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
  
  // 스낵바 상태
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  
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
    insuranceStartDate: null,
    insuranceEndDate: null,
    managerName: '',
    email: '',
    subBusinessNumber: '',
    phoneNumber: '',
    storeTelNumber: '',
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
  
  // 매장 전화번호 포맷팅 함수 (다양한 지역번호 형식 지원)
  const formatStoreTelNumber = (value) => {
    if (!value) return '';
    
    // 숫자만 추출
    const numbers = value.replace(/[^\d]/g, '');
    
    // 지역번호 형식에 따라 다르게 처리
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length === 10) { // 02-XXXX-XXXX (서울)
      if (numbers.startsWith('02')) {
        return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`;
      } else { // XXXX-XXX-XXXX (일반적인 경우)
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
      }
    } else if (numbers.length === 11) { // XXX-XXXX-XXXX
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    } else if (numbers.length >= 8 && numbers.length <= 9) { // XX-XXX-XXXX 또는 XXX-XXX-XXX
      if (numbers.startsWith('02')) { // 서울 지역번호
        return `${numbers.slice(0, 2)}-${numbers.slice(2, 5)}-${numbers.slice(5)}`;
      } else { // 나머지 지역번호
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
      }
    } else {
      // 기타 형식은 일정 단위로 끊어서 표시
      if (numbers.length <= 4) {
        return numbers;
      } else if (numbers.length <= 8) {
        return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
      } else {
        // 첫 번째 부분을 지역번호로 가정하고 나머지를 적절히 분배
        const areaCodeLength = numbers.startsWith('02') ? 2 : 3;
        const middleLength = Math.min(4, Math.floor((numbers.length - areaCodeLength) / 2));
        
        return `${numbers.slice(0, areaCodeLength)}-${numbers.slice(areaCodeLength, areaCodeLength + middleLength)}-${numbers.slice(areaCodeLength + middleLength)}`;
      }
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
  
  // 매장 전화번호 변경 핸들러
  const handleStoreTelNumberChange = (e) => {
    const formattedNumber = formatStoreTelNumber(e.target.value);
    setCompanyData(prev => ({
      ...prev,
      storeTelNumber: formattedNumber
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
    
    // 기본 정보 - 필수 필드 검사
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
    
    if (!baseAddress) {
      newErrors.baseAddress = '주소를 입력해주세요.';
    }
    
    if (!detailAddress) {
      newErrors.addressDetail = '상세 주소를 입력해주세요.';
    }
    
    if (!companyData.trustee) {
      newErrors.trustee = '수탁사업자명을 입력해주세요.';
    }
    
    if (!companyData.trusteeCode) {
      newErrors.trusteeCode = '수탁코드를 입력해주세요.';
    }
    
    if (!companyData.businessNumber) {
      newErrors.businessNumber = '사업자번호를 입력해주세요.';
    } else if (!/^\d{3}-\d{2}-\d{5}$/.test(companyData.businessNumber)) {
      newErrors.businessNumber = '사업자번호 형식이 올바르지 않습니다. (예: 123-45-67890)';
    }
    
    if (!companyData.subBusinessNumber) {
      newErrors.subBusinessNumber = '종사업장번호를 입력해주세요.';
    }
    
    if (!companyData.companyName) {
      newErrors.companyName = '상호를 입력해주세요.';
    }
    
    if (!companyData.representativeName) {
      newErrors.representativeName = '대표자명을 입력해주세요.';
    }
    
    if (!companyData.startDate) {
      newErrors.startDate = '계약 시작일자를 입력해주세요.';
    }
    
    if (!companyData.endDate) {
      newErrors.endDate = '계약 종료일자를 입력해주세요.';
    }
    
    if (!companyData.insuranceStartDate) {
      newErrors.insuranceStartDate = '보험 시작일자를 입력해주세요.';
    }
    
    if (!companyData.insuranceEndDate) {
      newErrors.insuranceEndDate = '보험 종료일자를 입력해주세요.';
    }
    
    // 연락처 정보 - 필수 필드 검사
    if (!companyData.managerName) {
      newErrors.managerName = '담당자를 입력해주세요.';
    }
    
    if (!companyData.email) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!/\S+@\S+\.\S+/.test(companyData.email)) {
      newErrors.email = '유효한 이메일 주소를 입력해주세요.';
    }
    
    if (!companyData.phoneNumber) {
      newErrors.phoneNumber = '담당자 전화번호를 입력해주세요.';
    } else if (!/^\d{3}-\d{3,4}-\d{4}$/.test(companyData.phoneNumber)) {
      newErrors.phoneNumber = '전화번호 형식이 올바르지 않습니다. (예: 010-1234-5678)';
    }
    
    if (!companyData.storeTelNumber) {
      newErrors.storeTelNumber = '매장 전화번호를 입력해주세요.';
    } else if (!/^(\d{2,3})-(\d{3,4})-(\d{3,4})$/.test(companyData.storeTelNumber)) {
      newErrors.storeTelNumber = '전화번호 형식이 올바르지 않습니다. (예: 02-1234-5678 또는 055-123-4567)';
    }
    
    // 계약 시작일이 종료일보다 이후인 경우
    if (companyData.startDate && companyData.endDate &&
        companyData.startDate > companyData.endDate) {
      newErrors.endDate = '계약 종료일은 시작일 이후로 설정해주세요.';
    }
    
    // 보험 기간 유효성 검사 - 시작일이 종료일보다 이후인 경우
    if (companyData.insuranceStartDate && companyData.insuranceEndDate &&
        companyData.insuranceStartDate > companyData.insuranceEndDate) {
      newErrors.insuranceEndDate = '보험 종료일은 시작일 이후로 설정해주세요.';
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
  
  // 스낵바 닫기 핸들러
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
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
      
      // 최종 데이터 준비
      const finalCompanyData = {
        ...companyData,
        address: fullAddress,
        // 날짜 필드를 문자열로 변환
        startDate: companyData.startDate ? formatDateForServer(companyData.startDate) : null,
        endDate: companyData.endDate ? formatDateForServer(companyData.endDate) : null,
        insuranceStartDate: companyData.insuranceStartDate ? formatDateForServer(companyData.insuranceStartDate) : null,
        insuranceEndDate: companyData.insuranceEndDate ? formatDateForServer(companyData.insuranceEndDate) : null
      };
      
      
      // 이미지 파일이 있는지 확인
      const hasImages = Object.values(images).some(img => img !== null);
      
      let response;
      
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
      
      // 응답 데이터 처리
      const data = await response.json();
      
      if (!response.ok) {
        // 백엔드에서 보낸 오류 메시지 확인
        let errorMessage = data.message || '회사 등록에 실패했습니다.';
        
        // 특정 오류 케이스 처리
        if (errorMessage.includes('이미 사용 중인 매장코드')) {
          // 매장코드 필드에 오류 표시
          setErrors(prev => ({
            ...prev,
            storeCode: '이미 사용 중인 매장코드입니다. 다른 코드를 입력해주세요.'
          }));
          
          // 매장코드 필드로 스크롤
          const storeCodeElement = document.querySelector('input[name="storeCode"]');
          if (storeCodeElement) {
            storeCodeElement.focus();
            storeCodeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else if (errorMessage.includes('이미 사용 중인 사업자번호')) {
          // 사업자번호 필드에 오류 표시
          setErrors(prev => ({
            ...prev,
            businessNumber: '이미 사용 중인 사업자번호입니다. 다른 번호를 입력해주세요.'
          }));
          
          // 사업자번호 필드로 스크롤
          const businessNumberElement = document.querySelector('input[name="businessNumber"]');
          if (businessNumberElement) {
            businessNumberElement.focus();
            businessNumberElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else if (errorMessage.includes('이미 사용 중인 수탁코드')) {
          // 수탁코드 필드에 오류 표시
          setErrors(prev => ({
            ...prev,
            trusteeCode: '이미 사용 중인 수탁코드입니다. 다른 코드를 입력해주세요.'
          }));
          
          // 수탁코드 필드로 스크롤
          const trusteeCodeElement = document.querySelector('input[name="trusteeCode"]');
          if (trusteeCodeElement) {
            trusteeCodeElement.focus();
            trusteeCodeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else if (errorMessage.includes('이미 사용 중인 종사업장번호')) {
          // 종사업장번호 필드에 오류 표시
          setErrors(prev => ({
            ...prev,
            subBusinessNumber: '이미 사용 중인 종사업장번호입니다. 다른 번호를 입력해주세요.'
          }));
          
          // 종사업장번호 필드로 스크롤
          const subBusinessNumberElement = document.querySelector('input[name="subBusinessNumber"]');
          if (subBusinessNumberElement) {
            subBusinessNumberElement.focus();
            subBusinessNumberElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else if (response.status === 401) {
          errorMessage = '인증이 만료되었습니다. 다시 로그인해주세요.';
          // 로그인 페이지로 리디렉션 처리
          setTimeout(() => {
            navigate('/login');
          }, 1500);
        }
        
        throw new Error(errorMessage);
      }
      
      // 성공 메시지를 스낵바로 표시
      setSnackbarMessage('회사가 성공적으로 등록되었습니다.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // 성공 알림 표시
      alert('업체 등록이 완료되었습니다.');
      
      // 회사 목록 페이지로 이동
      navigate('/companies');
      
    } catch (error) {
      console.error('회사 등록 오류:', error);
      
      // 오류 메시지 설정
      const errorMessage = error.message || '회사 등록 중 오류가 발생했습니다.';
      setError(errorMessage);
      
      // 오류 메시지를 스낵바로 표시
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      
      // 특정 필드 오류가 아닌 경우에만 저장 버튼으로 스크롤
      if (!errorMessage.includes('이미 사용 중인 매장코드') && 
          !errorMessage.includes('이미 사용 중인 사업자번호') &&
          !errorMessage.includes('이미 사용 중인 수탁코드') &&
          !errorMessage.includes('이미 사용 중인 종사업장번호')) {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
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

      {/* 알림 메시지 - 오류만 표시 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 회사 등록 폼 */}
      <form onSubmit={handleSubmit}>
        {/* 매장 정보 섹션 */}
        <Paper sx={{ 
          p: 3,
          mb: 3,
          borderRadius: 2,
          boxShadow: 'none',
          border: '1px solid #EEEEEE'
        }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#3A3A3A', mb: 2 }}>
            매장 정보
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
                  label="주소 *"
                  name="baseAddress"
                  value={baseAddress}
                  fullWidth
                  size="small"
                  required
                  error={!!errors.baseAddress}
                  helperText={errors.baseAddress}
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
                label="상세 주소 *"
                name="addressDetail"
                value={detailAddress}
                onChange={handleDetailAddressChange}
                fullWidth
                size="small"
                required
                error={!!errors.addressDetail}
                helperText={errors.addressDetail}
                placeholder="상세 주소를 입력하세요"
              />
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
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#3A3A3A', mb: 2 }}>
            수탁자 정보
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="수탁사업자명 *"
                name="trustee"
                value={companyData.trustee}
                onChange={handleChange}
                fullWidth
                size="small"
                required
                error={!!errors.trustee}
                helperText={errors.trustee}
                placeholder="예: 타이어 뱅크(본점)"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="수탁코드 *"
                name="trusteeCode"
                value={companyData.trusteeCode}
                onChange={handleChange}
                fullWidth
                size="small"
                required
                error={!!errors.trusteeCode}
                helperText={errors.trusteeCode}
                placeholder="예: 0001"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="사업자번호 *"
                name="businessNumber"
                value={companyData.businessNumber}
                onChange={handleBusinessNumberChange}
                fullWidth
                size="small"
                required
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
                label="종사업장번호 *"
                name="subBusinessNumber"
                value={companyData.subBusinessNumber}
                onChange={handleChange}
                fullWidth
                size="small"
                required
                error={!!errors.subBusinessNumber}
                helperText={errors.subBusinessNumber}
                placeholder="예: 0001"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="상호 *"
                name="companyName"
                value={companyData.companyName}
                onChange={handleChange}
                fullWidth
                size="small"
                required
                error={!!errors.companyName}
                helperText={errors.companyName}
                placeholder="예: 타이어 뱅크(본점)"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="대표자명 *"
                name="representativeName"
                value={companyData.representativeName}
                onChange={handleChange}
                fullWidth
                size="small"
                required
                error={!!errors.representativeName}
                helperText={errors.representativeName}
                placeholder="예: 대표자"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
                <DatePicker
                  label="계약 시작일자 *"
                  value={companyData.startDate}
                  onChange={(date) => handleDateChange('startDate', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      required: true,
                      error: !!errors.startDate,
                      helperText: errors.startDate
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
                <DatePicker
                  label="계약 종료일자 *"
                  value={companyData.endDate}
                  onChange={(date) => handleDateChange('endDate', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      required: true,
                      error: !!errors.endDate,
                      helperText: errors.endDate
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
                <DatePicker
                  label="하자보증증권 보험시작일자 *"
                  value={companyData.insuranceStartDate}
                  onChange={(date) => handleDateChange('insuranceStartDate', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      required: true,
                      error: !!errors.insuranceStartDate,
                      helperText: errors.insuranceStartDate
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
                <DatePicker
                  label="하자보증증권 보험종료일자 *"
                  value={companyData.insuranceEndDate}
                  onChange={(date) => handleDateChange('insuranceEndDate', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      required: true,
                      error: !!errors.insuranceEndDate,
                      helperText: errors.insuranceEndDate
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
        </Paper>
        
        {/* 연락처 정보 섹션 */}
        <Paper sx={{ 
          p: 3,
          mb: 3,
          borderRadius: 2,
          boxShadow: 'none',
          border: '1px solid #EEEEEE'
        }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#3A3A3A', mb: 2 }}>
            연락처 정보
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="담당자 *"
                name="managerName"
                value={companyData.managerName}
                onChange={handleChange}
                fullWidth
                size="small"
                required
                error={!!errors.managerName}
                helperText={errors.managerName}
                placeholder="예: 홍길동"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="이메일 *"
                name="email"
                type="email"
                value={companyData.email}
                onChange={handleChange}
                fullWidth
                size="small"
                required
                error={!!errors.email}
                helperText={errors.email}
                placeholder="예: example@example.com"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="담당자 전화번호 *"
                name="phoneNumber"
                value={companyData.phoneNumber}
                onChange={handlePhoneNumberChange}
                fullWidth
                size="small"
                required
                error={!!errors.phoneNumber}
                helperText={errors.phoneNumber}
                placeholder="예: 010-1234-5678"
                inputProps={{
                  maxLength: 13 // 000-0000-0000 형식의 최대 길이
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="매장 전화번호 *"
                name="storeTelNumber"
                value={companyData.storeTelNumber}
                onChange={handleStoreTelNumberChange}
                fullWidth
                size="small"
                required
                error={!!errors.storeTelNumber}
                helperText={errors.storeTelNumber}
                placeholder="예: 055-123-4567"
                inputProps={{
                  maxLength: 13 // 000-000-0000 형식의 최대 길이
                }}
              />
            </Grid>
          </Grid>
        </Paper>
        
        {/* 사업 정보 섹션 */}
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
        </Paper>
        
        {/* 이미지 업로드 섹션 */}
        <Paper sx={{ 
          p: 3,
          mb: 3,
          borderRadius: 2,
          boxShadow: 'none',
          border: '1px solid #EEEEEE'
        }}>
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
        </Paper>
        
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
      
      {/* 주소 검색 다이얼로그 */}
      <Dialog open={addressDialogOpen} onClose={handleCloseAddressDialog} maxWidth="sm" fullWidth>
        <DialogTitle>주소 검색</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 , mt:2}}>
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
      
      {/* 스낵바 알림 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CompanyCreate; 