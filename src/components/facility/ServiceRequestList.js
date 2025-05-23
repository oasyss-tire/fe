import React, { useState, useEffect, useMemo } from 'react';
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
  InputAdornment as MuiInputAdornment,
  Grid,
  IconButton
} from '@mui/material';
import { 
  Search as SearchIcon,
  Add as AddIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format, parse, isValid, isAfter, isBefore, parseISO } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

// 커스텀 다이얼로그 컴포넌트
import ApproveRequestDialog from './ApproveRequestDialog';
import CompleteRequestDialog from './CompleteRequestDialog';
import DateRangeCalendar, { DateRangeButton } from '../calendar/Calendar';

// AS 상태 칩 색상 매핑
const statusColorMap = {
  '002010_0001': 'default', // 접수중
  '002010_0002': 'default', // AS 접수완료
  '002010_0003': 'default'  // AS 수리완료
};

// 시설물 상태 칩 색상 매핑
const facilityStatusColorMap = {
  '002003_0001': 'default', // 사용중
  '002003_0002': 'default', // 수리중
  '002003_0003': 'default', // 폐기
  '002003_0004': 'default', // 임대중
  '002003_0005': 'default', // 폐기
  '002003_0006': 'default'  // 수리 완료
};

const ServiceRequestList = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const isUserRole = authUser?.role === 'USER';
  const baseUrl = 'http://localhost:8080'; // API 기본 URL
  const [loading, setLoading] = useState(false);
  const [serviceRequests, setServiceRequests] = useState([]); // 현재 페이지의 데이터만 저장
  const [serviceStatusCodes, setServiceStatusCodes] = useState([]); // AS 상태 코드 (002010)
  const [departmentCodes, setDepartmentCodes] = useState([]); // 담당 부서 코드 (003001)
  const [branchGroupCodes, setBranchGroupCodes] = useState([]); // 지부별 그룹 코드 (003002)
  const [statistics, setStatistics] = useState({ total: 0, pending: 0, completed: 0 }); // 통계 데이터
  
  // 검색 필터 상태
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedServiceStatusCode, setSelectedServiceStatusCode] = useState(''); // AS 상태 코드
  const [selectedDepartmentCode, setSelectedDepartmentCode] = useState(''); // 담당 부서 코드
  const [selectedBranchGroupCode, setSelectedBranchGroupCode] = useState(''); // 지부별 그룹 코드
  
  // 날짜 필터 상태
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isDateFilterActive, setIsDateFilterActive] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // 페이지네이션
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
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
  
  // 완료 처리 관련 상태
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  
  // 초기 데이터 로딩
  useEffect(() => {
    fetchCodes();
    fetchStatistics(); // 통계 데이터 로딩
  }, []); // 컴포넌트가 마운트될 때만 한번 로드
  
  // 필터나 페이지가 변경될 때마다 데이터 다시 로딩
  useEffect(() => {
    fetchServiceRequests();
  }, [page, searchKeyword, selectedServiceStatusCode, selectedDepartmentCode, selectedBranchGroupCode, startDate, endDate, isDateFilterActive]);
  
  // 코드 데이터 로드
  const fetchCodes = async () => {
    try {
      // AS 상태 코드 조회 (002010)
      const serviceStatusResponse = await fetch(`${baseUrl}/api/codes/groups/002010/codes/active`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      if (serviceStatusResponse.ok) {
        const data = await serviceStatusResponse.json();
        setServiceStatusCodes(data);
      }
      
      // 담당 부서 코드 조회 (003001)
      const departmentResponse = await fetch(`${baseUrl}/api/codes/groups/003001/codes/active`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      if (departmentResponse.ok) {
        const data = await departmentResponse.json();
        setDepartmentCodes(data);
      }
      
      // 지부별 그룹 코드 조회 (003002)
      const branchGroupResponse = await fetch(`${baseUrl}/api/codes/groups/003002/codes/active`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      if (branchGroupResponse.ok) {
        const data = await branchGroupResponse.json();
        setBranchGroupCodes(data);
      }
    } catch (error) {
      console.error('코드 조회 에러:', error);
      showSnackbar('코드 데이터 로딩 중 오류가 발생했습니다.', 'error');
    }
  };
  
  // 통계 데이터 조회 (전체 데이터를 기반으로 계산)
  const fetchStatistics = async () => {
    if (isUserRole) return;
    
    try {
      // 전체 통계를 위해 size=1, page=0으로 조회해서 totalElements만 확인
      const totalResponse = await fetch(`${baseUrl}/api/service-requests/paged?page=0&size=1`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      // 완료되지 않은 항목들 (002010_0001, 002010_0002)
      const pendingResponse = await fetch(`${baseUrl}/api/service-requests/paged?page=0&size=1&serviceStatusCode=002010_0001`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      const pending2Response = await fetch(`${baseUrl}/api/service-requests/paged?page=0&size=1&serviceStatusCode=002010_0002`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      // 완료된 항목들 (002010_0003)
      const completedResponse = await fetch(`${baseUrl}/api/service-requests/paged?page=0&size=1&serviceStatusCode=002010_0003`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (totalResponse.ok && pendingResponse.ok && pending2Response.ok && completedResponse.ok) {
        const totalData = await totalResponse.json();
        const pendingData = await pendingResponse.json();
        const pending2Data = await pending2Response.json();
        const completedData = await completedResponse.json();
        
        setStatistics({
          total: totalData.totalElements || 0,
          pending: (pendingData.totalElements || 0) + (pending2Data.totalElements || 0),
          completed: completedData.totalElements || 0
        });
      }
    } catch (error) {
      console.error('통계 데이터 조회 실패:', error);
    }
  };
  
  // AS 요청 목록 조회 (실제 페이지네이션과 필터링 적용)
  const fetchServiceRequests = async () => {
    setLoading(true);
    try {
      // URL 파라미터 구성
      const params = new URLSearchParams({
        page: page.toString(),
        size: '10', // 실제 필요한 10개만 요청
        sort: 'serviceRequestId,desc'
      });
      
      // 검색어가 있으면 통합 검색(OR 조건) 사용
      if (searchKeyword.trim()) {
        // 백엔드에서 매장명, 시설물 유형, 브랜드명을 OR 조건으로 검색
        params.append('search', searchKeyword.trim());
      }
      
      // AS 상태 필터 추가
      if (selectedServiceStatusCode) {
        params.append('serviceStatusCode', selectedServiceStatusCode);
      }
      
      // 담당 부서 필터 추가
      if (selectedDepartmentCode) {
        params.append('departmentTypeCode', selectedDepartmentCode);
      }
      
      // 지부별 그룹 필터 추가
      if (selectedBranchGroupCode) {
        params.append('branchGroupId', selectedBranchGroupCode);
      }
      
      // 날짜 범위 필터 추가
      if (isDateFilterActive && startDate && endDate) {
        // LocalDateTime 형식으로 변환
        params.append('requestDateStart', format(startDate, 'yyyy-MM-dd\'T\'00:00:00'));
        params.append('requestDateEnd', format(endDate, 'yyyy-MM-dd\'T\'23:59:59'));
      }
      
      // USER 권한인 경우 회사 ID 필터 추가 (백엔드에서 지원하는 경우)
      if (isUserRole && authUser?.companyId) {
        // 백엔드 API에서 companyId 파라미터를 지원한다면 추가
        // params.append('originalLocationCompanyId', authUser.companyId.toString());
      }
      
      const url = `${baseUrl}/api/service-requests/paged?${params.toString()}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('AS 요청 목록을 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      
      setServiceRequests(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.totalElements || 0);
    } catch (error) {
      console.error('AS 요청 목록 조회 실패:', error);
      showSnackbar('AS 요청 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // 검색 키워드 변경 처리
  const handleSearchChange = (e) => {
    setSearchKeyword(e.target.value);
  };
  
  // 검색 실행 (Enter 키 또는 버튼 클릭 시)
  const handleSearch = () => {
    setPage(0); // 페이지 초기화
    // fetchServiceRequests는 useEffect에서 자동으로 호출됨
  };
  
  // 상태 필터 변경 처리
  const handleServiceStatusChange = (e) => {
    setSelectedServiceStatusCode(e.target.value);
    setPage(0); // 페이지 초기화
  };
  
  // 담당 부서 필터 변경 처리
  const handleDepartmentChange = (e) => {
    setSelectedDepartmentCode(e.target.value);
    setPage(0); // 페이지 초기화
  };
  
  // 지부별 그룹 필터 변경 처리
  const handleBranchGroupChange = (e) => {
    setSelectedBranchGroupCode(e.target.value);
    setPage(0); // 페이지 초기화
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
      const response = await fetch(`${baseUrl}/api/service-requests/${id}`, {
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
    setApproveDialogOpen(true);
  };
  
  // AS 요청 승인 제출
  const submitApproval = async (formattedDateTime) => {
    try {
      const response = await fetch(`${baseUrl}/api/service-requests/${currentRequestId}/receive`, {
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
      fetchServiceRequests(); // 현재 페이지 데이터만 새로고침
      fetchStatistics(); // 통계 데이터 새로고침
    } catch (error) {
      console.error('AS 요청 승인 실패:', error);
      showSnackbar('AS 요청 승인 처리에 실패했습니다.', 'error');
    }
  };
  
  // AS 요청 완료 처리 시작
  const handleCompleteRequest = (serviceRequestId) => {
    setCurrentRequestId(serviceRequestId);
    fetchRequestDetail(serviceRequestId);
    setCompleteDialogOpen(true);
  };
  
  // AS 요청 완료 제출
  const submitCompletion = async (completionData) => {
    try {
      let response;
      
      // 이미지가 있는 경우와 없는 경우에 따라 다른 API 호출
      if (completionData.images && completionData.images.length > 0) {
        // FormData 객체 생성
        const formDataObj = new FormData();
        
        // JSON 데이터를 문자열로 변환하여 추가
        const requestData = {
          cost: completionData.cost,
          repairComment: completionData.repairComment
        };
        
        formDataObj.append('request', JSON.stringify(requestData));
        
        // 이미지 파일 추가
        completionData.images.forEach((file) => {
          formDataObj.append('images', file);
        });
        
        // 이미지를 포함한 API 호출
        response = await fetch(`${baseUrl}/api/service-requests/${currentRequestId}/complete-with-images`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            // Content-Type은 FormData를 사용할 때 자동으로 설정됨
          },
          body: formDataObj
        });
      } else {
        // 이미지가 없는 경우 기존 API 호출
        response = await fetch(`${baseUrl}/api/service-requests/${currentRequestId}/complete`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            cost: completionData.cost,
            repairComment: completionData.repairComment
          })
        });
      }
      
      if (!response.ok) {
        throw new Error('AS 요청 완료 처리에 실패했습니다.');
      }
      
      showSnackbar('AS 요청이 성공적으로 완료 처리되었습니다.', 'success');
      setCompleteDialogOpen(false);
      fetchServiceRequests(); // 현재 페이지 데이터만 새로고침
      fetchStatistics(); // 통계 데이터 새로고침
    } catch (error) {
      console.error('AS 요청 완료 처리 실패:', error);
      showSnackbar('AS 요청 완료 처리에 실패했습니다.', 'error');
    }
  };
  
  // 날짜 필터 변경 처리
  const handleDateChange = (start, end) => {
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
    setPage(0); // 페이지 초기화
  };
  
  // 날짜 필터 적용
  const handleApplyDateFilter = () => {
    setShowDatePicker(false);
    // 날짜는 이미 handleDateChange에서 설정됨
  };
  
  // 모든 필터 초기화
  const resetAllFilters = () => {
    setSearchKeyword('');
    setSelectedServiceStatusCode('');
    setSelectedDepartmentCode('');
    setSelectedBranchGroupCode('');
    handleResetDateFilter();
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
          AS 요청 목록
        </Typography>
        
        {/* USER 권한이 아닌 경우에만 통계 카드 표시 */}
        {!isUserRole && (
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
                {statistics.total} 건
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
                {statistics.pending} 건
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
                {statistics.completed} 건
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
      
      {/* 검색 및 필터 도구 바 */}
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end', justifyContent: 'space-between' }}>
        {/* 검색어 필드 */}
        <Box sx={{ flex: 1, minWidth: '200px' }}>
          <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
            검색
          </Typography>
          <TextField
            placeholder="매장명, 시설물 유형, 품목 검색"
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
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* USER 권한이 아닌 경우에만 필터 표시 */}
          {!isUserRole && (
            <>
              {/* 지부별 그룹 필터 */}
              <Box sx={{ width: '150px' }}>
                <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
                  지부별 그룹
                </Typography>
                <FormControl 
                  fullWidth 
                  size="small"
                  sx={{ backgroundColor: 'white' }}
                >
                  <Select
                    value={selectedBranchGroupCode}
                    onChange={handleBranchGroupChange}
                    displayEmpty
                    sx={{
                      height: '40px',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#E0E0E0',
                      },
                    }}
                  >
                    <MenuItem value="">모든 지부</MenuItem>
                    {branchGroupCodes.map(branch => (
                      <MenuItem key={branch.codeId} value={branch.codeId}>
                        {branch.codeName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              
              {/* AS 상태 필터 */}
              <Box sx={{ width: '150px' }}>
                <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
                  AS 상태
                </Typography>
                <FormControl 
                  fullWidth 
                  size="small"
                  sx={{ backgroundColor: 'white' }}
                >
                  <Select
                    value={selectedServiceStatusCode}
                    onChange={handleServiceStatusChange}
                    displayEmpty
                    sx={{
                      height: '40px',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#E0E0E0',
                      },
                    }}
                  >
                    <MenuItem value="">모든 AS 상태</MenuItem>
                    {serviceStatusCodes.map(status => (
                      <MenuItem key={status.codeId} value={status.codeId}>
                        {status.codeName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              
              {/* 담당 부서 필터 */}
              <Box sx={{ width: '150px' }}>
                <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
                  담당 부서
                </Typography>
                <FormControl 
                  fullWidth 
                  size="small"
                  sx={{ backgroundColor: 'white' }}
                >
                  <Select
                    value={selectedDepartmentCode}
                    onChange={handleDepartmentChange}
                    displayEmpty
                    sx={{
                      height: '40px',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#E0E0E0',
                      },
                    }}
                  >
                    <MenuItem value="">모든 담당 부서</MenuItem>
                    {departmentCodes.map(dept => (
                      <MenuItem key={dept.codeId} value={dept.codeId}>
                        {dept.codeName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </>
          )}
          
          {/* 요청일자 필터는 모든 사용자에게 표시 */}
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
              onDateChange={handleDateChange}
              open={showDatePicker}
              onClose={() => setShowDatePicker(false)}
              onApply={handleApplyDateFilter}
              onReset={handleResetDateFilter}
            />
          </Box>
        </Box>
      </Box>
      
      {/* 필터 초기화 버튼 */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={resetAllFilters}
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
      
      {/* AS 요청 목록 테이블 */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ mb: 3, overflow: 'auto' }}>
          <TableContainer component={Paper} sx={{ minWidth: '100%' }}>
            <Table sx={{ tableLayout: 'fixed' }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '5%', fontWeight: 'bold', backgroundColor: '#F8F9FA' }}>No.</TableCell>
                  <TableCell sx={{ width: '10%', fontWeight: 'bold', backgroundColor: '#F8F9FA' }}>매장명</TableCell>
                  <TableCell sx={{ width: '12%', fontWeight: 'bold', backgroundColor: '#F8F9FA' }}>시설물 유형</TableCell>
                  <TableCell sx={{ width: '12%', fontWeight: 'bold', backgroundColor: '#F8F9FA' }}>품목</TableCell>
                  <TableCell sx={{ width: '12%', fontWeight: 'bold', backgroundColor: '#F8F9FA' }}>담당 부서</TableCell>
                  <TableCell sx={{ width: '8%', fontWeight: 'bold', backgroundColor: '#F8F9FA' }}>사용연한</TableCell>
                  <TableCell sx={{ width: '10%', fontWeight: 'bold', backgroundColor: '#F8F9FA' }}>지부별 그룹</TableCell>
                  <TableCell sx={{ width: '10%', fontWeight: 'bold', backgroundColor: '#F8F9FA' }}>AS 상태</TableCell>
                  <TableCell sx={{ width: '10%', fontWeight: 'bold', backgroundColor: '#F8F9FA' }}>요청일자</TableCell>
                  {/* USER 권한이 아닌 경우에만 처리 열 표시 */}
                  {!isUserRole && (
                    <TableCell sx={{ width: '9%', fontWeight: 'bold', backgroundColor: '#F8F9FA' }}>처리</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {serviceRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isUserRole ? 9 : 10} align="center" sx={{ py: 3 }}>
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
                      <TableCell sx={{ width: '5%' }}>
                        {/* 전체 아이템 수에서 현재 인덱스를 역순으로 계산 */}
                        {totalItems - (page * 10 + index)}
                      </TableCell>
                      <TableCell sx={{ width: '12%' }}>{request.companyName}</TableCell>
                      <TableCell sx={{ width: '12%' }}>{request.facilityTypeName}</TableCell>
                      <TableCell sx={{ width: '12%' }}>{request.brandName || '-'}</TableCell>
                      <TableCell sx={{ width: '12%' }}>{request.departmentTypeName || '-'}</TableCell>
                      <TableCell sx={{ width: '8%' }}>{request.usefulLifeMonths || '-'}</TableCell>
                      <TableCell sx={{ width: '10%' }}>{request.branchGroupName || '-'}</TableCell>
                      <TableCell sx={{ width: '10%' }}>
                        <Chip 
                          label={
                            request.serviceStatusCode === '002010_0001' ? 'AS 접수중' : 
                            request.serviceStatusCode === '002010_0002' ? 'AS 접수완료' : 
                            request.serviceStatusCode === '002010_0003' ? 'AS 수리완료' : 
                            '상태 정보 없음'
                          }
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell sx={{ width: '10%' }}>{formatDate(request.requestDate)}</TableCell>
                      {/* USER 권한이 아닌 경우에만 처리 버튼 표시 */}
                      {!isUserRole && (
                        <TableCell sx={{ width: '9%' }}>
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
                              요청접수
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
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* 페이지네이션 */}
          {totalItems > 0 && (
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
      
      {/* AS 요청 승인 다이얼로그 컴포넌트 */}
      <ApproveRequestDialog 
        open={approveDialogOpen}
        onClose={() => setApproveDialogOpen(false)}
        currentRequest={currentRequest}
        onApprove={submitApproval}
        showSnackbar={showSnackbar}
      />
      
      {/* AS 완료 처리 다이얼로그 컴포넌트 */}
      <CompleteRequestDialog
        open={completeDialogOpen}
        onClose={() => setCompleteDialogOpen(false)}
        currentRequest={currentRequest}
        onComplete={submitCompletion}
        showSnackbar={showSnackbar}
      />
    </Box>
  );
};

export default ServiceRequestList; 