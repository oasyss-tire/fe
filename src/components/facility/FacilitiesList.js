import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  IconButton,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Pagination,
  CircularProgress,
  Snackbar,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import { 
  Search as SearchIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import FacilityTypeList from './FacilityTypeList';

// 시설물 상태 코드 맵핑
const statusColorMap = {
  '002003_0001': 'success', // 사용중 (정상)
  '002003_0002': 'error',   // 고장
  '002003_0003': 'warning', // 수리중
  '002003_0004': 'info',    // AS 접수중
  '002003_0006': 'success'  // AS 완료
};

// 시설물별 조회 컴포넌트 (임시 - 나중에 별도 파일로 분리 가능)
const FacilityTypeView = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        시설물별 조회 (준비 중)
      </Typography>
      <Paper sx={{ p: 5, textAlign: 'center' }}>
        <Typography variant="body1" color="textSecondary">
          시설물별 조회 기능은 개발 중입니다.
        </Typography>
      </Paper>
    </Box>
  );
};

// 탭 패널 컴포넌트
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`facility-tabpanel-${index}`}
      aria-labelledby={`facility-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
}

const FacilitiesList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [facilityTypesLoading, setFacilityTypesLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [facilityTypes, setFacilityTypes] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const [viewAllFacilities, setViewAllFacilities] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [tabValue, setTabValue] = useState(0); // 탭 상태 추가

  // 알림 상태
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // 각 수탁업체별 시설물 유형 개수 매핑 (2차원 배열)
  const [facilityCountMatrix, setFacilityCountMatrix] = useState({});
  
  // 페이지네이션
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // 초기 데이터 로딩
  useEffect(() => {
    fetchFacilityTypes();
    fetchCompanies();
  }, []);

  // 시설물 유형 코드 조회 후 시설물 목록 조회
  useEffect(() => {
    if (facilityTypes.length > 0) {
      fetchFacilities();
    }
  }, [facilityTypes]);

  // 탭 변경 핸들러
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // 시설물 유형 코드 조회
  const fetchFacilityTypes = async () => {
    setFacilityTypesLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/codes/groups/002001/codes/active', {
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
      setFacilityTypesLoading(false);
    }
  };

  // 수탁업체 목록 조회
  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/companies', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('수탁업체 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setCompanies(data);
    } catch (error) {
      console.error('수탁업체 목록 조회 실패:', error);
      showSnackbar('수탁업체 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 시설물 전체 목록 조회
  const fetchFacilities = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/facilities?size=1000', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('시설물 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      const allFacilities = data.content || [];
      setFacilities(allFacilities);
      
      // 시설물 매트릭스 생성
      createFacilityMatrix(allFacilities);
    } catch (error) {
      console.error('시설물 목록 조회 실패:', error);
      showSnackbar('시설물 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 수탁업체별, 시설물 유형별 개수 매트릭스 생성
  const createFacilityMatrix = (facilities) => {
    // 1. 수탁업체별 맵 생성
    const companyMap = {};
    
    // 2. 각 수탁업체마다 시설물 유형별 개수 계산
    facilities.forEach(facility => {
      const locationCompanyId = facility.locationCompanyId;
      const typeCode = facility.facilityTypeCode;
      
      if (!companyMap[locationCompanyId]) {
        companyMap[locationCompanyId] = {};
      }
      
      if (!companyMap[locationCompanyId][typeCode]) {
        companyMap[locationCompanyId][typeCode] = 0;
      }
      
      companyMap[locationCompanyId][typeCode] += 1; // 각 시설물마다 1개씩 카운트
    });
    
    setFacilityCountMatrix(companyMap);
  };

  // 특정 수탁업체, 특정 시설물 유형 선택 시 해당 시설물 목록 필터링
  const handleCellClick = (companyId, typeCode) => {
    setSelectedCompany(companyId);
    setSelectedType(typeCode);
    setViewAllFacilities(false);
    
    const filtered = facilities.filter(
      facility => facility.locationCompanyId === companyId && facility.facilityTypeCode === typeCode
    );
    
    setSelectedFacilities(filtered);
  };

  // 매장명 클릭 시 해당 매장의 모든 시설물 표시
  const handleStoreNameClick = (companyId) => {
    setSelectedCompany(companyId);
    setSelectedType(null);
    setViewAllFacilities(true);
    
    const filtered = facilities.filter(
      facility => facility.locationCompanyId === companyId
    );
    
    setSelectedFacilities(filtered);
  };

  const handleSearchChange = (e) => {
    setSearchKeyword(e.target.value);
  };

  const handleAddFacility = () => {
    navigate('/facility-register');
  };

  const handleViewFacility = (facilityId) => {
    navigate(`/facility-detail/${facilityId}`);
  };

  const handlePageChange = (event, value) => {
    setPage(value - 1);
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

  const filteredCompanies = searchKeyword
    ? companies.filter(company => 
        company.storeName.includes(searchKeyword) || 
        company.phoneNumber.includes(searchKeyword)
      )
    : companies;

  // 날짜 포맷 함수
  const formatDate = (dateString, includeTime = true) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), includeTime ? 'yy-MM-dd HH:mm' : 'yy-MM-dd');
    } catch (error) {
      return dateString;
    }
  };
  
  // 설치일을 년월일만 표시하는 함수
  const formatInstallationDate = (dateString) => {
    if (!dateString) return '-';
    
    try {
      // 날짜 객체로 변환 후 'yy-MM-dd' 형식으로 포맷팅
      return format(new Date(dateString), 'yy-MM-dd');
    } catch (error) {
      // 오류 발생 시 원본 문자열 반환(T 포함 시 T 앞부분만)
      return dateString.includes('T') ? dateString.split('T')[0] : dateString;
    }
  };

  // 특정 수탁업체, 특정 유형의 고장/수리중 상태 시설물이 있는지 확인
  const hasFailed = (companyId, typeCode) => {
    return facilities.some(
      f => f.locationCompanyId === companyId && 
           f.facilityTypeCode === typeCode && 
           ['002003_0002', '002003_0003'].includes(f.statusCode)
    );
  };

  // 매장별 조회 컴포넌트 렌더링
  const renderCompanyView = () => (
    <>
      {/* 검색 및 도구 바 */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'flex-end' }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
            매장 검색
          </Typography>
          <TextField
            placeholder="매장명, 전화번호 검색"
            size="small"
            value={searchKeyword}
            onChange={handleSearchChange}
            sx={{ 
              width: '100%',
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

        <Button
          variant="outlined"
          color="primary"
          onClick={() => navigate('/facility-transfer')}
          sx={{ mr: 1 }}
        >
          시설물 출고 (이동/폐기)
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddFacility}
        >
          시설물 입고
        </Button>
      </Box>

      {/* 메인 테이블 */}
      {(loading || facilityTypesLoading) ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ mb: 3, overflow: 'auto' }}>
          <TableContainer component={Paper} sx={{ minWidth: '100%', maxHeight: '60vh' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#F8F9FA' }}>매장명</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#F8F9FA' }}>매장전화</TableCell>
                  {facilityTypes.map(type => (
                    <TableCell 
                      key={type.codeId} 
                      align="center" 
                      sx={{ 
                        fontWeight: 'bold', 
                        backgroundColor: '#F8F9FA',
                        padding: '6px 8px', // 패딩 줄임
                      }}
                    >

                        {type.codeName}

                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id} hover>
                    <TableCell 
                      onClick={() => handleStoreNameClick(company.id)}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: '#e3f2fd',
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      {company.storeName}
                    </TableCell>
                    <TableCell>{company.phoneNumber}</TableCell>
                    {facilityTypes.map(type => {
                      const count = facilityCountMatrix[company.id]?.[type.codeId] || 0;
                      const hasFailedStatus = hasFailed(company.id, type.codeId);
                      
                      return (
                        <TableCell 
                          key={`${company.id}-${type.codeId}`} 
                          align="center"
                          onClick={() => handleCellClick(company.id, type.codeId)}
                          sx={{ 
                            cursor: 'pointer',
                            backgroundColor: hasFailedStatus ? '#ffebee' : (count > 0 ? '#f1f8e9' : 'inherit'),
                            '&:hover': {
                              backgroundColor: '#e3f2fd',
                            },
                            padding: '6px 8px', // 패딩 줄임
                          }}
                        >
                          {count}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* 하단 시설물 상세 목록 */}
      {selectedCompany && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              선택된 시설물 정보 (선택시 상세정보 확인가능)
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {companies.find(c => c.id === selectedCompany)?.storeName} 
              {!viewAllFacilities && selectedType && (
                ` - ${facilityTypes.find(t => t.codeId === selectedType)?.codeName}`
              )} 
              ({selectedFacilities.length}개)
            </Typography>
          </Box>
          
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>매장명</TableCell>
                  <TableCell>시설구분</TableCell>
                  <TableCell>품목</TableCell>
                  <TableCell>관리번호</TableCell>
                  <TableCell>설치일자</TableCell>
                  <TableCell>내용연수(개월)</TableCell>
                  <TableCell>상태</TableCell>
                  <TableCell>담당자</TableCell>
                  <TableCell>AS 접수일</TableCell>
                  <TableCell>작업완료일</TableCell>
                  <TableCell align="center">AS요청</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedFacilities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center">
                      선택된 시설물이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  selectedFacilities.map((facility, index) => (
                    <TableRow 
                      key={facility.facilityId}
                      hover
                      onClick={() => handleViewFacility(facility.facilityId)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{facility.locationStoreName}</TableCell>
                      <TableCell>{facility.facilityTypeName}</TableCell>
                      <TableCell>{facility.brandName}</TableCell>
                      <TableCell>{facility.managementNumber}</TableCell>
                      <TableCell>{formatInstallationDate(facility.installationDate)}</TableCell>
                      <TableCell>{facility.usefulLifeMonths}</TableCell>
                      <TableCell>
                        <Chip 
                          label={facility.statusName} 
                          size="small" 
                          color={statusColorMap[facility.statusCode] || 'default'} 
                        />
                      </TableCell>
                      <TableCell>{facility.managerName || '-'}</TableCell>
                      <TableCell>{formatInstallationDate(facility.serviceRequestDate) || '-'}</TableCell>
                      <TableCell>{formatInstallationDate(facility.completionDate) || '-'}</TableCell>
                      <TableCell align="center">
                        {facility.hasActiveServiceRequest && !facility.isCompleted ? (
                          <Chip 
                            label={facility.serviceStatusName} 
                            size="small" 
                            color={
                              facility.serviceStatusCode === '002010_0001' ? 'default' : 
                              facility.serviceStatusCode === '002010_0002' ? 'warning' : 'info'
                            }
                          />
                        ) : (
                          facility.statusCode === '002003_0005' ? (
                            '-'
                          ) : (
                            <Button 
                              variant="contained" 
                              size="small"
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/service-request/create/${facility.facilityId}`);
                              }}
                              sx={{ fontSize: '0.7rem', py: 0.5 }}
                            >
                              수리요청
                            </Button>
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {selectedFacilities.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={totalPages}
                page={page + 1}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </Paper>
      )}
    </>
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
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#3A3A3A' }}>
          시설물 관리
        </Typography>
      </Box>

      {/* 탭 네비게이션 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="매장별 조회" id="facility-tab-0" aria-controls="facility-tabpanel-0" />
          <Tab label="시설물별 조회" id="facility-tab-1" aria-controls="facility-tabpanel-1" />
        </Tabs>
      </Box>

      {/* 탭 컨텐츠 */}
      <TabPanel value={tabValue} index={0}>
        {renderCompanyView()}
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <FacilityTypeList />
      </TabPanel>

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

export default FacilitiesList; 