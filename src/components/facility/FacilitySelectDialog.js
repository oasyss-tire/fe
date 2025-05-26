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
  Checkbox,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  InfoOutlined as InfoIcon
} from '@mui/icons-material';

/**
 * 시설물 선택 다이얼로그
 */
const FacilitySelectDialog = ({ 
  open, 
  onClose, 
  onSelect, 
  title = '시설물 선택',
  companyId = null,
  alreadySelectedFacilities = [] // 이미 선택된 시설물 목록
}) => {
  const [facilities, setFacilities] = useState([]);
  const [filteredFacilities, setFilteredFacilities] = useState([]);
  const [displayFacilities, setDisplayFacilities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFacilities, setSelectedFacilities] = useState([]);
  
  // 페이징 상태 - 서버 사이드 페이징으로 변경
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10); // 고정값으로 변경
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true); // 초기 로딩 상태 추가

  // 시설물 목록 조회 - 서버 사이드 페이징으로 변경
  const fetchFacilities = async (page = 1, search = '') => {
    if (!companyId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // 쿼리 파라미터 구성
      const params = new URLSearchParams({
        companyId: companyId,
        isActive: 'true',
        page: page - 1, // 서버는 0부터 시작
        size: pageSize
      });
      
      // 검색어가 있으면 추가
      if (search.trim()) {
        params.append('search', search.trim());
      }
      
      const response = await fetch(`http://localhost:8080/api/facilities?${params}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('시설물 목록을 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      
      // 폐기 상태가 아닌 시설물만 필터링
      const availableFacilities = (data.content || []).filter(facility => {
        return facility.statusCode !== "002003_0003" && facility.statusCode !== "002003_0004";
      });
      
      // 서버 응답 데이터로 상태 업데이트
      setDisplayFacilities(availableFacilities);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
      setCurrentPage(page);
      setIsInitialLoad(false); // 초기 로딩 완료
      
    } catch (error) {
      console.error('시설물 목록 조회 오류:', error);
      setError(error.message);
      setDisplayFacilities([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setIsLoading(false);
    }
  };

  // 다이얼로그가 열릴 때 초기 데이터 로드
  useEffect(() => {
    if (open && companyId) {
      fetchFacilities(1, '');
      setSelectedFacilities([]);
      setSearchTerm('');
      setIsInitialLoad(true);
    }
  }, [open, companyId]);

  // 검색 실행 (디바운스 적용) - 초기 로딩 제외
  useEffect(() => {
    // 초기 로딩 중이거나 다이얼로그가 닫혀있으면 실행하지 않음
    if (isInitialLoad || !open || !companyId) return;
    
    // 검색어 변경 시에만 디바운스 검색 실행
    const timer = setTimeout(() => {
      fetchFacilities(1, searchTerm);
    }, 300); // 300ms 디바운스
    
    return () => clearTimeout(timer);
  }, [searchTerm]); // 의존성을 searchTerm만으로 제한

  // 검색어 변경 시 시설물 필터링 - 서버 사이드 페이징으로 변경
  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
  };
  
  // 페이지 변경 핸들러 - 서버 사이드 페이징으로 변경
  const handlePageChange = (event, newPage) => {
    fetchFacilities(newPage, searchTerm);
  };

  // 시설물 선택 핸들러
  const handleToggleFacility = (facility) => {
    // 이미 선택된 시설물인지 확인
    const isAlreadySelected = alreadySelectedFacilities.some(
      item => String(item.facilityId) === String(facility.facilityId)
    );
    
    if (isAlreadySelected) {
      return; // 이미 선택된 시설물은 선택 불가
    }
    
    setSelectedFacilities(prev => {
      const isSelected = prev.some(item => String(item.facilityId) === String(facility.facilityId));
      
      if (isSelected) {
        // 이미 선택되어 있으면 제거
        return prev.filter(item => String(item.facilityId) !== String(facility.facilityId));
      } else {
        // 선택되어 있지 않으면 추가
        return [...prev, facility];
      }
    });
  };

  // 선택 완료 핸들러
  const handleConfirm = () => {
    if (selectedFacilities.length > 0) {
      onSelect(selectedFacilities);
      handleClose();
    }
  };

  // 다이얼로그 닫기 핸들러
  const handleClose = () => {
    setSearchTerm('');
    setSelectedFacilities([]);
    setCurrentPage(1);
    setIsInitialLoad(true); // 초기 로딩 상태 초기화
    setDisplayFacilities([]); // 데이터도 초기화
    setTotalPages(0);
    setTotalElements(0);
    onClose();
  };
  
  // 시설물이 이미 선택되었는지 확인
  const isAlreadySelected = (facilityId) => {
    return alreadySelectedFacilities.some(item => String(item.facilityId) === String(facilityId));
  };
  
  // 시설물이 현재 선택되었는지 확인
  const isCurrentlySelected = (facilityId) => {
    return selectedFacilities.some(item => String(item.facilityId) === String(facilityId));
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
              placeholder="시설물 유형, 관리번호, 시리얼 번호로 검색"
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
                        fetchFacilities(1, '');
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Box>
          
          {/* 선택 정보 */}
          <Box sx={{ px: 2, py: 1, borderBottom: '1px solid #EEEEEE', backgroundColor: '#F5F5F5' }}>
            <Typography variant="caption" sx={{ color: '#666' }}>
              선택된 시설물: {selectedFacilities.length}개
            </Typography>
          </Box>
          
          {/* 시설물 목록 */}
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ p: 3, textAlign: 'center', color: 'error.main', flexGrow: 1 }}>
              {error}
            </Box>
          ) : totalElements === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary', flexGrow: 1 }}>
              {searchTerm ? '검색 결과가 없습니다' : '등록된 시설물이 없습니다'}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
              <TableContainer component={Paper} sx={{ flexGrow: 1, boxShadow: 'none' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox" width="50px"></TableCell>
                      <TableCell>시설물 유형</TableCell>
                      <TableCell>관리 번호</TableCell>
                      <TableCell>시리얼 번호</TableCell>
                      <TableCell>상태</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {displayFacilities.map((facility) => {
                      const alreadySelected = isAlreadySelected(facility.facilityId);
                      const currentlySelected = isCurrentlySelected(facility.facilityId);
                      
                      return (
                        <TableRow 
                          key={facility.facilityId}
                          hover={!alreadySelected}
                          onClick={() => !alreadySelected && handleToggleFacility(facility)}
                          selected={currentlySelected}
                          sx={{ 
                            cursor: alreadySelected ? 'not-allowed' : 'pointer',
                            backgroundColor: alreadySelected ? '#F5F5F5' : 'inherit',
                            opacity: alreadySelected ? 0.7 : 1
                          }}
                        >
                          <TableCell padding="checkbox">
                            {alreadySelected ? (
                              <Tooltip title="이미 선택된 시설물입니다">
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <InfoIcon fontSize="small" color="disabled" />
                                </Box>
                              </Tooltip>
                            ) : (
                              <Checkbox 
                                checked={currentlySelected}
                                onChange={() => handleToggleFacility(facility)}
                                color="primary"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {facility.facilityTypeName || '-'}
                            {alreadySelected && (
                              <Chip 
                                label="이미 선택됨" 
                                size="small" 
                                sx={{ 
                                  ml: 1,
                                  height: '20px', 
                                  fontSize: '0.7rem',
                                  backgroundColor: '#FFE0B2'
                                }} 
                              />
                            )}
                          </TableCell>
                          <TableCell>{facility.managementNumber || '-'}</TableCell>
                          <TableCell>{facility.serialNumber || '-'}</TableCell>
                          <TableCell>{facility.statusName || '-'}</TableCell>
                        </TableRow>
                      );
                    })}
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
                  전체 {totalElements}건 중 {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalElements)}건 표시
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
          disabled={selectedFacilities.length === 0}
          startIcon={<CheckCircleIcon />}
        >
          {selectedFacilities.length > 0 ? `${selectedFacilities.length}개 선택` : '선택'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FacilitySelectDialog; 