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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  TextField,
  InputAdornment,
  CircularProgress,
  Snackbar,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tabs,
  Tab
} from '@mui/material';
import { 
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { format, getYear, getMonth } from 'date-fns';
import { ko } from 'date-fns/locale';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import DateRangeCalendar, { DateRangeButton } from '../calendar/Calendar';
import FacilityCompanySelectDialog from './FacilityCompanySelectDialog';
import { useAuth } from '../../contexts/AuthContext';

const ClosingInventoryPage = () => {
  // Auth Context에서 사용자 정보 가져오기
  const { user: authUser } = useAuth();
  
  // 권한 확인
  const isUserRole = authUser?.role === 'USER';
  
  // 상태 관리
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedCompanyName, setSelectedCompanyName] = useState('');
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [closingData, setClosingData] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // 탭 관리
  const [tabValue, setTabValue] = useState(0); // 0: 일마감, 1: 월마감
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  
  // 알림 스낵바
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // 탭 변경 핸들러
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setClosingData([]);
    setSearchKeyword('');
  };
  
  // USER 권한 사용자의 업체 정보 자동 설정
  useEffect(() => {
    const fetchUserCompany = async () => {
      // USER 권한이고 companyId가 있는 경우에만 실행
      if (isUserRole && authUser?.companyId) {
        try {
          // 사용자의 업체 정보 조회
          const response = await fetch(`http://localhost:8080/api/companies/${authUser.companyId}`, {
            headers: {
              'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            }
          });
          
          if (!response.ok) {
            throw new Error('수탁업체 정보를 불러오는데 실패했습니다.');
          }
          
          const companyData = await response.json();
          
          // 업체 정보 자동 설정
          setSelectedCompany(companyData.id);
          setSelectedCompanyName(companyData.storeName || companyData.companyName);
          
        } catch (error) {
          console.error('사용자 업체 정보 조회 실패:', error);
          showSnackbar('사용자 업체 정보를 불러오는데 실패했습니다.', 'error');
        }
      }
    };
    
    fetchUserCompany();
  }, [authUser, isUserRole]);
  
  // 일마감 데이터 조회
  const fetchDailyClosingData = async () => {
    if (!selectedCompany || !selectedDate) {
      showSnackbar('수탁업체와 조회 날짜를 모두 선택해주세요.', 'warning');
      return;
    }
    
    setLoading(true);
    setClosingData([]); // 조회 시작 전 데이터 초기화
    
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const url = `http://localhost:8080/api/v1/inventory/daily-status?date=${formattedDate}&companyId=${selectedCompany}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('일마감 데이터를 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      // facilityTypeCodeId 기준으로 정렬
      const sortedData = (data.content || []).sort((a, b) => {
        return a.facilityTypeCodeId.localeCompare(b.facilityTypeCodeId);
      });
      setClosingData(sortedData);
      
      if (sortedData.length === 0) {
        showSnackbar('선택한 날짜에 일마감 데이터가 없습니다.', 'info');
      }
    } catch (error) {
      console.error('일마감 데이터 조회 실패:', error);
      showSnackbar('일마감 데이터를 불러오는데 실패했습니다.', 'error');
      setClosingData([]);
    } finally {
      setLoading(false);
    }
  };
  
  // 월마감 데이터 조회
  const fetchMonthlyClosingData = async () => {
    if (!selectedCompany) {
      showSnackbar('수탁업체를 선택해주세요.', 'warning');
      return;
    }
    
    setLoading(true);
    setClosingData([]); // 조회 시작 전 데이터 초기화
    
    try {
      const url = `http://localhost:8080/api/v1/inventory/monthly-status?year=${selectedYear}&month=${selectedMonth}&companyId=${selectedCompany}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('월마감 데이터를 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      // facilityTypeCodeId 기준으로 정렬
      const sortedData = (data.content || []).sort((a, b) => {
        return a.facilityTypeCodeId.localeCompare(b.facilityTypeCodeId);
      });
      setClosingData(sortedData);
      
      if (sortedData.length === 0) {
        showSnackbar('선택한 월에 마감 데이터가 없습니다.', 'info');
      }
    } catch (error) {
      console.error('월마감 데이터 조회 실패:', error);
      showSnackbar('월마감 데이터를 불러오는데 실패했습니다.', 'error');
      setClosingData([]);
    } finally {
      setLoading(false);
    }
  };
  
  // 필터링된 데이터 계산 (useMemo 사용)
  const filteredClosingData = useMemo(() => {
    return closingData.filter(item => {
      // 검색어 필터링
      const matchesKeyword = searchKeyword === '' || 
        (item.facilityTypeName && item.facilityTypeName.toLowerCase().includes(searchKeyword.toLowerCase()));
      
      return matchesKeyword;
    });
  }, [closingData, searchKeyword]);
  
  // 검색어 변경 핸들러
  const handleSearchKeywordChange = (e) => {
    setSearchKeyword(e.target.value);
  };
  
  // 날짜 선택 핸들러
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setShowDatePicker(false);
  };
  
  // 월 선택 핸들러
  const handleMonthChange = (date) => {
    if (date) {
      setSelectedYear(getYear(date));
      setSelectedMonth(getMonth(date) + 1);
    }
    setShowMonthPicker(false);
  };
  
  // 업체 선택 핸들러
  const handleCompanyChange = (e) => {
    setSelectedCompany(e.target.value);
  };
  
  // 수탁업체 선택 다이얼로그 열기
  const handleOpenCompanyDialog = () => {
    // USER 권한은 업체 선택 불가
    if (isUserRole) return;
    setCompanyDialogOpen(true);
  };

  // 수탁업체 선택 완료 핸들러
  const handleCompanySelect = (company) => {
    setSelectedCompany(company.id);
    setSelectedCompanyName(company.storeName || company.companyName);
    setCompanyDialogOpen(false);
  };
  
  // 필터 초기화 핸들러
  const handleResetFilters = () => {
    // USER 권한은 업체 초기화 안함
    if (!isUserRole) {
      setSelectedCompany('');
      setSelectedCompanyName('');
    }
    
    if (tabValue === 0) {
      setSelectedDate(null);
    } else {
      const today = new Date();
      setSelectedYear(today.getFullYear());
      setSelectedMonth(today.getMonth() + 1);
    }
    
    setSearchKeyword('');
    setClosingData([]);
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
  
  // 날짜 표시 함수
  const getDateText = () => {
    return selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '날짜 선택';
  };
  
  // 월 표시 함수
  const getMonthText = () => {
    return `${selectedYear}년 ${selectedMonth}월`;
  };
  
  // 조회 날짜 칼럼에 대한 날짜 포맷 함수
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'yy-MM-dd');
    } catch (error) {
      return dateString;
    }
  };
  
  // 일마감 시간에 대한 시간 포맷 함수
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'yy-MM-dd HH:mm');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#F8F8FE', minHeight: '100vh' }}>
      {/* 상단 헤더 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#3A3A3A' }}>
          마감 재고 조회
        </Typography>
      </Box>
      
      {/* 탭 UI */}
      <Box sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="closing inventory tabs"
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
          <Tab label="일마감 조회" id="daily-tab" aria-controls="daily-panel" />
          <Tab label="월마감 조회" id="monthly-tab" aria-controls="monthly-panel" />
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
        <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end', justifyContent: 'space-between' }}>
          {/* 검색어 필드 */}
          <Box sx={{ flex: 1, minWidth: '200px' }}>
            <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
              검색
            </Typography>
            <TextField
              placeholder="시설물 유형 검색"
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
            {/* 업체 선택 */}
            <Box sx={{ width: '250px' }}>
              <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
                수탁업체 선택
              </Typography>
              <Button
                variant="outlined"
                fullWidth
                onClick={handleOpenCompanyDialog}
                disabled={isUserRole} // USER 권한은 비활성화
                sx={{
                  height: '40px',
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  color: 'rgba(30, 30, 30, 0.87)',
                  borderColor: '#E0E0E0',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  // USER 권한일 때 다른 스타일 적용
                  ...(isUserRole && {
                    backgroundColor: '#f5f5f5',
                    cursor: 'default',
                    opacity: 0.8,
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                      borderColor: '#E0E0E0'
                    }
                  })
                }}
              >
                {selectedCompanyName || (isUserRole ? '자동 선택됨' : '업체 선택')}
              </Button>
              {!isUserRole && (
                <FacilityCompanySelectDialog
                  open={companyDialogOpen}
                  onClose={() => setCompanyDialogOpen(false)}
                  onSelect={handleCompanySelect}
                  title="수탁업체 선택"
                />
              )}
            </Box>
            
            {/* 일/월 선택 영역 - 탭에 따라 다르게 표시 */}
            {tabValue === 0 ? (
              // 일마감 - 날짜 선택
              <Box sx={{ width: '200px' }}>
                <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
                  수불날짜
                </Typography>
                <Button 
                  variant="outlined"
                  size="small"
                  onClick={() => setShowDatePicker(true)}
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
                  {getDateText()}
                </Button>
                <Dialog
                  open={showDatePicker}
                  onClose={() => setShowDatePicker(false)}
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
                    <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 500 }}>날짜 선택</Typography>
                    <IconButton size="small" onClick={() => setShowDatePicker(false)}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </DialogTitle>
                  <DialogContent sx={{ p: 2 }}>
                    <Box sx={{ my: 1 }}>
                      <DatePicker
                        selected={selectedDate}
                        onChange={handleDateChange}
                        locale={ko}
                        inline
                        dateFormat="yyyy-MM-dd"
                        calendarClassName="custom-calendar"
                        formatWeekDay={(nameOfDay) => nameOfDay.substring(0, 1)}
                        renderDayContents={(day, date) => {
                          // 일요일인 경우 (0: 일요일)
                          const isFirstDayOfWeek = date && date.getDay() === 0;
                          return (
                            <span style={isFirstDayOfWeek ? { color: '#f44336' } : undefined}>
                              {day}
                            </span>
                          );
                        }}
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
                        /* 요일 이름 컨테이너 */
                        .react-datepicker__day-names {
                          display: flex;
                          justify-content: space-around;
                          margin-top: 5px;
                          margin-bottom: 8px;
                          padding-bottom: 8px;
                          border-bottom: 1px solid #e0e0e0;
                        }
                        /* 요일명 스타일 */
                        .react-datepicker__day-name {
                          color: #757575;
                          font-size: 12px;
                          width: 36px;
                          margin: 2px;
                        }
                        /* 일요일 색상 */
                        .react-datepicker__day-name:first-child {
                          color: #f44336;
                        }
                        /* 날짜 스타일 */
                        .react-datepicker__day {
                          width: 36px;
                          height: 36px;
                          line-height: 36px;
                          margin: 2px;
                          border-radius: 0;
                          color: #333;
                        }
                        /* 주 컨테이너 - 높이 통일 */
                        .react-datepicker__week {
                          height: 40px;
                          display: flex;
                        }
                        /* 날짜 호버 스타일 */
                        .react-datepicker__day:hover {
                          background-color: #f5f5f5;
                          border-radius: 50%;
                        }
                        /* 키보드 선택 시 스타일 */
                        .react-datepicker__day--keyboard-selected {
                          background-color: transparent;
                          color: inherit;
                        }
                        /* 선택된 날짜 스타일 */
                        .react-datepicker__day--selected {
                          background-color: #3182F6;
                          color: white;
                          border-radius: 50%;
                        }
                        /* 오늘 날짜 표시 */
                        .react-datepicker__day--today {
                          font-weight: 600;
                          color: #1976d2;
                        }
                        /* 현재 월이 아닌 날짜 표시 */
                        .react-datepicker__day--outside-month {
                          color: #bbb;
                        }
                        /* 비활성화된 날짜 표시 */
                        .react-datepicker__day--disabled {
                          color: #ccc;
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
                      `}</style>

                      {/* 선택된 날짜 표시 */}
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
                          <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.875rem', mb: 0.5, textAlign: 'center' }}>선택된 날짜</Typography>
                          <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>
                            {selectedDate ? format(selectedDate, 'yyyy년 MM월 dd일') : '-'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </DialogContent>
                  <DialogActions sx={{ p: 2, pt: 1, borderTop: '1px solid #f0f0f0' }}>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      onClick={() => setSelectedDate(null)}
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
                      onClick={() => setShowDatePicker(false)}
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
              // 월마감 - 연월 선택
              <Box sx={{ width: '200px' }}>
                <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
                  수불년월
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
            )}
            
            {/* 검색 버튼 */}
            <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={tabValue === 0 ? fetchDailyClosingData : fetchMonthlyClosingData}
                sx={{ height: '40px' }}
              >
                조회
              </Button>
            </Box>
          </Box>
        </Box>
        
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
      </Box>
      
      {/* 데이터 테이블 */}
      <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden' }}>
        <TableContainer sx={{ overflowX: 'auto', maxHeight: '600px' }}>
          <Table sx={{ minWidth: 1200, tableLayout: 'fixed' }} stickyHeader>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell width={60} sx={{ px: 2 }}>No.</TableCell>
                <TableCell width={120} sx={{ px: 2 }}>시설물 유형</TableCell>
                <TableCell width={100} sx={{ px: 2, textAlign: 'center' }}>
                  {tabValue === 0 ? '전일 재고' : '전월 재고'}
                </TableCell>
                <TableCell width={100} sx={{ px: 2, textAlign: 'center' }}>
                  {tabValue === 0 ? '당일 입고' : '당월 입고'}
                </TableCell>
                <TableCell width={100} sx={{ px: 2, textAlign: 'center' }}>
                  {tabValue === 0 ? '당일 출고' : '당월 출고'}
                </TableCell>
                <TableCell width={100} sx={{ px: 2, textAlign: 'center' }}>
                  {tabValue === 0 ? '당일 재고' : '당월 재고'}
                </TableCell>
                <TableCell width={120} sx={{ px: 2 }}>
                  {tabValue === 0 ? '일마감 여부' : '월마감 여부'}
                </TableCell>
                <TableCell width={160} sx={{ px: 2 }}>
                  {tabValue === 0 ? '마감일시' : '마감일'}
                </TableCell>
                <TableCell width={100} sx={{ px: 2 }}>마감자</TableCell>
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
              ) : filteredClosingData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2">
                      {selectedCompany ? 
                        (tabValue === 0 ? 
                          (selectedDate ? '데이터가 없습니다.' : '수탁업체와 수불날짜 선택 후 조회해주세요.') :
                          '수탁업체와 수불날짜 선택 후 조회해주세요.'
                        ) : 
                        '수탁업체를 선택 후 조회해주세요.'
                      }
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredClosingData.map((item, index) => (
                  <TableRow key={item.closingId} hover>
                    <TableCell sx={{ px: 2, whiteSpace: 'nowrap' }}>
                      {index + 1}
                    </TableCell>
                    <TableCell sx={{ px: 2, whiteSpace: 'nowrap' }}>
                      {item.facilityTypeName}
                    </TableCell>
                    <TableCell sx={{ px: 2, textAlign: 'center' }}>
                      {item.previousQuantity}
                    </TableCell>
                    <TableCell sx={{ px: 2, textAlign: 'center' }}>
                      {item.inboundQuantity}
                    </TableCell>
                    <TableCell sx={{ px: 2, textAlign: 'center' }}>
                      {item.outboundQuantity}
                    </TableCell>
                    <TableCell sx={{ px: 2, textAlign: 'center', fontWeight: 'bold' }}>
                      {item.closingQuantity}
                    </TableCell>
                    <TableCell sx={{ px: 2 }}>
                      {item.isClosed ? (
                        <Typography variant="body2" sx={{ color: '#2e7d32' }}>마감완료</Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#757575' }}>미마감</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ px: 2, whiteSpace: 'nowrap' }}>
                      {tabValue === 0 ? formatDateTime(item.closedAt) : formatDate(item.closedAt)}
                    </TableCell>
                    <TableCell sx={{ px: 2 }}>
                      {item.userName || "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
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

export default ClosingInventoryPage; 