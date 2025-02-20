import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, IconButton, Paper, Snackbar, Alert, CircularProgress } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import QnADialog from './QnADialog';

const QnAManagement = () => {
  const [qaList, setQaList] = useState([]);
  const [selectedQA, setSelectedQA] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isLoading, setIsLoading] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState(null);  // 삭제 중인 항목 인덱스

  // 초기 데이터 로드
  useEffect(() => {
    fetchQAList();
  }, []);

  // 데이터 조회
  const fetchQAList = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/chat/qa', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('데이터 조회 실패');
      }
      
      const data = await response.json();
      setQaList(data);
    } catch (error) {
      console.error('QnA 목록 조회 실패:', error);
      setSnackbar({
        open: true,
        message: 'QnA 목록 조회에 실패했습니다.',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 수정 버튼 클릭
  const handleEdit = (qa) => {
    setSelectedQA(qa);
    setDialogOpen(true);
  };

  // 삭제 버튼 클릭
  const handleDelete = async (index) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      setDeletingIndex(index);  // 삭제 시작
      try {
        const response = await fetch(`http://localhost:8080/api/chat/qa/${index}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('삭제 실패');
        }
        
        setSnackbar({
          open: true,
          message: 'QnA가 삭제되었습니다.',
          severity: 'success'
        });
        
        fetchQAList();
      } catch (error) {
        console.error('QnA 삭제 실패:', error);
        setSnackbar({
          open: true,
          message: 'QnA 삭제에 실패했습니다.',
          severity: 'error'
        });
      } finally {
        setDeletingIndex(null);  // 삭제 완료
      }
    }
  };

  // 저장 버튼 클릭
  const handleSave = async (formData) => {
    try {
      const response = await fetch('http://localhost:8080/api/chat/qa', {  // 전체 URL 지정
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('저장 실패');
      }

      setSnackbar({
        open: true,
        message: 'QnA가 추가되었습니다.',
        severity: 'success'
      });

      setDialogOpen(false);
      fetchQAList();
    } catch (error) {
      console.error('QnA 저장 실패:', error);
      setSnackbar({
        open: true,
        message: 'QnA 저장에 실패했습니다.',
        severity: 'error'
      });
    }
  };

  // 스낵바 닫기
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // UI 구조
  return (
    <Box>
      {/* 헤더 영역 */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3 
      }}>
        <Typography variant="h6">QnA 데이터 관리</Typography>
        <Button 
          variant="contained"
          startIcon={<AddCircleIcon />}
          onClick={() => {
            setSelectedQA(null);
            setDialogOpen(true);
          }}
        >
          새 QnA 추가
        </Button>
      </Box>

      {/* QnA 목록 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width="10%">No.</TableCell>
              <TableCell width="35%">질문</TableCell>
              <TableCell width="45%">답변</TableCell>
              <TableCell width="10%" align="right">작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  데이터를 불러오는 중...
                </TableCell>
              </TableRow>
            ) : qaList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                  데이터가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              qaList.map((qa, arrayIndex) => (
                <TableRow key={`qa-${qa.index}-${arrayIndex}`}>
                  <TableCell>{qa.index}</TableCell>
                  <TableCell>{qa.question}</TableCell>
                  <TableCell>{qa.answer}</TableCell>
                  <TableCell align="right">
                    <IconButton 
                      onClick={() => handleDelete(qa.index)}
                      disabled={deletingIndex === qa.index}  // 삭제 중일 때 버튼 비활성화
                    >
                      {deletingIndex === qa.index ? (
                        <CircularProgress size={20} />  // 삭제 중인 항목에 로딩 표시
                      ) : (
                        <DeleteIcon />
                      )}
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* QnA 추가/수정 다이얼로그 */}
      <QnADialog 
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        data={selectedQA}
        onSave={handleSave}
        previewMode={previewMode}
        onTogglePreview={() => setPreviewMode(!previewMode)}
      />

      {/* 스낵바 */}
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
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default QnAManagement; 