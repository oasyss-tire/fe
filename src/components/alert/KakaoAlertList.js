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
  InputAdornment,
  Typography,
  Pagination,
  Stack,
  Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { format } from 'date-fns';
import KakaoAlertDetail from './KakaoAlertDetail';

const KakaoAlertList = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('https://tirebank.jebee.net/api/kakao-alert', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // 최신 순으로 정렬
        data.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
        setAlerts(data);
      }
    } catch (error) {
      console.error('알림톡 내역 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts = alerts.filter(alert => 
    alert.receiverPhone.includes(searchTerm) ||
    alert.message.includes(searchTerm) ||
    alert.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCurrentPageData = () => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAlerts.slice(startIndex, endIndex);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  // 상세보기 열기
  const handleRowClick = async (alertId) => {
    try {
      const response = await fetch(`https://tirebank.jebee.net/api/kakao-alert/${alertId}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedAlert(data);
        setDetailOpen(true);
      }
    } catch (error) {
      console.error('알림톡 상세 정보 조회 실패:', error);
    }
  };

  if (loading) {
    return <Box sx={{ p: 3 }}>로딩 중...</Box>;
  }

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
        <Typography variant="h6">알림톡 전송 내역</Typography>
      </Box>

      <Box sx={{ mt: 6 }}>
        {/* 검색창 */}
        <TextField
          size="small"
          fullWidth
          variant="outlined"
          placeholder="전화번호, URL 또는 발신자 검색"
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

        {/* 알림톡 목록 테이블 */}
        <TableContainer component={Paper} sx={{ mb: 2, boxShadow: 'none' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell sx={{ py: 1, fontSize: '0.875rem', fontWeight: 'bold' }}>수신번호</TableCell>
                <TableCell sx={{ py: 1, fontSize: '0.875rem', fontWeight: 'bold' }}>발신자</TableCell>
                <TableCell sx={{ py: 1, fontSize: '0.875rem', fontWeight: 'bold' }}>발송시간</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getCurrentPageData().map((alert, index) => (
                <TableRow 
                  key={alert.id}
                  onClick={() => handleRowClick(alert.id)}
                  sx={{ 
                    cursor: 'pointer',
                    bgcolor: index % 2 === 0 ? '#ffffff' : '#fafafa',
                    '&:hover': { bgcolor: '#f5f5f5' }
                  }}
                >
                  <TableCell 
                    sx={{ 
                      py: 1.5, 
                      fontSize: '0.875rem',
                      width: '40%' // 수신번호 열 너비 고정
                    }}
                  >
                    {alert.receiverPhone}
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      py: 1.5,
                      width: '35%' // 발신자 열 너비 고정
                    }}
                  >
                    <Chip 
                      label={alert.username || `사용자 ${alert.userId}`}
                      size="small"
                      sx={{ 
                        bgcolor: alert.username ? '#e3f2fd' : '#f5f5f5',
                        color: alert.username ? '#1976d2' : '#666',
                        fontSize: '0.75rem'
                      }}
                    />
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      py: 1.5, 
                      fontSize: '0.875rem',
                      width: '25%', // 발송시간 열 너비 고정
                      whiteSpace: 'nowrap' // 발송시간 한 줄로 표시
                    }}
                  >
                    {format(new Date(alert.sentAt), 'yyyy-MM-dd HH:mm')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 페이지네이션 */}
        <Stack spacing={2} alignItems="center">
          <Pagination
            count={Math.ceil(filteredAlerts.length / itemsPerPage)}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="small"
          />
        </Stack>
      </Box>

      <KakaoAlertDetail 
        open={detailOpen}
        alert={selectedAlert}
        onClose={() => setDetailOpen(false)}
      />
    </Box>
  );
};

export default KakaoAlertList; 