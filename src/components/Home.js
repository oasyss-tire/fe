import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Grid,
  Link,
  AppBar,
  Toolbar,
  Skeleton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Carousel from 'react-material-ui-carousel';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import NoticeDetailModal from './notice/NoticeDetailModal';
import InquiryDetailModal from './inquiry/InquiryDetailModal';
import HomeChatBot from './customer/HomeChatBot';
import ContactForm from './common/ContactForm';

const Home = () => {
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [openInquiryModal, setOpenInquiryModal] = useState(false);

  // 캐러셀 아이템
  const carouselItems = [
    {
      image: "/images/inspection.jpg",
      title: "정밀 안전 점검",
      description: "현장 점검부터 결과 확인까지 \n 신뢰할 수 있는 데이터를 제공합니다."
    },
    {
      image: "/images/inspection2.jpg",
      title: "즉각적인 결과 피드백",
      description: "점검 후 바로 안전 결과를 확인하고 \n 필요한 조치를 취하세요."
    }
    
  ];

  useEffect(() => {
    // 공지사항과 문의사항 데이터 가져오기
    Promise.all([fetchNotices(), fetchInquiries()])
      .finally(() => setLoading(false));
  }, []);

  const fetchNotices = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/notices');
      if (response.ok) {
        const data = await response.json();
        setNotices(data.slice(0, 3));
      }
    } catch (error) {
      console.error('공지사항 로딩 실패:', error);
    }
  };

  const fetchInquiries = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/inquiries');
      if (response.ok) {
        const data = await response.json();
        setInquiries(data.slice(0, 3)); // 최근 4개만
      }
    } catch (error) {
      console.error('문의사항 로딩 실패:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  };

  const handleNoticeClick = (notice) => {
    setSelectedNotice(notice);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedNotice(null);
  };

  const handleInquiryClick = (inquiry) => {
    setSelectedInquiry(inquiry);
    setOpenInquiryModal(true);
  };

  const handleCloseInquiryModal = () => {
    setOpenInquiryModal(false);
    setSelectedInquiry(null);
  };

  return (
    <Box   sx={{
      maxWidth: '430px',
      margin: '0 auto',
      minHeight: '100vh', // ✅ 여기 수정 (maxHeight → minHeight)
      background: 'linear-gradient(to bottom, #FFFFFF, #F8F9FA)',
      boxShadow: '0px 0px 20px rgba(0,0,0,0.1)',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column', // 🛠️ 내용을 세로로 정렬
    }}>
      {/* 상단 로고 영역 */}
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{ 
          background: 'linear-gradient(to bottom, white, rgba(255,255,255,0.95))',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <Toolbar sx={{ justifyContent: 'center', minHeight: '60px' }}>
          <Box
            component="img"
            src="/images/dawoo2.png"
            alt="로고"
            sx={{
              height: '50px',
              width: 'auto',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/')}
          />
        </Toolbar>
      </AppBar>

      {/* 메인 컨텐츠 영역 */}
      <Box sx={{ mt: 2 , p: 2, flex: 1 }}>
        {/* 캐러셀 영역 */}
        {loading ? (
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
        ) : (
          <Carousel
            animation="slide"
            indicators={true}
            navButtonsAlwaysVisible={false}
            interval={5000}
            sx={{ 
              mb: 4, 
              borderRadius: 2, 
              overflow: 'hidden',
              boxShadow: '0px 4px 20px rgba(0,0,0,0.1)',
              '& .MuiPaper-root': {
                height: '240px',  // 조금 더 높게
              },
              '& .MuiButton-root': {
                opacity: 0,
                transition: 'opacity 0.3s',
              },
              '&:hover .MuiButton-root': {
                opacity: 1
              }
            }}
          >
            {carouselItems.map((item, index) => (
              <Paper
                key={index}
                sx={{
                  height: '200px',
                  position: 'relative',
                  backgroundImage: `url(${item.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  whiteSpace: 'pre-line',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.7))',
                    zIndex: 1
                  }
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    p: 2,
                    zIndex: 2,
                    color: 'white'
                  }}
                >
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 'bold',
                      color: '#FFFFFF',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                    }}
                  >
                    {item.title}
                  </Typography>
                  <Typography 
                    variant="body2"
                    sx={{ 
                      mt: 0.5,
                      textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                    }}
                  >
                    {item.description}
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Carousel>
        )}

        {/* 게시판 영역 */}
        <Grid container spacing={2.5}>
          {/* 문의사항 */}
          <Grid item xs={6}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2.5,
                height: '320px',  // 높이 살짝 늘림
                border: '1px solid #eee',
                borderRadius: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.08)'
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ 
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'text.primary'
                }}>
                  문의사항
                </Typography>
                <Link 
                  onClick={() => navigate('/inquiries')}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    color: 'text.secondary',
                    fontSize: '0.775rem',
                    '&:hover': { 
                      color: 'primary.main'
                    }
                  }}
                >
                  더보기 <ArrowForwardIosIcon sx={{ fontSize: '0.775rem', ml: 0.5 }} />
                </Link>
              </Box>
              <List sx={{ p: 0 }}>
                {inquiries.map((inquiry, index) => (
                  <React.Fragment key={inquiry.inquiryId}>
                    <ListItem 
                      sx={{ 
                        px: 1.5,
                        py: 1,
                        transition: 'all 0.2s ease',
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'rgba(0,0,0,0.03)',
                          transform: 'translateX(4px)'
                        }
                      }}
                      onClick={() => handleInquiryClick(inquiry)}
                    >
                      <ListItemText 
                        primary={inquiry.inquiryTitle}
                        secondary={formatDate(inquiry.createdAt)}
                        primaryTypographyProps={{
                          sx: {
                            fontSize: '0.875rem',
                            color: 'text.primary',
                            fontWeight: 500,
                            noWrap: true
                          }
                        }}
                        secondaryTypographyProps={{
                          sx: {
                            fontSize: '0.75rem',
                            color: 'text.secondary',
                            mt: 0.5
                          }
                        }}
                      />
                    </ListItem>
                    {index < inquiries.length - 1 && 
                      <Divider sx={{ my: 1, opacity: 0.6 }} />
                    }
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* 공지사항 */}
          <Grid item xs={6}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2.5,
                height: '320px',
                border: '1px solid #eee',
                borderRadius: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.08)'
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ 
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'text.primary'
                }}>
                  공지사항
                </Typography>
                <Link 
                  onClick={() => navigate('/notices')}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    color: 'text.secondary',
                    fontSize: '0.775rem',
                    '&:hover': { 
                      color: 'primary.main'
                    }
                  }}
                >
                  더보기 <ArrowForwardIosIcon sx={{ fontSize: '0.775rem', ml: 0.5 }} />
                </Link>
              </Box>
              <List sx={{ p: 0 }}>
                {notices.map((notice, index) => (
                  <React.Fragment key={notice.noticeId}>
                    <ListItem 
                      sx={{ 
                        px: 1.5,
                        py: 1,
                        transition: 'all 0.2s ease',
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'rgba(0,0,0,0.03)',
                          transform: 'translateX(4px)'
                        }
                      }}
                      onClick={() => handleNoticeClick(notice)}
                    >
                      <ListItemText 
                        primary={notice.title}
                        secondary={formatDate(notice.createdAt)}
                        primaryTypographyProps={{
                          sx: {
                            fontSize: '0.875rem',
                            color: 'text.primary',
                            fontWeight: 500,
                            noWrap: true
                          }
                        }}
                        secondaryTypographyProps={{
                          sx: {
                            fontSize: '0.75rem',
                            color: 'text.secondary',
                            mt: 0.5
                          }
                        }}
                      />
                    </ListItem>
                    {index < notices.length - 1 && 
                      <Divider sx={{ my: 1, opacity: 0.6 }} />
                    }
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Box>


      {/* 회사 정보 (하단 고정 X, 페이지 최하단에만 위치) */}
      <Box
      sx={{
        backgroundColor: '#fff',
        py: 3,
        px: 2,
        textAlign: 'center',
        borderTop: '1px solid #ddd',
        mt: 4,
      }}
    >
      {/* 회사 로고 */}
      <Box
        component="img"
        src="/images/dawoo.png"
        alt="회사 로고"
        sx={{
          height: 40,
          display: 'block',
          margin: '0 auto',
        }}
      />
      
      {/* 회사 정보 */}
      <Typography
        variant="body2"
        sx={{ fontWeight: 'bold', color: '#333', fontSize: '0.75rem' , mt: 0.5}}
      >
        (주) 다우
      </Typography>
      <Typography variant="body2" sx={{ color: '#666', fontSize: '0.7rem', mt: 0.5 }}>
      대전광역시 서구 계룡로 553번안길 63
      </Typography>
      <Typography variant="body2" sx={{ color: '#666', fontSize: '0.7rem', mt: 0.5 }}>
      TEL: 042) 526-4805 | FAX: 042) 526-4806
      </Typography>


      {/* 사용문의 문구와 링크 */}
      <Typography variant="body2" sx={{ color: '#666', fontSize: '0.75rem', mt: 1 }}>
        사용문의{' '}
        <Link
          href="http://www.keyless.kr"
          underline="hover"
          sx={{ fontWeight: 'bold', color: '#666' }}
          target="_blank"
          rel="noopener"
        >
          www.keyless.kr
        </Link>
      </Typography>
    </Box>

      {/* 챗봇 추가 */}
      {/* <HomeChatBot /> */}

    {/* 모달 */}
      <InquiryDetailModal 
        open={openInquiryModal}
        inquiry={selectedInquiry}
        onClose={handleCloseInquiryModal}
      />

      <NoticeDetailModal 
        open={openModal}
        notice={selectedNotice}
        onClose={handleCloseModal}
      />

      {/* 문의하기 컴포넌트 추가 */}
      <ContactForm />
    </Box>
  );
};

export default Home; 