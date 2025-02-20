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
import { ArrowBack as ArrowBackIcon, CloudUpload as CloudUploadIcon, Delete as DeleteIcon } from '@mui/icons-material';

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
  const [imageFiles, setImageFiles] = useState([]);  // {file, description} 형태의 객체 배열

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
    const newImageFiles = files.map(file => ({
      file,
      description: ''
    }));
    setImageFiles(prev => [...prev, ...newImageFiles]);
  };

  const handleImageDescriptionChange = (index, description) => {
    setImageFiles(prev => prev.map((item, i) => 
      i === index ? { ...item, description } : item
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      
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

      // 이미지와 설명 추가
      imageFiles.forEach((imageFile, index) => {
        submitData.append('images', imageFile.file);
        submitData.append(`descriptions[${index}]`, imageFile.description);
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
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
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
              <Box sx={{ mb: 2 }}>
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
              </Box>
              
              {/* 업로드된 이미지 목록 */}
              <Grid container spacing={2}>
                {imageFiles.map((imageFile, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Paper sx={{ p: 2 }}>
                      <Box sx={{ mb: 2, position: 'relative' }}>
                        <Box
                          component="img"
                          src={URL.createObjectURL(imageFile.file)}
                          alt={`미리보기 ${index + 1}`}
                          sx={{
                            width: '100%',
                            height: '200px',
                            objectFit: 'cover',
                            borderRadius: 1
                          }}
                        />
                        <IconButton
                          onClick={() => handleRemoveImage(index)}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            bgcolor: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            '&:hover': {
                              bgcolor: 'rgba(0,0,0,0.7)'
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                      <TextField
                        fullWidth
                        size="small"
                        label="이미지 설명"
                        value={imageFile.description}
                        onChange={(e) => handleImageDescriptionChange(index, e.target.value)}
                        placeholder="이미지에 대한 설명을 입력하세요"
                      />
                    </Paper>
                  </Grid>
                ))}
              </Grid>
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