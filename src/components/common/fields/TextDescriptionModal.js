import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';

/**
 * Text 필드의 설명(placeholder)과 형식을 입력하는 모달 컴포넌트
 */
const TextDescriptionModal = ({ open, onClose, onSave, field }) => {
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [formatOptions, setFormatOptions] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState('');
  const [loading, setLoading] = useState(false);

  // field 정보가 변경될 때마다 상태 초기화
  useEffect(() => {
    if (field && open) {
      // description 속성이 있으면 설정, 없으면 빈 문자열
      setDescription(field.description || '');
      setSelectedFormat(field.formatCodeId || '');
      setError('');
      
      // 형식 목록 로드
      fetchFormatOptions();
    }
  }, [field, open]);

  // 형식 옵션 불러오기
  const fetchFormatOptions = async () => {
    try {
      setLoading(true);
      console.log('형식 목록 API 호출 시작');
      const response = await fetch('http://localhost:8080/api/codes/field-formats');
      
      if (!response.ok) {
        console.error('API 응답 에러:', response.status, response.statusText);
        throw new Error('형식 목록을 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      console.log('API 응답 데이터:', data);
      
      if (Array.isArray(data) && data.length > 0) {
        console.log('형식 목록 데이터 수:', data.length);
        console.log('첫 번째 형식 아이템:', data[0]);
        setFormatOptions(data);
      } else {
        console.warn('API에서 받은 형식 목록이 비어있거나 배열이 아닙니다:', data);
        setFormatOptions([]);
      }
    } catch (error) {
      console.error('형식 목록 로드 중 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!description.trim()) {
      setError('설명 텍스트를 입력해주세요.');
      return;
    }

    onSave(description, selectedFormat);
    handleClose();
  };

  const handleClose = () => {
    setDescription('');
    setSelectedFormat('');
    setError('');
    onClose();
  };

  const handleInputChange = (e) => {
    setDescription(e.target.value);
    if (e.target.value.trim()) {
      setError('');
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '8px',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)'
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: '1px solid #F0F0F0', 
        py: 2,
        px: 3,
        fontSize: '1.1rem', 
        fontWeight: 600 
      }}>
        텍스트 필드 설정
      </DialogTitle>
      
      <DialogContent sx={{ p: 3, pt: 3 }}>
        <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
          텍스트 필드에 표시할 설명을 입력해주세요. (예: 이름, 주소, 사업자등록번호 등)
        </Typography>
        
        <TextField
          autoFocus
          label="설명 텍스트"
          placeholder="입력할 내용에 대한 설명을 적어주세요"
          value={description}
          onChange={handleInputChange}
          fullWidth
          error={!!error}
          helperText={error}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: !!error ? '#FF4D4F' : '#E0E0E0',
              },
              '&:hover fieldset': {
                borderColor: !!error ? '#FF4D4F' : '#BDBDBD',
              },
              '&.Mui-focused fieldset': {
                borderColor: !!error ? '#FF4D4F' : '#1976d2',
              },
            },
          }}
        />
        
        <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
          <InputLabel>입력 형식</InputLabel>
          <Select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            label="입력 형식"
            disabled={loading}
          >
            <MenuItem value="">
              <em>기본 텍스트</em>
            </MenuItem>
            {formatOptions.map((option) => (
              <MenuItem key={option.codeId} value={option.codeId}>
                {option.codeName}
              </MenuItem>
            ))}
          </Select>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
              <CircularProgress size={20} />
            </Box>
          )}
        </FormControl>
        
        {formatOptions.length === 0 && !loading && (
          <Alert severity="warning" sx={{ mt: 1, mb: 1 }}>
            입력 형식 목록을 불러올 수 없습니다. 기본 텍스트로 진행합니다.
          </Alert>
        )}
        
        <Box sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
            입력한 설명 텍스트는 사용자가 해당 필드에서 어떤 정보를 입력해야 하는지 안내하며,
            입력 형식을 지정하면 특정 형식(전화번호, 주민등록번호 등)에 맞게 입력 형식을 제한할 수 있습니다.
          </Alert>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #F0F0F0' }}>
        <Button 
          onClick={handleClose}
          variant="outlined"
          sx={{ 
            color: '#666',
            borderColor: '#E0E0E0',
            '&:hover': {
              borderColor: '#BDBDBD',
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            },
            mr: 1
          }}
        >
          취소
        </Button>
        <Button 
          onClick={handleSave}
          variant="contained"
          sx={{ 
            bgcolor: '#1976d2', 
            '&:hover': {
              bgcolor: '#1565C0'
            },
            fontWeight: 500
          }}
        >
          저장
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TextDescriptionModal; 