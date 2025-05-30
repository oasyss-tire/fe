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
  Menu,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Popover,
  Grid,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Search as SearchIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  CalendarToday as CalendarTodayIcon,
  MoreVert as MoreVertIcon,
  Description as DescriptionIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import DateRangeCalendar, { DateRangeButton } from '../calendar/Calendar';
import { format, isWithinInterval, parseISO, endOfDay, startOfDay } from 'date-fns';
// 재계약 모달 컴포넌트 import
import ContractRenewModal from './ContractRenewModal';

const ContractList = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeStatusFilter, setActiveStatusFilter] = useState('active');
  const [companyOptions, setCompanyOptions] = useState([]);
  const [sortOrder, setSortOrder] = useState('desc');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedContractId, setSelectedContractId] = useState(null);
  
  // 기간 필터 상태 추가
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [dateDialogOpen, setDateDialogOpen] = useState(false);
  const [dateFilterActive, setDateFilterActive] = useState(false);
  
  // 이번 달 보험 종료 필터 상태 추가
  const [currentMonthExpiryFilter, setCurrentMonthExpiryFilter] = useState(false);
  
  // 상태 코드 데이터
  const [statusCodes, setStatusCodes] = useState([]);

  // 재계약 모달 상태 추가
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  
  // 알림 스낵바 상태 추가
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // 계약 목록 조회
  const fetchContracts = async () => {
    try {
      setLoading(true);
      
      // 활성화 상태에 따른 API 엔드포인트 설정
      let apiUrl = 'http://localhost:8080/api/contracts/with-trustee';
      if (activeStatusFilter === 'inactive') {
        apiUrl += '?status=inactive';
      } else if (activeStatusFilter === 'all') {
        apiUrl += '?status=all';
      }
      
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('계약 목록 조회 실패');
      const data = await response.json();
      setContracts(data);
      setFilteredContracts(data);
    } catch (error) {
      console.error('계약 목록 조회 중 오류:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 상태 코드 그룹 조회
  const fetchStatusCodes = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/codes/groups/001002/codes');
      if (!response.ok) throw new Error('상태 코드 조회 실패');
      const data = await response.json();
      // sortOrder 기준으로 정렬
      setStatusCodes(data.sort((a, b) => a.sortOrder - b.sortOrder));
    } catch (error) {
      console.error('상태 코드 조회 중 오류:', error);
    }
  };

  useEffect(() => {
    fetchContracts();
    fetchStatusCodes(); // 상태 코드 조회 추가
  }, [activeStatusFilter]);
  
  // 업체명 목록 설정
  useEffect(() => {
    if (contracts.length > 0) {
      const uniqueCompanies = [...new Set(contracts.map(contract => contract.companyName))].filter(Boolean);
      setCompanyOptions(uniqueCompanies);
    }
  }, [contracts]);
  
  // 필터링 적용
  useEffect(() => {
    let result = [...contracts];
    
    // 검색어 필터링
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(contract => 
        // 계약번호, 계약 제목, 위수탁 업체명으로 검색
        (contract.contractNumber && contract.contractNumber.toLowerCase().includes(query)) ||
        (contract.title && contract.title.toLowerCase().includes(query)) || 
        (contract.companyName && contract.companyName.toLowerCase().includes(query))
      );
    }
    
    // 상태 필터링
    if (statusFilter) {
      result = result.filter(contract => contract.statusName === statusFilter);
    }
    
    // 활성화 상태 필터링은 API에서 처리되므로 여기서는 추가 필터링하지 않음
    
    // 날짜 필터링 추가
    if (dateFilterActive && startDate && endDate) {
      try {
        const startDayStart = startOfDay(new Date(startDate));
        const endDayEnd = endOfDay(new Date(endDate));
        
        result = result.filter(contract => {
          // 날짜가 없으면 필터링에서 제외
          if (!contract.createdAt) return false;
          
          try {
            const contractDate = parseISO(contract.createdAt);
            return isWithinInterval(contractDate, { start: startDayStart, end: endDayEnd });
          } catch (error) {
            console.error('계약 날짜 파싱 오류:', error, contract.createdAt);
            return false;
          }
        });
      } catch (error) {
        console.error('날짜 필터링 적용 중 오류:', error);
      }
    }
    
    // 이번 달 보험 종료 필터링 추가
    if (currentMonthExpiryFilter) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      
      result = result.filter(contract => {
        if (!contract.insuranceEndDate) return false;
        
        try {
          // 보험종료일 파싱 (YYYY-MM-DD 형식 가정)
          const endDateParts = contract.insuranceEndDate.split('-');
          if (endDateParts.length !== 3) return false;
          
          const endYear = parseInt(endDateParts[0], 10);
          const endMonth = parseInt(endDateParts[1], 10) - 1; // JavaScript의 월은 0부터 시작
          
          // 현재 년도와 월이 보험종료일과 일치하는지 확인
          return endYear === currentYear && endMonth === currentMonth;
        } catch (error) {
          console.error('보험종료일 파싱 오류:', error, contract.insuranceEndDate);
          return false;
        }
      });
    }
    
    // 정렬
    result.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
    
    setFilteredContracts(result);
  }, [contracts, searchQuery, statusFilter, sortOrder, dateFilterActive, startDate, endDate, currentMonthExpiryFilter]);

  const handleMenuClick = (event, contractId) => {
    setAnchorEl(event.currentTarget);
    setSelectedContractId(contractId);
    
    // 선택된 계약 정보 저장
    const contract = contracts.find(c => c.id === contractId);
    if (contract) {
      setSelectedContract(contract);
      
      // 수정: with-trustee API에서는 company 객체가 별도로 없고 계약 객체에 통합되어 있음
      // 수탁업체 정보를 직접 생성하여 설정
      const companyInfo = {
        id: contract.companyId,
        storeName: contract.storeName || contract.companyName,
        trustee: contract.trustee,
        companyName: contract.companyName,
        // 필요한 다른 수탁업체 관련 필드들 추가
        businessNumber: contract.businessNumber,
        representativeName: contract.representativeName
      };
      
      setSelectedCompany(companyInfo);
    }
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedContractId(null);
  };
  
  // 재계약 모달 열기
  const handleOpenRenewModal = () => {
    const contract = selectedContract;
    const company = selectedCompany;
    
    if (!contract) {
      showSnackbar('계약 정보를 찾을 수 없습니다.', 'error');
      return;
    }
    
    if (!company || !company.id) {
      showSnackbar('수탁업체 정보를 찾을 수 없습니다.', 'error');
      return;
    }
    
    setRenewModalOpen(true);
    handleMenuClose();
  };
  
  // 재계약 모달 닫기
  const handleCloseRenewModal = () => {
    setRenewModalOpen(false);
  };
  
  // 재계약 성공 처리
  const handleRenewSuccess = (result) => {
    showSnackbar('재계약이 성공적으로 신청되었습니다.', 'success');
    fetchContracts(); // 계약 목록 새로고침
  };
  
  // 스낵바 표시 함수
  const showSnackbar = (message, severity = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };
  
  // 스낵바 닫기
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // 계약 상태에 따른 Chip 컴포넌트 렌더링 (수정: statusCode와 statusName 사용)
  const renderStatusChip = (contract) => {
    // 기본 상태 설정 (fallback)
    let label = "계약 대기";
    let color = "#666";
    let bgColor = "#F5F5F5";

    // statusCode와 statusName 있는 경우 우선 사용
    if (contract.statusName) {
      label = contract.statusName;
      
      // 상태 코드에 따른 스타일 지정
      if (contract.statusCodeId === "001002_0001") { // 승인대기
        color = "#FF9800";
        bgColor = "#FFF3E0";
      } else if (contract.statusCodeId === "001002_0002") { // 계약완료
        color = "#3182F6";
        bgColor = "#E8F3FF";
      } else if (contract.statusCodeId === "001002_0003") { // 임시저장
        color = "#9E9E9E";
        bgColor = "#F5F5F5";
      } else if (contract.statusCodeId === "001002_0004") { // 서명진행중
        color = "#FF9800";
        bgColor = "#FFF3E0";
      }
    } else {
      // 기존 로직 (fallback)
      if (contract.progressRate === 100) {
        label = "계약 완료";
        color = "#3182F6";
        bgColor = "#E8F3FF";
      } else if (contract.progressRate > 0) {
        label = "서명 진행중";
        color = "#FF9800";
        bgColor = "#FFF3E0";
      }
    }

    return (
      <Chip
        label={label}
        size="small"
        sx={{
          backgroundColor: bgColor,
          color: color,
          height: '24px',
          fontSize: '12px'
        }}
      />
    );
  };

  // 날짜 포맷 함수
  const formatDate = (dateString, dateOnly = false) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      // 날짜만 표시 (YYYY-MM-DD)
      if (dateOnly) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      }
      
      // 날짜와 시간 모두 표시 (YY-MM-DD HH:MM)
      return `${date.getFullYear()-2000}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    } catch (error) {
      console.error('날짜 포맷 오류:', error, dateString);
      return '';
    }
  };

  // 계약 상세 페이지로 이동
  const handleContractClick = (contractId) => {
    navigate(`/contract-detail/${contractId}`);
  };

  // 필터 초기화
  const handleResetFilter = () => {
    setSearchQuery('');
    setStatusFilter('');
    setActiveStatusFilter('active');
    setStartDate(null);
    setEndDate(null);
    setDateFilterActive(false);
    setCurrentMonthExpiryFilter(false);
  };
  
  // 날짜 다이얼로그 열기
  const handleOpenDateDialog = () => {
    setDateDialogOpen(true);
  };
  
  // 날짜 다이얼로그 닫기
  const handleCloseDateDialog = () => {
    setDateDialogOpen(false);
  };
  
  // 날짜 변경 핸들러
  const handleDateChange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
  };
  
  // 날짜 필터 적용
  const handleApplyDateFilter = () => {
    if (startDate && endDate) {
      setDateFilterActive(true);
      handleCloseDateDialog();
    }
  };
  
  // 날짜 필터 초기화
  const handleResetDateFilter = () => {
    setStartDate(null);
    setEndDate(null);
    setDateFilterActive(false);
    handleCloseDateDialog();
  };
  
  // 날짜 범위 텍스트 구성
  const getDateRangeText = () => {
    if (!dateFilterActive) return '전체';
    
    if (!startDate || !endDate) return '전체';
    
    try {
      const startFormatted = format(new Date(startDate), 'yy-MM-dd');
      const endFormatted = format(new Date(endDate), 'yy-MM-dd');
      return `${startFormatted} ~ ${endFormatted}`;
    } catch (error) {
      console.error('날짜 형식 오류:', error);
      return '전체';
    }
  };

  // 상태에 따른 색상 반환
  const getStatusColor = (statusName) => {
    switch(statusName) {
      case '작성중':
        return { bg: '#FFF7E6', text: '#D48806' };
      case '서명중':
        return { bg: '#E6F4FF', text: '#0958D9' };
      case '서명완료':
        return { bg: '#E6FFFB', text: '#08979C' };
      case '철회':
        return { bg: '#FFF1F0', text: '#F5222D' };
      case '만료':
        return { bg: '#F9F0FF', text: '#722ED1' };
      default:
        return { bg: '#F5F5F5', text: '#8C8C8C' };
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#F8F8FE', minHeight: '100vh' }}>
      {/* 상단 헤더 */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600,
            color: '#3A3A3A'
          }}
        >
          계약 관리
        </Typography>
      </Box>

      {/* 검색 및 필터 영역 */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        {/* 검색어 입력 */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
            검색어
          </Typography>
          <TextField
            placeholder="계약번호, 계약 제목 또는 수탁사업체명"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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

        {/* 정렬 필터 */}
        <Box>
          <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
            정렬
          </Typography>
          <FormControl 
            size="small" 
            sx={{ 
              minWidth: 120,
              backgroundColor: 'white'
            }}
          >
            <Select
              displayEmpty
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              IconComponent={KeyboardArrowDownIcon}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#E0E0E0',
                },
              }}
            >
              <MenuItem value="desc">최신순</MenuItem>
              <MenuItem value="asc">오래된순</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* 상태 필터 */}
        <Box>
          <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
            상태
          </Typography>
          <FormControl 
            size="small" 
            sx={{ 
              minWidth: 120,
              backgroundColor: 'white'
            }}
          >
            <Select
              displayEmpty
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              IconComponent={KeyboardArrowDownIcon}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#E0E0E0',
                },
              }}
            >
              <MenuItem value="">전체</MenuItem>
              {/* 코드 그룹 API로부터 가져온 상태 코드 목록 */}
              {statusCodes.map(code => (
                <MenuItem key={code.codeId} value={code.codeName}>
                  {code.codeName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* 활성화 상태 필터 (수정됨) */}
        <Box>
          <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
            활성화 상태
          </Typography>
          <FormControl 
            size="small" 
            sx={{ 
              minWidth: 120,
              backgroundColor: 'white'
            }}
          >
            <Select
              displayEmpty
              value={activeStatusFilter}
              onChange={(e) => setActiveStatusFilter(e.target.value)}
              IconComponent={KeyboardArrowDownIcon}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#E0E0E0',
                },
              }}
            >
              <MenuItem value="active">활성화</MenuItem>
              <MenuItem value="inactive">만료</MenuItem>
              <MenuItem value="all">전체</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* 기간 필터 */}
        <Box>
          <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
            기간
          </Typography>
          <DateRangeButton
            startDate={startDate}
            endDate={endDate}
            isActive={dateFilterActive}
            onClick={handleOpenDateDialog}
            getDateRangeText={getDateRangeText}
            buttonProps={{
              startIcon: <CalendarTodayIcon />,
              endIcon: <KeyboardArrowDownIcon />
            }}
          />
        </Box>
        
        {/* 이번 달 보험 만료 필터 추가 */}
        <Box>
          <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
            보험만료 예정
          </Typography>
          <Button
            variant={currentMonthExpiryFilter ? "contained" : "outlined"}
            size="small"
            onClick={() => setCurrentMonthExpiryFilter(!currentMonthExpiryFilter)}
            sx={{
              minWidth: 100,
              height: 40,
              borderColor: currentMonthExpiryFilter ? '#1976d2' : '#E0E0E0',
              backgroundColor: currentMonthExpiryFilter ? '#1976d2' : 'white',
              color: currentMonthExpiryFilter ? 'white' : '#666',
              '&:hover': {
                backgroundColor: currentMonthExpiryFilter ? '#1565c0' : 'rgba(25, 118, 210, 0.04)',
                borderColor: currentMonthExpiryFilter ? '#1565c0' : '#BDBDBD',
              },
            }}
          >
            {currentMonthExpiryFilter ? '이번 달 만료' : '이번 달 만료'}
          </Button>
        </Box>
        
        {/* 날짜 범위 선택 캘린더 다이얼로그 */}
        <DateRangeCalendar
          startDate={startDate}
          endDate={endDate}
          onDateChange={handleDateChange}
          open={dateDialogOpen}
          onClose={handleCloseDateDialog}
          onApply={handleApplyDateFilter}
          onReset={handleResetDateFilter}
        />
      </Box>

      {/* 계약 목록 */}
      <Box sx={{ backgroundColor: 'white', borderRadius: 2, mt: 3 }}>
        {/* 검색 결과 요약 */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          p: 2, 
          borderBottom: '1px solid #EEEEEE' 
        }}>
          <Typography variant="body2" sx={{ color: '#666' }}>
            전체 {contracts.length}건 중 {filteredContracts.length}건 검색됨
          </Typography>
          {(searchQuery || statusFilter || activeStatusFilter !== 'active' || dateFilterActive || currentMonthExpiryFilter) && (
            <Typography variant="body2" sx={{ color: '#1976d2' }}>
              {searchQuery && `검색어: "${searchQuery}" `}
              {statusFilter && `상태: ${statusFilter} `}
              {activeStatusFilter !== 'active' && `활성화: ${activeStatusFilter === 'inactive' ? '만료' : '전체'} `}
              {dateFilterActive && `기간: ${getDateRangeText()} `}
              {currentMonthExpiryFilter && `이번 달 보험 만료 `}
            </Typography>
          )}
        </Box>
        
        {/* 목록 헤더 */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: '180px 1.3fr 120px 150px 150px 150px 150px 50px',
          p: 2,
          borderBottom: '1px solid #EEEEEE',
          backgroundColor: '#F8F9FA'
        }}>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>계약번호</Typography>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>계약명</Typography>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>계약상태</Typography>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>수탁사업자명</Typography>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>매장 전화번호</Typography>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>보험시작일</Typography>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>보험종료일</Typography>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>관리</Typography>
        </Box>

        {/* 계약 목록 또는 빈 상태 메시지 */}
        {filteredContracts.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">검색 조건에 맞는 계약이 없습니다.</Typography>
          </Box>
        ) : (
          // 계약 목록 아이템
          filteredContracts.map((contract) => (
            <Box 
              key={contract.id}
              sx={{ 
                display: 'grid',
                gridTemplateColumns: '180px 1.3fr 120px 150px 150px 150px 150px 50px',
                p: 2,
                borderBottom: '1px solid #EEEEEE',
                '&:hover': { backgroundColor: '#F8F9FA' }
              }}
            >
              <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                {contract.contractNumber || '-'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <Box 
                  onClick={() => handleContractClick(contract.id)}
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': {
                      '& .contract-title': {
                        color: '#1976d2'
                      }
                    }
                  }}
                >
                  <Typography className="contract-title">{contract.title}</Typography>
                  <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 0.5 }}>
                    {contract.participants?.map(p => p.name).join(', ')}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {renderStatusChip(contract)}
              </Box>
              <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                {contract.companyName || '-'}
              </Typography>
              <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                {contract.storeTelNumber || '-'}
              </Typography>
              <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                {contract.insuranceStartDate || '-'}
              </Typography>
              <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                {contract.insuranceEndDate || '-'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton size="small" onClick={(e) => handleMenuClick(e, contract.id)}>
                  <MoreVertIcon />
                </IconButton>
              </Box>
            </Box>
          ))
        )}
      </Box>

      {/* 계약 관리 메뉴 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {/* 재계약 메뉴 추가 */}
        <MenuItem onClick={handleOpenRenewModal}>재계약</MenuItem>
      </Menu>
      
      {/* 재계약 모달 */}
      <ContractRenewModal
        open={renewModalOpen}
        onClose={handleCloseRenewModal}
        contract={selectedContract}
        company={selectedCompany}
        onSuccess={handleRenewSuccess}
      />
      
      {/* 알림 스낵바 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ContractList;