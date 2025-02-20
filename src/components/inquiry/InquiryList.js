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
  Chip,
  Stack,
  Pagination,
  Snackbar,
  Alert,
  FormControl,   
  InputLabel,    
  Select,       
  MenuItem       
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import InquiryDialog from './InquiryDialog';

const InquiryList = () => {
  const [inquiries, setInquiries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('latest'); // 기본값: 최신순
  const [filteredInquiries, setFilteredInquiries] = useState([]);
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const itemsPerPage = 5;
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // 초기 상태 상수로 정의
  const initialInquiryState = {
    inquiryTitle: '',
    inquiryContent: '',
    contactNumber: '',
    images: []
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  useEffect(() => {
    let filtered = inquiries.filter(inquiry =>
      (inquiry.inquiryTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
       String(inquiry.writerName).includes(searchTerm))
    );
  
    const now = new Date();
    switch (dateFilter) {
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'latest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'week':
        filtered = filtered.filter(inquiry => {
          const inquiryDate = new Date(inquiry.createdAt);
          return now - inquiryDate <= 7 * 24 * 60 * 60 * 1000;
        });
        break;
      case 'month':
        filtered = filtered.filter(inquiry => {
          const inquiryDate = new Date(inquiry.createdAt);
          return now - inquiryDate <= 30 * 24 * 60 * 60 * 1000;
        });
        break;
      default:
        break;
    }
  
    setFilteredInquiries(filtered);
    setPage(1);
  }, [searchTerm, dateFilter, inquiries]);

  const fetchInquiries = async () => {
    try {
      const response = await fetch('https://tirebank.jebee.net/api/inquiries', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        let data = await response.json();
        
        // inquiryId 기준 내림차순 정렬 (최신 글이 앞에 오도록)
        data.sort((a, b) => b.inquiryId - a.inquiryId);
  
        setInquiries(data);
        setFilteredInquiries(data);
      }
    } catch (error) {
      console.error('문의사항 목록 로딩 실패:', error);
    }
  };
  

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  };

  const handleRowClick = (inquiry) => {
    setSelectedInquiry(inquiry);
    setDetailOpen(true);
  };

  const getCurrentPageData = () => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredInquiries.slice(startIndex, endIndex);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleAddInquiryClick = () => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      setSnackbar({
        open: true,
        message: '로그인 후 이용해 주세요.',
        severity: 'warning'
      });
      
      // 커스텀 이벤트를 발생시켜 로그인 다이얼로그를 표시
      const event = new CustomEvent('openLoginDialog');
      window.dispatchEvent(event);
      return;
    }
    setDialogOpen(true);
  };

  // 다이얼로그 닫기 핸들러 수정
  const handleCloseDialog = () => {
    setDialogOpen(false);
    fetchInquiries(); // 목록 새로고침
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
        <Typography variant="h6">문의사항 관리</Typography>
      </Box>

      <Box sx={{ mt: 6 }}>
{/* 검색창 & 날짜 필터 추가 */}
<Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
  <TextField
    size="small"
    variant="outlined"
    placeholder="제목 또는 ID 검색"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    sx={{ width: '70%' }} // 7:3 비율 유지
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <SearchIcon color="action" />
        </InputAdornment>
      ),
    }}
  />
  
  <FormControl size="small" sx={{ width: '30%' }}>
    <InputLabel>날짜 필터</InputLabel>
    <Select
      value={dateFilter}
      onChange={(e) => setDateFilter(e.target.value)}
    >
      <MenuItem value="latest">최신 순</MenuItem>
      <MenuItem value="oldest">오래된 순</MenuItem>
      <MenuItem value="week">1주일 내 내역</MenuItem>
      <MenuItem value="month">1달 내 내역</MenuItem>
    </Select>
  </FormControl>
</Box>

        {/* 문의사항 목록 테이블 */}
        <TableContainer component={Paper} sx={{ mb: 2, boxShadow: 'none' }}>
          <Table size="small" sx={{ tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell sx={{ py: 1, fontSize: '0.875rem', fontWeight: 'bold', width: '30%' }}>
                  제목
                </TableCell>
                <TableCell sx={{ py: 1, fontSize: '0.875rem', fontWeight: 'bold', width: '25%' ,}}>
                  작성자
                </TableCell>
                <TableCell sx={{ py: 1, fontSize: '0.875rem', fontWeight: 'bold', width: '25%' }}>
                  작성일
                </TableCell>
                <TableCell sx={{ py: 1, fontSize: '0.875rem', fontWeight: 'bold', width: '20%' }}>
                  처리상태
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getCurrentPageData().map((inquiry, index) => (
                <TableRow
                  key={inquiry.inquiryId}
                  onClick={() => handleRowClick(inquiry)}
                  sx={{ 
                    cursor: 'pointer',
                    bgcolor: index % 2 === 0 ? '#ffffff' : '#fafafa',
                    '&:hover': { bgcolor: '#f5f5f5' }
                  }}
                >
                  <TableCell sx={{ py: 1, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {inquiry.inquiryTitle}
                  </TableCell>
                  <TableCell sx={{ py: 1, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {inquiry.writerName}
                  </TableCell>
                  <TableCell sx={{ py: 1, fontSize: '0.875rem' , overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                    {formatDate(inquiry.createdAt)}
                  </TableCell>
                  <TableCell align="center" sx={{ py: 1 }}>
                    <Typography
                      sx={{
                        fontSize: '0.75rem',
                        color: inquiry.processed ? 'success.main' : 'warning.main',
                        bgcolor: inquiry.processed ? 'success.lighter' : 'warning.lighter',
                        py: 0.5,
                        px: 1,
                        borderRadius: 1,
                        display: 'inline-block'
                      }}
                    >
                      {inquiry.processed ? "처리완료" : "미처리"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 문의사항 등록 버튼 */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddInquiryClick}
            sx={{
              bgcolor: '#1C243A',
              '&:hover': {
                bgcolor: '#3d63b8'
              }
            }}
          >
            문의사항 등록
          </Button>
        </Box>

        {/* 페이지네이션 */}
        <Stack spacing={2} alignItems="center">
          <Pagination
            count={Math.ceil(filteredInquiries.length / itemsPerPage)}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="small"
          />
        </Stack>
      </Box>

      {/* 문의사항 등록 다이얼로그 */}
      <InquiryDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
      />

      {/* 문의사항 상세 보기 다이얼로그 */}
      {selectedInquiry && (
        <InquiryDialog
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          inquiry={selectedInquiry}
          onDelete={() => {
            setDetailOpen(false);
            fetchInquiries();
          }}
          onUpdate={() => {
            setDetailOpen(false);
            fetchInquiries();
          }}
        />
      )}

      {/* Snackbar 추가 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ 
            width: '100%',
            boxShadow: 3,
            fontSize: '0.95rem'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InquiryList; 