import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Divider,
  IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const NoticeDetail = () => {
  const { noticeId } = useParams();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    fetchNoticeDetail();
  }, [noticeId]);

  const fetchNoticeDetail = async () => {
    try {
      const response = await fetch(`https://tirebank.jebee.net/api/notices/${noticeId}`);
      if (response.ok) {
        const data = await response.json();
        setNotice(data);
      }
    } catch (error) {
      console.error('공지사항 상세 조회 실패:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR');
  };

  if (!notice) return null;

  return (
    <Box sx={{ p: 2, maxWidth: '430px', margin: '0 auto' }}>
      {/* 헤더 */}
      <Box sx={{ 
        position: 'sticky', 
        top: 0, 
        bgcolor: '#FFFFFF',
        borderBottom: '1px solid #eee',
        zIndex: 1,
        pb: 2,
        display: 'flex',
        alignItems: 'center'
      }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ ml: 1 }}>공지사항</Typography>
      </Box>

      <Paper sx={{ mt: 4, p: 2, boxShadow: 'none' }}>
        <Typography variant="h6" gutterBottom>
          {notice.title}
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, color: 'grey.600' }}>
          <Typography variant="body2">
            작성자: {notice.writerName}
          </Typography>
          <Typography variant="body2">
            {formatDate(notice.createdAt)}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {notice.imageUrl && (
          <Box sx={{ mb: 2 }}>
            <img 
              src={`https://tirebank.jebee.net/uploads/images/${notice.imageUrl}`}
              alt="공지사항 이미지"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </Box>
        )}

        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {notice.content}
        </Typography>

        {notice.popup && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              팝업 게시 기간: {formatDate(notice.popupStartDate)} ~ {formatDate(notice.popupEndDate)}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default NoticeDetail; 