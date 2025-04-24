import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Divider, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';

const TrusteeHistoryList = ({ companyId }) => {
  const [histories, setHistories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrusteeHistories = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = sessionStorage.getItem('token');
        const response = await fetch(`http://localhost:8080/api/companies/${companyId}/histories-for-contract`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        
        if (!response.ok) {
          throw new Error('수탁자 이력을 불러오는데 실패했습니다.');
        }
        
        const data = await response.json();
        setHistories(data);
      } catch (error) {
        console.error('수탁자 이력 조회 오류:', error);
        setError('수탁자 이력을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    if (companyId) {
      fetchTrusteeHistories();
    }
  }, [companyId]);

  // 상태 유형에 따른 칩 스타일 반환
  const getStatusChip = (statusType, statusLabel) => {
    let chipProps = {
      label: statusLabel,
      size: 'small'
    };

    switch (statusType) {
      case 'active':
        chipProps.color = 'success';
        break;
      case 'pending':
        chipProps.color = 'warning';
        break;
      case 'expired':
        chipProps.color = 'default';
        break;
      default:
        chipProps.color = 'default';
    }

    return <Chip {...chipProps} />;
  };

  return (
    <Paper sx={{ 
      p: 3, 
      mb: 3,
      borderRadius: 2, 
      boxShadow: 'none', 
      border: '1px solid #EEEEEE'
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#3A3A3A' }}>
          수탁자 계약 이력
        </Typography>
      </Box>
      <Divider sx={{ mb: 3 }} />

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={24} />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : histories.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography color="text.secondary">수탁자 이력이 없습니다.</Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table sx={{ minWidth: 650 }} size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#F5F5F5' }}>
                <TableCell>수탁자</TableCell>
                <TableCell>수탁코드</TableCell>
                <TableCell>대표자</TableCell>
                <TableCell>사업자번호</TableCell>
                <TableCell>계약 시작일</TableCell>
                <TableCell>계약 종료일</TableCell>
                <TableCell>보증보험 시작일</TableCell>
                <TableCell>보증보험 종료일</TableCell>
                <TableCell>상태</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {histories.map((history) => (
                <TableRow key={history.id} hover>
                  <TableCell>{history.trustee || '-'}</TableCell>
                  <TableCell>{history.trusteeCode || '-'}</TableCell>
                  <TableCell>{history.representativeName || '-'}</TableCell>
                  <TableCell>{history.businessNumber || '-'}</TableCell>
                  <TableCell>{history.startDate || '-'}</TableCell>
                  <TableCell>{history.endDate || '-'}</TableCell>
                  <TableCell>{history.insuranceStartDate || '-'}</TableCell>
                  <TableCell>{history.insuranceEndDate || '-'}</TableCell>
                  <TableCell>
                    {getStatusChip(history.statusType, history.statusLabel)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

export default TrusteeHistoryList; 