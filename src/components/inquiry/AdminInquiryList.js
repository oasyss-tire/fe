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
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Snackbar,
  Alert,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { format } from 'date-fns';

const AdminInquiryList = () => {
  const [inquiries, setInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [answerContent, setAnswerContent] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'completed'
  
  useEffect(() => {
    fetchAdminInquiries();
  }, []);

  const fetchAdminInquiries = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/guest-inquiries/admin', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setInquiries(data);
      }
    } catch (error) {
      console.error('관리자 문의 조회 실패:', error);
    }
  };

  const handleAnswer = async () => {
    if (!answerContent.trim()) return;

    try {
      const response = await fetch(`http://localhost:8080/api/guest-inquiries/${selectedInquiry.id}/answer`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/plain',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: answerContent
      });

      if (response.ok) {
        fetchAdminInquiries();
        setDialogOpen(false);
        setAnswerContent('');
        setSnackbar({
          open: true,
          message: '답변이 등록되었습니다.',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('답변 등록 실패:', error);
      setSnackbar({
        open: true,
        message: '답변 등록에 실패했습니다.',
        severity: 'error'
      });
    }
  };

  const handleRowClick = (inquiry) => {
    setSelectedInquiry(inquiry);
    setAnswerContent(inquiry.answer || '');
    setDialogOpen(true);
  };

  // 필터링된 문의 목록을 반환하는 함수 (최신순 정렬 추가)
  const getFilteredInquiries = () => {
    let filtered = [...inquiries];
    
    // 상태별 필터링
    switch (filter) {
      case 'pending':
        filtered = filtered.filter(inquiry => !inquiry.answered);
        break;
      case 'completed':
        filtered = filtered.filter(inquiry => inquiry.answered);
        break;
      default:
        break;
    }

    // ID 기준 내림차순 정렬 (최신순)
    return filtered.sort((a, b) => b.id - a.id);
  };

  const handleFilterChange = (event, newFilter) => {
    if (newFilter !== null) {
      setFilter(newFilter);
    }
  };

  return (
    <>
      <Box sx={{ maxWidth: '1000px', margin: '0 auto', p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3, textAlign: 'center', color: '#1C243A' }}>
          문의사항 관리
        </Typography>

        {/* 필터 버튼 그룹 추가 */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={handleFilterChange}
            size="small"
          >
            <ToggleButton 
              value="all"
              sx={{ 
                '&.Mui-selected': { 
                  bgcolor: '#343959 !important',
                  color: 'white !important'
                }
              }}
            >
              전체
            </ToggleButton>
            <ToggleButton 
              value="pending"
              sx={{ 
                '&.Mui-selected': { 
                  bgcolor: '#ed6c02 !important',
                  color: 'white !important'
                }
              }}
            >
              답변대기
            </ToggleButton>
            <ToggleButton 
              value="completed"
              sx={{ 
                '&.Mui-selected': { 
                  bgcolor: '#1976d2 !important',
                  color: 'white !important'
                }
              }}
            >
              답변완료
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #eee' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                <TableCell sx={{ fontWeight: 500, color: '#1C243A' }}>작성자</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#1C243A' }}>연락처</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#1C243A', width: '40%' }}>문의내용</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#1C243A' }}>상태</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#1C243A' }}>등록일</TableCell>
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
                  <TableCell sx={{ py: 1.5 }}>{inquiry.guestName}</TableCell>
                  <TableCell sx={{ py: 1.5 }}>{inquiry.phoneNumber}</TableCell>
                  <TableCell sx={{ py: 1.5 }}>
                    <Typography noWrap>{inquiry.content}</Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1.5 }}>
                    <Chip 
                      label={inquiry.answered ? "답변완료" : "답변대기"}
                      size="small"
                      sx={{ 
                        bgcolor: inquiry.answered ? '#e3f2fd' : '#fff3e0',
                        color: inquiry.answered ? '#1976d2' : '#ed6c02',
                        fontWeight: 500
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 1.5, whiteSpace: 'nowrap' }}>
                    {format(new Date(inquiry.createdAt), 'yyyy-MM-dd HH:mm')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 필터링된 결과가 없을 때 메시지 표시 */}
        {getFilteredInquiries().length === 0 && (
          <Box sx={{ 
            textAlign: 'center', 
            py: 4, 
            color: '#666'
          }}>
            {filter === 'pending' ? '답변 대기중인 문의가 없습니다.' :
             filter === 'completed' ? '답변 완료된 문의가 없습니다.' :
             '문의 내역이 없습니다.'}
          </Box>
        )}
      </Box>

      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px'
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #eee', p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ flex: 1, fontWeight: 500 }}>
              문의사항 상세
            </Typography>
            <IconButton
              onClick={() => setDialogOpen(false)}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {selectedInquiry && (
            <Box sx={{ p: 3 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  작성자 정보
                </Typography>
                <Box sx={{ 
                  bgcolor: '#f8f9fa', 
                  p: 2, 
                  borderRadius: 1,
                  border: '1px solid #eee'
                }}>
                  <Typography sx={{ mb: 1 }}>이름: {selectedInquiry.guestName}</Typography>
                  <Typography>연락처: {selectedInquiry.phoneNumber}</Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  문의내용
                </Typography>
                <Box sx={{ 
                  bgcolor: '#f8f9fa', 
                  p: 2, 
                  borderRadius: 1,
                  border: '1px solid #eee'
                }}>
                  <Typography>{selectedInquiry.content}</Typography>
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  답변 작성
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={answerContent}
                  onChange={(e) => setAnswerContent(e.target.value)}
                  placeholder="답변을 입력해주세요"
                  sx={{ 
                    mt: 1,
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#f8f9fa'
                    }
                  }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #eee' }}>
          <Button 
            onClick={() => setDialogOpen(false)}
            sx={{ color: '#666' }}
          >
            취소
          </Button>
          <Button 
            onClick={handleAnswer}
            variant="contained"
            disabled={!answerContent.trim()}
            sx={{
              bgcolor: '#343959',
              '&:hover': { bgcolor: '#3d63b8' }
            }}
          >
            답변 등록
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AdminInquiryList; 