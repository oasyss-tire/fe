import React, { useState, useEffect } from 'react';
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
  Button,
  Grid,
  TextField,
  InputAdornment,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Tabs,
  Tab,
  Chip
} from '@mui/material';
import { 
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { format, getYear, getMonth, getDaysInMonth } from 'date-fns';
import { ko } from 'date-fns/locale';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import FacilityCompanySelectDialog from './FacilityCompanySelectDialog';

const ClosingManagementPage = () => {
  // 상태 관리
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [dailyClosingStatus, setDailyClosingStatus] = useState([]);
  const [monthlyClosingStatus, setMonthlyClosingStatus] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMonthForClosing, setSelectedMonthForClosing] = useState(null);
  const [recalculateDialogOpen, setRecalculateDialogOpen] = useState(false);
  const [dateForRecalculation, setDateForRecalculation] = useState(null);
  
  // 탭 관리
  const [tabValue, setTabValue] = useState(0); // 0: 일마감, 1: 월마감
  
  // 알림 스낵바
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // 탭 변경 핸들러
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setSelectedDate(null);
  };
  
  // 월별 일마감 상태 조회
  const fetchDailyClosingStatusByMonth = async () => {
    setLoading(true);
    setDailyClosingStatus([]);
    
    try {
      const url = `http://localhost:8080/api/v1/inventory/daily-closing-status-by-month?year=${selectedYear}&month=${selectedMonth}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('일마감 상태를 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      // 날짜 순으로 정렬
      const sortedData = (data.data || []).sort((a, b) => {
        return a.dayOfMonth - b.dayOfMonth;
      });
      
      setDailyClosingStatus(sortedData);
      
      if (sortedData.length === 0) {
        showSnackbar('선택한 월에 일마감 데이터가 없습니다.', 'info');
      }
    } catch (error) {
      console.error('일마감 상태 조회 실패:', error);
      showSnackbar('일마감 상태를 불러오는데 실패했습니다.', 'error');
      setDailyClosingStatus([]);
    } finally {
      setLoading(false);
    }
  };
  
  // 일마감 처리 함수
  const executeDailyClosing = async (date) => {
    if (!date) {
      showSnackbar('마감일자를 선택해주세요.', 'warning');
      return;
    }
    
    setLoading(true);
    showSnackbar('마감 처리 중입니다. 약 1분 정도 소요될 수 있습니다.', 'info');
    
    try {
      const formattedDate = format(new Date(date), 'yyyy-MM-dd');
      const url = `http://localhost:8080/api/v1/inventory/daily-closing-grouped?closingDate=${formattedDate}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('일마감 처리에 실패했습니다.');
      }
      
      showSnackbar('일마감 처리가 완료되었습니다.', 'success');
      // 마감 상태 갱신
      fetchDailyClosingStatusByMonth();
      setSelectedDate(null);
    } catch (error) {
      console.error('일마감 처리 실패:', error);
      showSnackbar('일마감 처리에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // 월 선택 핸들러
  const handleMonthChange = (date) => {
    if (date) {
      setSelectedYear(getYear(date));
      setSelectedMonth(getMonth(date) + 1);
    }
    setShowMonthPicker(false);
  };
  
  // 연간 월마감 상태 조회
  const fetchMonthlyClosingStatusByYear = async () => {
    setLoading(true);
    setMonthlyClosingStatus([]);
    
    try {
      const url = `http://localhost:8080/api/v1/inventory/monthly-closing-status-by-year?year=${selectedYear}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('월마감 상태를 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      // 월 순으로 정렬
      const sortedData = (data.data || []).sort((a, b) => {
        return a.month - b.month;
      });
      
      setMonthlyClosingStatus(sortedData);
      
      if (sortedData.length === 0) {
        showSnackbar('선택한 연도에 월마감 데이터가 없습니다.', 'info');
      }
    } catch (error) {
      console.error('월마감 상태 조회 실패:', error);
      showSnackbar('월마감 상태를 불러오는데 실패했습니다.', 'error');
      setMonthlyClosingStatus([]);
    } finally {
      setLoading(false);
    }
  };
  
  // 월마감 처리 함수
  const executeMonthlyClosing = async (month) => {
    if (!month) {
      showSnackbar('마감월을 선택해주세요.', 'warning');
      return;
    }
    
    setLoading(true);
    
    try {
      const url = `http://localhost:8080/api/v1/inventory/monthly-closing?year=${selectedYear}&month=${month}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '월마감 처리에 실패했습니다.');
      }
      
      showSnackbar('월마감 처리가 완료되었습니다.', 'success');
      // 마감 상태 갱신
      fetchMonthlyClosingStatusByYear();
      setSelectedMonthForClosing(null);
    } catch (error) {
      console.error('월마감 처리 실패:', error);
      
      // 마지막 날 일마감 확인 관련 에러 메시지
      if (error.message.includes('마지막 날') || error.message.includes('일마감')) {
        showSnackbar(`${month}월 마지막 날의 일마감이 완료되지 않았습니다.`, 'error');
      } else {
        showSnackbar('월마감 처리에 실패했습니다.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // 연 선택 핸들러
  const handleYearChange = (date) => {
    if (date) {
      setSelectedYear(getYear(date));
    }
    setShowYearPicker(false);
  };
  
  // 월 선택 핸들러
  const handleMonthSelect = (month) => {
    setSelectedMonthForClosing(month === selectedMonthForClosing ? null : month);
  };
  
  // 연도 표시 함수
  const getYearText = () => {
    return `${selectedYear}년`;
  };

  // 월 표시 함수
  const getMonthText = () => {
    return `${selectedYear}년 ${selectedMonth}월`;
  };

  // 일마감 시간에 대한 시간 포맷 함수
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'MM-dd HH:mm');
    } catch (error) {
      return dateString;
    }
  };

  // 필터 초기화 핸들러
  const handleResetFilters = () => {
    const today = new Date();
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth() + 1);
    setSelectedDate(null);
    setSelectedMonthForClosing(null);
    setDailyClosingStatus([]);
    setMonthlyClosingStatus([]);
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

  // 일마감 재계산 함수
  const recalculateDailyClosing = async (date) => {
    if (!date) {
      showSnackbar('재계산할 날짜를 선택해주세요.', 'warning');
      return;
    }
    
    setLoading(true);
    showSnackbar('재마감 처리 중입니다. 약 1분 정도 소요될 수 있습니다.', 'info');
    
    try {
      const formattedDate = format(new Date(date), 'yyyy-MM-dd');
      const url = `http://localhost:8080/api/v1/inventory/daily-closing/recalculate?closingDate=${formattedDate}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('일마감 재계산에 실패했습니다.');
      }
      
      const result = await response.json();
      showSnackbar(result.message || '일마감 재계산이 완료되었습니다.', 'success');
      
      // 마감 상태 갱신
      fetchDailyClosingStatusByMonth();
      setSelectedDate(null);
    } catch (error) {
      console.error('일마감 재계산 실패:', error);
      showSnackbar('일마감 재계산에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
      setRecalculateDialogOpen(false);
      setDateForRecalculation(null);
    }
  };
  
  // 재계산 다이얼로그 열기
  const handleOpenRecalculateDialog = (date) => {
    setDateForRecalculation(date);
    setRecalculateDialogOpen(true);
  };
  
  // 날짜 선택 핸들러
  const handleDateSelect = (date) => {
    setSelectedDate(date === selectedDate ? null : date);
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#F8F8FE', minHeight: '100vh' }}>
      {/* 상단 헤더 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#3A3A3A' }}>
          수불 마감
        </Typography>
      </Box>
      
      {/* 탭 UI */}
      <Box sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="closing management tabs"
          sx={{
            '& .MuiTab-root': {
              minWidth: 120,
              fontWeight: 500,
              fontSize: '0.9rem',
            },
            '& .Mui-selected': {
              color: '#3182F6',
              fontWeight: 700,
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#3182F6',
              height: 3
            }
          }}
        >
          <Tab label="일마감 관리" id="daily-tab" aria-controls="daily-panel" />
          <Tab label="월마감 관리" id="monthly-tab" aria-controls="monthly-panel" />
        </Tabs>
      </Box>

      {/* 필터 영역 */}
      <Box sx={{ 
        backgroundColor: 'white',
        borderRadius: 2,
        border: '1px solid #EEEEEE',
        p: 3,
        mb: 3
      }}>
        <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end' }}>
          {/* 연월/연도 선택 */}
          {tabValue === 0 ? (
            <Box sx={{ width: '200px' }}>
              <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
                조회년월
              </Typography>
              <Button 
                variant="outlined"
                size="small"
                onClick={() => setShowMonthPicker(true)}
                sx={{
                  width: '100%',
                  height: '40px',
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  color: 'rgba(30, 30, 30, 0.87)',
                  borderColor: '#E0E0E0',
                }}
                startIcon={<CalendarIcon />}
              >
                {getMonthText()}
              </Button>
              <Dialog
                open={showMonthPicker}
                onClose={() => setShowMonthPicker(false)}
                maxWidth="sm"
                PaperProps={{
                  sx: { 
                    p: 2,
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                  }
                }}
              >
                <DialogTitle sx={{ 
                  p: 1, 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  borderBottom: '1px solid #f0f0f0',
                  mb: 1
                }}>
                  <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 500 }}>연도 및 월 선택</Typography>
                  <IconButton size="small" onClick={() => setShowMonthPicker(false)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 2 }}>
                  <Box sx={{ my: 1 }}>
                    <DatePicker
                      selected={new Date(selectedYear, selectedMonth - 1)}
                      onChange={handleMonthChange}
                      locale={ko}
                      dateFormat="yyyy년 MM월"
                      showMonthYearPicker
                      inline
                      calendarClassName="custom-calendar"
                    />
                    
                    <style>{`
                      .custom-calendar {
                        width: 100%;
                        font-family: 'Roboto', 'Noto Sans KR', sans-serif;
                        border: none;
                        box-shadow: none;
                      }
                      .react-datepicker {
                        border: none;
                        box-shadow: none;
                        font-family: inherit;
                      }
                      /* 월 헤더 스타일 */
                      .react-datepicker__header {
                        background-color: white;
                        border-bottom: none;
                        padding-top: 12px;
                        padding-bottom: 8px;
                      }
                      /* 월 이름 스타일 */
                      .react-datepicker__current-month {
                        font-size: 16px;
                        font-weight: 600;
                        margin-bottom: 15px;
                        color: #333;
                        text-align: center;
                      }
                      /* 월 선택 스타일 */
                      .react-datepicker__month-container {
                        float: none;
                        width: 100%;
                      }
                      .react-datepicker__month-wrapper {
                        display: flex;
                        flex-wrap: wrap;
                        justify-content: space-around;
                        margin: 5px 0;
                      }
                      .react-datepicker__month-text {
                        width: 4rem;
                        height: 2.5rem;
                        line-height: 2.5rem;
                        margin: 0.5rem;
                        display: inline-block;
                        text-align: center;
                        border-radius: 4px;
                      }
                      .react-datepicker__month-text:hover {
                        background-color: #f5f5f5;
                      }
                      .react-datepicker__month--selected {
                        background-color: #3182F6 !important;
                        color: white !important;
                      }
                      .react-datepicker__month--keyboard-selected {
                        background-color: rgba(49, 130, 246, 0.1);
                        color: #333;
                      }
                      /* 내비게이션 버튼 스타일 */
                      .react-datepicker__navigation {
                        top: 15px;
                      }
                      .react-datepicker__navigation-icon::before {
                        border-color: #1976d2;
                        border-width: 2px 2px 0 0;
                      }
                      .react-datepicker__navigation:hover *::before {
                        border-color: #1976d2;
                      }
                      /* 연도 선택 스타일 */
                      .react-datepicker__year-text {
                        padding: 0.5rem;
                        margin: 0.5rem;
                      }
                      .react-datepicker__year--selected {
                        background-color: #3182F6;
                        color: white;
                      }
                    `}</style>

                    {/* 선택된 연월 표시 */}
                    <Box sx={{ 
                      mt: 2, 
                      p: 2, 
                      bgcolor: 'rgba(25, 118, 210, 0.05)', 
                      borderRadius: 1,
                      display: 'flex',
                      justifyContent: 'center',
                      border: '1px solid rgba(25, 118, 210, 0.1)'
                    }}>
                      <Box>
                        <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.875rem', mb: 0.5, textAlign: 'center' }}>선택된 연월</Typography>
                        <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>
                          {`${selectedYear}년 ${selectedMonth}월`}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 1, borderTop: '1px solid #f0f0f0' }}>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={() => {
                      const today = new Date();
                      setSelectedYear(today.getFullYear());
                      setSelectedMonth(today.getMonth() + 1);
                    }}
                    sx={{ 
                      minWidth: '100px',
                      color: 'text.secondary',
                      borderColor: 'rgba(0, 0, 0, 0.23)'
                    }}
                  >
                    초기화
                  </Button>
                  <Button 
                    variant="contained" 
                    size="small" 
                    onClick={() => setShowMonthPicker(false)}
                    sx={{ 
                      minWidth: '100px',
                      boxShadow: 'none',
                      bgcolor: '#3182F6',
                      '&:hover': {
                        boxShadow: 'none',
                        bgcolor: '#3182F6',
                      },
                    }}
                  >
                    적용
                  </Button>
                </DialogActions>
              </Dialog>
            </Box>
          ) : (
            <Box sx={{ width: '200px' }}>
              <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
                조회년도
              </Typography>
              <Button 
                variant="outlined"
                size="small"
                onClick={() => setShowYearPicker(true)}
                sx={{
                  width: '100%',
                  height: '40px',
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  color: 'rgba(30, 30, 30, 0.87)',
                  borderColor: '#E0E0E0',
                }}
                startIcon={<CalendarIcon />}
              >
                {getYearText()}
              </Button>
              <Dialog
                open={showYearPicker}
                onClose={() => setShowYearPicker(false)}
                maxWidth="sm"
                PaperProps={{
                  sx: { 
                    p: 2,
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                  }
                }}
              >
                <DialogTitle sx={{ 
                  p: 1, 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  borderBottom: '1px solid #f0f0f0',
                  mb: 1
                }}>
                  <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 500 }}>연도 선택</Typography>
                  <IconButton size="small" onClick={() => setShowYearPicker(false)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 2 }}>
                  <Box sx={{ my: 1 }}>
                    <DatePicker
                      selected={new Date(selectedYear, 0)}
                      onChange={handleYearChange}
                      locale={ko}
                      dateFormat="yyyy년"
                      showYearPicker
                      inline
                      calendarClassName="custom-calendar"
                    />
                    
                    {/* 선택된 연도 표시 */}
                    <Box sx={{ 
                      mt: 2, 
                      p: 2, 
                      bgcolor: 'rgba(25, 118, 210, 0.05)', 
                      borderRadius: 1,
                      display: 'flex',
                      justifyContent: 'center',
                      border: '1px solid rgba(25, 118, 210, 0.1)'
                    }}>
                      <Box>
                        <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.875rem', mb: 0.5, textAlign: 'center' }}>선택된 연도</Typography>
                        <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>
                          {`${selectedYear}년`}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 1, borderTop: '1px solid #f0f0f0' }}>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={() => {
                      const today = new Date();
                      setSelectedYear(today.getFullYear());
                    }}
                    sx={{ 
                      minWidth: '100px',
                      color: 'text.secondary',
                      borderColor: 'rgba(0, 0, 0, 0.23)'
                    }}
                  >
                    초기화
                  </Button>
                  <Button 
                    variant="contained" 
                    size="small" 
                    onClick={() => setShowYearPicker(false)}
                    sx={{ 
                      minWidth: '100px',
                      boxShadow: 'none',
                      bgcolor: '#3182F6',
                      '&:hover': {
                        boxShadow: 'none',
                        bgcolor: '#3182F6',
                      },
                    }}
                  >
                    적용
                  </Button>
                </DialogActions>
              </Dialog>
            </Box>
          )}
          
          {/* 조회 버튼 */}
          <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={tabValue === 0 ? fetchDailyClosingStatusByMonth : fetchMonthlyClosingStatusByYear}
              sx={{ height: '40px' }}
            >
              조회
            </Button>
          </Box>
          
          {/* 필터 초기화 버튼 */}
          <Box sx={{ display: 'flex', alignItems: 'flex-end', ml: 'auto' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleResetFilters}
              sx={{
                height: '40px',
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
        </Box>
      </Box>
      
      {/* 일마감 관리 */}
      {tabValue === 0 && (
        <Box>
          {/* 일마감 데이터 테이블 */}
          <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden', boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)' }}>
            <TableContainer sx={{ maxHeight: '450px' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell 
                      width="25%" 
                      align="center" 
                      sx={{ 
                        px: 2, 
                        py: 1.5, 
                        backgroundColor: '#f8f9fa', 
                        fontWeight: 600,
                        color: '#495057',
                        borderBottom: '2px solid #e9ecef'
                      }}
                    >
                      일자
                    </TableCell>
                    <TableCell 
                      width="25%" 
                      align="center" 
                      sx={{ 
                        px: 2, 
                        py: 1.5, 
                        backgroundColor: '#f8f9fa', 
                        fontWeight: 600,
                        color: '#495057',
                        borderBottom: '2px solid #e9ecef'
                      }}
                    >
                      마감여부
                    </TableCell>
                    <TableCell 
                      width="25%" 
                      align="center" 
                      sx={{ 
                        px: 2, 
                        py: 1.5, 
                        backgroundColor: '#f8f9fa', 
                        fontWeight: 600,
                        color: '#495057',
                        borderBottom: '2px solid #e9ecef'
                      }}
                    >
                      마감일시
                    </TableCell>
                    <TableCell 
                      width="25%" 
                      align="center" 
                      sx={{ 
                        px: 2, 
                        py: 1.5, 
                        backgroundColor: '#f8f9fa', 
                        fontWeight: 600,
                        color: '#495057',
                        borderBottom: '2px solid #e9ecef'
                      }}
                    >
                      마감자
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                        <CircularProgress size={40} />
                        <Typography variant="body2" sx={{ mt: 2 }}>데이터를 불러오는 중입니다...</Typography>
                      </TableCell>
                    </TableRow>
                  ) : dailyClosingStatus.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2">
                          {selectedYear && selectedMonth ? '데이터가 없습니다.' : '조회년월을 선택 후 조회해주세요.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    dailyClosingStatus.map((item) => (
                      <TableRow 
                        key={item.date} 
                        hover
                        selected={selectedDate === item.date}
                        onClick={() => handleDateSelect(item.date)}
                        sx={{ 
                          cursor: 'pointer',
                          '&.Mui-selected': {
                            backgroundColor: 'rgba(25, 118, 210, 0.08)',
                          },
                          '&.Mui-selected:hover': {
                            backgroundColor: 'rgba(25, 118, 210, 0.12)',
                          },
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.02)',
                          },
                          borderBottom: '1px solid #f0f0f0',
                        }}
                      >
                        <TableCell align="center" sx={{ px: 2, py: 1.5 }}>
                          {`${selectedYear}-${selectedMonth}-${String(item.dayOfMonth).padStart(2, '0')}`}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 2, py: 1.5 }}>
                          {item.isClosed ? (
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: '#2e7d32', 
                                fontWeight: 600 
                              }}
                            >
                              Y
                            </Typography>
                          ) : (
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: '#757575', 
                                fontWeight: 600 
                              }}
                            >
                              N
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 2, py: 1.5 }}>
                          {formatDateTime(item.closedAt)}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 2, py: 1.5 }}>
                          {item.closedByName || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          
          {/* 일마감 처리 버튼 또는 재계산 버튼 */}
          {selectedDate && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              {!dailyClosingStatus.find(item => item.date === selectedDate)?.isClosed ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => executeDailyClosing(selectedDate)}
                  disabled={loading}
                  sx={{ 
                    minWidth: '200px',
                    height: '48px',
                    fontWeight: 600,
                    boxShadow: 'none',
                    '&:hover': {
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    },
                  }}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                      마감 진행 중...
                    </>
                  ) : (
                    '선택일자 마감처리'
                  )}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="warning"
                  startIcon={<RefreshIcon />}
                  onClick={() => handleOpenRecalculateDialog(selectedDate)}
                  disabled={loading}
                  sx={{ 
                    minWidth: '200px',
                    height: '48px',
                    fontWeight: 600,
                    boxShadow: 'none',
                    '&:hover': {
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    },
                  }}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                      재마감 진행 중... 1분 정도 소요됩니다
                    </>
                  ) : (
                    '마감 재계산'
                  )}
                </Button>
              )}
            </Box>
          )}
          
          {/* 주의사항 안내 */}
          <Box 
            sx={{ 
              mt: 4, 
              p: 2.5, 
              backgroundColor: '#f8f9fa', 
              border: '1px solid #e9ecef', 
              borderRadius: 1,
              borderLeft: '4px solid #3182F6'
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1.5, color: '#495057', fontWeight: 600 }}>
              기능 안내
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, color: '#495057', fontSize: '0.875rem' }}>
              • 선택한 연월에 대한 일별 재고 마감 상태를 조회합니다.
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, color: '#495057', fontSize: '0.875rem' }}>
              • 미마감 상태인 날짜를 선택하여 재고 마감 처리를 할 수 있습니다.
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: '#495057', fontSize: '0.875rem' }}>
              • 재고 마감이 완료되어야 전일 재고 데이터가 다음날로 정상 이월됩니다.
            </Typography>
            
            <Typography variant="subtitle2" sx={{ mb: 1.5, mt: 2, color: '#495057', fontWeight: 600 }}>
              항목 설명
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, color: '#495057', fontSize: '0.875rem' }}>
              • 마감여부 : 해당 일자의 재고 마감 처리 여부를 'Y' 또는 'N'으로 표시합니다.
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, color: '#495057', fontSize: '0.875rem' }}>
              • 마감일시 : 재고 마감이 처리된 날짜와 시간입니다.
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, color: '#495057', fontSize: '0.875rem' }}>
              • 마감자 : 재고 마감을 처리한 사용자 정보입니다.
            </Typography>
            
            <Typography variant="subtitle2" sx={{ mb: 1.5, mt: 2, color: '#dc3545', fontWeight: 600 }}>
              주의사항
            </Typography>
            <Typography variant="body2" sx={{ color: '#dc3545', fontSize: '0.875rem' }}>
              • 일마감이 완료되지 않은 날짜는 재고 데이터가 정확하게 반영되지 않을 수 있습니다.
            </Typography>
            <Typography variant="body2" sx={{ color: '#dc3545', fontSize: '0.875rem', mt: 1 }}>
              • 월마감이 완료된 월은 시설물 입/출고 등록이 제한됩니다.
            </Typography>
            <Typography variant="body2" sx={{ color: '#dc3545', fontSize: '0.875rem', mt: 1 }}>
              • 마감 재계산은 해당 일자부터 현재까지의 모든 마감 데이터에 영향을 줄 수 있습니다.
            </Typography>
          </Box>
        </Box>
      )}
      
      {/* 월마감 관리 */}
      {tabValue === 1 && (
        <Box>
          {/* 월마감 데이터 테이블 */}
          <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden', boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)' }}>
            <TableContainer sx={{ maxHeight: '450px' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell 
                      width="25%" 
                      align="center" 
                      sx={{ 
                        px: 2, 
                        py: 1.5, 
                        backgroundColor: '#f8f9fa', 
                        fontWeight: 600,
                        color: '#495057',
                        borderBottom: '2px solid #e9ecef'
                      }}
                    >
                      연월
                    </TableCell>
                    <TableCell 
                      width="25%" 
                      align="center" 
                      sx={{ 
                        px: 2, 
                        py: 1.5, 
                        backgroundColor: '#f8f9fa', 
                        fontWeight: 600,
                        color: '#495057',
                        borderBottom: '2px solid #e9ecef'
                      }}
                    >
                      마감여부
                    </TableCell>
                    <TableCell 
                      width="25%" 
                      align="center" 
                      sx={{ 
                        px: 2, 
                        py: 1.5, 
                        backgroundColor: '#f8f9fa', 
                        fontWeight: 600,
                        color: '#495057',
                        borderBottom: '2px solid #e9ecef'
                      }}
                    >
                      마감일시
                    </TableCell>
                    <TableCell 
                      width="25%" 
                      align="center" 
                      sx={{ 
                        px: 2, 
                        py: 1.5, 
                        backgroundColor: '#f8f9fa', 
                        fontWeight: 600,
                        color: '#495057',
                        borderBottom: '2px solid #e9ecef'
                      }}
                    >
                      마감자
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                        <CircularProgress size={40} />
                        <Typography variant="body2" sx={{ mt: 2 }}>데이터를 불러오는 중입니다...</Typography>
                      </TableCell>
                    </TableRow>
                  ) : monthlyClosingStatus.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2">
                          {selectedYear ? '데이터가 없습니다.' : '조회년도를 선택 후 조회해주세요.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    monthlyClosingStatus.map((item) => (
                      <TableRow 
                        key={item.month} 
                        hover
                        selected={selectedMonthForClosing === item.month}
                        onClick={() => handleMonthSelect(item.month)}
                        sx={{ 
                          cursor: 'pointer',
                          '&.Mui-selected': {
                            backgroundColor: 'rgba(25, 118, 210, 0.08)',
                          },
                          '&.Mui-selected:hover': {
                            backgroundColor: 'rgba(25, 118, 210, 0.12)',
                          },
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.02)',
                          },
                          borderBottom: '1px solid #f0f0f0',
                        }}
                      >
                        <TableCell align="center" sx={{ px: 2, py: 1.5 }}>
                          {`${selectedYear}-${String(item.month).padStart(2, '0')}`}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 2, py: 1.5 }}>
                          {item.isClosed ? (
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: '#2e7d32', 
                                fontWeight: 600 
                              }}
                            >
                              Y
                            </Typography>
                          ) : (
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: '#757575', 
                                fontWeight: 600 
                              }}
                            >
                              N
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 2, py: 1.5 }}>
                          {formatDateTime(item.closedAt)}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 2, py: 1.5 }}>
                          {item.closedByName || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          
          {/* 월마감 처리 버튼 */}
          {selectedMonthForClosing && !monthlyClosingStatus.find(item => item.month === selectedMonthForClosing)?.isClosed && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => executeMonthlyClosing(selectedMonthForClosing)}
                disabled={loading}
                sx={{ 
                  minWidth: '200px',
                  height: '48px',
                  fontWeight: 600,
                  boxShadow: 'none',
                  '&:hover': {
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  `${selectedMonthForClosing}월 마감처리`
                )}
              </Button>
            </Box>
          )}
          
          {/* 주의사항 안내 */}
          <Box 
            sx={{ 
              mt: 4, 
              p: 2.5, 
              backgroundColor: '#f8f9fa', 
              border: '1px solid #e9ecef', 
              borderRadius: 1,
              borderLeft: '4px solid #3182F6'
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1.5, color: '#495057', fontWeight: 600 }}>
              기능 안내
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, color: '#495057', fontSize: '0.875rem' }}>
              • 선택한 연도에 대한 월별 재고 마감 상태를 조회합니다.
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, color: '#495057', fontSize: '0.875rem' }}>
              • 미마감 상태인 월을 선택하여 월마감 처리할 수 있습니다.
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: '#495057', fontSize: '0.875rem' }}>
              • 월마감은 해당 월의 마지막 날 일마감이 완료된 경우에만 가능합니다.
            </Typography>
            
            <Typography variant="subtitle2" sx={{ mb: 1.5, mt: 2, color: '#495057', fontWeight: 600 }}>
              항목 설명
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, color: '#495057', fontSize: '0.875rem' }}>
              • 마감여부 : 해당 월의 재고 마감 처리 여부를 'Y' 또는 'N'으로 표시합니다.
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, color: '#495057', fontSize: '0.875rem' }}>
              • 마감일시 : 재고 마감이 처리된 날짜와 시간입니다.
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, color: '#495057', fontSize: '0.875rem' }}>
              • 마감자 : 재고 마감을 처리한 사용자 정보입니다.
            </Typography>
            
            <Typography variant="subtitle2" sx={{ mb: 1.5, mt: 2, color: '#dc3545', fontWeight: 600 }}>
              주의사항
            </Typography>
            <Typography variant="body2" sx={{ color: '#dc3545', fontSize: '0.875rem' }}>
              • 월마감이 완료된 월은 해당 월의 시설물 입/출고 등록 및 수정이 불가능합니다.
            </Typography>
            <Typography variant="body2" sx={{ color: '#dc3545', fontSize: '0.875rem', mt: 1 }}>
              • 월마감을 하기 위해서는 반드시 해당 월의 마지막 날에 대한 일마감이 완료되어야 합니다.
            </Typography>
          </Box>
        </Box>
      )}
      
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
      
      {/* 재계산 확인 다이얼로그 */}
      <Dialog
        open={recalculateDialogOpen}
        onClose={() => !loading && setRecalculateDialogOpen(false)}
        aria-labelledby="recalculate-dialog-title"
        aria-describedby="recalculate-dialog-description"
        maxWidth="xs"
        PaperProps={{
          sx: { 
            borderRadius: 1,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogTitle id="recalculate-dialog-title" sx={{ 
          py: 1.5,
          px: 2,
          fontSize: '1rem',
          fontWeight: 600,
          borderBottom: '1px solid #f0f0f0'
        }}>
          마감 재계산 확인
        </DialogTitle>
        <DialogContent sx={{ py: 2, px: 2 }}>
          <DialogContentText id="recalculate-dialog-description" sx={{ color: 'text.primary' }}>
            <Typography variant="body2" sx={{ mb: 1.5, mt: 1, fontSize: '0.9rem' }}>
              {dateForRecalculation && format(new Date(dateForRecalculation), 'yyyy년 MM월 dd일')} 일마감을 재계산하시겠습니까?
            </Typography>
            <Typography variant="body2" sx={{ color: '#dc3545', fontWeight: 500, mb: 1, fontSize: '0.85rem' }}>
              경고: 이 작업은 다음과 같은 영향을 미칠 수 있습니다:
            </Typography>
            <Box component="ul" sx={{ pl: 2, mt: 0, mb: 1, fontSize: '0.85rem' }}>
              <li>
                <Typography variant="body2" sx={{ color: '#dc3545', fontSize: '0.85rem' }}>
                  선택한 날짜부터 현재까지의 모든 마감 데이터를 재마감 처리해야합니다.
                </Typography>
              </li>
              <li>
                <Typography variant="body2" sx={{ color: '#dc3545', fontSize: '0.85rem' }}>
                  재고 현황 데이터가 변경될 수 있습니다.
                </Typography>
              </li>
              <li>
                <Typography variant="body2" sx={{ color: '#dc3545', fontSize: '0.85rem' }}>
                  이 작업은 취소할 수 없습니다.
                </Typography>
              </li>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 500, mt: 1.5, fontSize: '0.9rem' }}>
              정말 진행하시겠습니까?
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1.5, fontSize: '0.8rem' }}>
              * 재마감 처리는 약 1분 정도 소요될 수 있습니다.
            </Typography>
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2, mb: 1 }}>
                <CircularProgress size={24} />
                <Typography variant="body2" sx={{ ml: 1.5, fontSize: '0.85rem', color: 'text.secondary' }}>
                  재마감 진행 중...
                </Typography>
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 1.5, borderTop: '1px solid #f0f0f0' }}>
          <Button 
            onClick={() => setRecalculateDialogOpen(false)}
            variant="outlined"
            size="small"
            sx={{ 
              minWidth: '60px',
              fontSize: '0.8rem'
            }}
            disabled={loading}
          >
            취소
          </Button>
          <Button 
            onClick={() => recalculateDailyClosing(dateForRecalculation)}
            variant="contained" 
            color="warning"
            size="small"
            sx={{ 
              minWidth: '80px',
              fontSize: '0.8rem',
              boxShadow: 'none'
            }}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {loading ? '진행 중...' : '재계산'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClosingManagementPage; 