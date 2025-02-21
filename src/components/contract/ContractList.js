import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Grid,
  Button,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Pagination,
  Fab,
  Skeleton
} from '@mui/material';
import {
  Description as DescriptionIcon,
  Edit as EditIcon,
  Done as DoneIcon,
  Schedule as ScheduleIcon,
  Close as CloseIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const ContractList = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 9;  // 한 페이지당 보여줄 계약서 수
  const navigate = useNavigate();

  useEffect(() => {
    fetchContracts();
  }, [page]);  // 페이지 변경 시 데이터 다시 불러오기

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8080/api/contracts?page=${page-1}&size=${itemsPerPage}&sort=createdDate,desc`,
        {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        }
      );
      const data = await response.json();
      setContracts(Array.isArray(data) ? data : data?.content || []);
      setTotalPages(data?.totalPages || Math.ceil(data?.length / itemsPerPage) || 1);
    } catch (error) {
      console.error('계약서 목록 조회 실패:', error);
      setContracts([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SIGNED': return 'success';
      case 'PENDING': return 'warning';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'SIGNED': return '서명 완료';
      case 'PENDING': return '서명 대기';
      case 'REJECTED': return '거절됨';
      default: return '상태 없음';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '날짜 없음';
    try {
      return format(new Date(dateString), 'yy.MM.dd', { locale: ko });
    } catch (error) {
      console.error('날짜 변환 실패:', error);
      return '-';
    }
  };

  const handleCardClick = (contractId) => {
    navigate(`/contracts/${contractId}`);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 3, 
      backgroundColor: '#ffffff', 
      minHeight: '100vh',
      width: '100%',
      position: 'relative'  // Fab 버튼의 기준점
    }}>
      <Box sx={{ 
        mb: 4, 
        textAlign: 'center',  // 제목 중앙 정렬
        borderBottom: '1px solid #f0f0f0',
        pb: 2
      }}>
        <Typography variant="h5" sx={{ 
          fontWeight: 500,
          color: '#1a1a1a',
          letterSpacing: '-0.5px'
        }}>
          계약서 관리
        </Typography>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Grid container spacing={2}>
          {loading ? (
            // 로딩 스켈레톤
            [...Array(4)].map((_, index) => (
              <Grid item xs={12} sm={6} md={6} key={index}>  {/* md를 6으로 변경 */}
                <Card sx={{ height: '100%' }}>
                  <Skeleton variant="rectangular" height={140} />
                  <CardContent>
                    <Skeleton variant="text" />
                    <Skeleton variant="text" width="60%" />
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            // 실제 계약 데이터
            contracts.map((contract) => (
              <Grid 
                item 
                xs={12}      // 모바일: 1개
                sm={6}       // 태블릿: 2개
                md={6}       // 데스크톱: 2개 (변경)
                key={contract.id}
              >
                <Card 
                  sx={{ 
                    height: '100%',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: 3
                    }
                  }}
                  onClick={() => navigate(`/contracts/${contract.id}`)}
                >
                  <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                    <Typography 
                      variant="subtitle1" 
                      component="div" 
                      noWrap
                      sx={{ 
                        fontWeight: 500,
                        color: '#1a1a1a',
                        letterSpacing: '-0.3px',
                        mb: 2
                      }}
                    >
                      {contract.title || '제목 없음'}
                    </Typography>

                    <Box mb={2}>
                      <Chip 
                        label={getStatusText(contract.status)}
                        color={getStatusColor(contract.status)}
                        size="small"
                        sx={{ 
                          fontWeight: 400,
                          px: 1,
                          height: '24px',
                          backgroundColor: contract.status === 'PENDING' ? '#fff8e1' : 
                                        contract.status === 'SIGNED' ? '#e8f5e9' : '#ffebee',
                          color: contract.status === 'PENDING' ? '#f57c00' : 
                                 contract.status === 'SIGNED' ? '#2e7d32' : '#c62828',
                          border: 'none'
                        }}
                      />
                    </Box>

                    <Box sx={{ color: '#666', fontSize: '0.875rem', mb: 0.5 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        mb: 1,
                        minHeight: '24px'
                      }}>
                        <Typography component="span" sx={{ 
                          width: '80px',
                          color: '#999',
                          fontSize: 'inherit',
                          flexShrink: 0
                        }}>
                          위수탁자
                        </Typography>
                        <Typography component="span" sx={{ fontSize: 'inherit' }}>
                          {contract.contracteeName || '미지정'}
                        </Typography>
                      </Box>

                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        mb: 1,
                        minHeight: '24px'
                      }}>
                        <Typography component="span" sx={{ 
                          width: '80px',
                          color: '#999',
                          fontSize: 'inherit',
                          flexShrink: 0
                        }}>
                          생성일
                        </Typography>
                        <Typography 
                          component="span" 
                          sx={{ 
                            fontSize: 'inherit',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {formatDate(contract.createdDate)}
                        </Typography>
                      </Box>

                      {contract.signedDate && (
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          minHeight: '24px'
                        }}>
                          <Typography component="span" sx={{ 
                            width: '80px',
                            color: '#999',
                            fontSize: 'inherit',
                            flexShrink: 0
                          }}>
                            서명일
                          </Typography>
                          <Typography 
                            component="span" 
                            sx={{ 
                              fontSize: 'inherit',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {formatDate(contract.signedDate)}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>

                  <CardActions sx={{ 
                    justifyContent: 'flex-end', 
                    p: 1.5,
                    borderTop: '1px solid #f5f5f5',
                    bgcolor: '#ffffff'
                  }}>

                  
                  </CardActions>
                </Card>
              </Grid>
            ))
          )}
          {(!contracts || contracts.length === 0) && (
            <Grid item xs={12}>
              <Box sx={{ 
                textAlign: 'center', 
                py: 4,
                color: '#666'
              }}>
                계약서가 없습니다.
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>

      <Box sx={{ mt: 4 }}>
        {/* 등록 버튼 컨테이너 */}
        <Box sx={{ 
          display: 'flex',
          justifyContent: 'flex-end',
          mb: 3  // 페이지네이션과의 간격
        }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/contract/upload')}
            sx={{ 
              backgroundColor: '#343959',
              '&:hover': {
                backgroundColor: '#3d63b8'
              }
            }}
          >
            계약서 등록
          </Button>
        </Box>

        {/* 페이지네이션 컨테이너 */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center',
          mb: 4
        }}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={handlePageChange}
            color="primary"
            size="large"
            sx={{
              '& .MuiPaginationItem-root': {
                width: '30px',
                height: '30px',
                minWidth: '30px',
                fontSize: '0.775rem'
              }
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ContractList; 