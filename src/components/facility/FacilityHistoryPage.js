import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
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
  Alert,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { 
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CalendarToday as CalendarIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { format, subMonths } from 'date-fns';
import DateRangeCalendar, { DateRangeButton } from '../calendar/Calendar';
import { useAuth } from '../../contexts/AuthContext';

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
  const { user: authUser } = useAuth();
  const isUserRole = authUser?.role === 'USER';
  
  // 페이지네이션 상태
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // 검색 필터 상태
  const [startDate, setStartDate] = useState(null); // 초기값 null로 변경
  const [endDate, setEndDate] = useState(null); // 초기값 null로 변경
  const [searchKeyword, setSearchKeyword] = useState('');
  const [facilityTypeFilter, setFacilityTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('');
  
  // 데이터 상태
  const [facilityTransactions, setFacilityTransactions] = useState([]);
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

  // 날짜 필터 상태
  const [isDateFilterActive, setIsDateFilterActive] = useState(false); // 초기값은 비활성화 상태로 변경
  const [showDatePicker, setShowDatePicker] = useState(false);

  // 모든 시설물 이동 이력 데이터
  const [allFacilityTransactions, setAllFacilityTransactions] = useState([]);
  
  // 트랜잭션 취소 관련 상태 추가
  const [cancellationDialogOpen, setCancellationDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancellationProcessing, setCancellationProcessing] = useState(false);
  
  // 필터링된 데이터 계산 (useMemo 사용)
  const filteredFacilityTransactions = useMemo(() => {
    // USER 권한인 경우 먼저 회사 ID 필터링 적용
    let filteredData = [...allFacilityTransactions];
    
    if (isUserRole && authUser?.companyId) {
      const userCompanyId = Number(authUser.companyId);
      filteredData = filteredData.filter(transaction => 
        transaction.fromCompanyId === userCompanyId || 
        transaction.toCompanyId === userCompanyId
      );
    }
    
    // 검색어, 시설물 유형, 이력 유형에 따라 데이터 필터링
    return filteredData.filter(transaction => {
      // 검색어 필터링 (관리번호, 시설물 유형, 브랜드명, 업체명에서 검색)
      const matchesKeyword = searchKeyword === '' || 
        (transaction.managementNumber && transaction.managementNumber.toLowerCase().includes(searchKeyword.toLowerCase())) ||
        (transaction.facilityTypeName && transaction.facilityTypeName.toLowerCase().includes(searchKeyword.toLowerCase())) ||
        (transaction.brandCodeName && transaction.brandCodeName.toLowerCase().includes(searchKeyword.toLowerCase())) ||
        (transaction.fromCompanyName && transaction.fromCompanyName.toLowerCase().includes(searchKeyword.toLowerCase())) ||
        (transaction.toCompanyName && transaction.toCompanyName.toLowerCase().includes(searchKeyword.toLowerCase())) ||
        (transaction.notes && transaction.notes.toLowerCase().includes(searchKeyword.toLowerCase())) ||
        (transaction.transactionTypeName && transaction.transactionTypeName.toLowerCase().includes(searchKeyword.toLowerCase())) ||
        (transaction.performedByName && transaction.performedByName.toLowerCase().includes(searchKeyword.toLowerCase())) ||
        (transaction.createdByName && transaction.createdByName.toLowerCase().includes(searchKeyword.toLowerCase()));

      // 시설물 유형 필터링 - 여러 방식 비교
      const matchesFacilityType = facilityTypeFilter === '' || 
        transaction.facilityTypeCode === facilityTypeFilter || 
        (transaction.facilityTypeName && facilityTypes.find(type => type.codeId === facilityTypeFilter)?.codeName === transaction.facilityTypeName);
      
      // 이력 유형 필터링
      const matchesTransactionType = transactionTypeFilter === '' || 
        transaction.transactionTypeCode === transactionTypeFilter;
      
      // 상태 필터링
      const matchesStatus = statusFilter === '' || 
        transaction.statusAfterCode === statusFilter;
        
      // 날짜 범위 필터링
      let matchesDateRange = true;
      if (isDateFilterActive && startDate && endDate) {
        const transactionDate = transaction.transactionDate ? new Date(transaction.transactionDate) : null;
        if (transactionDate) {
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59);
          
          const startOfDay = new Date(startDate);
          startOfDay.setHours(0, 0, 0);
          
          matchesDateRange = transactionDate >= startOfDay && transactionDate <= endOfDay;
        } else {
          matchesDateRange = false;
        }
      }

      return matchesKeyword && matchesFacilityType && matchesTransactionType && matchesStatus && matchesDateRange;
    });
  }, [allFacilityTransactions, searchKeyword, facilityTypeFilter, transactionTypeFilter, statusFilter, startDate, endDate, isDateFilterActive, facilityTypes, isUserRole, authUser]);

  // 현재 페이지에 표시할 데이터
  const paginatedFacilityTransactions = useMemo(() => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredFacilityTransactions.slice(startIndex, endIndex);
  }, [filteredFacilityTransactions, page, rowsPerPage]);
  
  // 초기 데이터 로딩
  useEffect(() => {
    fetchCodes();
    fetchAllFacilityTransactions();
  }, []);

  // 코드 데이터 로드
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
        setTransactionTypes(transactionTypeData);
      } else {
        console.error('트랜잭션 타입 코드 로드 실패:', transactionTypeResponse.status);
      }
    } catch (error) {
      console.error('코드 데이터 로드 실패:', error);
      showSnackbar('코드 데이터를 불러오는데 실패했습니다.', 'error');
    }
  };

  // 모든 시설물 이동 이력 데이터 로드
  const fetchAllFacilityTransactions = async () => {
    setLoading(true);
    try {
      // API 요청 - 날짜 필터 제거
      const url = new URL('http://localhost:8080/api/facility-transactions');
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`시설물 이동 이력을 불러오는데 실패했습니다. 상태 코드: ${response.status}`);
      }
      
      const data = await response.json();
      
      setAllFacilityTransactions(data);
      setPage(0); // 데이터 로드 후 첫 페이지로 이동
    } catch (error) {
      console.error('시설물 이동 이력 로드 실패:', error);
      showSnackbar('시설물 이동 이력을 불러오는데 실패했습니다.', 'error');
      setAllFacilityTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // 필터링된 데이터가 변경될 때마다 페이지네이션 정보 업데이트 - 더 이상 필요 없음
  
  // 페이지 변경 핸들러
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    // 페이지 변경 시 스크롤을 상단으로 이동
    const tableContainer = document.querySelector('.MuiTableContainer-root');
    if (tableContainer) {
      tableContainer.scrollTop = 0;
    }
  };
  
  // 페이지당 행 수 변경 핸들러
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 필터 초기화 핸들러
  const handleResetFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setSearchKeyword('');
    setFacilityTypeFilter('');
    setStatusFilter('');
    setTransactionTypeFilter('');
    setIsDateFilterActive(false);
    setPage(0); // 페이지 초기화
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
    setFacilityTypeFilter(value);
    setPage(0); // 페이지 초기화
  };

  const handleTransactionTypeChange = (e) => {
    const value = e.target.value;
    setTransactionTypeFilter(value);
    setPage(0); // 페이지 초기화
  };
  
  // 검색어 변경 핸들러
  const handleSearchKeywordChange = (e) => {
    const value = e.target.value;
    setSearchKeyword(value);
    setPage(0); // 페이지 초기화
  };
  
  // 날짜 변경 핸들러
  const handleDateRangeChange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
    setIsDateFilterActive(true);
    setPage(0); // 페이지 초기화
  };
  
  // 날짜 필터 초기화
  const handleResetDateFilter = () => {
    setStartDate(null);
    setEndDate(null);
    setIsDateFilterActive(false);
    setShowDatePicker(false);
    setPage(0);
  };
  
  // 선택된 날짜 표시 텍스트
  const getDateRangeText = () => {
    if (!isDateFilterActive || !startDate || !endDate) return '전체';
    
    try {
      return `${format(startDate, 'yy-MM-dd')} ~ ${format(endDate, 'yy-MM-dd')}`;
    } catch (error) {
      console.error('날짜 형식 오류:', error);
      return '전체';
    }
  };

  // 행 확장 토글 핸들러
  const handleRowExpand = (voucherId) => {
    setExpandedRow(expandedRow === voucherId ? null : voucherId);
  };

  // 트랜잭션 취소 다이얼로그 열기 핸들러
  const handleOpenCancellationDialog = (transaction) => {
    setSelectedTransaction(transaction);
    setCancellationDialogOpen(true);
    setCancellationReason('');
  };

  // 트랜잭션 취소 다이얼로그 닫기 핸들러
  const handleCloseCancellationDialog = () => {
    setCancellationDialogOpen(false);
    setSelectedTransaction(null);
    setCancellationReason('');
  };

  // 취소 이유 변경 핸들러
  const handleCancellationReasonChange = (e) => {
    setCancellationReason(e.target.value);
  };

  // 트랜잭션 취소 요청 제출 핸들러
  const handleSubmitCancellation = async () => {
    if (!selectedTransaction || !cancellationReason.trim()) {
      showSnackbar('취소 이유를 입력해주세요.', 'warning');
      return;
    }

    setCancellationProcessing(true);
    
    try {
      const response = await fetch(`http://localhost:8080/api/facility-transactions/cancel/${selectedTransaction.transactionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: cancellationReason
        })
      });

      if (!response.ok) {
        throw new Error('트랜잭션 취소에 실패했습니다.');
      }

      const result = await response.json();
      
      showSnackbar('트랜잭션이 성공적으로 취소되었습니다.', 'success');
      
      // 취소 후 목록 갱신
      fetchAllFacilityTransactions();
      
      // 다이얼로그 닫기
      handleCloseCancellationDialog();
    } catch (error) {
      console.error('트랜잭션 취소 실패:', error);
      showSnackbar('트랜잭션 취소 처리 중 오류가 발생했습니다.', 'error');
    } finally {
      setCancellationProcessing(false);
    }
  };

  // 검색 필터 UI 렌더링
  const renderSearchFilters = () => (
    <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end', justifyContent: 'space-between' }}>
      {/* 검색어 필드 */}
      <Box sx={{ flex: 1, minWidth: '200px' }}>
        <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
          검색
        </Typography>
        <TextField
          placeholder="시설물 정보, 이력 유형, 업체명 검색"
          value={searchKeyword}
          onChange={handleSearchKeywordChange}
          size="small"
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
      
      <Box sx={{ display: 'flex', gap: 2 }}>
        {/* 시설물 유형 필터 */}
        <Box sx={{ width: '150px' }}>
          <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
            시설물 유형
          </Typography>
          <FormControl 
            fullWidth 
            size="small"
            sx={{ backgroundColor: 'white' }}
          >
            <Select
              value={facilityTypeFilter}
              onChange={handleFacilityTypeChange}
              displayEmpty
              sx={{
                height: '40px',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#E0E0E0',
                },
              }}
            >
              <MenuItem value="">모든 유형</MenuItem>
              {facilityTypes.map((type) => (
                <MenuItem key={type.codeId} value={type.codeId}>
                  {type.codeName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        {/* 이력 유형 필터 */}
        <Box sx={{ width: '150px' }}>
          <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
            이력 유형
          </Typography>
          <FormControl 
            fullWidth 
            size="small"
            sx={{ backgroundColor: 'white' }}
          >
            <Select
              value={transactionTypeFilter}
              onChange={handleTransactionTypeChange}
              displayEmpty
              sx={{
                height: '40px',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#E0E0E0',
                },
              }}
            >
              <MenuItem value="">모든 유형</MenuItem>
              {transactionTypes.map((type) => (
                <MenuItem key={type.codeId} value={type.codeId}>
                  {type.codeName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        {/* 날짜 범위 필터 */}
        <Box sx={{ width: '150px' }}>
          <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
            요청일자
          </Typography>
          <DateRangeButton 
            startDate={startDate}
            endDate={endDate}
            isActive={isDateFilterActive}
            onClick={() => setShowDatePicker(true)}
            getDateRangeText={getDateRangeText}
            buttonProps={{
              sx: {
                backgroundColor: isDateFilterActive ? 'rgba(25, 118, 210, 0.08)' : 'rgba(249, 249, 249, 0.87)',
                width: '100%',
                height: '40px',
                color: isDateFilterActive ? '#1976d2' : 'rgba(30, 30, 30, 0.87)',
                borderColor: isDateFilterActive ? '#1976d2' : '#E0E0E0',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
              }
            }}
          />
          <DateRangeCalendar
            startDate={startDate}
            endDate={endDate}
            onDateChange={handleDateRangeChange}
            open={showDatePicker}
            onClose={() => setShowDatePicker(false)}
            onApply={() => setShowDatePicker(false)}
            onReset={handleResetDateFilter}
          />
        </Box>
      </Box>
    </Box>
  );

  // 시설물 이동 이력 테이블 렌더링
  const renderFacilityTransactionTable = () => {
    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredFacilityTransactions.length) : 0;
    
    return (
      <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden' }}>
        <TableContainer sx={{ overflowX: 'auto', maxHeight: '600px' }}>
          <Table sx={{ minWidth: 1400, tableLayout: 'fixed' }} stickyHeader>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell width={50} sx={{ px: 2 }}>No.</TableCell>
                <TableCell width={180} sx={{ px: 2 }}>시설물 정보</TableCell>
                <TableCell width={100} sx={{ px: 2 }}>유형</TableCell>
                <TableCell width={140} sx={{ px: 2 }}>변경 전/후 상태</TableCell>
                <TableCell width={120} sx={{ px: 2 }}>출발 수탁업체명</TableCell>
                <TableCell width={120} sx={{ px: 2 }}>도착 수탁업체명</TableCell>
                <TableCell width={120} sx={{ px: 2 }}>처리일자</TableCell>
                <TableCell width={90} sx={{ px: 2 }}>처리자</TableCell>
                <TableCell width={140} sx={{ px: 2 }}>비고</TableCell>
                <TableCell width={120} sx={{ px: 2, textAlign: 'center' }}>행동</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" sx={{ mt: 2 }}>데이터를 불러오는 중입니다...</Typography>
                  </TableCell>
                </TableRow>
              ) : filteredFacilityTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2">데이터가 없습니다.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedFacilityTransactions.map((transaction, index) => (
                  <TableRow 
                    key={transaction.transactionId} 
                    hover
                    sx={{ 
                      ...(transaction.isCancelled && {
                        backgroundColor: '#f9f9f9',
                        opacity: 0.8,
                        '& td': {
                          position: 'relative',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: '50%',
                            height: '1px',
                            backgroundColor: '#e57373',
                            zIndex: 1
                          }
                        }
                      })
                    }}
                  >
                    <TableCell sx={{ px: 2, whiteSpace: 'nowrap' }}>
                      {filteredFacilityTransactions.length - (page * rowsPerPage + index)}
                    </TableCell>
                    <TableCell sx={{ px: 2 }}>
                      <Box>
                        <Typography variant="body2" noWrap>{transaction.facilityTypeName}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>품목: {transaction.brandCodeName}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>관리번호: {transaction.managementNumber}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ px: 2, whiteSpace: 'nowrap' }}>
                      {transaction.transactionTypeName}
                      {transaction.isCancelled && (
                        <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                          취소됨
                        </Typography>
                      )}
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
                    <TableCell sx={{ px: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {transaction.notes || '-'}
                      {transaction.isCancelled && transaction.cancellationReason && (
                        <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                          취소 사유: {transaction.cancellationReason}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ px: 2, textAlign: 'center' }}>
                      {/* 취소 버튼 - 취소되지 않은 트랜잭션에만 표시 */}
                      {!transaction.isCancelled && (
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCancellationDialog(transaction);
                          }}
                          startIcon={<DeleteIcon />}
                          sx={{ 
                            py: 0.5, 
                            fontSize: '0.75rem',
                            minWidth: '80px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          취소
                        </Button>
                      )}
                      {transaction.isCancelled && (
                        <Chip 
                          label="취소됨" 
                          size="small" 
                          color="default"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={10} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredFacilityTransactions.length}
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
    <Box sx={{ p: 3, backgroundColor: '#F8F8FE', minHeight: '100vh' }}>
      {/* 상단 헤더 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#3A3A3A' }}>
          시설물 이력 관리
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
        {/* 검색 필터 */}
        {renderSearchFilters()}
        
        {/* 필터 초기화 버튼 */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleResetFilters}
            sx={{
              color: '#666',
              borderColor: '#ccc',
              '&:hover': {
                borderColor: '#1976d2',
                color: '#1976d2'
              }
            }}
          >
            검색조건 초기화
          </Button>
        </Box>

        {/* 시설물 이동 이력 테이블 */}
        {renderFacilityTransactionTable()}
      </Box>

      {/* 트랜잭션 취소 다이얼로그 */}
      <Dialog
        open={cancellationDialogOpen}
        onClose={!cancellationProcessing ? handleCloseCancellationDialog : undefined}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>행동이력 취소</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {selectedTransaction && (
              <Box>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  다음 행동이력을 취소하시겠습니까?
                </Typography>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">시설물 정보:</Typography>
                  <Typography variant="body2">
                    {selectedTransaction.facilityTypeName} - {selectedTransaction.brandCodeName} (관리번호: {selectedTransaction.managementNumber})
                  </Typography>
                </Box>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">유형:</Typography>
                  <Typography variant="body2">{selectedTransaction.transactionTypeName}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">처리일자:</Typography>
                  <Typography variant="body2">
                    {formatDate(selectedTransaction.transactionDate)}
                  </Typography>
                </Box>
              </Box>
            )}
            <Typography variant="body2" sx={{ color: 'error.main', mb: 2 }}>
              이 작업은 취소할 수 없습니다. 취소 이유를 입력해주세요.
            </Typography>
          </DialogContentText>
          
          <TextField
            autoFocus
            label="취소 이유"
            multiline
            rows={3}
            fullWidth
            value={cancellationReason}
            onChange={handleCancellationReasonChange}
            variant="outlined"
            placeholder="취소 이유를 입력해주세요"
            disabled={cancellationProcessing}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseCancellationDialog} 
            color="inherit" 
            disabled={cancellationProcessing}
          >
            취소
          </Button>
          <Button 
            onClick={handleSubmitCancellation} 
            color="error" 
            variant="contained" 
            startIcon={cancellationProcessing ? <CircularProgress size={18} color="inherit" /> : null}
            disabled={cancellationProcessing || !cancellationReason.trim()}
            sx={{ boxShadow: 'none' }}
          >
            {cancellationProcessing ? "처리 중..." : "확인"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 알림 스낵바 */}
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