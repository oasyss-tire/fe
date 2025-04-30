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
  TablePagination,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Chip,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import PersonIcon from '@mui/icons-material/Person';
import ArticleIcon from '@mui/icons-material/Article';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SettingsIcon from '@mui/icons-material/Settings';
import BusinessIcon from '@mui/icons-material/Business';
import format from 'date-fns/format';
import { ko } from 'date-fns/locale';
import ContractEventLogService from '../../services/ContractEventLogService';

// 이벤트 로그 페이지
const ContractEventLogPage = () => {
  // 상태 관리
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(true);
  const [searchApplied, setSearchApplied] = useState(false);
  
  // 필터 상태
  const [filters, setFilters] = useState({
    contractId: '',
    participantId: '',
    eventTypeCodeId: '',
    startDate: null,
    endDate: null
  });

  // 이벤트 타입 옵션 (실제로는 API에서 가져오거나 props로 전달받아야 함)
  const eventTypes = [
    { value: '001005_0001', label: '계약 생성' },
    { value: '001005_0002', label: '서명 요청' },
    { value: '001005_0003', label: '서명 완료' },
    { value: '001005_0004', label: '계약 취소' },
    { value: '001005_0005', label: '계약 수정' }
  ];

  // 회사 옵션 (목업 데이터)
  const companies = [
    { value: 1, label: '(주)타이어뱅크' },
    { value: 2, label: '(주)미래타이어' },
    { value: 3, label: '(주)굿타이어' },
    { value: 4, label: '(주)글로벌타이어' },
    { value: 5, label: '(주)오토웨이' }
  ];

  // 컴포넌트 마운트 시 로그 데이터 불러오기
  useEffect(() => {
    if (searchApplied) {
      fetchLogs();
    }
  }, [page, rowsPerPage, searchApplied]);

  // 서버에서 로그 데이터 조회
  const fetchLogs = async () => {
    setLoading(true);
    
    try {
      // API 연동 - 백엔드 개발이 완료되면 아래 주석을 해제하세요
      /*
      const response = await ContractEventLogService.searchEventLogs({
        page,
        size: rowsPerPage,
        contractId: filters.contractId || null,
        participantId: filters.participantId || null,
        eventTypeCodeId: filters.eventTypeCodeId || null,
        startDate: filters.startDate,
        endDate: filters.endDate
      });
      
      setLogs(response.data.content || []);
      setTotalCount(response.data.totalElements || 0);
      */
      
      // 목업 데이터 (API 연동 전까지 사용)
      setTimeout(() => {
        // 현재 날짜를 기준으로 목업 데이터 생성
        const currentDate = new Date();
        const days = 10; // 최근 10일간의 로그
        
        let mockLogs = [];
        
        for (let i = 0; i < days; i++) {
          const logDate = new Date(currentDate);
          logDate.setDate(logDate.getDate() - i);
          
          // 하루에 1~5개의 로그 생성
          const logsPerDay = Math.floor(Math.random() * 5) + 1;
          
          for (let j = 0; j < logsPerDay; j++) {
            const eventTypeIndex = Math.floor(Math.random() * eventTypes.length);
            const companyIndex = Math.floor(Math.random() * companies.length);
            
            const logTime = new Date(logDate);
            logTime.setHours(9 + Math.floor(Math.random() * 8)); // 9시~17시 사이
            logTime.setMinutes(Math.floor(Math.random() * 60));
            
            mockLogs.push({
              id: mockLogs.length + 1,
              contractId: 100 + mockLogs.length,
              contractNumber: `CT-2025-${(logDate.getMonth() + 1).toString().padStart(2, '0')}-${logDate.getDate().toString().padStart(2, '0')}-${(mockLogs.length % 100).toString().padStart(3, '0')}`,
              contractTitle: `타이어 공급 계약서 - ${companies[companyIndex].label}`,
              participantId: 200 + companyIndex,
              participantName: `담당자 ${companyIndex + 1}`,
              companyId: companies[companyIndex].value,
              companyName: companies[companyIndex].label,
              eventTypeCodeId: eventTypes[eventTypeIndex].value,
              eventTypeName: eventTypes[eventTypeIndex].label,
              eventTime: logTime.toISOString(),
              actorId: `user${mockLogs.length % 3 + 1}`,
              actorName: `사용자 ${mockLogs.length % 3 + 1}`,
              actorTypeCodeId: mockLogs.length % 2 === 0 ? '001006_0001' : '001006_0002',
              actorTypeName: mockLogs.length % 2 === 0 ? '관리자' : '일반 사용자',
              additionalData: JSON.stringify({ key: `value${mockLogs.length}` }),
              ipAddress: `192.168.0.${mockLogs.length + 1}`,
              documentId: `doc_${mockLogs.length + 1}.pdf`,
              description: `${eventTypes[eventTypeIndex].label} 작업이 수행되었습니다. (${companies[companyIndex].label})`
            });
          }
        }
        
        // 날짜 순으로 정렬 (최신 순)
        mockLogs.sort((a, b) => new Date(b.eventTime) - new Date(a.eventTime));
        
        // 필터 적용
        if (filters.contractId) {
          mockLogs = mockLogs.filter(log => 
            log.contractNumber.includes(filters.contractId) || 
            log.contractTitle.includes(filters.contractId)
          );
        }
        
        if (filters.participantId) {
          mockLogs = mockLogs.filter(log => 
            log.participantName.includes(filters.participantId) ||
            log.companyName.includes(filters.participantId)
          );
        }
        
        if (filters.eventTypeCodeId) {
          mockLogs = mockLogs.filter(log => log.eventTypeCodeId === filters.eventTypeCodeId);
        }
        
        if (filters.startDate) {
          const startDateTime = new Date(filters.startDate);
          startDateTime.setHours(0, 0, 0, 0);
          mockLogs = mockLogs.filter(log => new Date(log.eventTime) >= startDateTime);
        }
        
        if (filters.endDate) {
          const endDateTime = new Date(filters.endDate);
          endDateTime.setHours(23, 59, 59, 999);
          mockLogs = mockLogs.filter(log => new Date(log.eventTime) <= endDateTime);
        }
        
        setLogs(mockLogs);
        setTotalCount(mockLogs.length);
        setLoading(false);
      }, 500);
      
    } catch (error) {
      console.error('로그 조회 중 오류 발생:', error);
      setLoading(false);
    }
  };

  // 필터 적용 처리
  const handleApplyFilter = () => {
    setPage(0);
    setSearchApplied(true);
    fetchLogs();
  };

  // 필터 초기화
  const handleResetFilter = () => {
    setFilters({
      contractId: '',
      participantId: '',
      eventTypeCodeId: '',
      startDate: null,
      endDate: null
    });
    setPage(0);
    setSearchApplied(false);
  };

  // 페이지네이션 처리
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'yyyy-MM-dd HH:mm:ss', { locale: ko });
    } catch (e) {
      return dateString;
    }
  };

  // 날짜만 포맷팅 (YYYY-MM-DD)
  const formatDateOnly = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'yyyy-MM-dd', { locale: ko });
    } catch (e) {
      return dateString;
    }
  };

  // 시간만 포맷팅 (HH:mm)
  const formatTimeOnly = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'HH:mm', { locale: ko });
    } catch (e) {
      return dateString;
    }
  };

  // 이벤트 타입별 아이콘 및 색상 설정
  const getEventTypeIcon = (eventTypeCodeId) => {
    switch(eventTypeCodeId) {
      case '001005_0001': return <ArticleIcon style={{ color: '#1976d2' }} />; // 계약 생성
      case '001005_0002': return <ArrowUpwardIcon style={{ color: '#0288d1' }} />; // 서명 요청
      case '001005_0003': return <CheckCircleIcon style={{ color: '#2e7d32' }} />; // 서명 완료
      case '001005_0004': return <CancelIcon style={{ color: '#d32f2f' }} />; // 계약 취소
      case '001005_0005': return <SettingsIcon style={{ color: '#ed6c02' }} />; // 계약 수정
      default: return <ArticleIcon />;
    }
  };

  // 이벤트 타입별 칩 색상 설정
  const getEventTypeColor = (eventTypeCodeId) => {
    switch(eventTypeCodeId) {
      case '001005_0001': return 'primary'; // 계약 생성
      case '001005_0002': return 'info';    // 서명 요청
      case '001005_0003': return 'success'; // 서명 완료
      case '001005_0004': return 'error';   // 계약 취소
      case '001005_0005': return 'warning'; // 계약 수정
      default: return 'default';
    }
  };

  // 로그를 날짜별로 그룹화
  const groupLogsByDate = () => {
    const groups = {};
    
    logs.forEach(log => {
      const dateKey = formatDateOnly(log.eventTime);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(log);
    });
    
    // 날짜별로 시간순 정렬
    Object.keys(groups).forEach(dateKey => {
      groups[dateKey].sort((a, b) => new Date(a.eventTime) - new Date(b.eventTime));
    });
    
    return groups;
  };

  const logsByDate = groupLogsByDate();
  const dateKeys = Object.keys(logsByDate).sort().reverse(); // 최신 날짜순

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        이벤트 로그
      </Typography>
      
      <Box sx={{ mb: 3, bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle1">
            검색 필터
          </Typography>
          
          <Box>
            <Tooltip title="새로고침">
              <IconButton onClick={fetchLogs} disabled={!searchApplied} size="small">
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="계약인"
              variant="outlined"
              size="small"
              select
              value={filters.participantId}
              onChange={(e) => setFilters({...filters, participantId: e.target.value})}
            >
              <MenuItem value="">선택해주세요</MenuItem>
              <MenuItem value="user1">사용자 1</MenuItem>
              <MenuItem value="user2">사용자 2</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="광고그룹"
              variant="outlined"
              size="small"
              select
              value={filters.contractId}
              onChange={(e) => setFilters({...filters, contractId: e.target.value})}
            >
              <MenuItem value="">선택해주세요</MenuItem>
              <MenuItem value="group1">광고그룹 1</MenuItem>
              <MenuItem value="group2">광고그룹 2</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="키워드"
              variant="outlined"
              size="small"
              select
              value={filters.eventTypeCodeId}
              onChange={(e) => setFilters({...filters, eventTypeCodeId: e.target.value})}
            >
              <MenuItem value="">선택해주세요</MenuItem>
              {eventTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="찾으시 단어"
              variant="outlined"
              size="small"
              placeholder="검색할 단어 입력"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              variant="contained" 
              sx={{ mr: 1 }}
              onClick={handleApplyFilter}
            >
              적용하기
            </Button>
            <Button 
              variant="outlined" 
              onClick={handleResetFilter}
            >
              초기화
            </Button>
          </Grid>
        </Grid>
      </Box>
      
      {/* 로딩 상태 */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <Typography>로딩 중...</Typography>
        </Box>
      )}
      
      {/* 검색 전 안내 메시지 */}
      {!searchApplied && !loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <Typography color="text.secondary">원하는 조건으로 검색하려면 위에서 필터를 설정하고 '적용하기' 버튼을 클릭하세요.</Typography>
        </Box>
      )}
      
      {/* 검색 결과 없음 */}
      {searchApplied && !loading && logs.length === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <Typography color="text.secondary">검색 결과가 없습니다. 다른 조건으로 다시 시도해보세요.</Typography>
        </Box>
      )}
      
      {/* 날짜별 로그 타임라인 */}
      {searchApplied && !loading && logs.length > 0 && (
        <Box>
          {dateKeys.map(dateKey => (
            <Paper key={dateKey} sx={{ mb: 3, p: 0, overflow: 'hidden', boxShadow: 'none', border: '1px solid #eee' }}>
              <Box sx={{ bgcolor: '#f5f5f5', p: 1.5, borderBottom: '1px solid #eee' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                  {dateKey}
                </Typography>
              </Box>
              
              {logsByDate[dateKey].map((log) => (
                <Box 
                  key={log.id} 
                  sx={{ 
                    display: 'flex', 
                    p: 0,
                    borderBottom: '1px solid #eee',
                    '&:last-child': {
                      borderBottom: 'none'
                    },
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.02)'
                    }
                  }}
                >
                  <Box sx={{ 
                    width: 80, 
                    p: 2,
                    display: 'flex',
                    justifyContent: 'center',
                    color: 'text.secondary',
                    fontWeight: 'medium',
                    fontSize: '0.9rem',
                    borderRight: '1px solid #eee'
                  }}>
                    {formatTimeOnly(log.eventTime)}
                  </Box>
                  
                  <Box sx={{ 
                    flex: 1,
                    p: 2,
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: log.eventTypeCodeId === '001005_0003' ? '#8bc34a' : '#4caf50',
                      mr: 2
                    }}>
                      <CheckCircleIcon sx={{ color: 'white', fontSize: 16 }} />
                    </Box>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2">
                        {log.description}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ ml: 2 }}>
                      <Box sx={{ textAlign: 'right' }}>
                        <Box sx={{ display: 'inline-flex', mb: 1 }}>
                          <Button 
                            size="small" 
                            variant="outlined" 
                            sx={{ fontSize: '0.7rem', minWidth: 'auto', py: 0.2, px: 1, height: 'auto' }}
                          >
                            상세 보기
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ContractEventLogPage;