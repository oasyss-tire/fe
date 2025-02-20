import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Grid,
  Divider,
  FormControlLabel,
  Switch,
  Modal,
  Paper,
  Snackbar,
  Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
// import DeleteIcon from '@mui/icons-material/Delete';
import ClearIcon from '@mui/icons-material/Clear';
import { styled } from '@mui/material/styles';
// import ImageList from '@mui/material/ImageList';
// import ImageListItem from '@mui/material/ImageListItem';
// import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
// import BuildIcon from '@mui/icons-material/Build';

// 스타일링된 컴포넌트
const InquirySection = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  backgroundColor: '#f8f9fa',
  border: '1px solid #e9ecef'
}));

const ResponseSection = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  backgroundColor: '#fff',
  border: '1px solid #4caf50',
  borderLeft: '4px solid #4caf50'
}));

const InquiryDialog = ({ open, onClose, inquiry, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedInquiry, setEditedInquiry] = useState(null);
  const [newImages, setNewImages] = useState([]);
  const [newInquiry, setNewInquiry] = useState({
    inquiryTitle: '',
    inquiryContent: '',
    contactNumber: '',
    images: []
  });
  const currentUserId = parseInt(sessionStorage.getItem('userId'));
  const isAuthor = inquiry?.writerId === currentUserId;
  const isAdminOrManager = sessionStorage.getItem('role')?.toUpperCase() === 'ADMIN' || 
                        sessionStorage.getItem('role')?.toUpperCase() === 'MANAGER';
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [formErrors, setFormErrors] = useState({
    title: false,
    content: false
  });

  // 초기 상태 정의
  const initialState = {
    inquiryTitle: '',
    inquiryContent: '',
    contactNumber: '',
    images: []
  };

  // 다이얼로그 닫기 핸들러
  const handleClose = () => {
    if (!inquiry) {  // 등록 모드일 때만 초기화
      setNewInquiry(initialState);
    }
    onClose();
  };

  const handleEditClick = () => {
    setEditedInquiry({
      ...inquiry,
      existingImages: inquiry.imageUrls || [],
      processed: Boolean(inquiry.processed),
      processContent: inquiry.processContent || '',
      memo: inquiry.memo || ''
    });
    setNewImages([]);
    setIsEditing(true);
  };

  const handleImageChange = (e) => {
    setNewImages([...newImages, ...Array.from(e.target.files)]);
  };

  const handleRemoveExistingImage = (indexToRemove) => {
    const updatedImages = editedInquiry.existingImages.filter((_, index) => index !== indexToRemove);
    setEditedInquiry({
      ...editedInquiry,
      existingImages: updatedImages
    });
    
    // 마지막 이미지를 삭제하는 경우에도 빈 배열을 유지
    if (updatedImages.length === 0) {
      // console.log('마지막 이미지 삭제');
    }
  };

  const handleRemoveNewImage = (indexToRemove) => {
    setNewImages(newImages.filter((_, index) => index !== indexToRemove));
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleUpdate = async () => {
    try {
      const formData = new FormData();
      formData.append('inquiryTitle', editedInquiry.inquiryTitle);
      formData.append('inquiryContent', editedInquiry.inquiryContent);
      formData.append('contactNumber', editedInquiry.contactNumber);

      // 기존 이미지 처리 - 빈 배열일 때도 명시적으로 전송
      if (Array.isArray(editedInquiry.existingImages)) {  // 배열인지 확인
        if (editedInquiry.existingImages.length > 0) {
          editedInquiry.existingImages.forEach(url => {
            formData.append('existingImages', url);
          });
        } else {
          // 빈 배열일 때 빈 문자열을 보내서 모든 이미지 삭제 표시
          formData.append('existingImages', '');
        }
      }

      // 새 이미지 처리
      if (newImages && newImages.length > 0) {
        newImages.forEach(image => {
          formData.append('images', image);
        });
      }

      // ADMIN만 처리상태 관련 필드 수정 가능
      if (isAdminOrManager) {
        // processed가 undefined일 경우 기본값 false 설정
        const processedValue = editedInquiry.processed !== undefined ? editedInquiry.processed : false;
        formData.append('processed', processedValue.toString());
        
        if (editedInquiry.processContent) {
          formData.append('processContent', editedInquiry.processContent);
        }
        if (editedInquiry.memo) {
          formData.append('memo', editedInquiry.memo);
        }
      }

      // 요청 데이터 확인을 위한 로그
      // console.log('Update Request Data:');
      // for (let pair of formData.entries()) {
      //   console.log(pair[0] + ': ' + pair[1]);
      // }
      // console.log('Is Admin:', isAdminOrManager);
      // console.log('Edited Inquiry:', editedInquiry);

      const response = await fetch(`http://localhost:8080/api/inquiries/${inquiry.inquiryId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '문의사항 수정에 실패했습니다.');
      }

      setSnackbar({
        open: true,
        message: '문의사항이 성공적으로 수정되었습니다.',
        severity: 'success'
      });
      
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || '문의사항 수정에 실패했습니다.',
        severity: 'error'
      });
    }
  };

  const handleDelete = async () => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        const response = await fetch(`http://localhost:8080/api/inquiries/${inquiry.inquiryId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || '문의사항 삭제에 실패했습니다.');
        }

        setSnackbar({
          open: true,
          message: '문의사항이 성공적으로 삭제되었습니다.',
          severity: 'success'
        });

        onClose();
        if (onDelete) onDelete();
      } catch (error) {
        setSnackbar({
          open: true,
          message: error.message || '문의사항 삭제에 실패했습니다.',
          severity: 'error'
        });
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR');
  };

  // 등록 모드 핸들러
  const handleCreate = async () => {
    // 유효성 검사 추가
    if (!newInquiry.inquiryTitle.trim() || !newInquiry.inquiryContent.trim()) {
      setFormErrors({
        title: !newInquiry.inquiryTitle.trim(),
        content: !newInquiry.inquiryContent.trim()
      });
      alert('제목과 문의내용을 모두 입력해주세요.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('inquiryTitle', newInquiry.inquiryTitle);
      formData.append('inquiryContent', newInquiry.inquiryContent);
      formData.append('contactNumber', newInquiry.contactNumber);
      formData.append('userId', sessionStorage.getItem('userId'));

      newInquiry.images.forEach(image => {
        formData.append('images', image);
      });

      const response = await fetch('http://localhost:8080/api/inquiries', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('문의사항 등록에 실패했습니다.');
      }

      setSnackbar({
        open: true,
        message: '문의사항이 성공적으로 등록되었습니다.',
        severity: 'success'
      });

      setNewInquiry(initialState);  // 성공 시 초기화
      onClose();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || '문의사항 등록에 실패했습니다.',
        severity: 'error'
      });
    }
  };

  // 등록 모드일 때의 이미지 처리
  const handleCreateImageChange = (e) => {
    setNewInquiry({
      ...newInquiry,
      images: Array.from(e.target.files)
    });
  };

  const handleRemoveCreateImage = (indexToRemove) => {
    setNewInquiry({
      ...newInquiry,
      images: newInquiry.images.filter((_, index) => index !== indexToRemove)
    });
  };

  // 처리 버튼 클릭 핸들러
  const handleProcessClick = () => {
    setIsProcessing(true);
    setEditedInquiry({
      ...inquiry,
      processed: Boolean(inquiry.processed),
      processContent: inquiry.processContent || '',
      memo: inquiry.memo || ''
    });
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1
        }}>
          {!inquiry ? (
            "문의사항 등록"
          ) : !isEditing ? (
            inquiry.inquiryTitle
          ) : (
            "문의사항 수정"
          )}
          
          {/* 작성자나 관리자만 수정/삭제 버튼 표시 && 등록 모드가 아닐 때만 표시 */}
          {inquiry && (isAuthor || isAdminOrManager) && !isEditing && (
            <Box>
              <IconButton onClick={handleEditClick}>
                <EditIcon />
              </IconButton>
              {/* <IconButton onClick={handleDelete}>
                <DeleteIcon />
              </IconButton> */}
            </Box>
          )}
        </DialogTitle>

        <DialogContent>
          {!inquiry ? (
            // 등록 모드
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="제목"
                  value={newInquiry.inquiryTitle}
                  onChange={(e) => {
                    setNewInquiry({
                      ...newInquiry,
                      inquiryTitle: e.target.value
                    });
                    setFormErrors(prev => ({...prev, title: false}));
                  }}
                  error={formErrors.title}
                  helperText={formErrors.title ? "제목을 입력해주세요" : ""}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="문의내용"
                  value={newInquiry.inquiryContent}
                  onChange={(e) => {
                    setNewInquiry({
                      ...newInquiry,
                      inquiryContent: e.target.value
                    });
                    setFormErrors(prev => ({...prev, content: false}));
                  }}
                  error={formErrors.content}
                  helperText={formErrors.content ? "문의내용을 입력해주세요" : ""}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="연락처"
                  value={newInquiry.contactNumber}
                  onChange={(e) => setNewInquiry({
                    ...newInquiry,
                    contactNumber: e.target.value
                  })}
                />
              </Grid>
              <Grid item xs={12}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  id="inquiry-create-image"
                  onChange={handleCreateImageChange}
                />
                <label htmlFor="inquiry-create-image">
                  <Button
                    variant="outlined"
                    component="span"
                    size="small"
                  >
                    이미지 추가
                  </Button>
                </label>

                {/* 선택된 이미지 미리보기 */}
                {newInquiry.images.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      선택된 이미지 ({newInquiry.images.length})
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {newInquiry.images.map((image, index) => (
                        <Box
                          key={index}
                          sx={{ 
                            position: 'relative',
                            width: 100,
                            height: 100,
                            border: '1px solid #eee',
                            borderRadius: 1,
                            overflow: 'hidden'
                          }}
                        >
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`이미지 ${index + 1}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                          <IconButton
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              bgcolor: 'rgba(255,255,255,0.8)',
                              '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.9)'
                              }
                            }}
                            onClick={() => handleRemoveCreateImage(index)}
                          >
                            <ClearIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </Grid>
            </Grid>
          ) : isEditing ? (
            // 수정 모드
            <Grid container spacing={2}>
              <Grid item xs={12} sx={{ mt: 4 }}>
                <TextField
                  fullWidth
                  label="제목"
                  value={editedInquiry.inquiryTitle}
                  onChange={(e) => setEditedInquiry({...editedInquiry, inquiryTitle: e.target.value})}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="문의내용"
                  value={editedInquiry.inquiryContent}
                  onChange={(e) => setEditedInquiry({...editedInquiry, inquiryContent: e.target.value})}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="연락처"
                  value={editedInquiry.contactNumber}
                  onChange={(e) => setEditedInquiry({...editedInquiry, contactNumber: e.target.value})}
                />
              </Grid>

              <Grid item xs={12}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  id="inquiry-image-upload"
                  onChange={handleImageChange}
                />
                <label htmlFor="inquiry-image-upload">
                  <Button variant="outlined" component="span" size="small">
                    이미지 추가
                  </Button>
                </label>

                {/* 기존 이미지 표시 */}
                {editedInquiry.existingImages.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      기존 이미지 ({editedInquiry.existingImages.length})
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {editedInquiry.existingImages.map((url, index) => (
                        <Box
                          key={`existing-${index}`}
                          sx={{ 
                            position: 'relative',
                            width: 100,
                            height: 100,
                            border: '1px solid #eee',
                            borderRadius: 1,
                            overflow: 'hidden'
                          }}
                        >
                          <img
                            src={`http://localhost:8080/uploads/inquiry_images/${url}`}
                            alt={`기존 이미지 ${index + 1}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                          <IconButton
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              bgcolor: 'rgba(255,255,255,0.8)',
                              '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.9)'
                              }
                            }}
                            onClick={() => handleRemoveExistingImage(index)}
                          >
                            <ClearIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* 새로 추가된 이미지 표시 */}
                {newImages.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      새로 추가된 이미지 ({newImages.length})
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {newImages.map((image, index) => (
                        <Box
                          key={`new-${index}`}
                          sx={{ 
                            position: 'relative',
                            width: 100,
                            height: 100,
                            border: '1px solid #eee',
                            borderRadius: 1,
                            overflow: 'hidden'
                          }}
                        >
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`새 이미지 ${index + 1}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                          <IconButton
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              bgcolor: 'rgba(255,255,255,0.8)',
                              '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.9)'
                              }
                            }}
                            onClick={() => handleRemoveNewImage(index)}
                          >
                            <ClearIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </Grid>

              {/* ADMIN/MANAGER 전용 필드들 */}
              {isAdminOrManager && (
                <>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(editedInquiry.processed)}
                          onChange={(e) => setEditedInquiry({
                            ...editedInquiry,
                            processed: e.target.checked
                          })}
                        />
                      }
                      label={editedInquiry.processed ? "처리완료" : "미처리"}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="처리내용"
                      value={editedInquiry.processContent || ''}
                      onChange={(e) => setEditedInquiry({
                        ...editedInquiry,
                        processContent: e.target.value
                      })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="메모"
                      value={editedInquiry.memo || ''}
                      onChange={(e) => setEditedInquiry({
                        ...editedInquiry,
                        memo: e.target.value
                      })}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          ) : (
            // 상세보기 모드
            <>
              <Box sx={{ mb: 2, color: 'grey.600' }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  작성자: {inquiry.writerName} ({inquiry.companyName})
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  연락처: {inquiry.contactNumber}
                </Typography>
                <Typography variant="body2">
                  작성일: {formatDate(inquiry.createdAt)}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography 
                variant="subtitle2" 
                sx={{ 
                  mb: 1.5,
                  color: 'text.secondary',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <span>문의내용</span>
              </Typography>
              <Paper elevation={0} sx={{ 
                p: 2, 
                mb: 3, 
                bgcolor: '#f8f9fa',
                border: '1px solid #e9ecef',
                borderRadius: 1
              }}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {inquiry.inquiryContent}
                </Typography>
              </Paper>

              {inquiry.imageUrls && inquiry.imageUrls.length > 0 && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    첨부파일 ({inquiry.imageUrls.length})
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                    {inquiry.imageUrls.map((url, index) => (
                      <Box 
                        key={index}
                        component="img"
                        src={`http://localhost:8080/uploads/inquiry_images/${url}`}
                        alt={`첨부이미지 ${index + 1}`}
                        sx={{ 
                          width: '100px',
                          height: '100px',
                          objectFit: 'cover',
                          cursor: 'pointer',
                          '&:hover': { opacity: 0.8 }
                        }}
                        onClick={() => {
                          setSelectedImage(url);
                          setImageModalOpen(true);
                        }}
                      />
                    ))}
                  </Box>
                </>
              )}

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  mb: 2 
                }}>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      color: 'text.secondary',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      letterSpacing: '0.01em'
                    }}
                  >
                    처리상태:{' '}
                  </Typography>
                  <Typography 
                    component="span" 
                    sx={{ 
                      ml: 1,
                      fontSize: '0.8rem',
                      color: inquiry.processed ? '#4caf50' : '#ff9800',
                      bgcolor: inquiry.processed ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 152, 0, 0.1)',
                      px: 1,
                      py: 0.3,
                      borderRadius: '4px',
                      display: 'inline-flex',
                      alignItems: 'center'
                    }}
                  >
                    {inquiry.processed ? "처리완료" : "미처리"}
                  </Typography>
                </Box>

                {inquiry.processed && (
                  <Box sx={{ 
                    bgcolor: 'rgba(76, 175, 80, 0.05)',
                    border: '1px solid rgba(76, 175, 80, 0.2)', 
                    p: 2.5, 
                    borderRadius: 1 
                  }}>
                    {inquiry.processContent && (
                      <>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          처리내용
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          mb: 2, 
                          whiteSpace: 'pre-wrap',
                          fontSize: '0.9rem',
                          lineHeight: 1.8
                        }}>
                          {inquiry.processContent}
                        </Typography>
                      </>
                    )}
                    {inquiry.memo && (
                      <>
                        <Divider sx={{ my: 2, opacity: 0.2 }} />
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          메모
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          whiteSpace: 'pre-wrap',
                          fontSize: '0.9rem',
                          lineHeight: 1.8
                        }}>
                          {inquiry.memo}
                        </Typography>
                      </>
                    )}
                  </Box>
                )}
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions>
          {!inquiry ? (
            // 등록 모드
            <>
              <Button onClick={handleClose}>취소</Button>
              <Button onClick={handleCreate} variant="contained">등록</Button>
            </>
          ) : isEditing ? (
            // 수정 모드
            <>
              <Button onClick={() => setIsEditing(false)}>취소</Button>
              <Button onClick={handleUpdate} variant="contained">수정</Button>
            </>
          ) : (
            // 상세보기 모드
            <Button onClick={handleClose}>닫기</Button>
          )}
        </DialogActions>
      </Dialog>

      {/* 이미지 확대 모달 */}
      <Modal
        open={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box
          component="img"
          src={`http://localhost:8080/uploads/inquiry_images/${selectedImage}`}
          alt="선택된 이미지"
          sx={{
            maxWidth: '90vw',
            maxHeight: '90vh',
            objectFit: 'contain',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 1
          }}
          onClick={() => setImageModalOpen(false)}
        />
      </Modal>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ 
            width: '100%',
            boxShadow: 3,
            fontSize: '0.95rem'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default InquiryDialog; 