import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  InputAdornment,
  Typography,
  Pagination,
  Stack
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import UserDialog from './UserDialog';
import { useNavigate } from 'react-router-dom';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) || // 아이디 검색
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || // 이름 검색
      user.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) // 업체 검색 
    );
    setFilteredUsers(filtered);
    setPage(1);
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/users', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        let data = await response.json();
        
        // userId 기준 내림차순 정렬 (최신 유저가 앞에 오도록)
        data.sort((a, b) => b.userId - a.userId);
  
        setUsers(data);
        setFilteredUsers(data);
      }
    } catch (error) {
      console.error('사용자 목록 로딩 실패:', error);
    }
  };
  

  const getCurrentPageData = () => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
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
    <Box sx={{ pl: 2, pr: 2, pb: 2, maxWidth: '430px', margin: '0 auto' }}>
      {/* 헤더 */}
      <Box sx={{ 
        position: 'sticky',   
        top: 0, 
        bgcolor: '#FFFFFF',
        borderBottom: '1px solid #eee',
        zIndex: 1,
        p: 2,
        textAlign: 'center'
      }}>
        <Typography variant="h6">사용자 관리</Typography>
      </Box>

      <Box sx={{ mt: 6 }}>
        {/* 검색창 */}
        <TextField
          size="small"
          fullWidth
          variant="outlined"
          placeholder="이름, ID 또는 업체명 검색"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />

        {/* 사용자 목록 테이블 */}
        <TableContainer component={Paper} sx={{ mb: 2, boxShadow: 'none' }}>
          <Table size="small" sx={{ tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell 
                  sx={{ 
                    py: 1, 
                    fontSize: '0.875rem', 
                    fontWeight: 'bold',
                    width: '25%'  // ID 열 너비
                  }}
                >
                  ID
                </TableCell>
                <TableCell 
                  sx={{ 
                    py: 1, 
                    fontSize: '0.875rem', 
                    fontWeight: 'bold',
                    width: '25%'  // 이름 열 너비
                  }}
                >
                  이름
                </TableCell>
                <TableCell 
                  sx={{ 
                    py: 1, 
                    fontSize: '0.875rem', 
                    fontWeight: 'bold',
                    width: '30%'  // 업체 열 너비
                  }}
                >
                  업체
                </TableCell>
                <TableCell 
                  align="center" 
                  sx={{ 
                    py: 1, 
                    fontSize: '0.875rem', 
                    fontWeight: 'bold',
                    width: '20%'  // 상태 열 너비
                  }}
                >
                  상태
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getCurrentPageData().map((user, index) => (
                <TableRow 
                  key={user.userId}
                  onClick={() => handleUserClick(user.userId)}
                  sx={{ 
                    cursor: 'pointer',
                    bgcolor: index % 2 === 0 ? '#ffffff' : '#fafafa',
                    '&:hover': { bgcolor: '#f5f5f5' }
                  }}
                >
                  <TableCell sx={{ py: 1, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.username}
                  </TableCell>
                  <TableCell sx={{ py: 1, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.fullName}
                  </TableCell>
                  <TableCell sx={{ py: 1, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.companyName || '-'}
                  </TableCell>
                  <TableCell align="center" sx={{ py: 1 }}>
                    <Typography
                      sx={{
                        fontSize: '0.75rem',
                        color: user.active ? 'success.main' : 'error.main',
                        bgcolor: user.active ? 'success.lighter' : 'error.lighter',
                        py: 0.5,
                        px: 1,
                        borderRadius: 1,
                        display: 'inline-block'
                      }}
                    >
                      {user.active ? '사용' : '미사용'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 사용자 추가 버튼 */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{
              bgcolor: '#1C243A',
              '&:hover': {
                bgcolor: '#3d63b8'
              }
            }}
          >
            사용자 추가
          </Button>
        </Box>

        {/* 사용자 추가 다이얼로그 */}
        <UserDialog
          open={dialogOpen}
          onClose={handleDialogClose}
        />

        {/* 페이지네이션 */}
        <Stack spacing={2} alignItems="center">
          <Pagination
            count={Math.ceil(filteredUsers.length / itemsPerPage)}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="small"
          />
        </Stack>
      </Box>
    </Box>
  );
};

export default UserList; 