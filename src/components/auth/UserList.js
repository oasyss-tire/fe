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
  Chip
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
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const navigate = useNavigate();

  // 하드코딩된 사용자 데이터
  const hardcodedUsers = [
    {
      userId: 1,
      username: 'admin',
      fullName: '관리자',
      companyName: '타이어뱅크 (본점)',
      email: 'admin@tirebank.com',
      active: true,
      role: 'ADMIN'
    },
    {
      userId: 2,
      username: 'user123',
      fullName: '사용자',
      companyName: '타이어뱅크 (창원점)',
      email: 'user@tirebank.com',
      active: true,
      role: 'USER'
    },
    {
      userId: 3,
      username: 'kimuser',
      fullName: '김아무개',
      companyName: '타이어뱅크 (서광주점)',
      email: 'kim@tirebank.com',
      active: false,
      role: 'USER'
    }
  ];

  // fetchUsers 함수 수정
  const fetchUsers = async () => {
    // API 호출 대신 하드코딩된 데이터 사용
    setUsers(hardcodedUsers);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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
          onClick={() => setDialogOpen(true)}
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
            placeholder="이름, ID 또는 업체명 검색"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
              defaultValue=""
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
              defaultValue=""
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
          gridTemplateColumns: '1fr 1fr 1.5fr 100px 50px',
          p: 2,
          borderBottom: '1px solid #EEEEEE',
          backgroundColor: '#F8F9FA'
        }}>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>ID</Typography>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>이름</Typography>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>업체</Typography>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>상태</Typography>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>관리</Typography>
        </Box>

        {/* 사용자 목록 아이템 */}
        {users.map((user) => (
          <Box 
            key={user.userId}
            sx={{ 
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1.5fr 100px 50px',
              p: 2,
              borderBottom: '1px solid #EEEEEE',
              '&:hover': { backgroundColor: '#F8F9FA' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <PersonIcon sx={{ color: '#3182F6', mr: 2, mt: 0.5 }} />
              <Box 
                onClick={() => handleUserClick(user.userId)}
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': {
                    '& .user-id': {
                      color: '#1976d2'
                    }
                  }
                }}
              >
                <Typography className="user-id">{user.username}</Typography>
              </Box>
            </Box>
            <Typography>{user.fullName}</Typography>
            <Typography sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.companyName || '-'}
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
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton size="small" onClick={(e) => handleMenuClick(e, user.userId)}>
                <MoreVertIcon />
              </IconButton>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default UserList; 