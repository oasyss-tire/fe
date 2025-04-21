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
  const [roles, setRoles] = useState([]);
  const [allMenus, setAllMenus] = useState([]);
  const [menuCategories, setMenuCategories] = useState([]);

  // 서버에서 모든 메뉴 목록 가져오기
  const fetchAllMenus = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/menu-permissions/all-menus', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('메뉴 목록을 불러오는데 실패했습니다.');
      }

      const menus = await response.json();
      setAllMenus(menus);

      // 메뉴 카테고리별로 그룹화
      const categories = {};
      menus.forEach(menu => {
        if (!categories[menu.category]) {
          categories[menu.category] = {
            id: menu.category.toLowerCase().replace(/\s+/g, '_'),
            name: menu.category,
            items: []
          };
        }
        
        categories[menu.category].items.push({
          id: menu.id,
          name: menu.name,
          path: menu.path,
          icon: menu.icon
        });
      });

      // 정렬된 카테고리 배열로 변환
      const categoriesArray = Object.values(categories).sort((a, b) => 
        a.name.localeCompare(b.name)
      );
      
      // 원하는 카테고리 순서로 재정렬
      const categoryOrder = {
        '계약 메뉴': 1,
        '시설물 메뉴': 2,
        '커뮤니티 메뉴': 3,
        '관리 메뉴': 4
      };
      
      // 순서에 따라 재정렬
      categoriesArray.sort((a, b) => {
        const orderA = categoryOrder[a.name] || 999;
        const orderB = categoryOrder[b.name] || 999;
        return orderA - orderB;
      });
      
      setMenuCategories(categoriesArray);
      setError(null);
    } catch (err) {
      console.error('Error fetching menus:', err);
      setError('메뉴 목록을 불러오는데 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 서버에서 역할 목록 가져오기
  const fetchRoles = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/menu-permissions/roles', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('역할 목록을 불러오는데 실패했습니다.');
      }

      const rolesList = await response.json();
      setRoles(rolesList.map(role => ({ 
        id: role, 
        name: getRoleName(role)
      })));
    } catch (err) {
      console.error('Error fetching roles:', err);
      setError('역할 목록을 불러오는데 문제가 발생했습니다.');
    }
  };

  // 역할명 반환 함수
  const getRoleName = (roleId) => {
    switch (roleId) {
      case 'ADMIN': return '관리자';
      case 'MANAGER': return '위수탁업체 담당자';
      case 'USER': return '위수탁업체 사용자';
      default: return roleId;
    }
  };

  // 특정 역할의 메뉴 권한 가져오기
  const fetchRolePermissions = async (roleId) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/menu-permissions/role/${roleId}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`${getRoleName(roleId)} 역할의 권한을 불러오는데 실패했습니다.`);
      }

      const data = await response.json();
      setPermissions(data);
      setError(null);
    } catch (err) {
      console.error(`Error fetching permissions for role ${roleId}:`, err);
      setError(`${getRoleName(roleId)} 역할의 권한을 불러오는데 문제가 발생했습니다.`);
    } finally {
      setLoading(false);
    }
  };

  // 역할의 메뉴 권한 저장하기
  const saveRolePermissions = async () => {
    setSaving(true);
    try {
      const response = await fetch(`http://localhost:8080/api/menu-permissions/role/${selectedRole}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify(permissions)
      });
      
      if (!response.ok) {
        throw new Error('권한 설정을 저장하는데 실패했습니다.');
      }
      
      const result = await response.json();
      setSuccess('권한 설정이 성공적으로 저장되었습니다.');
      setError(null);
      
      // alert 알림으로 변경
      alert('권한 설정이 성공적으로 저장되었습니다.');
    } catch (err) {
      console.error('Error saving permissions:', err);
      setError('권한 설정을 저장하는데 문제가 발생했습니다.');
      alert('권한 설정을 저장하는데 문제가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 특정 카테고리의 모든 메뉴 권한 한번에 변경
  const handleToggleCategory = (category) => {
    if (!permissions) return;
    
    const categoryMenus = allMenus.filter(menu => menu.category === category.name);
    const categoryMenuIds = categoryMenus.map(menu => menu.id);
    
    // 현재 카테고리 내 메뉴들의 권한 상태 확인
    const allChecked = categoryMenuIds.every(menuId => permissions[menuId] === true);
    
    // 반대 상태로 모두 변경
    const newValue = !allChecked;
    const updatedPermissions = { ...permissions };
    
    categoryMenuIds.forEach(menuId => {
      updatedPermissions[menuId] = newValue;
    });
    
    setPermissions(updatedPermissions);
  };

  // 개별 메뉴 권한 변경
  const handleToggleMenu = (menuId) => {
    if (!permissions) return;
    
    const updatedPermissions = { ...permissions };
    updatedPermissions[menuId] = !updatedPermissions[menuId];
    
    setPermissions(updatedPermissions);
  };

  // 역할 변경 핸들러
  const handleRoleChange = (event) => {
    const newRole = event.target.value;
    setSelectedRole(newRole);
    fetchRolePermissions(newRole);
  };

  // 코드 ID에서 카테고리 추출 (예: 008001001_0001 -> 계약)
  const getCategoryFromMenuId = (menuId) => {
    const prefix = menuId.split('_')[0];
    if (prefix.startsWith('008001001')) return '계약';
    if (prefix.startsWith('008001002')) return '시설물';
    if (prefix.startsWith('008001003')) return '관리';
    if (prefix.startsWith('008001004')) return '커뮤니티';
    return '기타';
  };

  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchRoles();
      await fetchAllMenus();
      // 초기 선택된 역할의 권한 정보 로드
      if (selectedRole) {
        await fetchRolePermissions(selectedRole);
      }
    };

    loadInitialData();
  }, []);

  // 카테고리 내 모든 메뉴가 선택되었는지 확인
  const isCategoryFullyChecked = (category) => {
    if (!permissions || !allMenus) return false;
    
    const categoryMenus = allMenus.filter(menu => menu.category === category.name);
    return categoryMenus.every(menu => permissions[menu.id] === true);
  };

  // 카테고리 내 일부 메뉴가 선택되었는지 확인
  const isCategoryPartiallyChecked = (category) => {
    if (!permissions || !allMenus) return false;
    
    const categoryMenus = allMenus.filter(menu => menu.category === category.name);
    const checkedCount = categoryMenus.filter(menu => permissions[menu.id] === true).length;
    
    return checkedCount > 0 && checkedCount < categoryMenus.length;
  };

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
            disabled={loading || saving}
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

      {/* 관리자 권한 안내 메시지 */}
      {selectedRole === 'ADMIN' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          관리자 권한은 모든 메뉴에 접근 가능하며, 권한을 수정할 수 없습니다.
        </Alert>
      )}

      {/* 권한 설정 테이블 */}
      <Paper sx={{ 
        borderRadius: 2,
        boxShadow: 'none',
        border: '1px solid #EEEEEE',
        overflow: 'hidden'
      }}>
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress size={40} />
            <Typography variant="body2" sx={{ mt: 2, color: '#666' }}>
              권한 정보를 불러오는 중...
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#F8F9FA' }}>
                <TableRow>
                  <TableCell sx={{ width: '30%', fontWeight: 600 }}>
                    메뉴 카테고리
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>
                    접근 권한
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {menuCategories.map((category) => {
                  const categoryMenus = allMenus.filter(menu => menu.category === category.name);
                  
                  return (
                    <React.Fragment key={category.id}>
                      <TableRow sx={{ bgcolor: '#F8F9FA' }}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Checkbox 
                              checked={isCategoryFullyChecked(category)}
                              indeterminate={isCategoryPartiallyChecked(category)}
                              onChange={() => handleToggleCategory(category)}
                              disabled={saving || selectedRole === 'ADMIN'}
                            />
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {category.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {selectedRole === 'ADMIN' ? '모든 권한 허용 (수정 불가)' : 
                              isCategoryFullyChecked(category) 
                                ? '모든 권한 허용' 
                                : isCategoryPartiallyChecked(category) 
                                  ? '일부 권한 허용' 
                                  : '권한 없음'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                      
                      {/* 각 메뉴 항목 */}
                      {categoryMenus.map((menu) => (
                        <TableRow key={menu.id} sx={{ '&:hover': { bgcolor: '#F8F9FA' } }}>
                          <TableCell sx={{ pl: 5 }}>
                            <Typography variant="body2">{menu.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {menu.path}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Checkbox 
                                checked={selectedRole === 'ADMIN' ? true : permissions[menu.id] === true}
                                onChange={() => handleToggleMenu(menu.id)}
                                disabled={saving || selectedRole === 'ADMIN'}
                              />
                              <Typography variant="body2">
                                {selectedRole === 'ADMIN' ? '접근 허용 (수정 불가)' : 
                                  permissions[menu.id] === true ? '접근 허용' : '접근 불가'}
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        {/* 저장 버튼 */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #EEEEEE' }}>
          <Button 
            variant="contained" 
            onClick={saveRolePermissions}
            disabled={loading || saving || selectedRole === 'ADMIN'}
            sx={{ position: 'relative' }}
          >
            {saving ? (
              <>
                <CircularProgress
                  size={24}
                  sx={{
                    color: 'white',
                    position: 'absolute',
                    left: '50%',
                    marginLeft: '-12px'
                  }}
                />
                저장중...
              </>
            ) : '변경사항 저장'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default PermissionManagement; 