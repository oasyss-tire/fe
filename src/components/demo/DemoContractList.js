import React, { useState } from "react";
import { 
  Box, 
  Typography, 
  Card, 
  Button, 
  Grid,
  Chip,
  Divider,
  IconButton
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import AddIcon from '@mui/icons-material/Add';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/Pending';

const DemoContractList = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const contracts = [
    { 
      id: 1, 
      name: "임대차 계약서", 
      status: "승인 대기", 
      date: "2024-02-24",
      type: "임대차",
      participant: "김철수"
    },
    { 
      id: 2, 
      name: "매매 계약서", 
      status: "서명 완료", 
      date: "2024-02-23",
      type: "매매",
      participant: "이영희"
    },
    { 
      id: 3, 
      name: "용역 계약서", 
      status: "반려됨", 
      date: "2024-02-22",
      type: "용역",
      participant: "박지민"
    },
    { 
      id: 4, 
      name: "공급 계약서", 
      status: "진행 중", 
      date: "2024-02-21",
      type: "공급",
      participant: "최동욱"
    }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case "승인 대기":
        return <PendingIcon sx={{ fontSize: 18, color: '#6B7280' }} />;
      case "서명 완료":
        return <CheckCircleIcon sx={{ fontSize: 18, color: '#059669' }} />;
      case "반려됨":
        return <ErrorIcon sx={{ fontSize: 18, color: '#DC2626' }} />;
      case "진행 중":
        return <AccessTimeIcon sx={{ fontSize: 18, color: '#2563EB' }} />;
      default:
        return null;
    }
  };

  const getStatusStyle = (status) => {
    const baseStyle = {
      height: 24,
      borderRadius: '6px',
      fontSize: '0.75rem',
      fontWeight: 500,
      border: '1px solid'
    };

    switch (status) {
      case "승인 대기":
        return { 
          ...baseStyle, 
          bgcolor: '#F3F4F6',
          color: '#6B7280',
          borderColor: '#E5E7EB'
        };
      case "서명 완료":
        return { 
          ...baseStyle, 
          bgcolor: '#ECFDF5',
          color: '#059669',
          borderColor: '#D1FAE5'
        };
      case "반려됨":
        return { 
          ...baseStyle, 
          bgcolor: '#FEF2F2',
          color: '#DC2626',
          borderColor: '#FEE2E2'
        };
      case "진행 중":
        return { 
          ...baseStyle, 
          bgcolor: '#EFF6FF',
          color: '#2563EB',
          borderColor: '#DBEAFE'
        };
      default:
        return baseStyle;
    }
  };

  // 페이지네이션 계산
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentContracts = contracts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(contracts.length / itemsPerPage);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#F8F9FA', minHeight: '100vh' }}>
      <Typography 
        variant="h5" 
        sx={{ 
          fontWeight: 700,
          color: '#1A237E',
          textAlign: 'center',
          mb: 4
        }}
      >
        계약 목록
      </Typography>

      <Grid container spacing={2}>
        {currentContracts.map((contract) => (
          <Grid item xs={12} key={contract.id}>
            <Card 
              sx={{ 
                p: 2,
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1A237E' }}>
                    {contract.name}
                  </Typography>
                  <Chip 
                    label={contract.type}
                    size="small"
                    sx={{ 
                      bgcolor: '#E8EAF6',
                      color: '#3F51B5',
                      fontWeight: 500,
                      fontSize: '0.75rem'
                    }}
                  />
                </Box>
                <IconButton 
                  size="small"
                  onClick={() => navigate(`/demo/contract/${contract.id}`)}
                >
                  <NavigateNextIcon />
                </IconButton>
              </Box>

              <Divider sx={{ my: 1 }} />

              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 1
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ color: '#666', display: 'flex', alignItems: 'center', gap: 0.5 }}
                  >
                    <AccessTimeIcon sx={{ fontSize: 16 }} />
                    {contract.date}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ color: '#666' }}
                  >
                    참여자: {contract.participant}
                  </Typography>
                </Box>
                <Chip
                  icon={getStatusIcon(contract.status)}
                  label={contract.status}
                  sx={getStatusStyle(contract.status)}
                />
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        mt: 4, 
        mb: 2 
      }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/demo/upload-contract")}
          sx={{
            bgcolor: '#1A237E',
            '&:hover': { bgcolor: '#283593' },
            borderRadius: '8px',
            boxShadow: 'none',
            px: 3
          }}
        >
          계약서 작성
        </Button>
      </Box>

      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          mt: 2,
          gap: 2 
        }}
      >
        <Button
          size="small"
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
          sx={{
            minWidth: '40px',
            height: '40px',
            p: 0,
            borderRadius: '20px',
            color: '#1A237E',
            '&:hover': {
              bgcolor: '#E8EAF6'
            }
          }}
        >
          ◀
        </Button>
        {[...Array(totalPages)].map((_, index) => (
          <Button
            key={index + 1}
            onClick={() => handlePageChange(index + 1)}
            sx={{
              minWidth: '40px',
              height: '40px',
              p: 0,
              borderRadius: '20px',
              bgcolor: currentPage === index + 1 ? '#1A237E' : 'transparent',
              color: currentPage === index + 1 ? 'white' : '#1A237E',
              '&:hover': {
                bgcolor: currentPage === index + 1 ? '#283593' : '#E8EAF6'
              }
            }}
          >
            {index + 1}
          </Button>
        ))}
        <Button
          size="small"
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
          sx={{
            minWidth: '40px',
            height: '40px',
            p: 0,
            borderRadius: '20px',
            color: '#1A237E',
            '&:hover': {
              bgcolor: '#E8EAF6'
            }
          }}
        >
          ▶
        </Button>
      </Box>
    </Box>
  );
};

export default DemoContractList;
