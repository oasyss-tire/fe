import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Chip,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { format } from 'date-fns';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';

const GuestInquiryList = () => {
  const [inquiries, setInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/guest-inquiries/all');
      if (response.ok) {
        const data = await response.json();
        setInquiries(data);
      }
    } catch (error) {
      console.error('문의사항 조회 실패:', error);
    }
  };

  const handleRowClick = (inquiry) => {
    setSelectedInquiry(inquiry);
    setPasswordDialogOpen(true);
    setPassword('');
    setError('');
  };

  const handlePasswordSubmit = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/guest-inquiries/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guestName: selectedInquiry.guestName,
          password: password
        })
      });

      if (response.ok) {
        const data = await response.json();
        setDetailData(data);
        setPasswordDialogOpen(false);
        setDetailDialogOpen(true);
      } else {
        setError('비밀번호가 일치하지 않습니다.');
      }
    } catch (error) {
      setError('확인 중 오류가 발생했습니다.');
    }
  };

  // 검색어로 필터링된 문의 목록 반환 (최신순 정렬 추가)
  const getFilteredInquiries = () => {
    return inquiries
      .filter(inquiry => 
        inquiry.guestName.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => b.id - a.id); // ID 기준 내림차순 정렬
  };

  return (
    <Box sx={{ maxWidth: '430px', margin: '0 auto', p: 2 }}>
      <Typography variant="h6" sx={{ mb: 3, textAlign: 'center' }}>
        문의사항
      </Typography>

      {/* 검색 필드 추가 */}
      <TextField
        fullWidth
        size="small"
        placeholder="작성자 이름으로 검색"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ 
          mb: 2,
          '& .MuiOutlinedInput-root': {
            bgcolor: '#f8f9fa',
            '&:hover': {
              bgcolor: '#fff'
            }
          }
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: '#666' }} />
            </InputAdornment>
          )
        }}
      />

      <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>내용</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>작성자</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>상태</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>등록일</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {getFilteredInquiries().map((inquiry, index) => (
              <TableRow 
                key={inquiry.id}
                onClick={() => handleRowClick(inquiry)}
                sx={{ 
                  cursor: 'pointer',
                  bgcolor: index % 2 === 0 ? '#ffffff' : '#fafafa',
                  '&:hover': { bgcolor: '#f5f5f5' }
                }}
              >
                <TableCell>{inquiry.content}</TableCell>
                <TableCell>{inquiry.guestName}</TableCell>
                <TableCell>
                  <Chip 
                    label={inquiry.answered ? "답변완료" : "답변대기"}
                    size="small"
                    sx={{ 
                      bgcolor: inquiry.answered ? '#e3f2fd' : '#fff3e0',
                      color: inquiry.answered ? '#1976d2' : '#ed6c02'
                    }}
                  />
                </TableCell>
                <TableCell>
                  {format(new Date(inquiry.createdAt), 'yyyy-MM-dd')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 검색 결과가 없을 때 메시지 표시 */}
      {getFilteredInquiries().length === 0 && (
        <Box sx={{ 
          textAlign: 'center', 
          py: 4, 
          color: '#666'
        }}>
          {searchTerm ? '검색 결과가 없습니다.' : '문의 내역이 없습니다.'}
        </Box>
      )}

      {/* 비밀번호 확인 다이얼로그 */}
      <Dialog 
        open={passwordDialogOpen} 
        onClose={() => setPasswordDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          비밀번호 확인
          <IconButton
            onClick={() => setPasswordDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              문의하신 내용을 확인하시려면 등록하신 비밀번호를 입력해주세요.
            </Typography>
            <TextField
              fullWidth
              type="password"
              label="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!error}
              helperText={error}
              margin="normal"
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>취소</Button>
          <Button 
            onClick={handlePasswordSubmit} 
            variant="contained"
            sx={{
              bgcolor: '#343959',
              '&:hover': { bgcolor: '#3d63b8' }
            }}
          >
            확인
          </Button>
        </DialogActions>
      </Dialog>

      {/* 문의사항 상세 다이얼로그 */}
      <Dialog 
        open={detailDialogOpen} 
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          문의사항 상세
          <IconButton
            onClick={() => setDetailDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {detailData && (
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                작성자
              </Typography>
              <Typography paragraph>{detailData.guestName}</Typography>

              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                문의내용
              </Typography>
              <Typography paragraph>{detailData.content}</Typography>

              {detailData.answered && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    답변
                  </Typography>
                  <Typography paragraph>{detailData.answer}</Typography>
                  
                  <Typography variant="caption" color="text.secondary">
                    답변일시: {format(new Date(detailData.answerTime), 'yyyy-MM-dd HH:mm')}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default GuestInquiryList; 