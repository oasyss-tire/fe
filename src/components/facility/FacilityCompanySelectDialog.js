import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
  IconButton,
  Typography,
  CircularProgress,
  Radio
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';

/**
 * 시설물 이동/폐기를 위한 수탁업체 선택 다이얼로그
 */
const FacilityCompanySelectDialog = ({ 
  open, 
  onClose, 
  onSelect, 
  title = '수탁업체 선택',
  excludeCompanyId = null // 제외할 수탁업체 ID (ex: 출발지와 동일한 수탁업체 제외)
}) => {
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [displayCompanies, setDisplayCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  
  // 페이징 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  // 수탁업체 목록 조회
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('http://localhost:8080/api/companies', {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('수탁업체 목록을 불러오는데 실패했습니다.');
        }
        
        const data = await response.json();
        
        // 제외할 수탁업체 ID가 있으면 필터링
        const filteredData = excludeCompanyId 
          ? data.filter(company => String(company.id) !== String(excludeCompanyId))
          : data;
          
        setCompanies(filteredData);
        setFilteredCompanies(filteredData);
        
        // 페이징 처리
        updatePageData(filteredData, 1);
      } catch (error) {
        console.error('수탁업체 목록 조회 오류:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (open) {
      fetchCompanies();
      setCurrentPage(1);
      setSelectedCompany(null);
    }
  }, [open, excludeCompanyId]);
  
  // 페이징 데이터 업데이트 함수
  const updatePageData = (data, page) => {
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    setTotalPages(totalPages);
    
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    setDisplayCompanies(data.slice(startIndex, endIndex));
  };

  // 검색어 변경 시 수탁업체 필터링
  const handleSearchChange = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (!term.trim()) {
      setFilteredCompanies(companies);
      updatePageData(companies, 1);
      setCurrentPage(1);
      return;
    }
    
    const filtered = companies.filter(company => 
      (company.companyName && company.companyName.toLowerCase().includes(term)) ||
      (company.businessNumber && company.businessNumber.toLowerCase().includes(term)) ||
      (company.address && company.address.toLowerCase().includes(term))
    );
    
    setFilteredCompanies(filtered);
    updatePageData(filtered, 1);
    setCurrentPage(1);
  };
  
  // 페이지 변경 핸들러
  const handlePageChange = (event, newPage) => {
    setCurrentPage(newPage);
    updatePageData(filteredCompanies, newPage);
  };

  // 수탁업체 선택 핸들러
  const handleSelectCompany = (company) => {
    setSelectedCompany(company);
  };

  // 선택 완료 핸들러
  const handleConfirm = () => {
    if (selectedCompany) {
      onSelect(selectedCompany);
      handleClose();
    }
  };

  // 다이얼로그 닫기 핸들러
  const handleClose = () => {
    setSearchTerm('');
    setSelectedCompany(null);
    setCurrentPage(1);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h6">{title}</Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 0, minHeight: '500px' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* 검색창 */}
          <Box sx={{ p: 2, borderBottom: '1px solid #EEEEEE' }}>
            <TextField
              fullWidth
              placeholder="수탁업체명, 사업자등록번호, 주소로 검색"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton 
                      size="small" 
                      onClick={() => {
                        setSearchTerm('');
                        setFilteredCompanies(companies);
                        updatePageData(companies, 1);
                        setCurrentPage(1);
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Box>
          
          {/* 수탁업체 목록 */}
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ p: 3, textAlign: 'center', color: 'error.main', flexGrow: 1 }}>
              {error}
            </Box>
          ) : filteredCompanies.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary', flexGrow: 1 }}>
              검색 결과가 없습니다
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
              <TableContainer component={Paper} sx={{ flexGrow: 1, boxShadow: 'none' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox" width="50px"></TableCell>
                      <TableCell>수탁업체명</TableCell>
                      <TableCell>사업자등록번호</TableCell>
                      <TableCell>주소</TableCell>
                      <TableCell>전화번호</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {displayCompanies.map((company) => (
                      <TableRow 
                        key={company.id}
                        hover
                        onClick={() => handleSelectCompany(company)}
                        selected={selectedCompany?.id === company.id}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell padding="checkbox">
                          <Radio 
                            checked={selectedCompany?.id === company.id} 
                            onChange={() => handleSelectCompany(company)}
                          />
                        </TableCell>
                        <TableCell>{company.companyName || '-'}</TableCell>
                        <TableCell>{company.businessNumber || '-'}</TableCell>
                        <TableCell>{company.address || '-'}</TableCell>
                        <TableCell>{company.phoneNumber || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* 페이지네이션 */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                py: 1.5,
                px: 2,
                borderTop: '1px solid #EEEEEE',
                backgroundColor: '#F9F9FA',
              }}>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  전체 {filteredCompanies.length}건 중 {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredCompanies.length)}건 표시
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton 
                    disabled={currentPage === 1}
                    onClick={(e) => handlePageChange(e, 1)}
                    size="small"
                    sx={{ mx: 0.3 }}
                  >
                    <FirstPageIcon 
                      fontSize="small"
                      sx={{ 
                        color: currentPage === 1 ? '#ccc' : '#666'
                      }} 
                    />
                  </IconButton>
                  <IconButton 
                    disabled={currentPage === 1}
                    onClick={(e) => handlePageChange(e, currentPage - 1)}
                    size="small"
                    sx={{ mx: 0.3 }}
                  >
                    <ChevronLeftIcon
                      fontSize="small"
                      sx={{ 
                        color: currentPage === 1 ? '#ccc' : '#666'
                      }} 
                    />
                  </IconButton>
                  
                  <Box 
                    sx={{ 
                      mx: 1, 
                      px: 2,
                      minWidth: '80px', 
                      textAlign: 'center',
                      border: '1px dashed #ddd',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '28px'
                    }}
                  >
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      {currentPage} / {totalPages || 1}
                    </Typography>
                  </Box>
                  
                  <IconButton 
                    disabled={currentPage >= totalPages}
                    onClick={(e) => handlePageChange(e, currentPage + 1)}
                    size="small"
                    sx={{ mx: 0.3 }}
                  >
                    <ChevronRightIcon
                      fontSize="small"
                      sx={{ 
                        color: currentPage >= totalPages ? '#ccc' : '#666'
                      }} 
                    />
                  </IconButton>
                  <IconButton 
                    disabled={currentPage >= totalPages}
                    onClick={(e) => handlePageChange(e, totalPages)}
                    size="small"
                    sx={{ mx: 0.3 }}
                  >
                    <LastPageIcon
                      fontSize="small"
                      sx={{ 
                        color: currentPage >= totalPages ? '#ccc' : '#666'
                      }} 
                    />
                  </IconButton>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} color="inherit">
          취소
        </Button>
        <Button 
          onClick={handleConfirm}
          variant="contained" 
          disabled={!selectedCompany}
          startIcon={<CheckCircleIcon />}
        >
          선택
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FacilityCompanySelectDialog; 