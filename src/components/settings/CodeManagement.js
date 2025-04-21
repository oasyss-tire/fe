import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Grid,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  TextField,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Breadcrumbs,
  Link,
  InputAdornment,
  Tooltip,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  CloudDownload as DownloadIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  ListAlt as ListAltIcon
} from '@mui/icons-material';

const CodeManagement = () => {
  // 상태 관리
  const [selectedGroup, setSelectedGroup] = useState(null); // 선택된 코드 그룹
  const [selectedCode, setSelectedCode] = useState(null); // 선택된 코드
  const [groupDialogOpen, setGroupDialogOpen] = useState(false); // 그룹 추가/수정 다이얼로그
  const [codeDialogOpen, setCodeDialogOpen] = useState(false); // 코드 추가/수정 다이얼로그
  const [isEditMode, setIsEditMode] = useState(false); // 수정 모드 여부
  const [expandedGroups, setExpandedGroups] = useState(['001', '002', '003', '004', '005']);
  const [searchGroupText, setSearchGroupText] = useState('');
  const [searchCodeText, setSearchCodeText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [groups, setGroups] = useState([]);
  const [codes, setCodes] = useState([]);

  const [groupFormData, setGroupFormData] = useState({
    groupName: '',
    level: 1,
    parentGroupId: null,
    description: '',
    active: true,
    isProtected: false
  });

  const [codeFormData, setCodeFormData] = useState({
    codeName: '',
    sortOrder: 0,
    description: '',
    active: true,
    isProtected: false
  });
  
  // 삭제 확인 다이얼로그 상태
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState(''); // 'group' 또는 'code'
  const [itemToDelete, setItemToDelete] = useState(null);

  // API에서 코드 그룹 데이터 가져오기
  const fetchGroups = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/codes/groups');
      if (!response.ok) {
        throw new Error('코드 그룹 데이터를 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      setGroups(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching code groups:', err);
      setError('코드 그룹을 불러오는데 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // 코드 선택 핸들러
  const handleCodeSelect = (code) => {
    setSelectedCode(code);
  };

  // 그룹 선택 핸들러
  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    setSelectedCode(null);
    
    // 선택된 그룹에 속한 코드 가져오기
    fetchCodesByGroup(group.groupId);
  };

  // 선택된 그룹의 코드 가져오기
  const fetchCodesByGroup = async (groupId) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/codes/groups/${groupId}/codes`);
      if (!response.ok) {
        throw new Error('코드 데이터를 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      setCodes(data);
      setError(null);
    } catch (err) {
      console.error(`Error fetching codes for group ${groupId}:`, err);
      setError('코드를 불러오는데 문제가 발생했습니다.');
      setCodes([]);
    } finally {
      setLoading(false);
    }
  };

  // 그룹 폼 데이터 초기화
  const resetGroupForm = () => {
    const nextLevel = selectedGroup?.level ? selectedGroup.level + 1 : 1;
    
    // 소분류(level 3) 이상으로는 생성 불가
    if (nextLevel > 3) {
      return;
    }
    
    setGroupFormData({
      groupName: '',
      level: nextLevel,
      parentGroupId: selectedGroup?.groupId || null,
      description: '',
      active: true,
      isProtected: false
    });
  };

  // 코드 폼 데이터 초기화
  const resetCodeForm = () => {
    setCodeFormData({
      codeName: '',
      sortOrder: codes.length + 1,
      description: '',
      active: true,
      isProtected: false
    });
  };

  // 그룹 다이얼로그 열기
  const handleOpenGroupDialog = (isEdit = false, group = null) => {
    // 소분류(level 3)에서는 더 이상 하위 그룹을 추가할 수 없음
    if (selectedGroup?.level === 3 && !isEdit) {
      return;
    }
    
    setIsEditMode(isEdit);
    if (isEdit && group) {
      const isProtected = isProtectedGroup(group.groupId);
      setGroupFormData({
        groupId: group.groupId,
        groupName: group.groupName,
        level: group.level,
        parentGroupId: group.parentGroupId,
        description: group.description || '',
        active: group.active,
        isProtected: isProtected
      });
    } else {
      resetGroupForm();
    }
    setGroupDialogOpen(true);
  };

  // 코드 다이얼로그 열기
  const handleOpenCodeDialog = (isEdit = false, code = null) => {
    if (!selectedGroup && !isEdit) {
      setError('코드를 추가할 그룹을 선택해주세요.');
      return;
    }
    
    setIsEditMode(isEdit);
    if (isEdit && code) {
      const isProtected = isProtectedCode(code.codeId);
      setCodeFormData({
        codeId: code.codeId,
        codeName: code.codeName,
        sortOrder: code.sortOrder || 0,
        description: code.description || '',
        active: code.active,
        isProtected: isProtected
      });
      setSelectedCode(code);
    } else {
      resetCodeForm();
    }
    setCodeDialogOpen(true);
  };

  // 그룹 확장/축소 토글
  const toggleGroupExpand = (groupId) => {
    if (expandedGroups.includes(groupId)) {
      setExpandedGroups(expandedGroups.filter(id => id !== groupId));
    } else {
      setExpandedGroups([...expandedGroups, groupId]);
    }
  };

  // 자식 그룹 수 계산
  const getChildCount = (groupId) => {
    return groups.filter(group => group.parentGroupId === groupId && group.active).length;
  };

  // 코드 수 계산
  const getCodeCount = (groupId) => {
    if (selectedGroup && selectedGroup.groupId === groupId) {
      return codes.filter(code => code.active).length;
    }
    return 0;
  };

  // 검색된 코드 그룹 필터링
  const filteredGroups = searchGroupText 
    ? groups.filter(group => 
        (group.groupName.toLowerCase().includes(searchGroupText.toLowerCase()) ||
        group.groupId.toLowerCase().includes(searchGroupText.toLowerCase())) &&
        group.active
      )
    : groups.filter(group => group.active);

  // 검색된 코드 필터링
  const filteredCodes = searchCodeText 
    ? codes.filter(code => 
        ((code.codeName && code.codeName.toLowerCase().includes(searchCodeText.toLowerCase())) ||
        (code.codeId && code.codeId.toLowerCase().includes(searchCodeText.toLowerCase()))) &&
        code.active
      )
    : codes.filter(code => code.active);

  // 그룹 생성
  const handleCreateGroup = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/codes/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupFormData)
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || '코드 그룹 생성에 실패했습니다.');
      }

      // 성공 시 그룹 목록 새로고침
      await fetchGroups();
      setGroupDialogOpen(false);
      resetGroupForm();
      setError(null);
    } catch (err) {
      console.error('Error creating code group:', err);
      setError(err.message || '코드 그룹 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 코드 생성
  const handleCreateCode = async () => {
    if (!selectedGroup) {
      setError('코드 그룹을 선택해주세요.');
      return;
    }

    const codeData = {
      ...codeFormData,
      sortOrder: parseInt(codeFormData.sortOrder, 10) || 0,
      groupId: selectedGroup.groupId
    };

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/codes/codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: codeData,
          attributes: []
        })
      });

      if (!response.ok) {
        throw new Error('코드 생성에 실패했습니다.');
      }

      // 성공 시 코드 목록 새로고침
      await fetchCodesByGroup(selectedGroup.groupId);
      setCodeDialogOpen(false);
      resetCodeForm();
      setError(null);
    } catch (err) {
      console.error('Error creating code:', err);
      setError('코드 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 그룹 폼 데이터 변경 핸들러
  const handleGroupFormChange = (e) => {
    const { name, value } = e.target;
    setGroupFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 코드 폼 데이터 변경 핸들러
  const handleCodeFormChange = (e) => {
    const { name, value } = e.target;
    setCodeFormData(prev => ({
      ...prev,
      [name]: name === 'sortOrder' ? parseInt(value, 10) || 0 : value
    }));
  };

  // 코드 수정
  const handleUpdateCode = async () => {
    if (!selectedCode) {
      setError('수정할 코드가 선택되지 않았습니다.');
      return;
    }

    // 보호된 코드인 경우, 코드명만 수정 가능
    const codeData = codeFormData.isProtected 
      ? { 
          groupId: selectedGroup.groupId,
          codeName: codeFormData.codeName
        }
      : {
          ...codeFormData,
          sortOrder: parseInt(codeFormData.sortOrder, 10) || 0,
          groupId: selectedGroup.groupId
        };

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/codes/codes/${selectedCode.codeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: codeData,
          attributes: []
        })
      });

      if (!response.ok) {
        throw new Error('코드 수정에 실패했습니다.');
      }

      // 성공 시 코드 목록 새로고침
      await fetchCodesByGroup(selectedGroup.groupId);
      setCodeDialogOpen(false);
      resetCodeForm();
      setError(null);
    } catch (err) {
      console.error('Error updating code:', err);
      setError('코드 수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 코드 테이블의 수정 버튼 핸들러
  const handleEditCode = (e, code) => {
    e.stopPropagation();
    handleOpenCodeDialog(true, code);
  };

  // 시스템에서 사용되는 보호된 코드인지 확인
  const isProtectedCode = (codeId) => {
    // 특정 코드만 보호
    const protectedCodes = [
      '001002_0001', '001002_0002', '001002_0003', '001002_0004', '001002_0005', '001002_0006',
      '007001_0001', '007001_0002', '007001_0003', '007001_0004', '007001_0005', '007001_0006', '007001_0007'
    ];
    return protectedCodes.includes(codeId);
  };

  // 시스템에서 사용되는 보호된 그룹인지 확인
  const isProtectedGroup = (groupId) => {
    // 특정 코드 그룹만 보호
    const protectedGroups = [
      '001', '001001', '001002', '001002001', '001003',
      '002', '003', '004', '005', '006', '007', '007001'
    ];
    return protectedGroups.includes(groupId);
  };

  // 그룹 수정
  const handleUpdateGroup = async () => {
    if (!groupFormData.groupId) {
      setError('수정할 그룹 정보가 올바르지 않습니다.');
      return;
    }

    // 보호된 그룹인 경우, 그룹명만 수정 가능
    const updateData = groupFormData.isProtected 
      ? { 
          groupId: groupFormData.groupId,
          groupName: groupFormData.groupName
        }
      : groupFormData;

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/codes/groups/${groupFormData.groupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '코드 그룹 수정에 실패했습니다.');
      }

      // 성공 시 그룹 목록 새로고침
      await fetchGroups();
      setGroupDialogOpen(false);
      resetGroupForm();
      setError(null);
    } catch (err) {
      console.error('Error updating code group:', err);
      setError(err.message || '코드 그룹 수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 그룹 수정 버튼 추가
  const renderGroupActions = (group) => {
    const isProtected = isProtectedGroup(group.groupId);
    
    return (
      <Box sx={{ ml: 'auto', display: 'flex' }}>
        <IconButton 
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenGroupDialog(true, group);
          }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
        <Tooltip title={isProtected ? "시스템에서 사용 중인 코드 그룹은 삭제할 수 없습니다" : ""}>
          <span>
            <IconButton 
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                openDeleteDialog('group', group);
              }}
              disabled={isProtected}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    );
  };

  // 코드 삭제
  const handleDeleteCode = async () => {
    if (!itemToDelete) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/codes/codes/${itemToDelete.codeId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '코드 삭제에 실패했습니다.');
      }

      // 성공 시 코드 목록 새로고침
      await fetchCodesByGroup(selectedGroup.groupId);
      setError(null);
    } catch (err) {
      console.error('Error deleting code:', err);
      setError(err.message || '코드 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  // 그룹 삭제
  const handleDeleteGroup = async () => {
    if (!itemToDelete) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/codes/groups/${itemToDelete.groupId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '코드 그룹 삭제에 실패했습니다.');
      }

      // 성공 시 그룹 목록 새로고침
      await fetchGroups();
      
      // 삭제한 그룹이 현재 선택된 그룹인 경우 선택 해제
      if (selectedGroup && selectedGroup.groupId === itemToDelete.groupId) {
        setSelectedGroup(null);
        setSelectedCode(null);
        setCodes([]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error deleting group:', err);
      setError(err.message || '코드 그룹 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  // 삭제 다이얼로그 열기
  const openDeleteDialog = (type, item) => {
    // 보호된 코드나 그룹은 삭제 다이얼로그를 열지 않음
    if ((type === 'code' && isProtectedCode(item.codeId)) || 
        (type === 'group' && isProtectedGroup(item.groupId))) {
      return;
    }
    
    setDeleteType(type);
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#F8F8FE', minHeight: '100vh' }}>
      {/* 상단 헤더 */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#3A3A3A' }}>
          코드 관리
        </Typography>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>
          <Link color="inherit" href="#" onClick={(e) => e.preventDefault()}>
            설정
          </Link>
          <Typography color="text.primary">코드 관리</Typography>
        </Breadcrumbs>
      </Box>

      {/* 검색 영역 */}
      <Paper sx={{ 
        p: 2, 
        mb: 2, 
        borderRadius: 2,
        boxShadow: 'none',
        border: '1px solid #EEEEEE'
      }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="코드 그룹"
              placeholder="코드 그룹 검색"
              value={searchGroupText}
              onChange={(e) => setSearchGroupText(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="코드명"
              placeholder="코드명 검색"
              value={searchCodeText}
              onChange={(e) => setSearchCodeText(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>사용 여부</InputLabel>
              <Select
                label="사용 여부"
                defaultValue=""
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value={true}>사용</MenuItem>
                <MenuItem value={false}>미사용</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button 
              variant="contained" 
              sx={{ 
                mr: 1,
                backgroundColor: '#3182F6',
                '&:hover': {
                  backgroundColor: '#1B64DA'
                }
              }}
            >
              검색
            </Button>
            <Button 
              variant="outlined"
              onClick={() => {
                setSearchGroupText('');
                setSearchCodeText('');
              }}
            >
              초기화
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 메인 컨텐츠 */}
      <Grid container spacing={2} sx={{ height: 'calc(100vh - 200px)' }}>
        {/* 좌측 트리 뷰 (코드 그룹) */}
        <Grid item xs={12} md={4} sx={{ height: '100%' }}>
          <Paper sx={{ 
            borderRadius: 2,
            boxShadow: 'none',
            border: '1px solid #EEEEEE',
            height: '100%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box sx={{ 
              p: 2, 
              borderBottom: '1px solid #EEEEEE', 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#fff'
            }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                코드 그룹 ({groups.filter(g => g.level === 1).length})
              </Typography>
              <Box>
                {(!selectedGroup || selectedGroup.level < 3) && (
                  <Tooltip title="하위 그룹 추가">
                    <IconButton 
                      sx={{ 
                        mr: 1,
                        color: '#3182F6',
                        '&:hover': {
                          backgroundColor: 'rgba(49, 130, 246, 0.04)'
                        }
                      }}
                      size="small"
                      onClick={() => handleOpenGroupDialog(false)}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {selectedGroup && (
                  <>
                    <Tooltip title="그룹 수정">
                      <IconButton 
                        size="small"
                        onClick={() => handleOpenGroupDialog(true, selectedGroup)}
                        sx={{ 
                          mr: 1,
                          color: '#3182F6',
                          '&:hover': {
                            backgroundColor: 'rgba(49, 130, 246, 0.04)'
                          }
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="그룹 삭제">
                      <IconButton 
                        size="small"
                        color="error"
                        onClick={() => openDeleteDialog('group', selectedGroup)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Box>
            </Box>
            
            <Box sx={{ 
              flexGrow: 1, 
              overflow: 'auto',
              p: 1,
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#E8E8E8',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: '#D1D1D1',
              },
            }}>
              {loading && groups.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress size={30} />
                </Box>
              ) : (
                /* 대분류 목록 */
                filteredGroups.filter(group => group.level === 1).map(mainGroup => {
                  const isMainExpanded = expandedGroups.includes(mainGroup.groupId);
                  
                  return (
                    <Box key={mainGroup.groupId}>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          p: 1.5,
                          backgroundColor: selectedGroup?.groupId === mainGroup.groupId ? '#f5f5f5' : 'transparent',
                          '&:hover': { backgroundColor: '#f9f9f9' },
                          cursor: 'pointer',
                          borderRadius: 1
                        }}
                        onClick={() => handleGroupSelect(mainGroup)}
                      >
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleGroupExpand(mainGroup.groupId);
                          }}
                          sx={{ mr: 1 }}
                        >
                          {isMainExpanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
                        </IconButton>
                        <FolderIcon 
                          sx={{ 
                            mr: 1, 
                            fontSize: 20,
                            color: '#3182F6'
                          }} 
                        />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {mainGroup.groupName}
                            <Chip 
                              size="small" 
                              label={`하위그룹 ${getChildCount(mainGroup.groupId)}`} 
                              color="default" 
                              variant="outlined"
                              sx={{ height: 20 }}
                            />
                            <Tooltip title="클릭하여 코드 목록 보기" arrow>
                              <ListAltIcon 
                                sx={{ 
                                  fontSize: 16,
                                  color: selectedGroup?.groupId === mainGroup.groupId ? '#3182F6' : '#9E9E9E',
                                  opacity: 0.7
                                }} 
                              />
                            </Tooltip>
                          </Typography>
                        </Box>
                      </Box>
                      
                      {/* 중분류 목록 */}
                      {isMainExpanded && (
                        <Box sx={{ pl: 4 }}>
                          {filteredGroups.filter(group => group.parentGroupId === mainGroup.groupId).map(subGroup => {
                            const isSubExpanded = expandedGroups.includes(subGroup.groupId);
                            const hasChildren = getChildCount(subGroup.groupId) > 0;
                            
                            return (
                              <Box 
                                key={subGroup.groupId}
                              >
                                <Box
                                  sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    p: 1.5,
                                    backgroundColor: selectedGroup?.groupId === subGroup.groupId ? '#f5f5f5' : 'transparent',
                                    '&:hover': { backgroundColor: '#f9f9f9' },
                                    cursor: 'pointer',
                                    borderRadius: 1
                                  }}
                                  onClick={() => handleGroupSelect(subGroup)}
                                >
                                  <IconButton 
                                    size="small" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleGroupExpand(subGroup.groupId);
                                    }}
                                    sx={{ mr: 1 }}
                                    disabled={!hasChildren}
                                  >
                                    {isSubExpanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
                                  </IconButton>
                                  <FolderIcon 
                                    sx={{ 
                                      mr: 1, 
                                      fontSize: 18,
                                      color: hasChildren ? '#3182F6' : '#9E9E9E'
                                    }} 
                                  />
                                  <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      {subGroup.groupName}
                                      {hasChildren && (
                                        <Chip 
                                          size="small" 
                                          label={`하위그룹 ${getChildCount(subGroup.groupId)}`} 
                                          color="default" 
                                          variant="outlined"
                                          sx={{ height: 20 }}
                                        />
                                      )}
                                      <Tooltip title="클릭하여 코드 목록 보기" arrow>
                                        <ListAltIcon 
                                          sx={{ 
                                            fontSize: 16,
                                            color: selectedGroup?.groupId === subGroup.groupId ? '#3182F6' : '#9E9E9E',
                                            opacity: 0.7
                                          }} 
                                        />
                                      </Tooltip>
                                    </Typography>
                                  </Box>
                                </Box>

                                {/* 소분류 목록 */}
                                {isSubExpanded && (
                                  <Box sx={{ pl: 4 }}>
                                    {filteredGroups.filter(group => group.parentGroupId === subGroup.groupId).map(detailGroup => (
                                      <Box 
                                        key={detailGroup.groupId}
                                        sx={{ 
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          p: 1.5,
                                          backgroundColor: selectedGroup?.groupId === detailGroup.groupId ? '#f5f5f5' : 'transparent',
                                          '&:hover': { backgroundColor: '#f9f9f9' },
                                          cursor: 'pointer',
                                          borderRadius: 1
                                        }}
                                        onClick={() => handleGroupSelect(detailGroup)}
                                      >
                                        <FolderIcon 
                                          sx={{ 
                                            mr: 1, 
                                            fontSize: 16,
                                            color: '#9E9E9E',
                                            ml: 3
                                          }}
                                        />
                                        <Box sx={{ flexGrow: 1 }}>
                                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {detailGroup.groupName}
                                            <Tooltip title="클릭하여 코드 목록 보기" arrow>
                                              <ListAltIcon 
                                                sx={{ 
                                                  fontSize: 16,
                                                  color: selectedGroup?.groupId === detailGroup.groupId ? '#3182F6' : '#9E9E9E',
                                                  opacity: 0.7
                                                }} 
                                              />
                                            </Tooltip>
                                          </Typography>
                                        </Box>
                                      </Box>
                                    ))}
                                  </Box>
                                )}
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                    </Box>
                  );
                })
              )}
            </Box>
          </Paper>
        </Grid>

        {/* 우측 영역 (코드 목록) */}
        <Grid item xs={12} md={8} sx={{ height: '100%' }}>
          <Paper sx={{ 
            borderRadius: 2,
            boxShadow: 'none',
            border: '1px solid #EEEEEE',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box sx={{ 
              p: 2, 
              borderBottom: '1px solid #EEEEEE', 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#fff'
            }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {selectedGroup ? `${selectedGroup.groupName} 코드 목록 (${filteredCodes.length})` : '코드 목록'}
              </Typography>
              <Box>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenCodeDialog(false)}
                  disabled={!selectedGroup}
                  size="small"
                  sx={{ 
                    mr: 1,
                    color: '#3182F6',
                    '&:hover': {
                      backgroundColor: 'rgba(49, 130, 246, 0.04)'
                    }
                  }}
                >
                  코드 추가
                </Button>
              </Box>
            </Box>
            
            {selectedGroup ? (
              <TableContainer sx={{ 
                flexGrow: 1, 
                overflow: 'auto',
                '&::-webkit-scrollbar': {
                  width: '8px',
                  height: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f1f1',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#888',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: '#555',
                },
              }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress size={30} />
                  </Box>
                ) : (
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell width="5%">No.</TableCell>
                        <TableCell width="15%">코드 ID</TableCell>
                        <TableCell width="25%">코드명</TableCell>
                        <TableCell width="15%">정렬 순서</TableCell>
                        <TableCell width="10%">사용 여부</TableCell>
                        <TableCell width="15%">등록일</TableCell>
                        <TableCell width="10%">관리</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredCodes.length > 0 ? (
                        filteredCodes.map((code, index) => (
                          <TableRow 
                            key={code.codeId}
                            hover
                            selected={selectedCode?.codeId === code.codeId}
                            onClick={() => handleCodeSelect(code)}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                              {code.codeId}
                              {isProtectedCode(code.codeId) && (
                                <Chip 
                                  size="small" 
                                  label="보호됨" 
                                  color="primary" 
                                  variant="outlined"
                                  sx={{ height: 18, ml: 1, fontSize: '0.7rem' }}
                                />
                              )}
                            </TableCell>
                            <TableCell>{code.codeName}</TableCell>
                            <TableCell>{code.sortOrder || '-'}</TableCell>
                            <TableCell>{code.active ? '사용' : '미사용'}</TableCell>
                            <TableCell>{code.createdAt ? new Date(code.createdAt).toLocaleDateString() : '-'}</TableCell>
                            <TableCell>
                              <IconButton 
                                size="small" 
                                sx={{ 
                                  mr: 0.5,
                                  color: '#3182F6',
                                  '&:hover': {
                                    backgroundColor: 'rgba(49, 130, 246, 0.04)'
                                  }
                                }}
                                onClick={(e) => handleEditCode(e, code)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <Tooltip title={isProtectedCode(code.codeId) ? "시스템에서 사용 중인 코드는 삭제할 수 없습니다" : ""}>
                                <span>
                                  <IconButton 
                                    size="small" 
                                    sx={{ 
                                      color: '#FF4D4D',
                                      '&:hover': {
                                        backgroundColor: 'rgba(255, 77, 77, 0.04)'
                                      }
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openDeleteDialog('code', code);
                                    }}
                                    disabled={isProtectedCode(code.codeId)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            등록된 코드가 없습니다.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </TableContainer>
            ) : (
              <Box sx={{ 
                p: 3, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexGrow: 1
              }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  좌측에서 코드 그룹을 선택하면 코드 목록이 표시됩니다.
                </Typography>
                <ChevronRightIcon sx={{ fontSize: 40, color: '#cccccc' }} />
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* 그룹 추가/수정 다이얼로그 */}
      <Dialog 
        open={groupDialogOpen} 
        onClose={() => setGroupDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '8px',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid #F0F0F0', 
          py: 2, 
          px: 3, 
          fontSize: '1rem', 
          fontWeight: 600 
        }}>
          {isEditMode ? '코드 그룹 수정' : '코드 그룹 추가'}
          {groupFormData.isProtected && (
            <Chip 
              size="small" 
              label="보호됨" 
              color="primary" 
              variant="outlined"
              sx={{ height: 20, ml: 1, fontSize: '0.75rem' }}
            />
          )}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {groupFormData.isProtected && (
            <Alert severity="info" sx={{ mb: 2 }}>
              이 코드 그룹은 시스템에서 사용 중이므로 그룹명만 수정할 수 있습니다.
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth sx={{ mt: 2 }} disabled={groupFormData.isProtected}>
                <InputLabel>그룹 레벨</InputLabel>
                <Select
                  name="level"
                  label="그룹 레벨"
                  value={groupFormData.level}
                  onChange={handleGroupFormChange}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#E0E0E0',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#BDBDBD',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3182F6',
                    },
                  }}
                >
                  <MenuItem value={1}>대분류</MenuItem>
                  <MenuItem value={2}>중분류</MenuItem>
                  <MenuItem value={3}>소분류</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {groupFormData.level > 1 && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>상위 그룹</InputLabel>
                  <Select
                    name="parentGroupId"
                    label="상위 그룹"
                    value={groupFormData.parentGroupId || ''}
                    onChange={handleGroupFormChange}
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#E0E0E0',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#BDBDBD',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#3182F6',
                      },
                    }}
                  >
                    {groups
                      .filter(g => g.level === groupFormData.level - 1)
                      .map(group => (
                        <MenuItem key={group.groupId} value={group.groupId}>
                          {group.groupName}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                name="groupName"
                label="그룹명"
                fullWidth
                required
                value={groupFormData.groupName}
                onChange={handleGroupFormChange}
                placeholder="그룹명을 입력하세요"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#E0E0E0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#BDBDBD',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3182F6',
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="설명"
                fullWidth
                multiline
                rows={3}
                value={groupFormData.description}
                onChange={handleGroupFormChange}
                placeholder="그룹에 대한 설명을 입력하세요"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#E0E0E0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#BDBDBD',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3182F6',
                    },
                  },
                }}
                disabled={groupFormData.isProtected}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth disabled={groupFormData.isProtected}>
                <InputLabel>사용 여부</InputLabel>
                <Select
                  name="active"
                  label="사용 여부"
                  value={groupFormData.active}
                  onChange={handleGroupFormChange}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#E0E0E0',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#BDBDBD',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3182F6',
                    },
                  }}
                >
                  <MenuItem value={true}>사용</MenuItem>
                  <MenuItem value={false}>미사용</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #F0F0F0', justifyContent: 'flex-end' }}>
          <Button 
            onClick={() => setGroupDialogOpen(false)}
            sx={{ 
              color: '#666',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
              fontWeight: 500,
              px: 2
            }}
          >
            취소
          </Button>
          <Button 
            variant="contained"
            onClick={isEditMode ? handleUpdateGroup : handleCreateGroup}
            disabled={loading || !groupFormData.groupName}
            sx={{ 
              bgcolor: '#3182F6', 
              '&:hover': {
                bgcolor: '#1565C0',
              },
              '&.Mui-disabled': {
                bgcolor: 'rgba(49, 130, 246, 0.3)',
              },
              fontWeight: 500,
              boxShadow: 'none',
              px: 2
            }}
          >
            {loading ? '처리중...' : '저장'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 코드 추가/수정 다이얼로그 */}
      <Dialog 
        open={codeDialogOpen} 
        onClose={() => setCodeDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '8px',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid #F0F0F0', 
          py: 2, 
          px: 3, 
          fontSize: '1rem', 
          fontWeight: 600 
        }}>
          {isEditMode ? '코드 수정' : '코드 추가'}
          {codeFormData.isProtected && (
            <Chip 
              size="small" 
              label="보호됨" 
              color="primary" 
              variant="outlined"
              sx={{ height: 20, ml: 1, fontSize: '0.75rem' }}
            />
          )}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {codeFormData.isProtected && (
            <Alert severity="info" sx={{ mb: 2 }}>
              이 코드는 시스템에서 사용 중이므로 코드명만 수정할 수 있습니다.
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth disabled sx={{ mt: 2 }}>
                <InputLabel>코드 그룹</InputLabel>
                <Select
                  label="코드 그룹"
                  value={selectedGroup?.groupId || ''}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#E0E0E0',
                    },
                  }}
                >
                  <MenuItem value={selectedGroup?.groupId || ''}>
                    {selectedGroup?.groupName || ''}
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="codeName"
                label="코드명"
                fullWidth
                required
                value={codeFormData.codeName}
                onChange={handleCodeFormChange}
                placeholder="코드명을 입력하세요"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#E0E0E0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#BDBDBD',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3182F6',
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="sortOrder"
                label="정렬 순서"
                fullWidth
                type="number"
                value={codeFormData.sortOrder}
                onChange={handleCodeFormChange}
                placeholder="정렬 순서를 입력하세요"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#E0E0E0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#BDBDBD',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3182F6',
                    },
                  },
                }}
                disabled={codeFormData.isProtected}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={codeFormData.isProtected}>
                <InputLabel>사용 여부</InputLabel>
                <Select
                  name="active"
                  label="사용 여부"
                  value={codeFormData.active}
                  onChange={handleCodeFormChange}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#E0E0E0',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#BDBDBD',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3182F6',
                    },
                  }}
                >
                  <MenuItem value={true}>사용</MenuItem>
                  <MenuItem value={false}>미사용</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="설명"
                fullWidth
                multiline
                rows={3}
                value={codeFormData.description}
                onChange={handleCodeFormChange}
                placeholder="코드에 대한 설명을 입력하세요"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#E0E0E0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#BDBDBD',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3182F6',
                    },
                  },
                }}
                disabled={codeFormData.isProtected}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #F0F0F0', justifyContent: 'flex-end' }}>
          <Button 
            onClick={() => setCodeDialogOpen(false)}
            sx={{ 
              color: '#666',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
              fontWeight: 500,
              px: 2
            }}
          >
            취소
          </Button>
          <Button 
            variant="contained"
            onClick={isEditMode ? handleUpdateCode : handleCreateCode}
            disabled={loading || !codeFormData.codeName}
            sx={{ 
              bgcolor: '#3182F6', 
              '&:hover': {
                bgcolor: '#1565C0',
              },
              '&.Mui-disabled': {
                bgcolor: 'rgba(49, 130, 246, 0.3)',
              },
              fontWeight: 500,
              boxShadow: 'none',
              px: 2
            }}
          >
            {loading ? '처리중...' : '저장'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '8px',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid #F0F0F0', 
          py: 2, 
          px: 3, 
          fontSize: '1rem', 
          fontWeight: 600 
        }}>
          {deleteType === 'code' ? '코드 삭제' : '코드 그룹 삭제'}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" sx={{ color: '#505050', mt: 1 }}>
            {deleteType === 'code' 
              ? `"${itemToDelete?.codeName}" 코드를 삭제하시겠습니까?`
              : `"${itemToDelete?.groupName}" 그룹을 삭제하시겠습니까?`
            }
          </Typography>
          {deleteType === 'group' && (
            <Alert severity="warning" sx={{ mt: 2, backgroundColor: 'rgba(255, 152, 0, 0.08)', border: 'none' }}>
              이 그룹에 속한 모든 코드와 하위 그룹이 비활성화됩니다.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #F0F0F0', justifyContent: 'flex-end' }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ 
              color: '#666',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
              fontWeight: 500,
              px: 2
            }}
          >
            취소
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={deleteType === 'code' ? handleDeleteCode : handleDeleteGroup}
            disabled={loading}
            sx={{ 
              bgcolor: '#3182F6', 
              '&:hover': {
                bgcolor: '#1565C0',
              },
              '&.Mui-disabled': {
                bgcolor: 'rgba(49, 130, 246, 0.3)',
              },
              fontWeight: 500,
              boxShadow: 'none',
              px: 2
            }}
          >
            {loading ? '처리중...' : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CodeManagement; 