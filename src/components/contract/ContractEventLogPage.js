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
  const eventTypes = [
    { value: '001005_0001', label: '계약 생성' },
    { value: '001005_0002', label: '계약 수정' },
    { value: '001005_0003', label: '상태 변경' },
    { value: '001005_0004', label: '계약 승인' },
    { value: '001005_0005', label: '계약 거부' },
    { value: '001005_0006', label: '계약 비활성화' },
    { value: '001005_0007', label: '참여자 서명 완료' },
    { value: '001005_0008', label: '재서명 요청(관리자→참여자)' },
    { value: '001005_0009', label: '재서명 승인' },
    { value: '001005_0010', label: '재서명 완료' },
    { value: '001005_0011', label: '재서명 요청(참여자→관리자)' },
    { value: '001005_0012', label: '참여자 문서 업로드' }
  ];

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
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        계약 이벤트 로그
      </Typography>
      
      {/* 검색 필터 영역 - 레이아웃 심플하게 수정 */}
      <Paper sx={{ mb: 3, overflow: 'hidden', borderRadius: 1, border: '1px solid #e0e0e0' }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          p: 2, 
          borderBottom: '1px solid #eee',
          bgcolor: '#f8f9fa'
        }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            검색 필터
          </Typography>
        </Box>
        
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setOpenContractDialog(true)}
                startIcon={<BusinessIcon />}
                sx={{ 
                  justifyContent: 'flex-start', 
                  textAlign: 'left',
                  height: '40px',
                  borderColor: '#e0e0e0'
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
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="이벤트 유형"
                variant="outlined"
                size="small"
                select
                value={filters.eventTypeCodeId}
                onChange={(e) => setFilters({...filters, eventTypeCodeId: e.target.value})}
              >
                <MenuItem value="">모든 이벤트</MenuItem>
                {eventTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  variant="contained" 
                  onClick={handleApplyFilter}
                  disabled={!selectedContract || loading}
                  sx={{ flex: 1 }}
                >
                  {loading ? <CircularProgress size={24} /> : '조회하기'}
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={handleResetFilter}
                  disabled={loading}
                >
                  초기화
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
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
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
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
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <Typography color="text.secondary">업체와 계약을 선택한 후 조회하기 버튼을 클릭하세요.</Typography>
        </Box>
      )}
      
      {/* 검색 결과 없음 */}
      {searchApplied && !loading && logs.length === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <Typography color="text.secondary">검색 결과가 없습니다. 다른 계약을 선택해보세요.</Typography>
        </Box>
      )}
      
      {/* 검색 결과 헤더 및 계약 정보 - 카운트 부분 제거 */}
      {searchApplied && !loading && logs.length > 0 && logs[0] && (
        <Box sx={{ mb: 3 }}>
          <Paper sx={{ p: 2, mb: 2, border: '1px solid #e0e0e0' }}>
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
                              <>수탁자: <f>{log.participantName}</f></> : 
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