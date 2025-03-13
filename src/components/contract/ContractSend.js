import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button,
  TextField,
  IconButton,
  Select,
  MenuItem,
  FormControl
} from '@mui/material';
import { 
  Search as SearchIcon,
  Close as CloseIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { ko } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { sendContractEmail } from '../../services/EmailService';
import { sendContractSMS } from '../../services/SMSService';

const ContractSend = () => {
  const [participants, setParticipants] = useState([
    { id: 1, name: '', email: '', phone: '', sendMethod: '' }
  ]);

  const [contractInfo, setContractInfo] = useState({
    title: '',
    description: '',
    startDate: null,
    expiryDate: null,
    deadlineDate: null,
    createdBy: '',
    department: '',
    contractNumber: ''
  });

  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  const navigate = useNavigate();

  const handleAddParticipant = () => {
    const newParticipant = {
      id: participants.length + 1,
      name: '',
      email: '',
      phone: '',
      sendMethod: ''
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
  };

  // 계약번호 자동 생성 함수
  const generateContractNumber = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `CT-${year}-${month}${day}-${random}`;
    // 예: CT-2024-0315-001
  };

  // 컴포넌트 마운트 시 계약번호 자동 생성
  useEffect(() => {
    setContractInfo(prev => ({
      ...prev,
      contractNumber: generateContractNumber()
    }));
  }, []);

  // 템플릿 목록 조회
  const fetchTemplates = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/contract-pdf/templates');
      if (!response.ok) throw new Error('템플릿 목록 조회 실패');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('템플릿 목록 조회 중 오류:', error);
    }
  };

  // 컴포넌트 마운트 시 템플릿 목록 조회
  useEffect(() => {
    fetchTemplates();
  }, []);

  // 템플릿 선택 핸들러
  const handleTemplateChange = (event) => {
    setSelectedTemplateId(event.target.value);
  };

  // 계약 생성 및 이메일 발송을 처리하는 새로운 함수
  const handleCreateContractAndSendEmail = async () => {
    try {
      // 1. 계약 생성
      const response = await fetch('http://localhost:8080/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: contractInfo.title,
          description: contractInfo.description || '',
          templateId: selectedTemplateId,
          startDate: contractInfo.startDate,
          expiryDate: contractInfo.expiryDate,
          deadlineDate: contractInfo.deadlineDate,
          createdBy: contractInfo.createdBy,
          department: contractInfo.department,
          contractNumber: contractInfo.contractNumber,
          participants: participants.map(p => ({
            name: p.name,
            email: p.email,
            phoneNumber: p.phone,
            notifyType: p.sendMethod.toUpperCase(),
            signed: false
          }))
        })
      });

      if (!response.ok) {
        throw new Error('계약 생성 실패');
      }

      const contractData = await response.json();

      // 2. 알림 발송 (이메일 & SMS)
      const [emailResult, smsResult] = await Promise.all([
        sendContractEmail(contractData.id, contractData.participants),
        sendContractSMS(contractData.id, contractData.participants)
      ]);

      // 3. 결과 처리
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
            ? `SMS 발송 완료 (${smsResult.smsCount}명)` 
            : `SMS 발송 실패 (${smsResult.error})`
        );
      }

      if (notifications.length > 0) {
        message += '\n' + notifications.join('\n');
      }

      alert(message);
      navigate('/contract-list');

    } catch (error) {
      console.error('처리 중 오류:', error);
      alert('처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <Box sx={{ 
      p: 3,
      backgroundColor: '#F8F8FE',
      minHeight: '100vh'
    }}>
      {/* 상단 헤더 */}
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

      {/* 메인 컨텐츠 - 흰색 배경의 Paper */}
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
        {/* 계약 정보 섹션 추가 */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 3,
            pb: 2,
            borderBottom: '1px solid #EEEEEE'
          }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              계약 정보
            </Typography>
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr', mb: 3 }}>
            <TextField
              label="계약 제목"
              value={contractInfo.title}
              onChange={(e) => handleContractInfoChange('title', e.target.value)}
              fullWidth
              size="small"
            />
            <TextField
              label="계약 번호"
              value={contractInfo.contractNumber}
              InputProps={{
                readOnly: true,
              }}
              fullWidth
              size="small"
            />
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr', mb: 3 }}>
            <TextField
              label="담당자"
              value={contractInfo.createdBy}
              onChange={(e) => handleContractInfoChange('createdBy', e.target.value)}
              fullWidth
              size="small"
            />
            <TextField
              label="담당 부서"
              value={contractInfo.department}
              onChange={(e) => handleContractInfoChange('department', e.target.value)}
              fullWidth
              size="small"
            />
          </Box>

          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr 1fr', mb: 3 }}>
              <DateTimePicker
                label="계약 시작일"
                value={contractInfo.startDate}
                onChange={(newValue) => handleContractInfoChange('startDate', newValue)}
                slotProps={{ textField: { size: 'small' } }}
              />
              <DateTimePicker
                label="계약 만료일"
                value={contractInfo.expiryDate}
                onChange={(newValue) => handleContractInfoChange('expiryDate', newValue)}
                slotProps={{ textField: { size: 'small' } }}
              />
              <DateTimePicker
                label="서명 마감일"
                value={contractInfo.deadlineDate}
                onChange={(newValue) => handleContractInfoChange('deadlineDate', newValue)}
                slotProps={{ textField: { size: 'small' } }}
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
          />
        </Box>

        {/* 서명 참여자 섹션 */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 3,
            pb: 2,
            borderBottom: '1px solid #EEEEEE'
          }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              서명 참여자
            </Typography>
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
              참여자 추가하기
            </Button>
          </Box>

          {/* 참여자 입력 폼 */}
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
                onChange={(e) => handleParticipantChange(participant.id, 'phone', e.target.value)}
                sx={{ 
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#E0E0E0',
                    },
                  },
                }}
              />
              <FormControl size="small" sx={{ flex: 1 }}>
                <Select
                  displayEmpty
                  value={participant.sendMethod}
                  onChange={(e) => handleParticipantChange(participant.id, 'sendMethod', e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#E0E0E0',
                    },
                  }}
                >
                  <MenuItem value="">발송 방법</MenuItem>
                  <MenuItem value="email">이메일</MenuItem>
                  <MenuItem value="sms">SMS</MenuItem>
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

        {/* 계약서 선택 섹션 */}
        <Box>
          <Box sx={{ 
            mb: 3,
            pb: 2,
            borderBottom: '1px solid #EEEEEE'
          }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              계약서 선택
            </Typography>
          </Box>
          <FormControl fullWidth>
            <Select
              value={selectedTemplateId}
              onChange={handleTemplateChange}
              displayEmpty
              sx={{
                backgroundColor: '#F8F9FA',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderStyle: 'dashed',
                  borderColor: '#E0E0E0'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#1976d2'
                }
              }}
            >
              <MenuItem value="" disabled>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#666' }}>
                  <SearchIcon />
                  <Typography>계약서 템플릿에서 선택하기</Typography>
                </Box>
              </MenuItem>
              {templates.map((template) => (
                <MenuItem key={template.id} value={template.id}>
                  <Box>
                    <Typography>{template.templateName}</Typography>
                    {template.description && (
                      <Typography variant="caption" color="text.secondary">
                        {template.description}
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* 하단 버튼 - 가운데 정렬 */}
        <Box sx={{ 
          display: 'flex',
          justifyContent: 'center',
          mt: 'auto',
          pt: 4
        }}>
          <Button
            variant="contained"
            onClick={handleCreateContractAndSendEmail}
            sx={{
              px: 4,
              py: 1.5,
              backgroundColor: '#1976d2',
              '&:hover': {
                backgroundColor: '#1565c0',
              },
              borderRadius: '8px',
              fontSize: '1rem',
              minWidth: '200px'
            }}
          >
            저장 및 서명요청 발송
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ContractSend; 