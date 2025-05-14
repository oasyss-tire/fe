import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputLabel,
  FormControl,
  Select,
  MenuItem,
  Chip,
  Paper
} from '@mui/material';
import { format } from 'date-fns';

// AS 상태 칩 색상 매핑
const statusColorMap = {
  '002010_0001': 'default', // 접수중
  '002010_0002': 'default', // AS 접수완료
  '002010_0003': 'default'  // AS 수리완료
};

// 시설물 상태 칩 색상 매핑
const facilityStatusColorMap = {
  '002003_0001': 'default', // 사용중 (정상)
  '002003_0002': 'default', // 수리중
  '002003_0005': 'default'  // 폐기
};

const ApproveRequestDialog = ({ 
  open, 
  onClose, 
  currentRequest, 
  onApprove,
  showSnackbar 
}) => {
  // 현재 날짜부터 7일 후를 계산하여 기본값으로 설정
  const getDefaultDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return format(date, 'yyyy-MM-dd');
  };

  const [expectedCompletionDate, setExpectedCompletionDate] = useState(getDefaultDate());
  const [expectedCompletionHour, setExpectedCompletionHour] = useState('17'); // 기본값 17시로 설정
  
  // 날짜 포맷 함수
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'yy-MM-dd');
    } catch (error) {
      return dateString;
    }
  };

  const handleSubmit = () => {
    try {
      // 날짜와 시간을 결합하여 ISO 형식의 문자열로 변환 (분과 초는 00으로 고정)
      const formattedDateTime = `${expectedCompletionDate}T${expectedCompletionHour}:00:00`;
      
      onApprove(formattedDateTime);
    } catch (error) {
      console.error('AS 요청 승인 처리 중 오류:', error);
      showSnackbar('AS 요청 승인 처리에 실패했습니다.', 'error');
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>AS 요청 승인</DialogTitle>
      <DialogContent>
        {currentRequest && (
          <Box sx={{ mt: 2 }}>
            {/* AS 접수 정보 */}
            <Box sx={{ mb: 3, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
              <Typography variant="subtitle2">
                매장: <Typography component="span" variant="body2">{currentRequest.companyName}</Typography>
              </Typography>
              <Typography variant="subtitle2">
                시설물: <Typography component="span" variant="body2">{currentRequest.facilityTypeName}</Typography>
              </Typography>
              <Typography variant="subtitle2">
                품목: <Typography component="span" variant="body2">{currentRequest.brandName}</Typography>
              </Typography>
              <Typography variant="subtitle2">
                요청일자: <Typography component="span" variant="body2">{formatDate(currentRequest.requestDate)}</Typography>
              </Typography>
              <Typography variant="subtitle2">
                위치: <Typography component="span" variant="body2">{currentRequest.currentLocation}</Typography>
              </Typography>
              <Typography variant="subtitle2">
                요청자: <Typography component="span" variant="body2">{currentRequest.requesterName}</Typography>
              </Typography>
              <Typography variant="subtitle2">
                상태: <Typography component="span" variant="body2">
                  <Chip 
                    label={currentRequest.serviceStatusName || currentRequest.statusName} 
                    size="small" 
                    variant="outlined"
                  />
                </Typography>
              </Typography>
            </Box>
            
            {/* 요청 내용 */}
            <Typography variant="subtitle2" sx={{ mb: 1 }}>요청 내용:</Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5' }}>
              <Typography variant="body2">{currentRequest.requestContent}</Typography>
            </Paper>
            
            {/* 비고 사항 */}
            {currentRequest.notes && (
              <>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>비고 사항:</Typography>
                <Paper variant="outlined" sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5' }}>
                  <Typography variant="body2">{currentRequest.notes}</Typography>
                </Paper>
              </>
            )}
            
            {/* 예상 완료일 입력 */}
            <InputLabel htmlFor="expected-completion-date" sx={{ mb: 1 }}>예상 완료일</InputLabel>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                id="expected-completion-date"
                type="date"
                fullWidth
                size="small"
                value={expectedCompletionDate}
                onChange={(e) => setExpectedCompletionDate(e.target.value)}
                sx={{ flex: 2 }}
              />
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel id="expected-completion-hour-label">시간</InputLabel>
                <Select
                  labelId="expected-completion-hour-label"
                  id="expected-completion-hour"
                  value={expectedCompletionHour}
                  onChange={(e) => setExpectedCompletionHour(e.target.value)}
                  label="시간"
                >
                  {Array.from({ length: 24 }, (_, i) => {
                    const hour = i.toString().padStart(2, '0');
                    return (
                      <MenuItem key={hour} value={hour}>
                        {hour}시
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">승인</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApproveRequestDialog; 