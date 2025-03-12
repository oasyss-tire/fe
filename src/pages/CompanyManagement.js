import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Stack,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import ImageIcon from '@mui/icons-material/Image';
import axios from 'axios';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const CompanyManagement = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState({
    companyId: '',
    companyName: '',
    phoneNumber: '',
    faxNumber: '',
    notes: '',
    businessNumber: '',
    contractDate: null,
    startDate: null,
    expiryDate: null,
    monthlyFee: '',
    status: 'ACTIVE',
    address: '',
    detailAddress: '',
    businessLicenseImage: null
  });
  const [employees, setEmployees] = useState([]);
  const [newEmployee, setNewEmployee] = useState({ name: '', phone: '' });

  // fetchEmployees 함수를 컴포넌트 레벨로 이동
  const fetchEmployees = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/companies/${companyId}/employees`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // active 상태와 관계없이 모든 직원 정보 저장
        setEmployees(data);
      }
    } catch (error) {
      console.error('직원 정보 조회 실패:', error);
    }
  };

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/companies/${companyId}`, {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setCompany(data);
        }
      } catch (error) {
        console.error('Failed to fetch company data:', error);
      }
    };

    if (companyId) {
      fetchCompanyData();
      fetchEmployees();
    }
  }, [companyId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formattedData = {
        ...company,
        contractDate: company.contractDate instanceof Date 
          ? company.contractDate.toISOString().split('T')[0] 
          : company.contractDate,
        startDate: company.startDate instanceof Date 
          ? company.startDate.toISOString().split('T')[0] 
          : company.startDate,
        expiryDate: company.expiryDate instanceof Date 
          ? company.expiryDate.toISOString().split('T')[0] 
          : company.expiryDate,
        terminationDate: company.terminationDate instanceof Date 
          ? company.terminationDate.toISOString().split('T')[0] 
          : company.terminationDate,
        monthlyFee: company.monthlyFee ? parseFloat(company.monthlyFee) : null,
        status: company.status,
        employees: employees
      };

      const formData = new FormData();
      formData.append('company', JSON.stringify(formattedData));

      const response = await fetch(`http://localhost:8080/api/companies/${companyId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const updatedCompany = await response.json();
        setCompany(updatedCompany);
        fetchEmployees();
        alert('업체 정보가 수정되었습니다.');
      } else {
        alert('업체 정보 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to update company:', error);
      alert('업체 정보 수정 중 오류가 발생했습니다.');
    }
  };

  // ADMIN 권한 체크
  const isAdmin = sessionStorage.getItem('role')?.toUpperCase() === 'ADMIN';

  // 업체 삭제 핸들러
  const handleDelete = async () => {
    if (!isAdmin) {
      alert('관리자만 삭제할 수 있습니다.');
      return;
    }

    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        const response = await fetch(`http://localhost:8080/api/companies/${companyId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          alert('업체가 성공적으로 삭제되었습니다.');
          navigate('/companies'); // 목록으로 이동
        } else {
          throw new Error('삭제 실패');
        }
      } catch (error) {
        console.error('Failed to delete company:', error);
        alert('업체 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // 주소 검색 핸들러 추가
  const handleAddressSearch = () => {
    new window.daum.Postcode({
      oncomplete: (data) => {
        // 도로명 주소 또는 지번 주소
        const address = data.roadAddress || data.jibunAddress;
        
        setCompany(prev => ({
          ...prev,
          address: address,
        }));
      }
    }).open();
  };

  // 파일 다운로드/보기 함수 추가
  const handleFileView = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/companies/${companyId}/business-license`,
        {
          responseType: 'blob',
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
            'Accept': '*/*'  // 모든 타입 허용
          }
        }
      );
      
      // Content-Type 확인
      const contentType = response.headers['content-type'];
      const fileName = company.businessLicenseImage.split('/').pop();
      
      // Blob 생성 시 type 지정
      const blob = new Blob([response.data], { type: contentType });
      const fileUrl = window.URL.createObjectURL(blob);
      
      if (contentType === 'application/pdf') {
        // PDF 파일인 경우
        const pdfWindow = window.open('', '_blank');
        if (pdfWindow) {
          pdfWindow.document.write(
            `<html><head><title>${fileName}</title></head>` +
            `<body style="margin:0;"><embed width="100%" height="100%" src="${fileUrl}" type="application/pdf"></body></html>`
          );
        }
      } else if (contentType.startsWith('image/')) {
        // 이미지 파일인 경우
        const imgWindow = window.open('', '_blank');
        if (imgWindow) {
          imgWindow.document.write(
            `<html><head><title>${fileName}</title></head>` +
            `<body style="margin:0;display:flex;justify-content:center;align-items:center;background:#f0f0f0;">` +
            `<img src="${fileUrl}" style="max-width:100%;max-height:100vh;object-fit:contain;">` +
            `</body></html>`
          );
        }
      } else {
        // 다른 파일 형식은 다운로드
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      // 메모리 정리
      setTimeout(() => {
        window.URL.revokeObjectURL(fileUrl);
      }, 100);

    } catch (error) {
      console.error('파일 불러오기 실패:', error);
      alert('파일을 불러올 수 없습니다.');
    }
  };

  // 파일명을 적절한 길이로 자르는 함수 추가
  const truncateFileName = (fileName, maxLength = 20) => {
    if (fileName.length <= maxLength) return fileName;
    const extension = fileName.split('.').pop();
    const name = fileName.substring(0, fileName.lastIndexOf('.'));
    return `${name.substring(0, maxLength - extension.length - 3)}...${extension}`;
  };

  // 직원 추가
  const handleAddEmployee = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/companies/${companyId}/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify(newEmployee)
      });
      
      if (response.ok) {
        setNewEmployee({ name: '', phone: '' });
        fetchEmployees();
      }
    } catch (error) {
      console.error('직원 추가 실패:', error);
    }
  };

  // 직원 정보 수정 (로컬 상태만 업데이트)
  const handleEmployeeChange = (employeeId, field, value) => {
    setEmployees(prevEmployees => 
      prevEmployees.map(emp => 
        emp.employeeId === employeeId 
          ? { ...emp, [field]: value }
          : emp
      )
    );
  };

  // 직원 비활성화 (삭제 대신)
  const handleDeactivateEmployee = async (employeeId) => {
    try {
      const employee = employees.find(emp => emp.employeeId === employeeId);
      
      // 요청 URL과 데이터 로깅
      const url = `http://localhost:8080/api/companies/${companyId}/employees/${employeeId}`;
      const requestData = {
        name: employee.name,
        phone: employee.phone,
        active: false
      };
      

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify(requestData)
      });
      
      const responseText = await response.text();

      if (response.ok) {
        fetchEmployees();
      } else {
        console.error('직원 비활성화 실패: 서버 응답 오류', responseText);
      }
    } catch (error) {
      console.error('직원 비활성화 실패:', error);
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#F8F8FE', minHeight: '100vh' }}>
      {/* 상단 헤더 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#3A3A3A' }}>
          업체 상세
        </Typography>
      </Box>

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
            <Stack spacing={2}>
              <TextField
                label="업체명"
                value={company.companyName}
                onChange={(e) => setCompany({ ...company, companyName: e.target.value })}
                fullWidth
                size="small"
                required
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="주소"
                  value={company.address}
                  fullWidth
                  size="small"
                  InputProps={{
                    readOnly: true,
                    sx: { bgcolor: '#f8f9fa' }
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={handleAddressSearch}
                  sx={{
                    minWidth: '100px',
                    color: '#666',
                    borderColor: '#E0E0E0',
                    '&:hover': {
                      borderColor: '#1976d2',
                      color: '#1976d2'
                    }
                  }}
                >
                  주소 검색
                </Button>
              </Box>

              <TextField
                label="상세주소"
                value={company.detailAddress}
                onChange={(e) => setCompany({ ...company, detailAddress: e.target.value })}
                fullWidth
                size="small"
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="연락처"
                  value={company.phoneNumber}
                  onChange={(e) => setCompany({ ...company, phoneNumber: e.target.value })}
                  fullWidth
                  size="small"
                />
                <TextField
                  label="팩스"
                  value={company.faxNumber}
                  onChange={(e) => setCompany({ ...company, faxNumber: e.target.value })}
                  fullWidth
                  size="small"
                />
              </Box>

              <TextField
                label="사업자등록번호"
                value={company.businessNumber}
                onChange={(e) => setCompany({ ...company, businessNumber: e.target.value })}
                fullWidth
                size="small"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={company.status === 'ACTIVE'}
                    onChange={(e) => setCompany({ 
                      ...company, 
                      status: e.target.checked ? 'ACTIVE' : 'INACTIVE' 
                    })}
                    color="success"
                  />
                }
                label={company.status === 'ACTIVE' ? "사용" : "해지"}
              />
            </Stack>
          </Box>

          {/* 계약 정보 섹션 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#3A3A3A', mb: 2 }}>
              계약 정보
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="월 이용료"
                value={company.monthlyFee}
                onChange={(e) => setCompany({ ...company, monthlyFee: e.target.value })}
                fullWidth
                size="small"
                type="number"
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="계약일"
                  type="date"
                  value={company.contractDate || ''}
                  onChange={(e) => setCompany({ ...company, contractDate: e.target.value })}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="시작일"
                  type="date"
                  value={company.startDate || ''}
                  onChange={(e) => setCompany({ ...company, startDate: e.target.value })}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="만료일"
                  type="date"
                  value={company.expiryDate || ''}
                  onChange={(e) => setCompany({ ...company, expiryDate: e.target.value })}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </Stack>
          </Box>

          {/* 직원 정보 섹션 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#3A3A3A', mb: 2 }}>
              직원 정보
            </Typography>
            
            {/* 기존 직원 목록 */}
            {employees.filter(emp => emp.active).map((employee) => (
              <Box 
                key={employee.employeeId}
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 2
                }}
              >
                <TextField
                  size="small"
                  label="이름"
                  value={employee.name}
                  onChange={(e) => handleEmployeeChange(employee.employeeId, 'name', e.target.value)}
                  sx={{ width: '30%' }}
                />
                <TextField
                  size="small"
                  label="핸드폰번호"
                  value={employee.phone}
                  onChange={(e) => handleEmployeeChange(employee.employeeId, 'phone', e.target.value)}
                  sx={{ width: '50%' }}
                />
                <IconButton 
                  onClick={() => handleDeactivateEmployee(employee.employeeId)}
                  sx={{ color: '#666', '&:hover': { color: '#ff4444' } }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}

            {/* 새 직원 추가 폼 */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: 2, 
              mt: 3,
              pt: 2,
              borderTop: '1px solid #eee'
            }}>
              <TextField
                size="small"
                label="이름"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                sx={{ width: '30%' }}
              />
              <TextField
                size="small"
                label="핸드폰번호"
                value={newEmployee.phone}
                onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                sx={{ width: '50%' }}
              />
              <Button 
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddEmployee}
                disabled={!newEmployee.name || !newEmployee.phone}
                sx={{ 
                  color: '#666',
                  borderColor: '#E0E0E0',
                  '&:hover': {
                    borderColor: '#1976d2',
                    color: '#1976d2'
                  }
                }}
              >
                추가
              </Button>
            </Box>
          </Box>

          {/* 버튼 그룹 */}
          <Box sx={{ 
            display: 'flex', 
            gap: 1, 
            justifyContent: 'center',
            mt: 4
          }}>
            <Button 
              variant="contained"
              type="submit"
              sx={{ 
                minWidth: '120px',
                bgcolor: '#1976d2',
                '&:hover': { bgcolor: '#1565c0' }
              }}
            >
              저장
            </Button>
            <Button 
              variant="outlined"
              onClick={() => navigate('/companies')}
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
              목록
            </Button>
            {isAdmin && (
              <Button 
                variant="outlined"
                onClick={handleDelete}
                sx={{ 
                  minWidth: '120px',
                  color: 'error.main',
                  borderColor: 'error.main',
                  '&:hover': {
                    backgroundColor: 'error.light',
                    borderColor: 'error.dark',
                    color: 'white'
                  }
                }}
              >
                삭제
              </Button>
            )}
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default CompanyManagement; 