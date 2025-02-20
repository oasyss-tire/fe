import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { ko } from 'date-fns/locale';

// 계약 번호 자동 생성 함수를 컴포넌트 밖으로 이동
const generateContractNumber = () => {
  const randomNum = Math.floor(10000000 + Math.random() * 90000000); // 8자리 랜덤 숫자
  return `CT${randomNum}`;
};

const ContractUpload = () => {
  const [formData, setFormData] = useState({
    title: '',
    contractType: '',
    description: '',
    // 위수탁자 정보
    contracteeName: '',
    contracteeEmail: '',
    contracteePhoneNumber: '',
    // 본사 정보
    contractorName: '',
    contractorEmail: '',
    contractorPhoneNumber: '',
    // 추가 필드
    expirationDate: null,
    contractNumber: generateContractNumber(), // 이제 문제없이 사용 가능
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('PDF 파일을 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      // 모든 필드 추가
      Object.keys(formData).forEach(key => {
        if (key === 'expirationDate' && formData[key]) {
          formDataToSend.append(key, formData[key].toISOString());
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });
      formDataToSend.append('file', file);

      const response = await fetch('http://localhost:8080/api/contracts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        alert('계약서가 업로드되었습니다.');
        navigate('/contracts');
      } else {
        throw new Error('업로드 실패');
      }
    } catch (error) {
      alert('계약서 업로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          계약서 업로드
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {/* 계약 기본 정보 */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="계약서 제목"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="계약 번호"
                name="contractNumber"
                value={formData.contractNumber}
                InputProps={{
                  readOnly: true,
                }}
                sx={{ 
                  '& .MuiInputBase-input.Mui-readOnly': {
                    backgroundColor: '#f5f5f5'
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>계약 종류</InputLabel>
                <Select
                  name="contractType"
                  value={formData.contractType}
                  onChange={handleChange}
                  label="계약 종류"
                >
                  <MenuItem value="WORK">근로 계약서</MenuItem>
                  <MenuItem value="SERVICE">용역 계약서</MenuItem>
                  <MenuItem value="LEASE">임대차 계약서</MenuItem>
                  <MenuItem value="OTHER">기타 계약서</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
                <DatePicker
                  label="계약 만료일"
                  value={formData.expirationDate}
                  onChange={(newValue) => {
                    setFormData(prev => ({
                      ...prev,
                      expirationDate: newValue
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth />
                  )}
                />
              </LocalizationProvider>
            </Grid>

            {/* 위수탁자 정보 */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                위수탁자 정보
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="위수탁자 이름"
                name="contracteeName"
                value={formData.contracteeName}
                onChange={handleChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="위수탁자 이메일"
                name="contracteeEmail"
                type="email"
                value={formData.contracteeEmail}
                onChange={handleChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="위수탁자 연락처"
                name="contracteePhoneNumber"
                value={formData.contracteePhoneNumber}
                onChange={handleChange}
                required
                placeholder="010-0000-0000"
              />
            </Grid>

            {/* 본사 정보 */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
              본사 정보
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="본사 이름"
                name="contractorName"
                value={formData.contractorName}
                onChange={handleChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="본사 이메일"
                name="contractorEmail"
                type="email"
                value={formData.contractorEmail}
                onChange={handleChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="본사 연락처"
                name="contractorPhoneNumber"
                value={formData.contractorPhoneNumber}
                onChange={handleChange}
                required
                placeholder="010-0000-0000"
              />
            </Grid>

            {/* 계약 설명 */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="계약 설명"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={4}
              />
            </Grid>

            {/* 파일 업로드 */}
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ mt: 2 }}
              >
                PDF 파일 선택
                <input
                  type="file"
                  hidden
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </Button>
              {file && (
                <Typography variant="body2" sx={{ mt: 1, color: 'success.main' }}>
                  선택된 파일: {file.name}
                </Typography>
              )}
            </Grid>

            {/* 제출 버튼 */}
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{ 
                  mt: 3,
                  bgcolor: '#343959',
                  '&:hover': { bgcolor: '#3d63b8' }
                }}
              >
                {loading ? <CircularProgress size={24} /> : '계약서 업로드'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default ContractUpload; 