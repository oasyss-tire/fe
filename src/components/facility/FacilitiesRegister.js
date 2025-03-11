import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField,
  Button,
  FormControl,
  Select,
  MenuItem,
  Grid,
  IconButton
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
  AddPhotoAlternate as AddPhotoAlternateIcon
} from '@mui/icons-material';

const FacilitiesRegister = () => {
  const [images, setImages] = useState({
    front: null,
    back: null,
    left: null,
    right: null,
    tag: null
  });

  const handleImageUpload = (position) => (event) => {
    const file = event.target.files[0];
    if (file) {
      setImages(prev => ({
        ...prev,
        [position]: {
          file,
          preview: URL.createObjectURL(file)
        }
      }));
    }
  };

  const handleRemoveImage = (position) => {
    setImages(prev => ({
      ...prev,
      [position]: null
    }));
  };

  const ImageUploadBox = ({ position, title }) => (
    <Grid item xs={12} sm={6} md={4} lg={2.4}>
      <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
        {title}
      </Typography>
      <Box sx={{ 
        position: 'relative',
        width: '100%',
        paddingTop: '100%',
        backgroundColor: '#F8F9FA',
        borderRadius: 1,
        border: '1px dashed #E0E0E0',
        overflow: 'hidden'
      }}>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload(position)}
          style={{ display: 'none' }}
          id={`image-upload-${position}`}
        />
        {images[position] ? (
          <>
            <img 
              src={images[position].preview}
              alt={`${title} 이미지`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            <IconButton
              size="small"
              onClick={() => handleRemoveImage(position)}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </>
        ) : (
          <label htmlFor={`image-upload-${position}`} style={{ cursor: 'pointer' }}>
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1
            }}>
              <AddPhotoAlternateIcon sx={{ color: '#9E9E9E', fontSize: 32 }} />
              <Typography variant="caption" sx={{ color: '#9E9E9E' }}>
                클릭하여 업로드
              </Typography>
            </Box>
          </label>
        )}
      </Box>
    </Grid>
  );

  return (
    <Box sx={{ p: 3, backgroundColor: '#F8F8FE', minHeight: '100vh' }}>
      {/* 상단 헤더 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#3A3A3A' }}>
          시설물 등록
        </Typography>
      </Box>

      {/* 메인 컨텐츠 영역 */}
      <Box sx={{ 
        backgroundColor: 'white',
        borderRadius: 2,
        border: '1px solid #EEEEEE',
        p: 3,
        mb: 3
      }}>
        {/* 기본 정보 섹션 */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              fontWeight: 600, 
              color: '#3A3A3A',
              mb: 2 
            }}
          >
            기본 정보
          </Typography>

          <Box sx={{ 
            backgroundColor: '#F8F9FA',
            borderRadius: 2,
            border: '1px solid #EEEEEE',
            p: 3
          }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
                  시설물 구분
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    displayEmpty
                    defaultValue=""
                    sx={{
                      backgroundColor: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#E0E0E0',
                      },
                    }}
                  >
                    <MenuItem value="">선택</MenuItem>
                    <MenuItem value="lift">리프트</MenuItem>
                    <MenuItem value="balance">밸런스</MenuItem>
                    <MenuItem value="tire">타이어</MenuItem>
                    <MenuItem value="alignment">얼라이먼트</MenuItem>
                    <MenuItem value="hotel">타이어호텔</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
                  브랜드명
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="브랜드명 입력"
                  sx={{ 
                    backgroundColor: 'white',
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#E0E0E0',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
                  수량
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  placeholder="수량 입력"
                  sx={{ 
                    backgroundColor: 'white',
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#E0E0E0',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
                  사용연한
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  placeholder="사용연한 입력 (년)"
                  sx={{ 
                    backgroundColor: 'white',
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#E0E0E0',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
                  취득일
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  sx={{ 
                    backgroundColor: 'white',
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#E0E0E0',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
                  취득가액
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  placeholder="취득가액 입력 (원)"
                  sx={{ 
                    backgroundColor: 'white',
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#E0E0E0',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
                  자산 유형
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    displayEmpty
                    defaultValue=""
                    sx={{
                      backgroundColor: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#E0E0E0',
                      },
                    }}
                  >
                    <MenuItem value="">선택</MenuItem>
                    <MenuItem value="company">회사 자산</MenuItem>
                    <MenuItem value="lease">리스</MenuItem>
                    <MenuItem value="rental">렌탈</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
                  상태
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    displayEmpty
                    defaultValue=""
                    sx={{
                      backgroundColor: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#E0E0E0',
                      },
                    }}
                  >
                    <MenuItem value="">선택</MenuItem>
                    <MenuItem value="active">정상</MenuItem>
                    <MenuItem value="inactive">고장</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
                  비고
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="비고 입력"
                  sx={{ 
                    backgroundColor: 'white',
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#E0E0E0',
                      },
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </Box>

        {/* 위치 및 설치정보 섹션 */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              fontWeight: 600, 
              color: '#3A3A3A',
              mb: 2 
            }}
          >
            위치 및 설치정보
          </Typography>

          <Box sx={{ 
            backgroundColor: '#F8F9FA',
            borderRadius: 2,
            border: '1px solid #EEEEEE',
            p: 3
          }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
                  설치 매장
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="매장 검색"
                  sx={{ 
                    backgroundColor: 'white',
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#E0E0E0',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
                  설치 위치
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="설치 위치 입력"
                  sx={{ 
                    backgroundColor: 'white',
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#E0E0E0',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
                  설치일
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  sx={{ 
                    backgroundColor: 'white',
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#E0E0E0',
                      },
                    },
                  }}
                />
              </Grid>
 
            </Grid>
          </Box>
        </Box>

        {/* 이미지 등록 섹션 */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              fontWeight: 600, 
              color: '#3A3A3A',
              mb: 2 
            }}
          >
            이미지 등록
          </Typography>

          <Box sx={{ 
            backgroundColor: '#F8F9FA',
            borderRadius: 2,
            border: '1px solid #EEEEEE',
            p: 3
          }}>
            <Grid container spacing={2}>
              <ImageUploadBox position="front" title="정면 사진" />
              <ImageUploadBox position="back" title="후면 사진" />
              <ImageUploadBox position="left" title="측면 사진(좌)" />
              <ImageUploadBox position="right" title="측면 사진(우)" />
              <ImageUploadBox position="tag" title="태그 사진" />
            </Grid>
          </Box>
        </Box>
      </Box>

      {/* 하단 버튼 */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button
          variant="outlined"
          sx={{
            borderColor: '#E0E0E0',
            color: '#666',
            px: 4,
            py: 1,
            '&:hover': {
              backgroundColor: '#F8F9FA',
              borderColor: '#E0E0E0',
            },
          }}
        >
          취소
        </Button>
        <Button
          variant="contained"
          sx={{
            px: 4,
            py: 1,
            backgroundColor: '#1976d2',
            '&:hover': {
              backgroundColor: '#1565c0',
            },
          }}
        >
          등록
        </Button>
      </Box>
    </Box>
  );
};

export default FacilitiesRegister; 