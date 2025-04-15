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
  CircularProgress
} from '@mui/material';
import { 
  Search as SearchIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  CalendarToday as CalendarTodayIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  // API에서 사용자 데이터 가져오기
  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('https://sign.jebee.net/api/users');
      
      if (!response.ok) {
        throw new Error('사용자 데이터를 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error('사용자 데이터 조회 오류:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 사용자 데이터 로드
  useEffect(() => {
    fetchUsers();
  }, []);

  // 검색어, 정렬, 상태 필터 변경 시 사용자 목록 필터링
  useEffect(() => {
    let result = [...users];
    
    // 검색어 필터링
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      result = result.filter(user => 
        (user.userId && user.userId.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (user.userName && user.userName.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (user.companyName && user.companyName.toLowerCase().includes(lowerCaseSearchTerm))
      );
    }
    
    // 상태 필터링
    if (statusFilter) {
      const isActive = statusFilter === 'true';
      result = result.filter(user => user.active === isActive);
    }
    
    // 정렬
    if (sortBy) {
      switch (sortBy) {
        case 'name':
          result.sort((a, b) => (a.userName || '').localeCompare(b.userName || ''));
          break;
        case 'company':
          result.sort((a, b) => (a.companyName || '').localeCompare(b.companyName || ''));
          break;
        default:
          // 기본은 최신순 (ID 기준 내림차순)
          result.sort((a, b) => b.id - a.id);
      }
    } else {
      // 기본 정렬: 최신순
      result.sort((a, b) => b.id - a.id);
    }
    
    setFilteredUsers(result);
  }, [users, searchTerm, sortBy, statusFilter]);

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

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
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
            placeholder="ID 또는 이름 검색"
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
        {!isLoading && !error && filteredUsers.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
            <Typography>표시할 사용자 데이터가 없습니다.</Typography>
          </Box>
        )}

        {/* 사용자 목록 아이템 */}
        {!isLoading && !error && filteredUsers.map((user) => (
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
    </Box>
  );
};

export default UserList; 