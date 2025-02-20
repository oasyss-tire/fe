import React from 'react';
import { Box, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';

const Reports = () => {
  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: '#FFFFFF',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 헤더 */}
      <Box sx={{ 
        p: 2, 
        position: 'sticky',
        top: 0,
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #EEEEEE',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600, 
            color: '#2A2A2A',
            textAlign: 'center'
          }}
        >
          보고서 및 분석
        </Typography>
      </Box>

      {/* 컨텐츠 */}
      <Box sx={{ 
        flex: 1, 
        p: 2,
        overflow: 'auto'
      }}>
        <Paper sx={{ p: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>업체명</TableCell>
                <TableCell>점검 횟수</TableCell>
                <TableCell>상태</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* 데이터 행 추가 예정 */}
            </TableBody>
          </Table>
        </Paper>
      </Box>
    </Box>
  );
};

export default Reports; 