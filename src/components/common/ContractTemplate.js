import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  IconButton,
  Paper,
  Divider,
  Chip,
  Menu,
  MenuItem,
  Button,
  TextField,
  InputAdornment,
  Select,
  FormControl
} from '@mui/material';
import { 
  Create as CreateIcon,
  Download as DownloadIcon,
  MoreVert as MoreVertIcon,
  AttachFile as AttachFileIcon,
  Search as SearchIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  CalendarToday as CalendarTodayIcon
} from '@mui/icons-material';

const ContractTemplate = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const navigate = useNavigate();

  // 템플릿 목록 조회
  const fetchTemplates = async (keyword = '') => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8080/api/contract-pdf/templates${keyword ? `?keyword=${keyword}` : ''}`);
      if (!response.ok) throw new Error('템플릿 목록 조회 실패');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('템플릿 조회 중 오류:', error);
      alert('템플릿 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 템플릿 목록 조회
  useEffect(() => {
    fetchTemplates();
  }, []);

  // 검색어 입력 핸들러
  const handleSearch = (event) => {
    const value = event.target.value;
    setSearchKeyword(value);
    fetchTemplates(value);
  };

  // 서명하기 버튼 클릭 시
  const handleSign = (pdfId) => {
    navigate(`/pdf-viewer/${pdfId}`);  // SignaturePdfViewer로 이동
  };

  // PDF 다운로드
  const handleDownload = async (pdfId) => {
    window.open(`http://localhost:8080/api/contract-pdf/download/${pdfId}`, '_blank');
  };

  const handleMenuClick = (event, item) => {
    setAnchorEl(event.currentTarget);
    setSelectedTemplateId(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTemplateId(null);
  };

  // 템플릿 미리보기 처리
  const handleTemplatePreview = async (templateId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/contract-pdf/templates/${templateId}/preview`);
      if (!response.ok) throw new Error('템플릿 미리보기 실패');
      
      // PDF 미리보기를 새 창에서 열기
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('템플릿 미리보기 중 오류:', error);
      alert('템플릿 미리보기에 실패했습니다.');
    }
  };

  return (
    <Box sx={{ 
      p: 3,
      backgroundColor: '#F8F8FE',  // 전체 배경색 설정
      minHeight: '100vh'  // 전체 높이 확보
    }}>
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
          계약서 템플릿
        </Typography>
        <Button
          variant="contained"
          sx={{
            backgroundColor: '#1976d2',
            '&:hover': {
              backgroundColor: '#1565c0',
            },
            borderRadius: '8px',
            textTransform: 'none',
            px: 3
          }}
        >
          로그인
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
            placeholder="템플릿 이름"
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
            value={searchKeyword}
            onChange={handleSearch}
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
              <MenuItem value="사용중">사용중</MenuItem>
              <MenuItem value="미사용">미사용</MenuItem>
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

      {/* 목록 영역 */}
      <Box sx={{ backgroundColor: 'white', borderRadius: 1, border: '1px solid #EEEEEE' }}>
        {/* 목록 헤더 */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: '1fr 150px 150px 150px 50px',
          p: 2,
          borderBottom: '1px solid #EEEEEE',
          backgroundColor: '#F8F9FA'
        }}>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>제목</Typography>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>상태</Typography>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>구분</Typography>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>작성일</Typography>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>더보기</Typography>
        </Box>

        {/* 템플릿 목록 */}
        {loading ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography>로딩중...</Typography>
          </Box>
        ) : templates.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">저장된 템플릿이 없습니다.</Typography>
          </Box>
        ) : (
          templates.map((template) => (
            <Box 
              key={template.id}
              sx={{ 
                display: 'grid',
                gridTemplateColumns: '1fr 150px 150px 150px 50px',
                p: 2,
                borderBottom: '1px solid #EEEEEE',
                '&:hover': { backgroundColor: '#F8F9FA' }
              }}
            >
              {/* 제목 영역 - 클릭 가능 */}
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start',
                  cursor: 'pointer',  // 커서 스타일은 제목 영역에만 적용
                  '&:hover': { textDecoration: 'underline' }  // 호버 시 밑줄 표시
                }}
                onClick={() => handleTemplatePreview(template.id)}  // 클릭 이벤트는 제목 영역에만 적용
              >
                <AttachFileIcon sx={{ color: '#3182F6', mr: 2, mt: 0.5 }} />
                <Box>
                  <Typography>{template.templateName}</Typography>
                  <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 0.5 }}>
                    {template.description || '설명 없음'}
                  </Typography>
                </Box>
              </Box>

              {/* 나머지 영역 - 클릭 불가 */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Chip
                  label={template.isActive ? "사용중" : "미사용"}
                  size="small"
                  sx={{
                    backgroundColor: template.isActive ? '#E8F3FF' : '#F5F5F5',
                    color: template.isActive ? '#3182F6' : '#666',
                    height: '24px',
                    fontSize: '12px'
                  }}
                />
              </Box>
              <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                {template.originalPdfId.includes('위수탁') ? '위수탁 계약서' : '근로 계약서'}
              </Typography>
              <Typography 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {new Date(template.createdAt).toLocaleDateString('ko-KR', {
                  year: '2-digit',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                }).replace(/\./g, '. ').replace('시', ':').replace('분', '')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton size="small" onClick={(e) => handleMenuClick(e, template.id)}>
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

export default ContractTemplate; 