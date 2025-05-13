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
  Divider
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

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
  const [filteredFacilities, setFilteredFacilities] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [facilitiesLoading, setFacilitiesLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [allFacilities, setAllFacilities] = useState([]);
  const [facilityCounts, setFacilityCounts] = useState({});
  const [totalCountsLoading, setTotalCountsLoading] = useState(false);
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

  // 특정 시설물 유형의 시설물 목록 조회
  const fetchFacilitiesByType = async (typeCode, pageNum = 0) => {
    if (!typeCode) return;
    
    setFacilitiesLoading(true);
    try {
      // 최근등록순으로 정렬 (createdAt 기준 내림차순)
      const response = await fetch(`${baseUrl}/api/facilities?facilityTypeCode=${typeCode}&page=${pageNum}&size=${pageSize}&sortBy=createdAt&sortDir=DESC`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('시설물 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      const content = data.content || [];
      
      setFacilities(content);
      setFilteredFacilities(content);
      setTotalPages(data.totalPages || 1);
      setPage(pageNum);
      
      // 총 시설물 개수 저장
      if (data.totalElements !== undefined) {
        setTotalItems(data.totalElements);
      }
    } catch (error) {
      console.error('시설물 목록 조회 실패:', error);
      showSnackbar('시설물 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
      setFacilitiesLoading(false);
    }
  };

  // 특정 시설물 유형의 모든 시설물 목록 조회 (검색용)
  const fetchAllFacilitiesByType = async (typeCode) => {
    if (!typeCode) return;
    
    setFacilitiesLoading(true);
    try {
      // 모든 데이터를 가져오기 위해 큰 size 값 사용 (최근등록순)
      const response = await fetch(`${baseUrl}/api/facilities?facilityTypeCode=${typeCode}&size=1000&sortBy=createdAt&sortDir=DESC`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('시설물 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      const allContent = data.content || [];
      
      // 모든 시설물 데이터 저장
      setAllFacilities(allContent);
      
      // 총 시설물 개수 저장
      if (data.totalElements !== undefined) {
        setTotalItems(data.totalElements);
      }
      
      return allContent;
    } catch (error) {
      console.error('시설물 목록 조회 실패:', error);
      showSnackbar('시설물 목록을 불러오는데 실패했습니다.', 'error');
      return [];
    } finally {
      setFacilitiesLoading(false);
    }
  };

  // 시설물 데이터 필터링 함수
  const filterFacilities = (data, keyword) => {
    if (!keyword || keyword.trim() === '') {
      return data;
    }
    
    const searchLower = keyword.toLowerCase();
    return data.filter(facility => 
      (facility.managementNumber && facility.managementNumber.toLowerCase().includes(searchLower)) ||
      (facility.brandName && facility.brandName.toLowerCase().includes(searchLower)) ||
      (facility.locationStoreName && facility.locationStoreName.toLowerCase().includes(searchLower))
    );
  };

  // 시설물 유형 선택 핸들러
  const handleTypeChange = async (event) => {
    const typeCode = event.target.value;
    setSelectedTypeCode(typeCode);
    
    if (typeCode) {
      const selectedType = facilityTypes.find(type => type.codeId === typeCode);
      setSelectedTypeName(selectedType ? selectedType.codeName : '');
      
      // 시설물 유형이 선택되면 모든 데이터를 미리 가져옴
      const allData = await fetchAllFacilitiesByType(typeCode);
      
      // 첫 페이지 데이터 표시
      const firstPageData = allData.slice(0, pageSize);
      setFacilities(firstPageData);
      setFilteredFacilities(firstPageData);
      setTotalPages(Math.ceil(allData.length / pageSize) || 1);
      setPage(0);
    } else {
      setSelectedTypeName('');
      setFacilities([]);
      setFilteredFacilities([]);
      setAllFacilities([]);
    }
    
    // 검색어 초기화
    setSearchKeyword('');
  };

  // 페이지 변경 핸들러
  const handlePageChange = (event, value) => {
    const pageIndex = value - 1;
    setPage(pageIndex);
    
    if (searchKeyword) {
      // 검색 모드일 때는 필터링된 데이터에서 페이징
      const filtered = filterFacilities(allFacilities, searchKeyword);
      const startIndex = pageIndex * pageSize;
      const endIndex = Math.min(startIndex + pageSize, filtered.length);
      const pageData = filtered.slice(startIndex, endIndex);
      setFilteredFacilities(pageData);
    } else {
      // 일반 모드일 때는 전체 데이터에서 페이징
      const startIndex = pageIndex * pageSize;
      const endIndex = Math.min(startIndex + pageSize, allFacilities.length);
      const pageData = allFacilities.slice(startIndex, endIndex);
      setFilteredFacilities(pageData);
    }
  };

  // 검색어 변경 핸들러
  const handleSearchChange = (e) => {
    const keyword = e.target.value;
    setSearchKeyword(keyword);
    
    if (selectedTypeCode && allFacilities.length > 0) {
      // 검색어로 필터링
      const filtered = filterFacilities(allFacilities, keyword);
      
      // 필터링된 결과에 대한 페이징 처리
      setFacilities(filtered);
      
      // 페이징 처리
      const totalFilteredPages = Math.ceil(filtered.length / pageSize);
      setTotalPages(totalFilteredPages || 1);
      setPage(0); // 검색 시 첫 페이지로 이동
      
      // 현재 페이지에 표시할 데이터만 선택
      const startIndex = 0;
      const endIndex = Math.min(pageSize, filtered.length);
      setFilteredFacilities(filtered.slice(startIndex, endIndex));
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
    <Box sx={{ p: 3, backgroundColor: '#F8F8FE', minHeight: '100vh' }}>
      {/* 상단 헤더 */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3 
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#3A3A3A' }}>
          시설물별 조회
        </Typography>
      </Box>

      {/* 시설물 유형별 총 수량 표시 */}
      {totalCountsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : facilityCounts && Object.keys(facilityCounts).length > 0 ? (
        <Box sx={{ mb: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                시설물 유형별 총 수량
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell align="center" colSpan={4} sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                        시설물 수량 현황
                      </TableCell>
                    </TableRow>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell width="25%" align="center" sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>시설물 유형</TableCell>
                      <TableCell width="25%" align="center" sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>수량</TableCell>
                      <TableCell width="25%" align="center" sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>시설물 유형</TableCell>
                      <TableCell width="25%" align="center" sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>수량</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* 나머지 시설물 유형들을 2열로 표시 */}
                    {(() => {
                      const typeKeys = Object.keys(facilityCounts).filter(key => key !== 'total');
                      const rows = [];
                      
                      // 2개씩 묶어서 행으로 표시
                      for (let i = 0; i < typeKeys.length; i += 2) {
                        const firstKey = typeKeys[i];
                        const secondKey = i + 1 < typeKeys.length ? typeKeys[i + 1] : null;
                        
                        rows.push(
                          <TableRow key={firstKey}>
                            <TableCell align="center" sx={{ fontSize: '0.9rem' }}>{facilityCounts[firstKey].facilityTypeName}</TableCell>
                            <TableCell align="center" sx={{ fontSize: '0.9rem' }}>{facilityCounts[firstKey].count}개</TableCell>
                            {secondKey ? (
                              <>
                                <TableCell align="center" sx={{ fontSize: '0.9rem' }}>{facilityCounts[secondKey].facilityTypeName}</TableCell>
                                <TableCell align="center" sx={{ fontSize: '0.9rem' }}>{facilityCounts[secondKey].count}개</TableCell>
                              </>
                            ) : (
                              <>
                                <TableCell align="center"></TableCell>
                                <TableCell align="center"></TableCell>
                              </>
                            )}
                          </TableRow>
                        );
                      }
                      
                      return rows;
                    })()}
                    
                    {/* 전체 행을 하단에 추가 */}
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ backgroundColor: '#e3f2fd', fontWeight: 'bold' }}>
                        {facilityCounts.total && 
                          `${facilityCounts.total.facilityTypeName}: ${facilityCounts.total.count}개`
                        }
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
        <FormControl fullWidth sx={{ maxWidth: '400px' }}>
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
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {selectedTypeName} 목록
            </Typography>
            <Box sx={{ width: '300px' }}>
              <TextField
                placeholder="관리번호, 품목, 매장명 검색"
                size="small"
                value={searchKeyword}
                onChange={handleSearchChange}
                fullWidth
                sx={{ 
                  backgroundColor: 'white',
                  '& .MuiOutlinedInput-root': {
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
                  {searchKeyword ? (
                    `총 ${facilities.length}개 시설물 중 ${filteredFacilities.length}개 표시`
                  ) : (
                    `총 ${totalItems}개 시설물 중 ${filteredFacilities.length}개 표시`
                  )}
                </Typography>
              </Box>
              <TableContainer sx={{ maxHeight: '60vh' }}>
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
                    {filteredFacilities.length > 0 ? (
                      filteredFacilities.map((facility, index) => (
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
              {filteredFacilities.length > 0 && (
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
    </Box>
  );
};

export default FacilityTypeList; 