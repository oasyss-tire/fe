import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  IconButton,
  Grid,
  TextField,
  FormControlLabel,
  Switch,
  Modal,
  Snackbar,
  Alert
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import EditIcon from '@mui/icons-material/Edit';
// import DeleteIcon from '@mui/icons-material/Delete';
import ClearIcon from '@mui/icons-material/Clear';

const NoticeDialog = ({ open, onClose, notice, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotice, setEditedNotice] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const currentUserId = parseInt(sessionStorage.getItem('userId'));
  const isAuthor = notice?.writerId === currentUserId;
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'  // 'success' | 'error' | 'info' | 'warning'
  });

  const handleEditClick = () => {
    setEditedNotice({
      ...notice,
      popupStartDate: notice.popupStartDate ? new Date(notice.popupStartDate) : null,
      popupEndDate: notice.popupEndDate ? new Date(notice.popupEndDate) : null,
      existingImages: notice.imageUrls || []
    });
    setNewImages([]);
    setIsEditing(true);
  };

  const handleImageChange = (e) => {
    setNewImages([...newImages, ...Array.from(e.target.files)]);
  };

  const handleRemoveExistingImage = (indexToRemove) => {
    setEditedNotice({
      ...editedNotice,
      existingImages: editedNotice.existingImages.filter((_, index) => index !== indexToRemove)
    });
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
      formData.append('title', editedNotice.title);
      formData.append('content', editedNotice.content);
      formData.append('popup', editedNotice.popup);
      if (editedNotice.popup) {
        formData.append('popupStartDate', editedNotice.popupStartDate.toISOString());
        formData.append('popupEndDate', editedNotice.popupEndDate.toISOString());
      }
      
      editedNotice.existingImages.forEach(url => {
        formData.append('existingImages', url);
      });
      
      newImages.forEach(image => {
        formData.append('images', image);
      });

      const response = await fetch(`https://tirebank.jebee.net/api/notices/${notice.noticeId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '공지사항 수정에 실패했습니다.');
      }

      setSnackbar({
        open: true,
        message: '공지사항이 성공적으로 수정되었습니다.',
        severity: 'success'
      });
      
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || '공지사항 수정에 실패했습니다.',
        severity: 'error'
      });
    }
  };

  const handleDelete = async () => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        const response = await fetch(`https://tirebank.jebee.net/api/notices/${notice.noticeId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || '공지사항 삭제에 실패했습니다.');
        }

        setSnackbar({
          open: true,
          message: '공지사항이 성공적으로 삭제되었습니다.',
          severity: 'success'
        });

        onClose();
        if (onDelete) onDelete();
      } catch (error) {
        setSnackbar({
          open: true,
          message: error.message || '공지사항 삭제에 실패했습니다.',
          severity: 'error'
        });
      }
    }
  };

  if (!notice) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR');
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {isEditing ? (
            <Typography sx={{ 
              fontSize: '1.1rem',
              fontWeight: 500
            }}>
              공지사항 수정
            </Typography>
          ) : (
            <Typography sx={{ 
              fontSize: '1.1rem',
              fontWeight: 500
            }}>
              {notice.title}
            </Typography>
          )}
          {isAuthor && !isEditing && (
            <Box>
              <IconButton size="small" onClick={handleEditClick}>
                <EditIcon />
              </IconButton>
              {/* <IconButton size="small" onClick={handleDelete}>
                <DeleteIcon />
              </IconButton> */}
            </Box>
          )}
        </DialogTitle>

        <DialogContent>
          {isEditing ? (
            <Grid container spacing={2}>
              <Grid item xs={12}>
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
                  <span>공지사항 제목</span>
                  <Divider sx={{ flex: 1 }} />
                </Typography>
                <TextField
                  fullWidth
                  value={editedNotice.title}
                  onChange={(e) => setEditedNotice({...editedNotice, title: e.target.value})}
                  placeholder="공지사항 제목을 입력해주세요"
                  sx={{ mb: 3 }}
                />
              </Grid>
              <Grid item xs={12}>
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
                  <span>공지사항 내용</span>
                  <Divider sx={{ flex: 1 }} />
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={editedNotice.content}
                  onChange={(e) => setEditedNotice({...editedNotice, content: e.target.value})}
                  placeholder="공지사항 내용을 입력해주세요"
                  sx={{ 
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#f8f9fa'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  id="edit-image-upload"
                  onChange={handleImageChange}
                />
                <label htmlFor="edit-image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    size="small"
                  >
                    이미지 추가
                  </Button>
                </label>

                {editedNotice.existingImages.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      기존 이미지 ({editedNotice.existingImages.length})
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {editedNotice.existingImages.map((url, index) => (
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
                            src={`https://tirebank.jebee.net/uploads/images/${url}`}
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
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editedNotice.popup}
                      onChange={(e) => setEditedNotice({...editedNotice, popup: e.target.checked})}
                    />
                  }
                  label="팝업 공지"
                />
              </Grid>
              {editedNotice.popup && (
                <>
                  <Grid item xs={6}>
                    <DateTimePicker
                      label="팝업 시작일시"
                      value={editedNotice.popupStartDate}
                      onChange={(date) => setEditedNotice({...editedNotice, popupStartDate: date})}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <DateTimePicker
                      label="팝업 종료일시"
                      value={editedNotice.popupEndDate}
                      onChange={(date) => setEditedNotice({...editedNotice, popupEndDate: date})}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          ) : (
            <>
              <Box sx={{ mb: 2, color: 'grey.600' }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  작성자: {notice.writerName}
                </Typography>
                <Typography variant="body2">
                  작성일: {formatDate(notice.createdAt)}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
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
                  <span>공지사항 내용</span>
                  <Divider sx={{ flex: 1 }} />
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    whiteSpace: 'pre-wrap',
                    p: 2,
                    bgcolor: '#f8f9fa',
                    borderRadius: 1,
                    border: '1px solid #e9ecef'
                  }}
                >
                  {notice.content}
                </Typography>
              </Box>

              {notice.imageUrls && notice.imageUrls.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      mb: 1.5,
                      color: 'text.secondary',
                      fontWeight: 500
                    }}
                  >
                    첨부파일 ({notice.imageUrls.length})
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    flexWrap: 'wrap',
                    p: 1,
                    bgcolor: '#f8f9fa',
                    borderRadius: 1
                  }}>
                    {notice.imageUrls.map((url, index) => (
                      <Box 
                        key={index}
                        component="img"
                        src={`https://tirebank.jebee.net/uploads/images/${url}`}
                        alt={`첨부이미지 ${index + 1}`}
                        sx={{ 
                          width: '100px',
                          height: '100px',
                          objectFit: 'cover',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          border: '1px solid #e9ecef',
                          '&:hover': { 
                            opacity: 0.8,
                            transform: 'scale(1.02)',
                            transition: 'all 0.2s ease-in-out'
                          }
                        }}
                        onClick={() => {
                          setSelectedImages([url]);
                          setImageModalOpen(true);
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {notice.popup && (
                <>
                  <Box>
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
                      <span>팝업 게시기간</span>
                      <Divider sx={{ flex: 1 }} />
                    </Typography>
                    <Box sx={{ 
                      p: 2.5,
                      bgcolor: 'rgba(0, 0, 0, 0.02)', 
                      borderRadius: 1,
                      color: 'text.secondary'
                    }}>
                      <Typography variant="body2" sx={{ 
                        fontSize: '0.9rem',
                        lineHeight: 1.8
                      }}>
                        {formatDate(notice.popupStartDate)}
                        <br />
                        ~ {formatDate(notice.popupEndDate)}
                      </Typography>
                    </Box>
                  </Box>
                </>
              )}

            </>
          )}
        </DialogContent>

        <DialogActions>
          {isEditing ? (
            <>
              <Button onClick={() => setIsEditing(false)}>취소</Button>
              <Button onClick={handleUpdate} variant="contained">수정</Button>
            </>
          ) : (
            <Button onClick={onClose}>닫기</Button>
          )}
        </DialogActions>
      </Dialog>

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
          src={selectedImages.length > 0 ? `https://tirebank.jebee.net/uploads/images/${selectedImages[0]}` : ''}
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

export default NoticeDialog; 