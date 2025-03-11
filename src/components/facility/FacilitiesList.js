import React from 'react';
import { 
  Box, 
  Typography, 
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  IconButton,
  Grid,
  Card,
  CardContent,
  Button
} from '@mui/material';
import { 
  Search as SearchIcon,
  LocationOn as LocationOnIcon,
  MoreVert as MoreVertIcon,
  CalendarToday as CalendarTodayIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon
} from '@mui/icons-material';

const FacilitiesList = () => {
  return (
    <Box sx={{ p: 3, backgroundColor: '#F8F8FE', minHeight: '100vh' }}>
      {/* 상단 헤더 */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        mb: 3 
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#3A3A3A' }}>
          시설물 관리
        </Typography>

        {/* 통계 카드 */}
        <Box sx={{ 
          display: 'flex',
          gap: 1.5,
          backgroundColor: '#E8F3FF',
          p: 1.5,
          borderRadius: 1
        }}>
          <Box sx={{ 
            px: 2.5, 
            py: 1, 
            backgroundColor: '#E8F3FF', 
            borderRadius: 1,
            minWidth: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                fontSize: '0.75rem',
                mb: 0.5 
              }}
            >
              당월 요청
            </Typography>
            <Typography 
              color="primary" 
              sx={{ 
                fontSize: '1.125rem',
                fontWeight: 600,
                lineHeight: 1 
              }}
            >
              145
            </Typography>
          </Box>
          <Box sx={{ 
            px: 2.5, 
            py: 1, 
            backgroundColor: '#E8F3FF', 
            borderRadius: 1,
            minWidth: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                fontSize: '0.75rem',
                mb: 0.5 
              }}
            >
              당월 완료
            </Typography>
            <Typography 
              color="primary" 
              sx={{ 
                fontSize: '1.125rem',
                fontWeight: 600,
                lineHeight: 1
              }}
            >
              142
            </Typography>
          </Box>
          <Box sx={{ 
            px: 2.5, 
            py: 1, 
            backgroundColor: '#E8F3FF', 
            borderRadius: 1,
            minWidth: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                fontSize: '0.75rem',
                mb: 0.5 
              }}
            >
              전체 대기 수
            </Typography>
            <Typography 
              color="primary" 
              sx={{ 
                fontSize: '1.125rem',
                fontWeight: 600,
                lineHeight: 1
              }}
            >
              69
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* 전체 물량 섹션 */}
      <Box sx={{ mb: 3, overflow: 'auto' }}>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            fontWeight: 600, 
            color: '#3A3A3A',
            mb: 2 
          }}
        >
          전체 물량
        </Typography>

        <Box sx={{ 
          backgroundColor: 'white',
          borderRadius: 2,
          border: '1px solid #EEEEEE',
          minWidth: {
            xs: '1200px',
            lg: '100%'
          }
        }}>
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: '120px repeat(11, minmax(100px, 1fr))',
              lg: '100px repeat(11, 1fr)'
            },
            borderBottom: '1px solid #EEEEEE',
            p: 2,
            backgroundColor: '#F8F9FA'
          }}>
            <Typography variant="subtitle2" sx={{ color: '#666' }}></Typography>
            <Typography variant="subtitle2" sx={{ color: '#666', whiteSpace: 'nowrap' }}>리프트</Typography>
            <Typography variant="subtitle2" sx={{ color: '#666', whiteSpace: 'nowrap' }}>탈부착기</Typography>
            <Typography variant="subtitle2" sx={{ color: '#666', whiteSpace: 'nowrap' }}>밸런스기</Typography>
            <Typography variant="subtitle2" sx={{ color: '#666', whiteSpace: 'nowrap' }}>얼라이먼트</Typography>
            <Typography variant="subtitle2" sx={{ color: '#666', whiteSpace: 'nowrap' }}>타이어호텔</Typography>
            <Typography variant="subtitle2" sx={{ color: '#666', whiteSpace: 'nowrap' }}>에어메이트</Typography>
            <Typography variant="subtitle2" sx={{ color: '#666', whiteSpace: 'nowrap' }}>콤프레샤</Typography>
            <Typography variant="subtitle2" sx={{ color: '#666', whiteSpace: 'nowrap' }}>비드부스터</Typography>
            <Typography variant="subtitle2" sx={{ color: '#666', whiteSpace: 'nowrap' }}>체인리프트</Typography>
            <Typography variant="subtitle2" sx={{ color: '#666', whiteSpace: 'nowrap' }}>전기시설</Typography>
            <Typography variant="subtitle2" sx={{ color: '#666', whiteSpace: 'nowrap' }}>기타</Typography>
          </Box>
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: '120px repeat(11, minmax(100px, 1fr))',
              lg: '100px repeat(11, 1fr)'
            },
            p: 2
          }}>
            <Typography sx={{ whiteSpace: 'nowrap' }}>보유 계</Typography>
            <Typography>1,097</Typography>
            <Typography>869</Typography>
            <Typography>538</Typography>
            <Typography>967</Typography>
            <Typography>135</Typography>
            <Typography>645</Typography>
            <Typography>745</Typography>
            <Typography>117</Typography>
            <Typography>489</Typography>
            <Typography>233</Typography>
            <Typography>477</Typography>
          </Box>
        </Box>
      </Box>

      {/* 검색 필터 섹션 */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* 검색어 입력 */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
              매장 검색
            </Typography>
            <TextField
              placeholder="매장명 검색"
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
                <MenuItem value="active">정상</MenuItem>
                <MenuItem value="inactive">고장</MenuItem>
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
                <MenuItem value="lift">리프트</MenuItem>
                <MenuItem value="balance">밸런스</MenuItem>
                <MenuItem value="tire">타이어</MenuItem>
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
                height: '40px',
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
      </Box>

      {/* 시설물 리스트 */}
      <Box sx={{ 
        backgroundColor: 'white',
        borderRadius: 1,
        border: '1px solid #EEEEEE'
      }}>
        {/* 리스트 헤더 */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: '80px 1fr 1fr 1fr 150px 100px',
          p: 2,
          borderBottom: '1px solid #EEEEEE',
          backgroundColor: '#F8F9FA'
        }}>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>사진</Typography>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>시설물명</Typography>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>보유 계</Typography>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>매장명</Typography>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>최근 상태 변경일</Typography>
          <Typography variant="subtitle2" sx={{ color: '#666' }}>더보기</Typography>
        </Box>

        {/* 리스트 아이템 */}
        {[1, 2, 3, 4].map((item) => (
          <Box key={item} sx={{ 
            display: 'grid',
            gridTemplateColumns: '80px 1fr 1fr 1fr 150px 100px',
            p: 2,
            borderBottom: '1px solid #EEEEEE',
            '&:hover': {
              backgroundColor: '#F8F9FA'
            }
          }}>
            <Box sx={{ 
              width: 60,
              height: 60,
              backgroundColor: '#F8F9FA',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              <img 
                src="/images/no-images.png" 
                alt="시설물 이미지"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </Box>
            <Typography sx={{ display: 'flex', alignItems: 'center' }}>리프트</Typography>
            <Typography sx={{ display: 'flex', alignItems: 'center' }}>7</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOnIcon sx={{ color: '#9E9E9E', fontSize: 20 }} />
              <Typography>타이어뱅크 (창원점)</Typography>
            </Box>
            <Typography sx={{ display: 'flex', alignItems: 'center' }}>25-01-03 11:05</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton size="small">
                <MoreVertIcon />
              </IconButton>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default FacilitiesList; 