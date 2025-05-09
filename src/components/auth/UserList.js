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
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  Search as SearchIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  CalendarToday as CalendarTodayIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  Add as AddIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // 페이징 상태 추가 (프론트엔드 페이징)
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  const navigate = useNavigate();

  // API에서 사용자 데이터 가져오기
  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8080/api/users');
      
      if (!response.ok) {
        throw new Error('사용자 데이터를 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      setAllUsers(data);
      
      // 필터링 적용
      applyFilters(data);
    } catch (error) {
      console.error('사용자 데이터 조회 오류:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 필터링 및 정렬 적용 함수
  const applyFilters = (data = allUsers) => {
    let filtered = [...data];
    
    // 검색어 필터링
    if (searchTerm && searchTerm.trim() !== '') {
      const term = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(user => 
        (user.userId && user.userId.toLowerCase().includes(term)) ||
        (user.userName && user.userName.toLowerCase().includes(term)) ||
        (user.companyName && user.companyName.toLowerCase().includes(term)) ||
        (user.email && user.email.toLowerCase().includes(term))
      );
    }
    
    // 상태 필터링
    if (statusFilter) {
      const isActive = statusFilter === 'true';
      filtered = filtered.filter(user => user.active === isActive);
    }
    
    // 정렬
    if (sortBy === 'name') {
      filtered.sort((a, b) => {
        if (!a.userName) return 1;
        if (!b.userName) return -1;
        return a.userName.localeCompare(b.userName);
      });
    } else if (sortBy === 'company') {
      filtered.sort((a, b) => {
        if (!a.companyName) return 1;
        if (!b.companyName) return -1;
        return a.companyName.localeCompare(b.companyName);
      });
    } else {
      // 기본 정렬: ID 기준 내림차순 (최신순)
      filtered.sort((a, b) => b.id - a.id);
    }
    
    // 필터링된 전체 결과 저장
    setFilteredUsers(filtered);
    
    // 페이징 관련 상태 업데이트
    setTotalElements(filtered.length);
    setTotalPages(Math.ceil(filtered.length / pageSize));
    
    // 현재 페이지가 유효한지 확인
    const maxPage = Math.max(0, Math.ceil(filtered.length / pageSize) - 1);
    if (currentPage > maxPage && maxPage >= 0) {
      setCurrentPage(maxPage);
    }
    
    // 현재 페이지에 표시할 항목 계산
    const startIndex = currentPage * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filtered.length);
    setUsers(filtered.slice(startIndex, endIndex));
  };

  // 컴포넌트 마운트 시 사용자 데이터 로드
  useEffect(() => {
    fetchUsers();
  }, []);

  // 필터 또는 페이지 변경 시 필터링 적용
  useEffect(() => {
    applyFilters();
  }, [currentPage, pageSize, sortBy, statusFilter, searchTerm]);

  // 페이지 변경 핸들러
  const handlePageChange = (event, newPage) => {
    setCurrentPage(newPage - 1); // MUI는 1부터 시작하는 페이지 번호 사용
  };

  const handleMenuClick = (event, userId) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedUserId(userId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUserId(null);
  };

  const handleUserClick = (userId) => {
    navigate(`/users/${userId}`);
  };

  const handleDialogClose = (refresh) => {
    setDialogOpen(false);
    if (refresh) {
      fetchUsers();
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // 검색 실행 핸들러
  const handleSearch = () => {
    setCurrentPage(0); // 검색 시 첫 페이지로 이동
    applyFilters();
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(0); // 정렬 변경 시 첫 페이지로 이동
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(0); // 필터 변경 시 첫 페이지로 이동
  };

  // 사용자 추가 버튼 클릭 핸들러
  const handleAddUserClick = () => {
    navigate('/signup');
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#F8F8FE', minHeight: '100vh' }}>
      {/* 상단 헤더 */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#3A3A3A' }}>
          사용자 관리
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddUserClick}
          sx={{
            backgroundColor: '#1976d2',
            '&:hover': {
              backgroundColor: '#1565c0',
            },
            borderRadius: '8px',
            textTransform: 'none'
          }}
        >
          사용자 추가
        </Button>
      </Box>

      {/* 검색 및 필터 영역 */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        {/* 검색어 입력 */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
            검색어
          </Typography>
          <TextField
            placeholder="ID, 이름, 이메일로 검색"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
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
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
          />
        </Box>

        {/* 정렬 필터 */}
        <Box>
          <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
            정렬
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120, backgroundColor: 'white' }}>
            <Select
              displayEmpty
              value={sortBy}
              onChange={handleSortChange}
              IconComponent={KeyboardArrowDownIcon}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#E0E0E0',
                },
              }}
            >
              <MenuItem value="">최신순</MenuItem>
              <MenuItem value="name">이름순</MenuItem>
              <MenuItem value="company">업체순</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* 상태 필터 */}
        <Box>
          <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
            상태
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120, backgroundColor: 'white' }}>
            <Select
              displayEmpty
              value={statusFilter}
              onChange={handleStatusFilterChange}
              IconComponent={KeyboardArrowDownIcon}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#E0E0E0',
                },
              }}
            >
              <MenuItem value="">전체</MenuItem>
              <MenuItem value="true">사용</MenuItem>
              <MenuItem value="false">미사용</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
      
      {/* 검색 결과 요약 */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        p: 2,
        backgroundColor: 'white',
        borderRadius: 2,
        mb: 2
      }}>
        <Typography variant="body2" sx={{ color: '#666' }}>
          전체 {allUsers.length}건 중 {filteredUsers.length}건 필터링됨 (페이지 {currentPage + 1}/{totalPages || 1})
        </Typography>
        {(searchTerm || statusFilter) && (
          <Typography variant="body2" sx={{ color: '#1976d2' }}>
            {searchTerm && `검색어: "${searchTerm}" `}
            {statusFilter && `상태: ${statusFilter === 'true' ? '사용' : '미사용'} `}
          </Typography>
        )}
      </Box>

      {/* 사용자 목록 */}
      <Box sx={{ backgroundColor: 'white', borderRadius: 2, mt: 3 }}>
        {/* 목록 헤더 */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1.5fr 1fr 100px',
          p: 2,
          borderBottom: '1px solid #EEEEEE',
          backgroundColor: '#F8F9FA'
        }}>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>ID</Typography>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>이름</Typography>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>이메일</Typography>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>전화번호</Typography>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>상태</Typography>
        </Box>

        {/* 로딩 상태 표시 */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={40} />
          </Box>
        )}

        {/* 에러 메시지 표시 */}
        {error && (
          <Box sx={{ p: 3, textAlign: 'center', color: 'error.main' }}>
            <Typography>{error}</Typography>
            <Button 
              variant="outlined" 
              sx={{ mt: 2 }}
              onClick={fetchUsers}
            >
              다시 시도
            </Button>
          </Box>
        )}

        {/* 데이터가 없을 때 메시지 표시 */}
        {!isLoading && !error && users.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
            <Typography>표시할 사용자 데이터가 없습니다.</Typography>
          </Box>
        )}

        {/* 사용자 목록 아이템 */}
        {!isLoading && !error && users.map((user) => (
          <Box 
            key={user.id}
            onClick={() => handleUserClick(user.id)}
            sx={{ 
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1.5fr 1fr 100px',
              p: 2,
              borderBottom: '1px solid #EEEEEE',
              '&:hover': { 
                backgroundColor: '#F8F9FA',
                cursor: 'pointer'
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <Typography 
                className="user-id"
              >
                {user.userId}
              </Typography>
            </Box>
            <Typography>{user.userName}</Typography>
            <Typography sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email || '-'}
            </Typography>
            <Typography sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.phoneNumber || '-'}
            </Typography>
            <Box>
              <Chip
                label={user.active ? '사용' : '미사용'}
                size="small"
                sx={{
                  backgroundColor: user.active ? '#E8F3FF' : '#F5F5F5',
                  color: user.active ? '#3182F6' : '#666',
                  height: '24px',
                  fontSize: '12px'
                }}
              />
            </Box>
          </Box>
        ))}
      </Box>
      
      {/* 페이지네이션 */}
      {!isLoading && !error && filteredUsers.length > 0 && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          alignItems: 'center',
          mt: 2, 
          mb: 2,
          backgroundColor: '#F9F9FA',
          borderRadius: '4px',
          py: 1,
          px: 2
        }}>
          <Typography variant="body2" sx={{ mr: 2, color: '#666' }}>
            {(currentPage * pageSize) + 1}-{Math.min((currentPage + 1) * pageSize, filteredUsers.length)} / {filteredUsers.length}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton 
              disabled={currentPage === 0}
              onClick={(e) => handlePageChange(e, 1)}
              size="small"
              sx={{ mx: 0.3 }}
            >
              <FirstPageIcon 
                fontSize="small"
                sx={{ 
                  color: currentPage === 0 ? '#ccc' : '#666'
                }} 
              />
            </IconButton>
            <IconButton 
              disabled={currentPage === 0}
              onClick={(e) => handlePageChange(e, currentPage)}
              size="small"
              sx={{ mx: 0.3 }}
            >
              <ChevronLeftIcon
                fontSize="small"
                sx={{ 
                  color: currentPage === 0 ? '#ccc' : '#666'
                }} 
              />
            </IconButton>
            
            <Box 
              sx={{ 
                mx: 1, 
                px: 2,
                minWidth: '80px', 
                textAlign: 'center',
                border: '1px dashed #ddd',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '28px'
              }}
            >
              <Typography variant="body2" sx={{ color: '#666' }}>
                {currentPage + 1} / {totalPages}
              </Typography>
            </Box>
            
            <IconButton 
              disabled={currentPage >= totalPages - 1}
              onClick={(e) => handlePageChange(e, currentPage + 2)}
              size="small"
              sx={{ mx: 0.3 }}
            >
              <ChevronRightIcon
                fontSize="small"
                sx={{ 
                  color: currentPage >= totalPages - 1 ? '#ccc' : '#666'
                }} 
              />
            </IconButton>
            <IconButton 
              disabled={currentPage >= totalPages - 1}
              onClick={(e) => handlePageChange(e, totalPages)}
              size="small"
              sx={{ mx: 0.3 }}
            >
              <LastPageIcon
                fontSize="small"
                sx={{ 
                  color: currentPage >= totalPages - 1 ? '#ccc' : '#666'
                }} 
              />
            </IconButton>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default UserList; 