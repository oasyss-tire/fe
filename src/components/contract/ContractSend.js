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
} from '@mui/material';
import { 
  Search as SearchIcon,
  Close as CloseIcon,
  Add as AddIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
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
    { id: 1, name: '', email: '', phone: '', sendMethod: '', userId: null }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const [contractInfo, setContractInfo] = useState({
    title: '',
    description: '',
    startDate: null,
    expiryDate: null,
    deadlineDate: null,
    createdBy: '',
    department: '',
    companyId: ''
  });

  const [templates, setTemplates] = useState([]);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState([]);
  const [templateOrder, setTemplateOrder] = useState([]);
  const [companies, setCompanies] = useState([]);

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

    // 회사 선택 시 계약 시작일과 만료일을 자동으로 설정
    if (field === 'companyId' && value) {
      const selectedCompany = companies.find(company => company.id === value);
      if (selectedCompany) {
        // 회사의 startDate와 endDate가 있는 경우에만 적용
        if (selectedCompany.startDate) {
          setContractInfo(prev => ({
            ...prev,
            startDate: new Date(selectedCompany.startDate)
          }));
        }
        if (selectedCompany.endDate) {
          setContractInfo(prev => ({
            ...prev,
            expiryDate: new Date(selectedCompany.endDate)
          }));
        }
      }
      
      // 회사 직원 정보 자동 불러오기
      fetchCompanyUsers(value);
    }
  };

  // 회사 사용자 정보 조회 함수 수정
  const fetchCompanyUsers = async (companyId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/companies/${companyId}/users`);
      if (!response.ok) throw new Error('회사 사용자 목록 조회 실패');
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        // 회사 직원 정보로 참여자 설정 (userId 필드 추가)
        const newParticipants = data.map((user, index) => ({
          id: index + 1,
          name: user.userName || '',
          email: user.email || '',
          phone: user.phoneNumber || '',
          sendMethod: '',  // 발송 방법은 사용자가 선택하도록 비워둠
          userId: user.id  // 사용자 ID 추가
        }));
        
        setParticipants(newParticipants);
        
        // 콘솔에 로그만 출력하고 알림은 표시하지 않음
        console.log(`회사 직원 ${newParticipants.length}명의 정보가 자동으로 입력되었습니다.`);
      } else {
        // 직원 정보가 없을 경우 기본 참여자 1명 설정
        setParticipants([
          { id: 1, name: '', email: '', phone: '', sendMethod: '', userId: null }
        ]);
        console.log('조회된 회사 직원 정보가 없습니다. 참여자 정보를 직접 입력해주세요.');
      }
    } catch (error) {
      console.error('회사 사용자 목록 조회 중 오류:', error);
      // 오류 발생 시 기본 참여자 1명 설정
      setParticipants([
        { id: 1, name: '', email: '', phone: '', sendMethod: '', userId: null }
      ]);
    }
  };

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

  // 회사 목록 조회
  const fetchCompanies = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/companies?active=true');
      if (!response.ok) throw new Error('회사 목록 조회 실패');
      const data = await response.json();
      setCompanies(data);
    } catch (error) {
      console.error('회사 목록 조회 중 오류:', error);
    }
  };

  // 첨부파일 코드 목록 조회 함수 추가
  const fetchDocumentCodes = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/codes/groups/001003/codes/active');
      if (!response.ok) throw new Error('첨부파일 코드 목록 조회 실패');
      const data = await response.json();
      setDocuments(data);
      console.log('첨부파일 코드 목록:', data); // 데이터 구조 확인용 로그
    } catch (error) {
      console.error('첨부파일 코드 목록 조회 중 오류:', error);
    }
  };

  // 컴포넌트 마운트 시 템플릿, 회사, 첨부파일 코드 목록 조회
  useEffect(() => {
    fetchTemplates();
    fetchCompanies();
    fetchDocumentCodes();
  }, []);

  // 템플릿 선택 핸들러 수정
  const handleTemplateChange = (event, newValues) => {
    const newTemplateIds = newValues.map(template => template.id);
    setSelectedTemplateIds(newTemplateIds);
    
    // 새로 선택된 템플릿들의 순서 정보 업데이트
    const currentOrder = [...templateOrder];
    const newOrder = newTemplateIds.map((id, index) => {
      const existingOrderItem = currentOrder.find(item => item.id === id);
      return existingOrderItem || { id, order: index + 1 };
    });
    
    setTemplateOrder(newOrder);
  };
  
  // 첨부파일 선택 핸들러 추가
  const handleDocumentChange = (event, newValues) => {
    const newDocumentIds = newValues.map(doc => doc.codeId);
    setSelectedDocumentIds(newDocumentIds);
  };
  
  // 템플릿 순서 변경 핸들러
  const handleMoveTemplate = (id, direction) => {
    const currentIndex = templateOrder.findIndex(item => item.id === id);
    if (
      (direction === 'up' && currentIndex === 0) || 
      (direction === 'down' && currentIndex === templateOrder.length - 1)
    ) {
      return; // 이동 불가능한 경우
    }
    
    const newOrder = [...templateOrder];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // 위치 교환
    [newOrder[currentIndex], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[currentIndex]];
    
    // 순서 번호 재할당
    newOrder.forEach((item, index) => {
      item.order = index + 1;
    });
    
    setTemplateOrder(newOrder);
  };
  
  // 템플릿 제거 핸들러
  const handleRemoveTemplate = (id) => {
    const newSelectedIds = selectedTemplateIds.filter(templateId => templateId !== id);
    setSelectedTemplateIds(newSelectedIds);
    
    const newOrder = templateOrder.filter(item => item.id !== id)
      .map((item, index) => ({ ...item, order: index + 1 }));
    setTemplateOrder(newOrder);
  };

  // 회사 검색어 변경 핸들러
  const handleCompanySearchChange = (e) => {
    setCompanySearchTerm(e.target.value);
  };
  
  // 회사 목록 필터링
  const filteredCompanies = companySearchTerm 
    ? companies.filter(company => 
        company.storeName?.toLowerCase().includes(companySearchTerm.toLowerCase()) ||
        company.businessNumber?.toLowerCase().includes(companySearchTerm.toLowerCase()) ||
        company.companyName?.toLowerCase().includes(companySearchTerm.toLowerCase())
      )
    : companies;

  const formatPhoneNumber = (value) => {
    // 이전 값과 현재 값의 길이를 비교하여 삭제 중인지 확인
    const numbers = value.replace(/[^\d]/g, '');
    
    // 빈 값이면 그대로 반환
    if (!numbers) return '';
    
    // 숫자만 남기고 모두 제거한 후 길이 체크
    if (numbers.length > 11) return value;
    
    // 숫자를 3-4-4 형식으로 포맷팅
    if (numbers.length >= 7) {
      return numbers.replace(/(\d{3})(\d{4})(\d{0,4})/, '$1-$2-$3').replace(/-*$/, '');
    } else if (numbers.length >= 3) {
      return numbers.replace(/(\d{3})(\d{0,4})/, '$1-$2').replace(/-*$/, '');
    }
    return numbers;
  };

  // 계약 생성 및 이메일 발송을 처리하는 함수
  const handleCreateContractAndSendEmail = async () => {
    try {
      if (!contractInfo.companyId) {
        alert('회사를 선택해주세요.');
        return;
      }

      if (selectedTemplateIds.length === 0) {
        alert('최소 하나 이상의 템플릿을 선택해주세요.');
        return;
      }
      
      setIsLoading(true);  // 로딩 시작
      
      // 순서에 따라 템플릿 ID 정렬
      const orderedTemplateIds = templateOrder
        .sort((a, b) => a.order - b.order)
        .map(item => item.id);
      
      // 계약 생성 요청 - userId 필드 추가
      const response = await fetch('http://localhost:8080/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: contractInfo.title,
          description: contractInfo.description || '',
          templateIds: orderedTemplateIds, // 순서가 적용된 템플릿 ID 목록
          startDate: contractInfo.startDate,
          expiryDate: contractInfo.expiryDate,
          deadlineDate: contractInfo.deadlineDate,
          createdBy: contractInfo.createdBy,
          department: contractInfo.department,
          companyId: contractInfo.companyId,
          documentCodeIds: selectedDocumentIds, // 첨부파일 코드 ID 목록 추가
          participants: participants.map(p => ({
            name: p.name,
            email: p.email,
            phoneNumber: p.phone,
            notifyType: p.sendMethod.toUpperCase(),
            signed: false,
            userId: p.userId // 사용자 ID 추가
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
    } finally {
      setIsLoading(false);  // 로딩 종료
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
            <Autocomplete
              size="small"
              options={companies}
              loading={companies.length === 0}
              getOptionLabel={(option) => option.storeName || ''}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={companies.find(company => company.id === contractInfo.companyId) || null}
              onChange={(event, newValue) => {
                handleContractInfoChange('companyId', newValue ? newValue.id : '');
              }}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="계약 위수탁 업체" 
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {companies.length === 0 ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="body2">{option.storeName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.businessNumber} {option.companyName ? `| ${option.companyName}` : ''}
                    </Typography>
                    {option.startDate && option.endDate && (
                      <Typography variant="caption" color="primary" sx={{ fontSize: '0.7rem' }}>
                        계약 기간: {new Date(option.startDate).toLocaleDateString()} ~ {new Date(option.endDate).toLocaleDateString()}
                      </Typography>
                    )}
                  </Box>
                </li>
              )}
              noOptionsText="검색 결과가 없습니다"
              loadingText="회사 목록을 불러오는 중..."
              filterOptions={(options, { inputValue }) => {
                return options.filter(option => 
                  option.storeName?.toLowerCase().includes(inputValue.toLowerCase()) ||
                  option.businessNumber?.toLowerCase().includes(inputValue.toLowerCase()) ||
                  option.companyName?.toLowerCase().includes(inputValue.toLowerCase())
                );
              }}
              PaperComponent={(props) => (
                <Paper 
                  {...props} 
                  sx={{ 
                    maxHeight: 300,
                    overflowY: 'auto',
                    width: 'auto',
                    minWidth: '400px'
                  }} 
                />
              )}
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
                onChange={(e) => handleParticipantChange(participant.id, 'phone', formatPhoneNumber(e.target.value))}
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

        {/* 첨부파일 섹션 추가 */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ 
            mb: 3,
            pb: 2,
            borderBottom: '1px solid #EEEEEE'
          }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              필수 첨부파일 선택
            </Typography>
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
          
          {/* 선택된 첨부파일 표시 */}
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
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
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
          
          {/* 선택된 템플릿 표시 - 순서 조정 가능 */}
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
    </Box>
  );
};

export default ContractSend; 