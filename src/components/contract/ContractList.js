import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  Chip,
  Menu
} from '@mui/material';
import { 
  Search as SearchIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  CalendarToday as CalendarTodayIcon,
  MoreVert as MoreVertIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ContractList = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedContractId, setSelectedContractId] = useState(null);

  // 계약 목록 조회
  const fetchContracts = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/contracts');
      if (!response.ok) throw new Error('계약 목록 조회 실패');
      const data = await response.json();
      console.log('Fetched contracts:', data); // 데이터 로그 확인
      setContracts(data);
    } catch (error) {
      console.error('계약 목록 조회 중 오류:', error);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const handleMenuClick = (event, contractId) => {
    setAnchorEl(event.currentTarget);
    setSelectedContractId(contractId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedContractId(null);
  };

  // 계약 상태에 따른 Chip 컴포넌트 렌더링 (수정: statusCode와 statusName 사용)
  const renderStatusChip = (contract) => {
    // 기본 상태 설정 (fallback)
    let label = "계약 대기";
    let color = "#666";
    let bgColor = "#F5F5F5";

    // statusCode와 statusName 있는 경우 우선 사용
    if (contract.statusName) {
      label = contract.statusName;
      
      // 상태 코드에 따른 스타일 지정
      if (contract.statusCodeId === "001002_0001") { // 승인대기
        color = "#FF9800";
        bgColor = "#FFF3E0";
      } else if (contract.statusCodeId === "001002_0002") { // 계약완료
        color = "#3182F6";
        bgColor = "#E8F3FF";
      } else if (contract.statusCodeId === "001002_0003") { // 임시저장
        color = "#9E9E9E";
        bgColor = "#F5F5F5";
      } else if (contract.statusCodeId === "001002_0004") { // 서명진행중
        color = "#FF9800";
        bgColor = "#FFF3E0";
      }
    } else {
      // 기존 로직 (fallback)
      if (contract.progressRate === 100) {
        label = "계약 완료";
        color = "#3182F6";
        bgColor = "#E8F3FF";
      } else if (contract.progressRate > 0) {
        label = "서명 진행중";
        color = "#FF9800";
        bgColor = "#FFF3E0";
      }
    }

    return (
      <Chip
        label={label}
        size="small"
        sx={{
          backgroundColor: bgColor,
          color: color,
          height: '24px',
          fontSize: '12px'
        }}
      />
    );
  };

  // 날짜 포맷 함수
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()-2000}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  // 계약 상세 페이지로 이동
  const handleContractClick = (contractId) => {
    navigate(`/contract-detail/${contractId}`);
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#F8F8FE', minHeight: '100vh' }}>
      {/* 상단 헤더 */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600,
            color: '#3A3A3A'
          }}
        >
          계약 관리
        </Typography>
      </Box>

      {/* 검색 및 필터 영역 */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        {/* 검색어 입력 */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
            검색어
          </Typography>
          <TextField
            placeholder="계약 제목"
            size="small"
            sx={{ 
              width: '100%',
              backgroundColor: 'white',
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#E0E0E0',
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#9E9E9E' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* 정렬 필터 */}
        <Box>
          <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
            정렬
          </Typography>
          <FormControl 
            size="small" 
            sx={{ 
              minWidth: 120,
              backgroundColor: 'white'
            }}
          >
            <Select
              displayEmpty
              defaultValue=""
              IconComponent={KeyboardArrowDownIcon}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#E0E0E0',
                },
              }}
            >
              <MenuItem value="">전체</MenuItem>
              <MenuItem value="latest">최신순</MenuItem>
              <MenuItem value="oldest">오래된순</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* 상태 필터 */}
        <Box>
          <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
            상태
          </Typography>
          <FormControl 
            size="small" 
            sx={{ 
              minWidth: 120,
              backgroundColor: 'white'
            }}
          >
            <Select
              displayEmpty
              defaultValue=""
              IconComponent={KeyboardArrowDownIcon}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#E0E0E0',
                },
              }}
            >
              <MenuItem value="">전체</MenuItem>
              <MenuItem value="001002_0002">계약완료</MenuItem>
              <MenuItem value="001002_0003">임시저장</MenuItem>
              <MenuItem value="001002_0004">서명진행중</MenuItem>
              <MenuItem value="001002_0001">승인대기</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* 구분 필터 */}
        <Box>
          <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
            구분
          </Typography>
          <FormControl 
            size="small" 
            sx={{ 
              minWidth: 120,
              backgroundColor: 'white'
            }}
          >
            <Select
              displayEmpty
              defaultValue=""
              IconComponent={KeyboardArrowDownIcon}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#E0E0E0',
                },
              }}
            >
              <MenuItem value="">전체</MenuItem>
              <MenuItem value="위수탁">위수탁</MenuItem>
              <MenuItem value="근로">근로</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* 기간 선택 */}
        <Box>
          <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
            기간
          </Typography>
          <Button
            variant="outlined"
            startIcon={<CalendarTodayIcon />}
            endIcon={<KeyboardArrowDownIcon />}
            sx={{
              borderColor: '#E0E0E0',
              color: '#666',
              backgroundColor: 'white',
              minWidth: 120,
              '&:hover': {
                backgroundColor: '#F8F9FA',
                borderColor: '#E0E0E0',
              },
            }}
          >
            전체
          </Button>
        </Box>
      </Box>

      {/* 계약 목록 */}
      <Box sx={{ backgroundColor: 'white', borderRadius: 2, mt: 3 }}>
        {/* 목록 헤더 */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: '1fr 150px 150px 150px 50px',
          p: 2,
          borderBottom: '1px solid #EEEEEE',
          backgroundColor: '#F8F9FA'
        }}>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>계약명</Typography>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>계약상태</Typography>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>진행률</Typography>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>작성일</Typography>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>관리</Typography>
        </Box>

        {/* 계약 목록 또는 빈 상태 메시지 */}
        {contracts.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">생성된 계약이 없습니다.</Typography>
          </Box>
        ) : (
          // 계약 목록 아이템
          contracts.map((contract) => (
            <Box 
              key={contract.id}
              sx={{ 
                display: 'grid',
                gridTemplateColumns: '1fr 150px 150px 150px 50px',
                p: 2,
                borderBottom: '1px solid #EEEEEE',
                '&:hover': { backgroundColor: '#F8F9FA' }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <DescriptionIcon sx={{ color: '#3182F6', mr: 2, mt: 0.5 }} />
                <Box 
                  onClick={() => handleContractClick(contract.id)}
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': {
                      '& .contract-title': {
                        color: '#1976d2'
                      }
                    }
                  }}
                >
                  <Typography className="contract-title">{contract.title}</Typography>
                  <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 0.5 }}>
                    {contract.participants.map(p => p.name).join(', ')}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {renderStatusChip(contract)}
              </Box>
              <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                {contract.progressRate}%
              </Typography>
              <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                {formatDate(contract.createdAt)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton size="small" onClick={(e) => handleMenuClick(e, contract.id)}>
                  <MoreVertIcon />
                </IconButton>
              </Box>
            </Box>
          ))
        )}
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>수정</MenuItem>
        <MenuItem onClick={handleMenuClose}>삭제</MenuItem>
        <MenuItem onClick={handleMenuClose}>복사</MenuItem>
      </Menu>
    </Box>
  );
};

export default ContractList;
