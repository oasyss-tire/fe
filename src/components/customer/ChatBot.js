import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Paper,
  CircularProgress,
  Button
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';


const ChatBot = () => {
  // 초기 메시지 추가
  const initialMessage = {
    type: 'bot',
    content: '안녕하세요 👋\n궁금하신 내용이 있으시다면 편하게 문의해 주세요.'
  };

  // 대화 메시지 상태 관리
  const [messages, setMessages] = useState(() => {
    // sessionStorage에서 채팅 기록 불러오기
    const savedMessages = sessionStorage.getItem('chatMessages');
    // 저장된 메시지가 있으면 그대로 사용, 없으면 초기 메시지만 표시
    return savedMessages ? JSON.parse(savedMessages) : [initialMessage];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // 대화 메시지 변경 시 sessionStorage에 저장
  useEffect(() => {
    sessionStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  // 메시지 전송 처리
  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // 사용자 메시지 추가
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);

    try {
      const response = await fetch('http://localhost:8080/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({ question: userMessage })
      });

      const data = await response.json();
      
      // 봇 응답 추가
      setMessages(prev => [...prev, { type: 'bot', content: data.response }]);
    } catch (error) {
      console.error('챗봇 응답 오류:', error);
      setMessages(prev => [...prev, { 
        type: 'bot', 
        content: '죄송합니다. 일시적인 오류가 발생했습니다.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  // 엔터 키 처리
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 새 대화 시작 버튼
  const handleNewChat = () => {
    if (window.confirm('새로운 대화를 시작하시겠습니까?')) {
      setMessages([initialMessage]);  // 초기 메시지만 남기고 초기화
      sessionStorage.removeItem('chatMessages');
    }
  };

  return (
    <Box sx={{ 
      height: 'calc(100vh - 180px)', 
      display: 'flex', 
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* 헤더에 새 대화 시작 버튼 */}
      <Box sx={{ 
        position: 'sticky', 
        top: 0, 
        px: 2,  // 좌우 패딩만 적용
        py: 1.5,
        bgcolor: '#FFFFFF',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center'
      }}>
        <Button 
          onClick={handleNewChat}
          disableRipple
          sx={{ 
            minWidth: 'auto',
            fontSize: '0.813rem',
            color: '#666',
            p: 0,
            '&:hover': {
              backgroundColor: 'transparent',
              color: '#1C243A'
            },
            '& .MuiButton-startIcon': {
              mr: 0.5,
              '& svg': {
                fontSize: '1rem'
              }
            }
          }}
          startIcon={
            <RefreshIcon sx={{ 
              fontSize: 'inherit',
              transition: 'transform 0.2s ease'
            }} />
          }
        >
          새로운 대화
        </Button>
      </Box>

      {/* 메시지 영역 */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        pb: '80px'
      }}>
        {messages.map((message, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <Paper
              sx={{
                p: 2,
                maxWidth: '80%',
                bgcolor: message.type === 'user' ? '#E3F2FD' : '#f5f5f5',
                color: 'text.primary',
                borderRadius: message.type === 'user' 
                  ? '20px 20px 5px 20px'
                  : '20px 20px 20px 5px',
                boxShadow: 'none',
                whiteSpace: 'pre-line'  // 줄바꿈 지원
              }}
            >
              <Typography 
                variant="body1" 
                sx={{ 
                  color: message.type === 'user' ? '#1565C0' : 'text.primary'
                }}
              >
                {message.content}
              </Typography>
            </Paper>
          </Box>
        ))}
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              답변 생성 중...
            </Typography>
          </Box>
        )}
      </Box>

      {/* 입력 영역 - 하단 고정 */}
      <Box sx={{ 
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        boxShadow: '0px -2px 10px rgba(0,0,0,0.05)'
      }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="궁금한 것을 물어보세요!"
          variant="outlined"
          InputProps={{
            endAdornment: (
              <IconButton 
                onClick={handleSendMessage}
                disabled={!input.trim() || loading}
                color="primary"
              >
                <SendIcon />
              </IconButton>
            ),
            sx: {
              borderRadius: 2,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(0, 0, 0, 0.1)'
              }
            }
          }}
          sx={{ 
            '& .MuiOutlinedInput-root': {
              padding: '8px 14px',
              backgroundColor: '#FFFFFF'
            }
          }}
        />
      </Box>
    </Box>
  );
};

export default ChatBot; 