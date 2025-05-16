import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper,
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
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import ArticleIcon from '@mui/icons-material/Article';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import format from 'date-fns/format';
import { ko } from 'date-fns/locale';
import ContractEventLogService from '../../services/ContractEventLogService';
import ContractSelectDialog from './ContractSelectDialog';

// 이벤트 로그 페이지
const ContractEventLogPage = () => {
  // 상태 관리
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchApplied, setSearchApplied] = useState(false);
  const [error, setError] = useState(null);
  
  // 선택된 수탁업체 및 계약 정보
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedContract, setSelectedContract] = useState(null);
  
  // 다이얼로그 상태
  const [openContractDialog, setOpenContractDialog] = useState(false);
  
  // 필터 상태
  const [filters, setFilters] = useState({
    keyword: '',
    eventTypeCodeId: ''
  });

  // 이벤트 타입 목록
  const [eventTypes, setEventTypes] = useState([]);
  const [eventTypesLoading, setEventTypesLoading] = useState(false);

  // 이벤트 타입 코드 조회
  useEffect(() => {
    const fetchEventTypes = async () => {
      setEventTypesLoading(true);
      try {
        const response = await fetch('http://localhost:8080/api/codes/groups/001005/codes/active', {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('이벤트 타입 코드를 불러오는데 실패했습니다.');
        }

        const data = await response.json();
        // sortOrder 기준으로 정렬
        const sortedData = data.sort((a, b) => a.sortOrder - b.sortOrder);
        setEventTypes(sortedData);
      } catch (error) {
        console.error('이벤트 타입 코드 조회 실패:', error);
        setError('이벤트 타입 코드를 불러오는데 실패했습니다.');
      } finally {
        setEventTypesLoading(false);
      }
    };

    fetchEventTypes();
  }, []);

  // 수탁업체와 계약 선택 처리
  const handleSelectCompanyAndContract = (company, contract) => {
    setSelectedCompany(company);
    setSelectedContract(contract);
    
    // 계약 정보에 createdAt이 없을 경우 현재 날짜 기본값으로 설정
    if (contract && !contract.createdAt) {
      contract.createdAt = new Date().toISOString();
    }
    
    // 선택 후 자동으로 로그 조회
    fetchEventLogsByContract(contract.id);
  };

  // 특정 계약의 이벤트 로그 조회
  const fetchEventLogsByContract = async (contractId) => {
    if (!contractId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await ContractEventLogService.getEventLogsByContract(contractId);
      setLogs(response.data || []);
      setSearchApplied(true);
    } catch (error) {
      console.error('이벤트 로그 조회 중 오류 발생:', error);
      setError('이벤트 로그를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 필터 적용 처리
  const handleApplyFilter = () => {
    if (selectedContract) {
      fetchEventLogsByContract(selectedContract.id);
    } else {
      setError('업체와 계약을 선택해주세요.');
      setOpenContractDialog(true);
    }
  };

  // 필터 초기화
  const handleResetFilter = () => {
    setSelectedCompany(null);
    setSelectedContract(null);
    setFilters({
      keyword: '',
      eventTypeCodeId: ''
    });
    setLogs([]);
    setSearchApplied(false);
  };

  // 날짜 포맷팅 (YYYY-MM-DD)
  const formatDateOnly = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'yyyy.MM.dd');
    } catch (e) {
      return dateString;
    }
  };

  // 시간 포맷팅 (HH:mm)
  const formatTimeOnly = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'HH:mm');
    } catch (e) {
      return dateString;
    }
  };

  // 이벤트 타입에 따른 배경색 스타일 얻기
  const getEventTypeStyle = (eventTypeCodeId) => {
    // 관리자 행동 이벤트 (하늘색)
    const adminEvents = [
      '001005_0001', // 계약 생성
      '001005_0004', // 계약 승인
      '001005_0005', // 계약 거부
      '001005_0008', // 재서명 요청(관리자→참여자)
      '001005_0009'  // 재서명 승인
    ];
    
    // 관리자 이벤트인 경우 하늘색 계열
    if (adminEvents.includes(eventTypeCodeId)) {
      return {
        color: '#0277bd',
        bgcolor: '#e1f5fe'
      };
    } 
    // 계약자 이벤트인 경우 주황색 계열
    else {
      return {
        color: '#ed6c02',
        bgcolor: '#fff3e0'
      };
    }
  };

  // 로그를 날짜별로 그룹화
  const groupLogsByDate = () => {
    const groups = {};
    
    // 이벤트 타입 필터 적용
    let filteredLogs = logs;
    if (filters.eventTypeCodeId) {
      filteredLogs = logs.filter(log => log.eventTypeCodeId === filters.eventTypeCodeId);
    }
    
    filteredLogs.forEach(log => {
      const dateKey = formatDateOnly(log.eventTime);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(log);
    });
    
    // 날짜별로 시간순 정렬
    Object.keys(groups).forEach(dateKey => {
      groups[dateKey].sort((a, b) => new Date(b.eventTime) - new Date(a.eventTime));
    });
    
    return groups;
  };

  const logsByDate = groupLogsByDate();
  const dateKeys = Object.keys(logsByDate).sort().reverse(); // 최신 날짜순

  return (
    <Box sx={{ p: 3, backgroundColor: '#F8F8FE', minHeight: '100vh' }}>
      {/* 상단 헤더 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#3A3A3A' }}>
          계약 이벤트 로그
        </Typography>
      </Box>
      
      {/* 검색 필터 영역 */}
      <Box sx={{ 
        backgroundColor: 'white',
        borderRadius: 2,
        border: '1px solid #EEEEEE',
        p: 3,
        mb: 3
      }}>
        <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end', justifyContent: 'space-between' }}>
          {/* 업체 및 계약 선택 */}
          <Box sx={{ flex: 1, minWidth: '300px' }}>
            <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
              업체 및 계약 선택
            </Typography>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => setOpenContractDialog(true)}
              startIcon={<BusinessIcon />}
              sx={{ 
                height: '40px',
                justifyContent: 'flex-start',
                textAlign: 'left',
                color: 'rgba(30, 30, 30, 0.87)',
                borderColor: '#E0E0E0',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
              }}
            >
              {selectedCompany && selectedContract ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.primary' }}>
                    {selectedCompany.storeName || selectedCompany.companyName} / {selectedContract.contractNumber}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  업체 및 계약 선택하기
                </Typography>
              )}
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            {/* 이벤트 유형 필터 */}
            <Box sx={{ width: '200px' }}>
              <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
                이벤트 유형
              </Typography>
              <TextField
                fullWidth
                select
                size="small"
                value={filters.eventTypeCodeId}
                onChange={(e) => setFilters({...filters, eventTypeCodeId: e.target.value})}
                disabled={eventTypesLoading}
                sx={{ 
                  backgroundColor: 'white',
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#E0E0E0',
                    },
                  },
                }}
              >
                <MenuItem value="">모든 이벤트</MenuItem>
                {eventTypes.map((type) => (
                  <MenuItem key={type.codeId} value={type.codeId}>
                    {type.codeName}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            
            {/* 검색 버튼 */}
            <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleApplyFilter}
                disabled={loading}
                sx={{ height: '40px' }}
              >
                {loading ? <CircularProgress size={24} /> : '조회하기'}
              </Button>
            </Box>
          </Box>
        </Box>
        
        {/* 필터 초기화 버튼 */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleResetFilter}
            disabled={loading}
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
      
      {/* 계약 선택 다이얼로그 */}
      <ContractSelectDialog 
        open={openContractDialog}
        onClose={() => setOpenContractDialog(false)}
        onSelect={handleSelectCompanyAndContract}
      />
      
      {/* 에러 메시지 */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
      
      {/* 로딩 상태 */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {/* 검색 전 안내 메시지 */}
      {!searchApplied && !loading && (
        <Paper sx={{ p: 4, textAlign: 'center', mb: 3, borderRadius: 2, border: '1px solid #EEEEEE' }}>
          <Typography color="text.secondary">업체와 계약을 선택한 후 조회하기 버튼을 클릭하세요.</Typography>
        </Paper>
      )}
      
      {/* 검색 결과 없음 */}
      {searchApplied && !loading && logs.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', mb: 3, borderRadius: 2, border: '1px solid #EEEEEE' }}>
          <Typography color="text.secondary">검색 결과가 없습니다. 다른 계약을 선택해보세요.</Typography>
        </Paper>
      )}
      
      {/* 검색 결과 헤더 및 계약 정보 */}
      {searchApplied && !loading && logs.length > 0 && logs[0] && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2, border: '1px solid #EEEEEE' }}>
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 0.5, fontWeight: '500', color: 'text.primary' }}>
              {selectedCompany.storeName || selectedCompany.companyName} / {selectedContract.contractNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              총 {logs.length}건의 이벤트 로그가 있습니다.
              {filters.eventTypeCodeId && ` (이벤트 유형 필터 적용됨)`}
            </Typography>
            
            {/* 색상 설명 추가 */}
            <Box sx={{ mt: 2, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 16, height: 16, borderRadius: 1, bgcolor: '#e1f5fe' }}></Box>
                <Typography variant="caption">관리자 로그</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 16, height: 16, borderRadius: 1, bgcolor: '#fff3e0' }}></Box>
                <Typography variant="caption">계약자 로그</Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      )}
      
      {/* 날짜별 로그 타임라인 */}
      {searchApplied && !loading && logs.length > 0 && (
        <Box>
          {dateKeys.map(dateKey => (
            <Paper key={dateKey} sx={{ mb: 3, overflow: 'hidden', borderRadius: 2, border: '1px solid #EEEEEE' }}>
              <Box sx={{ bgcolor: '#f5f5f5', p: 1.5, borderBottom: '1px solid #eee' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                  {dateKey}
                </Typography>
              </Box>
              
              {logsByDate[dateKey].map((log) => {
                const typeStyle = getEventTypeStyle(log.eventTypeCodeId);
                const iconColor = typeStyle.color; // 아이콘 색상을 텍스트 색상과 동일하게 설정
                
                return (
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
                        bgcolor: 'rgba(0, 0, 0, 0.01)'
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
                      borderRight: '1px solid #eee',
                      alignItems: 'center'
                    }}>
                      {formatTimeOnly(log.eventTime)}
                    </Box>
                    
                    <Box sx={{ 
                      flex: 1,
                      p: 2,
                      display: 'flex',
                      alignItems: 'flex-start',
                      overflow: 'hidden'
                    }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <Box sx={{ display: 'flex', mb: 0.5, alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                          <Chip 
                            label={log.eventTypeName} 
                            size="small"
                            sx={{ ...typeStyle }}
                          />
                          
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PersonIcon fontSize="small" sx={{ color: iconColor }} />
                            {log.participantName ? 
                              <>수탁자: <span style={{ fontWeight: 500 }}>{log.participantName}</span></> : 
                              <>액터: {log.actorName} ({log.actorTypeName})</>
                            }
                          </Typography>
                        </Box>
                        
                        <Typography 
                          variant="body2"
                          sx={{ 
                            mb: log.documentId ? 1 : 0,
                            color: 'text.primary',
                            lineHeight: 1.5
                          }}
                        >
                          {log.description}
                        </Typography>
                        
                        {log.documentId && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ArticleIcon fontSize="small" sx={{ fontSize: 14 }} />
                            {log.documentId}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ContractEventLogPage;