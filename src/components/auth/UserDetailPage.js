import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  FormControlLabel,
  Switch,
  Stack,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  InputAdornment
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import FacilityCompanySelectDialog from '../facility/FacilityCompanySelectDialog';

const UserDetailPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: authUser } = useAuth(); // AuthContext에서 현재 로그인한 사용자 정보 가져오기
  
  const [user, setUser] = useState({
    id: '',
    userId: '',
    userName: '',
    email: '',
    phoneNumber: '',
    role: '',
    active: true,
    companyId: '',
    companyName: '',
    storeCode: '',
    departmentTypeId: '',
    branchGroupId: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // 담당부서 및 지부별그룹 상태 추가
  const [departments, setDepartments] = useState([]);
  const [branchGroups, setBranchGroups] = useState([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isLoadingBranchGroups, setIsLoadingBranchGroups] = useState(false);
  
  // 비밀번호 초기화 관련 상태
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // 세션 스토리지에 저장된 사용자 정보 콘솔에 출력 (디버깅용)
  const sessionUser = JSON.parse(sessionStorage.getItem('user') || '{}');

  // ADMIN 권한 체크 - AuthContext 사용
  const isAdmin = authUser?.role?.toUpperCase() === 'ADMIN';
  
  // 현재 로그인한 사용자 ID
  const currentUserId = authUser?.id?.toString();
  
  // 자기 자신의 정보를 수정하는지 확인
  const isSelfEdit = currentUserId === userId;

  // 권한 및 상태 수정 가능 여부 확인
  const canEditRoleAndStatus = isAdmin; // 관리자만 권한과 상태 수정 가능

  // 수탁업체 선택 다이얼로그 상태 추가
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  // 담당부서 및 지부별그룹 목록 불러오기
  useEffect(() => {
    // 담당부서 및 지부별그룹 목록 가져오기
    fetchDepartments();
    fetchBranchGroups();
  }, []);

  // 담당부서 목록 가져오기
  const fetchDepartments = async () => {
    setIsLoadingDepartments(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/codes/groups/003001/codes/active', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (!response.ok) {
        throw new Error('담당부서 목록을 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      setDepartments(data);
    } catch (error) {
      console.error('담당부서 목록 조회 오류:', error);
    } finally {
      setIsLoadingDepartments(false);
    }
  };

  // 지부별그룹 목록 가져오기
  const fetchBranchGroups = async () => {
    setIsLoadingBranchGroups(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/codes/groups/003002/codes/active', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (!response.ok) {
        throw new Error('지부별그룹 목록을 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      setBranchGroups(data);
    } catch (error) {
      console.error('지부별그룹 목록 조회 오류:', error);
    } finally {
      setIsLoadingBranchGroups(false);
    }
  };

  // 사용자 정보 로드 시 선택된 수탁업체 설정
  useEffect(() => {
    if (user && user.companyId) {
      setSelectedCompany({
        id: user.companyId,
        storeCode: user.storeCode,
        storeName: user.companyName
      });
    }
  }, [user.companyId]);

  // 비밀번호 유효성 검사 함수
  const validatePassword = (password) => {
    // 8~20자 사이, 최소 하나의 소문자, 숫자, 특수문자(@#$%^&+=!) 포함
    const passwordRegex = /^(?=.*[a-z])(?=.*\d)(?=.*[@#$%^&+=!])[a-zA-Z\d@#$%^&+=!]{8,20}$/;
    return passwordRegex.test(password);
  };

  // 전화번호 포맷팅 함수
  const formatPhoneNumber = (value) => {
    if (!value) return '';
    
    // 숫자만 추출
    const numbers = value.replace(/[^\d]/g, '');
    
    // 숫자를 형식에 맞게 변환
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  // 전화번호 변경 핸들러
  const handlePhoneNumberChange = (e) => {
    const formattedNumber = formatPhoneNumber(e.target.value);
    setUser({ ...user, phoneNumber: formattedNumber });
  };

  // 수탁업체 변경 핸들러
  const handleCompanyChange = (company) => {
    setSelectedCompany(company);
    setUser({
      ...user,
      companyId: company.id.toString(),
      companyName: company.storeName,
      storeCode: company.storeCode
    });
  };

  // 수탁업체 선택 다이얼로그 열기
  const handleOpenCompanyDialog = () => {
    setCompanyDialogOpen(true);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // 인증 토큰 가져오기
        const token = sessionStorage.getItem('token');
        
        const response = await fetch(`http://localhost:8080/api/users/${userId}`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        
        if (!response.ok) {
          throw new Error('사용자 정보를 불러오는데 실패했습니다.');
        }
        
        const data = await response.json();
        setUser(data);
        
        // 수탁업체 정보 설정
        if (data.companyId) {
          setSelectedCompany({
            id: data.companyId,
            storeCode: data.storeCode || '',
            storeName: data.companyName || ''
          });
        }
      } catch (error) {
        console.error('사용자 정보 조회 오류:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  // 권한 변경 핸들러
  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setUser(prev => ({
      ...prev,
      role: newRole,
      // AS_MANAGER가 아닌 경우 관련 필드 초기화
      ...(newRole !== 'AS_MANAGER' ? { departmentTypeId: '', branchGroupId: '' } : {})
    }));
  };

  // 활성화 상태 변경 핸들러
  const handleActiveChange = (e) => {
    const newActive = e.target.checked;
    setUser({ ...user, active: newActive });
  };
  
  // 비밀번호 초기화 다이얼로그 열기
  const handleOpenResetPasswordDialog = () => {
    setResetPasswordDialogOpen(true);
  };

  // 비밀번호 초기화 다이얼로그 닫기
  const handleCloseResetPasswordDialog = () => {
    setResetPasswordDialogOpen(false);
  };

  // 비밀번호 초기화 요청 처리
  const handleResetPassword = async () => {
    setIsResettingPassword(true);
    setError(null);
    try {
      // 인증 토큰 가져오기
      const token = sessionStorage.getItem('token');
      
      const response = await fetch(`http://localhost:8080/api/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '비밀번호 초기화에 실패했습니다.');
      }

      const data = await response.json();
      setSuccess(data.message || '비밀번호가 초기화되었습니다.');
      setResetPasswordDialogOpen(false);
    } catch (error) {
      console.error('비밀번호 초기화 오류:', error);
      setError(error.message);
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // 인증 토큰 가져오기
      const token = sessionStorage.getItem('token');
      
      // 비밀번호 변경이 있는 경우
      if (passwordData.newPassword) {
        // 새 비밀번호 확인 검증
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          setPasswordErrors(prev => ({...prev, confirmPassword: '새 비밀번호가 일치하지 않습니다'}));
          setIsLoading(false);
          return;
        }

        // 현재 비밀번호 검증
        if (!passwordData.currentPassword) {
          setPasswordErrors(prev => ({...prev, currentPassword: '현재 비밀번호를 입력해주세요'}));
          setIsLoading(false);
          return;
        }

        // 비밀번호 변경 API 호출
        const passwordResponse = await fetch(`http://localhost:8080/api/users/${user.id}/password`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword
          })
        });

        if (!passwordResponse.ok) {
          const errorData = await passwordResponse.json();
          setPasswordErrors(prev => ({
            ...prev,
            currentPassword: errorData.message || '비밀번호 변경에 실패했습니다.'
          }));
          setIsLoading(false);
          return;
        }
      }

      // 사용자 정보 업데이트 로직
      const updateData = {
        userName: user.userName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        active: user.active,
        companyId: selectedCompany ? parseInt(selectedCompany.id) : null
      };
      
      // AS_MANAGER 권한인 경우 추가 필드 포함
      if (user.role === 'AS_MANAGER') {
        updateData.departmentTypeId = user.departmentTypeId;
        updateData.branchGroupId = user.branchGroupId;
      }

      const response = await fetch(`http://localhost:8080/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        setSuccess('사용자 정보가 성공적으로 수정되었습니다.');
        // 성공 시 비밀번호 필드 초기화
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setPasswordErrors({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        // 업데이트된 사용자 정보 다시 불러오기
        const updatedUserResponse = await fetch(`http://localhost:8080/api/users/${user.id}`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        if (updatedUserResponse.ok) {
          const updatedUserData = await updatedUserResponse.json();
          setUser(updatedUserData);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || '사용자 정보 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('사용자 정보 수정 오류:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !user.id) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#F8F8FE', minHeight: '100vh' }}>
      {/* 상단 헤더 */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3 
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#3A3A3A' }}>
          사용자 상세 정보
        </Typography>
      </Box>

      {/* 알림 메시지 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* 전체 컨테이너 */}
      <Paper sx={{ 
        p: 3,
        borderRadius: 2,
        boxShadow: 'none',
        border: '1px solid #EEEEEE'
      }}>
        <form onSubmit={handleSubmit}>
          {/* 기본 정보 섹션 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#3A3A3A', mb: 2 }}>
              기본 정보
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Stack spacing={3}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  label="아이디"
                  value={user.userId || ''}
                  fullWidth
                  disabled
                  size="small"
                  InputProps={{
                    sx: { bgcolor: '#f5f5f5' }
                  }}
                />
                
                <TextField
                  label="이름"
                  value={user.userName || ''}
                  onChange={(e) => setUser({ ...user, userName: e.target.value })}
                  fullWidth
                  size="small"
                  required
                />
              </Box>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  label="이메일"
                  type="email"
                  value={user.email || ''}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                  fullWidth
                  size="small"
                />
                
                <TextField
                  label="전화번호"
                  value={user.phoneNumber || ''}
                  onChange={handlePhoneNumberChange}
                  placeholder="010-0000-0000"
                  fullWidth
                  size="small"
                  inputProps={{
                    maxLength: 13 // 최대 길이 (010-0000-0000)
                  }}
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                {isAdmin ? (
                  <TextField
                    label="수탁업체"
                    value={selectedCompany ? `${selectedCompany.storeName} (${selectedCompany.storeCode || ''})` : ''}
                    fullWidth
                    size="small"
                    placeholder="수탁업체를 선택해주세요"
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <InputAdornment position="end" sx={{ mr: -0.75 }}>
                          <Button
                            variant="outlined"
                            onClick={handleOpenCompanyDialog}
                            disabled={isLoading}
                            size="small"
                            sx={{ 
                              height: '26px', 
                              minWidth: '70px', 
                              fontSize: '0.75rem',
                              mr: 0.75,
                              borderColor: 'rgba(0, 0, 0, 0.23)',
                              color: 'text.primary',
                              textTransform: 'none',
                              py: 0
                            }}
                          >
                            업체 선택
                          </Button>
                        </InputAdornment>
                      ),
                      sx: { 
                        pr: 0.75,
                        bgcolor: 'background.paper',
                        '&:hover': {
                          borderColor: 'rgba(0, 0, 0, 0.87)'
                        }
                      }
                    }}
                  />
                ) : (
                  <TextField
                    label="수탁업체"
                    value={user.companyName ? `${user.companyName} (${user.storeCode})` : '수탁업체 정보 없음'}
                    fullWidth
                    disabled
                    size="small"
                    InputProps={{
                      sx: { bgcolor: '#f5f5f5' }
                    }}
                  />
                )}

                <FormControl fullWidth size="small">
                  <InputLabel>권한</InputLabel>
                  <Select
                    value={user.role || ''}
                    onChange={handleRoleChange}
                    label="권한"
                    disabled={!canEditRoleAndStatus}
                  >
                    <MenuItem value="ADMIN">관리자</MenuItem>
                    <MenuItem value="FINANCE_MANAGER">재경부 매니저</MenuItem>
                    <MenuItem value="CONTRACT_MANAGER">계약관리 매니저</MenuItem>
                    <MenuItem value="FACILITY_MANAGER">시설물관리 매니저</MenuItem>
                    <MenuItem value="AS_MANAGER">AS관리 매니저</MenuItem>
                    <MenuItem value="MANAGER">위수탁업체 매니저</MenuItem>
                    <MenuItem value="USER">위수탁업체 사용자</MenuItem>
                  </Select>
                  {!canEditRoleAndStatus && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      관리자만 권한을 변경할 수 있습니다.
                    </Typography>
                  )}
                </FormControl>
              </Box>
              
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={user.active}
                      onChange={handleActiveChange}
                      color={user.active ? "success" : "default"}
                      disabled={!canEditRoleAndStatus}
                    />
                  }
                  label={user.active ? "사용" : "미사용"}
                  sx={{ ml: 1 }}
                />
                {!canEditRoleAndStatus && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    관리자만 상태를 변경할 수 있습니다.
                  </Typography>
                )}
              </Box>

              {/* AS_MANAGER 권한인 경우에만 표시되는 추가 필드 */}
              {user.role === 'AS_MANAGER' && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>담당부서</InputLabel>
                    <Select
                      value={user.departmentTypeId || ''}
                      onChange={(e) => setUser({ ...user, departmentTypeId: e.target.value })}
                      label="담당부서"
                      disabled={isLoadingDepartments || (!isAdmin && !isSelfEdit)}
                    >
                      {isLoadingDepartments ? (
                        <MenuItem value="" disabled>로딩 중...</MenuItem>
                      ) : (
                        departments.map(department => (
                          <MenuItem key={department.codeId} value={department.codeId}>
                            {department.codeName}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                    {(!isAdmin && !isSelfEdit) && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        수정 권한이 없습니다.
                      </Typography>
                    )}
                  </FormControl>
                  
                  <FormControl fullWidth size="small">
                    <InputLabel>지부별그룹</InputLabel>
                    <Select
                      value={user.branchGroupId || ''}
                      onChange={(e) => setUser({ ...user, branchGroupId: e.target.value })}
                      label="지부별그룹"
                      disabled={isLoadingBranchGroups || (!isAdmin && !isSelfEdit)}
                    >
                      {isLoadingBranchGroups ? (
                        <MenuItem value="" disabled>로딩 중...</MenuItem>
                      ) : (
                        branchGroups.map(group => (
                          <MenuItem key={group.codeId} value={group.codeId}>
                            {group.codeName}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                    {(!isAdmin && !isSelfEdit) && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        수정 권한이 없습니다.
                      </Typography>
                    )}
                  </FormControl>
                </Box>
              )}
            </Stack>
          </Box>

          {/* 비밀번호 변경 섹션 */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#3A3A3A' }}>
                비밀번호 변경
              </Typography>
              
              {/* 관리자용 비밀번호 초기화 버튼 */}
              {isAdmin && !isSelfEdit && (
                <Button
                  variant="outlined"
                  color="warning"
                  size="small"
                  onClick={handleOpenResetPasswordDialog}
                  sx={{ 
                    fontSize: '0.75rem',
                    borderRadius: '4px',
                    textTransform: 'none',
                    fontWeight: 500
                  }}
                >
                  비밀번호 초기화
                </Button>
              )}
            </Box>
            <Divider sx={{ mb: 3 }} />
            
            <Stack spacing={3}>
              <TextField
                type="password"
                label="현재 비밀번호"
                value={passwordData.currentPassword}
                onChange={(e) => {
                  setPasswordData({...passwordData, currentPassword: e.target.value});
                  setPasswordErrors({...passwordErrors, currentPassword: ''});
                }}
                error={Boolean(passwordErrors.currentPassword)}
                helperText={passwordErrors.currentPassword}
                fullWidth
                size="small"
              />
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  type="password"
                  label="새 비밀번호"
                  value={passwordData.newPassword}
                  onChange={(e) => {
                    const value = e.target.value;
                    let errorMessage = '';
                    if (value.length > 0) {
                      if (!validatePassword(value)) {
                        errorMessage = '비밀번호는 8~20자 사이이며, 최소 하나의 소문자, 숫자, 특수문자(@#$%^&+=!)를 포함해야 합니다.';
                      }
                    }
                    setPasswordData({ ...passwordData, newPassword: value });
                    setPasswordErrors({ ...passwordErrors, newPassword: errorMessage });
                  }}
                  error={Boolean(passwordErrors.newPassword)}
                  helperText={passwordErrors.newPassword}
                  fullWidth
                  size="small"
                />

                <TextField
                  type="password"
                  label="새 비밀번호 확인"
                  value={passwordData.confirmPassword}
                  onChange={(e) => {
                    const value = e.target.value;
                    let errorMessage = '';
                    if (value !== passwordData.newPassword) {
                      errorMessage = '새 비밀번호가 일치하지 않습니다.';
                    }
                    setPasswordData({ ...passwordData, confirmPassword: value });
                    setPasswordErrors({ ...passwordErrors, confirmPassword: errorMessage });
                  }}
                  error={Boolean(passwordErrors.confirmPassword)}
                  helperText={passwordErrors.confirmPassword}
                  fullWidth
                  size="small"
                />
              </Box>
            </Stack>
          </Box>

          {/* 버튼 그룹 */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            justifyContent: 'center',
            mt: 4
          }}>
            <Button 
              type="submit"
              variant="contained" 
              disabled={isLoading}
              sx={{ 
                minWidth: '120px',
                bgcolor: '#1976d2',
                '&:hover': { bgcolor: '#1565c0' }
              }}
            >
              {isLoading ? '저장 중...' : '저장'}
            </Button>
            
            <Button 
              variant="outlined"
              onClick={() => navigate('/users')}
              disabled={isLoading}
              sx={{ 
                minWidth: '120px',
                color: '#666',
                borderColor: '#666',
                '&:hover': {
                  borderColor: '#1976d2',
                  color: '#1976d2'
                }
              }}
            >
              목록으로 
            </Button>
          </Box>
        </form>
      </Paper>
      
      {/* 수탁업체 선택 다이얼로그 */}
      <FacilityCompanySelectDialog
        open={companyDialogOpen}
        onClose={() => setCompanyDialogOpen(false)}
        onSelect={handleCompanyChange}
        title="수탁업체 선택"
      />
      
      {/* 비밀번호 초기화 확인 다이얼로그 */}
      <Dialog
        open={resetPasswordDialogOpen}
        onClose={handleCloseResetPasswordDialog}
        PaperProps={{
          sx: {
            borderRadius: '8px',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
            width: '400px',
            maxWidth: '95vw'
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
          비밀번호 초기화 확인
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 2 }}>
          <DialogContentText sx={{ color: '#333', fontSize: '0.9rem', mb: 1 ,mt: 1 }}>
            정말로 <strong>{user.userName}</strong>님의 비밀번호를 초기화하시겠습니까?
          </DialogContentText>
          <DialogContentText sx={{ color: '#555', fontSize: '0.85rem' }}>
            초기화된 비밀번호는 <strong>tb0000!@</strong> 입니다.
            사용자에게 초기화된 비밀번호를 안내해주세요.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #F0F0F0' }}>
          <Button 
            onClick={handleCloseResetPasswordDialog}
            color="inherit"
            sx={{ 
              color: '#666',
              fontSize: '0.85rem'
            }}
          >
            취소
          </Button>
          <Button 
            onClick={handleResetPassword}
            color="error"
            variant="contained"
            disabled={isResettingPassword}
            sx={{ 
              fontSize: '0.85rem',
              fontWeight: 500
            }}
          >
            {isResettingPassword ? '처리 중...' : '초기화'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserDetailPage; 