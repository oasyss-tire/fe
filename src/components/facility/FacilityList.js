import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  Pagination,
  Skeleton,
  Button
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const FacilityList = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  const statusColors = {
    IN_USE: 'success',
    DISPOSED: 'error',
    LOST: 'warning',
    SOLD: 'info',
    MOVED: 'default'
  };

  const statusText = {
    IN_USE: '사용중',
    DISPOSED: '폐기',
    LOST: '분실',
    SOLD: '매각',
    MOVED: '이동'
  };

  useEffect(() => {
    fetchFacilities();
  }, [page, searchKeyword, statusFilter]);

  const fetchFacilities = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8080/api/facilities?page=${page-1}&size=12&keyword=${searchKeyword}&status=${statusFilter}`,
        {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        }
      );
      const data = await response.json();
      setFacilities(data.content);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('시설물 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* 헤더 추가 */}
      <Box sx={{ 
        mb: 4, 
        textAlign: 'center',
        borderBottom: '1px solid #f0f0f0',
        pb: 2
      }}>
        <Typography variant="h5" sx={{ 
          fontWeight: 500,
          color: '#1a1a1a',
          letterSpacing: '-0.5px'
        }}>
          시설물 재고조회
        </Typography>
      </Box>

      {/* 검색 필터 영역 */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' }, 
        gap: 2,
        width: { xs: '100%', sm: 'auto' },
        mb: 3
      }}>
        
        <TextField
          placeholder="시설물 검색"
          variant="outlined"
          size="small"
          fullWidth
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
          }}
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          sx={{ maxWidth: { sm: '300px' } }}
        />
        <TextField
          select
          size="small"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: '120px' }}
        >
          <MenuItem value="">전체 상태</MenuItem>
          {Object.entries(statusText).map(([key, value]) => (
            <MenuItem key={key} value={key}>{value}</MenuItem>
          ))}
        </TextField>
      </Box>

      {/* 시설물 카드 그리드 */}
      <Grid container spacing={2}>
        {loading ? (
          // 로딩 스켈레톤
          [...Array(12)].map((_, index) => (
            <Grid item xs={12} sm={6} md={6} key={index}>
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
          // 실제 데이터
          facilities.map((facility) => (
            <Grid 
              item 
              xs={12}      // 가장 작은 화면에서 1개 (12/12)
              sm={6}       // 중간 화면에서 2개 (6/12)
              md={6}       // 큰 화면에서도 2개 (6/12)
              key={facility.id}
            >
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 3
                  }
                }}
                onClick={() => navigate(`/facility/${facility.id}`)}
              >
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    paddingTop: '100%' // 1:1 비율 유지
                  }}
                >
                  <CardMedia
                    component="img"
                    src={facility.thumbnailUrl 
                      ? `http://localhost:8080/api/facilities/images/${facility.thumbnailUrl}`
                      : '/images/no-image.png'
                    }
                    alt={facility.name}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: facility.thumbnailUrl ? 'cover' : 'none',  // 썸네일이 없을 때는 원본 비율 유지
                      objectPosition: 'center',  // 가운데 정렬
                      p: facility.thumbnailUrl ? 0 : '25%',  // 썸네일이 없을 때 여백 추가
                      bgcolor: facility.thumbnailUrl ? 'transparent' : '#f5f5f5'  // 썸네일이 없을 때 배경색 추가
                    }}
                    onError={(e) => {
                      e.target.src = '/images/no-image.png';
                      e.target.style.objectFit = 'none';
                      e.target.style.padding = '25%';
                      e.target.style.backgroundColor = '#f5f5f5';
                    }}
                  />
                </Box>
                <CardContent>
                  <Box sx={{ mb: 1 }}>
                    <Chip 
                      label={statusText[facility.status]} 
                      color={statusColors[facility.status]}
                      size="small"
                    />
                  </Box>
                  <Typography variant="h6" component="div" gutterBottom noWrap>
                    {facility.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationIcon sx={{ fontSize: '1rem', mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {facility.currentLocation}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <MoneyIcon sx={{ fontSize: '1rem', mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {facility.acquisitionCost?.toLocaleString()}원
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* 버튼과 페이지네이션 컨테이너 */}
      <Box sx={{ mt: 4 }}>
        {/* 등록 버튼 */}
        <Box sx={{ 
          display: 'flex',
          justifyContent: 'flex-end',
          mb: 2  // 페이지네이션과의 간격
        }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/facility/create')}
            sx={{
              bgcolor: '#3182F6',
              '&:hover': { bgcolor: '#3d63b8' },
              minWidth: 'auto',
              whiteSpace: 'nowrap'
            }}
          >
            시설물 등록
          </Button>
        </Box>

        {/* 페이지네이션 */}
        <Box sx={{ 
          display: 'flex',
          justifyContent: 'center'
        }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      </Box>
    </Box>
  );
};

export default FacilityList; 