import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField,
  Button,
  FormControl,
  FormHelperText,
  Select,
  MenuItem,
  Grid,
  Paper,
  InputLabel,
  Autocomplete,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
  Divider
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';

const ServiceRequestCreate = () => {
  const navigate = useNavigate();
  const { facilityId } = useParams();
  const [loading, setLoading] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [facility, setFacility] = useState(null);
  const [facilitiesOptions, setFacilitiesOptions] = useState([]);
  const [searchText, setSearchText] = useState('');

  // AS 관련 코드 데이터
  const [serviceTypes, setServiceTypes] = useState([]);
  const [priorityCodes, setPriorityCodes] = useState([]);
  
  // 폼 데이터
  const [formData, setFormData] = useState({
    facilityId: '',
    requestDate: format(new Date(), 'yyyy-MM-dd'),
    requestHour: '09', // 기본값 9시로 설정
    requestContent: '',
    serviceTypeCode: '',
    priorityCode: '',
    description: ''
  });
  
  // 폼 유효성 검증
  const [formErrors, setFormErrors] = useState({
    facilityId: '',
    requestContent: '',
    serviceTypeCode: '',
    priorityCode: ''
  });
  
  // 알림 스낵바
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // 코드 데이터 로드
  useEffect(() => {
    const fetchCodes = async () => {
      try {
        // AS 유형 코드 조회
        const serviceTypeResponse = await fetch('http://localhost:8080/api/codes/groups/002006/codes/active', {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        });
        if (serviceTypeResponse.ok) {
          const data = await serviceTypeResponse.json();
          setServiceTypes(data);
        }
        
        // 우선순위 코드 조회
        const priorityResponse = await fetch('http://localhost:8080/api/codes/groups/002007/codes/active', {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        });
        if (priorityResponse.ok) {
          const data = await priorityResponse.json();
          setPriorityCodes(data);
        }
      } catch (error) {
        console.error('코드 조회 에러:', error);
        showSnackbar('코드 데이터 로딩 중 오류가 발생했습니다.', 'error');
      }
    };
    
    fetchCodes();
  }, []);
  
  // URL에서 facilityId가 넘어온 경우 해당 시설물 정보 가져오기
  useEffect(() => {
    if (facilityId) {
      fetchFacilityById(facilityId);
    }
  }, [facilityId]);
  
  // 시설물 조회 함수
  const fetchFacilityById = async (id) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/facilities/${id}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('시설물 정보를 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setFacility(data);
      setFormData(prev => ({
        ...prev,
        facilityId: data.facilityId
      }));
    } catch (error) {
      console.error('시설물 조회 실패:', error);
      showSnackbar('시설물 정보를 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // 시설물 검색
  useEffect(() => {
    if (searchText.length >= 2) {
      const delaySearch = setTimeout(() => {
        searchFacilities(searchText);
      }, 500);
      
      return () => clearTimeout(delaySearch);
    }
  }, [searchText]);
  
  const searchFacilities = async (keyword) => {
    if (!keyword || keyword.length < 2) return;
    
    try {
      const response = await fetch(`http://localhost:8080/api/facilities/search?keyword=${encodeURIComponent(keyword)}&size=10`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('시설물 검색에 실패했습니다.');
      }
      
      const data = await response.json();
      setFacilitiesOptions(data.content || []);
    } catch (error) {
      console.error('시설물 검색 실패:', error);
    }
  };
  
  // 폼 입력값 변경 처리
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 에러 초기화
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // 시설물 선택 처리
  const handleFacilitySelect = (event, facility) => {
    if (facility) {
      setFacility(facility);
      setFormData(prev => ({
        ...prev,
        facilityId: facility.facilityId
      }));
      
      // 에러 초기화
      setFormErrors(prev => ({
        ...prev,
        facilityId: ''
      }));
    } else {
      setFacility(null);
      setFormData(prev => ({
        ...prev,
        facilityId: ''
      }));
    }
  };
  
  // 폼 유효성 검증
  const validateForm = () => {
    const errors = {
      facilityId: !formData.facilityId ? '시설물을 선택해주세요.' : '',
      requestContent: !formData.requestContent ? 'AS 요청 내용을 입력해주세요.' : '',
      serviceTypeCode: !formData.serviceTypeCode ? 'AS 유형을 선택해주세요.' : '',
      priorityCode: !formData.priorityCode ? '우선순위를 선택해주세요.' : ''
    };
    
    setFormErrors(errors);
    return !Object.values(errors).some(error => error);
  };
  
  // 폼 제출 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showSnackbar('필수 항목을 모두 입력해주세요.', 'error');
      return;
    }
    
    setFormSubmitting(true);
    
    try {
      // 날짜와 시간을 결합하여 ISO 형식의 문자열로 변환 (분과 초는 00으로 고정)
      const formattedDateTime = `${formData.requestDate}T${formData.requestHour}:00:00`;
      
      const requestData = {
        facilityId: parseInt(formData.facilityId),
        requestDate: formattedDateTime,
        requestContent: formData.requestContent,
        serviceTypeCode: formData.serviceTypeCode,
        priorityCode: formData.priorityCode,
        description: formData.description || null
      };
      
      const response = await fetch('http://localhost:8080/api/service-requests', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        throw new Error('AS 접수 등록에 실패했습니다.');
      }
      
      const result = await response.json();
      showSnackbar('AS 접수가 성공적으로 등록되었습니다.', 'success');
      
      // 성공 후 목록 페이지로 이동
      setTimeout(() => {
        navigate('/service-request/list');
      }, 1500);
    } catch (error) {
      console.error('AS 접수 등록 실패:', error);
      showSnackbar('AS 접수 등록에 실패했습니다.', 'error');
    } finally {
      setFormSubmitting(false);
    }
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
  
  return (
    <Box sx={{ p: 3, backgroundColor: '#F8F8FE', minHeight: '100vh' }}>
      {/* 상단 제목 */}
      <Typography variant="h6" sx={{ fontWeight: 600, color: '#3A3A3A', mb: 3 }}>
        AS 접수
      </Typography>
      
      {/* 메인 폼 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSubmit}>
          {/* 시설물 정보 섹션 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#3A3A3A', mb: 2 }}>
              시설물 정보
            </Typography>
            
            <Grid container spacing={2}>
              {facilityId ? (
                /* 시설물 ID가 URL에서 넘어온 경우 - 시설물 정보 표시 */
                loading ? (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  </Grid>
                ) : facility ? (
                  <>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" sx={{ mb: 1, color: '#666' }}>
                        시설물 유형
                      </Typography>
                      <Typography variant="body1">
                        {facility.facilityTypeName}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" sx={{ mb: 1, color: '#666' }}>
                        제조사/품목
                      </Typography>
                      <Typography variant="body1">
                        {facility.brandName} / {facility.modelNumber}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" sx={{ mb: 1, color: '#666' }}>
                        관리 번호
                      </Typography>
                      <Typography variant="body1">
                        {facility.managementNumber}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" sx={{ mb: 1, color: '#666' }}>
                        설치 위치
                      </Typography>
                      <Typography variant="body1">
                        {facility.locationAddress}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" sx={{ mb: 1, color: '#666' }}>
                        설치 지점
                      </Typography>
                      <Typography variant="body1">
                        {facility.locationStoreName}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" sx={{ mb: 1, color: '#666' }}>
                        현재 상태
                      </Typography>
                      <Chip 
                        label={facility.statusName}
                        color={
                          facility.statusCode === '002003_0001' ? 'success' : 
                          facility.statusCode === '002003_0002' ? 'error' :
                          facility.statusCode === '002003_0003' ? 'warning' :
                          facility.statusCode === '002003_0004' ? 'info' :
                          facility.statusCode === '002003_0006' ? 'success' : 'default'
                        }
                        size="small"
                      />
                    </Grid>
                  </>
                ) : (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="error">
                      시설물 정보를 찾을 수 없습니다.
                    </Typography>
                  </Grid>
                )
              ) : (
                /* 시설물 ID가 없는 경우 - 시설물 검색 필드 */
                <Grid item xs={12}>
                  <InputLabel htmlFor="facility-search" sx={{ mb: 1, color: '#666' }}>
                    시설물 검색 (필수)
                  </InputLabel>
                  <Autocomplete
                    id="facility-search"
                    options={facilitiesOptions}
                    getOptionLabel={(option) => 
                      `${option.facilityTypeName} - ${option.brandName} ${option.modelNumber} (${option.storeName})`
                    }
                    onChange={handleFacilitySelect}
                    onInputChange={(e, value) => setSearchText(value)}
                    isOptionEqualToValue={(option, value) => option.facilityId === value.facilityId}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="시설물 유형, 제조사, 품목 검색 (2글자 이상)"
                        size="small"
                        fullWidth
                        error={!!formErrors.facilityId}
                        helperText={formErrors.facilityId}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {searchText.length >= 2 && <CircularProgress size={20} sx={{ mr: 1 }} />}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <li {...props}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {option.facilityTypeName} - {option.brandName} {option.modelNumber}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {option.storeName} ({option.currentLocation})
                          </Typography>
                        </Box>
                      </li>
                    )}
                  />
                </Grid>
              )}
              
              {facility && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>
              )}
            </Grid>
          </Box>
          
          {/* AS 접수 정보 섹션 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#3A3A3A', mb: 2 }}>
              AS 접수 정보
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Grid container spacing={1}>
                  <Grid item xs={8}>
                    <InputLabel htmlFor="requestDate" sx={{ mb: 1, color: '#666' }}>
                      접수일자
                    </InputLabel>
                    <TextField
                      id="requestDate"
                      name="requestDate"
                      type="date"
                      value={formData.requestDate}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: '#E0E0E0',
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <InputLabel htmlFor="requestHour" sx={{ mb: 1, color: '#666' }}>
                      시간
                    </InputLabel>
                    <FormControl fullWidth size="small">
                      <Select
                        id="requestHour"
                        name="requestHour"
                        value={formData.requestHour}
                        onChange={handleChange}
                        displayEmpty
                        sx={{
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#E0E0E0',
                          },
                        }}
                      >
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, '0');
                          return (
                            <MenuItem key={hour} value={hour}>
                              {hour}시
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <InputLabel htmlFor="serviceTypeCode" sx={{ mb: 1, color: '#666' }}>
                  AS 유형 (필수)
                </InputLabel>
                <FormControl fullWidth size="small" error={!!formErrors.serviceTypeCode}>
                  <Select
                    id="serviceTypeCode"
                    name="serviceTypeCode"
                    value={formData.serviceTypeCode}
                    onChange={handleChange}
                    displayEmpty
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#E0E0E0',
                      },
                    }}
                  >
                    <MenuItem value="" disabled>AS 유형 선택</MenuItem>
                    {serviceTypes.map((type) => (
                      <MenuItem key={type.codeId} value={type.codeId}>
                        {type.codeName}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.serviceTypeCode && (
                    <FormHelperText>{formErrors.serviceTypeCode}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <InputLabel htmlFor="priorityCode" sx={{ mb: 1, color: '#666' }}>
                  우선순위 (필수)
                </InputLabel>
                <FormControl fullWidth size="small" error={!!formErrors.priorityCode}>
                  <Select
                    id="priorityCode"
                    name="priorityCode"
                    value={formData.priorityCode}
                    onChange={handleChange}
                    displayEmpty
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#E0E0E0',
                      },
                    }}
                  >
                    <MenuItem value="" disabled>우선순위 선택</MenuItem>
                    {priorityCodes.map((priority) => (
                      <MenuItem key={priority.codeId} value={priority.codeId}>
                        {priority.codeName}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.priorityCode && (
                    <FormHelperText>{formErrors.priorityCode}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <InputLabel htmlFor="requestContent" sx={{ mb: 1, color: '#666' }}>
                  AS 요청 내용 (필수)
                </InputLabel>
                <TextField
                  id="requestContent"
                  name="requestContent"
                  value={formData.requestContent}
                  onChange={handleChange}
                  multiline
                  rows={4}
                  fullWidth
                  placeholder="AS 요청 내용을 입력해주세요 (고장 증상, 문제 상황 등)"
                  error={!!formErrors.requestContent}
                  helperText={formErrors.requestContent}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#E0E0E0',
                      },
                    },
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <InputLabel htmlFor="description" sx={{ mb: 1, color: '#666' }}>
                  비고 (선택)
                </InputLabel>
                <TextField
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  multiline
                  rows={2}
                  fullWidth
                  placeholder="추가 정보가 있으면 입력해주세요"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#E0E0E0',
                      },
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>
          
          {/* 버튼 영역 */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
              sx={{
                minWidth: 120,
                borderColor: '#E0E0E0',
                color: '#666',
                '&:hover': {
                  borderColor: '#BDBDBD',
                  bgcolor: '#F5F5F5',
                }
              }}
            >
              취소
            </Button>
            
            <Button
              type="submit"
              variant="contained"
              disabled={formSubmitting}
              sx={{
                minWidth: 120,
                bgcolor: '#1976d2',
                '&:hover': {
                  bgcolor: '#1565c0',
                }
              }}
            >
              {formSubmitting ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                'AS 접수하기'
              )}
            </Button>
          </Box>
        </form>
      </Paper>
      
      {/* 알림 스낵바 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ServiceRequestCreate; 