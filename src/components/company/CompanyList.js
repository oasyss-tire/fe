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
import CompanyDialog from './CompanyDialog';
import { useNavigate } from 'react-router-dom';

const CompanyList = () => {
  const [companies, setCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    const filtered = companies.filter(company => {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        (company.companyName && company.companyName.toLowerCase().includes(searchTermLower)) ||
        (company.address && company.address.toLowerCase().includes(searchTermLower)) ||
        (company.phoneNumber && company.phoneNumber.includes(searchTerm))
      );
    });
    setFilteredCompanies(filtered);
    setPage(1); // 검색 시 첫 페이지로 이동
  }, [searchTerm, companies]);

  const fetchCompanies = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/companies');
      if (response.ok) {
        let data = await response.json();
        
        // companyId 기준 내림차순 정렬 (최신 등록된 업체가 앞에 오도록)
        data.sort((a, b) => b.companyId - a.companyId);
  
        setCompanies(data);
        setFilteredCompanies(data);
      }
    } catch (error) {
      console.error('업체 목록 로딩 실패:', error);
    }
  };
  

  // 현재 페이지의 데이터만 반환
  const getCurrentPageData = () => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCompanies.slice(startIndex, endIndex);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleSubmit = async (companyData) => {
    // 저장 성공 후 목록 새로고침
    fetchCompanies(); // 회사 목록을 다시 불러오는 함수
  };

  const handleCompanyClick = (companyId) => {
    navigate(`/companies/${companyId}`);
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
        <Typography variant="h6">업체 관리</Typography>
      </Box>

      <Box sx={{ mt: 6 }}>
        {/* 검색창 */}
        <TextField
          size="small"
          fullWidth
          variant="outlined"
          placeholder="업체명 검색"
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

        {/* 업체 목록 테이블 */}
        <TableContainer component={Paper} sx={{ mb: 2, boxShadow: 'none' }}>
          <Table size="small" sx={{ tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell 
                  sx={{ 
                    py: 1, 
                    fontSize: '0.875rem', 
                    fontWeight: 'bold',
                    width: '30%'  // 업체명 열 너비
                  }}
                >
                  업체명
                </TableCell>
                <TableCell 
                  sx={{ 
                    py: 1, 
                    fontSize: '0.875rem', 
                    fontWeight: 'bold',
                    width: '25%'  // 연락처 열 너비
                  }}
                >
                  연락처
                </TableCell>
                <TableCell 
                  align="center" 
                  sx={{ 
                    py: 1, 
                    fontSize: '0.875rem', 
                    fontWeight: 'bold',
                    width: '25%'  // 팩스 열 너비
                  }}
                >
                  팩스
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
              {getCurrentPageData().map((company, index) => (
                <TableRow 
                  key={company.companyId}
                  onClick={() => handleCompanyClick(company.companyId)}
                  sx={{ 
                    cursor: 'pointer',
                    bgcolor: index % 2 === 0 ? '#ffffff' : '#fafafa',
                    '&:hover': { bgcolor: '#f5f5f5' }
                  }}
                >
                  <TableCell sx={{ py: 1, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {company.companyName}
                  </TableCell>
                  <TableCell sx={{ py: 1, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {company.phoneNumber || '-'}
                  </TableCell>
                  <TableCell align="center" sx={{ py: 1, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {company.faxNumber || '-'}
                  </TableCell>
                  <TableCell align="center" sx={{ py: 1 }}>
                    <Typography
                      sx={{
                        fontSize: '0.75rem',
                        color: company.status === 'ACTIVE' ? 'success.main' : 'error.main',
                        bgcolor: company.status === 'ACTIVE' ? 'success.lighter' : 'error.lighter',
                        py: 0.5,
                        px: 1,
                        borderRadius: 1,
                        display: 'inline-block'
                      }}
                    >
                      {company.status === 'ACTIVE' ? '사용' : '해지'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 업체 추가 버튼 */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 , borderRadius: '10px' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{
              bgcolor: '#343959',
              '&:hover': {
                bgcolor: '#3d63b8',
                borderRadius: '10px'
              }
            }}
          >
            업체 추가
          </Button>
        </Box>

        {/* 페이지네이션 */}
        <Stack spacing={2} alignItems="center">
          <Pagination
            count={Math.ceil(filteredCompanies.length / itemsPerPage)}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="small"
          />
        </Stack>
      </Box>

      {/* 업체 추가 다이얼로그 */}
      <CompanyDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />
    </Box>
  );
};

export default CompanyList; 