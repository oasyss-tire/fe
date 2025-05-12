import React, { useState, useEffect } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  Divider,
  Grid,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import { Close as CloseIcon, Info as InfoIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { ko } from 'date-fns/locale';
import { addYears, format, isAfter, parseISO, addDays } from 'date-fns';
import { sendContractEmail } from '../../services/EmailService';
import { sendContractSMS } from '../../services/SMSService';

const ContractRenewModal = ({ open, onClose, contract, company, onSuccess }) => {


  // 문자열 형식의 날짜를 안전하게 파싱
  const parseDate = (dateString) => {
    if (!dateString) return new Date();
    
    try {
      // 문자열에서 시간 부분 제거하고 날짜만 파싱
      const datePart = dateString.split('T')[0];
      
      // yyyy-MM-dd 형식으로 파싱
      const [year, month, day] = datePart.split('-').map(num => parseInt(num, 10));
      const date = new Date(year, month - 1, day); // 월은 0부터 시작하므로 -1 해줌
      
      // 유효한 날짜인지 확인
      if (isNaN(date.getTime())) {
        console.error(`Invalid date: ${dateString}, parsed as:`, date);
        return new Date();
      }
      
      return date;
    } catch (error) {
      console.error(`Error parsing date ${dateString}:`, error);
      return new Date();
    }
  };

  // contract 객체가 존재하는지 확인하고 날짜 정보 추출
  const hasValidContractDates = contract && (contract.expiryDate || contract.insuranceEndDate);
  

  
  // contract 객체가 없거나 날짜 정보가 없으면 컴포넌트를 렌더링하지 않음
  useEffect(() => {
    if (open && !hasValidContractDates) {
      console.error('계약 정보가 없거나 날짜 정보가 누락되었습니다.');
      onClose();
    }
  }, [open, hasValidContractDates, onClose]);
  
  const prevExpiryDate = parseDate(contract?.expiryDate);
  const prevInsuranceEndDate = parseDate(contract?.insuranceEndDate);
  
 
  
  // 초기 날짜 값 설정 (계약 데이터가 유효한 경우에만)
  const initialStartDate = hasValidContractDates ? addDays(prevExpiryDate, 1) : null;
  const initialInsuranceStartDate = hasValidContractDates ? addDays(prevInsuranceEndDate, 1) : null;
  


  // 상태 관리
  const [startDate, setStartDate] = useState(initialStartDate);
  const [expiryDate, setExpiryDate] = useState(null);
  const [insuranceStartDate, setInsuranceStartDate] = useState(initialInsuranceStartDate);
  const [insuranceEndDate, setInsuranceEndDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // contract 객체가 변경될 때마다 초기값 업데이트
  useEffect(() => {
    if (hasValidContractDates) {
      const newPrevExpiryDate = parseDate(contract?.expiryDate);
      const newPrevInsuranceEndDate = parseDate(contract?.insuranceEndDate);
      
      setStartDate(addDays(newPrevExpiryDate, 1));
      setInsuranceStartDate(addDays(newPrevInsuranceEndDate, 1));
      
    }
  }, [contract, hasValidContractDates]);

  // 날짜 형식 변환 함수 (YYYY-MM-DD)
  const formatDateForServer = (date) => {
    if (!date) return null;
    return format(date, 'yyyy-MM-dd');
  };

  // 재계약 요청 처리
  const handleRenewContract = async () => {
    setLoading(true);
    setError(null);

    try {
      // 유효성 검사
      if (!startDate || !expiryDate || !insuranceStartDate || !insuranceEndDate) {
        throw new Error('모든 날짜 필드는 필수 입력값입니다.');
      }

      // 시작일이 기존 종료일보다 이전인지 확인
      if (contract?.expiryDate && isAfter(new Date(contract.expiryDate), startDate)) {
        throw new Error('새 계약 시작일은 기존 계약 종료일 이후로 설정해주세요.');
      }
      
      // 보험시작일이 기존 보험종료일보다 이전인지 확인
      if (contract?.insuranceEndDate && isAfter(new Date(contract.insuranceEndDate), insuranceStartDate)) {
        throw new Error('새 보험 시작일은 기존 보험 종료일 이후로 설정해주세요.');
      }

      if (isAfter(startDate, expiryDate)) {
        throw new Error('계약 종료일은 시작일 이후로 설정해주세요.');
      }

      if (isAfter(insuranceStartDate, insuranceEndDate)) {
        throw new Error('보험 종료일은 시작일 이후로 설정해주세요.');
      }

      // API 요청 데이터 구성
      const requestData = {
        startDate: formatDateForServer(startDate),
        expiryDate: formatDateForServer(expiryDate),
        insuranceStartDate: formatDateForServer(insuranceStartDate),
        insuranceEndDate: formatDateForServer(insuranceEndDate)
      };

      // API 호출
      const response = await fetch(`http://localhost:8080/api/companies/${company.id}/renew-contract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '재계약 처리 중 오류가 발생했습니다.');
      }

      const result = await response.json();
      
      // 알림 메시지 기본 설정
      let message = '재계약이 성공적으로 신청되었습니다.';
      
      // 생성된 계약 정보에 대해 이메일 및 SMS 발송 (ContractSend.js와 동일한 방식)
      if (result.id && result.participants && result.participants.length > 0) {
        try {
          // 계약 제목 준비 (API 응답, 수탁업체 정보 활용)
          const contractTitle = result.title || `${company?.storeName || ''} - 재계약`;
          
          // 이메일과 SMS 발송 요청을 병렬로 처리 (계약 제목 명시적 전달)
          const [emailResult, smsResult] = await Promise.all([
            sendContractEmail(result.id, result.participants, contractTitle),
            sendContractSMS(result.id, result.participants, {
              title: contractTitle,
              createdBy: result.createdBy || '관리자'
            })
          ]);
          
          // 알림 메시지 구성
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
        } catch (notifyError) {
          console.error('알림 발송 중 오류:', notifyError);
          message += '\n알림 발송 중 오류가 발생했습니다.';
        }
      } else {
        message += '\n서명 참여자 정보가 없습니다.';
      }
      
      // 성공 메시지 표시
      alert(message);
      
      // 성공 시 콜백 호출
      if (onSuccess) {
        onSuccess(result);
      }
      
      onClose();
    } catch (error) {
      console.error('재계약 처리 중 오류:', error);
      setError(error.message || '재계약 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? null : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          재계약 신청
        </Typography>
        <IconButton 
          edge="end" 
          onClick={onClose}
          disabled={loading}
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ py: 3 }}>
        {/* 계약 정보 표시 */}
        <Box sx={{ mb: 3, p: 2, backgroundColor: '#F8F9FA', borderRadius: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            기존 계약 정보
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                매장명: {company?.storeName || '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                수탁사업자명: {company?.trustee || company?.companyName || '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                기존 계약 시작일: {contract?.startDate ? new Date(contract.startDate).toLocaleDateString() : '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                기존 계약 종료일: {contract?.expiryDate ? new Date(contract.expiryDate).toLocaleDateString() : '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                기존 보험 시작일: {contract?.insuranceStartDate ? new Date(contract.insuranceStartDate).toLocaleDateString() : '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                기존 보험 종료일: {contract?.insuranceEndDate ? new Date(contract.insuranceEndDate).toLocaleDateString() : '-'}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* 오류 메시지 */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* 안내 메시지 */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            재계약은 기존 계약의 모든 정보(템플릿, 참여자 등)를 그대로 가져와서 새 계약 기간으로 생성합니다.<br/>
            하자보증증권 보험기간이 실질적인 계약 기간으로 사용되므로 모든 날짜 필드를 정확히 입력해주세요.
          </Typography>
        </Alert>

        {/* 날짜 입력 필드 */}
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          새 계약 정보 설정
        </Typography>
        
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                  계약 시작일
                  <Typography component="span" sx={{ color: '#FF4D4D', ml: 0.5 }}>*</Typography>
                  <Tooltip title="기존 계약 종료일 다음 날부터 시작하는 것이 일반적입니다.">
                    <IconButton size="small" sx={{ ml: 0.5 }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Typography>
                <DatePicker
                  value={startDate}
                  onChange={(newDate) => setStartDate(newDate)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      required: true
                    }
                  }}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                  계약 종료일
                  <Typography component="span" sx={{ color: '#FF4D4D', ml: 0.5 }}>*</Typography>
                </Typography>
                <DatePicker
                  value={expiryDate}
                  onChange={(newDate) => setExpiryDate(newDate)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      required: true
                    }
                  }}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                  하자보증증권 보험시작일
                  <Typography component="span" sx={{ color: '#FF4D4D', ml: 0.5 }}>*</Typography>
                  <Tooltip title="실질적인 계약 시작일로 사용됩니다. 기존 보험 종료일 다음 날로 설정되어 있습니다.">
                    <IconButton size="small" sx={{ ml: 0.5 }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Typography>
                <DatePicker
                  value={insuranceStartDate}
                  onChange={(newDate) => setInsuranceStartDate(newDate)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      required: true
                    }
                  }}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                  하자보증증권 보험종료일
                  <Typography component="span" sx={{ color: '#FF4D4D', ml: 0.5 }}>*</Typography>
                  <Tooltip title="실질적인 계약 종료일로 사용됩니다.">
                    <IconButton size="small" sx={{ ml: 0.5 }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Typography>
                <DatePicker
                  value={insuranceEndDate}
                  onChange={(newDate) => setInsuranceEndDate(newDate)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      required: true
                    }
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </LocalizationProvider>
      </DialogContent>
      
      <Divider />
      
      <DialogActions sx={{ p: 2 }}>
        <Button 
          onClick={onClose} 
          disabled={loading}
          variant="outlined"
          sx={{ borderColor: '#CCC', color: '#666' }}
        >
          취소
        </Button>
        <Button 
          onClick={handleRenewContract} 
          disabled={loading}
          variant="contained"
          sx={{ minWidth: '120px' }}
        >
          {loading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
              처리 중...
            </>
          ) : '재계약 신청'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContractRenewModal; 