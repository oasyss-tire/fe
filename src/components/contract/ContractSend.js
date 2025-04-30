import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button,
  TextField,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
  InputLabel,
  ListSubheader,
  InputAdornment,
  OutlinedInput,
  Autocomplete,
  Paper,
  Checkbox,
  FormControlLabel,
  Dialog,
} from '@mui/material';
import { 
  Search as SearchIcon,
  Close as CloseIcon,
  Add as AddIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ko } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { sendContractEmail } from '../../services/EmailService';
import { sendContractSMS } from '../../services/SMSService';
import CompanySelectDialog from './CompanySelectDialog';

// 시간대 문제를 해결하기 위한 날짜 포맷 함수 추가
const formatDateForServer = (date) => {
  if (!date) return null;
  
  const d = new Date(date);
  
  // YYYY-MM-DD 형식으로만 변환 (시간 제외)
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  const formattedDate = `${year}-${month}-${day}`;
  return formattedDate;
};

const ContractSend = () => {
  const [participants, setParticipants] = useState([
    { id: 1, name: '', email: '', phone: '', sendMethod: '', userId: null }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const [contractInfo, setContractInfo] = useState({
    title: '',
    description: '',
    startDate: null,
    expiryDate: null,
    createdBy: '',
    department: '',
    companyId: '',
    trusteeHistoryId: null,
    insuranceStartDate: null,
    insuranceEndDate: null
  });

  const [templates, setTemplates] = useState([]);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState([]);
  const [templateOrder, setTemplateOrder] = useState([]);
  const [companies, setCompanies] = useState([]);
  
  const [openCompanyDialog, setOpenCompanyDialog] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedTrusteeHistory, setSelectedTrusteeHistory] = useState(null);

  // 첨부파일 관련 상태 추가
  const [documents, setDocuments] = useState([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState([]);

  const [companySearchTerm, setCompanySearchTerm] = useState('');

  const navigate = useNavigate();

  const handleAddParticipant = () => {
    const newParticipant = {
      id: participants.length + 1,
      name: '',
      email: '',
      phone: '',
      sendMethod: '',
      userId: null
    };
    setParticipants([...participants, newParticipant]);
  };

  const handleRemoveParticipant = (id) => {
    if (participants.length > 1) {
      setParticipants(participants.filter(p => p.id !== id));
    }
  };

  const handleParticipantChange = (id, field, value) => {
    setParticipants(participants.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const handleContractInfoChange = (field, value) => {
    setContractInfo(prev => ({
      ...prev,
      [field]: value
    }));

    if (field === 'companyId' && value) {
      const selectedCompany = companies.find(company => company.id === value);
      if (selectedCompany) {
        // 수탁사업자 이력 정보만 사용
        const trusteeHistory = selectedTrusteeHistory;
        
        if (trusteeHistory) {
          // 시작일 설정
          if (trusteeHistory.startDate) {
            const date = new Date(trusteeHistory.startDate);
            date.setHours(0, 0, 0, 0);
            
            setContractInfo(prev => ({
              ...prev,
              startDate: date
            }));
          }
          
          // 종료일 설정
          if (trusteeHistory.endDate) {
            const date = new Date(trusteeHistory.endDate);
            date.setHours(0, 0, 0, 0);
            
            setContractInfo(prev => ({
              ...prev,
              expiryDate: date
            }));
          }
          
          // 보험 시작일 설정
          if (trusteeHistory.insuranceStartDate) {
            const date = new Date(trusteeHistory.insuranceStartDate);
            date.setHours(0, 0, 0, 0);
            
            setContractInfo(prev => ({
              ...prev,
              insuranceStartDate: date
            }));
          }
          
          // 보험 종료일 설정
          if (trusteeHistory.insuranceEndDate) {
            const date = new Date(trusteeHistory.insuranceEndDate);
            date.setHours(0, 0, 0, 0);
            
            setContractInfo(prev => ({
              ...prev,
              insuranceEndDate: date
            }));
          }
        }
      }
    }
  };

  const fetchDocumentCodes = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/codes/groups/001003/codes/active');
      if (!response.ok) throw new Error('첨부파일 코드 목록 조회 실패');
      const data = await response.json();
      setDocuments(data);
      
      if (data && data.length > 0) {
        const allDocumentIds = data.map(doc => doc.codeId);
        setSelectedDocumentIds(allDocumentIds);
      }
    } catch (error) {
      console.error('첨부파일 코드 목록 조회 중 오류:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/contract-pdf/templates');
      if (!response.ok) throw new Error('템플릿 목록 조회 실패');
      const data = await response.json();
      setTemplates(data);
      
      if (data && data.length > 0) {
        const allTemplateIds = data.map(template => template.id);
        setSelectedTemplateIds(allTemplateIds);
        
        const initialOrder = allTemplateIds.map((id, index) => ({
          id,
          order: index + 1
        }));
        setTemplateOrder(initialOrder);
      }
    } catch (error) {
      console.error('템플릿 목록 조회 중 오류:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/companies?active=true');
      if (!response.ok) throw new Error('위수탁 업체 목록 조회 실패');
      const data = await response.json();
      setCompanies(data);
    } catch (error) {
      console.error('위수탁 업체 목록 조회 중 오류:', error);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchCompanies();
    fetchDocumentCodes();
  }, []);

  const handleTemplateChange = (event, newValues) => {
    const newTemplateIds = newValues.map(template => template.id);
    setSelectedTemplateIds(newTemplateIds);
    
    const currentOrder = [...templateOrder];
    const newOrder = newTemplateIds.map((id, index) => {
      const existingOrderItem = currentOrder.find(item => item.id === id);
      return existingOrderItem || { id, order: index + 1 };
    });
    
    setTemplateOrder(newOrder);
  };
  
  const handleDocumentChange = (event, newValues) => {
    const newDocumentIds = newValues.map(doc => doc.codeId);
    setSelectedDocumentIds(newDocumentIds);
  };
  
  const handleMoveTemplate = (id, direction) => {
    const currentIndex = templateOrder.findIndex(item => item.id === id);
    if (
      (direction === 'up' && currentIndex === 0) || 
      (direction === 'down' && currentIndex === templateOrder.length - 1)
    ) {
      return;
    }
    
    const newOrder = [...templateOrder];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    [newOrder[currentIndex], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[currentIndex]];
    
    newOrder.forEach((item, index) => {
      item.order = index + 1;
    });
    
    setTemplateOrder(newOrder);
  };
  
  const handleRemoveTemplate = (id) => {
    const newSelectedIds = selectedTemplateIds.filter(templateId => templateId !== id);
    setSelectedTemplateIds(newSelectedIds);
    
    const newOrder = templateOrder.filter(item => item.id !== id)
      .map((item, index) => ({ ...item, order: index + 1 }));
    setTemplateOrder(newOrder);
  };

  const handleCompanySearchChange = (e) => {
    setCompanySearchTerm(e.target.value);
  };
  
  const filteredCompanies = companySearchTerm 
    ? companies.filter(company => 
        company.storeName?.toLowerCase().includes(companySearchTerm.toLowerCase()) ||
        company.businessNumber?.toLowerCase().includes(companySearchTerm.toLowerCase()) ||
        company.companyName?.toLowerCase().includes(companySearchTerm.toLowerCase())
      )
    : companies;

  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/[^\d]/g, '');
    
    if (!numbers) return '';
    
    if (numbers.length > 11) return value;
    
    if (numbers.length >= 7) {
      return numbers.replace(/(\d{3})(\d{4})(\d{0,4})/, '$1-$2-$3').replace(/-*$/, '');
    } else if (numbers.length >= 3) {
      return numbers.replace(/(\d{3})(\d{0,4})/, '$1-$2').replace(/-*$/, '');
    }
    return numbers;
  };

  const handleOpenCompanyDialog = () => setOpenCompanyDialog(true);
  const handleCloseCompanyDialog = () => setOpenCompanyDialog(false);

  const handleSelectCompanyAndTrustee = (company, trusteeHistory) => {
    setSelectedCompany(company);
    setSelectedTrusteeHistory(trusteeHistory);
    
    setContractInfo(prev => ({
      ...prev,
      companyId: company.id,
      trusteeHistoryId: trusteeHistory?.id || null
    }));
    
    if (trusteeHistory) {
      if (trusteeHistory.startDate) {
        const date = new Date(trusteeHistory.startDate);
        date.setHours(0, 0, 0, 0);
        setContractInfo(prev => ({ ...prev, startDate: date }));
      }
      
      if (trusteeHistory.endDate) {
        const date = new Date(trusteeHistory.endDate);
        date.setHours(0, 0, 0, 0);
        setContractInfo(prev => ({ ...prev, expiryDate: date }));
      }
      
      if (trusteeHistory.insuranceStartDate) {
        const date = new Date(trusteeHistory.insuranceStartDate);
        date.setHours(0, 0, 0, 0);
        setContractInfo(prev => ({ ...prev, insuranceStartDate: date }));
      }
      
      if (trusteeHistory.insuranceEndDate) {
        const date = new Date(trusteeHistory.insuranceEndDate);
        date.setHours(0, 0, 0, 0);
        setContractInfo(prev => ({ ...prev, insuranceEndDate: date }));
      }
      
      // 수탁사업자 정보가 있으면 대표자 정보를 첫 번째 참여자에 설정
      if (trusteeHistory.representativeName) {
        // 응답에서 받은 userId를 참여자 정보에 설정
        const newParticipant = {
          id: 1,
          name: trusteeHistory.representativeName || '',
          email: trusteeHistory.email || '',
          phone: trusteeHistory.phoneNumber ? formatPhoneNumber(trusteeHistory.phoneNumber) : '',
          sendMethod: 'EMAIL',
          userId: trusteeHistory.userId // 수탁사업자의 userId 정보를 참여자에 설정
        };
        
        
        setParticipants([newParticipant]);
      }
    }
    
    handleCloseCompanyDialog();
  };

  const handleCreateContractAndSendEmail = async () => {
    try {
      if (!contractInfo.title || contractInfo.title.trim() === '') {
        alert('계약 제목을 입력해주세요.');
        return;
      }

      if (!contractInfo.companyId) {
        alert('위수탁 업체를 선택해주세요.');
        return;
      }

      if (!contractInfo.createdBy || contractInfo.createdBy.trim() === '') {
        alert('담당자를 입력해주세요.');
        return;
      }

      if (!contractInfo.department || contractInfo.department.trim() === '') {
        alert('담당 부서를 입력해주세요.');
        return;
      }

      if (!contractInfo.description || contractInfo.description.trim() === '') {
        alert('계약 설명을 입력해주세요.');
        return;
      }

      if (!contractInfo.startDate) {
        alert('계약 시작일을 선택해주세요.');
        return;
      }

      if (!contractInfo.expiryDate) {
        alert('계약 만료일을 선택해주세요.');
        return;
      }

      if (selectedTemplateIds.length === 0) {
        alert('최소 하나 이상의 템플릿을 선택해주세요.');
        return;
      }

      if (selectedDocumentIds.length === 0) {
        alert('최소 하나 이상의 첨부파일을 선택해주세요.');
        return;
      }

      for (let i = 0; i < participants.length; i++) {
        const p = participants[i];
        
        if (!p.name || p.name.trim() === '') {
          alert(`${i+1}번째 참여자의 이름을 입력해주세요.`);
          return;
        }
        
        if (!p.email || p.email.trim() === '') {
          alert(`${i+1}번째 참여자의 이메일을 입력해주세요.`);
          return;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(p.email)) {
          alert(`${i+1}번째 참여자의 이메일 형식이 올바르지 않습니다.`);
          return;
        }

        if (!p.phone || p.phone.trim() === '') {
          alert(`${i+1}번째 참여자의 연락처를 입력해주세요.`);
          return;
        }
        
        const phoneRegex = /^\d{3}-\d{3,4}-\d{4}$/;
        if (!phoneRegex.test(p.phone)) {
          alert(`${i+1}번째 참여자의 연락처 형식이 올바르지 않습니다. (예: 010-1234-5678)`);
          return;
        }

        if (!p.sendMethod || p.sendMethod.trim() === '') {
          alert(`${i+1}번째 참여자의 발송 방법을 선택해주세요.`);
          return;
        }
      }
      
      setIsLoading(true);
      
      const orderedTemplateIds = templateOrder
        .sort((a, b) => a.order - b.order)
        .map(item => item.id);
      
      
      const response = await fetch('http://localhost:8080/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: contractInfo.title,
          description: contractInfo.description || '',
          templateIds: orderedTemplateIds,
          startDate: contractInfo.startDate ? formatDateForServer(contractInfo.startDate) : null,
          expiryDate: contractInfo.expiryDate ? formatDateForServer(contractInfo.expiryDate) : null,
          createdBy: contractInfo.createdBy,
          department: contractInfo.department,
          companyId: contractInfo.companyId,
          trusteeHistoryId: contractInfo.trusteeHistoryId,
          documentCodeIds: selectedDocumentIds,
          insuranceStartDate: contractInfo.insuranceStartDate ? formatDateForServer(contractInfo.insuranceStartDate) : null,
          insuranceEndDate: contractInfo.insuranceEndDate ? formatDateForServer(contractInfo.insuranceEndDate) : null,
          participants: participants.map(p => ({
            name: p.name,
            email: p.email,
            phoneNumber: p.phone,
            notifyType: p.sendMethod.toUpperCase(),
            signed: false,
            userId: p.userId
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('서버 응답 에러:', errorData);
        
        try {
          const parsedError = JSON.parse(errorData);
          if (parsedError.message) {
            throw new Error(parsedError.message);
          } else if (parsedError.error) {
            throw new Error(parsedError.error);
          }
        } catch (parseError) {
          if (errorData.includes("code not found") || errorData.includes("Status code not found")) {
            throw new Error("필요한 상태 코드를 찾을 수 없습니다. 관리자에게 문의하세요.");
          } else if (errorData.includes("EntityNotFoundException")) {
            throw new Error("필요한 기본 데이터를 찾을 수 없습니다. 관리자에게 문의하세요.");
          }
        }
        
        throw new Error(response.status === 500 ? 
          '서버 내부 오류가 발생했습니다. 관리자에게 문의하세요.' : 
          '계약 생성에 실패했습니다.');
      }

      const contractData = await response.json();

      const [emailResult, smsResult] = await Promise.all([
        sendContractEmail(contractData.id, contractData.participants),
        sendContractSMS(contractData.id, contractData.participants, contractInfo)
      ]);

      let message = '계약서가 생성되었습니다.';
      const notifications = [];

      if (emailResult.emailCount > 0) {
        notifications.push(
          emailResult.success 
            ? `이메일 발송 완료 (${emailResult.emailCount}명)` 
            : `이메일 발송 실패 (${emailResult.error})`
        );
      }

      if (smsResult.smsCount > 0) {
        notifications.push(
          smsResult.success 
            ? `알림톡 발송 완료 (${smsResult.smsCount}명)` 
            : `알림톡 발송 실패 (${smsResult.error})`
        );
      }

      if (notifications.length > 0) {
        message += '\n' + notifications.join('\n');
      }

      alert(message);
      navigate('/contract-list');

    } catch (error) {
      console.error('처리 중 오류:', error);
      alert(`처리 중 오류가 발생했습니다.\n${error.message || ''}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ 
      p: 3,
      backgroundColor: '#F8F8FE',
      minHeight: '100vh'
    }}>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600,
            color: '#3A3A3A'
          }}
        >
          계약 생성
        </Typography>
      </Box>

      <Box sx={{ 
        backgroundColor: 'white',
        borderRadius: 2,
        border: '1px solid #EEEEEE',
        p: 4,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        minHeight: 'calc(100vh - 140px)'
      }}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 3,
            pb: 2,
            borderBottom: '1px solid #EEEEEE'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                계약 정보
              </Typography>
              <Typography variant="caption" sx={{ color: '#FF4D4D', ml: 1 }}>
                (필수)
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr', mb: 3 }}>
            <TextField
              label="계약 제목"
              value={contractInfo.title}
              onChange={(e) => handleContractInfoChange('title', e.target.value)}
              fullWidth
              size="small"
              required
              InputLabelProps={{ required: true }}
            />
            
            <Box sx={{ position: 'relative' }}>
              <TextField
                label="매장명 (수탁사업자명)"
                value={selectedCompany ? 
                  `[${selectedCompany.storeCode || ''}] ${selectedCompany.storeName || ''}${selectedTrusteeHistory ? ` - ${selectedTrusteeHistory.trustee}` : ''}` 
                  : ''}
                fullWidth
                size="small"
                required
                InputLabelProps={{ required: true }}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        onClick={handleOpenCompanyDialog}
                      >
                        <EditIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                onClick={handleOpenCompanyDialog}
                sx={{ 
                  cursor: 'pointer',
                  '.MuiInputBase-input': { 
                    cursor: 'pointer',
                    caretColor: 'transparent'
                  }
                }}
              />
              {selectedCompany && (
                <Box sx={{ mt: 1, fontSize: '0.75rem', color: 'text.secondary' }}>
                  {selectedTrusteeHistory && (
                    <Typography variant="caption" display="block">
                      <strong>수탁코드:</strong> {selectedTrusteeHistory.trusteeCode} | <strong>대표자:</strong> {selectedTrusteeHistory.representativeName || '-'}
                    </Typography>
                  )}
                  {selectedTrusteeHistory && selectedTrusteeHistory.insuranceStartDate && selectedTrusteeHistory.insuranceEndDate ? (
                    <Typography variant="caption" color="primary" sx={{ fontSize: '0.7rem' }}>
                      <strong>하자보증보험:</strong> {new Date(selectedTrusteeHistory.insuranceStartDate).toLocaleDateString()} ~ {new Date(selectedTrusteeHistory.insuranceEndDate).toLocaleDateString()}
                    </Typography>
                  ) : selectedCompany.insuranceStartDate && selectedCompany.insuranceEndDate && (
                    <Typography variant="caption" color="primary" sx={{ fontSize: '0.7rem' }}>
                      <strong>하자보증보험:</strong> {new Date(selectedCompany.insuranceStartDate).toLocaleDateString()} ~ {new Date(selectedCompany.insuranceEndDate).toLocaleDateString()}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr', mb: 3 }}>
            <TextField
              label="담당자"
              value={contractInfo.createdBy}
              onChange={(e) => handleContractInfoChange('createdBy', e.target.value)}
              fullWidth
              size="small"
              required
              InputLabelProps={{ required: true }}
            />
            <TextField
              label="담당 부서"
              value={contractInfo.department}
              onChange={(e) => handleContractInfoChange('department', e.target.value)}
              fullWidth
              size="small"
              required
              InputLabelProps={{ required: true }}
            />
          </Box>

          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr', mb: 3 }}>
              <DatePicker
                label="계약 시작일"
                value={contractInfo.startDate}
                onChange={(newValue) => handleContractInfoChange('startDate', newValue)}
                slotProps={{ 
                  textField: { 
                    size: 'small',
                    required: true,
                    InputLabelProps: { required: true }
                  } 
                }}
              />
              <DatePicker
                label="계약 만료일"
                value={contractInfo.expiryDate}
                onChange={(newValue) => handleContractInfoChange('expiryDate', newValue)}
                slotProps={{ 
                  textField: { 
                    size: 'small',
                    required: true,
                    InputLabelProps: { required: true }
                  } 
                }}
              />
            </Box>
            
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr', mb: 3 }}>
              <DatePicker
                label="하자보증증권 보험시작일"
                value={contractInfo.insuranceStartDate}
                onChange={(newValue) => handleContractInfoChange('insuranceStartDate', newValue)}
                slotProps={{ 
                  textField: { 
                    size: 'small',
                    required: false
                  } 
                }}
              />
              <DatePicker
                label="하자보증증권 보험종료일"
                value={contractInfo.insuranceEndDate}
                onChange={(newValue) => handleContractInfoChange('insuranceEndDate', newValue)}
                slotProps={{ 
                  textField: { 
                    size: 'small',
                    required: false
                  } 
                }}
              />
            </Box>
          </LocalizationProvider>

          <TextField
            label="계약 설명"
            value={contractInfo.description}
            onChange={(e) => handleContractInfoChange('description', e.target.value)}
            fullWidth
            multiline
            rows={3}
            size="small"
            required
            InputLabelProps={{ required: true }}
          />
        </Box>

        <Box sx={{ mb: 4 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 3,
            pb: 2,
            borderBottom: '1px solid #EEEEEE'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                수탁사업자
              </Typography>
              <Typography variant="caption" sx={{ color: '#FF4D4D', ml: 1 }}>
                (필수)
              </Typography>
            </Box>
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddParticipant}
              sx={{ 
                color: '#1976d2',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.04)'
                }
              }}
            >
              수탁사업자 추가하기
            </Button>
          </Box>

          {participants.map((participant) => (
            <Box 
              key={participant.id} 
              sx={{ 
                display: 'flex', 
                gap: 2, 
                mb: 2 
              }}
            >
              <TextField
                placeholder="이름"
                size="small"
                value={participant.name}
                onChange={(e) => handleParticipantChange(participant.id, 'name', e.target.value)}
                required
                sx={{ 
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#E0E0E0',
                    },
                  },
                }}
              />
              <TextField
                placeholder="E-mail"
                size="small"
                value={participant.email}
                onChange={(e) => handleParticipantChange(participant.id, 'email', e.target.value)}
                required
                sx={{ 
                  flex: 2,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#E0E0E0',
                    },
                  },
                }}
              />
              <TextField
                placeholder="연락처"
                size="small"
                value={participant.phone}
                onChange={(e) => handleParticipantChange(participant.id, 'phone', formatPhoneNumber(e.target.value))}
                required
                sx={{ 
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#E0E0E0',
                    },
                  },
                }}
              />
              <FormControl size="small" sx={{ flex: 1 }} required>
                <Select
                  displayEmpty
                  value={participant.sendMethod}
                  onChange={(e) => handleParticipantChange(participant.id, 'sendMethod', e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#E0E0E0',
                    },
                  }}
                  required
                >
                  <MenuItem value="">발송 방법</MenuItem>
                  <MenuItem value="EMAIL">이메일</MenuItem>
                  <MenuItem value="KAKAO">알림톡</MenuItem>
                </Select>
              </FormControl>
              <IconButton 
                size="small"
                onClick={() => handleRemoveParticipant(participant.id)}
                sx={{ 
                  backgroundColor: '#F8F9FA',
                  '&:hover': {
                    backgroundColor: '#E0E0E0'
                  }
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>

        <Box sx={{ mb: 4 }}>
          <Box sx={{ 
            mb: 3,
            pb: 2,
            borderBottom: '1px solid #EEEEEE'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  필수 첨부파일 선택
                </Typography>
                <Typography variant="caption" sx={{ color: '#FF4D4D', ml: 1 }}>
                  (필수)
                </Typography>
              </Box>
              <Button
                size="small"
                onClick={() => {
                  if (selectedDocumentIds.length === documents.length) {
                    setSelectedDocumentIds([]);
                  } else {
                    setSelectedDocumentIds(documents.map(doc => doc.codeId));
                  }
                }}
                sx={{ fontSize: '0.75rem' }}
              >
                {selectedDocumentIds.length === documents.length ? '모두 해제' : '모두 선택'}
              </Button>
            </Box>
          </Box>
          <Autocomplete
            multiple
            id="documents-select"
            options={documents}
            value={documents.filter(doc => selectedDocumentIds.includes(doc.codeId))}
            onChange={handleDocumentChange}
            getOptionLabel={(option) => option.codeName}
            isOptionEqualToValue={(option, value) => option.codeId === value.codeId}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                placeholder="필수 첨부파일 선택"
                label="첨부파일 종류"
                required
                InputLabelProps={{ required: true }}
              />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="body2">{option.codeName}</Typography>
                  {option.description && (
                    <Typography variant="caption" color="text.secondary">
                      {option.description}
                    </Typography>
                  )}
                </Box>
              </li>
            )}
            noOptionsText="사용 가능한 첨부파일이 없습니다"
            sx={{ width: '100%' }}
          />
          
          {selectedDocumentIds.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                선택된 첨부파일
              </Typography>
              <Box sx={{ 
                border: '1px solid #E0E0E0', 
                borderRadius: 1, 
                p: 1,
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {selectedDocumentIds.map((codeId, index) => {
                  const document = documents.find(d => d.codeId === codeId);
                  if (!document) return null;
                  
                  return (
                    <Box 
                      key={document.codeId}
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        p: 1,
                        mb: 0.5,
                        border: '1px solid #F0F0F0',
                        borderRadius: 1,
                        '&:hover': { backgroundColor: '#F8F9FA' }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DescriptionIcon 
                          fontSize="small" 
                          sx={{ color: '#3182F6', mr: 1 }} 
                        />
                        <Box>
                          <Typography variant="body2">{document.codeName}</Typography>
                          {document.description && (
                            <Typography variant="caption" color="text.secondary">
                              {document.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <IconButton 
                        size="small" 
                        onClick={() => {
                          setSelectedDocumentIds(selectedDocumentIds.filter(id => id !== codeId));
                        }}
                        sx={{ color: '#FF4D4D' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
        </Box>

        <Box>
          <Box sx={{ 
            mb: 3,
            pb: 2,
            borderBottom: '1px solid #EEEEEE'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  계약서 선택
                </Typography>
                <Typography variant="caption" sx={{ color: '#FF4D4D', ml: 1 }}>
                  (필수)
                </Typography>
              </Box>
              <Button
                size="small"
                onClick={() => {
                  if (selectedTemplateIds.length === templates.length) {
                    setSelectedTemplateIds([]);
                    setTemplateOrder([]);
                  } else {
                    const allTemplateIds = templates.map(template => template.id);
                    setSelectedTemplateIds(allTemplateIds);
                    
                    const initialOrder = allTemplateIds.map((id, index) => ({
                      id,
                      order: index + 1
                    }));
                    setTemplateOrder(initialOrder);
                  }
                }}
                sx={{ fontSize: '0.75rem' }}
              >
                {selectedTemplateIds.length === templates.length ? '모두 해제' : '모두 선택'}
              </Button>
            </Box>
          </Box>
          <Autocomplete
            multiple
            id="templates-select"
            options={templates}
            value={templates.filter(template => selectedTemplateIds.includes(template.id))}
            onChange={handleTemplateChange}
            getOptionLabel={(option) => option.templateName}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                placeholder="계약서 템플릿 선택"
                label="계약서 템플릿"
                required
                InputLabelProps={{ required: true }}
              />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="body2">{option.templateName}</Typography>
                  {option.description && (
                    <Typography variant="caption" color="text.secondary">
                      {option.description}
                    </Typography>
                  )}
                </Box>
              </li>
            )}
            noOptionsText="사용 가능한 템플릿이 없습니다"
            sx={{ width: '100%' }}
          />
          
          {selectedTemplateIds.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                선택된 템플릿 (서명 순서)
              </Typography>
              <Box sx={{ 
                border: '1px solid #E0E0E0', 
                borderRadius: 1, 
                p: 1,
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {templateOrder
                  .sort((a, b) => a.order - b.order)
                  .map((item) => {
                    const template = templates.find(t => t.id === item.id);
                    if (!template) return null;
                    
                    return (
                      <Box 
                        key={template.id}
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          p: 1,
                          mb: 0.5,
                          border: '1px solid #F0F0F0',
                          borderRadius: 1,
                          '&:hover': { backgroundColor: '#F8F9FA' }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              bgcolor: '#3182F6',
                              color: 'white',
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mr: 1
                            }}
                          >
                            {item.order}
                          </Typography>
                          <Box>
                            <Typography variant="body2">{template.templateName}</Typography>
                            {template.description && (
                              <Typography variant="caption" color="text.secondary">
                                {template.description}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        
                        <Box>
                          <IconButton 
                            size="small" 
                            disabled={item.order === 1}
                            onClick={() => handleMoveTemplate(item.id, 'up')}
                          >
                            <ArrowUpwardIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            disabled={item.order === templateOrder.length}
                            onClick={() => handleMoveTemplate(item.id, 'down')}
                          >
                            <ArrowDownwardIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleRemoveTemplate(item.id)}
                            sx={{ color: '#FF4D4D' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    );
                  })}
              </Box>
            </Box>
          )}
        </Box>

        <Box sx={{ 
          display: 'flex',
          justifyContent: 'center',
          mt: 'auto',
          pt: 4
        }}>
          <Button
            variant="contained"
            onClick={handleCreateContractAndSendEmail}
            disabled={isLoading}
            sx={{
              px: 4,
              py: 1.5,
              backgroundColor: '#1976d2',
              '&:hover': {
                backgroundColor: '#1565c0',
              },
              '&.Mui-disabled': {
                backgroundColor: '#1976d2',
                opacity: 0.7,
              },
              borderRadius: '8px',
              fontSize: '1rem',
              minWidth: '200px',
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
                    left: '20px'
                  }}
                />
                처리 중...
              </>
            ) : (
              '저장 및 서명요청 발송'
            )}
          </Button>
        </Box>
      </Box>

      <CompanySelectDialog
        open={openCompanyDialog}
        onClose={handleCloseCompanyDialog}
        onSelect={handleSelectCompanyAndTrustee}
      />

    </Box>
  );
};

export default ContractSend; 