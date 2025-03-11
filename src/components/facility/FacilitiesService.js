import React from 'react';
import { 
  Box, 
  Typography, 
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  Button,
  IconButton,
} from '@mui/material';
import { 
  Search as SearchIcon,
  LocationOn as LocationOnIcon,
  MoreVert as MoreVertIcon,
  CalendarToday as CalendarTodayIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon
} from '@mui/icons-material';

const FacilitiesService = () => {
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
          A/S 관리
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

      {/* A/S 접수 현황 섹션 */}
      <Box sx={{ mb: 3, overflow: 'auto' }}>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            fontWeight: 600, 
            color: '#3A3A3A',
            mb: 2 
          }}
        >
          A/S 접수 현황
        </Typography>

        <Box sx={{ 
          backgroundColor: 'white',
          borderRadius: 2,
          border: '1px solid #EEEEEE',
          minWidth: {
            xs: '1200px', // 태블릿에서 더 넓게
            lg: '100%'    // PC는 그대로
          }
        }}>
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: '120px repeat(11, minmax(100px, 1fr))', // 태블릿에서 더 넓은 간격
              lg: '100px repeat(11, 1fr)'  // PC는 그대로
            },
            borderBottom: '1px solid #EEEEEE',
            p: 2,
            backgroundColor: '#F8F9FA'
          }}>
            <Typography variant="subtitle2" sx={{ color: '#666' }}></Typography>
            <Typography variant="subtitle2" sx={{ color: '#666' }}>리프트</Typography>
            <Typography variant="subtitle2" sx={{ color: '#666' }}>탈부착기</Typography>
            <Typography variant="subtitle2" sx={{ color: '#666' }}>밸런스기</Typography>
            <Typography variant="subtitle2" sx={{ color: '#666' }}>얼라이먼트</Typography>
            <Typography variant="subtitle2" sx={{ color: '#666' }}>타이어호텔</Typography>
            <Typography variant="subtitle2" sx={{ color: '#666' }}>에어메이트</Typography>
            <Typography variant="subtitle2" sx={{ color: '#666' }}>콤프레샤</Typography>
            <Typography variant="subtitle2" sx={{ color: '#666' }}>비드부스터</Typography>
            <Typography variant="subtitle2" sx={{ color: '#666' }}>체인리프트</Typography>
            <Typography variant="subtitle2" sx={{ color: '#666' }}>전기시설</Typography>
            <Typography variant="subtitle2" sx={{ color: '#666' }}>기타</Typography>
          </Box>
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: '120px repeat(11, minmax(100px, 1fr))', // 태블릿에서 더 넓은 간격
              lg: '100px repeat(11, 1fr)'  // PC는 그대로
            },
            p: 2
          }}>
            <Typography>수리 요청</Typography>
            <Typography>10</Typography>
            <Typography>30</Typography>
            <Typography>50</Typography>
            <Typography>24</Typography>
            <Typography>64</Typography>
            <Typography>56</Typography>
            <Typography>12</Typography>
            <Typography>45</Typography>
            <Typography>18</Typography>
            <Typography>48</Typography>
            <Typography>7</Typography>
          </Box>
        </Box>
      </Box>

      {/* 검색 필터 섹션 */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          gap: 2,
          flexWrap: 'wrap'
        }}>
          {/* 검색어 입력 */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
              시설물 검색
            </Typography>
            <TextField
              placeholder="시설물명 검색"
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
                <MenuItem value="waiting">대기</MenuItem>
                <MenuItem value="inProgress">처리중</MenuItem>
                <MenuItem value="completed">완료</MenuItem>
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

      {/* A/S 리스트 */}
      <Box sx={{ 
        backgroundColor: 'white',
        borderRadius: 1,
        border: '1px solid #EEEEEE',
        overflow: 'auto'
      }}>
        <Box sx={{ 
          minWidth: {
            xs: '900px', // 모바일, 태블릿
            lg: '100%'   // PC
          }
        }}>
          {/* 리스트 헤더 */}
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: '100px 150px 200px 100px 150px 150px 100px', // 모바일, 태블릿
              lg: '100px 1fr 1fr 1fr 150px 150px 100px'        // PC
            },
            p: 2,
            borderBottom: '1px solid #EEEEEE',
            backgroundColor: '#F8F9FA'
          }}>
            <Typography variant="subtitle2" sx={{ color: '#666' }}>관리번호</Typography>
            <Typography variant="subtitle2" sx={{ color: '#666' }}>시설물명</Typography>
            <Typography variant="subtitle2" sx={{ color: '#666', whiteSpace: 'nowrap' }}>매장명</Typography>
            <Typography variant="subtitle2" sx={{ color: '#666' }}>상태</Typography>
            <Typography variant="subtitle2" sx={{ color: '#666', whiteSpace: 'nowrap' }}>신청일</Typography>
            <Typography variant="subtitle2" sx={{ color: '#666', whiteSpace: 'nowrap' }}>등록일</Typography>
            <Typography variant="subtitle2" sx={{ color: '#666' }}>더보기</Typography>
          </Box>

          {/* 리스트 아이템 */}
          {[1, 2, 3, 4].map((item) => (
            <Box key={item} sx={{ 
              display: 'grid',
              gridTemplateColumns: {
                xs: '100px 150px 200px 100px 150px 150px 100px', // 모바일, 태블릿
                lg: '100px 1fr 1fr 1fr 150px 150px 100px'        // PC
              },
              p: 2,
              borderBottom: '1px solid #EEEEEE',
              '&:hover': {
                backgroundColor: '#F8F9FA'
              }
            }}>
              <Typography sx={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>R001</Typography>
              <Typography sx={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>리프트</Typography>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                minWidth: 0
              }}>
                <LocationOnIcon sx={{ color: '#9E9E9E', fontSize: 20, flexShrink: 0 }} />
                <Typography sx={{ 
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  타이어뱅크 (창원점)
                </Typography>
              </Box>
              <Typography sx={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>처리 대기</Typography>
              <Typography sx={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>25-01-02 09:30</Typography>
              <Typography sx={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>25-01-03 11:05</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton size="small">
                  <MoreVertIcon />
                </IconButton>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default FacilitiesService; 