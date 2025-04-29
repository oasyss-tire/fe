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
  Chip,
  Pagination,
  CircularProgress,
  Snackbar,
  Alert,
  FormControl,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  InputLabel,
  InputAdornment as MuiInputAdornment
} from '@mui/material';
import { 
  Search as SearchIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

// AS 상태 칩 색상 매핑
const statusColorMap = {
  '002010_0001': 'default', // 접수중
  '002010_0002': 'warning', // AS 접수완료
  '002010_0003': 'success'  // AS 수리완료
};

// 시설물 상태 칩 색상 매핑
const facilityStatusColorMap = {
  '002003_0001': 'success', // 사용중 (정상)
  '002003_0002': 'error',   // 수리중
  '002003_0005': 'default'  // 폐기
};

const ServiceRequestList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [priorityCodes, setPriorityCodes] = useState([]);
  const [statusCodes, setStatusCodes] = useState([]);
  
  // 검색 필터 상태
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedStatusCode, setSelectedStatusCode] = useState('');
  const [selectedTypeCode, setSelectedTypeCode] = useState('');
  const [selectedPriorityCode, setSelectedPriorityCode] = useState('');
  
  // 페이지네이션
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // 알림 스낵바
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // 요청 승인 관련 상태
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [expectedCompletionDate, setExpectedCompletionDate] = useState('');
  const [expectedCompletionHour, setExpectedCompletionHour] = useState('17'); // 기본값 17시로 설정
  
  // 완료 처리 관련 상태
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [repairCost, setRepairCost] = useState('');
  const [formattedRepairCost, setFormattedRepairCost] = useState('');
  
  // 초기 데이터 로딩
  useEffect(() => {
    fetchCodes();
    fetchServiceRequests();
  }, [page, selectedStatusCode, selectedTypeCode, selectedPriorityCode]);
  
  // 코드 데이터 로드
  const fetchCodes = async () => {
    try {
      // AS 유형 코드 조회
      const serviceTypeResponse = await fetch('http://localhost:8080/api/codes/groups/003001/codes/active', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      if (serviceTypeResponse.ok) {
        const data = await serviceTypeResponse.json();
        setServiceTypes(data);
      }
      
      // 우선순위 코드 조회
      const priorityResponse = await fetch('http://localhost:8080/api/codes/groups/003002/codes/active', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      if (priorityResponse.ok) {
        const data = await priorityResponse.json();
        setPriorityCodes(data);
      }
      
      // 상태 코드 조회
      const statusResponse = await fetch('http://localhost:8080/api/codes/groups/003003/codes/active', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      if (statusResponse.ok) {
        const data = await statusResponse.json();
        setStatusCodes(data);
      }
    } catch (error) {
      console.error('코드 조회 에러:', error);
      showSnackbar('코드 데이터 로딩 중 오류가 발생했습니다.', 'error');
    }
  };
  
  // AS 접수 목록 조회
  const fetchServiceRequests = async () => {
    setLoading(true);
    try {
      // 검색 파라미터 구성
      let url = `http://localhost:8080/api/service-requests/paged?page=${page}&size=10`;
      
      if (selectedStatusCode) {
        url += `&statusCode=${selectedStatusCode}`;
      }
      
      if (selectedTypeCode) {
        url += `&serviceTypeCode=${selectedTypeCode}`;
      }
      
      if (selectedPriorityCode) {
        url += `&priorityCode=${selectedPriorityCode}`;
      }
      
      if (searchKeyword) {
        url += `&keyword=${encodeURIComponent(searchKeyword)}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('AS 접수 목록을 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      setServiceRequests(data.content || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('AS 접수 목록 조회 실패:', error);
      showSnackbar('AS 접수 목록을 불러오는데 실패했습니다.', 'error');
    
    } finally {
      setLoading(false);
    }
  };
  
  // 검색 키워드 변경 처리
  const handleSearchChange = (e) => {
    setSearchKeyword(e.target.value);
  };
  
  // 검색 실행
  const handleSearch = () => {
    setPage(0); // 페이지 초기화
    fetchServiceRequests();
  };
  
  // 상태 필터 변경 처리
  const handleStatusChange = (e) => {
    setSelectedStatusCode(e.target.value);
  };
  
  // 유형 필터 변경 처리
  const handleTypeChange = (e) => {
    setSelectedTypeCode(e.target.value);
  };
  
  // 우선순위 필터 변경 처리
  const handlePriorityChange = (e) => {
    setSelectedPriorityCode(e.target.value);
  };
  
  // 페이지 변경 처리
  const handlePageChange = (event, value) => {
    setPage(value - 1);
  };
  
  // 상세보기로 이동
  const handleViewDetails = (serviceRequestId) => {
    navigate(`/service-request/${serviceRequestId}`);
  };
  
  // 새 AS 접수
  const handleCreateNew = () => {
    navigate('/service-request/create');
  };
  
  // 알림 스낵바 표시
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };
  
  // 알림 스낵바 닫기
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };
  
  // 날짜 포맷 함수
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'yy-MM-dd');
    } catch (error) {
      return dateString;
    }
  };
  
  // AS 요청 상세 조회
  const fetchRequestDetail = async (id) => {
    try {
      const response = await fetch(`http://localhost:8080/api/service-requests/${id}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('AS 요청 상세 정보를 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      setCurrentRequest(data);
    } catch (error) {
      console.error('AS 요청 상세 조회 실패:', error);
      showSnackbar('AS 요청 상세 정보를 불러오는데 실패했습니다.', 'error');
    }
  };
  
  // AS 요청 승인 처리 시작
  const handleApproveRequest = (serviceRequestId) => {
    setCurrentRequestId(serviceRequestId);
    fetchRequestDetail(serviceRequestId);
    
    // 기본 예상 완료일 설정 (현재로부터 7일 후)
    const date = new Date();
    date.setDate(date.getDate() + 7);
    setExpectedCompletionDate(format(date, 'yyyy-MM-dd'));
    setExpectedCompletionHour('17'); // 기본값 17시로 설정
    
    setApproveDialogOpen(true);
  };
  
  // AS 요청 승인 제출
  const submitApproval = async () => {
    try {
      // 날짜와 시간을 결합하여 ISO 형식의 문자열로 변환 (분과 초는 00으로 고정)
      const formattedDateTime = `${expectedCompletionDate}T${expectedCompletionHour}:00:00`;
      
      const response = await fetch(`http://localhost:8080/api/service-requests/${currentRequestId}/receive`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          expectedCompletionDate: formattedDateTime
        })
      });
      
      if (!response.ok) {
        throw new Error('AS 요청 승인 처리에 실패했습니다.');
      }
      
      showSnackbar('AS 요청이 성공적으로 승인되었습니다.', 'success');
      setApproveDialogOpen(false);
      fetchServiceRequests(); // 목록 새로고침
    } catch (error) {
      console.error('AS 요청 승인 실패:', error);
      showSnackbar('AS 요청 승인 처리에 실패했습니다.', 'error');
    }
  };
  
  // 수리 비용 입력 처리 (천 단위 구분 기호 표시)
  const handleRepairCostChange = (e) => {
    // 숫자와 콤마만 허용
    const value = e.target.value.replace(/[^\d]/g, '');
    
    // 최대 1,000조(1,000,000,000,000,000)까지만 허용
    if (value === '' || (Number(value) <= 1000000000000000 && value.length <= 16)) {
      setRepairCost(value);
      
      // 천 단위 구분 기호 표시
      setFormattedRepairCost(
        value === '' ? '' : Number(value).toLocaleString('ko-KR')
      );
    }
  };
  
  // AS 요청 완료 처리 시작
  const handleCompleteRequest = (serviceRequestId) => {
    setCurrentRequestId(serviceRequestId);
    fetchRequestDetail(serviceRequestId);
    setRepairCost('');
    setFormattedRepairCost('');
    setCompleteDialogOpen(true);
  };
  
  // AS 요청 완료 제출
  const submitCompletion = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/service-requests/${currentRequestId}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cost: parseInt(repairCost, 10) || 0
        })
      });
      
      if (!response.ok) {
        throw new Error('AS 요청 완료 처리에 실패했습니다.');
      }
      
      showSnackbar('AS 요청이 성공적으로 완료 처리되었습니다.', 'success');
      setCompleteDialogOpen(false);
      fetchServiceRequests(); // 목록 새로고침
    } catch (error) {
      console.error('AS 요청 완료 처리 실패:', error);
      showSnackbar('AS 요청 완료 처리에 실패했습니다.', 'error');
    }
  };
  
  return (
    <Box sx={{ p: 3, backgroundColor: '#F8F8FE', minHeight: '100vh' }}>
      {/* 상단 헤더 */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        mb: 3 
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#3A3A3A' }}>
          AS 접수 목록
        </Typography>
        
        {/* 통계 카드 - 실제 데이터로 대체 필요 */}
        <Box sx={{ 
          display: 'flex',
          gap: 1.5,
          backgroundColor: '#E8F3FF',
          p: 1.5,
          borderRadius: 1
        }}>
          <Box sx={{ 
            px: 2.5, 
            py: 1, 
            backgroundColor: '#E8F3FF', 
            borderRadius: 1,
            minWidth: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                fontSize: '0.75rem',
                mb: 0.5 
              }}
            >
              전체 접수
            </Typography>
            <Typography 
              color="primary" 
              sx={{ 
                fontSize: '1.125rem',
                fontWeight: 600,
                lineHeight: 1 
              }}
            >
              {serviceRequests.length} 건
            </Typography>
          </Box>
          <Box sx={{ 
            px: 2.5, 
            py: 1, 
            backgroundColor: '#E8F3FF', 
            borderRadius: 1,
            minWidth: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                fontSize: '0.75rem',
                mb: 0.5 
              }}
            >
              처리 대기
            </Typography>
            <Typography 
              color="primary" 
              sx={{ 
                fontSize: '1.125rem',
                fontWeight: 600,
                lineHeight: 1 
              }}
            >
              {serviceRequests.filter(req => req.statusCode === '003003_0001' || req.statusCode === '003003_0002').length} 건
            </Typography>
          </Box>
          <Box sx={{ 
            px: 2.5, 
            py: 1, 
            backgroundColor: '#E8F3FF', 
            borderRadius: 1,
            minWidth: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                fontSize: '0.75rem',
                mb: 0.5 
              }}
            >
              완료
            </Typography>
            <Typography 
              color="primary" 
              sx={{ 
                fontSize: '1.125rem',
                fontWeight: 600,
                lineHeight: 1 
              }}
            >
              {serviceRequests.filter(req => req.statusCode === '003003_0004').length} 건
            </Typography>
          </Box>
        </Box>
      </Box>
      
      {/* 검색 및 필터 도구 바 */}
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end' }}>
        {/* 검색어 필드 */}
        <Box sx={{ flex: 1, minWidth: '200px' }}>
          <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
            검색
          </Typography>
          <TextField
            placeholder="접수번호, 시설물, 매장명 검색"
            value={searchKeyword}
            onChange={handleSearchChange}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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
        
        {/* 상태 필터 */}
        <Box sx={{ minWidth: '150px' }}>
          <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
            상태
          </Typography>
          <FormControl 
            fullWidth 
            size="small"
            sx={{ backgroundColor: 'white' }}
          >
            <Select
              value={selectedStatusCode}
              onChange={handleStatusChange}
              displayEmpty
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#E0E0E0',
                },
              }}
            >
              <MenuItem value="">모든 상태</MenuItem>
              {statusCodes.map(status => (
                <MenuItem key={status.codeId} value={status.codeId}>
                  {status.codeName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        {/* 유형 필터 */}
        <Box sx={{ minWidth: '150px' }}>
          <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
            AS 유형
          </Typography>
          <FormControl 
            fullWidth 
            size="small"
            sx={{ backgroundColor: 'white' }}
          >
            <Select
              value={selectedTypeCode}
              onChange={handleTypeChange}
              displayEmpty
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#E0E0E0',
                },
              }}
            >
              <MenuItem value="">모든 유형</MenuItem>
              {serviceTypes.map(type => (
                <MenuItem key={type.codeId} value={type.codeId}>
                  {type.codeName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        {/* 우선순위 필터 */}
        <Box sx={{ minWidth: '150px' }}>
          <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
            우선순위
          </Typography>
          <FormControl 
            fullWidth 
            size="small"
            sx={{ backgroundColor: 'white' }}
          >
            <Select
              value={selectedPriorityCode}
              onChange={handlePriorityChange}
              displayEmpty
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#E0E0E0',
                },
              }}
            >
              <MenuItem value="">모든 우선순위</MenuItem>
              {priorityCodes.map(priority => (
                <MenuItem key={priority.codeId} value={priority.codeId}>
                  {priority.codeName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>
      
      {/* AS 접수 목록 테이블 */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ mb: 3, overflow: 'auto' }}>
          <TableContainer component={Paper} sx={{ minWidth: '100%' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#F8F9FA' }}>No.</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#F8F9FA' }}>매장명</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#F8F9FA' }}>시설물 항목</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#F8F9FA' }}>품목</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#F8F9FA' }}>수량</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#F8F9FA' }}>사용연한</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#F8F9FA' }}>최초설치일</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#F8F9FA' }}>시설물 상태</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#F8F9FA' }}>요청일자</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#F8F9FA' }}>처리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {serviceRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                      AS 접수 내역이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  serviceRequests.map((request, index) => (
                    <TableRow 
                      key={request.serviceRequestId} 
                      hover
                      onClick={() => handleViewDetails(request.serviceRequestId)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{page * 10 + index + 1}</TableCell>
                      <TableCell>{request.companyName}</TableCell>
                      <TableCell>{request.facilityTypeName}</TableCell>
                      <TableCell>{request.brandName || '-'}</TableCell>
                      <TableCell>{request.quantity || '1'}</TableCell>
                      <TableCell>{request.usefulLifeMonths || '-'}</TableCell>
                      <TableCell>{formatDate(request.installationDate) || '-'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={request.serviceStatusName || request.statusName}
                          size="small"
                          color={
                            request.serviceStatusCode ? 
                              statusColorMap[request.serviceStatusCode] || 'default' : 
                              facilityStatusColorMap[request.statusCode] || 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>{formatDate(request.requestDate)}</TableCell>
                      <TableCell>
                        {request.serviceStatusCode === '002010_0001' && !request.isReceived && (
                          <Button 
                            variant="contained" 
                            size="small"
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApproveRequest(request.serviceRequestId);
                            }}
                            sx={{ fontSize: '0.7rem', py: 0.5 }}
                          >
                            요청승인
                          </Button>
                        )}
                        {request.serviceStatusCode === '002010_0002' && !request.isCompleted && (
                          <Button 
                            variant="contained" 
                            size="small"
                            color="success"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompleteRequest(request.serviceRequestId);
                            }}
                            sx={{ fontSize: '0.7rem', py: 0.5 }}
                          >
                            완료
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* 페이지네이션 */}
          {serviceRequests.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination 
                count={totalPages} 
                page={page + 1} 
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </Box>
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
      
      {/* AS 요청 승인 다이얼로그 */}
      <Dialog 
        open={approveDialogOpen} 
        onClose={() => setApproveDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>AS 요청 승인</DialogTitle>
        <DialogContent>
          {currentRequest && (
            <Box sx={{ mt: 2 }}>
              {/* AS 접수 정보 */}
              <Box sx={{ mb: 3, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                <Typography variant="subtitle2">
                  매장: <Typography component="span" variant="body2">{currentRequest.companyName}</Typography>
                </Typography>
                <Typography variant="subtitle2">
                  시설물: <Typography component="span" variant="body2">{currentRequest.facilityTypeName}</Typography>
                </Typography>
                <Typography variant="subtitle2">
                  품목: <Typography component="span" variant="body2">{currentRequest.brandName}</Typography>
                </Typography>
                <Typography variant="subtitle2">
                  요청일자: <Typography component="span" variant="body2">{formatDate(currentRequest.requestDate)}</Typography>
                </Typography>
                <Typography variant="subtitle2">
                  위치: <Typography component="span" variant="body2">{currentRequest.currentLocation}</Typography>
                </Typography>
                <Typography variant="subtitle2">
                  요청자: <Typography component="span" variant="body2">{currentRequest.requesterName}</Typography>
                </Typography>
                <Typography variant="subtitle2">
                  상태: <Typography component="span" variant="body2">
                    <Chip 
                      label={currentRequest.serviceStatusName || currentRequest.statusName} 
                      size="small" 
                      color={
                        currentRequest.serviceStatusCode ? 
                          statusColorMap[currentRequest.serviceStatusCode] || 'default' : 
                          facilityStatusColorMap[currentRequest.statusCode] || 'default'
                      }
                    />
                  </Typography>
                </Typography>
              </Box>
              
              {/* 요청 내용 */}
              <Typography variant="subtitle2" sx={{ mb: 1 }}>요청 내용:</Typography>
              <Paper variant="outlined" sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5' }}>
                <Typography variant="body2">{currentRequest.requestContent}</Typography>
              </Paper>
              
              {/* 비고 사항 */}
              {currentRequest.notes && (
                <>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>비고 사항:</Typography>
                  <Paper variant="outlined" sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5' }}>
                    <Typography variant="body2">{currentRequest.notes}</Typography>
                  </Paper>
                </>
              )}
              
              {/* 예상 완료일 입력 */}
              <InputLabel htmlFor="expected-completion-date" sx={{ mb: 1 }}>예상 완료일</InputLabel>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  id="expected-completion-date"
                  type="date"
                  fullWidth
                  size="small"
                  value={expectedCompletionDate}
                  onChange={(e) => setExpectedCompletionDate(e.target.value)}
                  sx={{ flex: 2 }}
                />
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel id="expected-completion-hour-label">시간</InputLabel>
                  <Select
                    labelId="expected-completion-hour-label"
                    id="expected-completion-hour"
                    value={expectedCompletionHour}
                    onChange={(e) => setExpectedCompletionHour(e.target.value)}
                    label="시간"
                  >
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return (
                        <MenuItem key={hour} value={hour}>
                          {hour}시
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)}>취소</Button>
          <Button onClick={submitApproval} variant="contained" color="primary">승인</Button>
        </DialogActions>
      </Dialog>
      
      {/* AS 완료 처리 다이얼로그 */}
      <Dialog 
        open={completeDialogOpen} 
        onClose={() => setCompleteDialogOpen(false)}
      >
        <DialogTitle>AS 완료 처리</DialogTitle>
        <DialogContent>
          {currentRequest && (
            <Box sx={{ mt: 2, minWidth: '400px' }}>
              {/* 요청 정보 */}
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                매장: {currentRequest.companyName} | 시설물: {currentRequest.facilityTypeName} ({currentRequest.brandName})
              </Typography>
              
              {/* 수리 비용 입력 */}
              <InputLabel htmlFor="repair-cost" sx={{ mb: 1 }}>수리 비용</InputLabel>
              <TextField
                id="repair-cost"
                fullWidth
                size="small"
                value={formattedRepairCost}
                onChange={handleRepairCostChange}
                placeholder="예: 5,000,000"
                InputProps={{
                  startAdornment: (
                    <MuiInputAdornment position="start">₩</MuiInputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteDialogOpen(false)}>취소</Button>
          <Button onClick={submitCompletion} variant="contained" color="success">완료</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ServiceRequestList; 