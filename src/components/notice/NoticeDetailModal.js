import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Divider,
  Grid,
  Modal
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const NoticeDetailModal = ({ open, notice, onClose }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  if (!notice) return null;

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const handleCloseImage = () => {
    setSelectedImage(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const SectionTitle = ({ children }) => (
    <Box sx={{ 
      display: 'flex',
      alignItems: 'center',
      mb: 2,
    }}>
      <Typography 
        variant="body2" 
        color="text.secondary"
        sx={{ 
          fontWeight: 500,
          fontSize: '0.9rem',
          mr: 2  // 텍스트와 선 사이 간격
        }}
      >
        {children}
      </Typography>
      <Box sx={{ 
        flex: 1,
        height: '1px',
        bgcolor: 'rgba(0, 0, 0, 0.08)'  // 은은한 구분선 색상
      }} />
    </Box>
  );

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            maxWidth: '430px',
            m: 0,
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center',
          p: 2,
          borderBottom: '1px solid #eee'
        }}>
          <Typography sx={{ ml: 1 }}>공지사항</Typography>
          <IconButton 
            onClick={onClose} 
            size="small"
            sx={{ ml: 'auto' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 2.5 }}>
          <Typography variant="h6" sx={{ 
            fontSize: '1.1rem',
            fontWeight: 600,
            mb: 2
          }}>
            {notice.title}
          </Typography>
          
          <Box sx={{ mb: 3, color: 'text.secondary' }}>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              작성자: {notice.writerName}
            </Typography>
            <Typography variant="body2">
              작성일: {formatDate(notice.createdAt)}
            </Typography>
          </Box>


          <Box sx={{ mb: 3 }}>
            <SectionTitle>공지 내용</SectionTitle>
            <Box sx={{ 
              bgcolor: 'rgba(0, 0, 0, 0.02)',
              p: 2.5,
              borderRadius: 1
            }}>
              <Typography variant="body1" sx={{ 
                whiteSpace: 'pre-wrap',
                color: 'text.primary',
                fontSize: '0.9rem',
                lineHeight: 1.6
              }}>
                {notice.content}
              </Typography>
            </Box>
          </Box>

          {notice.imageUrls && notice.imageUrls.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <SectionTitle>첨부 이미지</SectionTitle>
              <Grid container spacing={1.5}>
                {notice.imageUrls.map((imageUrl, index) => (
                  <Grid item xs={6} key={index}>
                    <Box
                      sx={{
                        position: 'relative',
                        paddingTop: '100%',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        '&:hover': {
                          '& img': {
                            transform: 'scale(1.05)',
                          },
                          '& .overlay': {
                            opacity: 1,
                          },
                        },
                      }}
                      onClick={() => handleImageClick(imageUrl)}
                    >
                      <img 
                        src={`https://tirebank.jebee.net/uploads/images/${imageUrl}`}
                        alt={`공지사항 이미지 ${index + 1}`}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.3s ease',
                        }}
                      />
                      <Box
                        className="overlay"
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: 'rgba(0,0,0,0.2)',
                          opacity: 0,
                          transition: 'opacity 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography 
                          sx={{ 
                            color: 'white',
                            fontSize: '0.8rem',
                            fontWeight: 500
                          }}
                        >
                          클릭하여 확대
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {notice.popup && (
            <Box>
              <SectionTitle>팝업 게시 기간</SectionTitle>
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
          )}
        </DialogContent>
      </Dialog>

      <Modal
        open={!!selectedImage}
        onClose={handleCloseImage}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box
          component="img"
          src={selectedImage ? `https://tirebank.jebee.net/uploads/images/${selectedImage}` : ''}
          alt="확대된 이미지"
          sx={{
            maxWidth: '90vw',
            maxHeight: '90vh',
            objectFit: 'contain',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 1
          }}
          onClick={handleCloseImage}
        />
      </Modal>
    </>
  );
};

export default NoticeDetailModal; 