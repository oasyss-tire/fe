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
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';

/**
 * 위수탁 업체 및 수탁자 이력 선택을 위한 다이얼로그 컴포넌트
 */
const CompanySelectDialog = ({ open, onClose, onSelect }) => {
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [trusteeHistories, setTrusteeHistories] = useState([]);
  const [selectedTrusteeHistory, setSelectedTrusteeHistory] = useState(null);
  const [isLoadingHistories, setIsLoadingHistories] = useState(false);
  
  const [activeStep, setActiveStep] = useState(0);

  // 업체 목록 조회
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('http://localhost:8080/api/companies?active=true');
        if (!response.ok) {
          throw new Error('위수탁 업체 목록을 불러오는데 실패했습니다.');
        }
        
        const data = await response.json();
        setCompanies(data);
        setFilteredCompanies(data);
      } catch (error) {
        console.error('위수탁 업체 목록 조회 오류:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (open) {
      fetchCompanies();
    }
  }, [open]);

  // 검색어 변경 시 업체 필터링
  const handleSearchChange = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (!term.trim()) {
      setFilteredCompanies(companies);
      return;
    }
    
    const filtered = companies.filter(company => 
      (company.storeName && company.storeName.toLowerCase().includes(term)) ||
      (company.storeCode && company.storeCode.toLowerCase().includes(term)) ||
      (company.storeNumber && company.storeNumber.toLowerCase().includes(term)) ||
      (company.address && company.address.toLowerCase().includes(term))
    );
    
    setFilteredCompanies(filtered);
  };

  // 업체 선택 핸들러
  const handleSelectCompany = async (company) => {
    setSelectedCompany(company);
    setSelectedTrusteeHistory(null);
    
    // 선택한 업체의 수탁자 이력 조회
    try {
      setIsLoadingHistories(true);
      
      const response = await fetch(`http://localhost:8080/api/companies/${company.id}/histories-for-contract`);
      if (!response.ok) {
        throw new Error('수탁자 이력을 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      setTrusteeHistories(data);
      setActiveStep(1); // 다음 스텝으로 자동 이동
    } catch (error) {
      console.error('수탁자 이력 조회 오류:', error);
      setTrusteeHistories([]);
    } finally {
      setIsLoadingHistories(false);
    }
  };

  // 수탁자 이력 선택 핸들러
  const handleSelectTrusteeHistory = (trusteeHistory) => {
    setSelectedTrusteeHistory(trusteeHistory);
  };

  // 선택 완료 핸들러
  const handleConfirm = () => {
    if (selectedCompany) {
      onSelect(selectedCompany, selectedTrusteeHistory);
      handleClose();
    }
  };

  // 다이얼로그 닫기 핸들러
  const handleClose = () => {
    setSearchTerm('');
    setSelectedCompany(null);
    setSelectedTrusteeHistory(null);
    setTrusteeHistories([]);
    setActiveStep(0);
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
    <Dialog 
      open={open} 
      onClose={handleClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h6">매장 및 수탁사업자 선택</Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Stepper activeStep={activeStep} sx={{ px: 3, py: 2, mb: 1 }}>
        <Step completed={selectedCompany !== null}>
          <StepButton onClick={() => handleStepChange(0)}>
            매장 선택
          </StepButton>
        </Step>
        <Step>
          <StepButton onClick={() => handleStepChange(1)} disabled={!selectedCompany}>
            수탁사업자 선택
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
                placeholder="매장코드, 점번, 매장명으로 검색"
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
              <TableContainer component={Paper} sx={{ flexGrow: 1, boxShadow: 'none' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox" width="50px"></TableCell>
                      <TableCell>매장코드</TableCell>
                      <TableCell>점번</TableCell>
                      <TableCell>매장명</TableCell>
                      <TableCell>주소</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCompanies.map((company) => (
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
                        <TableCell>{company.address || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
        
        {/* 수탁자 선택 단계 */}
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
                    [{selectedCompany.storeCode || '-'}] {selectedCompany.storeName || '-'}
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            {/* 수탁자 이력 목록 */}
            <Box sx={{ p: 2, borderBottom: '1px solid #EEEEEE' }}>
              <Typography variant="subtitle1" gutterBottom>
                계약서 발송 수탁사업자 선택
              </Typography>
              <Typography variant="caption" color="text.secondary">
                계약 내용에 포함될 수탁사업자를 선택해주세요.
              </Typography>
            </Box>
            
            {isLoadingHistories ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                <CircularProgress />
              </Box>
            ) : trusteeHistories.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary', flexGrow: 1 }}>
                수탁사업자 이력이 없습니다
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ flexGrow: 1, boxShadow: 'none' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox" width="50px"></TableCell>
                      <TableCell>수탁코드</TableCell>
                      <TableCell>수탁사업자명</TableCell>
                      <TableCell>대표자</TableCell>
                      <TableCell>보증보험 기간</TableCell>
                      <TableCell>상태</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {trusteeHistories.map((history) => (
                      <TableRow 
                        key={history.id}
                        hover
                        onClick={() => handleSelectTrusteeHistory(history)}
                        selected={selectedTrusteeHistory?.id === history.id}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell padding="checkbox">
                          <Radio 
                            checked={selectedTrusteeHistory?.id === history.id} 
                            onChange={() => handleSelectTrusteeHistory(history)}
                          />
                        </TableCell>
                        <TableCell>{history.trusteeCode || '-'}</TableCell>
                        <TableCell>{history.trustee || '-'}</TableCell>
                        <TableCell>{history.representativeName || '-'}</TableCell>
                        <TableCell>
                          {history.insuranceStartDate && history.insuranceEndDate ? 
                            `${history.insuranceStartDate} ~ ${history.insuranceEndDate}` : 
                            '-'}
                        </TableCell>
                        <TableCell>
                          {getStatusChip(history.statusType, history.statusLabel)}
                        </TableCell>
                      </TableRow>
                    ))}
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
              disabled={!selectedCompany || !selectedTrusteeHistory}
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

export default CompanySelectDialog; 