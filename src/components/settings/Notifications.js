import React from 'react';
import { Box, Paper, List, ListItem, ListItemText, Switch, Typography } from '@mui/material';

const Notifications = () => {
  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: '#FFFFFF',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 헤더 */}
      <Box sx={{ 
        p: 2, 
        position: 'sticky',
        top: 0,
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #EEEEEE',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600, 
            color: '#2A2A2A',
            textAlign: 'center'
          }}
        >
          알림 설정
        </Typography>
      </Box>

      {/* 컨텐츠 */}
      <Box sx={{ 
        flex: 1, 
        p: 2,
        overflow: 'auto'
      }}>
        <Paper>
          <List>
            <ListItem>
              <ListItemText 
                primary="점검 예정 알림" 
                secondary="점검 일정 전 알림 설정" 
              />
              <Switch />
            </ListItem>
          </List>
        </Paper>
      </Box>
    </Box>
  );
};

export default Notifications; 