import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField,
  InputAdornment,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Snackbar,
  Alert,
  Pagination,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Divider,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

// 날짜 범위 캘린더 컴포넌트 import
import DateRangeCalendar, { DateRangeButton } from '../calendar/Calendar';

// 시설물 상태 코드 맵핑
const statusColorMap = {
  '002003_0001': 'success', // 사용중 (정상)
  '002003_0002': 'error',   // 고장
  '002003_0003': 'warning', // 수리중
  '002003_0004': 'info',    // AS 접수중
  '002003_0006': 'success'  // AS 완료
};

const FacilityTypeList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [facilityTypes, setFacilityTypes] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedTypeCode, setSelectedTypeCode] = useState('');
  const [selectedTypeName, setSelectedTypeName] = useState('');
  const [facilities, setFacilities] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [facilitiesLoading, setFacilitiesLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [facilityCounts, setFacilityCounts] = useState({});
  const [totalCountsLoading, setTotalCountsLoading] = useState(false);
  const [isActiveFilter, setIsActiveFilter] = useState(true);
  
  // 설치일자 필터 상태
  const [installationStartDate, setInstallationStartDate] = useState(null);
  const [installationEndDate, setInstallationEndDate] = useState(null);
  const [isInstallationDateFilterActive, setIsInstallationDateFilterActive] = useState(false);
  const [showInstallationDatePicker, setShowInstallationDatePicker] = useState(false);
  
  const baseUrl = 'http://localhost:8080';

  // 알림 상태
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // 초기 데이터 로딩
  useEffect(() => {
    fetchFacilityTypes();
    fetchFacilityCountsByType();
  }, []);

  // 검색어 변경 시 자동 검색 실행
  useEffect(() => {
    if (selectedTypeCode) {
      // 검색어가 변경될 때마다 자동으로 검색 실행
      fetchFacilities({
        facilityTypeCode: selectedTypeCode,
        isActive: isActiveFilter,
        search: searchKeyword || undefined,
        installationStartDate: isInstallationDateFilterActive && installationStartDate ? 
          format(installationStartDate, 'yyyy-MM-dd\'T\'00:00:00') : undefined,
        installationEndDate: isInstallationDateFilterActive && installationEndDate ? 
          format(installationEndDate, 'yyyy-MM-dd\'T\'23:59:59') : undefined,
        page: 0 // 검색 시 첫 페이지부터 로드
      });
    }
  }, [searchKeyword, isInstallationDateFilterActive, installationStartDate, installationEndDate]); // 설치일자 필터도 의존성에 추가

  // 시설물 유형 코드 조회
  const fetchFacilityTypes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/codes/groups/002001/codes/active`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('시설물 유형 코드를 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      // sortOrder 기준으로 정렬
      const sortedData = data.sort((a, b) => a.sortOrder - b.sortOrder);
      setFacilityTypes(sortedData);
    } catch (error) {
      console.error('시설물 유형 코드 조회 실패:', error);
      showSnackbar('시설물 유형 코드를 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 시설물 유형별 총 수량 조회
  const fetchFacilityCountsByType = async () => {
    setTotalCountsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/facilities/counts-by-type`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('시설물 유형별 수량을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setFacilityCounts(data);
    } catch (error) {
      console.error('시설물 유형별 수량 조회 실패:', error);
      showSnackbar('시설물 유형별 수량을 불러오는데 실패했습니다.', 'error');
    } finally {
      setTotalCountsLoading(false);
    }
  };

  // 시설물 목록 조회 (페이징 및 필터링 적용)
  const fetchFacilities = async (params = {}) => {
    setFacilitiesLoading(true);
    
    try {
      // 기본 파라미터 설정
      const defaultParams = {
        page: page,
        size: pageSize,
        sortBy: 'createdAt',
        sortDir: 'DESC'
      };
      
      // 기본 파라미터와 전달받은 파라미터 병합
      const queryParams = { ...defaultParams, ...params };
      
      // URL 파라미터 생성
      const urlParams = new URLSearchParams();
      
      // 파라미터 추가
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] !== undefined && queryParams[key] !== null) {
          urlParams.append(key, queryParams[key].toString());
        }
      });
      
      const url = `${baseUrl}/api/facilities?${urlParams.toString()}`;
      console.log('요청 URL:', url); // 디버깅용
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('시설물 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      console.log('응답 데이터:', data); // 디버깅용
      
      setFacilities(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.totalElements || 0);
      setPage(queryParams.page); // 현재 페이지 업데이트
    } catch (error) {
      console.error('시설물 목록 조회 실패:', error);
      showSnackbar('시설물 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
      setFacilitiesLoading(false);
    }
  };

  // 시설물 유형 선택 핸들러
  const handleTypeChange = async (event) => {
    const typeCode = event.target.value;
    setSelectedTypeCode(typeCode);
    
    if (typeCode) {
      const selectedType = facilityTypes.find(type => type.codeId === typeCode);
      setSelectedTypeName(selectedType ? selectedType.codeName : '');
      
      // 시설물 유형이 선택되면 해당 유형의 첫 페이지 데이터 로드
      fetchFacilities({
        facilityTypeCode: typeCode,
        isActive: isActiveFilter,
        search: searchKeyword || undefined,
        installationStartDate: isInstallationDateFilterActive && installationStartDate ? 
          format(installationStartDate, 'yyyy-MM-dd\'T\'00:00:00') : undefined,
        installationEndDate: isInstallationDateFilterActive && installationEndDate ? 
          format(installationEndDate, 'yyyy-MM-dd\'T\'23:59:59') : undefined,
        page: 0 // 첫 페이지부터 로드
      });
    } else {
      setSelectedTypeName('');
      setFacilities([]);
      setTotalItems(0);
      setTotalPages(1);
    }
    
    // 검색어와 설치일자 필터 초기화
    setSearchKeyword('');
    handleResetInstallationDateFilter();
  };

  // 활성화 상태 필터 변경 핸들러
  const handleActiveFilterChange = async (isActive) => {
    // 상태 변경
    setIsActiveFilter(isActive);
    
    if (selectedTypeCode) {
      // 필터 변경 시 데이터 다시 로드
      fetchFacilities({
        facilityTypeCode: selectedTypeCode,
        isActive: isActive,
        search: searchKeyword || undefined,
        installationStartDate: isInstallationDateFilterActive && installationStartDate ? 
          format(installationStartDate, 'yyyy-MM-dd\'T\'00:00:00') : undefined,
        installationEndDate: isInstallationDateFilterActive && installationEndDate ? 
          format(installationEndDate, 'yyyy-MM-dd\'T\'23:59:59') : undefined,
        page: 0 // 첫 페이지부터 로드
      });
    }
  };

  // 페이지 변경 핸들러
  const handlePageChange = (event, value) => {
    const newPage = value - 1; // 0-based 페이지
    
    // 현재 필터 상태로 다음 페이지 로드
    fetchFacilities({
      facilityTypeCode: selectedTypeCode,
      isActive: isActiveFilter,
      search: searchKeyword || undefined,
      installationStartDate: isInstallationDateFilterActive && installationStartDate ? 
        format(installationStartDate, 'yyyy-MM-dd\'T\'00:00:00') : undefined,
      installationEndDate: isInstallationDateFilterActive && installationEndDate ? 
        format(installationEndDate, 'yyyy-MM-dd\'T\'23:59:59') : undefined,
      page: newPage
    });
  };

  // 검색어 변경 핸들러
  const handleSearchChange = (e) => {
    setSearchKeyword(e.target.value);
  };

  // 설치일자 필터 변경 처리
  const handleInstallationDateChange = (start, end) => {
    setInstallationStartDate(start);
    setInstallationEndDate(end);
    setIsInstallationDateFilterActive(true);
    setPage(0); // 페이지 초기화
  };

  // 설치일자 필터 초기화
  const handleResetInstallationDateFilter = () => {
    setInstallationStartDate(null);
    setInstallationEndDate(null);
    setIsInstallationDateFilterActive(false);
    setPage(0); // 페이지 초기화
  };

  // 설치일자 필터 적용
  const handleApplyInstallationDateFilter = () => {
    setShowInstallationDatePicker(false);
    // 날짜는 이미 handleInstallationDateChange에서 설정됨
  };

  // 선택된 설치일자 표시 텍스트
  const getInstallationDateRangeText = () => {
    if (!isInstallationDateFilterActive || !installationStartDate || !installationEndDate) return '전체';
    
    try {
      return `${format(installationStartDate, 'yy-MM-dd')} ~ ${format(installationEndDate, 'yy-MM-dd')}`;
    } catch (error) {
      console.error('날짜 형식 오류:', error);
      return '전체';
    }
  };

  // 시설물 상세 보기
  const handleViewFacility = (facilityId) => {
    navigate(`/facility-detail/${facilityId}`);
  };

  // 알림 표시
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // 알림 닫기
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  // 설치일을 년월일만 표시하는 함수
  const formatInstallationDate = (dateString) => {
    if (!dateString) return '-';
    
    try {
      // T 포함 시 T 앞부분만
      return dateString.includes('T') ? dateString.split('T')[0] : dateString;
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Box sx={{ pt: 3, backgroundColor: '#F8F8FE', minHeight: '100vh' }}>

      {/* 시설물 유형별 총 수량 표시 */}
      {totalCountsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : facilityCounts && Object.keys(facilityCounts).length > 0 ? (
        <Box sx={{ mb: 4 }}>
          <Card variant="outlined" sx={{ boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                시설물 유형별 총 수량
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, borderRadius: '8px', overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      {Object.keys(facilityCounts)
                        .filter(key => key !== 'total')
                        .map((key) => (
                          <TableCell 
                            key={key} 
                            align="center" 
                            sx={{ 
                              fontWeight: 'bold', 
                              fontSize: '0.85rem',
                              py: 1.5,
                              borderRight: '1px solid #e0e0e0',
                              width: `${100 / (Object.keys(facilityCounts).length)}%`, // 동일한 너비 적용
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {facilityCounts[key].facilityTypeName}
                          </TableCell>
                        ))}
                      <TableCell 
                        align="center" 
                        sx={{ 
                          fontWeight: 'bold', 
                          fontSize: '0.85rem',
                          backgroundColor: '#e3f2fd',
                          py: 1.5,
                          width: `${100 / (Object.keys(facilityCounts).length)}%` // 동일한 너비 적용
                        }}
                      >
                        총계
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      {Object.keys(facilityCounts)
                        .filter(key => key !== 'total')
                        .map((key) => (
                          <TableCell 
                            key={key} 
                            align="center" 
                            sx={{ 
                              fontSize: '0.95rem',
                              fontWeight: 500,
                              py: 2,
                              borderRight: '1px solid #e0e0e0'
                            }}
                          >
                            {facilityCounts[key].count}개
                          </TableCell>
                        ))}
                      <TableCell 
                        align="center" 
                        sx={{ 
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          backgroundColor: '#e3f2fd',
                          py: 2
                        }}
                      >
                        {facilityCounts.total && facilityCounts.total.count}개
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      ) : null}

      {/* 시설물 유형 선택 */}
      <Box sx={{ mb: 4 }}>
        <FormControl sx={{ maxWidth: '400px', width: '100%' }}>
          <InputLabel id="facility-type-select-label">시설물 유형 선택</InputLabel>
          <Select
            labelId="facility-type-select-label"
            id="facility-type-select"
            value={selectedTypeCode}
            label="시설물 유형 선택"
            onChange={handleTypeChange}
            disabled={loading}
          >
            <MenuItem value="">
              <em>선택하세요</em>
            </MenuItem>
            {facilityTypes.map((type) => (
              <MenuItem key={type.codeId} value={type.codeId}>
                {type.codeName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* 선택된 시설물 유형의 시설물 목록 */}
      {selectedTypeCode && (
        <Paper sx={{ p: 3, mb: 3, overflow: 'auto' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {selectedTypeName} 목록
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button 
                variant={isActiveFilter ? "contained" : "outlined"} 
                color="primary"
                onClick={() => handleActiveFilterChange(true)}
                sx={{ 
                  minWidth: '120px',
                  height: '40px'
                }}
              >
                사용중인 시설물
              </Button>
              <Button 
                variant={!isActiveFilter ? "contained" : "outlined"} 
                color="secondary"
                onClick={() => handleActiveFilterChange(false)}
                sx={{ 
                  minWidth: '150px',
                  height: '40px'
                }}
              >
                폐기/분실 시설물
              </Button>
              <DateRangeButton
                startDate={installationStartDate}
                endDate={installationEndDate}
                isActive={isInstallationDateFilterActive}
                onClick={() => setShowInstallationDatePicker(true)}
                getDateRangeText={getInstallationDateRangeText}
                buttonProps={{
                  sx: { 
                    minWidth: '140px',
                    height: '40px'
                  }
                }}
              />
              <TextField
                placeholder="관리번호, 품목, 매장명 검색"
                size="small"
                value={searchKeyword}
                onChange={handleSearchChange}
                sx={{ 
                  width: '300px',
                  backgroundColor: 'white',
                  '& .MuiOutlinedInput-root': {
                    height: '40px',
                    '& fieldset': {
                      borderColor: '#E0E0E0',
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#9E9E9E' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>

          {facilitiesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  총 {totalItems}개 시설물 중 {facilities.length}개 표시 {isActiveFilter ? '(사용중인 시설물)' : '(폐기/분실 시설물)'}
                  {searchKeyword && ` - "${searchKeyword}" 검색 결과`}
                  {isInstallationDateFilterActive && installationStartDate && installationEndDate && 
                    ` - 설치일자: ${format(installationStartDate, 'yyyy-MM-dd')} ~ ${format(installationEndDate, 'yyyy-MM-dd')}`}
                </Typography>
              </Box>
              <TableContainer sx={{ maxHeight: '60vh', overflow: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#F8F9FA', width: '60px' }}>번호</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#F8F9FA' }}>관리번호</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#F8F9FA' }}>품목</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#F8F9FA' }}>현재 위치 지점명</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#F8F9FA' }}>설치일자</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#F8F9FA' }}>내용연수(개월)</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#F8F9FA' }}>상태</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {facilities.length > 0 ? (
                      facilities.map((facility, index) => (
                        <TableRow 
                          key={facility.facilityId}
                          hover
                          onClick={() => handleViewFacility(facility.facilityId)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell>{totalItems - (page * pageSize + index)}</TableCell>
                          <TableCell>{facility.managementNumber}</TableCell>
                          <TableCell>{facility.brandName}</TableCell>
                          <TableCell>{facility.locationStoreName}</TableCell>
                          <TableCell>{formatInstallationDate(facility.installationDate)}</TableCell>
                          <TableCell>{facility.usefulLifeMonths}</TableCell>
                          <TableCell>
                            <Chip 
                              label={facility.statusName} 
                              size="small" 
                              color={statusColorMap[facility.statusCode] || 'default'} 
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : searchKeyword ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          검색 조건에 맞는 시설물이 없습니다.
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          선택된 시설물 유형의 시설물이 없습니다.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* 페이지네이션 */}
              {totalItems > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Pagination
                    count={totalPages}
                    page={page + 1}
                    onChange={handlePageChange}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </Paper>
      )}

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

      {/* 설치일자 필터 캘린더 */}
      <DateRangeCalendar
        startDate={installationStartDate}
        endDate={installationEndDate}
        onDateChange={handleInstallationDateChange}
        open={showInstallationDatePicker}
        onClose={() => setShowInstallationDatePicker(false)}
        onApply={handleApplyInstallationDateFilter}
        onReset={handleResetInstallationDateFilter}
      />
    </Box>
  );
};

export default FacilityTypeList; 