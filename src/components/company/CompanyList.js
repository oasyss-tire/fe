import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  Search as SearchIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  CalendarToday as CalendarTodayIcon,
  MoreVert as MoreVertIcon,
  Business as BusinessIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const CompanyList = () => {
  const [companies, setCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const navigate = useNavigate();

  // 회사 목록 조회 함수
  const fetchCompanies = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = sessionStorage.getItem('token');
      
      // 상태 필터 적용
      let url = 'http://localhost:8080/api/companies';
      if (statusFilter === 'ACTIVE') {
        url += '?active=true';
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      if (!response.ok) {
        throw new Error('회사 목록을 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      
      // 검색어 필터링
      let filteredData = data;
      if (searchTerm) {
        const searchTermLower = searchTerm.toLowerCase();
        filteredData = data.filter(company => 
          (company.storeName && company.storeName.toLowerCase().includes(searchTermLower)) ||
          (company.address && company.address.toLowerCase().includes(searchTermLower)) ||
          (company.phoneNumber && company.phoneNumber.toLowerCase().includes(searchTermLower)) ||
          (company.email && company.email.toLowerCase().includes(searchTermLower))
        );
      }
      
      // 정렬
      if (sortBy === 'name') {
        filteredData.sort((a, b) => a.storeName.localeCompare(b.storeName));
      } else if (sortBy === 'address') {
        filteredData.sort((a, b) => {
          if (!a.address) return 1;
          if (!b.address) return -1;
          return a.address.localeCompare(b.address);
        });
      } else {
        // 기본 정렬: 최신순 (ID 기준 내림차순)
        filteredData.sort((a, b) => b.id - a.id);
      }
      
      setCompanies(filteredData);
    } catch (error) {
      console.error('회사 목록 조회 오류:', error);
      setError(error.message || '회사 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 검색어, 정렬, 상태 필터 변경 시 회사 목록 다시 조회
  useEffect(() => {
    fetchCompanies();
  }, [sortBy, statusFilter]);

  // 검색어 입력 핸들러
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // 검색 실행 핸들러
  const handleSearch = () => {
    fetchCompanies();
  };

  // 엔터 키 검색 핸들러
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 정렬 변경 핸들러
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  // 상태 필터 변경 핸들러
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleMenuClick = (event, companyId) => {
    setAnchorEl(event.currentTarget);
    setSelectedCompanyId(companyId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCompanyId(null);
  };

  const handleCompanyClick = (companyId) => {
    navigate(`/companies/${companyId}`);
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
          위수탁 업체 관리
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/companies/create')}
          sx={{
            backgroundColor: '#1976d2',
            '&:hover': {
              backgroundColor: '#1565c0',
            },
            borderRadius: '8px',
            textTransform: 'none'
          }}
        >
          업체 추가
        </Button>
      </Box>

      {/* 오류 메시지 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 검색 및 필터 영역 */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        {/* 검색어 입력 */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
            검색어
          </Typography>
          <TextField
            placeholder="업체명, 주소, 연락처 검색"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyPress={handleKeyPress}
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
                  <IconButton size="small" onClick={handleSearch}>
                    <SearchIcon sx={{ color: '#9E9E9E' }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* 정렬 필터 */}
        <Box>
          <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
            정렬
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120, backgroundColor: 'white' }}>
            <Select
              displayEmpty
              value={sortBy}
              onChange={handleSortChange}
              IconComponent={KeyboardArrowDownIcon}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#E0E0E0',
                },
              }}
            >
              <MenuItem value="">최신순</MenuItem>
              <MenuItem value="name">업체명순</MenuItem>
              <MenuItem value="address">주소순</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* 상태 필터 */}
        <Box>
          <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
            상태
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120, backgroundColor: 'white' }}>
            <Select
              displayEmpty
              value={statusFilter}
              onChange={handleStatusFilterChange}
              IconComponent={KeyboardArrowDownIcon}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#E0E0E0',
                },
              }}
            >
              <MenuItem value="">전체</MenuItem>
              <MenuItem value="ACTIVE">사용</MenuItem>
              <MenuItem value="INACTIVE">해지</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* 등록일 필터 */}
        <Box>
          <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
            등록일
          </Typography>
          <Button
            variant="outlined"
            startIcon={<CalendarTodayIcon />}
            endIcon={<KeyboardArrowDownIcon />}
            sx={{
              borderColor: '#E0E0E0',
              color: '#666',
              backgroundColor: 'white',
              minWidth: 120,
              '&:hover': {
                backgroundColor: '#F8F9FA',
                borderColor: '#E0E0E0',
              },
            }}
          >
            전체
          </Button>
        </Box>
      </Box>

      {/* 로딩 표시 */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* 업체 목록 */}
      {!isLoading && (
        <Box sx={{ 
          backgroundColor: 'white', 
          borderRadius: 2, 
          mt: 3,
          overflow: 'auto', // 횡스크롤 적용
          maxWidth: '100%',
          overflowX: 'scroll', // 명시적으로 가로 스크롤 설정
          '&::-webkit-scrollbar': {
            height: '6px', // 스크롤바 높이 더 얇게
            width: '6px'
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#f1f1f1', // 스크롤바 트랙 배경색
            borderRadius: '4px'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#bdbdbd', // 스크롤바 색상 더 밝게
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: '#9e9e9e' // 호버 시 색상 변경
            }
          },
          '&::-webkit-scrollbar-corner': {
            backgroundColor: 'transparent'
          },
          scrollbarWidth: 'thin', // Firefox 스크롤바
          scrollbarColor: '#bdbdbd #f1f1f1' // Firefox 스크롤바 색상
        }}>
          <Box sx={{ 
            minWidth: '3500px', // 더 넓은 너비 설정
            position: 'relative',
            display: 'table', // 테이블 레이아웃 사용
            tableLayout: 'fixed', // 고정 테이블 레이아웃
            width: '100%'
          }}> 
            {/* 목록 헤더 */}
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: '150px 100px 200px 400px 250px 180px 200px 150px 180px 180px 200px 150px 100px 150px 150px 150px 150px 150px', // 마지막 두 열 너비 증가
              gridGap: '16px', // 열 사이 간격 추가
              p: 3, // 패딩 증가
              borderBottom: '1px solid #EEEEEE',
              backgroundColor: '#F8F9FA',
              width: '100%' // 전체 너비 설정
            }}>
              <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 'bold' }}>매장코드</Typography>
              <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 'bold' }}>점번</Typography>
              <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 'bold' }}>매장명</Typography>
              <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 'bold' }}>주소</Typography>
              <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 'bold' }}>이메일</Typography>
              <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 'bold' }}>휴대폰번호</Typography>
              <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 'bold' }}>수탁자</Typography>
              <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 'bold' }}>수탁코드</Typography>
              <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 'bold' }}>사업자번호</Typography>
              <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 'bold' }}>종사업장번호</Typography>
              <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 'bold' }}>상호</Typography>
              <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 'bold' }}>대표자명</Typography>
              <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 'bold' }}>상태</Typography>
              <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 'bold' }}>시작일자</Typography>
              <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 'bold' }}>종료일자</Typography>
              <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 'bold' }}>담당자</Typography>
              <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 'bold' }}>업태</Typography>
              <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 'bold' }}>종목</Typography>
            </Box>

            {/* 업체 목록 아이템 */}
            {companies.length > 0 ? (
              companies.map((company) => (
                <Box 
                  key={company.id}
                  onClick={() => handleCompanyClick(company.id)}
                  sx={{ 
                    display: 'grid',
                    gridTemplateColumns: '150px 100px 200px 400px 250px 180px 200px 150px 180px 180px 200px 150px 100px 150px 150px 150px 150px 150px', // 마지막 두 열 너비 증가
                    gridGap: '16px', // 열 사이 간격 추가
                    p: 3, // 패딩 증가
                    borderBottom: '1px solid #EEEEEE',
                    '&:hover': { 
                      backgroundColor: '#F8F9FA',
                      cursor: 'pointer' 
                    },
                    width: '100%' // 전체 너비 설정
                  }}
                >
                  {/* 매장코드 */}
                  <Typography 
                    title={company.storeCode || '-'} 
                    sx={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {company.storeCode || '-'}
                  </Typography>
                  
                  {/* 점번 */}
                  <Typography 
                    title={company.storeNumber || '-'} 
                    sx={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {company.storeNumber || '-'}
                  </Typography>
                  
                  {/* 매장명 */}
                  <Box sx={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                    <Typography 
                      className="company-name"
                      title={company.storeName || '-'}
                      sx={{ 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {company.storeName || '-'}
                    </Typography>
                  </Box>
                  
                  {/* 주소 */}
                  <Typography 
                    title={company.address || '-'} 
                    sx={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {company.address || '-'}
                  </Typography>
                  
                  {/* 이메일 */}
                  <Typography 
                    title={company.email || '-'} 
                    sx={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {company.email || '-'}
                  </Typography>
                  
                  {/* 휴대폰번호 */}
                  <Typography 
                    title={company.phoneNumber || '-'} 
                    sx={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {company.phoneNumber || '-'}
                  </Typography>
                  
                  {/* 수탁자 */}
                  <Typography 
                    title={company.trustee || '-'} 
                    sx={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {company.trustee || '-'}
                  </Typography>
                  
                  {/* 수탁코드 */}
                  <Typography 
                    title={company.trusteeCode || '-'} 
                    sx={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {company.trusteeCode || '-'}
                  </Typography>
                  
                  {/* 사업자번호 */}
                  <Typography 
                    title={company.businessNumber || '-'} 
                    sx={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {company.businessNumber || '-'}
                  </Typography>
                  
                  {/* 종사업장번호 */}
                  <Typography 
                    title={company.subBusinessNumber || '-'} 
                    sx={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {company.subBusinessNumber || '-'}
                  </Typography>
                  
                  {/* 상호 */}
                  <Typography 
                    title={company.companyName || '-'} 
                    sx={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {company.companyName || '-'}
                  </Typography>
                  
                  {/* 대표자명 */}
                  <Typography 
                    title={company.representativeName || '-'} 
                    sx={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {company.representativeName || '-'}
                  </Typography>
                  
                  {/* 상태 */}
                  <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <Chip
                      label={company.active ? '사용' : '해지'}
                      size="small"
                      sx={{
                        backgroundColor: company.active ? '#E8F3FF' : '#F5F5F5',
                        color: company.active ? '#3182F6' : '#666',
                        height: '24px',
                        fontSize: '12px'
                      }}
                    />
                  </Box>
                  
                  {/* 시작일자 */}
                  <Typography 
                    title={company.startDate || '-'} 
                    sx={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {company.startDate || '-'}
                  </Typography>
                  
                  {/* 종료일자 */}
                  <Typography 
                    title={company.endDate || '-'} 
                    sx={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {company.endDate || '-'}
                  </Typography>
                  
                  {/* 담당자 */}
                  <Typography 
                    title={company.managerName || '-'} 
                    sx={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {company.managerName || '-'}
                  </Typography>
                  
                  {/* 업태 */}
                  <Typography 
                    title={company.businessType || '-'} 
                    sx={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {company.businessType || '-'}
                  </Typography>
                  
                  {/* 종목 */}
                  <Typography 
                    title={company.businessCategory || '-'} 
                    sx={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {company.businessCategory || '-'}
                  </Typography>
                </Box>
              ))
            ) : (
              <Box sx={{ p: 4, textAlign: 'center', width: '100%', borderBottom: '1px solid #EEEEEE' }}>
                <Typography color="text.secondary">등록된 업체가 없습니다.</Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CompanyList; 