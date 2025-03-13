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
  Chip
} from '@mui/material';
import { 
  Search as SearchIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  CalendarToday as CalendarTodayIcon,
  MoreVert as MoreVertIcon,
  Business as BusinessIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const CompanyList = () => {
  const [companies, setCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const navigate = useNavigate();

  // 하드코딩된 업체 데이터
  const hardcodedCompanies = [
    {
      companyId: 1,
      companyName: '타이어뱅크 (본점)',
      address: '세종시 한누리대로 350 뱅크빌딩',
      phoneNumber: '1599-7181',
      email: 'tirebank_main@tirebank.com',
      status: 'ACTIVE'
    },
    {
      companyId: 2,
      companyName: '타이어뱅크 (창원점)',
      address: '경남 창원시 의창구 의창대로 29',
      phoneNumber: '0507-1300-3458',
      email: 'tirebank_cw@tirebank.com',
      status: 'ACTIVE'
    },
    {
      companyId: 3,
      companyName: '타이어뱅크 (약대점)',
      address: '경기 부천시 오정구 신흥로 353 내동58-3',
      phoneNumber: '0507-1452-3016',
      email: 'tirebank_yd@tirebank.com',
      status: 'ACTIVE'
    },
    {
      companyId: 4,
      companyName: '타이어뱅크 (서광주점)',
      address: '광주 광산구 하남대로 127-2',
      phoneNumber: '0507-1335-7337',
      email: 'tirebank_sgj@tirebank.com',
      status: 'ACTIVE'
    }
  ];

  // fetchCompanies 함수 수정
  const fetchCompanies = async () => {
    // API 호출 대신 하드코딩된 데이터 사용
    setCompanies(hardcodedCompanies);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleMenuClick = (event, companyId) => {
    setAnchorEl(event.currentTarget);
    setSelectedCompanyId(companyId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCompanyId(null);
  };

  const handleCompanyClick = (companyId) => {
    navigate(`/companies/${companyId}`);
  };

  // 업체 추가 제출 핸들러
  const handleSubmit = async (companyData) => {
    try {
      const response = await fetch('http://localhost:8080/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(companyData),
      });

      if (!response.ok) throw new Error('업체 등록 실패');

      // 성공 시 목록 새로고침
      await fetchCompanies();
      setDialogOpen(false);
    } catch (error) {
      console.error('업체 등록 중 오류:', error);
      alert('업체 등록에 실패했습니다.');
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#F8F8FE', minHeight: '100vh' }}>
      {/* 상단 헤더 */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#3A3A3A' }}>
          업체 관리
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
          sx={{
            backgroundColor: '#1976d2',
            '&:hover': {
              backgroundColor: '#1565c0',
            },
            borderRadius: '8px',
            textTransform: 'none'
          }}
        >
          업체 추가
        </Button>
      </Box>

      {/* 검색 및 필터 영역 */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        {/* 검색어 입력 */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
            검색어
          </Typography>
          <TextField
            placeholder="업체명, 주소, 연락처 검색"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
          <FormControl size="small" sx={{ minWidth: 120, backgroundColor: 'white' }}>
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
              <MenuItem value="">최신순</MenuItem>
              <MenuItem value="name">업체명순</MenuItem>
              <MenuItem value="address">주소순</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* 상태 필터 */}
        <Box>
          <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
            상태
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120, backgroundColor: 'white' }}>
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
              <MenuItem value="ACTIVE">사용</MenuItem>
              <MenuItem value="INACTIVE">해지</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* 등록일 필터 */}
        <Box>
          <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
            등록일
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

      {/* 업체 목록 */}
      <Box sx={{ backgroundColor: 'white', borderRadius: 2, mt: 3 }}>
        {/* 목록 헤더 */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: '1.5fr 2fr 1fr 1.5fr 100px 50px',
          p: 2,
          borderBottom: '1px solid #EEEEEE',
          backgroundColor: '#F8F9FA'
        }}>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>업체명</Typography>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>주소</Typography>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>연락처</Typography>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>이메일</Typography>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>상태</Typography>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>관리</Typography>
        </Box>

        {/* 업체 목록 아이템 */}
        {companies.map((company) => (
          <Box 
            key={company.companyId}
            sx={{ 
              display: 'grid',
              gridTemplateColumns: '1.5fr 2fr 1fr 1.5fr 100px 50px',
              p: 2,
              borderBottom: '1px solid #EEEEEE',
              '&:hover': { backgroundColor: '#F8F9FA' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <BusinessIcon sx={{ color: '#3182F6', mr: 2, mt: 0.5 }} />
              <Box 
                onClick={() => handleCompanyClick(company.companyId)}
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': {
                    '& .company-name': {
                      color: '#1976d2'
                    }
                  }
                }}
              >
                <Typography className="company-name">{company.companyName}</Typography>
              </Box>
            </Box>
            <Typography sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {company.address || '-'}
            </Typography>
            <Typography>{company.phoneNumber || '-'}</Typography>
            <Typography sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {company.email || '-'}
            </Typography>
            <Box>
              <Chip
                label={company.status === 'ACTIVE' ? '사용' : '해지'}
                size="small"
                sx={{
                  backgroundColor: company.status === 'ACTIVE' ? '#E8F3FF' : '#F5F5F5',
                  color: company.status === 'ACTIVE' ? '#3182F6' : '#666',
                  height: '24px',
                  fontSize: '12px'
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton size="small" onClick={(e) => handleMenuClick(e, company.companyId)}>
                <MoreVertIcon />
              </IconButton>
            </Box>
          </Box>
        ))}
      </Box>

    </Box>
  );
};

export default CompanyList; 