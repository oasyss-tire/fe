import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Collapse,
  IconButton,
  Typography,
  Divider,
  Paper
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

// FAQ 데이터
const faqData = [
  {
    category: '일반',
    items: [
      {
        question: '전기 안전 점검은 얼마나 자주 해야 하나요?',
        answer: '전기 안전 점검은 법적으로 연 1회 이상 실시해야 합니다. 하지만 시설의 규모와 용도에 따라 더 자주 점검이 필요할 수 있습니다.'
      },
      {
        question: '점검 결과는 어떻게 확인할 수 있나요?',
        answer: '점검이 완료되면 점검 결과서가 발행되며, 앱에서 바로 확인하실 수 있습니다. 또한 PDF 형태로 다운로드도 가능합니다.'
      }
    ]
  },
  {
    category: '서비스 이용',
    items: [
      {
        question: '점검 일정을 변경하고 싶어요.',
        answer: '점검 일정 변경은 예정일 3일 전까지 가능합니다. 고객센터로 문의해 주시면 도와드리겠습니다.'
      },
      {
        question: '앱 사용 중 오류가 발생했어요.',
        answer: '앱 사용 중 오류 발생 시, 앱을 완전히 종료 후 다시 실행해보세요. 문제가 지속되면 고객센터로 문의해주세요.'
      }
    ]
  }
];

const FAQ = () => {
  const [expanded, setExpanded] = useState({});

  const handleToggle = (categoryIndex, itemIndex) => {
    setExpanded(prev => ({
      ...prev,
      [`${categoryIndex}-${itemIndex}`]: !prev[`${categoryIndex}-${itemIndex}`]
    }));
  };

  return (
    <Box>
      {faqData.map((category, categoryIndex) => (
        <Box key={categoryIndex} sx={{ mb: 3 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontSize: '1rem',
              fontWeight: 600,
              mb: 2,
              color: '#1C243A'
            }}
          >
            {category.category}
          </Typography>
          <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <List disablePadding>
              {category.items.map((item, itemIndex) => (
                <React.Fragment key={itemIndex}>
                  <ListItem 
                    button 
                    onClick={() => handleToggle(categoryIndex, itemIndex)}
                    sx={{
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.02)'
                      }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 500,
                            color: expanded[`${categoryIndex}-${itemIndex}`] ? '#1C243A' : 'text.primary'
                          }}
                        >
                          {item.question}
                        </Typography>
                      }
                    />
                    <IconButton edge="end">
                      {expanded[`${categoryIndex}-${itemIndex}`] ? 
                        <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </ListItem>
                  <Collapse 
                    in={expanded[`${categoryIndex}-${itemIndex}`]} 
                    timeout="auto"
                  >
                    <Box 
                      sx={{ 
                        p: 2, 
                        bgcolor: 'rgba(0, 0, 0, 0.02)',
                        borderTop: '1px solid rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {item.answer}
                      </Typography>
                    </Box>
                  </Collapse>
                  {itemIndex < category.items.length - 1 && (
                    <Divider />
                  )}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Box>
      ))}
    </Box>
  );
};

export default FAQ; 