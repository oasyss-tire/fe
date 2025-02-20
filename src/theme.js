import { createTheme } from '@mui/material/styles';

/* 테마 생성 Material UI 컴포넌트 스타일 적용*/
const theme = createTheme({
  palette: {
    /* 색상 적용*/
    primary: {
      main: '#343959',
    },
    text: {
      primary: '#2A2A2A',
      secondary: '#666666',
    },
    background: {
      default: '#FFFFFF',
      paper: '#FFFFFF',
    },
  },
  components: {
    /* 버튼 스타일 적용*/
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          textTransform: 'none',
          boxShadow: 'none',
        },
        contained: {
          backgroundColor: '#343959',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#3d63b8',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          },
        },
        outlined: {
          borderColor: '#343959',
          color: '#343959',
          '&:hover': {
            borderColor: '#3d63b8',
            color: '#3d63b8',
            backgroundColor: 'rgba(61, 99, 184, 0.04)',
          },
        },
      },
    },
    /* 텍스트 필드 스타일 적용*/
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#f8f9fa',
            borderRadius: '10px',
            '& fieldset': {
              borderColor: '#e0e0e0',
            },
            '&:hover fieldset': {
              borderColor: '#343959',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#343959',
            }
          },
          '& .MuiInputLabel-root': {
            color: '#666',
            '&.Mui-focused': {
              color: '#343959',
            }
          }
        }
      }
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: '#f8f9fa',
          borderRadius: '10px',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#e0e0e0',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#343959',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#343959',
          }
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '20px',
        }
      }
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #eee',
          padding: '10px',
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '0px',
        }
      }
    }
  },
  typography: {
    /* 폰트 적용*/
    fontFamily: 'Pretendard, sans-serif',
    h6: {
      fontWeight: 500,
      color: '#343959',
    },
    subtitle1: {
      fontWeight: 500,
      color: '#343959',
    },
    body1: {
      color: '#2A2A2A',
    },
    button: {
      fontWeight: 500,
    },
  },
});

export default theme; 