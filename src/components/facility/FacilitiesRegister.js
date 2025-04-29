import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField,
  Button,
  FormControl,
  Select,
  MenuItem,
  Grid,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
  AddPhotoAlternate as AddPhotoAlternateIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const FacilitiesRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // 코드 테이블 데이터
  const [brands, setBrands] = useState([]);
  const [facilityTypes, setFacilityTypes] = useState([]);
  const [installationTypes, setInstallationTypes] = useState([]);
  const [statusCodes, setStatusCodes] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [depreciationMethods, setDepreciationMethods] = useState([]);
  const [headquarters, setHeadquarters] = useState({ id: 1, companyName: '본사' });
  
  // 오늘 날짜를 YYYY-MM-DD 형식으로 가져오기
  const today = new Date().toISOString().split('T')[0];
  
  // 폼 데이터
  const [formData, setFormData] = useState({
    brandCode: '',            // 제조사 코드
    facilityTypeCode: '',     // 시설물 항목 코드
    serialNumber: '',         // 시리얼 번호 (백엔드에서 자동 생성)
    installationDate: today,  // 설치일, 기본값으로 오늘 날짜 설정
    acquisitionCost: '',      // 취득가액
    installationTypeCode: '', // 설치 유형 (선택적)
    usefulLifeMonths: 12,     // 사용연한(개월)
    statusCode: '',           // 상태코드
    depreciationMethodCode: '',// 감가상각 방법 (선택적)
    locationCompanyId: 1,     // 설치 매장 ID (본사로 고정, 항상 1)
    ownerCompanyId: 1,        // 소유 매장 ID (본점 소유, 항상 1)
    quantity: 1               // 수량 (배치 등록용)
  });
  
  // 사용연한 년 단위 입력 상태 (UI 표시용)
  const [usefulLifeYears, setUsefulLifeYears] = useState('1');
  
  // 이미지 상태
  const [images, setImages] = useState({
    front: null,
    back: null,
    left: null,
    right: null,
    tag: null
  });
  
  // 알림 상태
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // 코드 테이블 데이터 조회
  useEffect(() => {
    const fetchCodes = async () => {
      try {
        // 시설물 유형 코드 조회
        const facilityTypeResponse = await fetch('http://localhost:8080/api/codes/groups/002001/codes/active', {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        });
        if (facilityTypeResponse.ok) {
          const data = await facilityTypeResponse.json();
          setFacilityTypes(data);
        }

        // 설치 유형 코드 조회
        const installationTypeResponse = await fetch('http://localhost:8080/api/codes/groups/002002/codes/active', {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        });
        if (installationTypeResponse.ok) {
          const data = await installationTypeResponse.json();
          setInstallationTypes(data);
        }

        // 상태 코드 조회
        const statusResponse = await fetch('http://localhost:8080/api/codes/groups/002003/codes/active', {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        });
        if (statusResponse.ok) {
          const data = await statusResponse.json();
          setStatusCodes(data);
          
          // 기본 상태 코드 설정 (첫 번째 항목)
          if (data.length > 0) {
            setFormData(prev => ({
              ...prev,
              statusCode: data[0].codeId
            }));
          }
        }
        
        // 감가상각 방법 코드 조회
        const depreciationMethodResponse = await fetch('http://localhost:8080/api/codes/groups/002004/codes/active', {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        });
        if (depreciationMethodResponse.ok) {
          const data = await depreciationMethodResponse.json();
          setDepreciationMethods(data);
        }
      } catch (error) {
        console.error('코드 목록 조회 실패:', error);
        showSnackbar('코드 목록을 불러오는데 실패했습니다.', 'error');
      }
    };

    fetchCodes();
  }, []);
  
  // 회사 목록 조회
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/companies', {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setCompanies(data);
          
          // 본사 정보 찾기 (ID가 1인 회사)
          const hq = data.find(company => company.id === 1);
          if (hq) {
            setHeadquarters(hq);
          }
        }
      } catch (error) {
        console.error('회사 목록 조회 실패:', error);
        showSnackbar('회사 목록을 불러오는데 실패했습니다.', 'error');
      }
    };

    fetchCompanies();
  }, []);
  
  // 시설물 유형이 변경될 때 해당 유형에 맞는 브랜드 목록 조회
  const fetchBrandsForFacilityType = async (facilityTypeCode) => {
    if (!facilityTypeCode) {
      setBrands([]);
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:8080/api/facilities/facility-type/${facilityTypeCode}/brands`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBrands(data);
      } else {
        throw new Error('브랜드 목록 조회 실패');
      }
    } catch (error) {
      console.error('브랜드 목록 조회 실패:', error);
      showSnackbar('브랜드 목록을 불러오는데 실패했습니다.', 'error');
      setBrands([]);
    }
  };
  
  // 이벤트 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // 시설물 유형이 변경된 경우 해당 유형에 맞는 브랜드 조회
    if (name === 'facilityTypeCode') {
      // 시설물 유형이 변경되면 브랜드 초기화
      setFormData(prev => ({
        ...prev,
        [name]: value,
        brandCode: '' // 브랜드 선택 초기화
      }));
      
      // 새로운 시설물 유형에 맞는 브랜드 목록 조회
      fetchBrandsForFacilityType(value);
    } else {
      // 다른 필드 변경 시 일반 처리
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // 회사 선택 이벤트 핸들러
  const handleCompanyChange = (e) => {
    const companyId = parseInt(e.target.value, 10);
    
    // 선택된 회사 찾기
    const selectedCompany = companies.find(company => company.id === companyId);
    
    if (selectedCompany) {
      setFormData(prev => ({
        ...prev,
        locationCompanyId: companyId
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        locationCompanyId: ''
      }));
    }
  };
  
  // 숫자 입력 유효성 검사 및 포맷팅 함수
  const formatNumberWithCommas = (value) => {
    if (!value) return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    
    // 숫자만 허용
    const numericValue = value.replace(/[^0-9]/g, '');
    
    // 필드별 최대 길이 제한
    let limitedValue = numericValue;
    if (name === 'acquisitionCost' && numericValue.length > 30) {
      limitedValue = numericValue.slice(0, 30);
    }
    
    // 수량의 경우 1~100 사이로 제한
    if (name === 'quantity') {
      if (numericValue === '') {
        limitedValue = '1';
      } else {
        const num = parseInt(numericValue, 10);
        if (num < 1) limitedValue = '1';
        if (num > 100) limitedValue = '100';
      }
    }
    
    // 취득가액의 경우 콤마 포맷팅 적용
    if (name === 'acquisitionCost') {
      setFormData(prev => ({
        ...prev,
        [name]: limitedValue // 내부적으로는 숫자만 저장
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: limitedValue === '' ? '' : Number(limitedValue)
      }));
    }
  };
  
  // 사용연한 년 단위 입력 처리
  const handleUsefulLifeYearsChange = (e) => {
    const { value } = e.target;
    
    // 숫자만 허용
    const numericValue = value.replace(/[^0-9]/g, '');
    
    // 최대 100년으로 제한
    if (numericValue === '' || (Number(numericValue) <= 100 && numericValue.length <= 3)) {
      setUsefulLifeYears(numericValue);
      
      // 년수에 12를 곱해 개월수로 변환하여 저장
      const months = numericValue === '' ? 0 : Number(numericValue) * 12;
      setFormData(prev => ({
        ...prev,
        usefulLifeMonths: months
      }));
    }
  };
  
  // 취득가액의 표시용 값
  const formattedAcquisitionCost = formatNumberWithCommas(formData.acquisitionCost);
  
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

  const handleImageUpload = (position) => (event) => {
    const file = event.target.files[0];
    
    if (file) {
      // 파일 크기 체크 (10MB 제한)
      if (file.size > 10 * 1024 * 1024) {
        showSnackbar('이미지 크기는 10MB를 초과할 수 없습니다.', 'warning');
        return;
      }
      
      // 파일 형식 체크
      if (!file.type.match('image/jpeg') && !file.type.match('image/png') && !file.type.match('image/jpg')) {
        showSnackbar('JPG, JPEG 또는 PNG 형식만 업로드 가능합니다.', 'warning');
        return;
      }
      
      setImages(prev => ({
        ...prev,
        [position]: {
          file,
          preview: URL.createObjectURL(file),
          imageTypeCode: getImageTypeCodeByPosition(position)
        }
      }));
    }
  };
  
  // 위치에 따른 이미지 유형 코드 반환
  const getImageTypeCodeByPosition = (position) => {
    // 실제 API에서 사용하는 이미지 유형 코드로 수정
    const imageTypeCodes = {
      front: '002005_0001',  // 정면 사진
      back: '002005_0002',   // 후면 사진
      left: '002005_0003',   // 측면 사진(좌)
      right: '002005_0004',  // 측면 사진(우)
    };
    
    return imageTypeCodes[position] || '002005_0001';
  };

  const handleRemoveImage = (position) => {
    // 기존 이미지 URL 객체 정리
    if (images[position]?.preview) {
      URL.revokeObjectURL(images[position].preview);
    }
    
    setImages(prev => ({
      ...prev,
      [position]: null
    }));
  };
  
  // 폼 제출 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 날짜 형식 변환 (LocalDateTime 형식으로)
      const formattedInstallationDate = formData.installationDate 
        ? `${formData.installationDate}T00:00:00` 
        : null;
      
      // 배치 API용 데이터 준비
      const submitData = {
        brandCode: formData.brandCode,
        facilityTypeCode: formData.facilityTypeCode,
        installationDate: formattedInstallationDate,
        acquisitionCost: formData.acquisitionCost,
        installationTypeCode: formData.installationTypeCode || null,
        usefulLifeMonths: formData.usefulLifeMonths,
        statusCode: formData.statusCode,
        depreciationMethodCode: formData.depreciationMethodCode || null,
        locationCompanyId: formData.locationCompanyId,
        ownerCompanyId: 1, // 본점 소유, 항상 1
        quantity: formData.quantity // 배치 등록용 수량
      };
      
      // 배치 API로 시설물 등록
      const facilityResponse = await fetch('http://localhost:8080/api/facilities/batch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      if (!facilityResponse.ok) {
        throw new Error('시설물 등록에 실패했습니다.');
      }

      const facilityResults = await facilityResponse.json();
      
      // 배치 생성 결과가 배열로 반환되므로, 첫 번째 시설물에만 이미지를 업로드
      if (facilityResults.length > 0) {
        const facilityId = facilityResults[0].facilityId;
        
        // 2. 이미지 업로드 (첫 번째 시설물에만 적용)
        const imageUploadPromises = Object.values(images)
          .filter(image => image !== null)
          .map(async (imageData) => {
            const imageFormData = new FormData();
            imageFormData.append('file', imageData.file);
            imageFormData.append('imageTypeCode', imageData.imageTypeCode);
            imageFormData.append('uploadBy', sessionStorage.getItem('userId') || '');

            return fetch(`http://localhost:8080/api/facility-images/facility/${facilityId}`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
              },
              body: imageFormData
            });
          });
        
        // 이미지가 있는 경우에만 업로드 실행
        if (imageUploadPromises.length > 0) {
          await Promise.all(imageUploadPromises);
        }
      }
      
      showSnackbar(`시설물 ${formData.quantity}개가 성공적으로 등록되었습니다.`, 'success');
      
      // 등록 후 리스트 화면으로 바로 이동
      navigate('/facility-list');
      
    } catch (error) {
      console.error('시설물 등록 중 오류 발생:', error);
      showSnackbar('시설물 등록에 실패했습니다: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const ImageUploadBox = ({ position, title }) => (
    <Grid item xs={12} sm={6} md={3}>
      <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
        {title}
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
          onChange={handleImageUpload(position)}
          style={{ display: 'none' }}
          id={`image-upload-${position}`}
        />
        {images[position] ? (
          <>
            <img 
              src={images[position].preview}
              alt={`${title} 이미지`}
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
              onClick={() => handleRemoveImage(position)}
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
              <CloseIcon fontSize="small" />
            </IconButton>
          </>
        ) : (
          <label htmlFor={`image-upload-${position}`} style={{ cursor: 'pointer' }}>
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
              <AddPhotoAlternateIcon sx={{ color: '#9E9E9E', fontSize: 32 }} />
              <Typography variant="caption" sx={{ color: '#9E9E9E' }}>
                클릭하여 업로드
              </Typography>
            </Box>
          </label>
        )}
      </Box>
    </Grid>
  );

  return (
    <Box sx={{ p: 3, backgroundColor: '#F8F8FE', minHeight: '100vh' }}>
      {/* 상단 헤더 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#3A3A3A' }}>
          시설물 등록
        </Typography>
      </Box>

      {/* 메인 컨텐츠 영역 */}
      <Box sx={{ 
        backgroundColor: 'white',
        borderRadius: 2,
        border: '1px solid #EEEEEE',
        p: 3,
        mb: 3
      }}>
        <form onSubmit={handleSubmit}>
          {/* 기본 정보 섹션 */}
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 600, 
                color: '#3A3A3A',
                mb: 2 
              }}
            >
              기본 정보
            </Typography>

            <Box sx={{ 
              backgroundColor: '#F8F9FA',
              borderRadius: 2,
              border: '1px solid #EEEEEE',
              p: 3
            }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
                    시설물 구분
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      displayEmpty
                      name="facilityTypeCode"
                      value={formData.facilityTypeCode}
                      onChange={handleChange}
                      sx={{
                        backgroundColor: '#F8F9FA',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#E0E0E0',
                        },
                      }}
                    >
                      <MenuItem value="">선택</MenuItem>
                      {facilityTypes.map((type) => (
                        <MenuItem key={type.codeId} value={type.codeId}>
                          {type.codeName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
                    제조사
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      displayEmpty
                      name="brandCode"
                      value={formData.brandCode}
                      onChange={handleChange}
                      sx={{
                        backgroundColor: '#F8F9FA',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#E0E0E0',
                        },
                      }}
                    >
                      <MenuItem value="">선택</MenuItem>
                      {brands.map((brand) => (
                        <MenuItem key={brand.codeId} value={brand.codeId}>
                          {brand.codeName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
                    수량
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="text"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleNumberChange}
                    placeholder="수량 입력"
                    sx={{ 
                      backgroundColor: '#F8F9FA',
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#E0E0E0',
                        },
                      },
                    }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">개</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
                    취득가액
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="text"
                    name="acquisitionCost"
                    value={formattedAcquisitionCost}
                    onChange={handleNumberChange}
                    placeholder="취득가액 입력 (원)"
                    sx={{ 
                      backgroundColor: '#F8F9FA',
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#E0E0E0',
                        },
                      },
                    }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">원</InputAdornment>,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
                    감가상각 방법
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      displayEmpty
                      name="depreciationMethodCode"
                      value={formData.depreciationMethodCode}
                      onChange={handleChange}
                      sx={{
                        backgroundColor: '#F8F9FA',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#E0E0E0',
                        },
                      }}
                    >
                      <MenuItem value="">선택</MenuItem>
                      {depreciationMethods.map((method) => (
                        <MenuItem key={method.codeId} value={method.codeId}>
                          {method.codeName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
                    사용연한
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="text"
                    name="usefulLifeYears"
                    value={usefulLifeYears}
                    onChange={handleUsefulLifeYearsChange}
                    placeholder="사용연한 입력 (년)"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#e0e0e0',
                        },
                        '&:hover fieldset': {
                          borderColor: '#blue',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main',
                        },
                      },
                    }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">년</InputAdornment>,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
                    상태
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      displayEmpty
                      name="statusCode"
                      value={formData.statusCode}
                      onChange={handleChange}
                      sx={{
                        backgroundColor: '#F8F9FA',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#E0E0E0',
                        },
                      }}
                    >
                      <MenuItem value="">선택</MenuItem>
                      {statusCodes.map((status) => (
                        <MenuItem key={status.codeId} value={status.codeId}>
                          {status.codeName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </Box>

          {/* 위치 및 설치정보 섹션 */}
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 600, 
                color: '#3A3A3A',
                mb: 2 
              }}
            >
              위치 및 설치정보
            </Typography>

            <Box sx={{ 
              backgroundColor: '#F8F9FA',
              borderRadius: 2,
              border: '1px solid #EEEEEE',
              p: 3
            }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
                    설치 매장
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={headquarters.companyName}
                    disabled
                    sx={{
                      backgroundColor: '#F8F9FA',
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#E0E0E0',
                        },
                      },
                      '& .Mui-disabled': {
                        backgroundColor: '#F0F0F0',
                        color: '#666'
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
                    설치일
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    name="installationDate"
                    value={formData.installationDate}
                    onChange={handleChange}
                    sx={{ 
                      backgroundColor: '#F8F9FA',
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#E0E0E0',
                        },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
                    설치 유형
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      displayEmpty
                      name="installationTypeCode"
                      value={formData.installationTypeCode}
                      onChange={handleChange}
                      sx={{
                        backgroundColor: '#F8F9FA',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#E0E0E0',
                        },
                      }}
                    >
                      <MenuItem value="">선택</MenuItem>
                      {installationTypes.map((type) => (
                        <MenuItem key={type.codeId} value={type.codeId}>
                          {type.codeName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </Box>

          {/* 이미지 등록 섹션 */}
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 600, 
                color: '#3A3A3A',
                mb: 2 
              }}
            >
              이미지 등록 (최대 10MB)
            </Typography>

            <Box sx={{ 
              backgroundColor: '#F8F9FA',
              borderRadius: 2,
              border: '1px solid #EEEEEE',
              p: 3
            }}>
              <Grid container spacing={2}>
                <ImageUploadBox position="front" title="정면 사진" />
                <ImageUploadBox position="back" title="후면 사진" />
                <ImageUploadBox position="left" title="측면 사진(좌)" />
                <ImageUploadBox position="right" title="측면 사진(우)" />
              </Grid>
            </Box>
          </Box>
          
          {/* 하단 버튼 */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
            <Button
              type="button"
              variant="outlined"
              disabled={loading}
              onClick={() => navigate('/facility-list')}
              sx={{
                borderColor: '#E0E0E0',
                color: '#666',
                px: 4,
                py: 1,
                '&:hover': {
                  backgroundColor: '#F8F9FA',
                  borderColor: '#E0E0E0',
                },
              }}
            >
              취소
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                px: 4,
                py: 1,
                backgroundColor: '#1976d2',
                '&:hover': {
                  backgroundColor: '#1565c0',
                },
              }}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                  등록 중...
                </>
              ) : '등록'}
            </Button>
          </Box>
        </form>
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
    </Box>
  );
};

export default FacilitiesRegister; 