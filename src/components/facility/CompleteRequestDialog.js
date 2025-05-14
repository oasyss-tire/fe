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
  InputAdornment,
  Grid,
  IconButton
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const CompleteRequestDialog = ({ 
  open, 
  onClose, 
  currentRequest, 
  onComplete,
  showSnackbar 
}) => {
  const [repairCost, setRepairCost] = useState('');
  const [formattedRepairCost, setFormattedRepairCost] = useState('');
  const [repairComment, setRepairComment] = useState('');
  
  // 이미지 업로드 관련 상태
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [uploadError, setUploadError] = useState('');
  
  // 수리 비용 입력 처리 (천 단위 구분 기호 표시)
  const handleRepairCostChange = (e) => {
    // 숫자와 콤마만 허용
    const value = e.target.value.replace(/[^\d]/g, '');
    
    // 최대 1,000조(1,000,000,000,000,000)까지만 허용
    if (value === '' || (Number(value) <= 1000000000000000 && value.length <= 16)) {
      setRepairCost(value);
      
      // 천 단위 구분 기호 표시
      setFormattedRepairCost(
        value === '' ? '' : Number(value).toLocaleString('ko-KR')
      );
    }
  };
  
  // 수리 코멘트 입력 처리
  const handleRepairCommentChange = (e) => {
    const value = e.target.value;
    // 최대 2000자 제한
    if (value.length <= 2000) {
      setRepairComment(value);
    }
  };
  
  // 이미지 업로드 핸들러
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // 파일 유효성 검사
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      setUploadError('이미지 파일만 업로드 가능합니다.');
      return;
    }
    
    // 이미지 크기 제한 (5MB)
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setUploadError('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }
    
    // 최대 이미지 개수 제한 (4개)
    if (uploadedImages.length + files.length > 4) {
      setUploadError('최대 4개까지 이미지를 업로드할 수 있습니다.');
      return;
    }
    
    setUploadError('');
    
    // 새 이미지 추가
    setUploadedImages(prevImages => [...prevImages, ...files]);
    
    // 이미지 미리보기 URL 생성
    const newImageUrls = files.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(prevUrls => [...prevUrls, ...newImageUrls]);
  };
  
  // 이미지 삭제 핸들러
  const handleRemoveImage = (index) => {
    // 미리보기 URL 해제
    URL.revokeObjectURL(imagePreviewUrls[index]);
    
    // 해당 이미지 삭제
    setUploadedImages(prevImages => prevImages.filter((_, i) => i !== index));
    setImagePreviewUrls(prevUrls => prevUrls.filter((_, i) => i !== index));
  };
  
  // 다이얼로그가 닫힐 때 상태 초기화
  const handleClose = () => {
    // 이미지 URL 객체 정리
    imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    
    // 상태 초기화
    setRepairCost('');
    setFormattedRepairCost('');
    setRepairComment('');
    setUploadedImages([]);
    setImagePreviewUrls([]);
    setUploadError('');
    
    onClose();
  };
  
  // 완료 처리 제출
  const handleSubmit = () => {
    try {
      const completionData = {
        cost: parseInt(repairCost, 10) || 0,
        repairComment: repairComment,
        images: uploadedImages
      };
      
      console.log('CompleteRequestDialog에서 전송하는 데이터:', completionData);
      
      onComplete(completionData);
    } catch (error) {
      console.error('AS 요청 완료 처리 중 오류:', error);
      showSnackbar('AS 요청 완료 처리에 실패했습니다.', 'error');
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>AS 완료 처리</DialogTitle>
      <DialogContent>
        {currentRequest && (
          <Box sx={{ mt: 2, minWidth: '400px' }}>
            {/* 요청 정보 */}
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              매장: {currentRequest.companyName} | 시설물: {currentRequest.facilityTypeName} ({currentRequest.brandName})
            </Typography>
            
            {/* 수리 비용 입력 */}
            <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>수리 비용</Typography>
            <TextField
              fullWidth
              size="small"
              value={formattedRepairCost}
              onChange={handleRepairCostChange}
              placeholder="예: 500,000"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">₩</InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            
            {/* 수리 코멘트 입력 */}
            <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>수리 코멘트</Typography>
            <TextField
              fullWidth
              size="small"
              multiline
              rows={4}
              value={repairComment}
              onChange={handleRepairCommentChange}
              placeholder="수리 내용, 문제 원인 등을 입력해주세요 (최대 2000자)"
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      {repairComment.length}/2000
                    </Typography>
                  </InputAdornment>
                ),
              }}
            />
            
            {/* 이미지 업로드 영역 */}
            <Box sx={{ mb: 2, mt: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>AS 완료 이미지 첨부 (선택)</Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                sx={{
                  borderColor: '#E0E0E0',
                  color: '#666',
                  '&:hover': {
                    borderColor: '#BDBDBD',
                    bgcolor: '#F5F5F5',
                  }
                }}
              >
                이미지 업로드
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={handleImageUpload}
                />
              </Button>
              <Typography variant="caption" color="textSecondary" sx={{ ml: 2, display: 'inline-block' }}>
                최대 4개, 파일당 5MB 이하의 이미지만 업로드 가능합니다.
              </Typography>
            </Box>
            
            {uploadError && (
              <Typography variant="body2" color="error" sx={{ mb: 2 }}>
                {uploadError}
              </Typography>
            )}
            
            {imagePreviewUrls.length > 0 && (
              <Box sx={{ 
                border: '1px solid #E0E0E0', 
                borderRadius: 1, 
                p: 2, 
                backgroundColor: '#FAFAFA',
                mb: 2
              }}>
                <Typography variant="subtitle2" gutterBottom>
                  첨부된 이미지 ({imagePreviewUrls.length}/4)
                </Typography>
                <Grid container spacing={2}>
                  {imagePreviewUrls.map((url, index) => (
                    <Grid item xs={6} sm={3} key={index}>
                      <Box
                        sx={{
                          position: 'relative',
                          width: '100%',
                          borderRadius: 1,
                          overflow: 'hidden',
                          bgcolor: '#F5F5F5',
                          border: '1px solid #E0E0E0',
                          aspectRatio: '1/1',
                        }}
                      >
                        <img
                          src={url}
                          alt={`첨부 이미지 ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                        <IconButton
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            bgcolor: 'rgba(255, 255, 255, 0.8)',
                            '&:hover': {
                              bgcolor: 'rgba(255, 255, 255, 0.9)',
                            },
                          }}
                          onClick={() => handleRemoveImage(index)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <Typography variant="caption" color="textSecondary" noWrap sx={{ display: 'block', mt: 0.5 }}>
                        {uploadedImages[index].name}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>취소</Button>
        <Button onClick={handleSubmit} variant="contained" color="success">완료</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CompleteRequestDialog; 