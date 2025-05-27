import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  CircularProgress,
  InputAdornment,
  IconButton,
  Link,
  FormControl,
  FormHelperText,
  Select,
  MenuItem,
  InputLabel
} from '@mui/material';
import { Visibility, VisibilityOff, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import FacilityCompanySelectDialog from '../facility/FacilityCompanySelectDialog';

const Signup = () => {
  const [formData, setFormData] = useState({
    userId: '',
    password: '',
    confirmPassword: '',
    userName: '',
    email: '',
    phoneNumber: '',
    role: 'MANAGER',
    companyId: '',
    departmentTypeId: '',
    branchGroupId: ''
  });
  
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [companies, setCompanies] = useState([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  
  // 담당부서 및 지부별그룹 상태 추가
  const [departments, setDepartments] = useState([]);
  const [branchGroups, setBranchGroups] = useState([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isLoadingBranchGroups, setIsLoadingBranchGroups] = useState(false);
  
  // 수탁업체 선택 다이얼로그 상태 추가
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  
  const navigate = useNavigate();

  // 수탁업체 목록 불러오기
  useEffect(() => {
    // AS_MANAGER 권한 선택 시 필요한 데이터 미리 로드
    fetchDepartments();
    fetchBranchGroups();
  }, []);

  // 담당부서 목록 가져오기
  const fetchDepartments = async () => {
    setIsLoadingDepartments(true);
    try {
      const response = await fetch('http://localhost:8080/api/codes/groups/003001/codes/active');
      if (!response.ok) {
        throw new Error('담당부서 목록을 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      setDepartments(data);
    } catch (error) {
      console.error('담당부서 목록 조회 오류:', error);
      setApiError('담당부서 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoadingDepartments(false);
    }
  };

  // 지부별그룹 목록 가져오기
  const fetchBranchGroups = async () => {
    setIsLoadingBranchGroups(true);
    try {
      const response = await fetch('http://localhost:8080/api/codes/groups/003002/codes/active');
      if (!response.ok) {
        throw new Error('지부별그룹 목록을 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      setBranchGroups(data);
    } catch (error) {
      console.error('지부별그룹 목록 조회 오류:', error);
      setApiError('지부별그룹 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoadingBranchGroups(false);
    }
  };

  // 뒤로가기 핸들러 - 이전 페이지로 이동
  const handleGoBack = () => {
    navigate(-1); // 브라우저 히스토리에서 이전 페이지로 이동
  };

  // 비밀번호 정책 검증 함수
  const validatePassword = (password) => {
    const passwordPattern = /^(?=.*[0-9])(?=.*[a-z])(?=.*[@#$%^&+=!])(?=\S+$).{8,20}$/;
    return passwordPattern.test(password);
  };

  // 아이디 중복 체크 함수
  const checkUserIdAvailability = async (userId) => {
    if (!userId || userId.length < 4) {
      return false;
    }
    
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:8080/api/auth/check-username?userId=${userId}`);
      
      if (response.status === 409) {
        setErrors(prev => ({
          ...prev,
          userId: '이미 사용중인 아이디입니다.'
        }));
        return false;
      }
      
      // 사용 가능한 아이디인 경우 성공 메시지 표시
      setErrors(prev => ({
        ...prev,
        userId: '사용 가능한 아이디입니다.',
        userIdValid: true  // 유효한 아이디 표시
      }));
      return true;
    } catch (error) {
      console.error('아이디 중복 체크 오류:', error);
      setErrors(prev => ({
        ...prev,
        userId: '중복 체크 중 오류가 발생했습니다.'
      }));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 아이디 중복 체크 버튼 핸들러
  const handleCheckUserId = () => {
    if (!formData.userId) {
      setErrors(prev => ({
        ...prev,
        userId: '아이디를 입력해주세요.'
      }));
      return;
    }
    
    if (formData.userId.length < 4) {
      setErrors(prev => ({
        ...prev,
        userId: '아이디는 최소 4자 이상이어야 합니다.'
      }));
      return;
    }
    
    checkUserIdAvailability(formData.userId);
  };

  // 입력값 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // 실시간 유효성 검사
    validateField(name, value);
  };

  // 필드별 유효성 검사
  const validateField = (name, value) => {
    let newErrors = { ...errors };

    switch (name) {
      case 'userId':
        if (!value) {
          newErrors.userId = '아이디를 입력해주세요.';
        } else if (value.length < 4) {
          newErrors.userId = '아이디는 최소 4자 이상이어야 합니다.';
        } else {
          // 아이디 입력 시 중복 체크 상태 초기화
          newErrors.userId = '';
          newErrors.userIdValid = false;
        }
        break;
        
      case 'password':
        if (!value) {
          newErrors.password = '비밀번호를 입력해주세요.';
        } else if (!validatePassword(value)) {
          newErrors.password = '비밀번호는 8~20자 사이이며, 최소 하나의 소문자, 숫자, 특수문자(@#$%^&+=!)를 포함해야 합니다.';
        } else {
          newErrors.password = '';
        }
        
        // 비밀번호 확인 필드도 검증
        if (formData.confirmPassword && value !== formData.confirmPassword) {
          newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
          newErrors.passwordMatch = false;
        } else if (formData.confirmPassword) {
          newErrors.confirmPassword = '비밀번호가 일치합니다.';
          newErrors.passwordMatch = true;
        }
        break;
        
      case 'confirmPassword':
        if (!value) {
          newErrors.confirmPassword = '비밀번호를 다시 입력해주세요.';
          newErrors.passwordMatch = false;
        } else if (value !== formData.password) {
          newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
          newErrors.passwordMatch = false;
        } else {
          newErrors.confirmPassword = '비밀번호가 일치합니다.';
          newErrors.passwordMatch = true;
        }
        break;
        
      case 'userName':
        if (!value) {
          newErrors.userName = '이름을 입력해주세요.';
        } else {
          newErrors.userName = '';
        }
        break;
        
      case 'email':
        if (value && !/\S+@\S+\.\S+/.test(value)) {
          newErrors.email = '유효한 이메일 주소를 입력해주세요.';
        } else {
          newErrors.email = '';
        }
        break;
        
      case 'phoneNumber':
        if (value && !/^\d{3}-\d{3,4}-\d{4}$/.test(value)) {
          newErrors.phoneNumber = '전화번호 형식이 올바르지 않습니다. (예: 010-1234-5678)';
        } else {
          newErrors.phoneNumber = '';
        }
        break;
        
      case 'companyId':
        if (!value) {
          newErrors.companyId = '수탁업체를 선택해주세요.';
        } else {
          newErrors.companyId = '';
        }
        break;
        
      case 'departmentTypeId':
        if (formData.role === 'AS_MANAGER' && !value) {
          newErrors.departmentTypeId = '담당부서를 선택해주세요.';
        } else {
          newErrors.departmentTypeId = '';
        }
        break;
        
      case 'branchGroupId':
        if (formData.role === 'AS_MANAGER' && !value) {
          newErrors.branchGroupId = '지부별그룹을 선택해주세요.';
        } else {
          newErrors.branchGroupId = '';
        }
        break;
        
      default:
        break;
    }

    setErrors(newErrors);
  };

  // 전화번호 포맷팅
  const handlePhoneNumberChange = (e) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    let formattedValue = '';
    
    if (value.length <= 3) {
      formattedValue = value;
    } else if (value.length <= 7) {
      formattedValue = `${value.slice(0, 3)}-${value.slice(3)}`;
    } else {
      formattedValue = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7, 11)}`;
    }
    
    setFormData(prev => ({
      ...prev,
      phoneNumber: formattedValue
    }));
    
    validateField('phoneNumber', formattedValue);
  };

  // 비밀번호 표시 토글
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // 비밀번호 확인 표시 토글
  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // 역할 변경 핸들러 추가
  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setFormData(prev => ({ 
      ...prev, 
      role: newRole,
      // AS_MANAGER가 아닌 경우 관련 필드 초기화
      ...(newRole !== 'AS_MANAGER' ? { departmentTypeId: '', branchGroupId: '' } : {})
    }));
  };

  // 폼 제출 전 유효성 검사
  const validateForm = () => {
    let isValid = true;
    let newErrors = {};
    
    // 필수 필드 검사
    if (!formData.userId) {
      newErrors.userId = '아이디를 입력해주세요.';
      isValid = false;
    }
    
    // 아이디 중복 체크 여부 확인
    if (!errors.userIdValid) {
      newErrors.userId = '아이디 중복 체크를 해주세요.';
      isValid = false;
    }
    
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
      isValid = false;
    } else if (!validatePassword(formData.password)) {
      newErrors.password = '비밀번호는 8~20자 사이이며, 최소 하나의 소문자, 숫자, 특수문자(@#$%^&+=!)를 포함해야 합니다.';
      isValid = false;
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호를 다시 입력해주세요.';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
      isValid = false;
    }
    
    if (!formData.userName) {
      newErrors.userName = '이름을 입력해주세요.';
      isValid = false;
    }
    
    if (!formData.companyId || !selectedCompany) {
      newErrors.companyId = '수탁업체를 선택해주세요.';
      isValid = false;
    }
    
    // AS_MANAGER 권한인 경우 추가 필드 검사
    if (formData.role === 'AS_MANAGER') {
      if (!formData.departmentTypeId) {
        newErrors.departmentTypeId = '담당부서를 선택해주세요.';
        isValid = false;
      }
      
      if (!formData.branchGroupId) {
        newErrors.branchGroupId = '지부별그룹을 선택해주세요.';
        isValid = false;
      }
    }
    
    // 선택 필드 검사 (입력된 경우에만)
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '유효한 이메일 주소를 입력해주세요.';
      isValid = false;
    }
    
    if (formData.phoneNumber && !/^\d{3}-\d{3,4}-\d{4}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = '전화번호 형식이 올바르지 않습니다. (예: 010-1234-5678)';
      isValid = false;
    }
    
    setErrors({ ...errors, ...newErrors });
    return isValid;
  };

  // 사용자추가 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 폼 유효성 검사
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setApiError('');
    
    try {
      // 요청 데이터 준비
      const requestData = {
        userId: formData.userId,
        password: formData.password,
        userName: formData.userName,
        email: formData.email || null,
        phoneNumber: formData.phoneNumber || null,
        role: formData.role,
        companyId: parseInt(formData.companyId)
      };
      
      // AS_MANAGER 권한인 경우 추가 필드 포함
      if (formData.role === 'AS_MANAGER') {
        requestData.departmentTypeId = formData.departmentTypeId;
        requestData.branchGroupId = formData.branchGroupId;
      }
      
      const response = await fetch('http://localhost:8080/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '사용자추가에 실패했습니다.');
      }
      
      alert('사용자추가를 완료하셨습니다.');
      navigate('/users');  // 사용자 목록 페이지로 이동
      
    } catch (error) {
      console.error('사용자추가 오류:', error);
      setApiError(error.message || '사용자추가 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 수탁업체 선택 다이얼로그 열기
  const handleOpenCompanyDialog = () => {
    setCompanyDialogOpen(true);
  };

  // 수탁업체 선택 처리
  const handleCompanySelect = (company) => {
    setSelectedCompany(company);
    setFormData(prev => ({
      ...prev,
      companyId: company.id.toString()
    }));
    // 에러 메시지 초기화
    setErrors(prev => ({
      ...prev,
      companyId: ''
    }));
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        py: 4
      }}
    >
      {/* 로고 영역 */}
      <Box 
        component="img"
        src="/images/logo.png"
        alt="타이어뱅크 로고"
        sx={{
          height: '100px',
          mb: 5
        }}
      />
      
      {/* 사용자추가 폼 */}
      <Paper
        elevation={1}
        sx={{
          width: '100%',
          maxWidth: 500,
          p: 4,
          borderRadius: 2,
          border: '1px solid #e0e0e0'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton 
            onClick={handleGoBack}
            sx={{ mr: 1 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
          사용자추가
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          계정 정보를 입력하여 사용자추가를 완료해주세요.
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              label="아이디 *"
              name="userId"
              value={formData.userId}
              onChange={handleChange}
              error={!!errors.userId && !errors.userIdValid}
              helperText={errors.userId}
              FormHelperTextProps={{
                sx: {
                  color: errors.userIdValid ? 'success.main' : (errors.userId ? 'error.main' : 'inherit')
                }
              }}
              variant="outlined"
              margin="normal"
              required
              autoFocus
            />
            <Button
              variant="outlined"
              onClick={handleCheckUserId}
              disabled={isLoading || !formData.userId || formData.userId.length < 4}
              sx={{ 
                mt: 2,
                minWidth: '120px',
                height: '56px'
              }}
            >
              중복 확인
            </Button>
          </Box>
          
          <TextField
            fullWidth
            label="비밀번호 *"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            error={!!errors.password}
            helperText={errors.password}
            variant="outlined"
            margin="normal"
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleTogglePasswordVisibility}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          <TextField
            fullWidth
            label="비밀번호 확인 *"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleChange}
            error={!!errors.confirmPassword && !errors.passwordMatch}
            helperText={errors.confirmPassword}
            FormHelperTextProps={{
              sx: {
                color: errors.passwordMatch ? 'success.main' : (errors.confirmPassword ? 'error.main' : 'inherit')
              }
            }}
            variant="outlined"
            margin="normal"
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleToggleConfirmPasswordVisibility}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          <TextField
            fullWidth
            label="이름 *"
            name="userName"
            value={formData.userName}
            onChange={handleChange}
            error={!!errors.userName}
            helperText={errors.userName}
            variant="outlined"
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="이메일"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
            variant="outlined"
            margin="normal"
          />
          
          <TextField
            fullWidth
            label="전화번호"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handlePhoneNumberChange}
            error={!!errors.phoneNumber}
            helperText={errors.phoneNumber || '예: 010-1234-5678'}
            variant="outlined"
            margin="normal"
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>권한 *</InputLabel>
            <Select
              value={formData.role}
              onChange={handleRoleChange}
              label="권한 *"
            >
              <MenuItem value="ADMIN">관리자</MenuItem>
              <MenuItem value="FINANCE_MANAGER">재경부 매니저</MenuItem>
              <MenuItem value="CONTRACT_MANAGER">계약관리 매니저</MenuItem>
              <MenuItem value="FACILITY_MANAGER">시설물관리 매니저</MenuItem>
              <MenuItem value="AS_MANAGER">AS관리 매니저</MenuItem>
              <MenuItem value="MANAGER">위수탁업체 매니저</MenuItem>
              <MenuItem value="USER">일반 사용자</MenuItem>
            </Select>
            <FormHelperText>권한 설정</FormHelperText>
          </FormControl>

          {/* AS_MANAGER 권한인 경우에만 표시되는 추가 필드 */}
          {formData.role === 'AS_MANAGER' && (
            <>
              <FormControl fullWidth margin="normal" error={!!errors.departmentTypeId}>
                <InputLabel>담당부서 *</InputLabel>
                <Select
                  value={formData.departmentTypeId}
                  onChange={handleChange}
                  name="departmentTypeId"
                  label="담당부서 *"
                  disabled={isLoadingDepartments}
                  required
                >
                  {isLoadingDepartments ? (
                    <MenuItem value="" disabled>
                      로딩 중...
                    </MenuItem>
                  ) : (
                    departments.map((department) => (
                      <MenuItem key={department.codeId} value={department.codeId}>
                        {department.codeName}
                      </MenuItem>
                    ))
                  )}
                </Select>
                {errors.departmentTypeId && <FormHelperText>{errors.departmentTypeId}</FormHelperText>}
              </FormControl>

              <FormControl fullWidth margin="normal" error={!!errors.branchGroupId}>
                <InputLabel>지부별그룹 *</InputLabel>
                <Select
                  value={formData.branchGroupId}
                  onChange={handleChange}
                  name="branchGroupId"
                  label="지부별그룹 *"
                  disabled={isLoadingBranchGroups}
                  required
                >
                  {isLoadingBranchGroups ? (
                    <MenuItem value="" disabled>
                      로딩 중...
                    </MenuItem>
                  ) : (
                    branchGroups.map((group) => (
                      <MenuItem key={group.codeId} value={group.codeId}>
                        {group.codeName}
                      </MenuItem>
                    ))
                  )}
                </Select>
                {errors.branchGroupId && <FormHelperText>{errors.branchGroupId}</FormHelperText>}
              </FormControl>
            </>
          )}

          {/* 수탁업체 선택 필드 - 다이얼로그로 변경 */}
          <Box sx={{ mb: 2, mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              수탁업체 *
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                fullWidth
                value={selectedCompany ? `${selectedCompany.storeName} (${selectedCompany.storeCode || ''})` : ''}
                disabled
                placeholder="수탁업체를 선택해주세요"
                error={!!errors.companyId}
                helperText={errors.companyId}
                InputProps={{
                  readOnly: true,
                  sx: { 
                    bgcolor: !selectedCompany ? '#fafafa' : 'transparent',
                    border: selectedCompany ? '1px solid #e0e0e0' : 'inherit'
                  }
                }}
              />
              <Button
                variant="outlined"
                onClick={handleOpenCompanyDialog}
                disabled={isLoading}
                sx={{ height: '56px', minWidth: '120px' }}
              >
                업체 선택
              </Button>
            </Box>
          </Box>

          {/* 수탁업체 선택 다이얼로그 */}
          <FacilityCompanySelectDialog
            open={companyDialogOpen}
            onClose={() => setCompanyDialogOpen(false)}
            onSelect={handleCompanySelect}
            title="수탁업체 선택"
          />
          
          {apiError && (
            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
              {apiError}
            </Typography>
          )}
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isLoading}
            sx={{
              py: 1.5,
              mt: 3,
              mb: 2,
              backgroundColor: '#0073b1',
              '&:hover': {
                backgroundColor: '#006097',
              },
              '&.Mui-disabled': {
                backgroundColor: '#0073b1',
                opacity: 0.7,
              },
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '4px',
              position: 'relative'
            }}
          >
            {isLoading ? (
              <>
                <CircularProgress
                  size={24}
                  sx={{
                    color: 'white',
                    position: 'absolute',
                    left: '30%'
                  }}
                />
                처리 중...
              </>
            ) : (
              '사용자추가'
            )}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default Signup; 