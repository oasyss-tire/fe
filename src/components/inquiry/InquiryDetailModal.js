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
  Modal,
  Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const InquiryDetailModal = ({ open, inquiry, onClose }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  if (!inquiry) return null;

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
          mr: 2
        }}
      >
        {children}
      </Typography>
      <Box sx={{ 
        flex: 1,
        height: '1px',
        bgcolor: 'rgba(0, 0, 0, 0.08)'
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
          <Typography sx={{ ml: 1 }}>문의사항</Typography>
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
            {inquiry.inquiryTitle}
          </Typography>
          
          <Box sx={{ mb: 3, color: 'text.secondary' }}>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              작성자: {inquiry.writerName}
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              연락처: {inquiry.contactNumber}
            </Typography>
            <Typography variant="body2">
              작성일: {formatDate(inquiry.createdAt)}
            </Typography>
          </Box>


          <Box sx={{ mb: 3 }}>
            <SectionTitle>문의 내용</SectionTitle>
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
                {inquiry.inquiryContent}
              </Typography>
            </Box>
          </Box>

          {inquiry.imageUrls && inquiry.imageUrls.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <SectionTitle>첨부 이미지</SectionTitle>
              <Grid container spacing={1.5}>
                {inquiry.imageUrls.map((imageUrl, index) => (
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
                        src={`https://tirebank.jebee.net/uploads/inquiry_images/${imageUrl}`}
                        alt={`문의사항 이미지 ${index + 1}`}
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

          <Box>
            <SectionTitle>
              처리상태{' '}
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
            </SectionTitle>
            
            {inquiry.processed && (
              <Box sx={{ 
                p: 2.5,
                bgcolor: 'rgba(76, 175, 80, 0.05)', 
                borderRadius: 1,
                border: '1px solid rgba(76, 175, 80, 0.2)',
                color: 'text.secondary'
              }}>
                {inquiry.processContent && (
                  <Typography variant="body2" sx={{ 
                    fontSize: '0.9rem',
                    lineHeight: 1.8,
                    mb: inquiry.memo ? 2 : 0
                  }}>
                    {inquiry.processContent}
                  </Typography>
                )}
                {inquiry.memo && (
                  <>
                    <Divider sx={{ my: 2, opacity: 0.2 }} />
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      메모
                    </Typography>
                    <Typography variant="body2" sx={{ 
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
          src={selectedImage ? `https://tirebank.jebee.net/uploads/inquiry_images/${selectedImage}` : ''}
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

export default InquiryDetailModal; 