import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Button,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Chip,
  Breadcrumbs,
  Link,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Construction as ConstructionIcon } from '@mui/icons-material';

const PermissionManagement = () => {
  // 상태 관리
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedRole, setSelectedRole] = useState('USER');

  // 메뉴 카테고리와 항목들
  const menuCategories = [
    {
      id: 'contract',
      name: '계약',
      items: [
        { id: 'home', name: '홈' },
        { id: 'contract_management', name: '계약 관리' },
        { id: 'contract_template', name: '계약서 템플릿' },
        { id: 'contract_upload', name: '계약서 등록' },
        { id: 'contract_create', name: '계약 생성' },
      ]
    },
    {
      id: 'facility',
      name: '시설물',
      items: [
        { id: 'facility_list', name: '시설물 리스트' },
        { id: 'facility_register', name: '시설물 등록' },
        { id: 'facility_service', name: 'A/S 관리' },
        { id: 'facility_dashboard', name: '시설물 대시보드' },
      ]
    },
    {
      id: 'community',
      name: '커뮤니티',
      items: [
        { id: 'board', name: '게시판' },
        { id: 'notice', name: '공지사항' },
        { id: 'file', name: '자료실' },
        { id: 'chat', name: '채팅' },
      ]
    },
    {
      id: 'admin',
      name: '관리',
      items: [
        { id: 'company', name: '위수탁 업체 관리' },
        { id: 'user', name: '사용자 관리' },
        { id: 'settings', name: '설정' },
      ]
    }
  ];

  // 역할 리스트
  const roles = [
    { id: 'ADMIN', name: '관리자' },
    { id: 'MANAGER', name: '업체담당자' },
    { id: 'USER', name: '사용자' }
  ];

  // 권한 초기화 - 서버에서 데이터를 받아오기 전까지의 기본값
  const defaultPermissions = {
    ADMIN: {
      contract: { all: true, items: { home: true, contract_management: true, contract_template: true, contract_upload: true, contract_create: true } },
      facility: { all: true, items: { facility_list: true, facility_register: true, facility_service: true, facility_dashboard: true } },
      community: { all: true, items: { board: true, notice: true, file: true, chat: true } },
      admin: { all: true, items: { company: true, user: true, settings: true } }
    },
    MANAGER: {
      contract: { all: true, items: { home: true, contract_management: true, contract_template: true, contract_upload: true, contract_create: true } },
      facility: { all: true, items: { facility_list: true, facility_register: true, facility_service: true, facility_dashboard: true } },
      community: { all: true, items: { board: true, notice: true, file: true, chat: true } },
      admin: { all: false, items: { company: false, user: false, settings: false } }
    },
    USER: {
      contract: { all: true, items: { home: true, contract_management: true, contract_template: true, contract_upload: true, contract_create: true } }, 
      facility: { all: true, items: { facility_list: true, facility_register: true, facility_service: true, facility_dashboard: true } },
      community: { all: true, items: { board: true, notice: true, file: true, chat: true } },
      admin: { all: false, items: { company: false, user: false, settings: false } }
    }
  };

  // 서버에서 권한 데이터 가져오기
  const fetchPermissions = async () => {
    setLoading(true);
    try {
      // 실제 API 호출
      // const response = await fetch('http://localhost:8080/api/permissions');
      // if (!response.ok) {
      //   throw new Error('권한 데이터를 불러오는데 실패했습니다.');
      // }
      // const data = await response.json();
      // setPermissions(data);

      // API가 아직 없으므로 기본값 사용
      setPermissions(defaultPermissions);
      setError(null);
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setError('권한 데이터를 불러오는데 문제가 발생했습니다.');
      setPermissions(defaultPermissions); // 에러 시 기본값 사용
    } finally {
      setLoading(false);
    }
  };

  // 서버에 권한 데이터 저장하기
  const savePermissions = async () => {
    setSaving(true);
    try {
      // 실제 API 호출
      // const response = await fetch('http://localhost:8080/api/permissions', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(permissions)
      // });
      
      // if (!response.ok) {
      //   throw new Error('권한 설정을 저장하는데 실패했습니다.');
      // }
      
      // 현재는 API가 없으므로 저장 성공 메시지만 표시
      setSuccess('권한 설정이 저장되었습니다.');
      setError(null);
      
      // 3초 후 성공 메시지 숨기기
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error saving permissions:', err);
      setError('권한 설정을 저장하는데 문제가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 권한 모두 선택/해제 핸들러
  const handleToggleAll = (category) => {
    const updatedPermissions = { ...permissions };
    const currentValue = !updatedPermissions[selectedRole][category].all;
    
    updatedPermissions[selectedRole][category].all = currentValue;
    
    // 하위 항목들도 모두 같은 값으로 변경
    Object.keys(updatedPermissions[selectedRole][category].items).forEach(item => {
      updatedPermissions[selectedRole][category].items[item] = currentValue;
    });
    
    setPermissions(updatedPermissions);
  };

  // 개별 권한 선택/해제 핸들러
  const handleToggleItem = (category, item) => {
    const updatedPermissions = { ...permissions };
    updatedPermissions[selectedRole][category].items[item] = !updatedPermissions[selectedRole][category].items[item];
    
    // 모든 항목이 선택되었는지 확인하여 'all' 값 업데이트
    const allChecked = Object.values(updatedPermissions[selectedRole][category].items).every(v => v === true);
    updatedPermissions[selectedRole][category].all = allChecked;
    
    setPermissions(updatedPermissions);
  };

  // 역할 변경 핸들러
  const handleRoleChange = (event) => {
    setSelectedRole(event.target.value);
  };

  // 컴포넌트 마운트 시 권한 데이터 가져오기
  useEffect(() => {
    fetchPermissions();
  }, []);

  return (
    <Box sx={{ p: 3, backgroundColor: '#F8F8FE', minHeight: '100vh' }}>
      {/* 상단 헤더 */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#3A3A3A' }}>
          권한 관리
        </Typography>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>
          <Link color="inherit" href="/settings" onClick={(e) => { e.preventDefault(); window.location.href = '/settings'; }}>
            설정
          </Link>
          <Typography color="text.primary">권한 관리</Typography>
        </Breadcrumbs>
      </Box>

      {/* 역할 선택 영역 */}
      <Paper sx={{ 
        p: 2, 
        mb: 2, 
        borderRadius: 2,
        boxShadow: 'none',
        border: '1px solid #EEEEEE' 
      }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="role-select-label">역할</InputLabel>
          <Select
            labelId="role-select-label"
            id="role-select"
            value={selectedRole}
            label="역할"
            onChange={handleRoleChange}
          >
            {roles.map((role) => (
              <MenuItem key={role.id} value={role.id}>
                {role.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* 에러/성공 메시지 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* 권한 테이블 */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ 
            borderRadius: 2,
            boxShadow: 'none',
            border: '1px solid #EEEEEE',
            mb: 2
          }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#F8F8FE' }}>
                  <TableCell width="20%">메뉴 카테고리</TableCell>
                  <TableCell width="20%">전체 선택</TableCell>
                  <TableCell>메뉴 항목</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {menuCategories.map((category) => (
                  <React.Fragment key={category.id}>
                    <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        {category.name}
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={permissions[selectedRole]?.[category.id]?.all || false}
                          onChange={() => handleToggleAll(category.id)}
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {category.items.map((item) => (
                            <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', mr: 2, mb: 1 }}>
                              <Checkbox
                                checked={permissions[selectedRole]?.[category.id]?.items?.[item.id] || false}
                                onChange={() => handleToggleItem(category.id, item.id)}
                                color="primary"
                                size="small"
                              />
                              <Typography variant="body2">{item.name}</Typography>
                            </Box>
                          ))}
                        </Box>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* 저장 버튼 */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={savePermissions}
              disabled={saving}
              sx={{ 
                px: 4,
                backgroundColor: '#3182F6',
                '&:hover': {
                  backgroundColor: '#1B64DA'
                }
              }}
            >
              {saving ? '저장 중...' : '저장'}
            </Button>
          </Box>
        </>
      )}

      {/* 안내 메시지 */}
      <Paper sx={{ mt: 3, p: 3, borderRadius: 2, boxShadow: 'none', border: '1px solid #EEEEEE' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#3A3A3A', mb: 2 }}>
          권한 관리 안내
        </Typography>
        <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
          • 각 사용자 역할별로 접근 가능한 메뉴를 설정할 수 있습니다.
        </Typography>
        <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
          • 메뉴 카테고리의 전체 선택을 체크하면 해당 카테고리의 모든 메뉴에 접근 권한이 부여됩니다.
        </Typography>
        <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
          • 권한 변경 후 반드시 저장 버튼을 클릭해야 변경사항이 적용됩니다.
        </Typography>
        <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
          • 변경된 권한은 사용자가 다시 로그인할 때 적용됩니다.
        </Typography>
      </Paper>
    </Box>
  );
};

export default PermissionManagement; 