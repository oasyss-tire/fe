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
  Alert
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// 시설물별 조회 클래스
class FacilityTypeListService {
  constructor() {
    this.baseUrl = 'http://localhost:8080';
  }

  // 시설물 유형 코드 조회
  async getFacilityTypes() {
    try {
      const response = await fetch(`${this.baseUrl}/api/codes/groups/002001/codes/active`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('시설물 유형 코드를 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      // sortOrder 기준으로 정렬
      return data.sort((a, b) => a.sortOrder - b.sortOrder);
    } catch (error) {
      console.error('시설물 유형 코드 조회 실패:', error);
      throw error;
    }
  }

  // 수탁업체 목록 조회
  async getCompanies() {
    try {
      const response = await fetch(`${this.baseUrl}/api/companies`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('수탁업체 목록을 불러오는데 실패했습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('수탁업체 목록 조회 실패:', error);
      throw error;
    }
  }

  // 시설물 전체 목록 조회
  async getAllFacilities() {
    try {
      const response = await fetch(`${this.baseUrl}/api/facilities?size=1000`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('시설물 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      return data.content || [];
    } catch (error) {
      console.error('시설물 목록 조회 실패:', error);
      throw error;
    }
  }

  // 수탁업체별, 시설물 유형별 개수 매트릭스 생성
  createFacilityMatrix(facilities, facilityTypes, companies) {
    // 유형별로 먼저 그룹화하는 매트릭스 생성
    const typeMatrix = {};
    
    // 각 시설물 유형마다 수탁업체별 개수 계산
    facilityTypes.forEach(type => {
      if (!typeMatrix[type.codeId]) {
        typeMatrix[type.codeId] = {
          typeName: type.codeName,
          companies: {}
        };
      }
      
      companies.forEach(company => {
        typeMatrix[type.codeId].companies[company.id] = 0;
      });
    });
    
    // 시설물 데이터로 매트릭스 채우기
    facilities.forEach(facility => {
      const typeCode = facility.facilityTypeCode;
      const companyId = facility.locationCompanyId;
      
      if (typeMatrix[typeCode] && typeMatrix[typeCode].companies[companyId] !== undefined) {
        typeMatrix[typeCode].companies[companyId] += 1;
      }
    });
    
    return typeMatrix;
  }

  // 특정 시설물 유형의 고장/수리중 상태가 있는지 확인
  checkHasFailed(facilities, typeCode, companyId) {
    return facilities.some(
      f => f.facilityTypeCode === typeCode && 
           f.locationCompanyId === companyId && 
           ['002003_0002', '002003_0003'].includes(f.statusCode)
    );
  }

  // 시설물 유형별 총 개수 계산
  calculateTypeTotals(facilityMatrix) {
    const totals = {};
    
    Object.keys(facilityMatrix).forEach(typeCode => {
      const typeCounts = facilityMatrix[typeCode].companies;
      totals[typeCode] = Object.values(typeCounts).reduce((sum, count) => sum + count, 0);
    });
    
    return totals;
  }
}

const FacilityTypeList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [facilityTypes, setFacilityTypes] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [facilityMatrix, setFacilityMatrix] = useState({});
  const [typeTotals, setTypeTotals] = useState({});
  const [searchKeyword, setSearchKeyword] = useState('');
  const service = new FacilityTypeListService();

  // 알림 상태
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // 초기 데이터 로딩
  useEffect(() => {
    fetchInitialData();
  }, []);

  // 모든 초기 데이터 로드
  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 병렬로 데이터 로드
      const [typeData, companyData, facilityData] = await Promise.all([
        service.getFacilityTypes(),
        service.getCompanies(),
        service.getAllFacilities()
      ]);
      
      setFacilityTypes(typeData);
      setCompanies(companyData);
      setFacilities(facilityData);
      
      // 매트릭스 생성
      const matrix = service.createFacilityMatrix(facilityData, typeData, companyData);
      setFacilityMatrix(matrix);
      
      // 시설물 유형별 총 개수 계산
      const totals = service.calculateTypeTotals(matrix);
      setTypeTotals(totals);
    } catch (error) {
      showSnackbar('데이터를 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 검색어 변경 핸들러
  const handleSearchChange = (e) => {
    setSearchKeyword(e.target.value);
  };

  // 시설물 유형 클릭 시 해당 유형의 시설물 목록으로 이동
  const handleTypeClick = (typeCode) => {
    navigate(`/facility-list?type=${typeCode}`);
  };

  // 특정 셀 클릭 시 해당 유형과 수탁업체의 시설물 목록으로 이동
  const handleCellClick = (typeCode, companyId) => {
    navigate(`/facility-list?type=${typeCode}&company=${companyId}`);
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

  // 수탁업체 필터링
  const filteredCompanies = searchKeyword
    ? companies.filter(company => 
        company.storeName.toLowerCase().includes(searchKeyword.toLowerCase()) || 
        company.phoneNumber.includes(searchKeyword)
      )
    : companies;

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

      {/* 검색 바 */}
      <Box sx={{ mb: 3, width: '100%', maxWidth: '400px' }}>
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

      {/* 시설물 유형별 매트릭스 */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ mb: 3, overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell 
                  sx={{ 
                    fontWeight: 'bold', 
                    backgroundColor: '#F8F9FA', 
                    position: 'sticky',
                    left: 0,
                    zIndex: 3
                  }}
                >
                  시설물 유형
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#F8F9FA', minWidth: '60px' }}>
                  전체개수
                </TableCell>
                {filteredCompanies.map(company => (
                  <TableCell 
                    key={company.id} 
                    align="center" 
                    sx={{ 
                      fontWeight: 'bold', 
                      backgroundColor: '#F8F9FA',
                      minWidth: '80px'
                    }}
                  >
                    {company.storeName}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {facilityTypes.map(type => (
                <TableRow key={type.codeId} hover>
                  <TableCell 
                    onClick={() => handleTypeClick(type.codeId)}
                    sx={{ 
                      fontWeight: 500,
                      cursor: 'pointer',
                      position: 'sticky',
                      left: 0,
                      backgroundColor: 'white',
                      zIndex: 2,
                      '&:hover': {
                        backgroundColor: '#e3f2fd',
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    {type.codeName}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'medium' }}>
                    {typeTotals[type.codeId] || 0}
                  </TableCell>
                  {filteredCompanies.map(company => {
                    const count = facilityMatrix[type.codeId]?.companies[company.id] || 0;
                    const hasFailed = service.checkHasFailed(facilities, type.codeId, company.id);
                    
                    return (
                      <TableCell 
                        key={`${type.codeId}-${company.id}`} 
                        align="center"
                        onClick={() => handleCellClick(type.codeId, company.id)}
                        sx={{ 
                          cursor: 'pointer',
                          backgroundColor: hasFailed ? '#fff8e1' : (count > 0 ? '#f9fbe7' : 'inherit'),
                          '&:hover': {
                            backgroundColor: '#e3f2fd',
                          }
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