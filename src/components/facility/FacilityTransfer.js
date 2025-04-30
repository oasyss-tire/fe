import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  IconButton,
  FormControl,
  InputLabel,
  TextField,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  SwapHoriz as SwapHorizIcon,
  DeleteForever as DeleteForeverIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const FacilityTransfer = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // 탭 상태 관리
  const [tabValue, setTabValue] = useState(0);
  
  // 이동 항목 관리
  const [transferItems, setTransferItems] = useState([]);
  
  // 폐기 항목 관리
  const [disposalItems, setDisposalItems] = useState([]);
  
  // 확인 다이얼로그
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null
  });

  // 회사 및 시설물 데이터 로딩
  useEffect(() => {
    fetchCompanies();
  }, []);

  // 탭 변경 처리
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // 회사 목록 조회
  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/companies', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('회사 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      
      // 회사 데이터 구조 확인
      if (data && data.length > 0) {
      }
      
      setCompanies(data);
    } catch (error) {
      console.error('회사 목록 조회 실패:', error);
      showSnackbar('회사 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 특정 회사의 시설물 목록 조회
  const fetchFacilitiesByCompany = async (companyId) => {
    if (!companyId) {
      console.error('유효하지 않은 회사 ID:', companyId);
      return [];
    }
    
    try {
      const response = await fetch(`http://localhost:8080/api/facilities?companyId=${companyId}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('시설물 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      
      // 폐기 상태가 아닌 시설물만 필터링 (statusCode가 "002003_0003"(폐기중) 또는 "002003_0004"(폐기완료)가 아닌 것만 포함)
      const availableFacilities = (data.content || []).filter(facility => {
        return facility.statusCode !== "002003_0003" && facility.statusCode !== "002003_0004";
      });
      
      return availableFacilities;
    } catch (error) {
      console.error('시설물 목록 조회 실패:', error);
      showSnackbar('시설물 목록을 불러오는데 실패했습니다.', 'error');
      return [];
    }
  };

  // 회사 선택 변경 시 시설물 목록 업데이트
  const handleCompanyChange = async (index, field, value) => {
    
    // 값이 없거나 undefined인 경우 처리
    if (!value) {
      console.error('회사 선택 값이 없음:', value);
      return;
    }
    
    try {
      if (field === 'sourceCompanyId') {
        // 로딩 상태 설정
        setLoading(true);
        
        // 출발지 회사 변경 시, 해당 회사의 시설물 목록 조회
        const companyFacilities = await fetchFacilitiesByCompany(value);
        
        // 이동 항목 업데이트 - 해당 항목의 facilities 배열만 업데이트
        const updatedItems = [...transferItems];
        updatedItems[index] = {
          ...updatedItems[index],
          [field]: value,
          facilityId: '', // 시설물 선택 초기화
          facilities: companyFacilities // 해당 항목에만 시설물 목록 저장
        };
        setTransferItems(updatedItems);
        
        // 로딩 상태 해제
        setLoading(false);
      } else {
        // 도착지 회사나 다른 필드 변경
        const updatedItems = [...transferItems];
        updatedItems[index] = {
          ...updatedItems[index],
          [field]: value
        };
        setTransferItems(updatedItems);
      }
    } catch (error) {
      console.error('회사 선택 처리 중 오류:', error);
      setLoading(false);
      showSnackbar('회사 선택 처리 중 오류가 발생했습니다.', 'error');
    }
  };

  // 폐기할 회사 선택 변경 시
  const handleDisposalCompanyChange = async (index, value) => {
    
    // 값이 없거나 undefined인 경우 처리
    if (!value) {
      console.error('회사 선택 값이 없음:', value);
      return;
    }
    
    try {
      // 로딩 상태 설정
      setLoading(true);
      
      // 선택한 회사의 시설물 목록 조회
      const companyFacilities = await fetchFacilitiesByCompany(value);
      
      // 폐기 항목 업데이트 - 해당 항목의 facilities 배열만 업데이트
      const updatedItems = [...disposalItems];
      updatedItems[index] = {
        ...updatedItems[index],
        companyId: value,
        facilityId: '', // 시설물 선택 초기화
        facilities: companyFacilities // 해당 항목에만 시설물 목록 저장
      };
      setDisposalItems(updatedItems);
      
      // 로딩 상태 해제
      setLoading(false);
    } catch (error) {
      console.error('회사 선택 처리 중 오류:', error);
      setLoading(false);
      showSnackbar('회사 선택 처리 중 오류가 발생했습니다.', 'error');
    }
  };

  // 이미 선택된 시설물 ID 목록 확인 (현재 항목 제외)
  const getSelectedFacilityIds = (currentIndex, type) => {
    if (type === 'transfer') {
      return transferItems
        .filter((_, idx) => idx !== currentIndex) // 현재 항목 제외
        .map(item => item.facilityId)
        .filter(id => id); // 빈 값 제외
    } else {
      return disposalItems
        .filter((_, idx) => idx !== currentIndex)
        .map(item => item.facilityId)
        .filter(id => id);
    }
  };

  // 시설물 선택 변경 시
  const handleFacilityChange = (index, facilityId, type) => {
    
    if (!facilityId) {
      console.error('시설물 선택 값이 없음:', facilityId);
      return;
    }
    
    if (type === 'transfer') {
      const updatedItems = [...transferItems];
      updatedItems[index] = {
        ...updatedItems[index],
        facilityId
      };
      setTransferItems(updatedItems);
    } else {
      const updatedItems = [...disposalItems];
      updatedItems[index] = {
        ...updatedItems[index],
        facilityId
      };
      setDisposalItems(updatedItems);
    }
  };

  // 비고(notes) 변경 처리
  const handleNotesChange = (index, value, type) => {
    if (type === 'transfer') {
      const updatedItems = [...transferItems];
      updatedItems[index] = {
        ...updatedItems[index],
        notes: value
      };
      setTransferItems(updatedItems);
    } else {
      const updatedItems = [...disposalItems];
      updatedItems[index] = {
        ...updatedItems[index],
        notes: value
      };
      setDisposalItems(updatedItems);
    }
  };

  // 이동 항목 추가
  const handleAddTransferItem = () => {
    setTransferItems([
      ...transferItems,
      { sourceCompanyId: '', facilityId: '', destinationCompanyId: '', notes: '', facilities: [] }
    ]);
  };

  // 폐기 항목 추가
  const handleAddDisposalItem = () => {
    setDisposalItems([
      ...disposalItems,
      { companyId: '', facilityId: '', notes: '', facilities: [] }
    ]);
  };

  // 항목 삭제
  const handleRemoveItem = (index, type) => {
    if (type === 'transfer') {
      const updatedItems = transferItems.filter((_, i) => i !== index);
      setTransferItems(updatedItems);
    } else {
      const updatedItems = disposalItems.filter((_, i) => i !== index);
      setDisposalItems(updatedItems);
    }
  };

  // 이동 처리
  const handleTransfer = () => {
    // 필드 검증
    const invalidItems = transferItems.filter(
      item => !item.sourceCompanyId || !item.facilityId || !item.destinationCompanyId
    );
    
    if (invalidItems.length > 0) {
      showSnackbar('모든 필드를 채워주세요.', 'warning');
      return;
    }
    
    // 확인 다이얼로그 표시
    setConfirmDialog({
      open: true,
      title: '시설물 이동 확인',
      message: '선택한 시설물을 이동하시겠습니까?',
      onConfirm: confirmTransfer
    });
  };

  // 이동 확인 처리
  const confirmTransfer = async () => {
    setLoading(true);
    try {
      // 이동 전에 시설물 상태 재확인
      const statusCheckPromises = transferItems.map(async item => {
        const facilityResponse = await fetch(`http://localhost:8080/api/facilities/${item.facilityId}`, {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        });
        
        if (!facilityResponse.ok) {
          throw new Error(`시설물 정보 조회 실패 (ID: ${item.facilityId})`);
        }
        
        const facilityData = await facilityResponse.json();
        // 폐기 상태 확인 ("002003_0003": 폐기중, "002003_0004": 폐기완료)
        if (facilityData.statusCode === "002003_0003" || facilityData.statusCode === "002003_0004") {
          throw new Error(`이미 폐기 처리된 시설물은 이동할 수 없습니다 (ID: ${item.facilityId}, ${facilityData.facilityTypeName})`);
        }
        
        return { ...item, currentStatus: facilityData.statusCode };
      });
      
      try {
        const checkedItems = await Promise.all(statusCheckPromises);
        
        // 이동 요청을 백엔드로 전송
        const promises = checkedItems.map(item => 
          fetch('http://localhost:8080/api/facility-transactions/move', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            },
            body: JSON.stringify({
              facilityId: item.facilityId,
              fromCompanyId: item.sourceCompanyId,
              toCompanyId: item.destinationCompanyId,
              notes: item.notes || '시설물 이동/폐기 관리 화면에서 이동 처리됨'
            })
          })
        );
        
        const results = await Promise.all(promises);
        const failed = results.filter(res => !res.ok);
        
        if (failed.length > 0) {
          throw new Error(`${failed.length}개 항목 이동 실패`);
        }
        
        showSnackbar('시설물 이동이 성공적으로 처리되었습니다.', 'success');
        // 이동 항목 초기화
        setTransferItems([]);
      } catch (error) {
        throw error;
      }
    } catch (error) {
      console.error('시설물 이동 실패:', error);
      showSnackbar(error.message || '시설물 이동 처리 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };

  // 폐기 처리
  const handleDisposal = () => {
    // 필드 검증
    const invalidItems = disposalItems.filter(
      item => !item.companyId || !item.facilityId
    );
    
    if (invalidItems.length > 0) {
      showSnackbar('모든 필드를 채워주세요.', 'warning');
      return;
    }
    
    // 확인 다이얼로그 표시
    setConfirmDialog({
      open: true,
      title: '시설물 폐기 확인',
      message: '선택한 시설물을 폐기하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      onConfirm: confirmDisposal
    });
  };

  // 폐기 확인 처리
  const confirmDisposal = async () => {
    setLoading(true);
    try {
      // 폐기 요청을 백엔드로 전송
      const promises = disposalItems.map(item => 
        fetch('http://localhost:8080/api/facility-transactions/dispose', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          },
          body: JSON.stringify({
            facilityId: item.facilityId,
            notes: item.notes || '시설물 이동/폐기 관리 화면에서 폐기 처리됨'
          })
        })
      );
      
      const results = await Promise.all(promises);
      const failed = results.filter(res => !res.ok);
      
      if (failed.length > 0) {
        throw new Error(`${failed.length}개 항목 폐기 실패`);
      }
      
      showSnackbar('시설물 폐기가 성공적으로 처리되었습니다.', 'success');
      // 폐기 항목 초기화
      setDisposalItems([]);
    } catch (error) {
      console.error('시설물 폐기 실패:', error);
      showSnackbar('시설물 폐기 처리 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };

  // 스낵바 메시지 표시
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // 스낵바 닫기
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // 다이얼로그 닫기
  const handleCloseDialog = () => {
    setConfirmDialog({
      ...confirmDialog,
      open: false
    });
  };

  // 목록으로 돌아가기
  const handleGoToList = () => {
    navigate('/facility-list');
  };

  // 회사명 가져오기
  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.companyName : '회사 정보 없음';
  };

  // 시설물 렌더링 시 사용할 함수 (이동용)
  const renderTransferFacilities = (index) => {
    const item = transferItems[index];
    // 해당 항목에 시설물 목록이 없으면 빈 배열 반환
    if (!item || !item.facilities || item.facilities.length === 0) {
      return [];
    }
    return item.facilities;
  };

  // 시설물 렌더링 시 사용할 함수 (폐기용)
  const renderDisposalFacilities = (index) => {
    const item = disposalItems[index];
    // 해당 항목에 시설물 목록이 없으면 빈 배열 반환
    if (!item || !item.facilities || item.facilities.length === 0) {
      return [];
    }
    return item.facilities;
  };

  // 이동 탭 컨텐츠
  const renderTransferTab = () => (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          시설물 이동
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleAddTransferItem}
        >
          이동 항목 추가
        </Button>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width="5%">No.</TableCell>
              <TableCell width="25%">출발지 회사</TableCell>
              <TableCell width="25%">이동할 시설물</TableCell>
              <TableCell width="25%">목적지 회사</TableCell>
              <TableCell width="15%">비고</TableCell>
              <TableCell width="5%">작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transferItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">이동할 시설물이 없습니다. '이동 항목 추가' 버튼을 클릭하여 시설물을 추가하세요.</TableCell>
              </TableRow>
            ) : (
              transferItems.map((item, index) => (
                <TableRow key={`transfer-${index}`}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <FormControl fullWidth size="small" sx={{ minWidth: 150 }}>
                      <Select
                        value={item.sourceCompanyId ? String(item.sourceCompanyId) : ''}
                        onChange={(e) => {
                          handleCompanyChange(index, 'sourceCompanyId', e.target.value);
                        }}
                        displayEmpty
                        renderValue={(selected) => {
                          if (!selected) {
                            return <em>출발지 회사 선택</em>;
                          }
                          const company = companies.find(c => String(c.id) === selected);
                          return company ? (
                            <Typography noWrap sx={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {company.companyName}
                            </Typography>
                          ) : '회사 정보 없음';
                        }}
                        MenuProps={{
                          PaperProps: {
                            style: {
                              maxHeight: 300
                            }
                          }
                        }}
                      >
                        <MenuItem value="" disabled><em>출발지 회사 선택</em></MenuItem>
                        {companies.map((company) => (
                          <MenuItem key={company.id} value={String(company.id)}>
                            {company.companyName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <FormControl fullWidth size="small" sx={{ minWidth: 150 }}>
                      <Select
                        value={item.facilityId ? String(item.facilityId) : ''}
                        onChange={(e) => {
                          handleFacilityChange(index, e.target.value, 'transfer');
                        }}
                        displayEmpty
                        disabled={!item.sourceCompanyId}
                        renderValue={(selected) => {
                          if (!selected) {
                            return <em>시설물 선택</em>;
                          }
                          const facility = item.facilities?.find(f => String(f.facilityId) === selected);
                          return facility ? (
                            <Typography noWrap sx={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {facility.facilityTypeName} / {facility.managementNumber}
                            </Typography>
                          ) : '시설물 정보 없음';
                        }}
                        MenuProps={{
                          PaperProps: {
                            style: {
                              maxHeight: 300
                            }
                          }
                        }}
                      >
                        <MenuItem value="" disabled><em>시설물 선택</em></MenuItem>
                        {renderTransferFacilities(index).map((facility) => {
                          // 이미 다른 항목에서 선택된 시설물인지 확인
                          const isAlreadySelected = getSelectedFacilityIds(index, 'transfer').includes(facility.facilityId.toString());
                          return (
                            <MenuItem 
                              key={facility.facilityId} 
                              value={String(facility.facilityId)}
                              disabled={isAlreadySelected}
                            >
                              {facility.facilityTypeName} / {facility.managementNumber}
                              {isAlreadySelected && " (이미 선택됨)"}
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <FormControl fullWidth size="small" sx={{ minWidth: 150 }}>
                      <Select
                        value={item.destinationCompanyId ? String(item.destinationCompanyId) : ''}
                        onChange={(e) => {
                          handleCompanyChange(index, 'destinationCompanyId', e.target.value);
                        }}
                        displayEmpty
                        renderValue={(selected) => {
                          if (!selected) {
                            return <em>목적지 회사 선택</em>;
                          }
                          const company = companies.find(c => String(c.id) === selected);
                          return company ? (
                            <Typography noWrap sx={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {company.companyName}
                            </Typography>
                          ) : '회사 정보 없음';
                        }}
                        MenuProps={{
                          PaperProps: {
                            style: {
                              maxHeight: 300
                            }
                          }
                        }}
                      >
                        <MenuItem value="" disabled><em>목적지 회사 선택</em></MenuItem>
                        {companies.map((company) => (
                          <MenuItem 
                            key={company.id} 
                            value={String(company.id)}
                            disabled={String(company.id) === String(item.sourceCompanyId)} // 출발지와 같은 회사는 선택 불가
                          >
                            {company.companyName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="비고 입력"
                      value={item.notes || ''}
                      onChange={(e) => handleNotesChange(index, e.target.value, 'transfer')}
                      sx={{ minWidth: 100 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton 
                      color="error"
                      onClick={() => handleRemoveItem(index, 'transfer')}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {transferItems.length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleTransfer}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : '이동 처리'}
          </Button>
        </Box>
      )}
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="body2" color="text.secondary">
          * 시설물 이동 처리 시 시설물의 모든 이력과 데이터는 함께 이동됩니다.
        </Typography>
      </Box>
    </Paper>
  );

  // 폐기 탭 컨텐츠
  const renderDisposalTab = () => (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          시설물 폐기
        </Typography>
        <Button 
          variant="contained" 
          color="error"
          startIcon={<AddIcon />}
          onClick={handleAddDisposalItem}
        >
          폐기 항목 추가
        </Button>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width="5%">No.</TableCell>
              <TableCell width="35%">회사</TableCell>
              <TableCell width="35%">폐기할 시설물</TableCell>
              <TableCell width="20%">비고</TableCell>
              <TableCell width="5%">작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {disposalItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">폐기할 시설물이 없습니다. '폐기 항목 추가' 버튼을 클릭하여 시설물을 추가하세요.</TableCell>
              </TableRow>
            ) : (
              disposalItems.map((item, index) => (
                <TableRow key={`disposal-${index}`}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <FormControl fullWidth size="small" sx={{ minWidth: 150 }}>
                      <Select
                        value={item.companyId ? String(item.companyId) : ''}
                        onChange={(e) => {
                          handleDisposalCompanyChange(index, e.target.value);
                        }}
                        displayEmpty
                        renderValue={(selected) => {
                          if (!selected) {
                            return <em>회사 선택</em>;
                          }
                          const company = companies.find(c => String(c.id) === selected);
                          return company ? (
                            <Typography noWrap sx={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {company.companyName}
                            </Typography>
                          ) : '회사 정보 없음';
                        }}
                        MenuProps={{
                          PaperProps: {
                            style: {
                              maxHeight: 300
                            }
                          }
                        }}
                      >
                        <MenuItem value="" disabled><em>회사 선택</em></MenuItem>
                        {companies.map((company) => (
                          <MenuItem key={company.id} value={String(company.id)}>
                            {company.companyName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <FormControl fullWidth size="small" sx={{ minWidth: 150 }}>
                      <Select
                        value={item.facilityId ? String(item.facilityId) : ''}
                        onChange={(e) => {
                          handleFacilityChange(index, e.target.value, 'disposal');
                        }}
                        displayEmpty
                        disabled={!item.companyId}
                        renderValue={(selected) => {
                          if (!selected) {
                            return <em>시설물 선택</em>;
                          }
                          const facility = item.facilities?.find(f => String(f.facilityId) === selected);
                          return facility ? (
                            <Typography noWrap sx={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {facility.facilityTypeName} / {facility.managementNumber}
                            </Typography>
                          ) : '시설물 정보 없음';
                        }}
                        MenuProps={{
                          PaperProps: {
                            style: {
                              maxHeight: 300
                            }
                          }
                        }}
                      >
                        <MenuItem value="" disabled><em>시설물 선택</em></MenuItem>
                        {renderDisposalFacilities(index).map((facility) => {
                          // 이미 다른 항목에서 선택된 시설물인지 확인
                          const isAlreadySelected = getSelectedFacilityIds(index, 'disposal').includes(facility.facilityId.toString());
                          return (
                            <MenuItem 
                              key={facility.facilityId} 
                              value={String(facility.facilityId)}
                              disabled={isAlreadySelected}
                            >
                              {facility.facilityTypeName} / {facility.managementNumber}
                              {isAlreadySelected && " (이미 선택됨)"}
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="폐기 사유"
                      value={item.notes || ''}
                      onChange={(e) => handleNotesChange(index, e.target.value, 'disposal')}
                      sx={{ minWidth: 100 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton 
                      color="error"
                      onClick={() => handleRemoveItem(index, 'disposal')}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {disposalItems.length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleDisposal}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : '폐기 처리'}
          </Button>
        </Box>
      )}
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="body2" color="text.secondary">
          * 폐기된 시설물은 복구할 수 없으며, 관련 데이터는 보관됩니다.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          * 시설물 폐기는 되돌릴 수 없으므로 신중하게 처리해주세요.
        </Typography>
      </Box>
    </Paper>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        시설물 출고 (이동/폐기)
      </Typography>

      {/* 탭 UI */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            icon={<SwapHorizIcon />} 
            label="시설물 이동" 
            iconPosition="start"
          />
          <Tab 
            icon={<DeleteForeverIcon />} 
            label="시설물 폐기" 
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* 탭 컨텐츠 */}
      {tabValue === 0 ? renderTransferTab() : renderDisposalTab()}

      {/* 하단 버튼 */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 2 }}>
        <Button 
          variant="contained" 
          onClick={handleGoToList}
          sx={{ 
            minWidth: 120,
            backgroundColor: '#40a9ff',
            '&:hover': {
              backgroundColor: '#1890ff',
            },
          }}
        >
          목록으로
        </Button>
      </Box>

      {/* 스낵바 */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* 확인 다이얼로그 */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCloseDialog}
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            취소
          </Button>
          <Button onClick={confirmDialog.onConfirm} color="primary" autoFocus>
            확인
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FacilityTransfer; 