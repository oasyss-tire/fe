import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  IconButton,
  Stack,
  Divider
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { ArrowBack as ArrowBackIcon, CloudUpload as CloudUploadIcon } from '@mui/icons-material';

const FacilityCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    location: '',
    acquisitionCost: '',
    acquisitionDate: null,
    currentLocation: '',
    description: '',
    companyId: '',  // 회사 선택 필드 추가
    images: []
  });
  const [companies, setCompanies] = useState([]);

  // 회사 목록 조회
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/companies', {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setCompanies(data);
        }
      } catch (error) {
        console.error('회사 목록 조회 실패:', error);
      }
    };

    fetchCompanies();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // FormData 객체 생성
      const submitData = new FormData();
      
      // 기본 정보 추가
      const facilityData = {
        name: formData.name,
        code: formData.code,
        location: formData.location,
        acquisitionCost: Number(formData.acquisitionCost),
        acquisitionDate: formData.acquisitionDate,
        currentLocation: formData.currentLocation,
        description: formData.description,
        companyId: formData.companyId
      };
      
      submitData.append('facilityDto', new Blob([JSON.stringify(facilityData)], {
        type: 'application/json'
      }));

      // 이미지 파일들 추가
      formData.images.forEach((file, index) => {
        submitData.append('images', file);
      });

      const response = await fetch('http://localhost:8080/api/facilities', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: submitData
      });

      if (!response.ok) {
        throw new Error('시설물 등록 실패');
      }

      const result = await response.json();
      navigate(`/facility/${result.id}`);
    } catch (error) {
      console.error('시설물 등록 중 오류 발생:', error);
      // 에러 처리 로직 추가 가능
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        {/* 헤더 */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/facility')} sx={{ color: 'text.secondary' }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6">시설물 등록</Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* 폼 */}
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* 기본 정보 */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                기본 정보
              </Typography>
              <Stack spacing={2}>
                <TextField
                  required
                  select
                  fullWidth
                  label="소속 회사"
                  name="companyId"
                  value={formData.companyId}
                  onChange={handleChange}
                >
                  <MenuItem value="">
                    <em>회사를 선택하세요</em>
                  </MenuItem>
                  {companies.map((company) => (
                    <MenuItem key={company.companyId} value={company.companyId}>
                      {company.companyName}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  required
                  fullWidth
                  label="시설물명"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
                <TextField
                  required
                  fullWidth
                  label="관리 코드"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                />
                <TextField
                  required
                  fullWidth
                  label="최초 위치"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                />
                <TextField
                  required
                  fullWidth
                  label="취득 가액"
                  name="acquisitionCost"
                  type="number"
                  value={formData.acquisitionCost}
                  onChange={handleChange}
                  InputProps={{
                    endAdornment: <Typography>원</Typography>
                  }}
                />
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="취득일"
                    value={formData.acquisitionDate}
                    onChange={(newValue) => {
                      setFormData(prev => ({
                        ...prev,
                        acquisitionDate: newValue
                      }));
                    }}
                    renderInput={(params) => <TextField {...params} required fullWidth />}
                  />
                </LocalizationProvider>
                <TextField
                  fullWidth
                  label="현재 위치"
                  name="currentLocation"
                  value={formData.currentLocation}
                  onChange={handleChange}
                />
                <TextField
                  fullWidth
                  label="설명"
                  name="description"
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                />
              </Stack>
            </Grid>

            {/* 이미지 업로드 */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                이미지 등록
              </Typography>
              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                sx={{ width: '100%', height: '100px' }}
              >
                이미지 업로드
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </Button>
              {formData.images.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    선택된 파일: {formData.images.map(file => file.name).join(', ')}
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>

          {/* 제출 버튼 */}
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                minWidth: 200,
                bgcolor: '#343959',
                '&:hover': { bgcolor: '#3d63b8' }
              }}
            >
              등록하기
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default FacilityCreate; 