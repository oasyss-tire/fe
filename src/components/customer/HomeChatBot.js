import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Fab,
  Slide,
  CircularProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';

const HomeChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "안녕하세요! 무엇을 도와드릴까요?", isBot: true }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // 자동 스크롤: 메시지가 추가될 때마다 아래로 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { text: userMessage, isBot: false }]);
    setIsLoading(true);

    try {
      const response = await fetch('https://tirebank.jebee.net/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({
          question: userMessage,
          userId: sessionStorage.getItem('userId') || null
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [
          ...prev,
          { text: data.answer || data.response, isBot: true }
        ]);
      } else {
        throw new Error('응답 오류');
      }
    } catch (error) {
      console.error('챗봇 오류:', error);
      setMessages(prev => [
        ...prev,
        { text: "죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.", isBot: true }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Shift+Enter는 새 줄, Enter 단독은 전송
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 새 대화 시작 (옵션)
  const handleNewChat = () => {
    if (window.confirm('새로운 대화를 시작하시겠습니까?')) {
      setMessages([{ text: "안녕하세요! 무엇을 도와드릴까요?", isBot: true }]);
      sessionStorage.removeItem('chatMessages');
    }
  };

  return (
    <>
      {/* 채팅창 (슬라이드 애니메이션 적용) */}
      <Slide direction="up" in={isOpen} mountOnEnter unmountOnExit>
        <Paper
          elevation={6}
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 20,
            width: 320,
            height: 450,
            borderRadius: 2,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#fff',
            boxShadow: '0px 4px 20px rgba(0,0,0,0.15)',
            zIndex: 1000,
          }}
        >
          {/* 수정된 헤더 */}
          <Box sx={{
            px: 2,
            py: 1,
            bgcolor: '#fff',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#333' }}>
              챗봇 상담
            </Typography>
            <IconButton onClick={() => setIsOpen(false)} sx={{ color: '#333' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* 메시지 영역 */}
          <Box sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            backgroundColor: '#f0f2f5'
          }}>
            <List>
              {messages.map((message, index) => (
                <ListItem
                  key={index}
                  sx={{
                    justifyContent: message.isBot ? 'flex-start' : 'flex-end',
                    mb: 1
                  }}
                >
                  <Paper sx={{
                    p: 1.5,
                    backgroundColor: message.isBot ? '#fff' : '#4A90E2',
                    color: message.isBot ? '#333' : '#fff',
                    maxWidth: '80%',
                    borderRadius: message.isBot ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                    boxShadow: 'none'
                  }}>
                    <ListItemText 
                      primary={message.text}
                      sx={{
                        '& .MuiListItemText-primary': {
                          wordBreak: 'break-word'
                        }
                      }}
                    />
                  </Paper>
                </ListItem>
              ))}
              {isLoading && (
                <ListItem sx={{ justifyContent: 'flex-start' }}>
                  <CircularProgress size={20} />
                </ListItem>
              )}
              <div ref={messagesEndRef} />
            </List>
          </Box>

          {/* 입력 영역 */}
          <Box sx={{
            p: 1,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: '#fff',
            display: 'flex'
          }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              variant="outlined"
              disabled={isLoading}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    color="primary"
                  >
                    <SendIcon />
                  </IconButton>
                ),
                sx: {
                  borderRadius: 2,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' }
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': { padding: '8px 14px', backgroundColor: '#fff' }
              }}
            />
          </Box>
        </Paper>
      </Slide>

      {/* 챗봇 아이콘 (Fab 내부에 이미지로 변경) */}
      <Fab
        onClick={() => setIsOpen(!isOpen)}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
          p: 0,
          width: 56,
          height: 56,
          borderRadius: '50%',
          bgcolor: '#4A90E2',
          '&:hover': { bgcolor: '#357ABD' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box
          component="img"
          src="/images/chatbot.jpg"
          alt="Chatbot Icon"
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%',
            p: 0.5,
            bgcolor: '#fff'
          }}
        />
      </Fab>
    </>
  );
};

export default HomeChatBot;
