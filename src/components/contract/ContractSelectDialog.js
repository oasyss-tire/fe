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
  Divider,
  CircularProgress,
  Radio,
  Chip,
  Grid,
  Stepper,
  Step,
  StepLabel,
  StepButton
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import ContractEventLogService from '../../services/ContractEventLogService';

/**
 * 계약 이벤트 로그를 위한 업체 및 계약 선택 다이얼로그 컴포넌트
 */
const ContractSelectDialog = ({ open, onClose, onSelect }) => {
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [displayCompanies, setDisplayCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [isLoadingContracts, setIsLoadingContracts] = useState(false);
  
  const [activeStep, setActiveStep] = useState(0);
  
  // 페이징 상태 추가
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(0);

  // 업체 목록 조회
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await ContractEventLogService.getCompaniesForLog();
        if (response && response.data) {
          setCompanies(response.data);
          setFilteredCompanies(response.data);
          
          // 페이징 처리
          updatePageData(response.data, 1);
        }
      } catch (error) {
        console.error('위수탁 업체 목록 조회 오류:', error);
        setError('업체 목록을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (open) {
      fetchCompanies();
      setCurrentPage(1);
    }
  }, [open]);
  
  // 페이징 데이터 업데이트 함수
  const updatePageData = (data, page) => {
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    setTotalPages(totalPages);
    
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    setDisplayCompanies(data.slice(startIndex, endIndex));
  };

  // 검색어 변경 시 업체 필터링
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
      (company.storeCode && company.storeCode.toLowerCase().includes(term)) ||
      (company.storeNumber && company.storeNumber.toLowerCase().includes(term)) ||
      (company.storeName && company.storeName.toLowerCase().includes(term)) ||
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

  // 업체 선택 핸들러
  const handleSelectCompany = async (company) => {
    setSelectedCompany(company);
    setSelectedContract(null);
    
    // 선택한 업체의 계약 목록 조회
    try {
      setIsLoadingContracts(true);
      
      const response = await ContractEventLogService.getContractsByCompanyForLog(company.id);
      if (response && response.data) {
        setContracts(response.data);
      }
      setActiveStep(1); // 다음 스텝으로 자동 이동
    } catch (error) {
      console.error('계약 목록 조회 오류:', error);
      setContracts([]);
    } finally {
      setIsLoadingContracts(false);
    }
  };

  // 계약 선택 핸들러
  const handleSelectContract = (contract) => {
    setSelectedContract(contract);
  };

  // 선택 완료 핸들러
  const handleConfirm = () => {
    if (selectedCompany && selectedContract) {
      onSelect(selectedCompany, selectedContract);
      handleClose();
    }
  };

  // 다이얼로그 닫기 핸들러
  const handleClose = () => {
    setSearchTerm('');
    setSelectedCompany(null);
    setSelectedContract(null);
    setContracts([]);
    setActiveStep(0);
    setCurrentPage(1);
    onClose();
  };

  // 스텝 변경 핸들러
  const handleStepChange = (step) => {
    if (step === 1 && !selectedCompany) {
      return; // 업체를 선택하지 않았으면 다음 단계로 이동 불가
    }
    setActiveStep(step);
  };

  // 이전 단계로 이동
  const handleBack = () => {
    setActiveStep(0);
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h6">업체 및 계약 선택</Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Stepper activeStep={activeStep} sx={{ px: 3, py: 2, mb: 1 }}>
        <Step completed={selectedCompany !== null}>
          <StepButton onClick={() => handleStepChange(0)}>
            업체 선택
          </StepButton>
        </Step>
        <Step>
          <StepButton onClick={() => handleStepChange(1)} disabled={!selectedCompany}>
            계약 선택
          </StepButton>
        </Step>
      </Stepper>
      
      <DialogContent dividers sx={{ p: 0, minHeight: '500px' }}>
        {/* 업체 선택 단계 */}
        {activeStep === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* 검색창 */}
            <Box sx={{ p: 2, borderBottom: '1px solid #EEEEEE' }}>
              <TextField
                fullWidth
                placeholder="업체명, 매장코드, 점번으로 검색"
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
            
            {/* 업체 목록 */}
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
                        <TableCell>매장코드</TableCell>
                        <TableCell>점번</TableCell>
                        <TableCell>매장명</TableCell>
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
                          <TableCell>{company.storeCode || '-'}</TableCell>
                          <TableCell>{company.storeNumber || '-'}</TableCell>
                          <TableCell>{company.storeName || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {/* 페이지네이션 추가 */}
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
        )}
        
        {/* 계약 선택 단계 */}
        {activeStep === 1 && selectedCompany && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* 선택된 업체 정보 - 간략화 */}
            <Box sx={{ p: 2, borderBottom: '1px solid #EEEEEE', bgcolor: '#f8f9fa' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton size="small" onClick={handleBack} sx={{ mr: 1 }}>
                  <ArrowBackIcon fontSize="small" />
                </IconButton>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    선택된 업체
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedCompany.companyName || selectedCompany.storeName || '-'}
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            {/* 계약 목록 */}
            <Box sx={{ p: 2, borderBottom: '1px solid #EEEEEE' }}>
              <Typography variant="subtitle1" gutterBottom>
                계약 선택
              </Typography>
              <Typography variant="caption" color="text.secondary">
                이벤트 로그를 조회할 계약을 선택해주세요.
              </Typography>
            </Box>
            
            {isLoadingContracts ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                <CircularProgress />
              </Box>
            ) : contracts.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary', flexGrow: 1 }}>
                계약 정보가 없습니다
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ flexGrow: 1, boxShadow: 'none' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox" width="50px"></TableCell>
                      <TableCell>계약번호</TableCell>
                      <TableCell>계약명</TableCell>
                      <TableCell>수탁업체명</TableCell>
                      <TableCell>계약생성일</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contracts.map((contract) => {
                      // 날짜 포맷팅 (YYYY-MM-DD까지만)
                      const formattedDate = contract.createdAt ? 
                        contract.createdAt.substring(0, 10) : '-';
                        
                      return (
                        <TableRow 
                          key={contract.id}
                          hover
                          onClick={() => handleSelectContract(contract)}
                          selected={selectedContract?.id === contract.id}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell padding="checkbox">
                            <Radio 
                              checked={selectedContract?.id === contract.id} 
                              onChange={() => handleSelectContract(contract)}
                            />
                          </TableCell>
                          <TableCell>{contract.contractNumber || '-'}</TableCell>
                          <TableCell>{contract.title || '-'}</TableCell>
                          <TableCell>{contract.companyName || '-'}</TableCell>
                          <TableCell>{formattedDate}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Button onClick={handleClose} color="inherit">
          취소
        </Button>
        
        <Box>
          {activeStep === 0 ? (
            <Button
              variant="contained"
              onClick={() => handleStepChange(1)}
              endIcon={<ArrowForwardIcon />}
              disabled={!selectedCompany}
            >
              다음
            </Button>
          ) : (
            <Button 
              onClick={handleConfirm}
              variant="contained" 
              disabled={!selectedCompany || !selectedContract}
              startIcon={<CheckCircleIcon />}
            >
              선택 완료
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ContractSelectDialog; 