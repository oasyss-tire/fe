import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  ArrowDropDown as ArrowDropDownIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, subMonths } from 'date-fns';

// 탭 컨텐츠를 위한 컴포넌트
const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`facility-history-tabpanel-${index}`}
      aria-labelledby={`facility-history-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

// 탭 속성 설정
const a11yProps = (index) => {
  return {
    id: `facility-history-tab-${index}`,
    'aria-controls': `facility-history-tabpanel-${index}`,
  };
};

// 날짜 포맷 함수
const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    return format(new Date(dateString), 'yy-MM-dd HH:mm');
  } catch (error) {
    return dateString;
  }
};

// 금액 포맷 함수
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW'
  }).format(amount);
};

const FacilityHistoryPage = () => {
  // 탭 상태 관리
  const [tabValue, setTabValue] = useState(0);
  
  // 페이지네이션 상태
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // 검색 필터 상태
  const [startDate, setStartDate] = useState(subMonths(new Date(), 3)); // 기본값: 3개월 전
  const [endDate, setEndDate] = useState(new Date());
  const [searchKeyword, setSearchKeyword] = useState('');
  const [facilityTypeFilter, setFacilityTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('');
  
  // 데이터 상태
  const [facilityTransactions, setFacilityTransactions] = useState([]);
  const [voucherTransactions, setVoucherTransactions] = useState([]);
  const [depreciationHistory, setDepreciationHistory] = useState([]);
  const [facilityTypes, setFacilityTypes] = useState([]);
  const [statusCodes, setStatusCodes] = useState([]);
  const [transactionTypes, setTransactionTypes] = useState([]);
  
  // 로딩 상태
  const [loading, setLoading] = useState(false);
  
  // 알림 상태
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // 확장된 행 상태 관리
  const [expandedRow, setExpandedRow] = useState(null);

  // 코드 데이터 로드
  useEffect(() => {
    fetchCodes();
  }, []);

  // 탭 변경 시 해당 데이터 로드
  useEffect(() => {
    if (tabValue === 0) {
      fetchFacilityTransactions();
    } else if (tabValue === 1) {
      fetchVoucherTransactions();
    } else if (tabValue === 2) {
      fetchDepreciationHistory();
    }
  }, [tabValue]);

  // 코드 데이터 로드 함수
  const fetchCodes = async () => {
    try {
      // 시설물 타입 코드 로드
      const facilityTypeResponse = await fetch('http://localhost:8080/api/codes/groups/002001/codes', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (facilityTypeResponse.ok) {
        const facilityTypeData = await facilityTypeResponse.json();
        console.log('시설물 타입 코드 로드 완료:', facilityTypeData);
        setFacilityTypes(facilityTypeData);
      } else {
        console.error('시설물 타입 코드 로드 실패:', facilityTypeResponse.status);
      }
      
      // 상태 코드 로드
      const statusResponse = await fetch('http://localhost:8080/api/codes/groups/002003/codes', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log('상태 코드 로드 완료:', statusData);
        setStatusCodes(statusData);
      } else {
        console.error('상태 코드 로드 실패:', statusResponse.status);
      }
      
      // 트랜잭션 타입 코드 로드
      const transactionTypeResponse = await fetch('http://localhost:8080/api/codes/groups/002011/codes', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (transactionTypeResponse.ok) {
        const transactionTypeData = await transactionTypeResponse.json();
        console.log('트랜잭션 타입 코드 로드 완료:', transactionTypeData);
        setTransactionTypes(transactionTypeData);
      } else {
        console.error('트랜잭션 타입 코드 로드 실패:', transactionTypeResponse.status);
      }
    } catch (error) {
      console.error('코드 데이터 로드 실패:', error);
      showSnackbar('코드 데이터를 불러오는데 실패했습니다.', 'error');
    }
  };

  // 시설물 이동 이력 데이터 로드
  const fetchFacilityTransactions = async () => {
    setLoading(true);
    try {
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');
      
      const url = new URL('http://localhost:8080/api/facility-transactions');
      
      // 날짜 범위 추가
      url.searchParams.append('startDate', startDateStr);
      url.searchParams.append('endDate', endDateStr);
      
      // 키워드 검색
      if (searchKeyword && searchKeyword.trim() !== '') {
        url.searchParams.append('keyword', searchKeyword.trim());
      }
      
      // 시설물 유형 필터 - facilityTypeName 사용 (백엔드 API 요청용)
      if (facilityTypeFilter && facilityTypeFilter !== '') {
        console.log('시설물 유형 필터 적용:', facilityTypeFilter);
        url.searchParams.append('facilityTypeName', facilityTypeFilter);
      }
      
      // 트랜잭션 유형 필터
      if (transactionTypeFilter && transactionTypeFilter !== '') {
        console.log('트랜잭션 유형 필터 적용:', transactionTypeFilter);
        url.searchParams.append('transactionTypeCode', transactionTypeFilter);
      }
      
      // 상태 필터
      if (statusFilter && statusFilter !== '') {
        console.log('상태 필터 적용:', statusFilter);
        url.searchParams.append('statusCode', statusFilter);
      }
      
      console.log('API 요청 URL:', url.toString());
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`시설물 이동 이력을 불러오는데 실패했습니다. 상태 코드: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('응답 데이터 개수:', data.length);

      // 백엔드 필터링이 작동하지 않는 경우 프론트엔드에서 필터링 수행
      let filteredData = [...data];
      
      // 프론트엔드에서 시설물 유형 필터링 (백엔드가 처리하지 않는 경우)
      if (facilityTypeFilter && facilityTypeFilter !== '') {
        console.log('프론트엔드에서 시설물 유형 필터링 수행:', facilityTypeFilter);
        filteredData = filteredData.filter(
          item => item.facilityTypeName === facilityTypeFilter
        );
        console.log('필터링 후 데이터 개수:', filteredData.length);
      }
      
      // 프론트엔드에서 트랜잭션 유형 필터링 (백엔드가 처리하지 않는 경우)
      if (transactionTypeFilter && transactionTypeFilter !== '') {
        console.log('프론트엔드에서 트랜잭션 유형 필터링 수행:', transactionTypeFilter);
        filteredData = filteredData.filter(
          item => item.transactionTypeName === transactionTypeFilter
        );
        console.log('필터링 후 데이터 개수:', filteredData.length);
      }
      
      setFacilityTransactions(filteredData);
      setPage(0); // 페이지 초기화
    } catch (error) {
      console.error('시설물 이동 이력 로드 실패:', error);
      showSnackbar('시설물 이동 이력을 불러오는데 실패했습니다.', 'error');
      setFacilityTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // 자산 회계 이력 데이터 로드
  const fetchVoucherTransactions = async () => {
    setLoading(true);
    try {
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');
      
      const url = new URL('http://localhost:8080/api/vouchers/all');
      
      // 날짜 범위 추가
      url.searchParams.append('startDate', startDateStr);
      url.searchParams.append('endDate', endDateStr);
      
      // 키워드 검색
      if (searchKeyword && searchKeyword.trim() !== '') {
        url.searchParams.append('keyword', searchKeyword.trim());
      }
      
      // 시설물 유형 필터 - facilityTypeName 사용
      if (facilityTypeFilter && facilityTypeFilter !== '') {
        console.log('시설물 유형 필터 적용:', facilityTypeFilter);
        url.searchParams.append('facilityTypeName', facilityTypeFilter);
      }
      
      console.log('API 요청 URL:', url.toString());
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`자산 회계 이력을 불러오는데 실패했습니다. 상태 코드: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('응답 데이터 개수:', data.length);
      setVoucherTransactions(data);
      setPage(0); // 페이지 초기화
    } catch (error) {
      console.error('자산 회계 이력 로드 실패:', error);
      showSnackbar('자산 회계 이력을 불러오는데 실패했습니다.', 'error');
      setVoucherTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // 감가상각 이력 데이터 로드
  const fetchDepreciationHistory = async () => {
    setLoading(true);
    try {
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');
      
      const url = new URL('http://localhost:8080/api/depreciations');
      
      // 날짜 범위 추가
      url.searchParams.append('startDate', startDateStr);
      url.searchParams.append('endDate', endDateStr);
      
      // 키워드 검색
      if (searchKeyword && searchKeyword.trim() !== '') {
        url.searchParams.append('keyword', searchKeyword.trim());
      }
      
      // 시설물 유형 필터 - facilityTypeName 사용
      if (facilityTypeFilter && facilityTypeFilter !== '') {
        console.log('시설물 유형 필터 적용:', facilityTypeFilter);
        url.searchParams.append('facilityTypeName', facilityTypeFilter);
      }
      
      console.log('API 요청 URL:', url.toString());
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`감가상각 이력을 불러오는데 실패했습니다. 상태 코드: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('응답 데이터 개수:', data.length);
      setDepreciationHistory(data);
      setPage(0); // 페이지 초기화
    } catch (error) {
      console.error('감가상각 이력 로드 실패:', error);
      showSnackbar('감가상각 이력을 불러오는데 실패했습니다.', 'error');
      setDepreciationHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // 탭 변경 핸들러
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // 페이지 변경 핸들러
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // 페이지당 행 수 변경 핸들러
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 검색 핸들러
  const handleSearch = () => {
    console.log('검색 실행 - 필터 값들:', {
      facilityTypeFilter,
      transactionTypeFilter,
      statusFilter,
      searchKeyword,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    });
    
    if (tabValue === 0) {
      fetchFacilityTransactions();
    } else if (tabValue === 1) {
      fetchVoucherTransactions();
    } else if (tabValue === 2) {
      fetchDepreciationHistory();
    }
  };

  // 필터 초기화 핸들러
  const handleResetFilters = () => {
    setStartDate(subMonths(new Date(), 3));
    setEndDate(new Date());
    setSearchKeyword('');
    setFacilityTypeFilter('');
    setStatusFilter('');
    setTransactionTypeFilter('');
    console.log('필터 초기화 완료');
  };

  // 스낵바 메시지 표시 함수
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // 스낵바 닫기 핸들러
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // 필터 선택 이벤트 핸들러
  const handleFacilityTypeChange = (e) => {
    const value = e.target.value;
    console.log('시설물 유형 선택됨:', value);
    setFacilityTypeFilter(value);
  };

  const handleTransactionTypeChange = (e) => {
    const value = e.target.value;
    console.log('트랜잭션 유형 선택됨:', value);
    setTransactionTypeFilter(value);
  };

  // 행 확장 토글 핸들러
  const handleRowExpand = (voucherId) => {
    setExpandedRow(expandedRow === voucherId ? null : voucherId);
  };

  // 검색 필터 UI 렌더링
  const renderSearchFilters = () => (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6} md={3}>
          <DatePicker
            label="시작일"
            value={startDate}
            onChange={(newValue) => setStartDate(newValue)}
            slotProps={{ textField: { fullWidth: true, size: "small" } }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DatePicker
            label="종료일"
            value={endDate}
            onChange={(newValue) => setEndDate(newValue)}
            slotProps={{ textField: { fullWidth: true, size: "small" } }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>시설물 유형</InputLabel>
            <Select
              value={facilityTypeFilter}
              onChange={(e) => {
                const selectedValue = e.target.value;
                console.log('시설물 유형 선택됨:', selectedValue);
                setFacilityTypeFilter(selectedValue);
              }}
              label="시설물 유형"
            >
              <MenuItem value="">전체</MenuItem>
              {facilityTypes.map((type) => (
                <MenuItem key={type.codeId} value={type.codeName}>
                  {type.codeName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        {tabValue === 0 && (
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>유형</InputLabel>
              <Select
                value={transactionTypeFilter}
                onChange={(e) => {
                  const selectedValue = e.target.value;
                  console.log('트랜잭션 유형 선택됨:', selectedValue);
                  setTransactionTypeFilter(selectedValue);
                }}
                label="유형"
              >
                <MenuItem value="">전체</MenuItem>
                {transactionTypes.map((type) => (
                  <MenuItem key={type.codeId} value={type.codeName}>
                    {type.codeName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}
        <Grid item xs={12} sm={6} md={tabValue === 0 ? 2 : 4}>
          <TextField
            label="검색어"
            fullWidth
            size="small"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleSearch}>
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} display="flex" justifyContent="flex-end">
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />}
            onClick={handleResetFilters}
            sx={{ mr: 1 }}
          >
            필터 초기화
          </Button>
          <Button 
            variant="contained" 
            startIcon={<SearchIcon />}
            onClick={handleSearch}
          >
            검색
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );

  // 시설물 이동 이력 테이블 렌더링
  const renderFacilityTransactionTable = () => {
    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - facilityTransactions.length) : 0;
    
    return (
      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 1200, tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell width={60} sx={{ px: 2 }}>번호</TableCell>
                <TableCell width={200} sx={{ px: 2 }}>시설물 정보</TableCell>
                <TableCell width={100} sx={{ px: 2 }}>유형</TableCell>
                <TableCell width={150} sx={{ px: 2 }}>변경 전/후 상태</TableCell>
                <TableCell width={120} sx={{ px: 2 }}>출발 회사</TableCell>
                <TableCell width={120} sx={{ px: 2 }}>도착 회사</TableCell>
                <TableCell width={120} sx={{ px: 2 }}>처리일자</TableCell>
                <TableCell width={100} sx={{ px: 2 }}>처리자</TableCell>
                <TableCell width={150} sx={{ px: 2 }}>비고</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" sx={{ mt: 2 }}>데이터를 불러오는 중입니다...</Typography>
                  </TableCell>
                </TableRow>
              ) : facilityTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2">데이터가 없습니다.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                (rowsPerPage > 0
                  ? facilityTransactions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  : facilityTransactions
                ).map((transaction, index) => (
                  <TableRow key={transaction.transactionId}>
                    <TableCell sx={{ px: 2, whiteSpace: 'nowrap' }}>
                      {page * rowsPerPage + index + 1}
                    </TableCell>
                    <TableCell sx={{ px: 2 }}>
                      <Box>
                        <Typography variant="body2">{transaction.facilityTypeName}</Typography>
                        <Typography variant="caption" color="text.secondary">품목: {transaction.facilityModelNumber}<br/></Typography>
                        <Typography variant="caption" color="text.secondary">관리번호: {transaction.managementNumber}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ px: 2, whiteSpace: 'nowrap' }}>
                      {transaction.transactionTypeName}
                    </TableCell>
                    <TableCell sx={{ px: 2, whiteSpace: 'nowrap' }}>
                      {transaction.statusBeforeName && transaction.statusAfterName 
                        ? `${transaction.statusBeforeName} → ${transaction.statusAfterName}` 
                        : '-'}
                    </TableCell>
                    <TableCell sx={{ px: 2, whiteSpace: 'nowrap' }}>{transaction.fromCompanyName || '-'}</TableCell>
                    <TableCell sx={{ px: 2, whiteSpace: 'nowrap' }}>{transaction.toCompanyName || '-'}</TableCell>
                    <TableCell sx={{ px: 2, whiteSpace: 'nowrap' }}>{formatDate(transaction.transactionDate)}</TableCell>
                    <TableCell sx={{ px: 2, whiteSpace: 'nowrap' }}>{transaction.performedByName || transaction.createdByName}</TableCell>
                    <TableCell sx={{ px: 2, whiteSpace: 'nowrap' }}>{transaction.notes || '-'}</TableCell>
                  </TableRow>
                ))
              )}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={9} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={facilityTransactions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="행 수:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
        />
      </Paper>
    );
  };

  // 자산 회계 이력 테이블 렌더링
  const renderVoucherTransactionTable = () => {
    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - voucherTransactions.length) : 0;
    
    return (
      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 1200, tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell width={60} sx={{ px: 2 }}>번호</TableCell>
                <TableCell width={150} sx={{ px: 2 }}>전표번호</TableCell>
                <TableCell width={100} sx={{ px: 2 }}>유형</TableCell>
                <TableCell width={200} sx={{ px: 2 }}>시설물 정보</TableCell>
                <TableCell width={120} sx={{ px: 2 }}>금액</TableCell>
                <TableCell width={120} sx={{ px: 2 }}>처리일자</TableCell>
                <TableCell width={100} sx={{ px: 2 }}>처리자</TableCell>
                <TableCell width={250} sx={{ px: 2 }}>설명</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" sx={{ mt: 2 }}>데이터를 불러오는 중입니다...</Typography>
                  </TableCell>
                </TableRow>
              ) : voucherTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2">데이터가 없습니다.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                (rowsPerPage > 0
                  ? voucherTransactions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  : voucherTransactions
                ).map((voucher, index) => (
                  <React.Fragment key={voucher.voucherId}>
                    <TableRow 
                      onClick={() => handleRowExpand(voucher.voucherId)}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: '#f5f5f5' },
                        backgroundColor: expandedRow === voucher.voucherId ? '#f0f7ff' : 'inherit'
                      }}
                    >
                      <TableCell sx={{ px: 2, whiteSpace: 'nowrap' }}>{page * rowsPerPage + index + 1}</TableCell>
                      <TableCell sx={{ px: 2, whiteSpace: 'nowrap' }}>{voucher.voucherNumber}</TableCell>
                      <TableCell sx={{ px: 2, whiteSpace: 'nowrap' }}>{voucher.voucherTypeName}</TableCell>
                      <TableCell sx={{ px: 2 }}>
                        <Box>
                          <Typography variant="body2">{voucher.facilityTypeName}</Typography>
                          <Typography variant="caption" color="text.secondary">품목: {voucher.facilityModelNumber}<br/></Typography>
                          <Typography variant="caption" color="text.secondary">관리번호: {voucher.facilityManagementNumber}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ px: 2, whiteSpace: 'nowrap', textAlign: 'right' }}>{formatCurrency(voucher.totalAmount)}</TableCell>
                      <TableCell sx={{ px: 2, whiteSpace: 'nowrap' }}>{formatDate(voucher.transactionDate)}</TableCell>
                      <TableCell sx={{ px: 2, whiteSpace: 'nowrap' }}>{voucher.createdBy}</TableCell>
                      <TableCell sx={{ px: 2 }}>{voucher.description || '-'}</TableCell>
                    </TableRow>
                    {expandedRow === voucher.voucherId && (
                      <TableRow>
                        <TableCell colSpan={8} sx={{ py: 0, px: 0 }}>
                          <Box sx={{ p: 2, backgroundColor: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>
                              차변/대변 항목
                            </Typography>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ '& th': { fontWeight: 'medium', py: 1 } }}>
                                  <TableCell width="15%">유형</TableCell>
                                  <TableCell width="15%">계정코드</TableCell>
                                  <TableCell width="25%">계정명</TableCell>
                                  <TableCell width="15%" align="right">금액</TableCell>
                                  <TableCell width="30%">설명</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {voucher.items?.map((item) => (
                                  <TableRow key={item.itemId}>
                                    <TableCell>{item.debit ? "차변" : "대변"}</TableCell>
                                    <TableCell>{item.accountCode}</TableCell>
                                    <TableCell>{item.accountName}</TableCell>
                                    <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
                                    <TableCell>{item.description}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={8} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={voucherTransactions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="행 수:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
        />
      </Paper>
    );
  };

  // 감가상각 이력 테이블 렌더링
  const renderDepreciationHistoryTable = () => {
    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - depreciationHistory.length) : 0;
    
    return (
      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 1200, tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell width={60} sx={{ px: 2 }}>번호</TableCell>
                <TableCell width={200} sx={{ px: 2 }}>시설물 정보</TableCell>
                <TableCell width={100} sx={{ px: 2 }}>상각 방법</TableCell>
                <TableCell width={100} sx={{ px: 2 }}>상각 유형</TableCell>
                <TableCell width={120} sx={{ px: 2 }}>처리일자</TableCell>
                <TableCell width={120} sx={{ px: 2 }}>이전 가치</TableCell>
                <TableCell width={120} sx={{ px: 2 }}>상각 금액</TableCell>
                <TableCell width={120} sx={{ px: 2 }}>현재 가치</TableCell>
                <TableCell width={100} sx={{ px: 2 }}>회계연도</TableCell>
                <TableCell width={120} sx={{ px: 2 }}>위치</TableCell>
                <TableCell width={100} sx={{ px: 2 }}>처리자</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" sx={{ mt: 2 }}>데이터를 불러오는 중입니다...</Typography>
                  </TableCell>
                </TableRow>
              ) : depreciationHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2">데이터가 없습니다.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                (rowsPerPage > 0
                  ? depreciationHistory.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  : depreciationHistory
                ).map((depreciation, index) => (
                  <TableRow key={depreciation.depreciationId}>
                    <TableCell sx={{ px: 2, whiteSpace: 'nowrap' }}>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell sx={{ px: 2 }}>
                      <Box>
                        <Typography variant="body2">{depreciation.facilityName}</Typography>
                        <Typography variant="caption" color="text.secondary">품목: {depreciation.modelNumber}<br/></Typography>
                        <Typography variant="caption" color="text.secondary">관리번호: {depreciation.managementNumber}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ px: 2, whiteSpace: 'nowrap' }}>{depreciation.depreciationMethodName}</TableCell>
                    <TableCell sx={{ px: 2, whiteSpace: 'nowrap' }}>{depreciation.depreciationTypeName}</TableCell>
                    <TableCell sx={{ px: 2, whiteSpace: 'nowrap' }}>{formatDate(depreciation.depreciationDate)}</TableCell>
                    <TableCell sx={{ px: 2, whiteSpace: 'nowrap', textAlign: 'right' }}>{formatCurrency(depreciation.previousValue)}</TableCell>
                    <TableCell sx={{ px: 2, whiteSpace: 'nowrap', textAlign: 'right' }}>{formatCurrency(depreciation.depreciationAmount)}</TableCell>
                    <TableCell sx={{ px: 2, whiteSpace: 'nowrap', textAlign: 'right' }}>{formatCurrency(depreciation.currentValue)}</TableCell>
                    <TableCell sx={{ px: 2, whiteSpace: 'nowrap' }}>{depreciation.fiscalYear}년 {depreciation.fiscalMonth}월</TableCell>
                    <TableCell sx={{ px: 2, whiteSpace: 'nowrap' }}>{depreciation.locationCompanyName}</TableCell>
                    <TableCell sx={{ px: 2, whiteSpace: 'nowrap' }}>{depreciation.createdByName}</TableCell>
                  </TableRow>
                ))
              )}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={11} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={depreciationHistory.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="행 수:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
        />
      </Paper>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        시설물 이력 관리
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="시설물 이동 이력" {...a11yProps(0)} />
          <Tab label="자산 회계 이력" {...a11yProps(1)} />
          <Tab label="감가상각 이력" {...a11yProps(2)} />
        </Tabs>
      </Paper>

      {renderSearchFilters()}

      <TabPanel value={tabValue} index={0}>
        {renderFacilityTransactionTable()}
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        {renderVoucherTransactionTable()}
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        {renderDepreciationHistoryTable()}
      </TabPanel>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FacilityHistoryPage; 