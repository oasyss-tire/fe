import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Chip,
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { format } from 'date-fns';

const KakaoAlertDetail = ({ open, alert, onClose }) => {
  if (!alert) return null;

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
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <Typography 
            component="div"
            variant="h6" 
            sx={{ fontWeight: 500 }}
          >
            알림톡 상세 정보
          </Typography>
        </Box>
        <IconButton 
          onClick={onClose} 
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5 }}>
        <Box sx={{ mb: 3 }}>
          <SectionTitle>발신 정보</SectionTitle>
          <Box sx={{ 
            bgcolor: 'rgba(0, 0, 0, 0.02)',
            p: 2,
            borderRadius: 1
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ width: 80 }}>
                발신자:
              </Typography>
              <Chip 
                label={alert.username || `사용자 ${alert.userId}`}
                size="small"
                sx={{ 
                  bgcolor: alert.username ? '#e3f2fd' : '#f5f5f5',
                  color: alert.username ? '#1976d2' : '#666',
                  fontSize: '0.75rem'
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ width: 80 }}>
                발송시간:
              </Typography>
              <Typography variant="body2">
                {format(new Date(alert.sentAt), 'yyyy-MM-dd HH:mm:ss')}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <SectionTitle>수신자 정보</SectionTitle>
          <Box sx={{ 
            bgcolor: 'rgba(0, 0, 0, 0.02)',
            p: 2,
            borderRadius: 1
          }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {alert.receiverPhone}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <SectionTitle>전송 내용</SectionTitle>
          <Box sx={{ 
            bgcolor: 'rgba(0, 0, 0, 0.02)',
            p: 2,
            borderRadius: 1
          }}>
            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
              {alert.message}
            </Typography>
          </Box>
        </Box>

        <Box>
          <SectionTitle>발송 ID</SectionTitle>
          <Box sx={{ 
            bgcolor: 'rgba(0, 0, 0, 0.02)',
            p: 2,
            borderRadius: 1
          }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              {alert.cpId}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default KakaoAlertDetail; 