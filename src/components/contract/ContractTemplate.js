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
import DateRangeCalendar, { DateRangeButton } from '../calendar/Calendar';
import { format, isWithinInterval, parseISO, endOfDay, startOfDay } from 'date-fns';

const ContractTemplate = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [sortType, setSortType] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // 날짜 필터 상태 추가
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [dateDialogOpen, setDateDialogOpen] = useState(false);
  const [dateFilterActive, setDateFilterActive] = useState(false);
  
  const navigate = useNavigate();

  // 템플릿 목록 조회
  const fetchTemplates = async (keyword = '', sort = '', status = '', startDate = null, endDate = null) => {
    try {
      setLoading(true);
      // 쿼리 파라미터 구성
      const params = new URLSearchParams();
      if (keyword) params.append('keyword', keyword);
      if (sort) params.append('sort', sort);
      if (status) params.append('status', status);
      if (startDate) params.append('startDate', format(new Date(startDate), 'yyyy-MM-dd'));
      if (endDate) params.append('endDate', format(new Date(endDate), 'yyyy-MM-dd'));
      
      // API 호출
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await fetch(`http://localhost:8080/api/contract-pdf/templates${queryString}`);
      
      if (!response.ok) throw new Error('템플릿 목록 조회 실패');
      const data = await response.json();
      
      // 데이터 처리 - 정렬 및 필터링
      let processedData = [...data];
      
      // 백엔드에서 정렬하지 않을 경우 프론트에서 정렬 처리
      if (sort === 'latest') {
        processedData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (sort === 'oldest') {
        processedData.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      }
      
      // 백엔드에서 필터링하지 않을 경우 프론트에서 필터링 처리
      if (status === '사용중') {
        processedData = processedData.filter(template => template.isActive);
      } else if (status === '미사용') {
        processedData = processedData.filter(template => !template.isActive);
      }
      
      // 날짜 필터링 적용
      if (dateFilterActive && startDate && endDate) {
        try {
          const startDayStart = startOfDay(new Date(startDate));
          const endDayEnd = endOfDay(new Date(endDate));
          
          processedData = processedData.filter(template => {
            // 날짜가 없으면 필터링에서 제외
            if (!template.createdAt) return false;
            
            try {
              const templateDate = parseISO(template.createdAt);
              return isWithinInterval(templateDate, { start: startDayStart, end: endDayEnd });
            } catch (error) {
              console.error('템플릿 날짜 파싱 오류:', error, template.createdAt);
              return false;
            }
          });
        } catch (error) {
          console.error('날짜 필터링 적용 중 오류:', error);
        }
      }
      
      setTemplates(processedData);
    } catch (error) {
      console.error('템플릿 조회 중 오류:', error);
      alert('템플릿 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 템플릿 목록 조회
  useEffect(() => {
    fetchTemplates(searchKeyword, sortType, statusFilter, dateFilterActive ? startDate : null, dateFilterActive ? endDate : null);
  }, [searchKeyword, sortType, statusFilter, dateFilterActive, startDate, endDate]);

  // 검색어 입력 핸들러
  const handleSearch = (event) => {
    const value = event.target.value;
    setSearchKeyword(value);
  };

  // 정렬 타입 변경 핸들러
  const handleSortChange = (event) => {
    const value = event.target.value;
    setSortType(value);
  };

  // 상태 필터 변경 핸들러
  const handleStatusChange = (event) => {
    const value = event.target.value;
    setStatusFilter(value);
  };
  
  // 날짜 다이얼로그 열기
  const handleOpenDateDialog = () => {
    setDateDialogOpen(true);
  };
  
  // 날짜 다이얼로그 닫기
  const handleCloseDateDialog = () => {
    setDateDialogOpen(false);
  };
  
  // 날짜 변경 핸들러
  const handleDateChange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
  };
  
  // 날짜 필터 적용
  const handleApplyDateFilter = () => {
    if (startDate && endDate) {
      setDateFilterActive(true);
      handleCloseDateDialog();
    }
  };
  
  // 날짜 필터 초기화
  const handleResetDateFilter = () => {
    setStartDate(null);
    setEndDate(null);
    setDateFilterActive(false);
    handleCloseDateDialog();
  };
  
  // 날짜 범위 텍스트 구성
  const getDateRangeText = () => {
    if (!dateFilterActive) return '전체';
    
    if (!startDate || !endDate) return '전체';
    
    try {
      const startFormatted = format(new Date(startDate), 'yy-MM-dd');
      const endFormatted = format(new Date(endDate), 'yy-MM-dd');
      return `${startFormatted} ~ ${endFormatted}`;
    } catch (error) {
      console.error('날짜 형식 오류:', error);
      return '전체';
    }
  };

  // 서명하기 버튼 클릭 시
  const handleSign = (pdfId) => {
    navigate(`/pdf-viewer/${pdfId}`);  // SignaturePdfViewer로 이동
  };

  // PDF 다운로드
  const handleDownload = async (pdfId) => {
    window.open(`http://localhost:8080/api/contract-pdf/download/${pdfId}`, '_blank');
  };

  const handleMenuClick = (event, templateId) => {
    setAnchorEl(event.currentTarget);
    setSelectedTemplateId(templateId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTemplateId(null);
  };
  
  // 템플릿 수정 처리
  const handleEditTemplate = () => {
    if (selectedTemplateId) {
      // 템플릿 수정 페이지로 이동
      navigate(`/edit-template/${selectedTemplateId}`);
    }
    handleMenuClose();
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
              value={sortType}
              onChange={handleSortChange}
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
              value={statusFilter}
              onChange={handleStatusChange}
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

        {/* 기간 선택 */}
        <Box>
          <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
            기간
          </Typography>
          <DateRangeButton
            startDate={startDate}
            endDate={endDate}
            isActive={dateFilterActive}
            onClick={handleOpenDateDialog}
            getDateRangeText={getDateRangeText}
            buttonProps={{
              startIcon: <CalendarTodayIcon />,
              endIcon: <KeyboardArrowDownIcon />
            }}
          />
        </Box>
        
        {/* 날짜 범위 선택 캘린더 다이얼로그 */}
        <DateRangeCalendar
          startDate={startDate}
          endDate={endDate}
          onDateChange={handleDateChange}
          open={dateDialogOpen}
          onClose={handleCloseDateDialog}
          onApply={handleApplyDateFilter}
          onReset={handleResetDateFilter}
        />
      </Box>

      {/* 목록 영역 */}
      <Box sx={{ backgroundColor: 'white', borderRadius: 1, border: '1px solid #EEEEEE' }}>
        {/* 목록 헤더 */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: '1fr 150px 150px 50px',
          p: 2,
          borderBottom: '1px solid #EEEEEE',
          backgroundColor: '#F8F9FA'
        }}>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>제목</Typography>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>상태</Typography>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>작성일</Typography>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>더보기</Typography>
        </Box>

        {/* 검색 결과 요약 */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          p: 2, 
          borderBottom: '1px solid #EEEEEE' 
        }}>
          <Typography variant="body2" sx={{ color: '#666' }}>
            전체 {templates.length}건 조회됨
          </Typography>
          {(searchKeyword || statusFilter || dateFilterActive) && (
            <Typography variant="body2" sx={{ color: '#1976d2' }}>
              {searchKeyword && `검색어: "${searchKeyword}" `}
              {statusFilter && `상태: ${statusFilter} `}
              {dateFilterActive && `기간: ${getDateRangeText()}`}
            </Typography>
          )}
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
                gridTemplateColumns: '1fr 150px 150px 50px',
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
        <MenuItem onClick={handleEditTemplate}>수정</MenuItem>
      </Menu>
    </Box>
  );
};

export default ContractTemplate; 